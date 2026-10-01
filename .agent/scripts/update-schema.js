require('./watchmen_core.js').verify_execution(__filename);
const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const newNodeCategory = `
enum NodeCategory {
  TRIGGER
  ACTION
  CONDITION
  LOOP
  AGENT_TASK
  HUMAN_TASK
  DATA_TRANSFORM
  INTEGRATION
  NOTIFICATION
  APPROVAL
  SUB_WORKFLOW
  SYSTEM
}

enum ExecutorType {
  AGENT
  HUMAN
}
`;

if (!schema.includes('enum NodeCategory')) {
  schema = schema.replace(/model WorkflowNodeDefinition \{/, newNodeCategory + '\nmodel WorkflowNodeDefinition {');
}

const newWorkflowNodeDef = `model WorkflowNodeDefinition {
  id                String       @id @default(uuid())
  tenantId          String?
  name              String       @default("Untitled Node")
  description       String?
  category          NodeCategory @default(GENERAL)
  baseStepType      String
  
  // Actor Configurations
  monitorAgentId    String       @default("system-monitor")
  executorType      ExecutorType @default(AGENT)
  executorIds       String[]
  supervisorAgentId String?
  
  // I/O Schema Contracts
  inputSchema       Json?
  outputSchema      Json?
  
  // Processing Specification
  processingSpec    Json?
  
  // Plugin FK Bridge
  pluginId          String?
  plugin            PluginRegistry? @relation(fields: [pluginId], references: [id], onDelete: Cascade)
  
  // Audit Traceability
  createdBy         String?      @default("system")
  createdAt         DateTime     @default(now())
  updatedBy         String?
  updatedAt         DateTime     @updatedAt
  traceId           String?
  validationState   String       @default("VALID")
  
  tenant Tenant?        @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([pluginId])
  @@index([category])
}`;

// replace the old WorkflowNodeDefinition entirely
schema = schema.replace(/model WorkflowNodeDefinition \{[\s\S]*?\n\}/, newWorkflowNodeDef);

// Wait, the new schema uses `GENERAL` which is not in `NodeCategory`. Let me fix NodeCategory to include `GENERAL`
schema = schema.replace('SYSTEM\n}', 'SYSTEM\n  GENERAL\n}');

fs.writeFileSync('prisma/schema.prisma', schema);
