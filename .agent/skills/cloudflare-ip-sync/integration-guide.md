# Integration Guide: cloudflare-ip-sync

## Overview
This skill automates the retrieval of Cloudflare's published IP ranges and updates origin firewalls to prevent DDoS circumvention. It is designed to run automatically or be invoked by an Infrastructure Agent.

## Use Cases
- Hardening origin servers against direct IP attacks.
- Automatically updating AWS Security Groups when Cloudflare changes their IP ranges.
- Initial setup of origin firewall rules for a web application sitting behind Cloudflare WAF.

## Edge & Stress Cases
- **Cloudflare API Outage**: The runner asserts that the fetched list must be non-empty. If the API is down, it aborts without clearing existing rules.
- **Malformed Data**: Regex CIDR validation prevents invalid formats from causing firewall misconfigurations.

## Constraints
- **Runner Requirement**: You MUST use `scripts/runner.py`. Do NOT use bash `curl` with `iptables -F` as it flushes administrative and container rules (e.g. Docker).
- **Manual Rule Preservation**: When integrating, ensure the module tags managed rules with `ManagedBy: cloudflare-ip-sync`.

## Routing Hints
- Trigger this skill when deploying infrastructure (Epic 61).
- Recommended to run via a scheduled pipeline (e.g., cron or GitHub Actions).

## Review Questions
- Have we ensured SSH or VPN IPs are explicitly whitelisted outside of the Cloudflare managed scope?
- Does the IAM role executing this runner have the minimum necessary permissions to update AWS Security Groups?
