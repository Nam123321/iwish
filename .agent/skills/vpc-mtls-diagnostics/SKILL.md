---
name: vpc-mtls-diagnostics
description: Diagnoses mTLS certificate configurations, trust chains, and VPC network policies to enforce and debug secure communications.
---

# vpc-mtls-diagnostics

## Purpose
Diagnoses mTLS certificate configurations, trust chains, and VPC network policies to enforce and debug secure communications.

## When to Use
- When debugging connection issues between VPC services.
- When configuring or rotating mTLS certificates.
- When auditing network policies for secure communication enforcement.

## Diagnostics Checklist
1. **Certificate Validity**: Ensure certificates are not expired and signed by a trusted CA.
2. **Trust Chain**: Verify that the client and server trust each other's Root CA.
3. **VPC Network Policies**: Check if ingress/egress rules allow traffic on the required ports (e.g., 443, 8443).
4. **Endpoint Resolution**: Ensure DNS correctly resolves internal service names within the VPC.

## Quick Audit Commands
```bash
# Check certificate expiry
openssl x509 -in client.crt -noout -dates

# Verify trust chain
openssl verify -CAfile ca.crt client.crt
```
