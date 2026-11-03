import React, { useState } from 'react';
import { Incident, AnalystNote, SeverityLevel } from '../types/security';
import { NavTab } from '../components/TopNavigation';
import { ShieldAlert, Clock, CheckCircle2, MessageSquare, AlertTriangle, Play, ChevronRight, User, Terminal, Plus, ShieldCheck } from 'lucide-react';

interface IncidentInvestigationViewProps {
  incidents: Incident[];
  onUpdateIncidentStatus: (incidentId: string, status: any, note?: string) => void;
  onAddNote: (incidentId: string, note: Omit<AnalystNote, 'id' | 'created_at'>) => void;
  onNavigate: (tab: NavTab) => void;
  currentUser: { name: string; role: string } | null;
}

export const IncidentInvestigationView: React.FC<IncidentInvestigationViewProps> = ({
  incidents,
  onUpdateIncidentStatus,
  onAddNote,
  onNavigate,
  currentUser,
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    incidents[0]?.incident_id || ''
  );
  const [newNoteContent, setNewNoteContent] = useState('');
  const [selectedAction, setSelectedAction] = useState('CONTAINMENT_ACTION');

  const selectedIncident = incidents.find((i) => i.incident_id === selectedIncidentId) || incidents[0];

  const handleAddAnalystNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !selectedIncident) return;

    onAddNote(selectedIncident.incident_id, {
      author: currentUser?.name || 'SOC Analyst',
      authorRole: currentUser?.role || 'SOC Tier 1 Analyst',
      content: newNoteContent.trim(),
      action_taken: selectedAction,
    });

    setNewNoteContent('');
  };

  if (!selectedIncident) {
    return (
      <div className="relative z-10 max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <h2 className="text-lg font-bold text-white">No Incidents Recorded</h2>
        <p className="text-xs text-[#9CA7B8]">Run an attack simulation from the top navigation to create an incident.</p>
      </div>
    );
  }

  return (
    <div className="relative z-10 max-w-7xl mx-auto py-6 px-4 lg:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#292F3B]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Incident Investigation Room</h1>
            <span className="text-xs font-mono text-[#9CA7B8]">[{selectedIncident.incident_id}]</span>
          </div>
          <p className="text-xs text-[#9CA7B8] mt-0.5">
            Correlated multi-signal attack forensic timeline and analyst workbench
          </p>
        </div>

        {/* Quick Switcher if multiple incidents */}
        {incidents.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9CA7B8]">Switch Incident:</span>
            <select
              value={selectedIncident.incident_id}
              onChange={(e) => setSelectedIncidentId(e.target.value)}
              className="px-2.5 py-1 text-xs bg-[#151A23] border border-[#292F3B] rounded-lg text-white font-mono focus:outline-none focus:border-[#FF334F]"
            >
              {incidents.map((i) => (
                <option key={i.incident_id} value={i.incident_id}>
                  {i.incident_id} ({i.severity})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Grid: Left Details & Right Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Investigation Dossier */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Summary Card */}
          <div className="p-5 bg-[#11151D] border border-[#292F3B] rounded-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded font-bold ${
                    selectedIncident.severity === 'CRITICAL'
                      ? 'bg-[#FF334F]/20 text-[#FF5C6C] border border-[#FF334F]/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {selectedIncident.severity}
                </span>
                <span className="text-xs font-mono text-white px-2 py-0.5 bg-[#151A23] border border-[#292F3B] rounded">
                  Risk Score: <span className="text-[#FF334F] font-bold">{selectedIncident.risk_score}/100</span>
                </span>
                <span className="text-xs font-mono text-[#35D49A] px-2 py-0.5 bg-[#35D49A]/10 rounded">
                  Status: {selectedIncident.status}
                </span>
              </div>
              <span className="text-xs font-mono text-[#9CA7B8]">
                Created: {new Date(selectedIncident.created_at).toISOString().replace('T', ' ').substring(0, 19)} UTC
              </span>
            </div>

            <h2 className="text-base font-semibold text-white leading-snug">{selectedIncident.title}</h2>
            <p className="text-xs text-[#9CA7B8] leading-relaxed">{selectedIncident.description}</p>

            {/* Target Entities Grid */}
            <div className="grid grid-cols-3 gap-3 pt-2 font-mono text-xs">
              <div className="p-3 bg-[#151A23] border border-[#292F3B] rounded-lg">
                <span className="text-[10px] text-[#9CA7B8] block">TARGET ACCOUNT</span>
                <span className="text-white font-semibold truncate block">{selectedIncident.primary_account}</span>
              </div>
              <div className="p-3 bg-[#151A23] border border-[#292F3B] rounded-lg">
                <span className="text-[10px] text-[#9CA7B8] block">TARGET HOST</span>
                <span className="text-white font-semibold truncate block">{selectedIncident.primary_host}</span>
              </div>
              <div className="p-3 bg-[#151A23] border border-[#292F3B] rounded-lg">
                <span className="text-[10px] text-[#9CA7B8] block">SOURCE IP</span>
                <span className="text-[#FF334F] font-semibold block">{selectedIncident.source_ip}</span>
              </div>
            </div>
          </div>

          {/* AI Threat Analysis & LangGraph Report */}
          <div className="p-5 bg-[#11151D] border border-[#292F3B] rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#FF334F]" />
                <h3 className="text-sm font-semibold text-white">LangGraph Threat Intelligence Report</h3>
              </div>
              <button
                onClick={() => onNavigate('triage')}
                className="text-xs text-[#FF334F] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Open Workflow Studio</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {selectedIncident.ai_triage_report ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-[#151A23] border border-[#292F3B] rounded-lg space-y-2">
                  <span className="text-[11px] font-mono font-semibold text-[#9CA7B8] block uppercase">What Happened</span>
                  <p className="text-slate-200 leading-relaxed">{selectedIncident.ai_triage_report.what_happened}</p>
                </div>

                <div className="p-3.5 bg-[#151A23] border border-[#292F3B] rounded-lg space-y-2">
                  <span className="text-[11px] font-mono font-semibold text-[#9CA7B8] block uppercase">Why It Was Flagged</span>
                  <p className="text-slate-200 leading-relaxed">{selectedIncident.ai_triage_report.why_flagged}</p>
                </div>

                {/* Recommendations */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-white block">Prioritized Defensive Recommendations:</span>
                  <div className="space-y-1.5">
                    {selectedIncident.ai_triage_report.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-[#151A23] border border-[#292F3B] rounded flex items-start gap-2.5"
                      >
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF334F]/20 text-[#FF5C6C]">
                          {rec.priority}
                        </span>
                        <div className="flex-1">
                          <span className="font-medium text-white">{rec.action}</span>
                          <span className="text-[10px] text-[#9CA7B8] font-mono block mt-0.5">Category: {rec.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-[#151A23] border border-dashed border-[#292F3B] rounded-lg text-center space-y-3">
                <p className="text-xs text-[#9CA7B8]">No AI triage report generated yet for this incident.</p>
                <button
                  onClick={() => onNavigate('triage')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#FF334F] hover:bg-[#FF5C6C] rounded-lg transition-colors cursor-pointer"
                >
                  Run 8-Node LangGraph Triage
                </button>
              </div>
            )}
          </div>

          {/* Chronological Incident Timeline */}
          <div className="p-5 bg-[#11151D] border border-[#292F3B] rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#9CA7B8]" />
              <span>Forensic Chronological Timeline</span>
            </h3>

            <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#292F3B]">
              {selectedIncident.alerts.map((alt, idx) => (
                <div key={alt.alert_id} className="relative group">
                  <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#FF334F] border-2 border-[#11151D]" />
                  <div className="p-3 bg-[#151A23] border border-[#292F3B] rounded-lg space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{alt.title}</span>
                      <span className="font-mono text-[10px] text-[#9CA7B8]">
                        {new Date(alt.created_at).toISOString().replace('T', ' ').substring(11, 19)} UTC
                      </span>
                    </div>
                    <p className="text-xs text-[#9CA7B8]">{alt.explanation}</p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 pt-1">
                      <span>Rule: {alt.rule_id}</span>
                      <span>·</span>
                      <span>Evidence signals: {alt.evidence?.length || 1}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Actions & Analyst Notes */}
        <div className="space-y-6">
          {/* Incident Containment Actions Card */}
          <div className="p-5 bg-[#11151D] border border-[#292F3B] rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#35D49A]" />
              <span>Analyst Response Controls</span>
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => onUpdateIncidentStatus(selectedIncident.incident_id, 'INVESTIGATING', 'Acknowledged by operator.')}
                className="w-full py-2 text-xs font-semibold text-white bg-[#151A23] hover:bg-[#1B2230] border border-[#292F3B] rounded-lg transition-colors cursor-pointer text-left px-3 flex items-center justify-between"
              >
                <span>Acknowledge & Investigate</span>
                <span className="text-[10px] font-mono text-[#9CA7B8]">Set INVESTIGATING</span>
              </button>

              <button
                onClick={() => onUpdateIncidentStatus(selectedIncident.incident_id, 'CONTAINED', 'Session tokens revoked & IP quarantined.')}
                className="w-full py-2 text-xs font-semibold text-white bg-[#FF334F]/20 hover:bg-[#FF334F]/30 border border-[#FF334F]/40 text-[#FF5C6C] rounded-lg transition-colors cursor-pointer text-left px-3 flex items-center justify-between"
              >
                <span>Quarantine & Revoke Access</span>
                <span className="text-[10px] font-mono text-[#FF334F]">Set CONTAINED</span>
              </button>

              <button
                onClick={() => onUpdateIncidentStatus(selectedIncident.incident_id, 'RESOLVED', 'Threat remediated and reviewed.')}
                className="w-full py-2 text-xs font-semibold text-white bg-[#35D49A]/10 hover:bg-[#35D49A]/20 border border-[#35D49A]/30 text-[#35D49A] rounded-lg transition-colors cursor-pointer text-left px-3 flex items-center justify-between"
              >
                <span>Mark as Resolved</span>
                <span className="text-[10px] font-mono text-[#35D49A]">Set RESOLVED</span>
              </button>
            </div>
          </div>

          {/* Analyst Notes Card */}
          <div className="p-5 bg-[#11151D] border border-[#292F3B] rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#FF334F]" />
              <span>Forensic Analyst Notes ({selectedIncident.analyst_notes.length})</span>
            </h3>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {selectedIncident.analyst_notes.length === 0 ? (
                <p className="text-xs text-[#9CA7B8] italic">No investigation notes entered yet.</p>
              ) : (
                selectedIncident.analyst_notes.map((note) => (
                  <div key={note.id} className="p-3 bg-[#151A23] border border-[#292F3B] rounded-lg space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{note.author}</span>
                      <span className="text-[10px] font-mono text-[#9CA7B8]">
                        {new Date(note.created_at).toISOString().replace('T', ' ').substring(11, 19)} UTC
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{note.content}</p>
                    {note.action_taken && (
                      <span className="inline-block text-[10px] font-mono text-[#FF5C6C] bg-[#FF334F]/10 px-1.5 py-0.5 rounded">
                        Action: {note.action_taken}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Append Note Form */}
            <form onSubmit={handleAddAnalystNote} className="space-y-2 pt-2 border-t border-[#292F3B]">
              <textarea
                required
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Record observation, containment decision, or forensic findings..."
                rows={3}
                className="w-full p-2.5 text-xs bg-[#151A23] border border-[#292F3B] rounded-lg text-white focus:outline-none focus:border-[#FF334F] resize-none"
              />
              <div className="flex items-center justify-between gap-2">
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="px-2 py-1 text-[11px] bg-[#151A23] border border-[#292F3B] rounded text-white focus:outline-none"
                >
                  <option value="CONTAINMENT_ACTION">Action: Containment</option>
                  <option value="EVIDENCE_VERIFICATION">Action: Evidence Verification</option>
                  <option value="IDENTITY_OUTREACH">Action: Identity Outreach</option>
                  <option value="ESCALATION_NOTE">Action: Escalation Note</option>
                </select>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#FF334F] hover:bg-[#FF5C6C] rounded transition-colors cursor-pointer"
                >
                  Add Note
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
