"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs-extra");
var path = require("path");
var SRC_DIR = path.join(__dirname, '../../');
var DEST_DIR = path.join(__dirname, '../templates');
var NAME_MAP = [
    { old: 'bmad-master', new: 'Grand-Priest' },
    { old: 'pm', new: 'King-Kai' },
    { old: 'analyst', new: 'Bulma' },
    { old: 'architect', new: 'Piccolo' },
    { old: 'dev', new: 'Vegeta' },
    { old: 'qa', new: 'Tien-Shinhan' },
    { old: 'sm', new: 'Trunks' },
    { old: 'tech-writer', new: 'Master-Roshi' },
    { old: 'ux-designer', new: 'Android-18' },
    { old: 'data-architect', new: 'Shenron' },
    { old: 'creative-intelligence', new: 'Gotenks' },
    { old: 'edge-case-guardian', new: 'Hit' },
    { old: 'mkt-content-creator', new: 'Hercule' },
    { old: 'mkt-ops-executor', new: 'Majin-Buu' }
];
var PACKS = {
    'songoku': 'library/ai-pack',
    'songoku-ai-review': 'library/ai-pack',
    'songoku-ai-spec': 'library/ai-pack',
    'songoku-cost-audit': 'library/ai-pack',
    'songoku-eval': 'library/ai-pack',
    'ai-cost-optimizer': 'library/ai-pack',
    'mkt-execute': 'library/marketing-pack',
    'mkt-sync': 'library/marketing-pack',
    'stitch-first-dev': 'library/frontend-pack',
    'stitch-to-code': 'library/frontend-pack',
    'browser-visual-verification': 'library/frontend-pack',
    'ui-ux-pro-max': 'library/frontend-pack',
    'page-agent-qa': 'library/frontend-pack',
    'validate-schema': 'library/backend-pack',
    'seed-data-audit': 'library/backend-pack',
    'data-integrity-guardian': 'library/backend-pack',
    'api-contract-guardian': 'library/backend-pack',
    'optimize-docker': 'library/devops-pack',
    'optimize-all-docker': 'library/devops-pack',
    'docker-optimizer-slim': 'library/devops-pack',
    'prompt-engineering-guardian': 'library/prompt-engineering-pack'
};
function processContent(content) {
    var newContent = content;
    for (var _i = 0, NAME_MAP_1 = NAME_MAP; _i < NAME_MAP_1.length; _i++) {
        var _a = NAME_MAP_1[_i], old = _a.old, replacement = _a.new;
        var regex = new RegExp("\\b".concat(old, "\\b"), 'gi');
        newContent = newContent.replace(regex, replacement);
    }
    return newContent;
}
function scanAndCopy(relPath) {
    return __awaiter(this, void 0, void 0, function () {
        var fullPath, files, _i, files_1, file, srcFile, nameWithoutExt, targetFolder, targetName, _a, _b, _c, key, pack, _d, NAME_MAP_2, _e, old, replacement, subType, destPath, content, processed;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    fullPath = path.join(SRC_DIR, relPath);
                    if (!fs.existsSync(fullPath))
                        return [2 /*return*/];
                    return [4 /*yield*/, fs.readdir(fullPath, { withFileTypes: true })];
                case 1:
                    files = _f.sent();
                    _i = 0, files_1 = files;
                    _f.label = 2;
                case 2:
                    if (!(_i < files_1.length)) return [3 /*break*/, 9];
                    file = files_1[_i];
                    srcFile = path.join(fullPath, file.name);
                    if (!(file.isDirectory() && file.name !== '.DS_Store')) return [3 /*break*/, 4];
                    return [4 /*yield*/, scanAndCopy(path.join(relPath, file.name))];
                case 3:
                    _f.sent();
                    return [3 /*break*/, 8];
                case 4:
                    if (!(file.isFile() && (file.name.endsWith('.md') || file.name.endsWith('.xml') || file.name.endsWith('.yaml')))) return [3 /*break*/, 8];
                    nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                    targetFolder = 'core';
                    targetName = file.name;
                    // Check if it belongs to a library pack
                    for (_a = 0, _b = Object.entries(PACKS); _a < _b.length; _a++) {
                        _c = _b[_a], key = _c[0], pack = _c[1];
                        if (nameWithoutExt.includes(key) || relPath.includes(key)) {
                            targetFolder = pack;
                            break;
                        }
                    }
                    // Also apply name replacement to the filename itself
                    for (_d = 0, NAME_MAP_2 = NAME_MAP; _d < NAME_MAP_2.length; _d++) {
                        _e = NAME_MAP_2[_d], old = _e.old, replacement = _e.new;
                        if (targetName.includes(old)) {
                            targetName = targetName.replace(old, replacement.toLowerCase());
                        }
                    }
                    subType = relPath.includes('agents') ? 'agents' : (relPath.includes('workflows') ? 'workflows' : (relPath.includes('skills') ? 'skills' : 'misc'));
                    destPath = path.join(DEST_DIR, targetFolder, subType, targetName);
                    return [4 /*yield*/, fs.ensureDir(path.dirname(destPath))];
                case 5:
                    _f.sent();
                    return [4 /*yield*/, fs.readFile(srcFile, 'utf-8')];
                case 6:
                    content = _f.sent();
                    processed = processContent(content);
                    return [4 /*yield*/, fs.writeFile(destPath, processed)];
                case 7:
                    _f.sent();
                    console.log("Copied & Mapped: ".concat(file.name, " -> ").concat(destPath.replace(DEST_DIR, '')));
                    _f.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 2];
                case 9: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.ensureDir(DEST_DIR)];
                case 1:
                    _a.sent();
                    console.log('Migrating agents...');
                    return [4 /*yield*/, scanAndCopy('_bmad/bmm/agents')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, scanAndCopy('_bmad/core/agents')];
                case 3:
                    _a.sent();
                    console.log('Migrating workflows...');
                    return [4 /*yield*/, scanAndCopy('_bmad/bmm/workflows')];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, scanAndCopy('.agent/workflows')];
                case 5:
                    _a.sent();
                    console.log('Migrating skills...');
                    return [4 /*yield*/, scanAndCopy('.agent/skills')];
                case 6:
                    _a.sent();
                    console.log('Migration complete!');
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error);
