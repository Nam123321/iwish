# Capability Spec: cloudflare-ip-sync

## Type: SKILL
## Status: Draft
## Created: 2026-07-31

### Problem Statement
The system origin server needs to restrict incoming traffic exclusively to Cloudflare's network to prevent DDoS circumvention (direct origin attacks). Cloudflare's IP ranges change over time, requiring an automated way to retrieve the latest ranges and update the origin infrastructure (AWS Security Groups, iptables, etc.) to maintain security without blocking legitimate edge traffic.

### Knowledge Sources
- Source 1: Cloudflare documentation — IPs are published at `https://www.cloudflare.com/ips-v4` and `https://www.cloudflare.com/ips-v6`.
- Source 2: Epic 61 (Story 61.4) — Requires origin server to only accept connections from known Cloudflare IP ranges.

### Core Concepts
1. **IP Retrieval**: Fetch the latest IPv4 and IPv6 ranges from Cloudflare's official endpoints.
2. **Infrastructure Automation**: Update AWS Security Groups, iptables, UFW, or other firewall mechanisms to exclusively whitelist these ranges.
3. **Safety and Fallback**: Ensure updates are atomic and do not lock out internal administration IPs. Always preserve existing explicitly defined internal IPs (e.g., VPNs, VPC peering).

### Anti-Patterns
- ❌ Hardcoding Cloudflare IPs in configuration files manually without an automated refresh mechanism.
- ❌ Dropping all existing rules without first ensuring the new Cloudflare IPs are successfully fetched and validated (preventing accidental lockouts).
- ❌ Overwriting administration or internal VPC rules when updating the Cloudflare whitelist.

### Best Practices  
- ✅ Use a cron job or scheduled pipeline (e.g., GitHub Actions, AWS Lambda) to periodically run this sync (e.g., weekly).
- ✅ Validate the fetched IP ranges (ensure they are valid CIDRs and the list is not empty) before applying changes.
- ✅ Tag managed Security Group rules (e.g., `ManagedBy: cloudflare-ip-sync`) to safely identify which rules to replace without touching manual overrides.

### Deliverables
- [ ] File 1: `.agent/skills/cloudflare-ip-sync/SKILL.md`
- [ ] File 2: `.agent/skills/cloudflare-ip-sync/scripts/sync-cloudflare-ips.sh` (or Python equivalent)
