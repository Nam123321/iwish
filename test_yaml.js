const yaml = require('yaml');

const manifestYaml = `trial_id: "TRIAL-2026"
timestamp: "2026"
fixture: "test"
candidates:
decision: "PENDING"
  - path: "candidates/TRIAL-2026-native.md"
    source_engine: "bmad-native"
    engine_version: "internal"
`;

try {
    const doc = yaml.parse(manifestYaml);
    console.log("Parsed successfully:", doc);
} catch (e) {
    console.error("Parse error:", e.message);
}
