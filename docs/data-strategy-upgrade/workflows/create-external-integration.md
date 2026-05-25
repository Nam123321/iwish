---
name: "create-external-integration"
description: "Design external API integration flows — request mapping, auth, retry, circuit breaker, error handling"
agent: "data-strategist"
phase: "3-solutioning"
---

# Create External Integration Design

## Pre-requisites
- Data Flow Guardian SKILL at `{project-root}/.agent/skills/data-flow-guardian/SKILL.md`
- Story file or feature description with external system requirements
- External API documentation (if available)

## Workflow Steps

### Step 1: Context Loading
1. Load validation SKILLs
2. Load the RACI matrix from `{project-root}/_bmad/bmm/config/data-raci.md`
3. Load the story/feature description
4. Identify all external systems involved

### Step 2: External System Inventory
List ALL external systems the feature integrates with:

| System | Direction | Purpose | Protocol | Auth |
|--------|-----------|---------|----------|------|
| VNPay | Outbound+Inbound | Payment processing | REST (HTTPS) | HMAC signature |
| GHN | Outbound | Shipping label creation | REST (HTTPS) | API Key header |
| Misa | Outbound | Invoice sync | REST (HTTPS) | OAuth2 |
| Zalo OA | Outbound | Customer notification | REST (HTTPS) | OAuth2 + refresh |

### Step 3: Request/Response Mapping
For each API call, map internal domain model to external API format:

```
Internal: Order { id, customerId, items[], totalAmount }
    ↓ Transform
External: VNPay { vnp_TxnRef, vnp_Amount (×100), vnp_OrderInfo }
    ↓ Response
External: VNPay { vnp_ResponseCode, vnp_TransactionNo }
    ↓ Transform
Internal: Payment { status, transactionRef, gatewayResponse }
```

⚡ **Kira++ collaboration recommended** for response/request model schema design.

### Step 4: Error Handling Strategy
For each integration point:

| Error Type | Strategy | Example |
|------------|----------|---------|
| Network timeout | Retry with backoff | GHN API timeout → retry 3× |
| 4xx Client error | Log + fail fast | Invalid payload, do not retry |
| 5xx Server error | Retry with backoff | VNPay server error → retry 3× |
| Auth expired | Refresh token + retry | Zalo OAuth2 token refresh |
| Rate limited (429) | Queue + exponential backoff | Respect Retry-After header |

### Step 5: Circuit Breaker Configuration
For each critical integration:

| System | Failure threshold | Open duration | Half-open test |
|--------|------------------|---------------|----------------|
| VNPay | 5 failures in 60s | 30s open | 1 test request |
| GHN | 10 failures in 120s | 60s open | 1 test request |

When circuit is OPEN:
- Return cached/fallback response if available
- Queue request for later retry
- Alert ops team

### Step 6: Webhook Handling (Inbound)
For systems that send webhooks:

| System | Webhook | Verification | Idempotency |
|--------|---------|-------------|-------------|
| VNPay IPN | Payment result | HMAC signature verify | Check `vnp_TxnRef` processed flag |
| GHN | Delivery status | IP whitelist + secret | Check `order_code` + `status` combo |

**Rules:**
- Always verify webhook authenticity before processing
- Always respond with 200 OK immediately, process async
- Store raw webhook payload for audit/debug
- Idempotency: check if event already processed before acting

### Step 7: Data Flow Diagram
Create Mermaid diagram showing:
```
[Internal Service] → [Transform] → [External API]
                                  ← [Response Transform]
[External Webhook] → [Verify] → [Queue] → [Process]
```

### Step 8: Output
Save to `{output_folder}/data-specs/{feature-key}-external-integration.md` with:
- External system inventory
- Request/response mappings (⚡ Kira++ reviewed)
- Error handling matrix
- Circuit breaker configurations
- Webhook handling procedures
- Data flow diagram (Mermaid)

Present to user for review.
