---
name: "cloudflare-ip-sync"
description: "Use when you need to fetch, validate, or synchronize Cloudflare's published IP ranges (IPv4/IPv6) with origin infrastructure firewalls (AWS Security Groups, iptables, etc.) to prevent DDoS origin bypass."
inputs: []
outputs: []
mcp_tools_required: []
subagent_triggers: []
---

# cloudflare-ip-sync

## When to Use This Skill
Use when asked to whitelist Cloudflare IPs, secure the origin against direct IP attacks, or synchronize WAF edge network IPs with local firewalls.

## Core Rules
1. **Never Hardcode IPs**: Always dynamically fetch the latest ranges from `https://www.cloudflare.com/ips-v4` and `https://www.cloudflare.com/ips-v6`.
2. **Atomic Updates**: Ensure updates do not drop existing administrative or explicit internal VPC rules.
3. **Pre-Flight Validation**: The fetched list must be non-empty and contain valid CIDRs before applying any firewall changes.

## Execution Guide (Tier 1)
To execute this skill, you MUST NOT run generic bash commands. You MUST run the included Python runner:
`python3 $IWISH_HOME/generated-skills/cloudflare-ip-sync/scripts/runner.py --target <aws-sg-id|iptables>`

## Gate Classification
| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| CL-01 | Validate IP List is not empty | A | Python script asserts length > 0 before proceeding | runner.py exit code |
| CL-02 | CIDR Format Validation | A | Python script regex validates IPv4/v6 CIDR format | runner.py exit code |
| CL-03 | Preserve Manual Rules | A | Python script only updates rules tagged `ManagedBy: cloudflare-ip-sync` | runner.py AWS API checks |

## Red Flags — STOP and Reconsider
- **Empty List Retrieval**: If the Cloudflare endpoint returns a 5xx or empty list, the script MUST abort. Do not clear the firewall.
- **Accidental Lockout**: Ensure SSH (port 22) or internal admin IPs are explicitly allowed outside the Cloudflare managed rules.

## Common Rationalizations
| Excuse (Lazy LLM) | Reality (I-Wish Standard) |
|---|---|
| "I'll just hardcode the IPs from the website for now." | Cloudflare IPs change. A hardcoded list is a security incident waiting to happen. Use the automated runner. |
| "I'll use bash `curl` and `iptables -F`." | `iptables -F` flushes everything, including Docker and SSH rules. Use the python runner for safe, scoped updates. |
