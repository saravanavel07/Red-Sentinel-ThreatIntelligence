import React, { useState } from 'react';
import { AuditLogEntry } from '../types/security';
import { Shield, Key, Sliders, User, History, Check, Copy, RefreshCw } from 'lucide-react';

interface SettingsViewProps {
  currentUser: { name: string; role: string; email?: string } | null;
  auditLogs: AuditLogEntry[];
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  auditLogs,
  reducedMotion,
  onToggleReducedMotion,
  onLogout,
}) => {
  const [apiKey, setApiKey] = useState('rs_live_secret_token_99b7c841e2a0487d');
  const [copiedKey, setCopiedKey] = useState(false);
  const [retentionDays, setRetentionDays] = useState(90);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRegenerateKey = () => {
    const newKey = `rs_live_secret_token_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    setApiKey(newKey);
  };

  return (
    <div className="relative z-10 max-w-7xl mx-auto py-6 px-4 lg:px-8 space-y-6">
      <div className="pb-2 border-b border-[#292F3B]">
        <h1 className="text-xl font-bold text-white tracking-tight">System Settings & Forensic Audit Trail</h1>
        <p className="text-xs text-[#9CA7B8] mt-0.5">
          Platform credentials, background animation preferences, and immutable audit logs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configuration Cards */}
        <div className="space-y-6 lg:col-span-1">
          {/* Operator Profile */}
          <div className="p-5 bg-[#11151D] border border-[#292F3B] rounded-xl space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-[#FF334F]" />
              <span>Operator Profile</span>
            </h2>

            {currentUser ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-[#9CA7B8] block">NAME</span>
                  <span className="text-white font-semibold">{currentUser.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#9CA7B8] block">ROLE</span>
                  <span className="text-[#35D49A] font-mono">{currentUser.role}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#9CA7B8] block">AUTHENTICATED IDENTITY</span>
                  <span className="text-slate-300 font-mono text-[11px]">{currentUser.email || 'operator@internal'}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full py-1.5 text-xs text-[#FF5C6C] bg-[#FF334F]/10 hover:bg-[#FF334F]/20 rounded border border-[#FF334F]/30 transition-colors cursor-pointer"
                >
                  Sign Out Session
                </button>
              </div>
            ) : (
              <div className="text-xs text-[#9CA7B8]">No active session authenticated.</div>
            )}
          </div>

          {/* Ingestion Microservice API Key */}
          <div className="p-5 bg-[#11151D] border border-[#292F3B] rounded-xl space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-[#FF334F]" />
              <span>Flask Ingestion API Key</span>
            </h2>

            <p className="text-xs text-[#9CA7B8] leading-relaxed">
              Log producers must submit this secret in the Authorization header:
              <code className="text-[#FF5C6C] block mt-1 font-mono text-[11px]">Authorization: Bearer &lt;TOKEN&gt;</code>
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={apiKey}
                className="w-full px-2.5 py-1.5 text-[11px] font-mono bg-[#090B10] border border-[#292F3B] rounded text-slate-300 select-all"
              />
              <button
                onClick={handleCopyKey}
                title="Copy Token"
                className="p-1.5 text-[#9CA7B8] hover:text-white bg-[#151A23] border border-[#292F3B] rounded transition-colors cursor-pointer"
              >
                {copiedKey ? <Check className="w-4 h-4 text-[#35D49A]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={handleRegenerateKey}
              className="text-xs text-[#9CA7B8] hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rotate Ingestion Key</span>
            </button>
          </div>

          {/* UI & Animation Preferences */}
          <div className="p-5 bg-[#11151D] border border-[#292F3B] rounded-xl space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#FF334F]" />
              <span>Visual Motion & Performance</span>
            </h2>

            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="text-white block font-medium">Reduced Motion Mode</span>
                <span className="text-[11px] text-[#9CA7B8]">Pauses particle background to save GPU/battery</span>
              </div>
              <button
                onClick={onToggleReducedMotion}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  reducedMotion ? 'bg-[#FF334F]' : 'bg-[#292F3B]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    reducedMotion ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-2 border-t border-[#292F3B] text-xs">
              <span className="text-white block font-medium mb-1">Telemetry Retention Horizon</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={30}
                  max={365}
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                  className="w-full accent-[#FF334F]"
                />
                <span className="font-mono text-white text-xs">{retentionDays}d</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Immutable Audit Trail */}
        <div className="lg:col-span-2 p-5 bg-[#11151D] border border-[#292F3B] rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-[#35D49A]" />
                <span>Forensic Audit Trail ({auditLogs.length} Records)</span>
              </h2>
              <p className="text-xs text-[#9CA7B8] mt-0.5">
                Append-only log of all operator decisions, status transitions, and alerts
              </p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#151A23] text-[#9CA7B8] font-mono text-[10px] uppercase border-b border-[#292F3B] sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Timestamp (UTC)</th>
                  <th className="py-2.5 px-3">Operator / Principal</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Target Resource</th>
                  <th className="py-2.5 px-3">Forensic Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292F3B]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#151A23]/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#9CA7B8] whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-white whitespace-nowrap">
                      {log.user}
                      <span className="text-[10px] text-[#9CA7B8] block">{log.role}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FF334F]/10 text-[#FF5C6C] border border-[#FF334F]/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                      {log.resource_type}: {log.resource_id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 text-[11px]">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
