import * as path from 'path';
import { pathToFileURL } from 'url';
import YAML from 'yaml';

export interface OKFMetadata {
  type?: string;
  title: string;
  description?: string;
  resource?: string;
  tags?: string[];
  timestamp?: string;
  links_to?: string[];
}

/**
 * Formats a local file path into a file:// URI. If it's already a URL, it leaves it unchanged.
 */
export function formatOKFUri(filePath: string, projectRoot: string = process.cwd()): string {
  if (!filePath) return '';
  
  // Check if already a URI
  if (/^(file:\/\/|https?:\/\/)/.test(filePath)) {
    return filePath;
  }

  // Resolve to absolute path
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(projectRoot, filePath);

  try {
    return pathToFileURL(absolutePath).toString();
  } catch (error) {
    // Fallback if URL conversion fails
    return `file://${absolutePath.replace(/\\/g, '/')}`;
  }
}

/**
 * Generates a standard OKF YAML frontmatter block.
 */
export function generateOKFHeader(metadata: OKFMetadata, projectRoot: string = process.cwd()): string {
  const type = metadata.type || 'I-Wish Concept';
  const title = metadata.title || '';
  const description = metadata.description || '';
  const tags = Array.isArray(metadata.tags) ? metadata.tags : [];
  const timestamp = metadata.timestamp || new Date().toISOString();
  
  let resource = '';
  if (metadata.resource) {
    resource = formatOKFUri(metadata.resource, projectRoot);
  }

  const links_to = Array.isArray(metadata.links_to)
    ? metadata.links_to.map((link) => formatOKFUri(link, projectRoot))
    : [];

  const yamlObj: Record<string, any> = {
    type,
    title,
    description,
    resource,
    tags,
    timestamp,
    links_to,
  };

  // Clean up empty optional fields
  if (!yamlObj.description) delete yamlObj.description;
  if (!yamlObj.resource) delete yamlObj.resource;

  return `---\n${YAML.stringify(yamlObj)}---`;
}
