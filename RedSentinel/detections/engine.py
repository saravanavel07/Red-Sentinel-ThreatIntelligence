"""
RedSentinel Detection Pipeline Engine
Evaluates normalized security events across all registered explainable detection rules.
"""
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone

from .rules import (
    DetectionRule,
    Rule1RepeatedAuthFailures,
    Rule2SuspiciousLoginSequence,
    Rule3PrivilegeChangeMonitoring,
    Rule4UnusualActivityTime,
    Rule5EventBurstDetection,
    Rule6SuspiciousEventCorrelation,
)
from .scoring import RiskScoringEngine, score_to_severity

class DetectionEngine:
    """Orchestrates deterministic detection rule evaluation."""

    def __init__(self):
        self.rules: List[DetectionRule] = [
            Rule1RepeatedAuthFailures(),
            Rule2SuspiciousLoginSequence(),
            Rule3PrivilegeChangeMonitoring(),
            Rule4UnusualActivityTime(),
            Rule5EventBurstDetection(),
            Rule6SuspiciousEventCorrelation(),
        ]

    def get_rule(self, rule_id: str) -> Optional[DetectionRule]:
        for r in self.rules:
            if r.rule_id == rule_id:
                return r
        return None

    def toggle_rule(self, rule_id: str, enabled: bool) -> bool:
        r = self.get_rule(rule_id)
        if r:
            r.enabled = enabled
            return True
        return False

    def list_rules(self) -> List[Dict[str, Any]]:
        return [
            {
                'rule_id': r.rule_id,
                'name': r.name,
                'description': r.description,
                'default_severity': r.default_severity,
                'base_score': r.base_score,
                'mitre_id': r.mitre_attack_id,
                'enabled': r.enabled,
                'threshold': getattr(r, 'threshold', getattr(r, 'burst_threshold', getattr(r, 'failure_threshold', None)))
            }
            for r in self.rules
        ]

    def evaluate_event(
        self,
        current_event: Dict[str, Any],
        historical_events: List[Dict[str, Any]],
        asset_criticality: str = 'NORMAL'
    ) -> List[Dict[str, Any]]:
        """
        Runs all active detection rules against the current event and historical context.
        Returns a list of generated SecurityAlert objects.
        """
        generated_alerts = []

        for rule in self.rules:
            if not rule.enabled:
                continue

            try:
                match = rule.evaluate(current_event, historical_events)
                if match:
                    # Transparent risk calculation
                    evidence_list = match.get('evidence', [])
                    is_seq = rule.rule_id == 'RS-AUTH-002'
                    
                    scoring_result = RiskScoringEngine.calculate(
                        base_score=match.get('risk_score', rule.base_score),
                        evidence_count=len(evidence_list),
                        is_sequence=is_seq,
                        asset_criticality=asset_criticality,
                        confidence=match.get('confidence', 0.85)
                    )

                    alert_id = f"ALT-{str(uuid.uuid4())[:8].upper()}"
                    alert = {
                        'alert_id': alert_id,
                        'title': f"{rule.name} Detected",
                        'rule_id': rule.rule_id,
                        'rule_name': rule.name,
                        'mitre_attack_id': match.get('mitre_id', rule.mitre_attack_id),
                        'severity': scoring_result['severity'],
                        'risk_score': scoring_result['risk_score'],
                        'confidence': scoring_result['confidence'],
                        'scoring_explanation': scoring_result['explanation'],
                        'explanation': match.get('explanation'),
                        'target_account': current_event.get('account'),
                        'target_host': current_event.get('host'),
                        'source_ip': current_event.get('source_ip'),
                        'triggering_event_id': current_event.get('event_id'),
                        'evidence': evidence_list,
                        'status': 'OPEN',
                        'created_at': datetime.now(timezone.utc).isoformat()
                    }
                    generated_alerts.append(alert)
            except Exception as e:
                # Detection rules must fail gracefully without halting the pipeline
                print(f"[DetectionEngine Error] Rule {rule.rule_id} evaluation failed: {e}")
                continue

        return generated_alerts
