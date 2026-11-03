"""
Unit tests for RedSentinel LangGraph Incident Triage State Machine
"""
import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from triage.workflow import RedSentinelTriageGraph
from triage.nodes import node_1_input_validation
from triage.guardrails import VerificationGuardrail

class TestLangGraphWorkflow(unittest.TestCase):
    def setUp(self):
        self.workflow = RedSentinelTriageGraph(max_retries=2)
        self.sample_incident = {
            'incident_id': 'INC-20261102-TEST01',
            'title': 'Suspicious Login Sequence on admin@internal',
            'severity': 'CRITICAL',
            'risk_score': 92,
            'primary_account': 'admin@internal',
            'primary_host': 'bastion-01',
            'alerts': [
                {
                    'rule_id': 'RS-AUTH-002',
                    'title': 'Suspicious Login Sequence',
                    'severity': 'CRITICAL',
                    'risk_score': 92,
                    'explanation': 'Repeated failures followed by success.',
                    'source_ip': '198.51.100.22',
                    'evidence': [{'event_id': 'ev-1'}, {'event_id': 'ev-2'}]
                }
            ]
        }

    def test_full_workflow_execution(self):
        initial_state = {'incident_data': self.sample_incident}
        final_state = self.workflow.run(initial_state)

        self.assertTrue(final_state.get('input_valid'))
        self.assertEqual(final_state.get('workflow_status'), 'READY_FOR_HUMAN_REVIEW')
        self.assertIn('final_report', final_state)
        report = final_state['final_report']
        self.assertEqual(report['incident_id'], 'INC-20261102-TEST01')
        self.assertTrue(len(report['recommendations']) > 0)
        self.assertTrue(report['human_approval_required'])

    def test_input_validation_failure(self):
        bad_state = {'incident_data': {}}
        res = node_1_input_validation(bad_state)
        self.assertFalse(res['input_valid'])

    def test_guardrail_catches_exaggeration(self):
        evidence = [{'id': 1}]
        bad_summary = "We detected an Advanced Persistent Threat (APT) confirmed with 100% certainty."
        recs = [{'step': 1}]
        passed, msg = VerificationGuardrail.verify(evidence, bad_summary, recs)
        self.assertFalse(passed)
        self.assertIn("Flagged sensational claim", msg)

if __name__ == '__main__':
    unittest.main()
