import React, { useState } from 'react';
import { ATTACK_SCENARIOS } from '../services/sampleData';
import { AttackScenario, SecurityEvent } from '../types/security';
import { X, Play, ShieldAlert, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';

interface SimulateAttackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectScenario: (scenario: AttackScenario) => void;
  onInjectCustomEvent: (event: Partial<SecurityEvent>) => void;
}

export const SimulateAttackModal: React.FC<SimulateAttackModalProps> = ({
  isOpen,
  onClose,
  onInjectScenario,
  onInjectCustomEvent,
}) => {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'custom'>('scenarios');
  const [customType, setCustomType] = useState('auth.failure');
  const [customAccount, setCustomAccount] = useState('sec-analyst@corp.internal');
  const [customIp, setCustomIp] = useState('198.51.100.77');
  const [injectingId, setInjectingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunScenario = (sc: AttackScenario) => {
    setInjectingId(sc.id);
    setTimeout(() => {
      onInjectScenario(sc);
      setInjectingId(null);
      onClose();
    }, 450);
  };

  const handleRunCustom = (e: React.FormEvent) => {
    e.preventDefault();
    onInjectCustomEvent({
      event_type: customType,
      account: customAccount,
      source_ip: customIp,
      host: 'cloud-perimeter-gw',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#11151D] border border-[#292F3B] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#292F3B] bg-[#151A23]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FF334F]/10 text-[#FF334F] rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Live Attack & Telemetry Simulator</h2>
              <p className="text-xs text-[#9CA7B8]">Inject realistic cloud attack patterns into the detection engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#9CA7B8] hover:text-white rounded-lg hover:bg-[#292F3B]/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-[#292F3B] text-xs font-medium">
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'scenarios'
                ? 'text-white border-[#FF334F]'
                : 'text-[#9CA7B8] border-transparent hover:text-white'
            }`}
          >
            Predefined Attack Scenarios
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'custom'
                ? 'text-white border-[#FF334F]'
                : 'text-[#9CA7B8] border-transparent hover:text-white'
            }`}
          >
            Custom Event Payload
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'scenarios' ? (
            <div className="space-y-3">
              {ATTACK_SCENARIOS.map((sc) => {
                const isInjecting = injectingId === sc.id;
                return (
                  <div
                    key={sc.id}
                    className="p-4 bg-[#151A23] border border-[#292F3B] rounded-lg hover:border-[#FF334F]/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                            sc.severity === 'CRITICAL'
                              ? 'bg-[#FF334F]/20 text-[#FF5C6C] border border-[#FF334F]/30'
                              : sc.severity === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {sc.severity}
                        </span>
                        <span className="text-xs text-[#9CA7B8] font-mono">MITRE {sc.mitre_technique}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-white">{sc.name}</h3>
                      <p className="text-xs text-[#9CA7B8]">{sc.description}</p>
                      <div className="text-[11px] text-[#9CA7B8] flex items-center gap-3 pt-1 font-mono">
                        <span>Target: <span className="text-white">{sc.target_account}</span></span>
                        <span>·</span>
                        <span>Telemetry: <span className="text-[#FF334F]">{sc.event_count} events</span></span>
                      </div>
                    </div>

                    <button
                      disabled={isInjecting}
                      onClick={() => handleRunScenario(sc)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#FF334F] hover:bg-[#FF5C6C] rounded-lg transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {isInjecting ? (
                        <>
                          <Cpu className="w-3.5 h-3.5 animate-spin" />
                          <span>Injecting...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Simulate</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleRunCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#9CA7B8] mb-1">Event Type</label>
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#151A23] border border-[#292F3B] rounded-lg text-white focus:outline-none focus:border-[#FF334F]"
                >
                  <option value="auth.failure">auth.failure (Authentication Failure)</option>
                  <option value="auth.success">auth.success (Authentication Success)</option>
                  <option value="iam.privilege_escalation">iam.privilege_escalation (IAM Policy Attached)</option>
                  <option value="iam.key_created">iam.key_created (Access Key Created)</option>
                  <option value="cloud.security_group_opened">cloud.security_group_opened (0.0.0.0/0)</option>
                  <option value="network.suspicious_outbound">network.suspicious_outbound (Data Egress)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#9CA7B8] mb-1">Target Account / Identity</label>
                <input
                  type="text"
                  value={customAccount}
                  onChange={(e) => setCustomAccount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#151A23] border border-[#292F3B] rounded-lg text-white focus:outline-none focus:border-[#FF334F]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#9CA7B8] mb-1">Source IP Address</label>
                <input
                  type="text"
                  value={customIp}
                  onChange={(e) => setCustomIp(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#151A23] border border-[#292F3B] rounded-lg text-white font-mono focus:outline-none focus:border-[#FF334F]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#FF334F] hover:bg-[#FF5C6C] rounded-lg transition-colors cursor-pointer"
                >
                  Inject Event
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
