const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

function _normalizeAndHash(filepath) {
    const content = fs.readFileSync(filepath);
    // Normalize CRLF to LF
    const normalized = content.toString('utf8').replace(/\r\n/g, '\n');
    return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

function verify_execution(script_path) {
    try {
        let current_dir = path.resolve(path.dirname(script_path));
        let project_root = current_dir;
        while (project_root !== '/') {
            if (fs.existsSync(path.join(project_root, '.agent'))) {
                break;
            }
            project_root = path.dirname(project_root);
        }
        verify_project(project_root);
    } catch (e) {
        console.error(`\n[WATCHMEN FAIL-FAST] TCB Integrity Check Failed: ${e.message}`);
        console.error("[WATCHMEN FAIL-FAST] Execution Halted. If you modified a script, the Admin must re-sign the workspace.");
        process.exit(1);
    }
}

function verify_project(project_root) {
    const config_dir = path.join(project_root, '.agent', 'config');
    const pub_key_path = path.join(config_dir, 'watchmen-pub.pem');
    const sig_path = path.join(config_dir, 'scripts-lock.sig');
    const json_path = path.join(config_dir, 'scripts-lock.json');
    
    for (const p of [pub_key_path, sig_path, json_path]) {
        if (!fs.existsSync(p)) {
            throw new Error(`Missing critical TCB component: ${p}`);
        }
    }
    
    // We defer to the python implementation or openssl CLI directly
    // to avoid depending on third party JS crypto libraries.
    try {
        execSync(`openssl dgst -sha256 -verify "${pub_key_path}" -signature "${sig_path}" "${json_path}"`, { stdio: 'pipe' });
    } catch (e) {
        throw new Error("Cryptographic Signature Verification FAILED! Tampering detected or lock is outdated.");
    }
    
    // For local fast-fail, we just rely on python verify-worktree if we want to be thorough,
    // or we can implement the JSON checking here. Since JS is just for local Gate 1, the openssl check 
    // is usually enough to catch basic tampering, but let's just shell out to python core for the real check.
    try {
        execSync(`python3 -I ${path.join(project_root, '.agent', 'scripts', 'watchmen_core.py')} --verify-worktree ${project_root}`, { stdio: 'pipe' });
    } catch (e) {
        throw new Error("Python Core Verification FAILED!");
    }
}

module.exports = {
    verify_execution,
    verify_project
};
