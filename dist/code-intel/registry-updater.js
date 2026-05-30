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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForRegistryUpdates = checkForRegistryUpdates;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const DEFAULT_CDN_URL = 'https://cdn.iwish.dev/models-meta.json';
const STALENESS_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
function getCachePath(projectRoot) {
    return path.join(projectRoot, '.iwish', 'cache', 'models-meta.json');
}
function loadExistingCache(cachePath) {
    if (!fs.existsSync(cachePath)) {
        return null;
    }
    try {
        return fs.readJsonSync(cachePath);
    }
    catch {
        return null;
    }
}
function isCacheStale(cache) {
    if (!cache || !cache.lastCheckedAt) {
        return true;
    }
    const lastChecked = new Date(cache.lastCheckedAt).getTime();
    const now = Date.now();
    return now - lastChecked > STALENESS_THRESHOLD_MS;
}
async function fetchRemoteRegistry(cdnUrl) {
    try {
        const response = await fetch(cdnUrl);
        if (!response.ok) {
            console.warn(chalk_1.default.yellow(`[registry-updater] CDN returned ${response.status}: ${response.statusText}`));
            return null;
        }
        const data = (await response.json());
        if (!data || typeof data !== 'object') {
            console.warn(chalk_1.default.yellow('[registry-updater] CDN returned malformed JSON'));
            return null;
        }
        return data;
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(chalk_1.default.yellow(`[registry-updater] CDN fetch failed: ${message}`));
        return null;
    }
}
async function atomicWriteJson(filePath, data) {
    const tmpPath = `${filePath}.tmp`;
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(tmpPath, data, { spaces: 2 });
    await fs.rename(tmpPath, filePath);
}
async function checkForRegistryUpdates(projectRoot) {
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
    const updatedCache = {
        ...remoteData,
        lastCheckedAt: new Date().toISOString(),
        cdnUrl,
    };
    await atomicWriteJson(cachePath, updatedCache);
    return true;
}
