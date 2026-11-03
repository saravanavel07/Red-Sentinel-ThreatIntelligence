"""
RedSentinel Deterministic Detection Rules Engine
Explainable security detection logic without opaque black-box decisions.
"""
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

class DetectionRule:
    """Base class for all RedSentinel detection rules."""
    rule_id: str = "RS-BASE-000"
    name: str = "Base Detection Rule"
    description: str = "Base rule class"
    default_severity: str = "MEDIUM"
    base_score: int = 50
    mitre_attack_id: str = "T0000"

    def __init__(self, enabled: bool = True, custom_threshold: Optional[int] = None):
        self.enabled = enabled
        self.custom_threshold = custom_threshold

    def evaluate(self, current_event: Dict[str, Any], historical_events: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Evaluate rule against current event and historical context."""
        raise NotImplementedError("Subclasses must implement evaluate()")


class Rule1RepeatedAuthFailures(DetectionRule):
    """
    RS-AUTH-001: Repeated Authentication Failures.
    Detects N failed sign-in attempts within a configurable window (default: 5 failures within 5 mins).
    MITRE ATT&CK: T1110 (Brute Force).
    """
    rule_id = "RS-AUTH-001"
    name = "Repeated Authentication Failures"
    description = "Multiple failed authentication attempts detected for the same account or source IP."
    default_severity = "HIGH"
    base_score = 75
    mitre_attack_id = "T1110"

    def __init__(self, threshold: int = 5, window_minutes: int = 5, enabled: bool = True):
        super().__init__(enabled=enabled, custom_threshold=threshold)
        self.threshold = threshold
        self.window_minutes = window_minutes

    def evaluate(self, current_event: Dict[str, Any], historical_events: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not self.enabled:
            return None

        if current_event.get('event_type') != 'auth.failure':
            return None

        target_account = current_event.get('account')
        target_ip = current_event.get('source_ip')
        
        try:
            curr_time = datetime.fromisoformat(current_event['timestamp'].replace('Z', '+00:00'))
        except Exception:
            curr_time = datetime.now(timezone.utc)

        window_start = curr_time - timedelta(minutes=self.window_minutes)

        matching_failures = [current_event]
        for ev in historical_events:
            if ev.get('event_type') == 'auth.failure':
                if ev.get('account') == target_account or ev.get('source_ip') == target_ip:
                    try:
                        ev_time = datetime.fromisoformat(ev['timestamp'].replace('Z', '+00:00'))
                        if window_start <= ev_time <= curr_time:
                            matching_failures.append(ev)
                    except Exception:
                        continue

        if len(matching_failures) >= self.threshold:
            return {
                'rule_id': self.rule_id,
                'name': self.name,
                'severity': self.default_severity,
                'mitre_id': self.mitre_attack_id,
                'risk_score': min(95, self.base_score + (len(matching_failures) - self.threshold) * 3),
                'confidence': 0.92,
                'explanation': (
                    f"Account '{target_account}' observed {len(matching_failures)} failed logins "
                    f"from IP '{target_ip}' within {self.window_minutes} minutes, exceeding threshold of {self.threshold}."
                ),
                'evidence': [
                    {'event_id': e.get('event_id'), 'timestamp': e.get('timestamp'), 'ip': e.get('source_ip')}
                    for e in matching_failures[:10]
                ]
            }
        return None


class Rule2SuspiciousLoginSequence(DetectionRule):
    """
    RS-AUTH-002: Suspicious Login Sequence.
    Detects repeated failures followed by a successful login for the same account.
    MITRE ATT&CK: T1078 (Valid Accounts / Password Spray / Brute Force Success).
    """
    rule_id = "RS-AUTH-002"
    name = "Suspicious Login Sequence"
    description = "Repeated failed authentication attempts followed immediately by a successful login."
    default_severity = "CRITICAL"
    base_score = 90
    mitre_attack_id = "T1078"

    def __init__(self, failure_threshold: int = 3, lookback_minutes: int = 15, enabled: bool = True):
        super().__init__(enabled=enabled, custom_threshold=failure_threshold)
        self.failure_threshold = failure_threshold
        self.lookback_minutes = lookback_minutes

    def evaluate(self, current_event: Dict[str, Any], historical_events: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not self.enabled:
            return None

        # Triggered only when the current event is a SUCCESS
        if current_event.get('event_type') != 'auth.success':
            return None

        account = current_event.get('account')
        try:
            curr_time = datetime.fromisoformat(current_event['timestamp'].replace('Z', '+00:00'))
        except Exception:
            curr_time = datetime.now(timezone.utc)

        lookback_time = curr_time - timedelta(minutes=self.lookback_minutes)

        preceding_failures = []
        for ev in historical_events:
            if ev.get('account') == account and ev.get('event_type') == 'auth.failure':
                try:
                    ev_time = datetime.fromisoformat(ev['timestamp'].replace('Z', '+00:00'))
                    if lookback_time <= ev_time <= curr_time:
                        preceding_failures.append(ev)
                except Exception:
                    continue

        if len(preceding_failures) >= self.failure_threshold:
            return {
                'rule_id': self.rule_id,
                'name': self.name,
                'severity': self.default_severity,
                'mitre_id': self.mitre_attack_id,
                'risk_score': 94,
                'confidence': 0.95,
                'explanation': (
                    f"Account '{account}' experienced {len(preceding_failures)} authentication failures "
                    f"within {self.lookback_minutes} minutes immediately followed by a successful login from IP '{current_event.get('source_ip')}'."
                ),
                'evidence': [
                    {'event_id': current_event.get('event_id'), 'type': 'auth.success', 'ip': current_event.get('source_ip')},
                    *[{'event_id': f.get('event_id'), 'type': 'auth.failure', 'ip': f.get('source_ip')} for f in preceding_failures[:5]]
                ]
            }
        return None


class Rule3PrivilegeChangeMonitoring(DetectionRule):
    """
    RS-IAM-003: Unexpected Privilege Change Monitoring.
    Detects IAM role modifications, administrator privilege additions, or access key creations.
    MITRE ATT&CK: T1098 (Account Manipulation).
    """
    rule_id = "RS-IAM-003"
    name = "Privilege Change Monitoring"
    description = "Administrative privilege escalation, role modification, or new API credentials created."
    default_severity = "HIGH"
    base_score = 82
    mitre_attack_id = "T1098"

    PRIVILEGED_TYPES = {
        'iam.privilege_escalation',
        'iam.role_modified',
        'iam.key_created',
        'audit.policy_tamper'
    }

    def evaluate(self, current_event: Dict[str, Any], historical_events: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not self.enabled:
            return None

        ev_type = current_event.get('event_type')
        if ev_type not in self.PRIVILEGED_TYPES:
            return None

        account = current_event.get('account')
        details = current_event.get('normalized_event', {}).get('details', {})

        return {
            'rule_id': self.rule_id,
            'name': self.name,
            'severity': self.default_severity,
            'mitre_id': self.mitre_attack_id,
            'risk_score': self.base_score,
            'confidence': 0.88,
            'explanation': (
                f"Privileged IAM activity detected: '{ev_type}' initiated by '{account}'. "
                f"Action alters access controls or generates persistent credentials."
            ),
            'evidence': [
                {'event_id': current_event.get('event_id'), 'account': account, 'details': details}
            ]
        }


class Rule4UnusualActivityTime(DetectionRule):
    """
    RS-TIME-004: Unusual Activity Time.
    Identifies high-severity cloud or administrative operations during off-hours (default: 23:00 - 05:00 UTC).
    MITRE ATT&CK: T1078.004 (Cloud Accounts).
    """
    rule_id = "RS-TIME-004"
    name = "Unusual Activity Time"
    description = "Sensitive or privileged actions executed outside standard business operating hours."
    default_severity = "MEDIUM"
    base_score = 58
    mitre_attack_id = "T1078.004"

    def __init__(self, off_hours_start: int = 23, off_hours_end: int = 5, enabled: bool = True):
        super().__init__(enabled=enabled)
        self.off_hours_start = off_hours_start
        self.off_hours_end = off_hours_end

    def evaluate(self, current_event: Dict[str, Any], historical_events: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not self.enabled:
            return None

        # Filter for sensitive event types only
        sensitive_types = {'iam.privilege_escalation', 'iam.role_modified', 'cloud.security_group_opened', 'cloud.storage_public'}
        if current_event.get('event_type') not in sensitive_types:
            return None

        try:
            curr_time = datetime.fromisoformat(current_event['timestamp'].replace('Z', '+00:00'))
            hour = curr_time.hour
        except Exception:
            return None

        is_off_hour = False
        if self.off_hours_start > self.off_hours_end:
            is_off_hour = (hour >= self.off_hours_start or hour < self.off_hours_end)
        else:
            is_off_hour = (self.off_hours_start <= hour < self.off_hours_end)

        if is_off_hour:
            return {
                'rule_id': self.rule_id,
                'name': self.name,
                'severity': self.default_severity,
                'mitre_id': self.mitre_attack_id,
                'risk_score': self.base_score,
                'confidence': 0.70,
                'explanation': (
                    f"Sensitive action '{current_event.get('event_type')}' performed at {hour:02d}:00 UTC, "
                    f"which falls inside off-hours policy window ({self.off_hours_start:02d}:00 - {self.off_hours_end:02d}:00 UTC)."
                ),
                'evidence': [
                    {'event_id': current_event.get('event_id'), 'timestamp': current_event.get('timestamp')}
                ]
            }
        return None


class Rule5EventBurstDetection(DetectionRule):
    """
    RS-VOL-005: Event Burst Detection.
    Detects sudden increases in event volume (e.g. >= 12 events in 60s from the same host or IP).
    MITRE ATT&CK: T1499 (Endpoint Denial of Service / Automated Reconnaissance).
    """
    rule_id = "RS-VOL-005"
    name = "Event Burst Detection"
    description = "Abnormal volume spike exceeding baseline event ingestion frequency."
    default_severity = "HIGH"
    base_score = 72
    mitre_attack_id = "T1499"

    def __init__(self, burst_threshold: int = 12, window_seconds: int = 60, enabled: bool = True):
        super().__init__(enabled=enabled, custom_threshold=burst_threshold)
        self.burst_threshold = burst_threshold
        self.window_seconds = window_seconds

    def evaluate(self, current_event: Dict[str, Any], historical_events: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not self.enabled:
            return None

        source_ip = current_event.get('source_ip')
        try:
            curr_time = datetime.fromisoformat(current_event['timestamp'].replace('Z', '+00:00'))
        except Exception:
            curr_time = datetime.now(timezone.utc)

        window_start = curr_time - timedelta(seconds=self.window_seconds)

        same_source_events = [current_event]
        for ev in historical_events:
            if ev.get('source_ip') == source_ip:
                try:
                    ev_time = datetime.fromisoformat(ev['timestamp'].replace('Z', '+00:00'))
                    if window_start <= ev_time <= curr_time:
                        same_source_events.append(ev)
                except Exception:
                    continue

        if len(same_source_events) >= self.burst_threshold:
            return {
                'rule_id': self.rule_id,
                'name': self.name,
                'severity': self.default_severity,
                'mitre_id': self.mitre_attack_id,
                'risk_score': min(92, self.base_score + (len(same_source_events) - self.burst_threshold) * 2),
                'confidence': 0.85,
                'explanation': (
                    f"Burst of {len(same_source_events)} telemetry events received from source '{source_ip}' "
                    f"within {self.window_seconds}s (limit: {self.burst_threshold}). Potential automated reconnaissance or scraping."
                ),
                'evidence': [
                    {'event_id': e.get('event_id'), 'timestamp': e.get('timestamp')} for e in same_source_events[:8]
                ]
            }
        return None


class Rule6SuspiciousEventCorrelation(DetectionRule):
    """
    RS-CORR-006: Multi-Signal Security Event Correlation.
    Correlates multiple distinct alert types sharing the same account or infrastructure host within a 1-hour window.
    MITRE ATT&CK: T1078 + T1098.
    """
    rule_id = "RS-CORR-006"
    name = "Suspicious Event Correlation"
    description = "Correlated cluster of distinct suspicious activities tied to the same identity or resource."
    default_severity = "CRITICAL"
    base_score = 92
    mitre_attack_id = "T1078"

    def __init__(self, window_hours: int = 1, enabled: bool = True):
        super().__init__(enabled=enabled)
        self.window_hours = window_hours

    def evaluate(self, current_event: Dict[str, Any], historical_events: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not self.enabled:
            return None

        account = current_event.get('account')
        host = current_event.get('host')
        if not account and not host:
            return None

        try:
            curr_time = datetime.fromisoformat(current_event['timestamp'].replace('Z', '+00:00'))
        except Exception:
            curr_time = datetime.now(timezone.utc)

        window_start = curr_time - timedelta(hours=self.window_hours)

        related_types = {current_event.get('event_type')}
        correlated_events = [current_event]

        for ev in historical_events:
            ev_account = ev.get('account')
            ev_host = ev.get('host')
            
            if (account and ev_account == account) or (host and ev_host == host):
                try:
                    ev_time = datetime.fromisoformat(ev['timestamp'].replace('Z', '+00:00'))
                    if window_start <= ev_time <= curr_time:
                        ev_type = ev.get('event_type')
                        if ev_type not in related_types:
                            related_types.add(ev_type)
                            correlated_events.append(ev)
                except Exception:
                    continue

        if len(related_types) >= 3:
            return {
                'rule_id': self.rule_id,
                'name': self.name,
                'severity': self.default_severity,
                'mitre_id': self.mitre_attack_id,
                'risk_score': 95,
                'confidence': 0.94,
                'explanation': (
                    f"High-confidence correlation: Account/Host '{account or host}' exhibits {len(related_types)} "
                    f"distinct suspicious behavioral categories ({', '.join(sorted(list(related_types)))}) within {self.window_hours} hour(s)."
                ),
                'evidence': [
                    {'event_id': e.get('event_id'), 'type': e.get('event_type'), 'ts': e.get('timestamp')}
                    for e in correlated_events
                ]
            }
        return None
