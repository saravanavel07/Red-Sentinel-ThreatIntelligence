import { SecurityEvent, SecurityAlert, Incident, SeverityLevel, DetectionRuleConfig } from '../types/security';

export function calculateScoreToSeverity(score: number): SeverityLevel {
  if (score >= 90) return 'CRITICAL';
  if (score >= 75) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  if (score >= 25) return 'LOW';
  return 'INFORMATIONAL';
}

export const INITIAL_RULES: DetectionRuleConfig[] = [
  {
    rule_id: 'RS-AUTH-001',
    name: 'Repeated Authentication Failures',
    description: 'Detects 5+ failed sign-in attempts within 5 minutes for the same account or source IP.',
    default_severity: 'HIGH',
    base_score: 75,
    mitre_id: 'T1110 (Brute Force)',
    enabled: true,
    threshold: 5,
    window_minutes: 5,
  },
  {
    rule_id: 'RS-AUTH-002',
    name: 'Suspicious Login Sequence',
    description: 'Detects multiple authentication failures followed immediately by a successful sign-in.',
    default_severity: 'CRITICAL',
    base_score: 92,
    mitre_id: 'T1078 (Valid Accounts)',
    enabled: true,
    threshold: 3,
    window_minutes: 15,
  },
  {
    rule_id: 'RS-IAM-003',
    name: 'Privilege Change Monitoring',
    description: 'Monitors unexpected IAM role modifications, admin policy attachments, or access key creations.',
    default_severity: 'HIGH',
    base_score: 82,
    mitre_id: 'T1098 (Account Manipulation)',
    enabled: true,
  },
  {
    rule_id: 'RS-TIME-004',
    name: 'Unusual Activity Time',
    description: 'Identifies privileged cloud infrastructure operations executed during off-hours (23:00 - 05:00 UTC).',
    default_severity: 'MEDIUM',
    base_score: 58,
    mitre_id: 'T1078.004 (Cloud Accounts)',
    enabled: true,
  },
  {
    rule_id: 'RS-VOL-005',
    name: 'Event Burst Detection',
    description: 'Detects abnormal rate surges exceeding baseline threshold (>= 12 events in 60s from single IP).',
    default_severity: 'HIGH',
    base_score: 74,
    mitre_id: 'T1499 (Endpoint DoS / Recon)',
    enabled: true,
    threshold: 12,
  },
  {
    rule_id: 'RS-CORR-006',
    name: 'Suspicious Event Correlation',
    description: 'Correlates 3+ distinct suspicious categories on the same host or identity within 1 hour.',
    default_severity: 'CRITICAL',
    base_score: 95,
    mitre_id: 'T1078 + T1098 (Attack Progression)',
    enabled: true,
  },
];

export class ClientDetectionEngine {
  private rules: DetectionRuleConfig[];

  constructor(rules: DetectionRuleConfig[] = INITIAL_RULES) {
    this.rules = [...rules];
  }

  public getRules(): DetectionRuleConfig[] {
    return this.rules;
  }

  public toggleRule(ruleId: string, enabled: boolean): void {
    const r = this.rules.find((rule) => rule.rule_id === ruleId);
    if (r) r.enabled = enabled;
  }

  public updateRuleThreshold(ruleId: string, threshold: number): void {
    const r = this.rules.find((rule) => rule.rule_id === ruleId);
    if (r) r.threshold = threshold;
  }

  public evaluateEvent(
    event: SecurityEvent,
    history: SecurityEvent[]
  ): SecurityAlert[] {
    const alerts: SecurityAlert[] = [];
    const eventTime = new Date(event.timestamp).getTime();

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      // Rule 1: Repeated Auth Failures
      if (rule.rule_id === 'RS-AUTH-001' && event.event_type === 'auth.failure') {
        const threshold = rule.threshold || 5;
        const windowMs = (rule.window_minutes || 5) * 60 * 1000;
        const matching = history.filter(
          (e) =>
            e.event_type === 'auth.failure' &&
            (e.account === event.account || e.source_ip === event.source_ip) &&
            Math.abs(eventTime - new Date(e.timestamp).getTime()) <= windowMs
        );
        // Include current
        const allFailures = [event, ...matching];
        if (allFailures.length >= threshold) {
          const score = Math.min(95, rule.base_score + (allFailures.length - threshold) * 2);
          alerts.push({
            alert_id: `ALT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            title: 'Repeated Authentication Failures Detected',
            rule_id: rule.rule_id,
            rule_name: rule.name,
            mitre_attack_id: rule.mitre_id,
            severity: calculateScoreToSeverity(score),
            risk_score: score,
            confidence: 0.92,
            scoring_explanation: `Base score ${rule.base_score} + ${(allFailures.length - threshold) * 2} pts for ${allFailures.length} observed failures (threshold: ${threshold}).`,
            explanation: `Account '${event.account}' observed ${allFailures.length} failed login attempts from IP '${event.source_ip}' within ${rule.window_minutes} minutes.`,
            target_account: event.account,
            target_host: event.host,
            source_ip: event.source_ip,
            triggering_event_id: event.event_id,
            evidence: allFailures.slice(0, 8).map((f) => ({
              event_id: f.event_id,
              timestamp: f.timestamp,
              ip: f.source_ip,
            })),
            status: 'OPEN',
            created_at: new Date().toISOString(),
          });
          rule.last_triggered = new Date().toISOString();
        }
      }

      // Rule 2: Suspicious Login Sequence (failures then success)
      if (rule.rule_id === 'RS-AUTH-002' && event.event_type === 'auth.success') {
        const lookbackMs = 15 * 60 * 1000;
        const precedingFailures = history.filter(
          (e) =>
            e.event_type === 'auth.failure' &&
            e.account === event.account &&
            eventTime - new Date(e.timestamp).getTime() > 0 &&
            eventTime - new Date(e.timestamp).getTime() <= lookbackMs
        );
        if (precedingFailures.length >= (rule.threshold || 3)) {
          const score = 94;
          alerts.push({
            alert_id: `ALT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            title: 'Suspicious Login Sequence: Failure Streak Followed by Success',
            rule_id: rule.rule_id,
            rule_name: rule.name,
            mitre_attack_id: rule.mitre_id,
            severity: 'CRITICAL',
            risk_score: score,
            confidence: 0.95,
            scoring_explanation: `Critical progression score ${score}/100. High-confidence account takeover indicator.`,
            explanation: `Account '${event.account}' experienced ${precedingFailures.length} authentication failures followed immediately by a successful sign-in from '${event.source_ip}'.`,
            target_account: event.account,
            target_host: event.host,
            source_ip: event.source_ip,
            triggering_event_id: event.event_id,
            evidence: [
              { event_id: event.event_id, type: 'auth.success', ip: event.source_ip },
              ...precedingFailures.slice(0, 5).map((f) => ({
                event_id: f.event_id,
                type: 'auth.failure',
                ip: f.source_ip,
              })),
            ],
            status: 'OPEN',
            created_at: new Date().toISOString(),
          });
          rule.last_triggered = new Date().toISOString();
        }
      }

      // Rule 3: Privilege Change Monitoring
      if (
        rule.rule_id === 'RS-IAM-003' &&
        ['iam.privilege_escalation', 'iam.role_modified', 'iam.key_created'].includes(
          event.event_type
        )
      ) {
        alerts.push({
          alert_id: `ALT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          title: `Privileged IAM Modification: ${event.event_type}`,
          rule_id: rule.rule_id,
          rule_name: rule.name,
          mitre_attack_id: rule.mitre_id,
          severity: 'HIGH',
          risk_score: rule.base_score,
          confidence: 0.88,
          scoring_explanation: `Base score ${rule.base_score}/100 based on administrative credential issuance.`,
          explanation: `Identity '${event.account}' modified administrative privileges or minted persistent API credentials.`,
          target_account: event.account,
          target_host: event.host,
          source_ip: event.source_ip,
          triggering_event_id: event.event_id,
          evidence: [
            {
              event_id: event.event_id,
              action: event.normalized_event.action,
              details: event.normalized_event.details,
            },
          ],
          status: 'OPEN',
          created_at: new Date().toISOString(),
        });
        rule.last_triggered = new Date().toISOString();
      }

      // Rule 4: Unusual Activity Time (off-hours)
      if (
        rule.rule_id === 'RS-TIME-004' &&
        ['iam.privilege_escalation', 'cloud.security_group_opened'].includes(event.event_type)
      ) {
        const hour = new Date(event.timestamp).getUTCHours();
        if (hour >= 23 || hour < 5) {
          alerts.push({
            alert_id: `ALT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            title: 'Sensitive Infrastructure Modification During Off-Hours',
            rule_id: rule.rule_id,
            rule_name: rule.name,
            mitre_attack_id: rule.mitre_id,
            severity: 'MEDIUM',
            risk_score: rule.base_score,
            confidence: 0.72,
            scoring_explanation: `Base score ${rule.base_score}/100 for off-hours operational deviation at ${hour}:00 UTC.`,
            explanation: `Sensitive action '${event.event_type}' was performed at ${hour}:00 UTC outside standard operational baseline.`,
            target_account: event.account,
            target_host: event.host,
            source_ip: event.source_ip,
            triggering_event_id: event.event_id,
            evidence: [{ event_id: event.event_id, timestamp: event.timestamp }],
            status: 'OPEN',
            created_at: new Date().toISOString(),
          });
          rule.last_triggered = new Date().toISOString();
        }
      }

      // Rule 5: Event Burst Detection
      if (rule.rule_id === 'RS-VOL-005') {
        const windowMs = 60 * 1000;
        const burstThreshold = rule.threshold || 12;
        const sameIpEvents = history.filter(
          (e) =>
            e.source_ip === event.source_ip &&
            Math.abs(eventTime - new Date(e.timestamp).getTime()) <= windowMs
        );
        const total = sameIpEvents.length + 1;
        if (total >= burstThreshold) {
          const score = Math.min(92, rule.base_score + (total - burstThreshold) * 2);
          alerts.push({
            alert_id: `ALT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            title: 'Automated Event Volume Burst Detected',
            rule_id: rule.rule_id,
            rule_name: rule.name,
            mitre_attack_id: rule.mitre_id,
            severity: 'HIGH',
            risk_score: score,
            confidence: 0.85,
            scoring_explanation: `Base score ${rule.base_score} + ${(total - burstThreshold) * 2} pts for ${total} rapid requests in 60s.`,
            explanation: `High-frequency event surge of ${total} telemetry records observed from IP '${event.source_ip}' within 60 seconds.`,
            target_account: event.account,
            target_host: event.host,
            source_ip: event.source_ip,
            triggering_event_id: event.event_id,
            evidence: [event, ...sameIpEvents].slice(0, 8).map((e) => ({
              event_id: e.event_id,
              timestamp: e.timestamp,
            })),
            status: 'OPEN',
            created_at: new Date().toISOString(),
          });
          rule.last_triggered = new Date().toISOString();
        }
      }
    }

    return alerts;
  }
}
