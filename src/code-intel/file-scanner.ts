import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';

export type ScanResult = {
  added: string[];
  modified: string[];
  deleted: string[];
  renamed: Array<{ from: string; to: string }>;
  unchanged: string[];
  totalFiles: number;
};

export type FileBatch = {
  files: string[];
  batchIndex: number;
  totalBatches: number;
};

const MAX_ANALYSIS_SIZE = 100 * 1024; // 100KB
const DEFAULT_BATCH_SIZE = 10;

const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'svg', 'webp',
  'woff', 'woff2', 'ttf', 'eot', 'otf',
  'zip', 'tar', 'gz', 'bz2', 'rar', '7z',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'exe', 'dll', 'so', 'dylib', 'bin',
  'mp3', 'mp4', 'avi', 'mov', 'wav', 'flac',
  'sqlite', 'db',
]);

const DEFAULT_IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  '.turbo',
  '__pycache__',
  '.DS_Store',
  '*.lock',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
];

function getHashCachePath(projectRoot: string): string {
  return path.join(projectRoot, '.iwish', 'cache', 'file-hashes.json');
}

function loadHashCache(projectRoot: string): Record<string, string> {
  const cachePath = getHashCachePath(projectRoot);
  if (!fs.existsSync(cachePath)) {
    return {};
  }
  try {
    return fs.readJsonSync(cachePath) as Record<string, string>;
  } catch {
    return {};
  }
}

async function saveHashCache(projectRoot: string, cache: Record<string, string>): Promise<void> {
  const cachePath = getHashCachePath(projectRoot);
  await fs.ensureDir(path.dirname(cachePath));
  await fs.writeJson(cachePath, cache, { spaces: 2 });
}

export async function limitConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  const executing = new Set<Promise<void>>();

  for (const item of items) {
    const p = Promise.resolve()
      .then(() => fn(item))
      .then((res) => {
        results.push(res);
      });
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);
  return results;
}

async function computeSha256Async(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function loadIgnorePatterns(projectRoot: string): string[] {
  const patterns = [...DEFAULT_IGNORE_PATTERNS];
  const iwishIgnorePath = path.join(projectRoot, '.iwishignore');
  const gitIgnorePath = path.join(projectRoot, '.gitignore');

  for (const ignorePath of [gitIgnorePath, iwishIgnorePath]) {
    if (fs.existsSync(ignorePath)) {
      const lines = fs.readFileSync(ignorePath, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          patterns.push(trimmed);
        }
      }
    }
  }

  return patterns;
}

function shouldIgnore(relativePath: string, ignorePatterns: string[]): boolean {
  const segments = relativePath.split(path.sep);
  for (const pattern of ignorePatterns) {
    const cleanPattern = pattern.replace(/\/$/, '');
    // Directory match
    if (segments.some((segment) => segment === cleanPattern)) {
      return true;
    }
    // Glob extension match (e.g. *.lock)
    if (cleanPattern.startsWith('*.')) {
      const ext = cleanPattern.slice(1); // '.lock'
      if (relativePath.endsWith(ext)) {
        return true;
      }
    }
    // Exact file match
    if (segments[segments.length - 1] === cleanPattern) {
      return true;
    }
  }
  return false;
}

function isBinaryFile(filePath: string): boolean {
  const ext = path.extname(filePath).replace('.', '').toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

async function enumerateFilesAsync(projectRoot: string, ignorePatterns: string[]): Promise<string[]> {
  const files: string[] = [];
  const visit = async (directory: string) => {
    let entries: fs.Dirent[];
    try {
      entries = (await fs.readdir(directory, { withFileTypes: true })) as fs.Dirent[];
    } catch {
      return;
    }
    const promises = entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      const relativePath = path.relative(projectRoot, fullPath);
      if (shouldIgnore(relativePath, ignorePatterns)) {
        return;
      }
      if (entry.isDirectory()) {
        await visit(fullPath);
      } else if (entry.isFile()) {
        files.push(relativePath);
      }
    });
    await Promise.all(promises);
  };
  await visit(projectRoot);
  return files;
}

export async function scanFiles(projectRoot: string): Promise<ScanResult> {
  const ignorePatterns = loadIgnorePatterns(projectRoot);
  const currentFiles = await enumerateFilesAsync(projectRoot, ignorePatterns);
  const previousHashes = loadHashCache(projectRoot);
  const currentHashes: Record<string, string> = {};

  const added: string[] = [];
  const modified: string[] = [];
  const unchanged: string[] = [];

  // Compute hashes and scan for modifications asynchronously with pool limit 50
  await limitConcurrency(currentFiles, 50, async (relativePath) => {
    const fullPath = path.join(projectRoot, relativePath);
    try {
      const hash = await computeSha256Async(fullPath);
      currentHashes[relativePath] = hash;

      if (!previousHashes[relativePath]) {
        added.push(relativePath);
      } else if (previousHashes[relativePath] !== hash) {
        modified.push(relativePath);
      } else {
        unchanged.push(relativePath);
      }
    } catch {
      // Skip files we cannot read
    }
  });

  const currentSet = new Set(currentFiles);
  const deletedFiles = Object.keys(previousHashes).filter((filePath) => !currentSet.has(filePath));

  // Detect renames: match deleted file hash to added file hash
  const renamed: Array<{ from: string; to: string }> = [];
  const resolvedAdded = new Set<string>();
  const resolvedDeleted = new Set<string>();

  for (const deletedPath of deletedFiles) {
    const deletedHash = previousHashes[deletedPath];
    for (const addedPath of added) {
      if (resolvedAdded.has(addedPath)) {
        continue;
      }
      if (currentHashes[addedPath] === deletedHash) {
        renamed.push({ from: deletedPath, to: addedPath });
        resolvedAdded.add(addedPath);
        resolvedDeleted.add(deletedPath);
        break;
      }
    }
  }

  const finalAdded = added.filter((filePath) => !resolvedAdded.has(filePath));
  const finalDeleted = deletedFiles.filter((filePath) => !resolvedDeleted.has(filePath));

  await saveHashCache(projectRoot, currentHashes);

  return {
    added: finalAdded,
    modified,
    deleted: finalDeleted,
    renamed,
    unchanged,
    totalFiles: currentFiles.length,
  };
}


export function createBatches(files: string[], batchSize: number = DEFAULT_BATCH_SIZE): FileBatch[] {
  // Sort by file size ascending, skip binary and oversized files from analysis batches
  const fileWithSizes: Array<{ path: string; size: number }> = [];

  for (const filePath of files) {
    if (isBinaryFile(filePath)) {
      continue;
    }
    try {
      const stat = fs.statSync(filePath);
      if (stat.size <= MAX_ANALYSIS_SIZE) {
        fileWithSizes.push({ path: filePath, size: stat.size });
      }
    } catch {
      // Ignore files that cannot be stat-ed
    }
  }

  fileWithSizes.sort((a, b) => a.size - b.size);
  const analysisFiles = fileWithSizes.map((item) => item.path);


  const batches: FileBatch[] = [];
  const totalBatches = Math.max(1, Math.ceil(analysisFiles.length / batchSize));

  for (let i = 0; i < analysisFiles.length; i += batchSize) {
    batches.push({
      files: analysisFiles.slice(i, i + batchSize),
      batchIndex: batches.length,
      totalBatches,
    });
  }

  return batches;
}
