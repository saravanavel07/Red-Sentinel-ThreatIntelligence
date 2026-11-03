export type SeverityLevel = 'INFORMATIONAL' | 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'FALSE_POSITIVE';

export interface SecurityEvent {
  event_id: string;
  timestamp: string;
  event_type: string;
  event_type_display?: string;
  source_type: string;
  source_ip: string;
  account: string;
  host: string;
  severity: SeverityLevel;
  raw_event: Record<string, any>;
  normalized_event: {
    account: string;
    source_ip: string;
    host: string;
    action: string;
    status: string;
    details: Record<string, any>;
  };
  dedup_hash?: string;
  created_at?: string;
}

export interface SecurityAlert {
  alert_id: string;
  title: string;
  rule_id: string;
  rule_name: string;
  mitre_attack_id: string;
  severity: SeverityLevel;
  risk_score: number;
  confidence: number;
  scoring_explanation?: string;
  explanation: string;
  target_account: string;
  target_host: string;
  source_ip: string;
  triggering_event_id: string;
  evidence: Array<{
    event_id?: string;
    timestamp?: string;
    ip?: string;
    account?: string;
    type?: string;
    [key: string]: any;
  }>;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'CLOSED';
  created_at: string;
}

export interface AnalystNote {
  id: string;
  author: string;
  authorRole: string;
  content: string;
  action_taken?: string;
  created_at: string;
}

export interface AiTriageReport {
  incident_id: string;
  severity: SeverityLevel;
  risk_score: number;
  confidence: number;
  what_happened: string;
  why_flagged: string;
  uncertainties: string[];
  evidence_count: number;
  recommendations: Array<{
    step: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    action: string;
    category: string;
  }>;
  containment_steps: string[];
  verification_notes: string;
  human_approval_required: boolean;
  generated_at: string;
  tokens_used?: number;
  latency_ms?: number;
}

export interface Incident {
  incident_id: string;
  title: string;
  description: string;
  primary_account: string;
  primary_host: string;
  source_ip: string;
  severity: SeverityLevel;
  risk_score: number;
  status: IncidentStatus;
  review_status: 'PENDING_TRIAGE' | 'TRIAGED' | 'APPROVED' | 'ESCALATED' | 'REJECTED';
  alerts: SecurityAlert[];
  related_events: string[];
  analyst_notes: AnalystNote[];
  ai_triage_report?: AiTriageReport | null;
  created_at: string;
  updated_at: string;
}

export interface DetectionRuleConfig {
  rule_id: string;
  name: string;
  description: string;
  default_severity: SeverityLevel;
  base_score: number;
  mitre_id: string;
  enabled: boolean;
  threshold?: number;
  window_minutes?: number;
  last_triggered?: string;
}

export interface AuditLogEntry {
  id: string;
  user: string;
  role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: string;
  timestamp: string;
}

export interface AttackScenario {
  id: string;
  name: string;
  mitre_technique: string;
  severity: SeverityLevel;
  description: string;
  target_account: string;
  event_count: number;
  expected_rules: string[];
}
