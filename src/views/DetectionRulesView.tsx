import React, { useState } from 'react';
import { DetectionRuleConfig, SecurityEvent } from '../types/security';
import { ClientDetectionEngine } from '../services/detectionEngine';
import { ShieldAlert, Play, CheckCircle2, Sliders, Terminal, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';

interface DetectionRulesViewProps {
  engine: ClientDetectionEngine;
}

export const DetectionRulesView: React.FC<DetectionRulesViewProps> = ({ engine }) => {
  const [rules, setRules] = useState<DetectionRuleConfig[]>(engine.getRules());
  const [testPayload, setTestPayload] = useState<string>(
    JSON.stringify(
      {
        event_id: 'EVT-TEST-001',
        event_type: 'auth.failure',
        account: 'admin@acme-corp.cloud',
        source_ip: '198.51.100.99',
        host: 'prod-gateway-01',
        timestamp: new Date().toISOString(),
        normalized_event: {
          action: 'ConsoleLogin',
          status: 'FAILED',
          details: { attempt: 5 },
        },
      },
      null,
      2
    )
  );

  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [testing, setTesting] = useState(false);

  const handleToggleRule = (ruleId: string, current: boolean) => {
    engine.toggleRule(ruleId, !current);
    setRules([...engine.getRules()]);
  };

  const handleThresholdChange = (ruleId: string, val: number) => {
    engine.updateRuleThreshold(ruleId, val);
    setRules([...engine.getRules()]);
  };

  const handleRunRuleTest = (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);

    try {
      const parsed = JSON.parse(testPayload);
      const fakeHistory: SecurityEvent[] = [
        {
          ...parsed,
          event_id: 'EVT-HIST-1',
          timestamp: new Date(Date.now() - 60000).toISOString(),
        },
        {
          ...parsed,
          event_id: 'EVT-HIST-2',
          timestamp: new Date(Date.now() - 120000).toISOString(),
        },
        {
          ...parsed,
          event_id: 'EVT-HIST-3',
          timestamp: new Date(Date.now() - 180000).toISOString(),
        },
        {
          ...parsed,
          event_id: 'EVT-HIST-4',
          timestamp: new Date(Date.now() - 240000).toISOString(),
        },
      ];

      const evaluated = engine.evaluateEvent(parsed, fakeHistory);
      setTestResults(evaluated);
    } catch (err: any) {
      alert(`Invalid JSON payload: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="relative z-10 max-w-7xl mx-auto py-6 px-4 lg:px-8 space-y-6">
      <div className="pb-2 border-b border-[#292F3B]">
        <h1 className="text-xl font-bold text-white tracking-tight">Deterministic Detection Rules Engine</h1>
        <p className="text-xs text-[#9CA7B8] mt-0.5">
          Configurable, explainable security detection rules without black-box opacity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Rules List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-white">Active Explainable Rules ({rules.length})</h2>

          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.rule_id}
                className={`p-4 bg-[#11151D] border rounded-xl transition-all ${
                  rule.enabled ? 'border-[#292F3B]' : 'border-[#292F3B]/40 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#FF5C6C]">{rule.rule_id}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          rule.default_severity === 'CRITICAL'
                            ? 'bg-[#FF334F]/20 text-[#FF5C6C]'
                            : rule.default_severity === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {rule.default_severity} ({rule.base_score} pts)
                      </span>
                      <span className="text-[10px] font-mono text-[#9CA7B8]">MITRE {rule.mitre_id}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">{rule.name}</h3>
                    <p className="text-xs text-[#9CA7B8] leading-relaxed">{rule.description}</p>
                  </div>

                  <button
                    onClick={() => handleToggleRule(rule.rule_id, rule.enabled)}
                    className="p-1 text-white hover:text-[#FF334F] transition-colors cursor-pointer shrink-0"
                    title={rule.enabled ? 'Disable Rule' : 'Enable Rule'}
                  >
                    {rule.enabled ? (
                      <ToggleRight className="w-8 h-8 text-[#FF334F]" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-[#9CA7B8]" />
                    )}
                  </button>
                </div>

                {/* Threshold Configuration if applicable */}
                {rule.threshold !== undefined && (
                  <div className="mt-3 pt-3 border-t border-[#292F3B]/60 flex items-center justify-between text-xs font-mono">
                    <span className="text-[#9CA7B8]">Sensitivity Threshold:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={rule.threshold}
                        onChange={(e) => handleThresholdChange(rule.rule_id, parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 bg-[#151A23] border border-[#292F3B] rounded text-white text-center font-bold focus:outline-none focus:border-[#FF334F]"
                      />
                      <span className="text-[11px] text-[#9CA7B8]">events</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Rule Sandbox Testing */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#FF334F]" />
            <span>Interactive Rule Sandbox</span>
          </h2>

          <div className="p-5 bg-[#11151D] border border-[#292F3B] rounded-xl space-y-4">
            <p className="text-xs text-[#9CA7B8] leading-relaxed">
              Test candidate telemetry payloads against the deterministic rule pipeline.
            </p>

            <form onSubmit={handleRunRuleTest} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-[#9CA7B8] mb-1">Telemetry JSON Payload</label>
                <textarea
                  rows={8}
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  className="w-full p-2.5 text-[11px] font-mono bg-[#090B10] border border-[#292F3B] rounded-lg text-slate-300 focus:outline-none focus:border-[#FF334F] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={testing}
                className="w-full py-2 text-xs font-semibold text-white bg-[#FF334F] hover:bg-[#FF5C6C] rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Evaluate Telemetry Against Rules</span>
              </button>
            </form>

            {/* Test Results Output */}
            {testResults && (
              <div className="pt-2 border-t border-[#292F3B] space-y-2 animate-fade-in">
                <span className="text-[11px] font-mono text-[#9CA7B8] block">EVALUATION RESULT:</span>
                {testResults.length === 0 ? (
                  <div className="p-3 bg-[#151A23] border border-[#292F3B] rounded text-xs text-[#9CA7B8]">
                    No detection rules triggered for this payload.
                  </div>
                ) : (
                  testResults.map((alt, idx) => (
                    <div key={idx} className="p-3 bg-[#151A23] border border-[#FF334F]/40 rounded space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#FF5C6C] font-mono">{alt.rule_id}</span>
                        <span className="font-mono text-white">{alt.severity} ({alt.risk_score}/100)</span>
                      </div>
                      <p className="text-slate-300">{alt.explanation}</p>
                      <p className="text-[10px] text-[#9CA7B8] font-mono pt-1">{alt.scoring_explanation}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
