"""
RedSentinel Incident Correlation Engine
Aggregates related alerts and events by entity, timeframe, and attack progression.
"""
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone

class IncidentCorrelator:
    """Correlates alerts into structured security incidents."""

    @classmethod
    def correlate_alerts(cls, new_alert: Dict[str, Any], existing_incidents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Check if the alert correlates with an existing open incident (by account or host).
        If matched, appends the alert to the incident and recalculates overall severity.
        Otherwise, creates a new Incident record.
        """
        target_account = new_alert.get('target_account')
        target_host = new_alert.get('target_host')

        for inc in existing_incidents:
            if inc.get('status') in ['CLOSED', 'RESOLVED']:
                continue

            # Match on account or host
            account_match = target_account and inc.get('primary_account') == target_account
            host_match = target_host and inc.get('primary_host') == target_host

            if account_match or host_match:
                # Correlate into existing incident
                inc['alerts'].append(new_alert)
                # Escalate score if higher
                if new_alert['risk_score'] > inc['risk_score']:
                    inc['risk_score'] = new_alert['risk_score']
                    inc['severity'] = new_alert['severity']
                inc['updated_at'] = datetime.now(timezone.utc).isoformat()
                return {
                    'action': 'UPDATED',
                    'incident': inc
                }

        # Create fresh incident
        inc_id = f"INC-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
        new_incident = {
            'incident_id': inc_id,
            'title': f"Potential Compromise: {new_alert.get('rule_name')} on {target_account or target_host}",
            'description': new_alert.get('explanation'),
            'primary_account': target_account,
            'primary_host': target_host,
            'source_ip': new_alert.get('source_ip'),
            'severity': new_alert.get('severity', 'MEDIUM'),
            'risk_score': new_alert.get('risk_score', 50),
            'status': 'OPEN',
            'review_status': 'PENDING_TRIAGE',
            'alerts': [new_alert],
            'related_events': [new_alert.get('triggering_event_id')],
            'analyst_notes': [],
            'ai_triage_report': None,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }
        return {
            'action': 'CREATED',
            'incident': new_incident
        }
