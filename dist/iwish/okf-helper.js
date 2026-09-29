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
exports.formatOKFUri = formatOKFUri;
exports.generateOKFHeader = generateOKFHeader;
const path = __importStar(require("path"));
const url_1 = require("url");
const yaml_1 = __importDefault(require("yaml"));
/**
 * Formats a local file path into a file:// URI. If it's already a URL, it leaves it unchanged.
 */
function formatOKFUri(filePath, projectRoot = process.cwd()) {
    if (!filePath)
        return '';
    // Check if already a URI
    if (/^(file:\/\/|https?:\/\/)/.test(filePath)) {
        return filePath;
    }
    // Resolve to absolute path
    const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(projectRoot, filePath);
    try {
        return (0, url_1.pathToFileURL)(absolutePath).toString();
    }
    catch (error) {
        // Fallback if URL conversion fails
        return `file://${absolutePath.replace(/\\/g, '/')}`;
    }
}
/**
 * Generates a standard OKF YAML frontmatter block.
 */
function generateOKFHeader(metadata, projectRoot = process.cwd()) {
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
    const yamlObj = {
        type,
        title,
        description,
        resource,
        tags,
        timestamp,
        links_to,
    };
    // Clean up empty optional fields
    if (!yamlObj.description)
        delete yamlObj.description;
    if (!yamlObj.resource)
        delete yamlObj.resource;
    return `---\n${yaml_1.default.stringify(yamlObj)}---`;
}
