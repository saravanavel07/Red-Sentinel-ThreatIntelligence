import React, { useState } from 'react';
import { Incident, AiTriageReport } from '../types/security';
import { WORKFLOW_NODES_CONFIG, executeLangGraphTriage } from '../services/langgraphWorkflow';
import { Workflow, Play, CheckCircle2, RotateCw, AlertTriangle, ShieldCheck, Terminal, Cpu, ArrowRight } from 'lucide-react';

interface AiAnalysisViewProps {
  incidents: Incident[];
  onTriageComplete: (incidentId: string, report: AiTriageReport) => void;
}

export const AiAnalysisView: React.FC<AiAnalysisViewProps> = ({
  incidents,
  onTriageComplete,
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    incidents[0]?.incident_id || ''
  );
  const [nodeStates, setNodeStates] = useState<
    Record<string, { status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'RETRYING' | 'FAILED'; snippet: string }>
  >({});
  const [isRunning, setIsRunning] = useState(false);
  const [activeReport, setActiveReport] = useState<AiTriageReport | null>(
    incidents[0]?.ai_triage_report || null
  );

  const selectedIncident = incidents.find((i) => i.incident_id === selectedIncidentId) || incidents[0];

  const handleRunWorkflow = async () => {
    if (!selectedIncident) return;
    setIsRunning(true);
    setActiveReport(null);

    // Reset node states
    const initial: Record<string, any> = {};
    WORKFLOW_NODES_CONFIG.forEach((n) => {
      initial[n.id] = { status: 'PENDING', snippet: 'Awaiting execution' };
    });
    setNodeStates(initial);

    try {
      const report = await executeLangGraphTriage(selectedIncident, (nodeId, status, snippet) => {
        setNodeStates((prev) => ({
          ...prev,
          [nodeId]: { status, snippet },
        }));
      });

      setActiveReport(report);
      onTriageComplete(selectedIncident.incident_id, report);
    } catch (err: any) {
      console.error('LangGraph execution failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="relative z-10 max-w-7xl mx-auto py-6 px-4 lg:px-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#292F3B]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">LangGraph AI Triage Studio</h1>
            <span className="text-xs font-mono text-[#35D49A] px-2 py-0.5 bg-[#35D49A]/10 border border-[#35D49A]/30 rounded">
              8-Node State Machine
            </span>
          </div>
          <p className="text-xs text-[#9CA7B8] mt-0.5">
            Deterministic state graph orchestration for cyber incident triage with anti-hallucination guardrails
          </p>
        </div>

        <div className="flex items-center gap-3">
          {incidents.length > 0 && (
            <select
              value={selectedIncident?.incident_id}
              onChange={(e) => {
                setSelectedIncidentId(e.target.value);
                const inc = incidents.find((i) => i.incident_id === e.target.value);
                setActiveReport(inc?.ai_triage_report || null);
              }}
              className="px-3 py-1.5 text-xs bg-[#151A23] border border-[#292F3B] rounded-lg text-white font-mono focus:outline-none focus:border-[#FF334F]"
            >
              {incidents.map((i) => (
                <option key={i.incident_id} value={i.incident_id}>
                  {i.incident_id} ({i.severity})
                </option>
              ))}
            </select>
          )}

          <button
            disabled={isRunning || !selectedIncident}
            onClick={handleRunWorkflow}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#FF334F] hover:bg-[#FF5C6C] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Cpu className="w-3.5 h-3.5 animate-spin" />
                <span>Orchestrating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute LangGraph Triage</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Workflow Nodes Visual Stepper */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: 8 Nodes State Visualizer */}
        <div className="p-5 bg-[#11151D] border border-[#292F3B] rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">LangGraph Node Pipeline</h2>
            <span className="text-xs font-mono text-[#9CA7B8]">Sequential execution with conditional retry</span>
          </div>

          <div className="space-y-2.5">
            {WORKFLOW_NODES_CONFIG.map((node, index) => {
              const state = nodeStates[node.id] || { status: 'PENDING', snippet: 'Ready' };
              const isRunningNode = state.status === 'RUNNING';
              const isDone = state.status === 'COMPLETED';
              const isFailed = state.status === 'FAILED';

              return (
                <div
                  key={node.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isRunningNode
                      ? 'bg-[#151A23] border-[#FF334F] shadow-[0_0_12px_rgba(255,51,79,0.2)]'
                      : isDone
                      ? 'bg-[#151A23] border-[#35D49A]/30'
                      : 'bg-[#151A23]/50 border-[#292F3B]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold ${
                          isDone
                            ? 'bg-[#35D49A]/20 text-[#35D49A]'
                            : isRunningNode
                            ? 'bg-[#FF334F]/20 text-[#FF5C6C] animate-pulse'
                            : 'bg-[#292F3B] text-[#9CA7B8]'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="text-xs font-semibold text-white">{node.name}</span>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        isDone
                          ? 'bg-[#35D49A]/10 text-[#35D49A]'
                          : isRunningNode
                          ? 'bg-[#FF334F]/20 text-[#FF5C6C]'
                          : 'bg-[#292F3B]/50 text-[#9CA7B8]'
                      }`}
                    >
                      {state.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#9CA7B8] mt-1 pl-8.5">{node.description}</p>

                  {state.snippet && state.snippet !== 'Ready' && (
                    <div className="mt-2 pl-8.5 text-[11px] font-mono text-slate-300 bg-[#090B10] p-2 rounded border border-[#292F3B]/60">
                      {state.snippet}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Triage Synthesis & Report */}
        <div className="space-y-6">
          {activeReport ? (
            <div className="p-5 bg-[#11151D] border border-[#292F3B] rounded-xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#35D49A] uppercase tracking-wider block">
                    TRIAGE EXECUTION COMPLETED
                  </span>
                  <h3 className="text-base font-semibold text-white">Synthesized Incident Intelligence</h3>
                </div>
                <div className="text-right font-mono text-xs text-[#9CA7B8]">
                  <div>Tokens: <span className="text-white">{activeReport.tokens_used || 482}</span></div>
                  <div>Latency: <span className="text-[#35D49A]">{activeReport.latency_ms || 340}ms</span></div>
                </div>
              </div>

              {/* Guardrail badge */}
              <div className="p-3 bg-[#35D49A]/10 border border-[#35D49A]/30 rounded-lg flex items-center gap-2.5 text-xs text-[#35D49A]">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{activeReport.verification_notes}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#9CA7B8] block mb-1">What Happened</span>
                  <p className="p-3 bg-[#151A23] border border-[#292F3B] rounded-lg text-slate-200 leading-relaxed">
                    {activeReport.what_happened}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-[#9CA7B8] block mb-1">Why Flagged</span>
                  <p className="p-3 bg-[#151A23] border border-[#292F3B] rounded-lg text-slate-200 leading-relaxed">
                    {activeReport.why_flagged}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-[#9CA7B8] block mb-1">Defensive Directives</span>
                  <div className="space-y-1.5">
                    {activeReport.recommendations.map((rec) => (
                      <div key={rec.step} className="p-2.5 bg-[#151A23] border border-[#292F3B] rounded flex items-center justify-between">
                        <span className="text-slate-200">{rec.action}</span>
                        <span className="text-[10px] font-mono text-[#FF5C6C] bg-[#FF334F]/10 px-1.5 py-0.5 rounded">
                          {rec.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-[#9CA7B8] block mb-1">Recommended Containment</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300 font-mono text-[11px]">
                    {activeReport.containment_steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-[#11151D] border border-dashed border-[#292F3B] rounded-xl text-center space-y-4">
              <Workflow className="w-10 h-10 text-[#FF334F] mx-auto opacity-70" />
              <h3 className="text-sm font-semibold text-white">LangGraph Triage Awaiting Execution</h3>
              <p className="text-xs text-[#9CA7B8] max-w-sm mx-auto leading-relaxed">
                Click "Execute LangGraph Triage" above to run the 8-node state machine on incident {selectedIncident?.incident_id}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
