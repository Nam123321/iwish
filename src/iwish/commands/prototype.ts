import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
// @ts-expect-error JSDOM types are not installed in the devDependencies or implicitly typed
import { JSDOM } from 'jsdom';

function normalizeHex(hex: string): string {
  let clean = hex.replace('#', '').trim().toLowerCase();
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  return '#' + clean;
}

function extractHexColors(content: string): string[] {
  const hexRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
  const matches = content.match(hexRegex) || [];
  return matches.map(normalizeHex);
}

export interface Portal {
  name: string;
  code: string;
  summary: string;
  slug: string;
  screens: ScreenNode[];
}

export interface ScreenNode {
  title: string;
  description: string;
  id: string;
  category: string;
}

interface DesignTokens {
  colors: {
    primaryGreen: string;
    secondaryGreen: string;
    backgroundDark: string;
    textLight: string;
    grayBorder: string;
  };
  typography: {
    family: string;
    headingWeight: string;
    bodyWeight: string;
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getFileChecksum(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    return 'not-found';
  }
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function parseFeatureHierarchy(content: string): Portal[] {
  const lines = content.split('\n');
  const portals: Portal[] = [];
  
  let currentPortal: Portal | null = null;
  let currentCategory = 'General';
  let mode: 'none' | 'overview' | 'navigation' = 'none';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (trimmed.startsWith('## ')) {
      const heading = trimmed.substring(3).toLowerCase();
      if (heading.includes('portal overview')) {
        mode = 'overview';
      } else if (heading.includes('navigation') || heading.includes('menu tree') || heading.includes('sidebar') || heading.includes('menu')) {
        mode = 'navigation';
      } else {
        mode = 'none';
      }
      continue;
    }
    
    if (mode === 'overview') {
      if (trimmed.startsWith('|')) {
        if (trimmed.includes('---|') || trimmed.toLowerCase().includes('portal / module') || trimmed.toLowerCase().includes('primary users')) {
          continue;
        }
        const parts = trimmed.split('|').map(p => p.trim()).filter(Boolean);
        const isSeparator = parts.every(part => /^[:-]+$/.test(part));
        if (isSeparator) {
          continue;
        }
        if (parts.length >= 2) {
          let name = '';
          let code = '';
          let summary = '';
          
          if (/^\d+$/.test(parts[0]) || parts[0] === '#') {
            name = parts[1].replace(/\*\*/g, '').trim();
            const cleanName = name.split('(')[0].trim();
            const words = cleanName.split(/\s+/).filter(Boolean);
            code = words.length >= 2 ? words.map(w => w[0].toUpperCase()).join('') : cleanName.substring(0, 3).toUpperCase();
            summary = parts[2] ? parts[2].trim() : '';
          } else {
            name = parts[0].replace(/\*\*/g, '').trim();
            code = parts[1].replace(/`/g, '').trim();
            summary = parts[2] ? parts[2].trim() : '';
          }
          
          const coreName = name.split('(')[0].trim();
          const slug = slugify(coreName);
          
          if (coreName && code) {
            portals.push({
              name: coreName,
              code,
              summary,
              slug,
              screens: []
            });
          }
        }
      }
    } else if (mode === 'navigation') {
      if (trimmed.startsWith('### ')) {
        const headingText = trimmed.substring(4).trim();
        const matchedPortal = portals.find(p => 
          headingText.toLowerCase().includes(p.name.toLowerCase()) || 
          headingText.toLowerCase().includes(p.code.toLowerCase())
        );
        if (matchedPortal) {
          currentPortal = matchedPortal;
          currentCategory = 'General';
        } else {
          currentPortal = null;
        }
        continue;
      }
      
      if (currentPortal) {
        if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
          const indentMatch = line.match(/^(\s*)/);
          const indent = indentMatch ? indentMatch[1].length : 0;
          const text = trimmed.substring(1).trim();
          
          if (indent < 4) {
            currentCategory = text.replace(/\*\*/g, '').trim();
          } else {
            let title = text;
            let description = '';
            const colonIdx = text.indexOf(':');
            if (colonIdx !== -1) {
              title = text.substring(0, colonIdx).trim();
              description = text.substring(colonIdx + 1).trim();
            }
            title = title.replace(/`/g, '').trim();
            
            const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `item-${currentPortal.screens.length}`;
            const screenId = `screen-${currentPortal.code.toLowerCase()}-${sanitizedTitle}`;
            currentPortal.screens.push({
              title,
              description,
              id: screenId,
              category: currentCategory
            });
          }
        } else if (trimmed.includes('├──') || trimmed.includes('└──')) {
          const connector = trimmed.includes('├──') ? '├──' : '└──';
          const indent = line.indexOf(connector);
          const rawText = trimmed.substring(trimmed.indexOf(connector) + connector.length).trim();
          
          let title = rawText;
          let description = '';
          const parts = rawText.split(/\s{2,}/);
          if (parts.length >= 2) {
            title = parts[0];
            description = parts.slice(1).join(' - ');
          }
          
          if (indent < 4) {
            currentCategory = title;
          } else {
            const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `item-${currentPortal.screens.length}`;
            const screenId = `screen-${currentPortal.code.toLowerCase()}-${sanitizedTitle}`;
            currentPortal.screens.push({
              title,
              description,
              id: screenId,
              category: currentCategory
            });
          }
        }
      }
    }
  }
  
  return portals;
}

export function parseDesignTokens(content: string): DesignTokens {
  const tokens: DesignTokens = {
    colors: {
      primaryGreen: '#00DF9A',
      secondaryGreen: '#059669',
      backgroundDark: '#0F172A',
      textLight: '#F8FAFC',
      grayBorder: '#334155',
    },
    typography: {
      family: 'Outfit, sans-serif',
      headingWeight: '700',
      bodyWeight: '400',
    }
  };

  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.includes('Primary Green:')) {
      const match = trimmed.match(/#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/);
      if (match) tokens.colors.primaryGreen = match[0];
    } else if (trimmed.includes('Secondary Green:')) {
      const match = trimmed.match(/#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/);
      if (match) tokens.colors.secondaryGreen = match[0];
    } else if (trimmed.includes('Background Dark:')) {
      const match = trimmed.match(/#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/);
      if (match) tokens.colors.backgroundDark = match[0];
    } else if (trimmed.includes('Text Light:')) {
      const match = trimmed.match(/#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/);
      if (match) tokens.colors.textLight = match[0];
    } else if (trimmed.includes('Gray Border:')) {
      const match = trimmed.match(/#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/);
      if (match) tokens.colors.grayBorder = match[0];
    } else if (trimmed.includes('Family:')) {
      const match = trimmed.match(/`([^`]+)`/) || trimmed.match(/'([^']+)'/) || trimmed.match(/"([^"]+)"/);
      if (match) tokens.typography.family = match[1];
    } else if (trimmed.includes('Heading Weight:')) {
      const match = trimmed.match(/`([^`]+)`/) || trimmed.match(/(\d+)/);
      if (match) tokens.typography.headingWeight = match[1];
    } else if (trimmed.includes('Body Weight:')) {
      const match = trimmed.match(/`([^`]+)`/) || trimmed.match(/(\d+)/);
      if (match) tokens.typography.bodyWeight = match[1];
    }
  }

  return tokens;
}

function generateMockUI(screen: ScreenNode): string {
  const escapedTitle = escapeHtml(screen.title);
  if (screen.title.startsWith('/') || screen.title.includes('Console') || screen.title.includes('CLI')) {
    // Terminal Mockup
    return `
      <div class="bg-black/50 border border-slate-700/80 rounded-lg p-6 font-mono text-sm text-slate-300 shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-8 bg-slate-800/60 border-b border-slate-700/80 flex items-center px-4 space-x-2">
          <div class="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div class="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div class="w-3 h-3 rounded-full bg-green-500/80"></div>
          <span class="text-xs text-slate-400 pl-4 font-sans select-none">Interactive CLI Terminal - reference-only</span>
        </div>
        <div class="pt-8 space-y-4">
          <p class="text-slate-500">$ iwish ${escapedTitle.toLowerCase()} --verbose</p>
          <div class="border-l-2 border-[var(--color-primary)] pl-3 py-1 bg-[var(--color-primary)]/5 rounded">
            <span class="text-[var(--color-primary)] font-bold">INFO</span> Initializing multi-agent routing engine...<br/>
            <span class="text-[var(--color-primary)] font-bold">INFO</span> Mode parsed: Antigravity-MAO mode active.<br/>
            <span class="text-[var(--color-primary)] font-bold">INFO</span> Loaded 3 active portals from hierarchy.
          </div>
          <p class="text-slate-400">Executing flow steps for epic context...</p>
          <div class="p-3 bg-slate-900/60 rounded border border-slate-800">
            <span class="text-emerald-400 font-bold">✓ Success:</span> Command completed execution. Check output files in <code>_iwish-output/</code>.
          </div>
          <div class="flex items-center space-x-2 pt-2">
            <span class="text-[var(--color-primary)] font-bold">$</span>
            <input type="text" placeholder="Type custom arguments to test layout..." class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-[var(--color-primary)] w-80 fallback-input" oninput="document.getElementById('cli-output-demo').innerText = this.value"/>
          </div>
          <p class="text-xs text-slate-500">Live Input Mirror: <span id="cli-output-demo" class="text-yellow-400"></span></p>
        </div>
      </div>
    `;
  } else if (screen.title.includes('Kanban') || screen.title.includes('Board')) {
    // Kanban Board Mockup
    return `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <!-- Todo Column -->
        <div class="bg-slate-900/40 border border-slate-800 rounded-lg p-4 fallback-card">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
            <h4 class="font-bold text-slate-300">TO DO</h4>
            <span class="bg-slate-800 text-xs px-2 py-0.5 rounded text-slate-400 font-bold">2</span>
          </div>
          <div class="space-y-3">
            <div class="bg-slate-800/40 border border-slate-700/50 p-3 rounded shadow-sm hover:border-slate-600 transition cursor-pointer">
              <span class="text-xs font-bold text-emerald-400">[EPIC-17]</span>
              <p class="text-sm mt-1 text-slate-200">Story 17.2: Build interactive tabs in dashboard</p>
              <div class="mt-3 flex justify-between items-center text-xs text-slate-500">
                <span>Priority: P2</span>
                <span class="bg-slate-700/80 px-1.5 py-0.5 rounded text-slate-300">PM</span>
              </div>
            </div>
            <div class="bg-slate-800/40 border border-slate-700/50 p-3 rounded shadow-sm hover:border-slate-600 transition cursor-pointer">
              <span class="text-xs font-bold text-emerald-400">[EPIC-17]</span>
              <p class="text-sm mt-1 text-slate-200">Story 17.3: Integrate prototype link status</p>
              <div class="mt-3 flex justify-between items-center text-xs text-slate-500">
                <span>Priority: P3</span>
                <span class="bg-slate-700/80 px-1.5 py-0.5 rounded text-slate-300">QA</span>
              </div>
            </div>
          </div>
        </div>

        <!-- In Progress Column -->
        <div class="bg-slate-900/40 border border-slate-800 rounded-lg p-4 fallback-card">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
            <h4 class="font-bold text-slate-300">IN PROGRESS</h4>
            <span class="bg-slate-800 text-xs px-2 py-0.5 rounded text-slate-400 font-bold">1</span>
          </div>
          <div class="space-y-3">
            <div class="bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/30 p-3 rounded shadow-sm">
              <span class="text-xs font-bold text-[var(--color-primary)]">[EPIC-17]</span>
              <p class="text-sm mt-1 text-slate-200">Story 17.1: Build Interactive HTML Prototyping Gate</p>
              <div class="mt-3 flex justify-between items-center text-xs text-slate-400">
                <span>Priority: P1</span>
                <span class="bg-[var(--color-primary)]/20 px-1.5 py-0.5 rounded text-[var(--color-primary)] font-bold">DEV</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Done Column -->
        <div class="bg-slate-900/40 border border-slate-800 rounded-lg p-4 fallback-card">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
            <h4 class="font-bold text-slate-300">DONE</h4>
            <span class="bg-slate-800 text-xs px-2 py-0.5 rounded text-slate-400 font-bold">3</span>
          </div>
          <div class="space-y-3">
            <div class="bg-slate-800/20 border border-slate-800/80 p-3 rounded opacity-60">
              <span class="text-xs font-bold text-slate-500">[EPIC-16]</span>
              <p class="text-sm mt-1 text-slate-400">Story 16.5: Verify Edge Case validation rules</p>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (screen.title.includes('Graph') || screen.title.includes('Visualization')) {
    // Graph Visualization Mockup
    return `
      <div class="bg-slate-950/60 border border-slate-800/80 rounded-lg p-6 shadow-inner relative overflow-hidden flex flex-col justify-between min-h-[350px]">
        <div class="absolute inset-0 flex items-center justify-center opacity-10">
          <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" stroke-width="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div class="z-10 flex flex-wrap justify-center items-center gap-12 py-8">
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-full bg-[var(--color-bg)] border-2 border-[var(--color-primary)] flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20 animate-pulse">
              <span class="text-xs font-bold text-[var(--color-primary)]">CLI</span>
            </div>
            <span class="text-xs text-slate-400 mt-2 font-mono">Console Command</span>
          </div>

          <div class="h-0.5 w-16 bg-gradient-to-r from-[var(--color-primary)] to-emerald-500 relative">
            <div class="absolute -top-1 right-0 w-2 h-2 rounded-full bg-emerald-400"></div>
          </div>

          <div class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-full bg-[var(--color-bg)] border-2 border-emerald-500 flex items-center justify-center shadow-lg">
              <span class="text-xs font-bold text-emerald-400">DSB</span>
            </div>
            <span class="text-xs text-slate-400 mt-2 font-mono">Dashboard View</span>
          </div>

          <div class="h-0.5 w-16 bg-gradient-to-r from-emerald-500 to-indigo-500 relative">
            <div class="absolute -top-1 right-0 w-2 h-2 rounded-full bg-indigo-400"></div>
          </div>

          <div class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-full bg-[var(--color-bg)] border-2 border-indigo-500 flex items-center justify-center shadow-lg">
              <span class="text-xs font-bold text-indigo-400">ORC</span>
            </div>
            <span class="text-xs text-slate-400 mt-2 font-mono">Orchestrator</span>
          </div>
        </div>

        <div class="z-10 p-3 bg-slate-900/80 rounded border border-slate-800 text-xs text-slate-400 flex justify-between items-center">
          <span>Simulation Mode: Active. Graph represents live dependency mapping from hierarchy.</span>
          <button class="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-slate-950 font-bold px-3 py-1 rounded transition text-xs fallback-btn" onclick="alert('Simulated dynamic layout refresh.')">Refresh Nodes</button>
        </div>
      </div>
    `;
  } else {
    // Default interactive form mockup
    return `
      <div class="bg-slate-900/30 border border-slate-800 rounded-lg p-6 fallback-card">
        <h4 class="text-lg font-bold text-slate-200 mb-4">Screen Action Simulator</h4>
        <div class="space-y-4 max-w-lg">
          <div>
            <label class="block text-xs text-slate-400 font-bold mb-2">Simulate Text Value</label>
            <input type="text" id="demo-text-val" placeholder="Type something to test layout responsiveness..." class="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-[var(--color-primary)] fallback-input" oninput="document.getElementById('demo-val-mirror').innerText = this.value"/>
          </div>
          <div>
            <label class="block text-xs text-slate-400 font-bold mb-2">Toggle Status Mode</label>
            <select class="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-[var(--color-primary)]" onchange="document.getElementById('demo-status-pill').innerText = this.value">
              <option value="ACTIVE">Active (Green)</option>
              <option value="PENDING">Pending (Yellow)</option>
              <option value="DISABLED">Disabled (Red)</option>
            </select>
          </div>
          <div class="pt-4 flex items-center justify-between border-t border-slate-800">
            <span class="text-xs text-slate-500">Value Mirror: <strong id="demo-val-mirror" class="text-slate-300">None</strong></span>
            <span id="demo-status-pill" class="bg-[var(--color-secondary)]/20 border border-[var(--color-secondary)]/50 text-[var(--color-primary)] text-xs font-bold px-2 py-0.5 rounded">ACTIVE</span>
          </div>
          <div class="pt-2">
            <button class="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-slate-950 font-bold px-4 py-2 rounded transition text-sm fallback-btn" onclick="alert('Simulation successful!')">Simulate Submit</button>
          </div>
        </div>
      </div>
    `;
  }
}

export function generatePortalHtml(
  portal: Portal,
  allPortals: Portal[],
  tokens: DesignTokens,
  checksumData: Record<string, string>
): string {
  const portalTabsHtml = allPortals.map(p => {
    const isActive = p.slug === portal.slug;
    const activeClass = isActive ? 'active bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-slate-400 hover:text-slate-200';
    return `<a href="./prototype-${p.slug}.html" class="portal-tab px-4 py-2 rounded-t-lg transition font-medium text-sm border-b-2 border-transparent ${activeClass}">${escapeHtml(p.name)}</a>`;
  }).join('\n');

  const categories: Record<string, ScreenNode[]> = {};
  for (const screen of portal.screens) {
    if (!categories[screen.category]) {
      categories[screen.category] = [];
    }
    categories[screen.category].push(screen);
  }

  let sidebarNavHtml = '';
  for (const [category, screens] of Object.entries(categories)) {
    const groupId = `group-${slugify(category)}`;
    sidebarNavHtml += `
      <div class="mb-4 category-group collapsed" id="${groupId}">
        <button 
          onclick="toggleCategory('${groupId}')"
          class="w-full flex items-between items-center text-xs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-wider mb-2 px-3 focus:outline-none"
        >
          <span>${escapeHtml(category)}</span>
          <span class="toggle-icon text-[10px] transition-transform duration-200" style="display: inline-block; margin-left: auto;">▼</span>
        </button>
        <div class="category-screens space-y-1">
    `;
    for (const screen of screens) {
      sidebarNavHtml += `
        <button 
          id="nav-${screen.id}"
          onclick="showScreen('${screen.id}')"
          class="w-full text-left px-3 py-2 rounded text-sm transition-all hover:bg-slate-800/60 hover:text-slate-200 flex items-center space-x-2 text-slate-400 fallback-sidebar-item"
        >
          <span>${escapeHtml(screen.title)}</span>
        </button>
      `;
    }
    sidebarNavHtml += `
        </div>
      </div>
    `;
  }

  let screensHtml = '';
  for (const screen of portal.screens) {
    screensHtml += `
      <div id="${screen.id}" class="screen-view space-y-6">
        <div class="border-b border-slate-800 pb-4">
          <span class="text-xs text-[var(--color-primary)] font-bold tracking-widest uppercase">${escapeHtml(screen.category)}</span>
          <h2 class="text-2xl font-bold text-slate-100 mt-1">${escapeHtml(screen.title)}</h2>
          <p class="text-slate-400 mt-2 text-sm leading-relaxed">${escapeHtml(screen.description)}</p>
        </div>
        
        ${generateMockUI(screen)}
      </div>
    `;
  }

  const defaultScreenId = portal.screens[0]?.id || '';
  const metadataJson = JSON.stringify({
    generatedAt: new Date().toISOString(),
    sourceChecksums: checksumData
  }, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>I-Wish Prototype Reference - ${escapeHtml(portal.name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Outfit', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    :root {
      --color-primary: ${tokens.colors.primaryGreen};
      --color-secondary: ${tokens.colors.secondaryGreen};
      --color-bg: ${tokens.colors.backgroundDark};
      --color-text: ${tokens.colors.textLight};
      --color-border: ${tokens.colors.grayBorder};
      --font-family: ${tokens.typography.family};
    }
    body {
      background-color: var(--color-bg) !important;
      color: var(--color-text) !important;
      font-family: var(--font-family) !important;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
    .app-container {
      display: flex;
      flex: 1;
      height: 100%;
      overflow: hidden;
    }
    .sidebar {
      width: 250px;
      background-color: var(--color-bg);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      padding: 1rem;
      overflow-y: auto;
    }
    .content-area {
      flex: 1;
      background-color: var(--color-bg);
      padding: 2rem;
      overflow-y: auto;
    }
    .fallback-btn {
      background-color: var(--color-primary);
      color: #000;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      border: none;
      font-weight: bold;
      cursor: pointer;
    }
    .fallback-btn-secondary {
      background-color: transparent;
      color: var(--color-text);
      border: 1px solid var(--color-border);
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
    }
    .fallback-card {
      background-color: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }
    .fallback-input {
      background-color: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      padding: 0.5rem;
      border-radius: 0.25rem;
      width: 100%;
    }
    .fallback-sidebar-item {
      padding: 0.75rem 1rem;
      margin-bottom: 0.25rem;
      border-radius: 0.375rem;
      cursor: pointer;
      border-left: 3px solid transparent;
      transition: all 0.2s;
    }
    .fallback-sidebar-item:hover {
      background-color: var(--color-border);
    }
    .fallback-sidebar-item.active {
      border-left-color: var(--color-primary);
      background-color: rgba(0, 223, 154, 0.1);
      color: var(--color-primary);
    }
    .portal-tab {
      padding: 1rem 1.5rem;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
      text-decoration: none;
      color: var(--color-text);
    }
    .portal-tab.active {
      border-bottom-color: var(--color-primary);
      color: var(--color-primary);
      font-weight: bold;
    }
    .screen-view {
      display: none;
    }
    .screen-view.active {
      display: block;
    }
    .category-screens {
      max-height: 2000px;
      opacity: 1;
      transition: max-height 0.25s ease-in-out, opacity 0.25s ease-in-out;
      overflow: hidden;
    }
    .category-group.collapsed .category-screens {
      max-height: 0 !important;
      opacity: 0 !important;
      pointer-events: none;
    }
    .category-group.collapsed .toggle-icon {
      transform: rotate(-90deg);
    }
    body.light-theme {
      --color-bg: #F8FAFC;
      --color-text: #0F172A;
      --color-border: #E2E8F0;
    }
  </style>
  <script type="application/json" id="prototype-metadata">
${metadataJson}
  </script>
</head>
<body class="bg-[#0F172A] text-[#F8FAFC]">
  <header class="bg-slate-900 border-b border-slate-800 flex justify-between items-center px-6 py-3">
    <div class="flex items-center space-x-6">
      <div class="flex items-center space-x-2">
        <span class="text-[var(--color-primary)] font-bold text-lg tracking-wider">I-Wish</span>
        <span class="text-xs text-slate-500 font-bold uppercase border border-slate-700 rounded px-1.5 py-0.5">Mockup Reference</span>
      </div>
      <nav class="flex items-center space-x-1">
        ${portalTabsHtml}
      </nav>
    </div>
    <div class="flex items-center space-x-4">
      <button 
        onclick="toggleTheme()" 
        class="bg-slate-800 border border-slate-700 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-700 transition flex items-center space-x-2 font-bold fallback-btn-secondary"
      >
        <span>🌓 Theme Toggle</span>
      </button>
    </div>
  </header>

  <div class="app-container flex flex-1 overflow-hidden">
    <aside class="sidebar w-64 bg-slate-900/60 border-r border-slate-800 p-4 overflow-y-auto">
      ${sidebarNavHtml}
    </aside>

    <main class="content-area flex-1 p-8 bg-slate-950/20 overflow-y-auto">
      ${screensHtml}
    </main>
  </div>

  <script>
    function toggleCategory(groupId) {
      const group = document.getElementById(groupId);
      if (group) {
        group.classList.toggle('collapsed');
      }
    }

    function showScreen(screenId) {
      if (!screenId) return;
      
      const views = document.querySelectorAll('.screen-view');
      views.forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
      });

      const target = document.getElementById(screenId);
      if (target) {
        target.classList.add('active');
        target.style.display = 'block';
      }

      const navButtons = document.querySelectorAll('.fallback-sidebar-item');
      navButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('bg-slate-800/80');
        btn.classList.remove('text-[var(--color-primary)]');
        btn.classList.remove('border-l-[3px]');
        btn.classList.remove('border-[var(--color-primary)]');
      });

      const activeBtn = document.getElementById('nav-' + screenId);
      if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.classList.add('bg-slate-800/80');
        activeBtn.classList.add('text-[var(--color-primary)]');
        activeBtn.classList.add('border-l-[3px]');
        activeBtn.classList.add('border-[var(--color-primary)]');

        // Automatically expand the parent category if collapsed
        const parentGroup = activeBtn.closest('.category-group');
        if (parentGroup) {
          parentGroup.classList.remove('collapsed');
        }
      }
    }

    function toggleTheme() {
      document.body.classList.toggle('light-theme');
      
      const isLight = document.body.classList.contains('light-theme');
      const mainHeader = document.querySelector('header');
      const sidebar = document.querySelector('aside');
      
      if (isLight) {
        document.body.classList.remove('bg-[#0F172A]');
        document.body.classList.remove('text-[#F8FAFC]');
        document.body.classList.add('bg-slate-50');
        document.body.classList.add('text-slate-900');
        
        mainHeader.className = 'bg-white border-b border-slate-200 flex justify-between items-center px-6 py-3';
        sidebar.className = 'sidebar w-64 bg-slate-100 border-r border-slate-200 p-4 overflow-y-auto';
      } else {
        document.body.classList.add('bg-[#0F172A]');
        document.body.classList.add('text-[#F8FAFC]');
        document.body.classList.remove('bg-slate-50');
        document.body.classList.remove('text-slate-900');
        
        mainHeader.className = 'bg-slate-900 border-b border-slate-800 flex justify-between items-center px-6 py-3';
        sidebar.className = 'sidebar w-64 bg-slate-900/60 border-r border-slate-800 p-4 overflow-y-auto';
      }
    }

    window.addEventListener('DOMContentLoaded', () => {
      showScreen('${defaultScreenId}');
    });
  </script>
</body>
</html>`;
}

function findHierarchyPath(projectRoot: string): string {
  const defaultPath = path.join(projectRoot, '_iwish-output', '2. Product Planning', '2.5. feature-hierarchy.md');
  if (fs.existsSync(defaultPath)) return defaultPath;

  const altPath = path.join(projectRoot, '_iwish-output', '2. Product Planning', '2.8. feature-hierarchy.md');
  if (fs.existsSync(altPath)) return altPath;

  const planningDir = path.join(projectRoot, '_iwish-output', '2. Product Planning');
  if (fs.existsSync(planningDir)) {
    try {
      const files = fs.readdirSync(planningDir);
      const found = files.find(f => f.endsWith('feature-hierarchy.md'));
      if (found) return path.join(planningDir, found);
    } catch (e) {}
  }
  return defaultPath;
}

function findDesignPath(projectRoot: string): string {
  const rootDesign = path.join(projectRoot, 'DESIGN.md');
  if (fs.existsSync(rootDesign)) return rootDesign;

  const cowokDesign = path.join(projectRoot, '_iwish-output', '2. Product Planning', 'design-system', 'cowokai', 'DESIGN.md');
  if (fs.existsSync(cowokDesign)) return cowokDesign;

  const planningDesign = path.join(projectRoot, '_iwish-output', '2. Product Planning', 'DESIGN.md');
  if (fs.existsSync(planningDesign)) return planningDesign;

  return rootDesign;
}

export function registerPrototypeCommands(
  program: Command,
  getProjectRoot: (directory?: string) => string,
  addSharedDirectoryOption: (command: Command) => Command
): void {
  addSharedDirectoryOption(
    program
      .command('make-prototype')
      .description('Create an interactive single-file HTML prototype or multi-portal prototypes for planning preview')
      .option('--verify', 'Validate that the generated HTML prototypes are up-to-date with source file checksums')
      .action(async (options: { directory: string; verify?: boolean }) => {
        const projectRoot = getProjectRoot(options.directory);
        const hierarchyPath = findHierarchyPath(projectRoot);
        const designPath = findDesignPath(projectRoot);
        const outputDir = path.join(projectRoot, '_iwish-output', '2. Product Planning', 'prototypes');

        if (options.verify) {
          console.log(chalk.blue('🔍 Verifying prototype checksums...'));
          if (!fs.existsSync(outputDir)) {
            console.error(chalk.red('❌ Error: Prototypes directory does not exist. Please generate prototypes first.'));
            process.exit(1);
          }

          const activeHierarchyHash = getFileChecksum(hierarchyPath);
          const activeDesignHash = getFileChecksum(designPath);

          const protoFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.html'));
          if (protoFiles.length === 0) {
            console.error(chalk.red('❌ Error: No generated prototype files found.'));
            process.exit(1);
          }

          let verifiedAll = true;
          for (const file of protoFiles) {
            const filePath = path.join(outputDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const match = content.match(/<script type="application\/json" id="prototype-metadata">([\s\S]*?)<\/script>/);
            
            if (!match) {
              console.warn(chalk.yellow(`⚠️ Warning: No metadata block found in ${file}. Marking as out of date.`));
              verifiedAll = false;
              continue;
            }

            try {
              const meta = JSON.parse(match[1].trim());
              const checksums = meta.sourceChecksums || {};
              const sourceHierarchy = checksums['feature-hierarchy.md'];
              const sourceDesign = checksums['design.md'];

              if (sourceHierarchy !== activeHierarchyHash || sourceDesign !== activeDesignHash) {
                console.error(chalk.red(`❌ Out-of-sync: ${file} (source files have changed since generation)`));
                verifiedAll = false;
              } else {
                console.log(chalk.green(`    Verified: ${file}`));
              }
            } catch (err: any) {
              console.error(chalk.red(`❌ Error parsing metadata in ${file}: ${err.message}`));
              verifiedAll = false;
            }
          }

          if (!verifiedAll) {
            console.error(chalk.red('❌ Verification failed: Some prototypes are out of date or corrupt. Please re-run make-prototype.'));
            process.exit(1);
          }

          console.log(chalk.green('✅ All prototypes successfully verified!'));
          return;
        }

        console.log(chalk.blue('Generating interactive HTML prototypes...'));

        if (!fs.existsSync(hierarchyPath)) {
          console.error(chalk.red(`❌ Error: Feature Hierarchy file not found at ${hierarchyPath}`));
          process.exit(1);
        }

        try {
          const hierarchyContent = fs.readFileSync(hierarchyPath, 'utf8');
          const designContent = fs.existsSync(designPath) ? fs.readFileSync(designPath, 'utf8') : '';
          
          const portals = parseFeatureHierarchy(hierarchyContent);
          const tokens = parseDesignTokens(designContent);

          if (portals.length === 0) {
            console.error(chalk.red('❌ Error: No portals found in feature-hierarchy.md. Please check the overview table.'));
            process.exit(1);
          }

          const checksums = {
            'feature-hierarchy.md': getFileChecksum(hierarchyPath),
            'design.md': getFileChecksum(designPath)
          };

          try {
            fs.ensureDirSync(outputDir);
          } catch (err: any) {
            console.error(chalk.red(`❌ Error creating target directory ${outputDir}: ${err.message}`));
            console.log(chalk.yellow('Writing fallback prototype skeleton to console...'));
            const fallbackHTML = `<!-- Fallback Skeleton - Target directory was read-only -->\n<div class="error">Error: Target folder ${outputDir} is read-only.</div>`;
            console.log(fallbackHTML);
            return;
          }

          const activePortalFiles = new Set<string>();

          for (const portal of portals) {
            const html = generatePortalHtml(portal, portals, tokens, checksums);
            const fileName = `prototype-${portal.slug}.html`;
            const filePath = path.join(outputDir, fileName);
            
            fs.writeFileSync(filePath, html, 'utf8');
            activePortalFiles.add(fileName);
            console.log(`Generated: ${fileName}`);
          }

          if (portals.length === 1) {
            const firstPortal = portals[0];
            const referrenceHtml = generatePortalHtml(firstPortal, portals, tokens, checksums);
            const mainRefPath = path.join(outputDir, 'prototype-referrence-only.html');
            fs.writeFileSync(mainRefPath, referrenceHtml, 'utf8');
            activePortalFiles.add('prototype-referrence-only.html');
            console.log(`Generated default landing: prototype-referrence-only.html`);
          }

          const existingFiles = fs.readdirSync(outputDir);
          for (const file of existingFiles) {
            if (file.startsWith('prototype-') && file.endsWith('.html')) {
              if (!activePortalFiles.has(file)) {
                fs.removeSync(path.join(outputDir, file));
                console.log(chalk.gray(`Purged obsolete file: ${file}`));
              }
            }
          }

          console.log(chalk.green('✅ Prototype generation completed successfully!'));
        } catch (error: any) {
          console.error(chalk.red(`❌ Critical prototype generation error: ${error.message}`));
          process.exit(1);
        }
      })
  );

  addSharedDirectoryOption(
    program
      .command('verify-prototype')
      .description('Verify structural navigation and style token parity of generated interactive HTML prototypes')
      .action(async (options: { directory: string }) => {
        const projectRoot = getProjectRoot(options.directory);
        try {
          const result = await verifyPrototypeSemanticParity(projectRoot);
          if (result.passed) {
            console.log(chalk.green('✅ Prototype parity verification PASSED!'));
            console.log(`Verified ${result.portalsCount} portal(s), ${result.screensCount} screen(s), and all design tokens.`);
          } else {
            console.error(chalk.red('❌ Prototype parity verification FAILED!'));
            for (const error of result.errors) {
              console.error(chalk.red(`  - ${error}`));
            }
            process.exit(1);
          }
        } catch (error: any) {
          console.error(chalk.red(`❌ Critical verification error: ${error.message}`));
          process.exit(1);
        }
      })
  );

  addSharedDirectoryOption(
    program
      .command('create-sim')
      .description('Analyze system layers, boundaries, and components, proposing 5 options for user evaluation')
      .option('--select <option_id>', 'Select the option directly (1-5)')
      .option('--sync', 'Perform reverse-mapping from epics-and-stories.md back to SIM validation matrix')
      .action(async (options: { directory: string; select?: string; sync?: boolean }) => {
        const projectRoot = getProjectRoot(options.directory);

        if (options.sync) {
          console.log(chalk.blue('🔄 Running Phase 2 SIM Reverse-Sync...'));
          const mapDir = path.join(projectRoot, '_iwish-output', '2. Product Planning');
          const mapPath = path.join(mapDir, '2.3.5. system-integrity-map.md');

          if (!fs.existsSync(mapPath)) {
            console.error(chalk.red(`❌ Error: System Integrity Map file not found at ${mapPath}`));
            process.exit(1);
          }

          const epicsAndStoriesPath = path.join(mapDir, '2.4. epics-and-stories.md');
          if (!fs.existsSync(epicsAndStoriesPath)) {
            console.error(chalk.red(`❌ Error: Epics & Stories file not found at ${epicsAndStoriesPath}`));
            process.exit(1);
          }

          try {
            const content = fs.readFileSync(epicsAndStoriesPath, 'utf8');
            const lines = content.split('\n');

            const epics: Array<{
              id: string;
              title: string;
              isKilled: boolean;
              isDeferred: boolean;
              stories: Array<{
                id: string;
                title: string;
                lineNumber: number;
                body: string;
              }>;
            }> = [];

            let currentEpic: typeof epics[0] | null = null;
            let currentStory: typeof epics[0]['stories'][0] | null = null;

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const lineNumber = i + 1;

              // Check Epic header
              const epicMatch = line.match(/^(?:##|###)\s+Epic\s+(\d+):\s*(.*)$/i);
              if (epicMatch) {
                const id = epicMatch[1];
                const title = epicMatch[2].trim();
                const isKilled = title.toLowerCase().includes('killed') || title.includes('⛔') || title.toLowerCase().includes('merged') || title.includes('🔄');
                const isDeferred = title.toLowerCase().includes('deferred') || title.includes('⏸️') || title.toLowerCase().includes('backlog') || title.toLowerCase().includes('phase 3') || title.toLowerCase().includes('pending') || title.includes('⏳');
                
                let existingEpic = epics.find(e => e.id === id);
                if (existingEpic) {
                  existingEpic.title = title;
                  existingEpic.isKilled = isKilled || existingEpic.isKilled;
                  existingEpic.isDeferred = isDeferred || existingEpic.isDeferred;
                  currentEpic = existingEpic;
                } else {
                  currentEpic = {
                    id,
                    title,
                    isKilled,
                    isDeferred,
                    stories: []
                  };
                  epics.push(currentEpic);
                }
                currentStory = null;
                continue;
              }

              // Check Story header
              const storyMatch = line.match(/^(?:###|####)\s+Story\s+(\d+\.\d+):\s*(.*)$/i);
              if (storyMatch) {
                const id = storyMatch[1];
                const title = storyMatch[2].trim();
                
                currentStory = {
                  id,
                  title,
                  lineNumber,
                  body: ''
                };
                
                if (currentEpic) {
                  currentEpic.stories.push(currentStory);
                }
                continue;
              }

              // Append lines to the current story's body
              if (currentStory) {
                currentStory.body += line + '\n';
              }
            }

            const epicsAndStoriesUri = 'file://' + epicsAndStoriesPath.replace(/ /g, '%20').replace(/\\/g, '/');
            const rows: string[] = [];
            let hasCoverageGap = false;

            for (const epic of epics) {
              const hasStories = epic.stories.length > 0;
              if (epic.isKilled && !hasStories) {
                rows.push(`| **Epic ${epic.id}: ${epic.title}** | - | - | - | - | ⛔ Killed / Merged |`);
                continue;
              }
              if (epic.isDeferred && !hasStories) {
                rows.push(`| **Epic ${epic.id}: ${epic.title}** | - | - | - | - | ⏸️ Deferred |`);
                continue;
              }

              const uiLinks: string[] = [];
              const apiLinks: string[] = [];
              const domainLinks: string[] = [];
              const dataLinks: string[] = [];

              for (const story of epic.stories) {
                const textToScan = (story.title + '\n' + story.body).toLowerCase();
                
                const isUI = /ui|view|component|giao diện|customizer|storefront|css|widget|card|theme|màn hình|dialog|modal|navbar|sidebar|frontend|trang|portal|panel|dashboard|front|display/i.test(textToScan);
                const isAPI = /api|endpoint|route|controller|webhook|fastify|express|routing|sso|hmac|jwt|http|request|response|cors|connect/i.test(textToScan);
                const isDomain = /engine|logic|crawler|calculator|attribution|optimizer|learning|rag|xử lý|thuật toán|service|handler|business|flow|quản lý|tính toán|rule/i.test(textToScan);
                const isData = /db|database|prisma|redis|pgvector|schema|table|lưu trữ|dữ liệu|bảng|model|entity|migration|postgres|mysql|sqlite|lưu|save/i.test(textToScan);

                const link = `[Story ${story.id}](${epicsAndStoriesUri}#L${story.lineNumber})`;

                if (isUI) uiLinks.push(link);
                if (isAPI) apiLinks.push(link);
                if (isDomain) domainLinks.push(link);
                if (isData) dataLinks.push(link);
              }

              let status = 'Aligned';
              if (epic.stories.length === 0) {
                status = '⚠️ Empty Epic';
                console.warn(chalk.yellow(`⚠️ [COVERAGE-GAP] Epic ${epic.id} (${epic.title}) has no stories mapped to any layers.`));
                hasCoverageGap = true;
              } else {
                const hasUI = uiLinks.length > 0;
                const hasAPI = apiLinks.length > 0;
                const hasDomain = domainLinks.length > 0;
                const hasData = dataLinks.length > 0;

                if (hasUI && !hasAPI && !hasDomain) {
                  status = '⚠️ FE-Only Fragment';
                  console.warn(chalk.yellow(`⚠️ [COVERAGE-GAP] Epic ${epic.id} (${epic.title}) contains UI components but lacks corresponding API Endpoints/Domain logic.`));
                  hasCoverageGap = true;
                } else if ((hasDomain || hasData) && !hasUI && !hasAPI) {
                  status = '⚠️ Orphaned Backend';
                  console.warn(chalk.yellow(`⚠️ [COVERAGE-GAP] Epic ${epic.id} (${epic.title}) contains Domain/Data engines but lacks corresponding UI components or API Endpoints.`));
                  hasCoverageGap = true;
                }
              }

              const uiCol = uiLinks.length > 0 ? uiLinks.join('<br>') : '-';
              const apiCol = apiLinks.length > 0 ? apiLinks.join('<br>') : '-';
              const domainCol = domainLinks.length > 0 ? domainLinks.join('<br>') : '-';
              const dataCol = dataLinks.length > 0 ? dataLinks.join('<br>') : '-';

              rows.push(`| **Epic ${epic.id}: ${epic.title}** | ${uiCol} | ${apiCol} | ${domainCol} | ${dataCol} | ${status} |`);
            }

            const simContent = fs.readFileSync(mapPath, 'utf8');
            const searchHeader = '## 4. Integrity Validation Matrix';
            const headerIndex = simContent.indexOf(searchHeader);

            let updatedContent = '';
            if (headerIndex === -1) {
              updatedContent = simContent + '\n\n' + `## 4. Integrity Validation Matrix
| Feature / Portal | UI Component | API Endpoint | Domain Engine | Database Entity | Status |
|---|---|---|---|---|---|
${rows.join('\n')}
`;
            } else {
              const baseContent = simContent.substring(0, headerIndex);
              const newSection = `## 4. Integrity Validation Matrix
| Feature / Portal | UI Component | API Endpoint | Domain Engine | Database Entity | Status |
|---|---|---|---|---|---|
${rows.join('\n')}
`;
              updatedContent = baseContent + newSection;
            }

            fs.writeFileSync(mapPath, updatedContent, 'utf8');
            console.log(chalk.green(`✓ System Integrity Map successfully reverse-synced at: ${mapPath}`));
            
            if (hasCoverageGap) {
              console.warn(chalk.yellow('⚠️ Reverse-Sync finished with coverage gaps. Please check the warnings above.'));
            } else {
              console.log(chalk.green('✅ Verification PASSED: All epics are properly aligned across layers!'));
            }

          } catch (err: any) {
            console.error(chalk.red(`❌ Error running SIM reverse-sync: ${err.message}`));
            process.exit(1);
          }
          return;
        }


        const prdPath = path.join(projectRoot, '_iwish-output', '2. Product Planning', '2.1. product-brief-or-prd.md');
        const altPrdPath = path.join(projectRoot, '_iwish-output', '2. Product Planning', 'prd.md');
        const finalPrdPath = fs.existsSync(prdPath) ? prdPath : (fs.existsSync(altPrdPath) ? altPrdPath : null);

        if (!finalPrdPath) {
          console.error(chalk.red('❌ Error: PRD file not found. Please run /create-prd or ensure prd.md exists in _iwish-output/2. Product Planning/'));
          process.exit(1);
        }

        // Locate auxiliary planning files
        const planningDir = path.join(projectRoot, '_iwish-output', '2. Product Planning');
        const hierarchyPath = path.join(planningDir, '2.5. feature-hierarchy.md');
        const altHierarchyPath = path.join(projectRoot, '_iwish-output', 'feature-hierarchy.md');
        const finalHierarchyPath = fs.existsSync(hierarchyPath) ? hierarchyPath : (fs.existsSync(altHierarchyPath) ? altHierarchyPath : null);

        const depPath = path.join(planningDir, '2.6. cross-feature-dependencies.md');
        const finalDepPath = fs.existsSync(depPath) ? depPath : null;

        console.log(chalk.blue('🔍 Analyzing project planning inputs...'));
        console.log(chalk.gray(`  - Reading PRD: ${path.basename(finalPrdPath)}`));
        console.log(chalk.gray(`  - Reading Feature Hierarchy: ${finalHierarchyPath ? path.basename(finalHierarchyPath) : 'Not found (using default modules)'}`));
        console.log(chalk.gray(`  - Reading Cross Dependencies: ${finalDepPath ? path.basename(finalDepPath) : 'Not found (using default bindings)'}`));

        let projectName = 'Project';
        let features: string[] = [];
        let dependencies: string[] = [];

        // Parse Project Name from PRD L1 Header
        try {
          const prdContent = fs.readFileSync(finalPrdPath, 'utf8');
          const titleMatch = prdContent.match(/^#\s+(.+)$/m);
          if (titleMatch) {
            projectName = titleMatch[1].trim();
          }
        } catch (e: any) {
          console.warn(chalk.yellow(`  [Warning] Failed to parse PRD file: ${e.message}`));
        }

        // Parse Features/Modules from Feature Hierarchy
        if (finalHierarchyPath) {
          try {
            const hierarchyContent = fs.readFileSync(finalHierarchyPath, 'utf8');
            const lines = hierarchyContent.split('\n');
            for (const line of lines) {
              const match = line.match(/^\s*[-\*]\s+([^:\r\n]+)/);
              if (match && !line.includes('type:') && !line.includes('title:') && match[1].trim()) {
                const feat = match[1].replace(/[\[\]]/g, '').trim();
                // Filter out non-features
                if (feat && feat.length > 3 && !features.includes(feat) && !feat.startsWith('http') && !feat.includes('output') && !feat.includes('note')) {
                  features.push(feat);
                }
              }
            }
          } catch (e: any) {
            console.warn(chalk.yellow(`  [Warning] Failed to parse Feature Hierarchy: ${e.message}`));
          }
        }

        // Parse Cross Dependencies
        if (finalDepPath) {
          try {
            const depContent = fs.readFileSync(finalDepPath, 'utf8');
            const lines = depContent.split('\n');
            for (const line of lines) {
              if (line.includes('->') || line.includes('depends on') || line.includes(':')) {
                const trimmed = line.trim();
                if (trimmed && trimmed.length > 5 && !trimmed.startsWith('---') && !trimmed.startsWith('#')) {
                  dependencies.push(trimmed);
                }
              }
            }
          } catch (e: any) {
            console.warn(chalk.yellow(`  [Warning] Failed to parse Cross Dependencies: ${e.message}`));
          }
        }

        // Defaults if parsing yields empty lists
        if (features.length === 0) {
          features = ['Authentication Engine', 'Core Portal Workspace', 'Report Builder Module'];
        }
        if (dependencies.length === 0) {
          dependencies = ['Core Portal -> Auth Engine (Session Validation)', 'Report Builder -> Core Portal (Data Extraction)'];
        }

        const displayFeatures = features.slice(0, 5);
        console.log(chalk.green(`✓ Successfully extracted metadata for: "${projectName}"`));
        console.log(chalk.gray(`  Features found: ${features.length} (evaluating top ${displayFeatures.length})`));
        console.log(chalk.gray(`  Dependencies detected: ${dependencies.length} connections`));
        console.log('');
        console.log(chalk.blue('Generating 5 Architectural Topology Options tailored to project context:'));
        console.log('');

        const simOptions = [
          {
            id: 1,
            name: 'DDD Clean-Layered Architecture',
            pros: 'Decoupled layers, high testability, prevents FE-only and Orphaned components.',
            cons: 'Slightly higher class/file count, complex boundary mappings.',
            details: `Layers: Presentation (UI), Orchestration (API), Domain (Core Logic), Infrastructure (Prisma DB/Redis).
  - Presentation mapping: ${displayFeatures.map(f => `${f} Views/Components`).join(', ')}.
  - Domain mapping: ${displayFeatures.map(f => `${f} Business Rules Engine`).join(', ')}.`
          },
          {
            id: 2,
            name: 'Feature-Folder (Modular) Architecture',
            pros: 'Co-locates UI, API, and logic per feature, making vertical slices extremely clear.',
            cons: 'Can lead to duplicated reusable engines if domain boundaries leak.',
            details: `Each module gets its own folder with encapsulated sub-layers.
  - Directories: ${displayFeatures.map(f => `src/modules/${f.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`).join(', ')}.`
          },
          {
            id: 3,
            name: 'Hexagonal (Ports & Adapters) Architecture',
            pros: 'Core logic is fully isolated from external DB/UI changes. Absolute tech-independence.',
            cons: 'High cognitive overhead, heavy boilerplate mapping adapters.',
            details: `Ports define logical interfaces; Adapters map to external APIs/DBs.
  - Ports: Core Service Interfaces for ${displayFeatures.map(f => `${f}`).join(', ')}.
  - Adapters: Database models, Auth provider client, Crawler queue adapters.`
          },
          {
            id: 4,
            name: 'Serverless Event-Driven Topology',
            pros: 'Highly scalable, async, decoupled using event queue channels.',
            cons: 'Harder to trace state flow, potential event loop conflicts.',
            details: `Features communicate asynchronously via Event Bus.
  - Event triggers: ${displayFeatures.map(f => `${f.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_REQUESTED`).join(', ')}.`
          },
          {
            id: 5,
            name: 'Model-First Clean Architecture (Thin Controller)',
            pros: 'Extremely fast development time, maps directly to database entities.',
            cons: 'Leaks database logic into controllers, higher risk of duplicate business logic.',
            details: `Thick Domain layer with database models directly mapping to thin frontend controllers.
  - Schemas: Database schema tables corresponding to ${displayFeatures.join(', ')}.`
          }
        ];

        simOptions.forEach(opt => {
          console.log(chalk.yellow(`Option ${opt.id}: ${opt.name}`));
          console.log(`  - Description: ${opt.details}`);
          console.log(`  - Pros: ${opt.pros}`);
          console.log(`  - Cons: ${opt.cons}`);
          console.log('');
        });

        if (options.select) {
          const selectedId = parseInt(options.select, 10);
          const chosenOpt = simOptions.find(o => o.id === selectedId);
          if (!chosenOpt) {
            console.error(chalk.red(`❌ Invalid option selection: ${options.select}. Choose a value from 1 to 5.`));
            process.exit(1);
          }

          console.log(chalk.green(`✓ Selected Option ${selectedId}: ${chosenOpt.name}`));
          const mapDir = path.join(projectRoot, '_iwish-output', '2. Product Planning');
          fs.ensureDirSync(mapDir);
          const mapPath = path.join(mapDir, '2.3.5. system-integrity-map.md');

          // Build dynamic Validation Matrix from extracted features
          let matrixLines = '';
          for (const feat of displayFeatures) {
            matrixLines += `| ${feat} | ${feat} UI | API Endpoint | ${feat} Engine | Database Entity | Aligned |\n`;
          }

          const simYaml = `---
type: I-Wish SIM Map
title: "System Integrity Map (SIM)"
description: "Approved logical layers, boundaries, and reusable platform engines."
resource: "file://${mapPath}"
tags: ["sim", "planning"]
timestamp: "${new Date().toISOString()}"
links_to: ["file://${finalPrdPath}"]
---

# System Integrity Map (SIM)

## 1. Approved Architectural Topology
Selected Option ${chosenOpt.id}: ${chosenOpt.name}

## 2. Layer Definitions & Contracts
- **Presentation Layer (UI/UX):** Outfits, Pages, and reusable visual tokens.
- **Orchestration Layer (API/Routing):** Express/Next.js routes and contract validators.
- **Domain Layer (Core Business Engines):** State machines, transaction logic, and core services.
- **Infrastructure Layer (Data & Cache):** Prisma Client database models and Redis namespaces.

## 3. Platform & Reusable Engines
- **Auth & Identity Engine:** Handles authorization and session tokens.
- **Notification Service:** Shared message dispatching queue.

## 4. Integrity Validation Matrix
| Feature / Portal | UI Component | API Endpoint | Domain Engine | Database Entity | Status |
|---|---|---|---|---|---|
${matrixLines.trim()}
`;

          fs.writeFileSync(mapPath, simYaml, 'utf8');
          console.log(chalk.green(`✓ System Integrity Map saved successfully to: ${mapPath}`));
        } else {
          console.log(chalk.cyan('Run this command with `--select <1-5>` to select and write your final SIM map.'));
        }
      })
  );
}

interface ParityResult {
  passed: boolean;
  portalsCount: number;
  screensCount: number;
  errors: string[];
}

export async function verifyPrototypeSemanticParity(projectRoot: string): Promise<ParityResult> {
  const hierarchyPath = findHierarchyPath(projectRoot);
  const designPath = findDesignPath(projectRoot);
  const outputDir = path.join(projectRoot, '_iwish-output', '2. Product Planning', 'prototypes');

  const errors: string[] = [];

  // Pre-flight file checking
  if (!fs.existsSync(hierarchyPath)) {
    errors.push(`Spec file '2.5. feature-hierarchy.md' is missing at: ${hierarchyPath}`);
    return { passed: false, portalsCount: 0, screensCount: 0, errors };
  }
  if (!fs.existsSync(designPath)) {
    errors.push(`Design system file 'DESIGN.md' is missing at: ${designPath}`);
    return { passed: false, portalsCount: 0, screensCount: 0, errors };
  }

  let portals: Portal[] = [];
  let tokens: DesignTokens;
  try {
    const hierarchyContent = fs.readFileSync(hierarchyPath, 'utf8');
    const designContent = fs.readFileSync(designPath, 'utf8');
    portals = parseFeatureHierarchy(hierarchyContent);
    tokens = parseDesignTokens(designContent);
  } catch (err: any) {
    errors.push(`Error parsing specifications: ${err.message}`);
    return { passed: false, portalsCount: 0, screensCount: 0, errors };
  }

  if (portals.length === 0) {
    errors.push('No portals found in feature-hierarchy.md.');
    return { passed: false, portalsCount: 0, screensCount: 0, errors };
  }

  // Pre-flight check on directory
  if (!fs.existsSync(outputDir)) {
    errors.push(`Prototypes directory is missing at: ${outputDir}`);
    return { passed: false, portalsCount: 0, screensCount: 0, errors };
  }

  let totalScreensCount = 0;
  
  // Whitelisted allowed colors
  const whitelistedColors = new Set<string>([
    '#ffffff', '#000000',
    '#fff', '#000',
    '#e2e8f0', '#0f172a', '#f8fafc', // Default template colors
    'transparent'
  ]);
  
  // Add design.md tokens to whitelist
  if (tokens.colors.primaryGreen) whitelistedColors.add(normalizeHex(tokens.colors.primaryGreen));
  if (tokens.colors.secondaryGreen) whitelistedColors.add(normalizeHex(tokens.colors.secondaryGreen));
  if (tokens.colors.backgroundDark) whitelistedColors.add(normalizeHex(tokens.colors.backgroundDark));
  if (tokens.colors.textLight) whitelistedColors.add(normalizeHex(tokens.colors.textLight));
  if (tokens.colors.grayBorder) whitelistedColors.add(normalizeHex(tokens.colors.grayBorder));

  for (const portal of portals) {
    const fileName = `prototype-${portal.slug}.html`;
    const filePath = path.join(outputDir, fileName);

    if (!fs.existsSync(filePath)) {
      errors.push(`Prototype file '${fileName}' is missing.`);
      continue;
    }

    const stats = fs.statSync(filePath);
    if (stats.size < 100) {
      errors.push(`Prototype file '${fileName}' is empty or corrupt (file size: ${stats.size} bytes).`);
      continue;
    }

    let fileContent: string;
    try {
      fileContent = fs.readFileSync(filePath, 'utf8');
    } catch (err: any) {
      errors.push(`Error reading prototype file '${fileName}': ${err.message}`);
      continue;
    }

    // Parse JSDOM
    let dom: JSDOM;
    try {
      dom = new JSDOM(fileContent, { runScripts: "outside-only" });
    } catch (err: any) {
      errors.push(`DOM Parsing error in '${fileName}': ${err.message}`);
      continue;
    }

    const document = dom.window.document;

    // AC 1: Path/Screen Coverage Check
    for (const screen of portal.screens) {
      totalScreensCount++;
      const element = document.getElementById(screen.id);
      if (!element) {
        errors.push(`Screen '${screen.title}' (ID: ${screen.id}) has no corresponding DOM element in '${fileName}'.`);
      }
    }

    // AC 2: Style Token Match Check
    const hexColors = extractHexColors(fileContent);
    
    // Parse Safelist Comments
    const safelist = new Set<string>();
    const commentMatches = fileContent.match(/<!--\s*iwish-safelist:\s*(.*?)\s*-->/g) || [];
    for (const comment of commentMatches) {
      const match = comment.match(/<!--\s*iwish-safelist:\s*(.*?)\s*-->/);
      if (match && match[1]) {
        match[1].split(/[,\s]+/).map(s => s.trim()).filter(Boolean).forEach(s => {
          if (s.startsWith('#')) {
            safelist.add(normalizeHex(s));
          } else {
            safelist.add(s.toLowerCase());
          }
        });
      }
    }

    for (const color of hexColors) {
      if (!whitelistedColors.has(color) && !safelist.has(color)) {
        errors.push(`Unauthorized design token usage in '${fileName}': Color '${color}' is not in DESIGN.md whitelist or safelist.`);
      }
    }

    // AC 3: Cross-Portal Link Check
    const anchors = Array.from(document.querySelectorAll('a')) as any[];
    for (const otherPortal of portals) {
      const expectedHref = `./prototype-${otherPortal.slug}.html`;
      const hasLink = anchors.some(a => a.getAttribute('href') === expectedHref);
      if (!hasLink) {
        errors.push(`Cross-portal link to 'prototype-${otherPortal.slug}.html' is missing in '${fileName}'.`);
      }
    }
  }

  // Ensure default landing prototype-referrence-only.html is present only when portals.length === 1
  const refPath = path.join(outputDir, 'prototype-referrence-only.html');
  if (portals.length === 1) {
    if (!fs.existsSync(refPath)) {
      errors.push("Default landing file 'prototype-referrence-only.html' is missing.");
    } else {
      const stats = fs.statSync(refPath);
      if (stats.size < 100) {
        errors.push(`Default landing file 'prototype-referrence-only.html' is empty or corrupt (file size: ${stats.size} bytes).`);
      }
    }
  } else {
    if (fs.existsSync(refPath)) {
      errors.push("Default landing file 'prototype-referrence-only.html' should not exist for multi-portal projects.");
    }
  }

  return {
    passed: errors.length === 0,
    portalsCount: portals.length,
    screensCount: totalScreensCount,
    errors
  };
}
