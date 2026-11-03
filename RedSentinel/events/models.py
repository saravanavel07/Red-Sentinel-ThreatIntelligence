"""
RedSentinel SecurityEvent Django Models
Defines persistent schema for raw and normalized security event telemetry.
"""
from typing import Dict, Any

try:
    from django.db import models
    from django.utils import timezone
except ImportError:
    # Dummy models layer when Django is not installed in the execution environment
    class models:
        class Model:
            pass
        class CharField:
            def __init__(self, *args, **kwargs): pass
        class DateTimeField:
            def __init__(self, *args, **kwargs): pass
        class JSONField:
            def __init__(self, *args, **kwargs): pass
        class IntegerField:
            def __init__(self, *args, **kwargs): pass
        class BooleanField:
            def __init__(self, *args, **kwargs): pass
        class ForeignKey:
            def __init__(self, *args, **kwargs): pass
        CASCADE = None

class SecurityEvent(models.Model):
    """Normalized security log telemetry record."""
    SEVERITY_CHOICES = [
        ('INFORMATIONAL', 'Informational'),
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]

    event_id = models.CharField(max_length=64, primary_key=True)
    timestamp = models.DateTimeField(db_index=True)
    event_type = models.CharField(max_length=128, db_index=True)
    source = models.CharField(max_length=64, default='cloudwatch')
    source_ip = models.CharField(max_length=45, db_index=True)
    host = models.CharField(max_length=128, db_index=True)
    account = models.CharField(max_length=128, db_index=True)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='INFORMATIONAL')
    raw_event = models.JSONField(default=dict)
    normalized_event = models.JSONField(default=dict)
    dedup_hash = models.CharField(max_length=64, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            # In Django: models.Index(fields=['account', 'timestamp']),
        ]

    def __str__(self):
        return f"[{self.severity}] {self.event_type} - {self.account} ({self.timestamp})"


class DetectionRuleModel(models.Model):
    """Detection rule configuration model."""
    rule_id = models.CharField(max_length=32, primary_key=True)
    name = models.CharField(max_length=128)
    description = models.TextField()
    severity = models.CharField(max_length=20, default='MEDIUM')
    threshold = models.IntegerField(default=5)
    enabled = models.BooleanField(default=True)
    mitre_attack_id = models.CharField(max_length=32, default='T1078')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.rule_id} - {self.name}"
