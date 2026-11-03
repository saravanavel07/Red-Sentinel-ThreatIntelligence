"""
RedSentinel Transparent Risk Scoring Engine
Calculates explainable risk scores (0-100) separating Risk, Severity, and Confidence.
"""
from typing import Dict, Any, List

SEVERITY_TIERS = {
    'INFORMATIONAL': (0, 24),
    'LOW': (25, 49),
    'MEDIUM': (50, 74),
    'HIGH': (75, 89),
    'CRITICAL': (90, 100),
}

def score_to_severity(score: int) -> str:
    """Map numeric risk score (0-100) to standard severity label."""
    if score >= 90:
        return 'CRITICAL'
    elif score >= 75:
        return 'HIGH'
    elif score >= 50:
        return 'MEDIUM'
    elif score >= 25:
        return 'LOW'
    return 'INFORMATIONAL'

class RiskScoringEngine:
    """
    Transparent risk calculator combining:
    - Base rule severity
    - Number of corroborating signals/evidence
    - Sequence indicator (e.g. failure followed by success)
    - Asset criticality context
    """

    @classmethod
    def calculate(
        cls,
        base_score: int,
        evidence_count: int,
        is_sequence: bool = False,
        asset_criticality: str = 'NORMAL',
        confidence: float = 0.85
    ) -> Dict[str, Any]:
        """
        Compute calculated risk score and explain the contributing factors.
        """
        # Clamp base score
        score = max(0, min(100, base_score))

        # Adjust for evidence volume
        evidence_boost = min(15, max(0, (evidence_count - 1) * 2))

        # Sequence modifier (e.g., successful exploitation following failed probes)
        sequence_boost = 10 if is_sequence else 0

        # Criticality modifier
        criticality_multipliers = {
            'LOW': -5,
            'NORMAL': 0,
            'HIGH': 5,
            'CRITICAL': 10
        }
        criticality_adjustment = criticality_multipliers.get(asset_criticality.upper(), 0)

        final_score = max(0, min(100, score + evidence_boost + sequence_boost + criticality_adjustment))
        derived_severity = score_to_severity(final_score)

        return {
            'risk_score': final_score,
            'severity': derived_severity,
            'confidence': round(min(0.99, max(0.1, confidence)), 2),
            'factors': {
                'base_score': score,
                'evidence_boost': evidence_boost,
                'sequence_boost': sequence_boost,
                'criticality_adjustment': criticality_adjustment,
                'asset_criticality': asset_criticality,
                'evidence_count': evidence_count,
            },
            'explanation': (
                f"Risk score {final_score}/100 ({derived_severity}) determined from base rule score ({score}), "
                f"+{evidence_boost} pts for {evidence_count} corroborating events"
                f"{', +10 pts for suspicious sequence progression' if is_sequence else ''}"
                f"{f', {criticality_adjustment:+d} pts asset criticality' if criticality_adjustment != 0 else ''}."
            )
        }
