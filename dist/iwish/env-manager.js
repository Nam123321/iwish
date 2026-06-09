"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class EnvManager {
    envPath;
    envVars = {};
    constructor(projectRoot) {
        this.envPath = path.join(projectRoot, '.env');
        this.load();
    }
    load() {
        if (!fs.existsSync(this.envPath)) {
            return;
        }
        const content = fs.readFileSync(this.envPath, 'utf8');
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            // Ignore comments and empty lines
            if (!trimmed || trimmed.startsWith('#'))
                continue;
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
    get(key) {
        return this.envVars[key];
    }
    set(key, value) {
        this.envVars[key] = value;
    }
    has(key) {
        return !!this.envVars[key];
    }
    save() {
        if (!fs.existsSync(this.envPath)) {
            // Create new .env
            const lines = Object.entries(this.envVars).map(([k, v]) => `${k}="${v}"`);
            fs.writeFileSync(this.envPath, lines.join('\n') + '\n', 'utf8');
            return;
        }
        // Safely update existing .env preserving comments and layout
        let content = fs.readFileSync(this.envPath, 'utf8');
        const writtenKeys = new Set();
        const newLines = content.split('\n').map(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#'))
                return line;
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
exports.EnvManager = EnvManager;
