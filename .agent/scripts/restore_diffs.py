import os, sys
# --- [Watchmen Core Injection] ---
_script_dir = os.path.dirname(os.path.abspath(__file__))
_agent_dir = os.path.abspath(os.path.join(_script_dir, ".."))
if _agent_dir not in sys.path:
    sys.path.insert(0, _agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass # Ignore for environment without watchmen_core, let the system handle it
# ---------------------------------

import re

replacements = {
    "story-01-4-: completed": "story-01-4-tenant-onboarding-subdomain-routing: completed",
    "story-01-5-: completed": "story-01-5-multi-identity-authentication-account-linking: completed",
    "story-01-6-: completed": "story-01-6-rbac-workspace-member-management-with-universal-data: completed",
    "story-01-7-: completed": "story-01-7-byok-api-key-vault-encryption: completed",
    "story-01-8-: completed": "story-01-8-gdpr-data-rights-compliance: completed",
    "story-01-9-: completed": "story-01-9-rate-limiting-resource-quota-gating: completed",
    "story-01-10-: completed": "story-01-10-frontend-multi-language-ui-i18n-framework-language-switcher: completed",
    "story-01-11-: completed": "story-01-11-frontend-portal-shell-multi-panel-workspace-layout: completed",
    "story-01-12-: completed": "story-01-12-feature-driven-refactoring-of-tenantworkspace-phase-2: completed",
    "story-01-13-: completed": "story-01-13-notification-engine-5-level-urgency: completed",
    "story-01-14-: backlog": "story-01-14-workspace-layout-persistence: backlog",
    "story-03-1-: completed": "story-03-1-level-1-and-level-2-policy-toggles: completed",
    "story-03-2-: completed": "story-03-2-multi-layer-security-guardrails-incident-alerting: completed",
    "story-03-3-: completed": "story-03-3-immutable-system-audit-logs: completed",
    "story-03-4-: completed": "story-03-4-tenant-level-audit-dashboard: completed",
    "story-11-1-: completed": "story-11-1-mcp-schema-parser-plugin-manifest-compiler: completed",
    "story-11-2-: completed": "story-11-2-ecosystem-asset-scanner-native-tool-routing: completed",
    "story-11-3-: completed": "story-11-3-public-mcp-server-cowok-mcp-server: completed",
    "story-11-4-: completed": "story-11-4-scoped-mcp-server-rbac-integration: completed",
    "story-41-1-: completed": "story-41-1-standard-plugin-manifest-validation-schema: backlog",
    "story-41-2-: completed": "story-41-2-ui-kit-plugin-management-framework: completed",
    "story-41-3-: backlog": "story-41-3-plugin-registry-api-access-control: backlog",
    "story-41-4-: backlog": "story-41-4-agent-plugin-catalog-vector-rag: backlog",
    "story-41-5-: completed": "story-41-5-basic-text-plugins-package: completed",
    "story-41-6-: completed": "story-41-6-interactive-forms-plugins-package: completed",
    "story-41-7-: completed": "story-41-7-information-kpi-plugins-package: completed",
    "story-41-8-: completed": "story-41-8-data-exploration-plugins-package: completed",
    "story-41-9-: backlog": "story-41-9-orchestration-plugins-package: backlog",
    "story-41-10-: completed": "story-41-10-operations-system-plugins-package: completed",
    "story-41-12-: backlog": "story-41-12-plugin-as-mcp-bridge-registry: backlog",
    "story-41-13-: completed": "story-41-13-template-configurator-ui-zero-it-ui-kit-builder: completed",
    "story-41-14-: backlog": "story-41-14-component-adapter-layer-multi-surface-rendering: backlog",
    "story-41-15-: cancelled": "story-41-15-curated-github-plugin-import-pipeline: cancelled",
    "story-41-17-: completed": "story-41-17-global-asset-default-document-parser-built-in-tool: backlog",
    "story-34-1-: completed": "story-34-1-workspace-layout-model-v2-two-panel-limit: completed",
    "story-34-2-: completed": "story-34-2-tab-routing-drag-move-collapse-restore: completed",
    "story-34-3-: completed": "story-34-3-desktop-virtual-desktop-other-monitor-placement: completed",
    "story-34-4-: completed": "story-34-4-context-drawer-inline-push-tab-fallback-router: completed",
    "story-34-5-: backlog": "story-34-5-two-panel-responsive-audit-for-existing-desktop-ui-specs: backlog",
    "story-34-6-: backlog": "story-34-6-linked-panel-live-context-binding: backlog",
    "story-34-7-: backlog": "story-34-7-workspace-shell-implementation-rollout-plan: backlog",
    "story-34-8-: backlog": "story-34-8-unified-orchestrator-dashboard: backlog",
    "story-34-9-: completed": "story-34-9-global-keyboard-shortcuts-quick-session-switcher: completed",
    "story-35-1-: completed": "story-35-1-multi-platform-credentials-gateway: completed",
    "story-35-2-: completed": "story-35-2-default-chat-platform-connectors-telegram-whatsapp-wechat-email: completed",
    "story-35-3-: completed": "story-35-3-default-drive-connectors-google-drive-onedrive: completed",
    "story-35-4-: completed": "story-35-4-default-productivity-connectors-figma-canva-notion-trello: completed",
    "story-35-5-: completed": "story-35-5-official-o-mcp-connectors-integration: completed",
    "story-35-6-: backlog": "story-35-6-community-c-mcp-connectors-integration: backlog",
    "story-35-7-: backlog": "story-35-7-custom-built-cb-mcp-connectors-integration: backlog",
    "story-35-8-: completed": "story-35-8-mcp-connectors-dashboard-enhancements-refresh-all-quick-toggle: completed",
    "story-35-9-: completed": "story-35-9-workflow-automation-connectors-n8n-make-zapier: completed",
    "story-35-10-: completed": "story-35-10-google-ecosystem-gemini-omni-flow-integration: completed",
    "story-17-1-: completed": "story-17-1-superadmin-tenant-directory-approval-workflow: completed",
    "story-17-2-: completed": "story-17-2-global-quota-subscription-management-console: completed",
    "story-17-3-: ready": "story-17-3-global-system-health-activity-dashboard: ready",
    "story-17-4-: completed": "story-17-4-component-registry-management-panel: completed",
    "story-17-5-: completed": "story-17-5-tier-assignment-matrix-ui: completed",
    "story-17-6-: completed": "story-17-6-component-feature-flag-beta-toggle: completed",
    "story-17-7-: ready": "story-17-7-global-notification-policy-incident-broadcast-console: ready",
    "story-17-8-: ready": "story-17-8-superadmin-global-ai-asset-pool-console: ready",
    "story-17-9-: completed": "story-17-9-superadmin-workspace-impersonation-mode: completed",
    "story-06-1-: completed": "story-06-1-affiliate-voucher-custom-alias-local-referral: completed",
    "story-06-2-: completed": "story-06-2-lemon-squeezy-mor-local-subscription-checkout-plan-gating: completed",
    "story-06-3-: completed": "story-06-3-hosted-customer-billing-portal-mor-integration: completed",
    "story-06-4-: completed": "story-06-4-mor-payment-webhooks-failed-payment-grace-period: completed",
    "story-06-5-: completed": "story-06-5-affiliate-commission-engine-local-payout-reports: completed",
    "story-06-6-: backlog": "story-06-6-affiliate-partner-account-lifecycle-superadmin-management: backlog",
    "story-06-7-: backlog": "story-06-7-superadmin-payment-gateway-config-reconciliation: backlog",
    "story-13-1-: backlog": "story-13-1-hybrid-tax-configuration-mor-local: backlog",
    "story-13-2-: backlog": "story-13-2-multi-gateway-e-invoicing-receipts-management: backlog",
    "story-13-3-: completed": "story-13-3-multi-portal-routing-subdomain-support: completed",
    "story-13-4-: completed": "story-13-4-legal-terms-privacy-policy-cookie-consent: completed",
    "story-13-5-: completed": "story-13-5-user-self-deletion-and-tenant-data-erasure: completed",
    "story-13-6-: completed": "story-13-6-gdpr-data-portability-soc2-controls: completed",
    "story-33-1-: backlog": "story-33-1-core-business-skill-tool-templates: backlog",
    "story-33-3-: backlog": "story-33-3-one-click-out-of-the-box-business-agent-onboarding: backlog",
    "story-33-4-: backlog": "story-33-4-default-enterprise-asset-source-catalog: backlog",
    "story-37-1-: backlog": "story-37-1-global-skill-workflow-agent-catalog: backlog",
    "story-37-2-: backlog": "story-37-2-global-asset-onboarding-wizard: backlog",
    "story-37-3-: backlog": "story-37-3-global-quota-and-usage-limits: backlog",
    "story-40-1-: backlog": "story-40-1-superadmin-global-sdk-asset-portal: backlog",
    "story-40-2-: backlog": "story-40-2-declarative-agent-harness-spec-engine: backlog",
    "story-40-3-: backlog": "story-40-3-centralized-api-gateway-correlation-tracing: backlog",
    "story-40-4-: backlog": "story-40-4-sandbox-isolation-ephemeral-state-syncing: backlog",
    "story-40-5-: backlog": "story-40-5-wiki-os-ingestion-publication-gate: backlog",
    "story-08-1-: completed": "story-08-1-hierarchical-byok-api-key-management: completed",
    "story-08-2-: completed": "story-08-2-token-usage-logging-dashboard: completed",
    "story-08-3-: completed": "story-08-3-budget-enforcement-hard-soft-limits: completed",
    "story-08-4-: completed": "story-08-4-personal-token-dashboard-end-user: completed",
    "story-08-5-: completed": "story-08-5-semantic-caching-layer-tenant-aware: completed",
    "story-08-6-: completed": "story-08-6-prompt-compression-engine: completed",
    "story-08-7-: backlog": "story-08-7-batch-api-routing-for-non-urgent-workloads: backlog",
    "story-08-8-: backlog": "story-08-8-member-quota-request-management: backlog",
    "epic-14-enterprise-wiki-os: in_progress": "epic-14-enterprise-wiki-os: completed",
    "story-14-1-: completed": "story-14-1-wiki-space-block-based-page-editor: completed",
    "story-14-2-: completed": "story-14-2-document-acl-permission-engine: completed",
    "story-14-3-: backlog": "story-14-3-universal-ingestion-pattern-permission-aware-indexing-handoff: completed",
    "story-14-4-: completed": "story-14-4-document-versioning-comments-approval-flow: completed",
    "story-14-5-: completed": "story-14-5-wiki-import-export-templates: completed",
    "story-14-6-: completed": "story-14-6-external-drive-connector: completed",
    "story-14-7-: completed": "story-14-7-document-tags-ai-taxonomy: completed",
    "story-14-8-: backlog": "story-14-8-rag-knowledge-graph-system: completed",
    "story-14-10-: backlog": "story-14-10-solution-research-ingestion-protocol: completed",
    "story-43-1-: completed": "story-43-1-upload-gateway-with-magika-detection: completed",
    "story-43-2-: completed": "story-43-2-parser-router-multi-backend-dispatch: completed",
    "story-43-3-: completed": "story-43-3-processing-queue-bullmq-status-tracking: completed",
    "story-43-4-: completed": "story-43-4-output-router-wiki-rag-chat: completed",
    "story-42-1-: completed": "story-42-1-search-index-schema-multi-entity-adapter: completed",
    "story-42-2-: completed": "story-42-2-hybrid-search-api-vector-keyword-filter: completed",
    "story-42-3-: completed": "story-42-3-search-result-ranking-personalization: completed",
    "story-42-4-: completed": "story-42-4-search-ui-command-palette-sidebar: completed",
    "story-45-1-: completed": "story-45-1-otel-collector-integration: completed",
    "story-45-2-: completed": "story-45-2-loki-s3-log-storage: completed",
    "story-45-3-: completed": "story-45-3-postgresql-log-boundary-enforcement: completed",
    "story-45-4-: completed": "story-45-4-telemetry-dashboard-grafana: completed",
    "story-47-1-: completed": "story-47-1-configversion-prisma-model-api: completed",
    "story-47-2-: completed": "story-47-2-diff-viewer-rollback-ui: completed",
    "story-47-3-: completed": "story-47-3-branch-merge-for-skills-workflows: completed",
    "story-48-0-: completed": "story-48-0-p0-hotfix-fix-broken-prometheus-llm-counters-latency-tracking: completed",
    "story-48-1-: completed": "story-48-1-fix-safespanbatcher-dead-code-enrich-otel-spans: completed",
    "story-48-2-: backlog": "story-48-2-per-skill-prometheus-metrics: backlog",
    "story-48-3-: backlog": "story-48-3-per-mcp-tool-performance-tracking: backlog",
    "story-48-4-: backlog": "story-48-4-agent-native-resource-categorization-taxonomy: backlog",
    "story-48-5-: backlog": "story-48-5-decision-observability-layer: backlog",
    "story-48-6-: backlog": "story-48-6-outcome-correlation-engine: backlog",
    "story-48-7-: backlog": "story-48-7-usage-drift-detection-anomaly-alerting: backlog",
    "story-48-8-: backlog": "story-48-8-agent-resource-dashboard-grafana: backlog",
    "story-48-9-: backlog": "story-48-9-extended-alert-rules-metrics-api-expansion: backlog",
    "story-02-1-: completed": "story-02-1-central-agent-router: completed",
    "story-02-2-: completed": "story-02-2-ai-staff-talent-pool: completed",
    "story-02-3-: completed": "story-02-3-agent-performance-benchmarking: completed",
    "story-02-4-: completed": "story-02-4-agent-management-console-setup-hub: completed",
    "story-02-5-: completed": "story-02-5-repo-to-agent-ingestion-engine: completed",
    "story-02-6-: completed": "story-02-6-dynamic-workflow-planner-hitl-task-promotion-gateway: completed",
    "story-05-1-: completed": "story-05-1-e2b-sandbox-bridge-and-ast-security-guardrail: completed",
    "story-05-2-: completed": "story-05-2-extism-webassembly-wasm-plugin-execution: completed",
    "story-05-3-: completed": "story-05-3-agent-application-control-web-browser-automation: completed",
    "story-05-4-: in_progress": "story-05-4-migration-engine-repository-classification: in_progress",
    "story-05-5-: in_progress": "story-05-5-zero-code-scenario-to-plugin-compiler: in_progress",
    "story-05-6-: in_progress": "story-05-6-plugin-sandbox-testing-a-b-verification: in_progress",
    "story-07-1-: completed": "story-07-1-auto-upgrade-autonomous-skill-evolution: completed",
    "story-07-4-: backlog": "story-07-4-cost-optimizer-auto-plugin-generator: backlog",
    "story-07-9-: backlog": "story-07-9-personal-agent-approval-continuous-learning-consolidation: backlog",
    "story-07-11-: backlog": "story-07-11-tournament-based-skill-evaluation-engine: backlog",
    "story-07-12-: backlog": "story-07-12-cl-configuration-cost-transparency: backlog",
    "story-07-13-: backlog": "story-07-13-skill-regression-monitor: backlog",
    "story-07-14-: backlog": "story-07-14-git-style-skill-branching-merge-governance: backlog",
    "story-07-15-: backlog": "story-07-15-skill-evolution-timeline-genealogy-dashboard: backlog",
    "story-07-2-: completed": "story-07-2-model-gateway-cost-routing-litellm: completed",
    "story-07-8-: backlog": "story-07-8-personal-ai-agent-hub-genealogy-tracking: backlog",
    "story-07-10-: backlog": "story-07-10-ai-session-history-qualitative-feedback: backlog",
    "story-27-1-: backlog": "story-27-1-event-capture-engine-browser: backlog",
    "story-27-2-: backlog": "story-27-2-event-capture-engine-desktop-a11y: backlog",
    "story-27-3-: backlog": "story-27-3-teach-once-smart-suggestion-ux: backlog",
    "story-27-4-: backlog": "story-27-4-workflow-review-parameterization: backlog",
    "story-27-5-: backlog": "story-27-5-live-demo-rehearsal-panel: backlog",
    "story-27-6-: backlog": "story-27-6-webwright-mcp-server-integration: backlog",
    "story-27-7-: backlog": "story-27-7-forgedskill-lifecycle-self-healing: backlog",
    "story-27-8-: backlog": "story-27-8-vision-fallback-layer-tier-4: backlog",
    "story-28-1-: backlog": "story-28-1-mini-app-creation-wizard: backlog",
    "story-28-2-: backlog": "story-28-2-plugin-marketplace-distribution: backlog",
    "story-28-3-: backlog": "story-28-3-automation-flywheel-engine: backlog",
    "story-28-4-: backlog": "story-28-4-app-template-library: backlog",
    "story-28-5-: backlog": "story-28-5-app-analytics-dashboard: backlog",
    "story-38-1-: backlog": "story-38-1-agent-driven-development-platform-agent-ide: backlog",
    "story-04-1-: completed": "story-04-1-lark-chat-gateway-and-interactive-cards: completed",
    "story-04-3-: completed": "story-04-3-websocket-powered-interactive-kanban-board: completed",
    "story-09-1-: backlog": "story-09-1-ai-powered-cv-filtering-and-scoring: backlog",
    "story-09-2-: backlog": "story-09-2-automated-account-provisioning-knowledge-base-access: backlog",
    "story-09-3-: backlog": "story-09-3-department-onboarding-collaboration-hub: backlog",
    "story-10-1-: backlog": "story-10-1-7-step-wizard-workflow-creation: backlog",
    "story-10-2-: backlog": "story-10-2-department-industry-journey-matrix-engine: backlog",
    "story-44-1-: ready": "story-44-1-workflow-json-schema-state-machine-core: ready",
    "story-44-2-: ready": "story-44-2-step-executor-bullmq-worker-pool: ready",
    "story-44-3-: ready": "story-44-3-human-gate-integration: ready",
    "story-44-4-: ready": "story-44-4-workflow-execution-monitoring-audit-trail: ready",
    "story-12-1-: completed": "story-12-1-configurable-approval-workflows: completed",
    "story-12-2-: completed": "story-12-2-approval-policy-configuration-engine: completed",
    "story-12-3-: completed": "story-12-3-approval-state-machine-notifications: completed",
    "story-12-4-: completed": "story-12-4-delegation-escalation-rules: completed",
    "story-12-5-: completed": "story-12-5-approval-api-workflow-wiki-data-appbuilder: completed",
    "story-46-1-: backlog": "story-46-1-langgraph-python-service-http-bridge: backlog",
    "story-46-2-: backlog": "story-46-2-checkpoint-state-management-postgresql: backlog",
    "story-46-3-: backlog": "story-46-3-hitl-gates-confidence-scoring: backlog",
    "story-46-4-: backlog": "story-46-4-crystallization-pipeline-dynamic-formed: backlog",
    "story-15-1-: backlog": "story-15-1-8-phase-app-generator-pipeline: backlog",
    "story-16-1-: backlog": "story-16-1-visual-node-based-canvas-ai-copilot: backlog",
    "story-16-2-: backlog": "story-16-2-external-workflow-auto-sync-lark-notion-slack: backlog",
    "story-29-1-: backlog-deferred": "story-29-1-custom-dag-executor-engine: backlog-deferred",
    "story-29-2-: backlog-deferred": "story-29-2-dedicated-worker-pool-queue-management: backlog-deferred",
    "story-50-1-: backlog": "story-50-1-node-definition-schema-crud-api: backlog",
    "story-36-1-: completed": "story-36-1-native-channels-group-chat-rooms: completed",
    "story-36-2-: backlog": "story-36-2-multi-agent-group-participation-contextual-mentions: backlog",
    "story-36-3-: backlog": "story-36-3-threaded-chat-topics-inside-channels: backlog",
    "story-36-4-: backlog": "story-36-4-universal-chat-action-card-promotion-engine: backlog",
    "story-21-1-: backlog": "story-21-1-activity-monitoring-daemon-rust-background-process: backlog",
    "story-21-2-: backlog": "story-21-2-local-sqlite-encrypted-storage: backlog",
    "story-21-3-: backlog": "story-21-3-window-title-sanitization-pii-filtering: backlog",
    "story-21-4-: backlog": "story-21-4-deep-work-detection-focus-scoring: backlog",
    "story-21-5-: backlog": "story-21-5-cowok-insight-dashboard-today-view: backlog",
    "story-21-6-: backlog": "story-21-6-cowok-insight-dashboard-weekly-trends-patterns: backlog",
    "story-21-7-: backlog": "story-21-7-ai-powered-insight-generation: backlog",
    "story-21-8-: backlog": "story-21-8-closed-feedback-loop-with-ai-staff-orchestration: backlog",
    "story-21-9-: backlog": "story-21-9-privacy-settings-consent-flow: backlog",
    "story-21-10-: backlog": "story-21-10-team-analytics-dashboard-admin-manager-view: backlog",
    "story-22-1-: completed": "story-22-1-connector-adapter-framework-management-ui: completed",
    "story-22-2-: merged-to-22.1": "story-22-2-connection-management-ui-merged: merged-to-22.1",
    "story-22-3-: completed": "story-22-3-schema-discovery-metadata-indexer: completed",
    "story-22-4-: completed": "story-22-4-nl-sql-query-engine: completed",
    "story-22-5-: completed": "story-22-5-query-approval-engine-hitl: completed",
    "story-22-7-: completed": "story-22-7-connection-health-monitor: completed",
    "story-22-8-: completed": "story-22-8-query-cost-estimator: completed",
    "story-22-9-: completed": "story-22-9-tenant-scoped-connection-sharing: completed",
    "story-22-10-: completed": "story-22-10-tiered-data-caching: completed",
    "story-23-1-: completed": "story-23-1-google-drive-oauth2-connection-token-management: completed",
    "story-23-2-: completed": "story-23-2-onedrive-microsoft-graph-oauth2-connection: completed",
    "story-23-4-: completed": "story-23-4-file-metadata-indexer-virtual-folder-mapping: completed",
    "story-23-5-: completed": "story-23-5-google-sheets-api-direct-read: completed",
    "story-23-7-: completed": "story-23-7-webhook-safety-poll-change-detection: completed",
    "story-23-8-: completed": "story-23-8-ai-auto-classify-file-organization-onboarding-wizard: backlog",
    "story-23-9-: completed": "story-23-9-permission-proxy-user-delegated-token-enforcement: completed",
    "story-23-10-: completed": "story-23-10-shared-with-me-auto-scan-personal-file-tab-ui: backlog",
    "story-23-11-: completed": "story-23-11-external-file-handling: backlog",
    "story-23-12-: completed": "story-23-12-file-access-audit-log-admin-dashboard: backlog",
    "story-24-1-: completed": "story-24-1-data-mart-definition-schema-mv-generator: completed",
    "story-24-2-: completed": "story-24-2-wizard-ui-steps-1-3-source-column-selection: completed",
    "story-24-3-: completed": "story-24-3-wizard-ui-steps-4-5-assignment-schedule: completed",
    "story-24-4-: completed": "story-24-4-ai-assisted-column-suggestion-pii-detection: completed",
    "story-24-5-: completed": "story-24-5-refresh-rate-guardrails: completed",
    "story-24-6-: completed": "story-24-6-rls-policy-generator: completed",
    "story-24-7-: completed": "story-24-7-concurrent-refresh-scheduler: completed",
    "story-24-8-: in_progress": "story-24-8-tenant-quota-dashboard: in_progress",
    "story-25-1-: backlog": "story-25-1-poc-track-a-baserow-mit-embed: backlog",
    "story-25-2-: backlog": "story-25-2-poc-track-b-custom-dataexplorer-build: backlog",
    "story-25-3-: backlog": "story-25-3-poc-evaluation-decision-gate-baserow-embed-vs-custom-build: backlog",
    "story-25-4-: backlog": "story-25-4-production-implementation-of-spreadsheet-data-explorer: backlog",
    "story-25-5-: backlog": "story-25-5-hitl-approval-layer-for-data-edits: backlog",
    "story-26-1-: backlog": "story-26-1-external-developer-webhooks-api-keys: backlog",
    "story-26-2-: backlog": "story-26-2-github-webhook-integration-ci-cd-trigger: backlog",
    "story-49-1-: backlog": "story-49-1-cost-forecasting-engine: backlog",
    "story-49-2-: backlog": "story-49-2-tenant-health-score: backlog",
    "story-49-3-: backlog": "story-49-3-platform-health-score: backlog",
    "story-49-4-: backlog": "story-49-4-dora-metrics-tracking: backlog",
    "story-49-5-: backlog": "story-49-5-tenant-experience-analytics-dashboard: backlog",
    "story-49-6-: backlog": "story-49-6-observability-driven-retrospective-integration: backlog",
    "story-49-7-: backlog": "story-49-7-privacy-impact-assessment: backlog",
    "story-49-8-: backlog": "story-49-8-cardinality-budget-load-testing: backlog",
    "story-19-1-: backlog": "story-19-1-tauri-v2-project-initialization-shared-react-integration: backlog",
    "story-19-2-: backlog": "story-19-2-desktop-authentication-session-management: backlog",
    "story-19-3-: backlog": "story-19-3-multi-window-infrastructure-state-sync: backlog",
    "story-19-4-: backlog": "story-19-4-system-tray-global-hotkeys: backlog",
    "story-19-5-: backlog": "story-19-5-native-desktop-notifications: backlog",
    "story-19-6-: backlog": "story-19-6-desktop-websocket-sidecar: backlog",
    "story-19-7-: backlog": "story-19-7-desktop-ci-cd-pipeline-code-signing-auto-update: backlog",
    "story-19-8-: backlog": "story-19-8-platform-feature-detection-graceful-degradation: backlog",
    "story-20-1-: backlog": "story-20-1-local-file-read-via-rust-backend: backlog",
    "story-20-2-: backlog": "story-20-2-local-file-write-back-via-rust-backend: backlog",
    "story-20-3-: backlog": "story-20-3-folder-watch-auto-ingestion-pipeline: backlog",
    "story-20-4-: backlog": "story-20-4-pii-stripping-privacy-pipeline: backlog",
    "story-20-5-: backlog": "story-20-5-ai-analysis-write-back-loop: backlog",
    "story-20-6-: backlog": "story-20-6-file-processing-queue-status-dashboard: backlog",
    "story-20-7-: backlog": "story-20-7-inter-app-automation-macos-applescript-windows-com: backlog",
    "story-20-8-: backlog": "story-20-8-mcp-server-for-local-file-tools: backlog",
    "story-20-9-: backlog": "story-20-9-file-type-capability-matrix-format-detection: backlog",
    "story-20-10-: backlog": "story-20-10-user-permissions-folder-access-control: backlog",
    "story-53-1-: backlog": "story-53-1-mobile-project-scaffolding-shared-assets-configuration: backlog",
    "story-53-2-: backlog": "story-53-2-mobile-authentication-session-persistence-cookie-token: backlog",
    "story-53-3-: backlog": "story-53-3-mobile-ci-cd-pipeline-ios-testflight-android-beta-bundling: backlog",
    "story-31-3-: backlog": "story-31-3-loki-to-okf-jsonl-training-export: backlog",
    "story-31-5-: backlog": "story-31-5-tenant-data-collection-pipeline: backlog",
    "story-31-6-: backlog": "story-31-6-qlora-fine-tuning-pipeline-unsloth: backlog",
    "story-31-7-: backlog": "story-31-7-multi-lora-serving-via-vllm: backlog",
    "story-31-8-: backlog": "story-31-8-golden-set-regression-ci-cd: backlog",
    "story-31-9-: backlog": "story-31-9-federated-lora-aggregation-platform-learning: backlog",
    "story-31-10-: backlog": "story-31-10-global-ai-asset-telemetry-improvement-loop: backlog",
    "story-31-11-: backlog": "story-31-11-platform-observability-telemetry-integration: backlog"
}

file_path = "{project-root}/_iwish-output/3. Development/sprint-status.yaml"

with open(file_path, "r") as f:
    content = f.read()

# Instead of simple string replacement (which could fail if the exact spacing or line matches),
# we'll regex replace lines that start with the old key name
for old, new in replacements.items():
    # old is something like "story-01-4-: completed"
    # match any line containing the prefix up to the colon
    prefix = old.split(":")[0].strip()
    
    # We want to replace lines that match this prefix and maybe have different statuses due to my edits
    # pattern: ^(\s*)story-01-4-:(.*)$
    # but wait, the keys in the current yaml might just be `story-01-4-tenant-workspace-crud` or something
    # Actually, the file currently has `story-01-4: completed` or `story-01-4-: completed` depending on what `fix_sprint_status.py` left, or since I restored from git, it has `story-01-4-tenant-registration-onboarding: completed`.
    # Ah! The original file HAD suffixes! The user's diff was modifying the PREVIOUS suffixes to NEW suffixes!
    # e.g., `-  story-01-4-tenant-registration-onboarding: completed` -> `+  story-01-4-tenant-onboarding-subdomain-routing: completed`
    # Let me just use the base story ID, e.g. "story-01-4-.*" and replace with the whole new line.
    
    story_id_match = re.match(r"(story-\d+(?:-\d+[a-z]?)?)", prefix)
    if story_id_match:
        story_id = story_id_match.group(1)
        # Find lines that start with spaces, then the story_id, then maybe a dash and other words, then a colon
        # and replace the whole line but keep the indentation and the status (wait, new string has the status)
        # Actually, new string has the status we want to set, e.g., "story-01-4-tenant-onboarding: completed"
        
        # We extract the status from `new` string
        new_key_status = new.split(":", 1)
        if len(new_key_status) == 2:
            new_key = new_key_status[0].strip()
            new_status = new_key_status[1].strip()
            
            # replace the whole line
            pattern = r"^(\s*)" + story_id + r"(?:-[a-zA-Z0-9-]+)?:\s*(.*)$"
            
            # Keep the old status if the new status is just replacing name, unless we want the new status.
            # In user's diffs, sometimes status changed. We'll just use the new status from user's diff.
            
            def repl(m):
                # m.group(1) is whitespace
                # m.group(2) is old status
                return m.group(1) + new_key + ": " + new_status
                
            content = re.sub(pattern, repl, content, flags=re.MULTILINE)

# specific fixes for epic 14
content = re.sub(r"^(\s*)epic-14-enterprise-wiki-os:.*$", r"\1epic-14-enterprise-wiki-os: completed", content, flags=re.MULTILINE)

with open(file_path, "w") as f:
    f.write(content)
