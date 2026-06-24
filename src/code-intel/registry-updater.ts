import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

type ModelsMeta = {
  lastCheckedAt: string;
  cdnUrl: string;
  models?: Record<string, Record<string, string>>;
};

const DEFAULT_CDN_URL = 'https://cdn.iwish.dev/models-meta.json';
const STALENESS_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

function getCachePath(projectRoot: string): string {
  return path.join(projectRoot, '.iwish', 'cache', 'models-meta.json');
}

function loadExistingCache(cachePath: string): ModelsMeta | null {
  if (!fs.existsSync(cachePath)) {
    return null;
  }
  try {
    return fs.readJsonSync(cachePath) as ModelsMeta;
  } catch {
    return null;
  }
}

function isCacheStale(cache: ModelsMeta | null): boolean {
  if (!cache || !cache.lastCheckedAt) {
    return true;
  }
  const lastChecked = new Date(cache.lastCheckedAt).getTime();
  const now = Date.now();
  return now - lastChecked > STALENESS_THRESHOLD_MS;
}

async function fetchRemoteRegistry(cdnUrl: string): Promise<ModelsMeta | null> {
  try {
    const response = await fetch(cdnUrl);
    if (!response.ok) {
      console.warn(chalk.yellow(`[registry-updater] CDN returned ${response.status}: ${response.statusText}`));
      return null;
    }
    const data = (await response.json()) as ModelsMeta;
    if (!data || typeof data !== 'object') {
      console.warn(chalk.yellow('[registry-updater] CDN returned malformed JSON'));
      return null;
    }
    return data;
  } catch (err: unknown) {
    // Suppress network errors (like ENOTFOUND for cdn.iwish.dev) by default to avoid alarming the user during install
    if (process.env.DEBUG) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(chalk.yellow(`[registry-updater] CDN fetch failed: ${message}`));
    }
    return null;
  }
}

async function atomicWriteJson(filePath: string, data: unknown): Promise<void> {
  const tmpPath = `${filePath}.tmp`;
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeJson(tmpPath, data, { spaces: 2 });
  await fs.rename(tmpPath, filePath);
}

export async function checkForRegistryUpdates(projectRoot: string): Promise<boolean> {
  const cachePath = getCachePath(projectRoot);
  const existingCache = loadExistingCache(cachePath);

  if (!isCacheStale(existingCache)) {
    return false;
  }

  const cdnUrl = existingCache?.cdnUrl || DEFAULT_CDN_URL;
  const remoteData = await fetchRemoteRegistry(cdnUrl);

  if (!remoteData) {
    // Network failure or malformed JSON — keep existing cache intact
    return false;
  }

  const updatedCache: ModelsMeta = {
    ...remoteData,
    lastCheckedAt: new Date().toISOString(),
    cdnUrl,
  };

  await atomicWriteJson(cachePath, updatedCache);
  return true;
}
