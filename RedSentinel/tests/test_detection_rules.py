"""
Unit tests for RedSentinel Deterministic Detection Rules
"""
import unittest
import sys
import os
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from detections.rules import (
    Rule1RepeatedAuthFailures,
    Rule2SuspiciousLoginSequence,
    Rule3PrivilegeChangeMonitoring,
    Rule5EventBurstDetection,
)
from detections.engine import DetectionEngine

class TestDetectionRules(unittest.TestCase):
    def setUp(self):
        self.now = datetime.now(timezone.utc)
        self.engine = DetectionEngine()

    def test_rule1_repeated_auth_failures_trigger(self):
        rule = Rule1RepeatedAuthFailures(threshold=3, window_minutes=5)
        now_iso = self.now.isoformat()

        curr_event = {
            'event_id': 'ev-3',
            'event_type': 'auth.failure',
            'account': 'victim@corp.com',
            'source_ip': '203.0.113.1',
            'timestamp': now_iso
        }

        history = [
            {
                'event_id': 'ev-1',
                'event_type': 'auth.failure',
                'account': 'victim@corp.com',
                'source_ip': '203.0.113.1',
                'timestamp': (self.now - timedelta(minutes=1)).isoformat()
            },
            {
                'event_id': 'ev-2',
                'event_type': 'auth.failure',
                'account': 'victim@corp.com',
                'source_ip': '203.0.113.1',
                'timestamp': (self.now - timedelta(minutes=2)).isoformat()
            }
        ]

        result = rule.evaluate(curr_event, history)
        self.assertIsNotNone(result)
        self.assertEqual(result['rule_id'], 'RS-AUTH-001')
        self.assertGreaterEqual(result['risk_score'], 75)

    def test_rule2_suspicious_login_sequence(self):
        rule = Rule2SuspiciousLoginSequence(failure_threshold=2, lookback_minutes=10)
        curr_event = {
            'event_id': 'ev-success',
            'event_type': 'auth.success',
            'account': 'target-user',
            'source_ip': '198.51.100.99',
            'timestamp': self.now.isoformat()
        }
        history = [
            {'event_id': 'ev-f1', 'event_type': 'auth.failure', 'account': 'target-user', 'timestamp': (self.now - timedelta(minutes=1)).isoformat()},
            {'event_id': 'ev-f2', 'event_type': 'auth.failure', 'account': 'target-user', 'timestamp': (self.now - timedelta(minutes=2)).isoformat()},
        ]
        result = rule.evaluate(curr_event, history)
        self.assertIsNotNone(result)
        self.assertEqual(result['rule_id'], 'RS-AUTH-002')
        self.assertEqual(result['severity'], 'CRITICAL')

    def test_rule3_privilege_escalation(self):
        rule = Rule3PrivilegeChangeMonitoring()
        curr_event = {
            'event_id': 'ev-iam',
            'event_type': 'iam.privilege_escalation',
            'account': 'compromised-account',
            'timestamp': self.now.isoformat()
        }
        result = rule.evaluate(curr_event, [])
        self.assertIsNotNone(result)
        self.assertEqual(result['rule_id'], 'RS-IAM-003')

    def test_rule5_event_burst(self):
        rule = Rule5EventBurstDetection(burst_threshold=5, window_seconds=30)
        curr_event = {
            'event_id': 'ev-curr',
            'event_type': 'api.call',
            'source_ip': '1.2.3.4',
            'timestamp': self.now.isoformat()
        }
        history = [
            {'event_id': f'ev-h-{i}', 'source_ip': '1.2.3.4', 'timestamp': (self.now - timedelta(seconds=i*2)).isoformat()}
            for i in range(1, 6)
        ]
        result = rule.evaluate(curr_event, history)
        self.assertIsNotNone(result)
        self.assertEqual(result['rule_id'], 'RS-VOL-005')

if __name__ == '__main__':
    unittest.main()
