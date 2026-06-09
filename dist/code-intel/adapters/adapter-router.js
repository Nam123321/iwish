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
exports.resolveAdapter = resolveAdapter;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const yaml_1 = __importDefault(require("yaml"));
const cypher_adapter_1 = require("./cypher-adapter");
const lite_static_adapter_1 = require("./lite-static-adapter");
const falkordb_adapter_1 = require("./falkordb-adapter");
function getGraphProfilePath(projectRoot) {
    return path.join(projectRoot, '.iwish', 'runtime', 'graph-profile.yaml');
}
function loadGraphProfile(projectRoot) {
    const profilePath = getGraphProfilePath(projectRoot);
    if (!fs.existsSync(profilePath)) {
        return null;
    }
    try {
        const content = fs.readFileSync(profilePath, 'utf8');
        return yaml_1.default.parse(content);
    }
    catch {
        return null;
    }
}
function resolveAdapter(projectRoot) {
    const profile = loadGraphProfile(projectRoot);
    if (!profile || !profile.graph_surfaces?.codebasegraph) {
        return new lite_static_adapter_1.LiteStaticAdapter();
    }
    const adapterKey = profile.graph_surfaces.codebasegraph.toLowerCase();
    if (adapterKey === 'falkordb' || adapterKey === 'cypher') {
        return new falkordb_adapter_1.FalkorDBAdapter();
    }
    if (adapterKey === 'neo4j' || adapterKey === 'memgraph') {
        return new cypher_adapter_1.CypherAdapter(adapterKey);
    }
    if (adapterKey === 'lite-static' || adapterKey === 'static') {
        return new lite_static_adapter_1.LiteStaticAdapter();
    }
    // Default fallback
    return new lite_static_adapter_1.LiteStaticAdapter();
}
