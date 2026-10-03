---
epic_id: "{EPIC_ID}"
value_stream: "{VALUE_STREAM}"
layer: api
status: draft
cs: {CS_SCORE}
endpoints_count: {ENDPOINTS_COUNT}
---

# Layer-Epic-API: {EPIC_TITLE}

## 1. API Architecture Overview & Protocols
Define communication style, protocol standards (REST / tRPC / Server Actions / WebSocket), and route layout for this Epic.

## 2. Endpoint Inventory Table
List of all endpoints exposed or consumed by this Epic, strictly mapping bound models to `layer-epic-db.md`.

| Method | URI / Procedure Name | Auth / Permission | Bound Model(s) | Status | Description |
|--------|----------------------|-------------------|----------------|--------|-------------|
| GET    | `/api/v1/workflows`  | `Bearer (Admin, Member)` | `Workflow` | Existing | List user workflows with pagination |
| POST   | `/api/v1/workflows`  | `Bearer (Admin)`  | `Workflow`, `WorkflowVersion` | New | Create and initialize a new workflow |
| PATCH  | `/api/v1/workflows/:id/status` | `Bearer (Admin)` | `Workflow` | Modified | Update workflow lifecycle status |

## 3. Request & Response Schemas
Define inputs, validation rules, and output payload contracts (Zod / TypeScript syntax):

```typescript
// Example Zod Request Schema
export const CreateWorkflowSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  templateId: z.string().uuid().optional(),
});

export type CreateWorkflowInput = z.infer<typeof CreateWorkflowSchema>;

// Example Response Payload
export interface WorkflowResponse {
  id: string;
  title: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}
```

## 4. Error Handling & HTTP Status Codes
Enforce standard error envelope and status codes across all endpoints:

| Status Code | Error Code | Trigger Condition |
|-------------|------------|-------------------|
| 400 Bad Request | `VALIDATION_ERROR` | Schema validation fails on request body/query |
| 401 Unauthorized | `UNAUTHORIZED` | Missing or expired authentication token |
| 403 Forbidden | `FORBIDDEN` | Insufficient role or tenant boundary violation |
| 404 Not Found | `RESOURCE_NOT_FOUND` | Target entity does not exist or tenant mismatch |
| 409 Conflict | `ENTITY_COLLISION` | Duplicate unique constraint or concurrent modification |

## 5. Cross-Epic Contract & Integration Dependencies
- **Upstream Dependencies**: APIs/Services required by this Epic from other Epics.
- **Downstream Consumers**: Known Epics/Features that will consume these endpoints.
- **Rate Limiting & Telemetry**: OTel span naming conventions and throttling rules.
