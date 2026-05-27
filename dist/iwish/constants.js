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
exports.LEGACY_COMMAND_ALIASES = exports.LEGACY_AGENT_ALIASES = exports.SUPPORTED_TOOL_PROFILES = exports.SUPPORTED_INSTALL_TARGETS = exports.INSTALL_TARGET_CATALOG = exports.I_WISH_OUTPUT_DIR = exports.CAPABILITY_TEMPLATE_ROOT = exports.MODULE_TEMPLATE_ROOT = exports.RUNTIME_TEMPLATE_ROOT = exports.TEMPLATES_ROOT = exports.REPO_ROOT = void 0;
exports.getCanonicalHome = getCanonicalHome;
exports.getPlatformMode = getPlatformMode;
exports.getRuntimeRoot = getRuntimeRoot;
exports.getInstallTargetDir = getInstallTargetDir;
const os = __importStar(require("os"));
const path = __importStar(require("path"));
exports.REPO_ROOT = path.resolve(__dirname, '../..');
exports.TEMPLATES_ROOT = path.join(exports.REPO_ROOT, 'templates', 'iwish');
exports.RUNTIME_TEMPLATE_ROOT = path.join(exports.TEMPLATES_ROOT, 'runtime');
exports.MODULE_TEMPLATE_ROOT = path.join(exports.TEMPLATES_ROOT, 'modules');
exports.CAPABILITY_TEMPLATE_ROOT = path.join(exports.TEMPLATES_ROOT, 'capability-package');
exports.I_WISH_OUTPUT_DIR = '_iwish-output';
exports.INSTALL_TARGET_CATALOG = [
    {
        id: 'claude-code',
        status: 'supported',
        installPath: '.claude',
        summary: 'First-party runtime materialization for Claude Code projects.',
        adapterStory: null,
    },
    {
        id: 'local-terminal',
        status: 'supported',
        installPath: '.iwish',
        summary: 'First-party runtime materialization for local terminal-based agent projects.',
        adapterStory: null,
    },
    {
        id: 'cursor',
        status: 'supported',
        installPath: '.cursor/rules',
        summary: 'First-party runtime materialization for Cursor rules and prompts.',
        adapterStory: null,
    },
    {
        id: 'windsurf',
        status: 'supported',
        installPath: '.windsurf/rules',
        summary: 'First-party runtime materialization for Windsurf rules and workspace prompts.',
        adapterStory: null,
    },
    {
        id: 'opencode',
        status: 'supported',
        installPath: '.opencode',
        summary: 'First-party runtime materialization for OpenCode workspace instructions.',
        adapterStory: null,
    },
    {
        id: 'google antigravity',
        status: 'supported',
        installPath: '.gemini',
        summary: 'First-party runtime materialization for Google Antigravity and Gemini-aligned workspace instructions.',
        adapterStory: null,
    },
    {
        id: 'openai',
        status: 'supported',
        installPath: '.openai',
        summary: 'First-party runtime materialization for OpenAI Custom GPTs and workspace instructions.',
        adapterStory: null,
    },
];
exports.SUPPORTED_INSTALL_TARGETS = exports.INSTALL_TARGET_CATALOG.filter((target) => target.status === 'supported').map((target) => target.id);
exports.SUPPORTED_TOOL_PROFILES = ['browser', 'design', 'graph'];
exports.LEGACY_AGENT_ALIASES = {
    'grand-priest': 'orch-agent',
    whis: 'capability-agent',
    vegeta: 'dev-agent',
    piccolo: 'architect-agent',
    'android-18': 'ux-agent',
    'tien-shinhan': 'qa-agent',
    hit: 'review-agent',
    'king-kai': 'pm-agent',
    trunks: 'delivery-manager-agent',
    bulma: 'analyst-agent',
    shenron: 'data-architect-agent',
    gotenks: 'creative-agent',
    'master-roshi': 'research-agent',
};
exports.LEGACY_COMMAND_ALIASES = {
    '/dev-story': '/code',
    '/create-story': '/make-story',
    '/create-ui-spec': '/make-ui-spec',
    '/code-review': '/review',
    '/prfaq': '/idea-challenge',
    '/working-backwards': '/idea-challenge',
    '/correct-course': '/pivot-project',
    '/course-correct': '/pivot-project',
    '/create-capability': '/create-skill',
    '/enhance-capability': '/enhance-skill',
    '/market-research': '/research',
    '/domain-research': '/research',
    '/technical-research': '/research',
    '/retrospective': '/retro',
};
function getCanonicalHome() {
    return process.env.IWISH_HOME || path.join(os.homedir(), '.iwish');
}
function getPlatformMode() {
    if (process.env.ANTIGRAVITY_SDK_VERSION) {
        return 'AG_MAO';
    }
    return 'LEGACY_INJECTION';
}
function getRuntimeRoot(projectRoot, namespace) {
    return path.join(projectRoot, '_iwish');
}
function getInstallTargetDir(projectRoot, platform) {
    const target = exports.INSTALL_TARGET_CATALOG.find((entry) => entry.id === platform);
    if (!target || !target.installPath) {
        return path.join(projectRoot, '.agent');
    }
    return path.join(projectRoot, ...target.installPath.split('/'));
}
