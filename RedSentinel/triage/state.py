"""
RedSentinel LangGraph Triage State Schema
Defines the shared typed state dictionary passed across all 8 triage workflow nodes.
"""
from typing import TypedDict, List, Dict, Any, Optional

class TriageState(TypedDict, total=False):
    # Node 1 Inputs
    incident_id: str
    incident_data: Dict[str, Any]
    input_valid: bool
    validation_error: Optional[str]

    # Node 2 Context Enrichment
    context_events: List[Dict[str, Any]]
    detection_rule_context: Dict[str, Any]
    target_account: str
    target_host: str
    timeline_summary: str

    # Node 3 Evidence Analysis
    evidence_items: List[Dict[str, Any]]
    key_findings: List[str]
    attack_indicators: List[str]

    # Node 4 Risk Assessment
    advisory_severity: str
    advisory_risk_score: int
    confidence_score: float
    risk_rationale: str

    # Node 5 Threat Summary
    threat_summary: str
    what_happened: str
    why_flagged: str
    supporting_evidence_text: str
    uncertainties: List[str]

    # Node 6 Defensive Recommendations
    defensive_recommendations: List[Dict[str, Any]]
    recommended_containment_steps: List[str]

    # Node 7 Verification & Anti-Hallucination
    verification_passed: bool
    verification_notes: str
    retry_count: int
    max_retries: int

    # Node 8 Human Review
    human_approved: bool
    analyst_action: str
    analyst_modifications: Optional[str]
    final_report: Dict[str, Any]
    workflow_status: str
