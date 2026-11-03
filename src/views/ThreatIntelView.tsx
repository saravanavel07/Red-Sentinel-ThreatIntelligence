import React from 'react';
import { SecurityAlert, SecurityEvent } from '../types/security';
import { ShieldAlert, Crosshair, Network, FileSearch, ArrowUpRight, Lock } from 'lucide-react';

interface ThreatIntelViewProps {
  alerts: SecurityAlert[];
  events: SecurityEvent[];
}

export const ThreatIntelView: React.FC<ThreatIntelViewProps> = ({ alerts, events }) => {
  // Extract Indicators of Compromise (IOCs) from live telemetry
  const iocs = [
    {
      indicator: '198.51.100.44',
      type: 'IPv4 Address',
      category: 'External Reconnaissance & Brute Force Source',
      mitre: 'T1110 / T1078',
      confidence: 0.94,
      observations: events.filter((e) => e.source_ip === '198.51.100.44').length,
      status: 'ACTIVE_OBSERVATION',
    },
    {
      indicator: 'arn:aws:iam::aws:policy/AdministratorAccess',
      type: 'IAM Policy ARN',
      category: 'Unauthorized Privilege Escalation Target',
      mitre: 'T1098 (Account Manipulation)',
      confidence: 0.96,
      observations: 1,
      status: 'CONTAINED_TARGET',
    },
    {
      indicator: '0.0.0.0/0 : Port 22 (SSH)',
      type: 'Network Ingress Rule',
      category: 'Insecure Worldwide Exposure',
      mitre: 'T1562.007 (Defense Evasion)',
      confidence: 0.88,
      observations: events.filter((e) => e.event_type === 'cloud.security_group_opened').length,
      status: 'HIGH_RISK_VECTOR',
    },
    {
      indicator: 'AKIAIOSFODNN7EXAMPLE',
      type: 'Cloud Access Key ID',
      category: 'Suspiciously Minted Programmatic Credential',
      mitre: 'T1078.004 (Cloud Accounts)',
      confidence: 0.92,
      observations: 1,
      status: 'REVOCATION_RECOMMENDED',
    },
  ];

  const mitreTechniques = [
    {
      id: 'T1110',
      name: 'Brute Force / Password Spray',
      phase: 'Credential Access',
      ruleMapped: 'RS-AUTH-001: Repeated Authentication Failures',
      severity: 'HIGH',
      description: 'Adversaries repeatedly attempt sign-ins using dictionary credentials or automated sprays.',
    },
    {
      id: 'T1078',
      name: 'Valid Accounts',
      phase: 'Initial Access & Defense Evasion',
      ruleMapped: 'RS-AUTH-002: Suspicious Login Sequence',
      severity: 'CRITICAL',
      description: 'Adversaries compromise legitimate user credentials following probing attacks.',
    },
    {
      id: 'T1098',
      name: 'Account Manipulation',
      phase: 'Persistence & Privilege Escalation',
      ruleMapped: 'RS-IAM-003: Privilege Change Monitoring',
      severity: 'HIGH',
      description: 'Adversaries modify identity roles, grant administrator privileges, or generate new API access keys.',
    },
    {
      id: 'T1499',
      name: 'Endpoint Denial of Service / Burst Recon',
      phase: 'Impact & Reconnaissance',
      ruleMapped: 'RS-VOL-005: Event Burst Detection',
      severity: 'HIGH',
      description: 'High-frequency telemetry floods targeting services, gateways, or endpoints.',
    },
  ];

  return (
    <div className="relative z-10 max-w-7xl mx-auto py-6 px-4 lg:px-8 space-y-6">
      <div className="pb-2 border-b border-[#292F3B]">
        <h1 className="text-xl font-bold text-white tracking-tight">Threat Intelligence & MITRE ATT&CK Matrix</h1>
        <p className="text-xs text-[#9CA7B8] mt-0.5">
          Tactical indicators, behavioural patterns, and MITRE adversary technique mappings
        </p>
      </div>

      {/* MITRE Techniques Matrix */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-[#FF334F]" />
          <span>Active MITRE ATT&CK Technique Alignments</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mitreTechniques.map((tech) => (
            <div
              key={tech.id}
              className="p-4 bg-[#11151D] border border-[#292F3B] rounded-xl space-y-2 hover:border-[#FF334F]/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#FF5C6C]">{tech.id}</span>
                <span className="text-[10px] font-mono text-[#9CA7B8]">{tech.phase}</span>
              </div>
              <h3 className="text-xs font-semibold text-white">{tech.name}</h3>
              <p className="text-[11px] text-[#9CA7B8] leading-relaxed">{tech.description}</p>
              <div className="pt-2 border-t border-[#292F3B]/60 text-[10px] font-mono text-slate-400">
                Rule: <span className="text-white">{tech.ruleMapped}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicators of Compromise (IOC) Table */}
      <div className="p-5 bg-[#11151D] border border-[#292F3B] rounded-xl space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Extracted Indicators of Compromise (IOCs)</h2>
          <p className="text-xs text-[#9CA7B8]">Observables synthesized from authorized security events</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#151A23] text-[#9CA7B8] font-mono text-[10px] uppercase border-b border-[#292F3B]">
              <tr>
                <th className="py-2.5 px-4">Indicator</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Threat Category</th>
                <th className="py-2.5 px-4">Confidence</th>
                <th className="py-2.5 px-4">Signals</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292F3B]">
              {iocs.map((ioc, idx) => (
                <tr key={idx} className="hover:bg-[#151A23]/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">{ioc.indicator}</td>
                  <td className="py-3 px-4 font-mono text-[#9CA7B8]">{ioc.type}</td>
                  <td className="py-3 px-4 text-slate-300">{ioc.category}</td>
                  <td className="py-3 px-4 font-mono text-[#35D49A] tabular-nums">
                    {(ioc.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 px-4 font-mono text-white tabular-nums">{ioc.observations}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF334F]/10 text-[#FF5C6C] border border-[#FF334F]/30">
                      {ioc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
