import * as fs from 'fs';
import * as path from 'path';

export class EnvManager {
  private envPath: string;
  private envVars: Record<string, string> = {};

  constructor(projectRoot: string) {
    this.envPath = path.join(projectRoot, '.env');
    this.load();
  }

  private load(): void {
    if (!fs.existsSync(this.envPath)) {
      return;
    }

    const content = fs.readFileSync(this.envPath, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      // Ignore comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue;

      const splitIndex = trimmed.indexOf('=');
      if (splitIndex > 0) {
        const key = trimmed.substring(0, splitIndex).trim();
        let value = trimmed.substring(splitIndex + 1).trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        
        this.envVars[key] = value;
      }
    }
  }

  public get(key: string): string | undefined {
    return this.envVars[key];
  }

  public set(key: string, value: string): void {
    this.envVars[key] = value;
  }

  public has(key: string): boolean {
    return !!this.envVars[key];
  }

  public save(): void {
    if (!fs.existsSync(this.envPath)) {
      // Create new .env
      const lines = Object.entries(this.envVars).map(([k, v]) => `${k}="${v}"`);
      fs.writeFileSync(this.envPath, lines.join('\n') + '\n', 'utf8');
      return;
    }

    // Safely update existing .env preserving comments and layout
    let content = fs.readFileSync(this.envPath, 'utf8');
    const writtenKeys = new Set<string>();

    const newLines = content.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;

      const splitIndex = trimmed.indexOf('=');
      if (splitIndex > 0) {
        const key = trimmed.substring(0, splitIndex).trim();
        if (this.envVars[key] !== undefined) {
          writtenKeys.add(key);
          return `${key}="${this.envVars[key]}"`;
        }
      }
      return line;
    });

    // Append new keys
    for (const [key, value] of Object.entries(this.envVars)) {
      if (!writtenKeys.has(key)) {
        newLines.push(`${key}="${value}"`);
      }
    }

    fs.writeFileSync(this.envPath, newLines.join('\n'), 'utf8');
  }
}
