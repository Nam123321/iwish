import os
import sys
import json
import subprocess
import hashlib
import stat

def _normalize_and_hash(filepath):
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        # Normalize CRLF to LF
        content = f.read().replace(b'\r\n', b'\n')
        sha256_hash.update(content)
    return sha256_hash.hexdigest()

def _make_writable_recursive(directory):
    for root, dirs, files in os.walk(directory):
        for name in files:
            path = os.path.join(root, name)
            try:
                # chmod 644
                os.chmod(path, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH)
            except (PermissionError, OSError):
                pass
        for name in dirs:
            path = os.path.join(root, name)
            try:
                # chmod 755
                os.chmod(path, stat.S_IRUSR | stat.S_IWUSR | stat.S_IXUSR | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH)
            except (PermissionError, OSError):
                pass

def _make_readonly_recursive(directory):
    for root, dirs, files in os.walk(directory):
        for name in files:
            path = os.path.join(root, name)
            try:
                # chmod 444
                os.chmod(path, stat.S_IRUSR | stat.S_IRGRP | stat.S_IROTH)
            except (PermissionError, OSError):
                pass
        for name in dirs:
            path = os.path.join(root, name)
            try:
                # chmod 555
                os.chmod(path, stat.S_IRUSR | stat.S_IXUSR | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH)
            except (PermissionError, OSError):
                pass


def _macos_passphrase(prompt):
    """Return the exact dialog value without placing it in a process argument."""
    osa_cmd = [
        "osascript", "-e",
        f'Tell application "System Events" to return text returned of (display dialog "{prompt}" default answer "" with hidden answer with title "Zero-Trust Watchmen")',
    ]
    value = subprocess.check_output(osa_cmd, stderr=subprocess.DEVNULL).decode("utf-8")
    # osascript appends one output newline; do not strip user-entered spaces.
    return value[:-1] if value.endswith("\n") else value


def _private_key_credential(private_key_path, prompt):
    """Validate the signing credential before any lock artifact is replaced."""
    passphrase_input = None
    env_pass = os.environ.get("WATCHMEN_ADMIN_PASS")
    if env_pass:
        passin = ["-passin", "env:WATCHMEN_ADMIN_PASS"]
    elif sys.platform == "darwin":
        import getpass
        print("[*] Enter passphrase for Private Key (CLI Fallback):")
        passphrase_input = getpass.getpass(prompt)
        passin = ["-passin", "stdin"]
    else:
        print("[*] Enter passphrase for Private Key:")
        passin = []

    check_cmd = ["/usr/bin/openssl", "pkey", "-in", private_key_path, "-noout", *passin]
    check = subprocess.run(
        check_cmd,
        input=(passphrase_input + "\n") if passphrase_input is not None else None,
        text=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    if check.returncode != 0:
        raise RuntimeError("Watchmen private key could not be unlocked; no lock artifact was changed")
    return passin, passphrase_input


def sign_project(project_root):
    """
    Scans the .agent/scripts directory, builds a JSON hash map, and signs it.
    Requires Admin SSH key passphrase.
    """
    scripts_dir = os.path.join(project_root, '.agent', 'scripts')
    config_dir = os.path.join(project_root, '.agent', 'config')
    private_key_path = os.path.expanduser('~/.ssh/iwish_admin_key')
    sig_path = os.path.join(config_dir, 'scripts-lock.sig')
    json_path = os.path.join(config_dir, 'scripts-lock.json')
    
    if not os.path.exists(scripts_dir):
        raise RuntimeError(f"Directory not found: {scripts_dir}")
        
    if not os.path.exists(private_key_path):
        raise RuntimeError(f"Private Key not found: {private_key_path}")

    passin, passphrase_input = _private_key_credential(
        private_key_path,
        "Enter Watchmen Admin Passphrase to sign scripts:",
    )

    # Temporarily make writable so we can read/hash without issues, though read-only is fine for reading.
    # However, if we need to update scripts in the future, we need them writable first.
    _make_writable_recursive(scripts_dir)

    lock_map = {}
    for root, dirs, files in os.walk(scripts_dir):
        if '__pycache__' in dirs:
            dirs.remove('__pycache__')
        for file in files:
            filepath = os.path.join(root, file)
            rel_path = os.path.relpath(filepath, scripts_dir)
            rel_path_normalized = rel_path.replace(os.sep, '/')
            lock_map[rel_path_normalized] = _normalize_and_hash(filepath)

    # Sort keys to ensure deterministic JSON string
    json_str = json.dumps(lock_map, sort_keys=True, indent=2)
    
    with open(json_path, 'w', encoding='utf-8') as f:
        f.write(json_str)
        
    print(f"[*] Generated JSON map for {len(lock_map)} files at {json_path}")
    
    # 2. Cryptographic Zero-Dependency Signing using OS-level OpenSSL
    openssl_path = '/usr/bin/openssl'
    if not os.path.exists(openssl_path):
        raise RuntimeError("CRITICAL: /usr/bin/openssl not found. Halting to prevent PATH Hijacking.")
        
    sign_cmd = [
        openssl_path, 'dgst', '-sha256', *passin,
        '-sign', private_key_path,
        '-out', sig_path, 
        json_path
    ]

    result = subprocess.run(sign_cmd, input=(passphrase_input + "\n") if passphrase_input is not None else None, text=True)
    if result.returncode != 0:
        raise RuntimeError("Cryptographic Signing FAILED!")
        
    print(f"[+] Successfully signed workspace! Signature saved to {sig_path}")
    
    # Apply Immutable Time-Lock immediately to protect the fresh signature
    _make_readonly_recursive(scripts_dir)
    print(f"[+] Immutable Time-Lock applied to {scripts_dir}")


def sign_observed_artifact(artifact_path, signature_path):
    """Sign an existing observer-produced receipt; this function never creates events."""
    artifact = os.path.abspath(artifact_path)
    signature = os.path.abspath(signature_path)
    try:
        with open(artifact, 'r', encoding='utf-8') as handle:
            payload = json.load(handle)
    except (OSError, ValueError) as exc:
        raise RuntimeError(f"observer artifact is not valid JSON: {exc}")
    required = {'observed_events', 'observation_sha256', 'signer_observer_separated'}
    if not required.issubset(payload) or not payload['observed_events'] or payload['signer_observer_separated'] is not True:
        raise RuntimeError("refusing to sign artifact without separated observer evidence")
    private_key_path = os.path.expanduser('~/.ssh/iwish_admin_key')
    if not os.path.exists(private_key_path):
        raise RuntimeError(f"Private Key not found: {private_key_path}")
    passin, passphrase_input = _private_key_credential(
        private_key_path,
        'Enter Watchmen Admin Passphrase to sign observed receipt:',
    )
    sign_cmd = ['/usr/bin/openssl', 'dgst', '-sha256', *passin, '-sign', private_key_path, '-out', signature, artifact]
    result = subprocess.run(sign_cmd, input=(passphrase_input + '\n') if passphrase_input is not None else None, text=True)
    if result.returncode != 0:
        raise RuntimeError('Observed receipt signing FAILED!')
    print(f'[+] Signed observed receipt: {signature}')


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Watchmen Signer")
    parser.add_argument('--project', default='.', help="Path to project root")
    parser.add_argument('--artifact', help="Existing observer receipt to sign")
    parser.add_argument('--signature', help="Output signature for --artifact")
    args = parser.parse_args()
    
    try:
        if bool(args.artifact) != bool(args.signature):
            raise RuntimeError('--artifact and --signature must be provided together')
        if args.artifact:
            sign_observed_artifact(args.artifact, args.signature)
        else:
            sign_project(os.path.abspath(args.project))
        sys.exit(0)
    except Exception as e:
        print(f"\n[WATCHMEN SIGNER ERROR] {e}", file=sys.stderr)
        sys.exit(1)
