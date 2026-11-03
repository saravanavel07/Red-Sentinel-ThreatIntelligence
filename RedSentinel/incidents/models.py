"""
RedSentinel Incident Management & Audit Django Models
Provides auditable incident response, analyst notes, and activity logging.
"""
try:
    from django.db import models
    from django.contrib.auth.models import User
except ImportError:
    class models:
        class Model: pass
        class CharField:
            def __init__(self, *args, **kwargs): pass
        class TextField:
            def __init__(self, *args, **kwargs): pass
        class IntegerField:
            def __init__(self, *args, **kwargs): pass
        class FloatField:
            def __init__(self, *args, **kwargs): pass
        class DateTimeField:
            def __init__(self, *args, **kwargs): pass
        class JSONField:
            def __init__(self, *args, **kwargs): pass
        class OneToOneField:
            def __init__(self, *args, **kwargs): pass
        class ForeignKey:
            def __init__(self, *args, **kwargs): pass
        CASCADE = None
    class User: pass

class UserProfile(models.Model):
    """User profile extension with security role designations."""
    ROLE_CHOICES = [
        ('SOC_ANALYST', 'SOC Tier 1 Analyst'),
        ('INCIDENT_RESPONDER', 'Tier 2 Incident Responder'),
        ('SECOPS_LEAD', 'Lead SecOps Engineer'),
        ('SECURITY_ADMIN', 'Platform Administrator'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=32, choices=ROLE_CHOICES, default='SOC_ANALYST')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class SecurityAlert(models.Model):
    """Individual rule triggered detection alert."""
    STATUS_CHOICES = [('OPEN', 'Open'), ('ACKNOWLEDGED', 'Acknowledged'), ('CLOSED', 'Closed')]
    alert_id = models.CharField(max_length=64, primary_key=True)
    title = models.CharField(max_length=256)
    description = models.TextField()
    rule_id = models.CharField(max_length=32)
    risk_score = models.IntegerField(default=50)
    severity = models.CharField(max_length=20, default='MEDIUM')
    confidence = models.FloatField(default=0.85)
    target_account = models.CharField(max_length=128, null=True, blank=True)
    target_host = models.CharField(max_length=128, null=True, blank=True)
    source_ip = models.CharField(max_length=45, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    evidence = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)


class Incident(models.Model):
    """Correlated security incident spanning multiple signals."""
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('INVESTIGATING', 'Under Investigation'),
        ('CONTAINED', 'Contained'),
        ('RESOLVED', 'Resolved'),
        ('FALSE_POSITIVE', 'False Positive')
    ]
    incident_id = models.CharField(max_length=64, primary_key=True)
    title = models.CharField(max_length=256)
    description = models.TextField()
    severity = models.CharField(max_length=20, default='MEDIUM')
    risk_score = models.IntegerField(default=50)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='OPEN')
    primary_account = models.CharField(max_length=128, null=True, blank=True)
    primary_host = models.CharField(max_length=128, null=True, blank=True)
    ai_triage_report = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class IncidentEvent(models.Model):
    """Pivot mapping between incidents and underlying security events."""
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name='incident_events')
    event_id = models.CharField(max_length=64)
    relationship_type = models.CharField(max_length=64, default='TRIGGERING_EVIDENCE')


class AnalystNote(models.Model):
    """Auditable investigation log note written by a security analyst."""
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name='notes')
    author = models.CharField(max_length=128)
    content = models.TextField()
    action_taken = models.CharField(max_length=128, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)


class AuditLog(models.Model):
    """System-wide immutable audit trail for forensic compliance."""
    user = models.CharField(max_length=128)
    action = models.CharField(max_length=128)
    resource_type = models.CharField(max_length=64)
    resource_id = models.CharField(max_length=128)
    details = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)
