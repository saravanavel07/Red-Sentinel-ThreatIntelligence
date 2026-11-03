"""
RedSentinel LangGraph Triage Nodes
Implementation of the 8 modular workflow nodes for cyber incident triage.
"""
from typing import Dict, Any, List
import copy
from .state import TriageState
from .guardrails import VerificationGuardrail

def node_1_input_validation(state: TriageState) -> Dict[str, Any]:
    """Node 1: Validate incoming incident structure."""
    incident = state.get('incident_data', {})
    if not incident or not isinstance(incident, dict):
        return {
            'input_valid': False,
            'validation_error': "Malformed incident payload: missing incident dictionary.",
            'workflow_status': 'FAILED_INPUT_VALIDATION'
        }

    inc_id = incident.get('incident_id')
    if not inc_id:
        return {
            'input_valid': False,
            'validation_error': "Invalid incident: missing 'incident_id'.",
            'workflow_status': 'FAILED_INPUT_VALIDATION'
        }

    return {
        'incident_id': inc_id,
        'input_valid': True,
        'validation_error': None,
        'workflow_status': 'VALIDATED'
    }


def node_2_event_context(state: TriageState) -> Dict[str, Any]:
    """Node 2: Enrich incident with related events, host context, and rule definitions."""
    incident = state.get('incident_data', {})
    alerts = incident.get('alerts', [])
    related_events = incident.get('related_events', [])

    account = incident.get('primary_account', 'Unknown Identity')
    host = incident.get('primary_host', 'Unknown Host')

    # Build chronological timeline context
    timeline_entries = []
    for a in alerts:
        timeline_entries.append(
            f"[{a.get('created_at', 'N/A')}] Alert {a.get('rule_id')}: {a.get('title')} ({a.get('severity')})"
        )

    timeline_summary = "\n".join(timeline_entries) or "Single alert incident."

    return {
        'target_account': account,
        'target_host': host,
        'timeline_summary': timeline_summary,
        'detection_rule_context': {
            'alert_count': len(alerts),
            'rule_ids': [a.get('rule_id') for a in alerts],
            'highest_rule_severity': incident.get('severity', 'MEDIUM')
        },
        'workflow_status': 'CONTEXT_ENRICHED'
    }


def node_3_evidence_analysis(state: TriageState) -> Dict[str, Any]:
    """Node 3: Analyze concrete telemetry evidence without hallucination."""
    incident = state.get('incident_data', {})
    alerts = incident.get('alerts', [])

    collected_evidence: List[Dict[str, Any]] = []
    key_findings: List[str] = []
    attack_indicators: List[str] = []

    for alert in alerts:
        rule_id = alert.get('rule_id', '')
        ev_list = alert.get('evidence', [])
        collected_evidence.extend(ev_list)

        if 'AUTH' in rule_id:
            key_findings.append(f"Authentication anomaly: {alert.get('explanation')}")
            if alert.get('source_ip'):
                attack_indicators.append(f"Source IP: {alert.get('source_ip')}")
        elif 'IAM' in rule_id:
            key_findings.append(f"IAM entitlement alteration: {alert.get('explanation')}")
            attack_indicators.append("Privilege escalation vector")
        elif 'VOL' in rule_id:
            key_findings.append(f"Volume surge: {alert.get('explanation')}")
            attack_indicators.append("Automated burst activity")
        else:
            key_findings.append(f"Correlated activity: {alert.get('explanation')}")

    if not key_findings:
        key_findings.append("No anomalous events matched known attack signatures.")

    return {
        'evidence_items': collected_evidence,
        'key_findings': key_findings,
        'attack_indicators': list(set(attack_indicators)),
        'workflow_status': 'EVIDENCE_ANALYZED'
    }


def node_4_risk_assessment(state: TriageState) -> Dict[str, Any]:
    """Node 4: Advisory risk assessment anchored by deterministic rules."""
    incident = state.get('incident_data', {})
    deterministic_score = incident.get('risk_score', 50)
    deterministic_severity = incident.get('severity', 'MEDIUM')

    evidence_count = len(state.get('evidence_items', []))
    findings_count = len(state.get('key_findings', []))

    # Calculate advisory score without violating deterministic baseline
    advisory_score = min(100, max(deterministic_score, deterministic_score + (findings_count > 2) * 5))
    confidence = min(0.96, 0.70 + (evidence_count * 0.04))

    rationale = (
        f"Grounded in deterministic detection score ({deterministic_score}/100, {deterministic_severity}). "
        f"Synthesized across {evidence_count} telemetry evidence items and {findings_count} observable signals."
    )

    return {
        'advisory_severity': deterministic_severity,
        'advisory_risk_score': advisory_score,
        'confidence_score': round(confidence, 2),
        'risk_rationale': rationale,
        'workflow_status': 'RISK_ASSESSED'
    }


def node_5_threat_summary(state: TriageState) -> Dict[str, Any]:
    """Node 5: Generate clear, professional analyst-readable threat summary."""
    account = state.get('target_account', 'the account')
    host = state.get('target_host', 'the targeted host')
    findings = state.get('key_findings', [])
    indicators = state.get('attack_indicators', [])

    what_happened = (
        f"Suspicious activity was identified targeting identity '{account}' on host '{host}'. "
        + " ".join(findings[:2])
    )
    why_flagged = (
        f"Observed telemetry matched RedSentinel defensive rules for suspicious operational behavior, "
        f"including indicators: {', '.join(indicators) if indicators else 'unusual telemetry patterns'}."
    )
    supporting_evidence_text = f"Validated against {len(state.get('evidence_items', []))} log records."
    
    uncertainties = [
        "Whether activity corresponds to authorized penetration testing or scheduled maintenance.",
        "Full downstream impact on adjoining cloud microservices."
    ]

    full_summary = f"{what_happened}\n\nWhy flagged: {why_flagged}"

    return {
        'threat_summary': full_summary,
        'what_happened': what_happened,
        'why_flagged': why_flagged,
        'supporting_evidence_text': supporting_evidence_text,
        'uncertainties': uncertainties,
        'workflow_status': 'SUMMARY_GENERATED'
    }


def node_6_defensive_recommendations(state: TriageState) -> Dict[str, Any]:
    """Node 6: Generate prioritized, defensive investigation recommendations."""
    account = state.get('target_account')
    severity = state.get('advisory_severity', 'MEDIUM')

    recommendations = [
        {
            'step': 1,
            'priority': 'HIGH' if severity in ['HIGH', 'CRITICAL'] else 'MEDIUM',
            'action': f"Audit recent sign-in history and MFA status for account '{account}'.",
            'category': 'Identity Verification'
        },
        {
            'step': 2,
            'priority': 'HIGH',
            'action': "Verify whether recent role assignments or access key creations were change-ticket approved.",
            'category': 'Privilege Audit'
        },
        {
            'step': 3,
            'priority': 'MEDIUM',
            'action': "Inspect network flow logs for egress anomalies from related source IP addresses.",
            'category': 'Network Perimeter'
        },
        {
            'step': 4,
            'priority': 'LOW',
            'action': "Contact the identity owner through an out-of-band communication channel to confirm activity.",
            'category': 'Analyst Outreach'
        }
    ]

    containment_steps = [
        "Revoke active temporary IAM session tokens for the affected account if unconfirmed.",
        "Temporarily restrict inbound traffic from identified offending IP addresses.",
        "Rotate affected cloud access credentials."
    ]

    return {
        'defensive_recommendations': recommendations,
        'recommended_containment_steps': containment_steps,
        'workflow_status': 'RECOMMENDATIONS_READY'
    }


def node_7_verification(state: TriageState) -> Dict[str, Any]:
    """Node 7: Anti-hallucination verification of the analysis."""
    evidence = state.get('evidence_items', [])
    summary = state.get('threat_summary', '')
    recs = state.get('defensive_recommendations', [])

    passed, message = VerificationGuardrail.verify(evidence, summary, recs)
    current_retries = state.get('retry_count', 0)
    max_retries = state.get('max_retries', 2)

    return {
        'verification_passed': passed,
        'verification_notes': message,
        'retry_count': current_retries + (0 if passed else 1),
        'workflow_status': 'VERIFIED' if passed else 'VERIFICATION_RETRY'
    }


def node_8_human_review(state: TriageState) -> Dict[str, Any]:
    """Node 8: Human analyst checkpoint for approval, modification, or escalation."""
    incident_id = state.get('incident_id', 'INC-UNKNOWN')
    
    # Assembling the comprehensive triage report
    final_report = {
        'incident_id': incident_id,
        'status': 'TRIAGE_COMPLETE',
        'severity': state.get('advisory_severity'),
        'risk_score': state.get('advisory_risk_score'),
        'confidence': state.get('confidence_score'),
        'what_happened': state.get('what_happened'),
        'why_flagged': state.get('why_flagged'),
        'uncertainties': state.get('uncertainties'),
        'evidence_count': len(state.get('evidence_items', [])),
        'recommendations': state.get('defensive_recommendations'),
        'containment_steps': state.get('recommended_containment_steps'),
        'verification_notes': state.get('verification_notes'),
        'human_approval_required': state.get('advisory_severity') in ['HIGH', 'CRITICAL']
    }

    return {
        'final_report': final_report,
        'workflow_status': 'READY_FOR_HUMAN_REVIEW'
    }
