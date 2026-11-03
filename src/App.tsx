import React, { useState, useMemo } from 'react';
import { TopNavigation, NavTab } from './components/TopNavigation';
import { ParticleNetworkCanvas } from './components/ParticleNetworkCanvas';
import { SimulateAttackModal } from './components/SimulateAttackModal';
import { LandingPage } from './views/LandingPage';
import { LoginPage } from './views/LoginPage';
import { DashboardView } from './views/DashboardView';
import { EventsView } from './views/EventsView';
import { ThreatIntelView } from './views/ThreatIntelView';
import { IncidentInvestigationView } from './views/IncidentInvestigationView';
import { AiAnalysisView } from './views/AiAnalysisView';
import { DetectionRulesView } from './views/DetectionRulesView';
import { RepoTestsView } from './views/RepoTestsView';
import { SettingsView } from './views/SettingsView';

import {
  INITIAL_EVENTS,
  INITIAL_ALERTS,
  INITIAL_INCIDENTS,
  INITIAL_AUDIT_LOGS,
} from './services/sampleData';
import { ClientDetectionEngine } from './services/detectionEngine';
import {
  SecurityEvent,
  SecurityAlert,
  Incident,
  AuditLogEntry,
  AttackScenario,
  AnalystNote,
  AiTriageReport,
} from './types/security';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab | 'login'>('landing');
  const [events, setEvents] = useState<SecurityEvent[]>(INITIAL_EVENTS);
  const [alerts, setAlerts] = useState<SecurityAlert[]>(INITIAL_ALERTS);
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string; email?: string } | null>({
    name: 'Sarah Chen',
    role: 'Lead SecOps Engineer',
    email: 'sarah.chen@redsentinel.internal',
  });
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Instantiating Detection Engine
  const detectionEngine = useMemo(() => new ClientDetectionEngine(), []);

  // Handler: Inject predefined attack scenario
  const handleInjectScenario = (scenario: AttackScenario) => {
    const timestampNow = new Date();
    const newGeneratedEvents: SecurityEvent[] = [];

    if (scenario.id === 'scenario_brute_force_compromise') {
      // 5 failures + 1 success
      for (let i = 0; i < 5; i++) {
        const evTime = new Date(timestampNow.getTime() - (5 - i) * 20000).toISOString();
        newGeneratedEvents.push({
          event_id: `EVT-SIM-${Date.now()}-${i + 1}`,
          timestamp: evTime,
          event_type: 'auth.failure',
          event_type_display: 'Authentication Failure',
          source_type: 'aws-cloudtrail',
          account: scenario.target_account,
          host: 'cloud-perimeter-gateway',
          source_ip: '198.51.100.22',
          severity: 'LOW',
          raw_event: { eventName: 'ConsoleLogin', reason: 'BadPasswordAttempt' },
          normalized_event: {
            account: scenario.target_account,
            source_ip: '198.51.100.22',
            host: 'cloud-perimeter-gateway',
            action: 'ConsoleLogin',
            status: 'FAILED',
            details: { attempt: i + 1 },
          },
        });
      }

      // Success
      newGeneratedEvents.push({
        event_id: `EVT-SIM-${Date.now()}-6`,
        timestamp: timestampNow.toISOString(),
        event_type: 'auth.success',
        event_type_display: 'Authentication Success',
        source_type: 'aws-cloudtrail',
        account: scenario.target_account,
        host: 'cloud-perimeter-gateway',
        source_ip: '198.51.100.22',
        severity: 'INFO',
        raw_event: { eventName: 'ConsoleLogin', status: 'Success' },
        normalized_event: {
          account: scenario.target_account,
          source_ip: '198.51.100.22',
          host: 'cloud-perimeter-gateway',
          action: 'ConsoleLogin',
          status: 'SUCCESS',
          details: { attempt: 6 },
        },
      });
    } else if (scenario.id === 'scenario_privilege_escalation_burst') {
      newGeneratedEvents.push({
        event_id: `EVT-SIM-${Date.now()}-1`,
        timestamp: timestampNow.toISOString(),
        event_type: 'iam.privilege_escalation',
        event_type_display: 'Privilege Escalation',
        source_type: 'aws-cloudtrail',
        account: scenario.target_account,
        host: 'iam.amazonaws.com',
        source_ip: '203.0.113.88',
        severity: 'HIGH',
        raw_event: { eventName: 'AttachUserPolicy', policyArn: 'arn:aws:iam::aws:policy/AdministratorAccess' },
        normalized_event: {
          account: scenario.target_account,
          source_ip: '203.0.113.88',
          host: 'iam.amazonaws.com',
          action: 'AttachUserPolicy',
          status: 'SUCCESS',
          details: { policy: 'AdministratorAccess' },
        },
      });
      newGeneratedEvents.push({
        event_id: `EVT-SIM-${Date.now()}-2`,
        timestamp: new Date(timestampNow.getTime() + 10000).toISOString(),
        event_type: 'iam.key_created',
        event_type_display: 'Access Key Created',
        source_type: 'aws-cloudtrail',
        account: scenario.target_account,
        host: 'iam.amazonaws.com',
        source_ip: '203.0.113.88',
        severity: 'HIGH',
        raw_event: { eventName: 'CreateAccessKey' },
        normalized_event: {
          account: scenario.target_account,
          source_ip: '203.0.113.88',
          host: 'iam.amazonaws.com',
          action: 'CreateAccessKey',
          status: 'SUCCESS',
          details: { key: 'AKIA_EX_NEW_KEY' },
        },
      });
    } else {
      // General burst or off-hours
      for (let i = 0; i < scenario.event_count; i++) {
        newGeneratedEvents.push({
          event_id: `EVT-SIM-${Date.now()}-${i + 1}`,
          timestamp: new Date(timestampNow.getTime() - i * 2000).toISOString(),
          event_type: scenario.id.includes('off_hours') ? 'cloud.security_group_opened' : 'api.recon_burst',
          event_type_display: scenario.id.includes('off_hours') ? 'Security Group Modified' : 'API Recon Burst',
          source_type: 'aws-cloudtrail',
          account: scenario.target_account,
          host: 'cloud-api-endpoint',
          source_ip: '192.0.2.145',
          severity: scenario.severity,
          raw_event: { probe: i + 1 },
          normalized_event: {
            account: scenario.target_account,
            source_ip: '192.0.2.145',
            host: 'cloud-api-endpoint',
            action: 'ProbeCall',
            status: 'SUCCESS',
            details: { iteration: i + 1 },
          },
        });
      }
    }

    // Evaluate all new events
    const allEventsUpdated = [...newGeneratedEvents, ...events];
    setEvents(allEventsUpdated);

    const generatedAlerts: SecurityAlert[] = [];
    newGeneratedEvents.forEach((ev) => {
      const match = detectionEngine.evaluateEvent(ev, allEventsUpdated);
      generatedAlerts.push(...match);
    });

    if (generatedAlerts.length > 0) {
      setAlerts((prev) => [...generatedAlerts, ...prev]);

      // Correlate into an incident
      const topAlert = generatedAlerts[0];
      const newInc: Incident = {
        incident_id: `INC-${new Date().toISOString().substring(0, 10).replace(/-/g, '')}-${Math.random()
          .toString(36)
          .substring(2, 7)
          .toUpperCase()}`,
        title: `${scenario.name} on ${scenario.target_account}`,
        description: topAlert.explanation,
        primary_account: scenario.target_account,
        primary_host: topAlert.target_host,
        source_ip: topAlert.source_ip,
        severity: scenario.severity,
        risk_score: Math.max(...generatedAlerts.map((a) => a.risk_score)),
        status: 'OPEN',
        review_status: 'PENDING_TRIAGE',
        alerts: generatedAlerts,
        related_events: newGeneratedEvents.map((e) => e.event_id),
        analyst_notes: [],
        ai_triage_report: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setIncidents((prev) => [newInc, ...prev]);

      // Append Audit Log
      const audit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        user: currentUser?.email || 'operator@redsentinel.internal',
        role: currentUser?.role || 'Lead SecOps',
        action: 'ATTACK_SIMULATED',
        resource_type: 'Scenario',
        resource_id: scenario.id,
        details: `Simulated '${scenario.name}' generating ${newGeneratedEvents.length} telemetry records and ${generatedAlerts.length} alert(s).`,
        timestamp: new Date().toISOString(),
      };
      setAuditLogs((prev) => [audit, ...prev]);
    }
  };

  // Handler: Custom single event injection
  const handleInjectCustomEvent = (ev: Partial<SecurityEvent>) => {
    const fullEvent: SecurityEvent = {
      event_id: `EVT-CUST-${Date.now()}`,
      timestamp: new Date().toISOString(),
      event_type: ev.event_type || 'auth.failure',
      event_type_display: ev.event_type || 'Custom Ingestion',
      source_type: 'flask-ingestion-api',
      account: ev.account || 'custom-user',
      host: ev.host || 'host-01',
      source_ip: ev.source_ip || '127.0.0.1',
      severity: 'LOW',
      raw_event: { custom: true },
      normalized_event: {
        account: ev.account || 'custom-user',
        source_ip: ev.source_ip || '127.0.0.1',
        host: ev.host || 'host-01',
        action: ev.event_type || 'custom',
        status: 'RECEIVED',
        details: {},
      },
    };

    const updated = [fullEvent, ...events];
    setEvents(updated);
    const alertsGenerated = detectionEngine.evaluateEvent(fullEvent, updated);
    if (alertsGenerated.length > 0) {
      setAlerts((prev) => [...alertsGenerated, ...prev]);
    }
  };

  // Handler: Update incident status
  const handleUpdateIncidentStatus = (incidentId: string, status: any, note?: string) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.incident_id === incidentId) {
          const updatedNotes = note
            ? [
                {
                  id: `note-${Date.now()}`,
                  author: currentUser?.name || 'Operator',
                  authorRole: currentUser?.role || 'SecOps',
                  content: note,
                  action_taken: status,
                  created_at: new Date().toISOString(),
                },
                ...inc.analyst_notes,
              ]
            : inc.analyst_notes;

          return {
            ...inc,
            status,
            updated_at: new Date().toISOString(),
            analyst_notes: updatedNotes,
          };
        }
        return inc;
      })
    );

    // Audit Log
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        user: currentUser?.email || 'operator@internal',
        role: currentUser?.role || 'SecOps',
        action: `SET_STATUS_${status}`,
        resource_type: 'Incident',
        resource_id: incidentId,
        details: note || `Updated status to ${status}`,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  // Handler: Add Analyst Note
  const handleAddNote = (incidentId: string, noteData: Omit<AnalystNote, 'id' | 'created_at'>) => {
    const newNote: AnalystNote = {
      id: `note-${Date.now()}`,
      author: noteData.author,
      authorRole: noteData.authorRole,
      content: noteData.content,
      action_taken: noteData.action_taken,
      created_at: new Date().toISOString(),
    };

    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.incident_id === incidentId) {
          return {
            ...inc,
            analyst_notes: [newNote, ...inc.analyst_notes],
            updated_at: new Date().toISOString(),
          };
        }
        return inc;
      })
    );

    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        user: currentUser?.email || 'operator@internal',
        role: currentUser?.role || 'SecOps',
        action: 'NOTE_APPENDED',
        resource_type: 'Incident',
        resource_id: incidentId,
        details: noteData.content.substring(0, 80),
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  // Handler: Save AI Triage Report
  const handleTriageComplete = (incidentId: string, report: AiTriageReport) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.incident_id === incidentId) {
          return {
            ...inc,
            ai_triage_report: report,
            review_status: 'TRIAGED',
            updated_at: new Date().toISOString(),
          };
        }
        return inc;
      })
    );

    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        user: 'LangGraph_Triage_Orchestrator',
        role: 'AI Engine',
        action: 'TRIAGE_COMPLETED',
        resource_type: 'Incident',
        resource_id: incidentId,
        details: `Synthesized report with 8-node state machine. Advisory Score: ${report.risk_score}/100. Verification: Passed.`,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  return (
    <div className="min-h-screen bg-[#090B10] text-[#F4F6FA] relative flex flex-col font-sans selection:bg-[#FF334F]/30 selection:text-white">
      {/* Subtle live-motion background particle canvas */}
      <ParticleNetworkCanvas reducedMotion={reducedMotion} />

      {/* Top Bar Navigation */}
      <TopNavigation
        currentTab={currentTab === 'login' ? 'landing' : currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenSimModal={() => setIsSimModalOpen(true)}
        activeAlertCount={alerts.filter((a) => a.status === 'OPEN').length}
        currentUser={currentUser}
        onLoginClick={() => setCurrentTab('login')}
      />

      {/* View Router */}
      <main className="flex-1">
        {currentTab === 'landing' && (
          <LandingPage
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenSimModal={() => setIsSimModalOpen(true)}
            eventCount={events.length}
            incidentCount={incidents.length}
          />
        )}

        {currentTab === 'login' && (
          <LoginPage
            onSuccess={(user) => {
              setCurrentUser(user);
              setCurrentTab('dashboard');
            }}
            onCancel={() => setCurrentTab('landing')}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardView
            events={events}
            alerts={alerts}
            incidents={incidents}
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenSimModal={() => setIsSimModalOpen(true)}
            onLoadSyntheticData={() => {
              setEvents(INITIAL_EVENTS);
              setAlerts(INITIAL_ALERTS);
              setIncidents(INITIAL_INCIDENTS);
            }}
            onResetData={() => {
              setEvents([]);
              setAlerts([]);
              setIncidents([]);
            }}
          />
        )}

        {currentTab === 'events' && <EventsView events={events} />}

        {currentTab === 'intel' && <ThreatIntelView alerts={alerts} events={events} />}

        {currentTab === 'incidents' && (
          <IncidentInvestigationView
            incidents={incidents}
            onUpdateIncidentStatus={handleUpdateIncidentStatus}
            onAddNote={handleAddNote}
            onNavigate={(tab) => setCurrentTab(tab)}
            currentUser={currentUser}
          />
        )}

        {currentTab === 'triage' && (
          <AiAnalysisView incidents={incidents} onTriageComplete={handleTriageComplete} />
        )}

        {currentTab === 'rules' && <DetectionRulesView engine={detectionEngine} />}

        {currentTab === 'code_tests' && <RepoTestsView />}

        {currentTab === 'settings' && (
          <SettingsView
            currentUser={currentUser}
            auditLogs={auditLogs}
            reducedMotion={reducedMotion}
            onToggleReducedMotion={() => setReducedMotion(!reducedMotion)}
            onLogout={() => {
              setCurrentUser(null);
              setCurrentTab('landing');
            }}
          />
        )}
      </main>

      {/* Attack Simulation Modal */}
      <SimulateAttackModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        onInjectScenario={handleInjectScenario}
        onInjectCustomEvent={handleInjectCustomEvent}
      />
    </div>
  );
}
