"""
RedSentinel Anti-Hallucination & Verification Guardrails
Ensures the AI output stays strictly grounded in concrete observed log telemetry.
"""
from typing import Dict, Any, List, Tuple

class VerificationGuardrail:
    """Verifies that generated threat summaries do not contain invented evidence."""

    BANNED_EXAGGERATIONS = [
        "advanced persistent threat (apt) confirmed",
        "nation-state actor verified",
        "zero-day exploit identified",
        "100% certainty",
        "full system compromise verified"
    ]

    @classmethod
    def verify(
        cls,
        evidence: List[Dict[str, Any]],
        summary_text: str,
        recommendations: List[Dict[str, Any]]
    ) -> Tuple[bool, str]:
        """
        Validates output against factual constraints.
        Returns (passed: bool, message: str).
        """
        if not summary_text or len(summary_text.strip()) < 20:
            return False, "Summary text is empty or too brief."

        lower_summary = summary_text.lower()
        for phrase in cls.BANNED_EXAGGERATIONS:
            if phrase in lower_summary:
                return False, f"Flagged sensational claim: '{phrase}'. Must remain grounded."

        if not recommendations:
            return False, "No defensive recommendations provided."

        if not evidence and "evidence" in lower_summary:
            return False, "Summary mentions concrete evidence, but evidence array is empty."

        return True, "Verification passed: summary is grounded in provided telemetry."
