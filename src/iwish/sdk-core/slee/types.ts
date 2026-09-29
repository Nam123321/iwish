export type ExecutionStatus = 'UNPROCESSED' | 'PROCESSED' | 'IGNORED';
export type LinterRuleSeverity = 'WARN' | 'ERROR';
export type LinterRuleStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ExecutionLog {
  id: string;
  timestamp: string;
  task_id: string;
  error_message: string;
  stack_trace: string;
  context_data: Record<string, any>;
  status: ExecutionStatus;
}

export interface Learning {
  id: string;
  execution_log_id: string;
  root_cause_analysis: string;
  resolution_strategy: string;
  tags: string[];
  created_at: string;
}

export interface LinterRule {
  id: string;
  learning_id: string;
  rule_name: string;
  description: string;
  language_framework: string;
  match_pattern: string;
  severity: LinterRuleSeverity;
  status: LinterRuleStatus;
  created_at: string;
  updated_at: string;
}

export interface ISleeDataStore {
  saveExecutionLog(log: ExecutionLog): Promise<void>;
  saveLearning(learning: Learning): Promise<void>;
  saveLinterRule(rule: LinterRule): Promise<void>;
  
  findLearningByHash(hash: string): Promise<Learning | null>;
  findUnprocessedLogs(): Promise<ExecutionLog[]>;
  updateLogStatus(id: string, status: ExecutionStatus): Promise<void>;
}
