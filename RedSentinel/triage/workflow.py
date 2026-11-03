"""
RedSentinel LangGraph Incident Triage Orchestration Workflow
Compiles the 8-node state graph with conditional edges, retry safeguards, and human checkpoints.
"""
from typing import Dict, Any, Optional, Callable
from .state import TriageState
from .nodes import (
    node_1_input_validation,
    node_2_event_context,
    node_3_evidence_analysis,
    node_4_risk_assessment,
    node_5_threat_summary,
    node_6_defensive_recommendations,
    node_7_verification,
    node_8_human_review,
)

class RedSentinelTriageGraph:
    """
    Self-contained, production-grade State Machine and LangGraph runner.
    Provides deterministic conditional routing, retry limits, and fallback safety.
    """

    def __init__(self, max_retries: int = 2):
        self.max_retries = max_retries

    def run(self, initial_state: TriageState) -> TriageState:
        """
        Executes the 8-node triage graph step-by-step with conditional routing.
        """
        state = dict(initial_state)
        state['max_retries'] = self.max_retries
        state['retry_count'] = state.get('retry_count', 0)

        # Step 1: Input Validation
        res1 = node_1_input_validation(state)
        state.update(res1)
        if not state.get('input_valid'):
            state['workflow_status'] = 'TERMINATED_INVALID_INPUT'
            return state

        # Step 2: Event Context Enrichment
        res2 = node_2_event_context(state)
        state.update(res2)

        # Step 3: Evidence Analysis
        res3 = node_3_evidence_analysis(state)
        state.update(res3)

        # Step 4: Risk Assessment
        res4 = node_4_risk_assessment(state)
        state.update(res4)

        # Verification Loop with bounded retry
        while True:
            # Step 5: Threat Summary
            res5 = node_5_threat_summary(state)
            state.update(res5)

            # Step 6: Defensive Recommendations
            res6 = node_6_defensive_recommendations(state)
            state.update(res6)

            # Step 7: Verification Guardrail
            res7 = node_7_verification(state)
            state.update(res7)

            if state.get('verification_passed'):
                break

            if state.get('retry_count', 0) >= self.max_retries:
                # Terminate retry loop safely
                state['verification_notes'] += f" [Max retries ({self.max_retries}) reached. Applied fallback safe recommendations.]"
                break

        # Step 8: Human Review Checkpoint
        res8 = node_8_human_review(state)
        state.update(res8)

        return state


def build_langgraph_workflow():
    """
    Builds the workflow using the official LangGraph library when available.
    """
    try:
        from langgraph.graph import StateGraph, END

        workflow = StateGraph(TriageState)

        # Add all 8 nodes
        workflow.add_node("validate_input", node_1_input_validation)
        workflow.add_node("enrich_context", node_2_event_context)
        workflow.add_node("analyze_evidence", node_3_evidence_analysis)
        workflow.add_node("assess_risk", node_4_risk_assessment)
        workflow.add_node("generate_summary", node_5_threat_summary)
        workflow.add_node("generate_recommendations", node_6_defensive_recommendations)
        workflow.add_node("verify_guardrails", node_7_verification)
        workflow.add_node("human_review", node_8_human_review)

        # Routing conditionals
        def route_validation(state: TriageState):
            return "enrich_context" if state.get("input_valid") else END

        def route_verification(state: TriageState):
            if state.get("verification_passed"):
                return "human_review"
            if state.get("retry_count", 0) >= state.get("max_retries", 2):
                return "human_review"
            return "generate_summary"

        workflow.set_entry_point("validate_input")
        workflow.add_conditional_edges("validate_input", route_validation)
        workflow.add_edge("enrich_context", "analyze_evidence")
        workflow.add_edge("analyze_evidence", "assess_risk")
        workflow.add_edge("assess_risk", "generate_summary")
        workflow.add_edge("generate_summary", "generate_recommendations")
        workflow.add_edge("generate_recommendations", "verify_guardrails")
        workflow.add_conditional_edges("verify_guardrails", route_verification)
        workflow.add_edge("human_review", END)

        return workflow.compile()
    except ImportError:
        # LangGraph package not installed; fallback to self-contained engine
        return RedSentinelTriageGraph()
