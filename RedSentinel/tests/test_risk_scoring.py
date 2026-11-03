"""
Unit tests for RedSentinel Risk Scoring
"""
import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from detections.scoring import RiskScoringEngine, score_to_severity

class TestRiskScoring(unittest.TestCase):
    def test_score_to_severity_tiers(self):
        self.assertEqual(score_to_severity(95), 'CRITICAL')
        self.assertEqual(score_to_severity(80), 'HIGH')
        self.assertEqual(score_to_severity(60), 'MEDIUM')
        self.assertEqual(score_to_severity(30), 'LOW')
        self.assertEqual(score_to_severity(10), 'INFORMATIONAL')

    def test_risk_scoring_factors(self):
        res = RiskScoringEngine.calculate(
            base_score=75,
            evidence_count=4,
            is_sequence=True,
            asset_criticality='CRITICAL',
            confidence=0.9
        )
        # 75 base + min(15, (4-1)*2=6) + 10 sequence + 10 criticality = 101 -> clamped to 100
        self.assertEqual(res['risk_score'], 100)
        self.assertEqual(res['severity'], 'CRITICAL')
        self.assertTrue('explanation' in res)

    def test_risk_score_bounds(self):
        low = RiskScoringEngine.calculate(base_score=5, evidence_count=1, asset_criticality='LOW')
        self.assertGreaterEqual(low['risk_score'], 0)
        self.assertLessEqual(low['risk_score'], 100)

if __name__ == '__main__':
    unittest.main()
