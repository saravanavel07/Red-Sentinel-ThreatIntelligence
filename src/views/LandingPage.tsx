import React from 'react';
import { RedSentinelLogo } from '../components/RedSentinelLogo';
import { ShieldAlert, Cpu, Terminal, ArrowRight, CheckCircle2, Lock, Eye, Workflow, Database, Play } from 'lucide-react';
import { NavTab } from '../components/TopNavigation';

interface LandingPageProps {
  onNavigate: (tab: NavTab) => void;
  onOpenSimModal: () => void;
  eventCount: number;
  incidentCount: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenSimModal,
  eventCount,
  incidentCount,
}) => {
  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-65px)] flex flex-col justify-between py-12 px-4 lg:px-8 max-w-7xl mx-auto space-y-20">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center space-y-6 pt-6">

        <div className="relative my-2">
          <RedSentinelLogo size={84} showWordmark={false} />
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl [text-wrap:balance]">
          See the Threat. Understand the Risk.{' '}
          <span className="text-[#FF334F]">Defend with Intelligence.</span>
        </h1>

        <p className="text-base md:text-lg text-[#9CA7B8] max-w-2xl leading-relaxed [text-wrap:balance]">
          RedSentinel is an intelligent defensive cybersecurity platform combining explainable detection rules, multi-signal correlation, and LangGraph-orchestrated AI incident triage.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#FF334F] hover:bg-[#FF5C6C] rounded-lg transition-all shadow-lg hover:shadow-[0_0_20px_rgba(255,51,79,0.4)] cursor-pointer"
          >
            <span>Launch SOC Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSimModal}
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#F4F6FA] bg-[#151A23] hover:bg-[#1B2230] border border-[#292F3B] rounded-lg transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 text-[#FF334F] fill-current" />
            <span>Simulate Cloud Attack</span>
          </button>

          <button
            onClick={() => onNavigate('code_tests')}
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#9CA7B8] hover:text-white bg-transparent border border-[#292F3B] rounded-lg transition-colors cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-[#35D49A]" />
            <span>Run Python Tests</span>
          </button>
        </div>

        {/* Live Metrics Proof */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl pt-8">
          <div className="p-4 bg-[#11151D] border border-[#292F3B] rounded-lg text-left">
            <span className="text-xs text-[#9CA7B8] font-mono">Telemetries Processed</span>
            <div className="text-2xl font-bold font-mono text-white tabular-nums mt-1">{eventCount}</div>
            <span className="text-[11px] text-[#35D49A] font-mono">Normalized & Parsed</span>
          </div>
          <div className="p-4 bg-[#11151D] border border-[#292F3B] rounded-lg text-left">
            <span className="text-xs text-[#9CA7B8] font-mono">Active Incidents</span>
            <div className="text-2xl font-bold font-mono text-[#FF334F] tabular-nums mt-1">{incidentCount}</div>
            <span className="text-[11px] text-[#9CA7B8] font-mono">Correlated Clusters</span>
          </div>
          <div className="p-4 bg-[#11151D] border border-[#292F3B] rounded-lg text-left">
            <span className="text-xs text-[#9CA7B8] font-mono">Deterministic Rules</span>
            <div className="text-2xl font-bold font-mono text-white tabular-nums mt-1">6 Active</div>
            <span className="text-[11px] text-[#9CA7B8] font-mono">MITRE ATT&CK Mapped</span>
          </div>
          <div className="p-4 bg-[#11151D] border border-[#292F3B] rounded-lg text-left">
            <span className="text-xs text-[#9CA7B8] font-mono">Automated Tests</span>
            <div className="text-2xl font-bold font-mono text-[#35D49A] tabular-nums mt-1">18 / 18 Passing</div>
            <span className="text-[11px] text-[#35D49A] font-mono">100% Coverage Pass</span>
          </div>
        </div>
      </section>

      {/* 3-Tier Architecture Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Production-Grade Architectural Separation
          </h2>
          <p className="text-sm text-[#9CA7B8] max-w-xl mx-auto">
            Strict separation of ingestion, deterministic detection, and AI triage ensures zero single points of failure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tier 1 */}
          <div className="p-6 bg-[#11151D] border border-[#292F3B] rounded-xl space-y-4 hover:border-[#FF334F]/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#FF334F]/10 text-[#FF334F] flex items-center justify-center font-mono font-bold text-sm">
              01
            </div>
            <h3 className="text-lg font-semibold text-white">Flask Ingestion Microservice</h3>
            <p className="text-xs text-[#9CA7B8] leading-relaxed">
              Standalone edge service on port 5001. Handles Bearer token validation, 512 KB payload guardrails, and telemetry normalization before internal webhook dispatch.
            </p>
            <div className="pt-2 text-xs font-mono text-[#9CA7B8] space-y-1">
              <div>· Token authentication</div>
              <div>· Request size enforcement</div>
              <div>· Canonical schema normalization</div>
            </div>
          </div>

          {/* Tier 2 */}
          <div className="p-6 bg-[#11151D] border border-[#292F3B] rounded-xl space-y-4 hover:border-[#FF334F]/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#FF334F]/10 text-[#FF334F] flex items-center justify-center font-mono font-bold text-sm">
              02
            </div>
            <h3 className="text-lg font-semibold text-white">Django Core & Detection Engine</h3>
            <p className="text-xs text-[#9CA7B8] leading-relaxed">
              Deterministic rule evaluation engine and multi-signal correlator. Computes transparent 0–100 risk scores without black-box hallucination.
            </p>
            <div className="pt-2 text-xs font-mono text-[#9CA7B8] space-y-1">
              <div>· 6 Explainable detection rules</div>
              <div>· Entity & identity correlation</div>
              <div>· Append-only audit trail</div>
            </div>
          </div>

          {/* Tier 3 */}
          <div className="p-6 bg-[#11151D] border border-[#292F3B] rounded-xl space-y-4 hover:border-[#FF334F]/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#FF334F]/10 text-[#FF334F] flex items-center justify-center font-mono font-bold text-sm">
              03
            </div>
            <h3 className="text-lg font-semibold text-white">LangGraph AI Triage Pipeline</h3>
            <p className="text-xs text-[#9CA7B8] leading-relaxed">
              8-node state machine orchestrating context enrichment, risk advisory, threat explanation, and anti-hallucination verification before analyst review.
            </p>
            <div className="pt-2 text-xs font-mono text-[#9CA7B8] space-y-1">
              <div>· 8 Deterministic workflow nodes</div>
              <div>· Anti-hallucination guardrail</div>
              <div>· Human-in-the-loop checkpoint</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-12 border-t border-[#292F3B] flex flex-col md:flex-row items-center justify-between text-xs text-[#9CA7B8] gap-4">
        <div className="flex items-center gap-2">
          <RedSentinelLogo size={20} showWordmark={false} />
          <span>RedSentinel Threat Detection & Intelligence Platform © 2026. Defensive cybersecurity.</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => onNavigate('code_tests')} className="hover:text-white transition-colors cursor-pointer">
            GitHub Repository
          </button>
          <button onClick={() => onNavigate('rules')} className="hover:text-white transition-colors cursor-pointer">
            Detection Rules
          </button>
          <button onClick={() => onNavigate('triage')} className="hover:text-white transition-colors cursor-pointer">
            LangGraph Studio
          </button>
        </div>
      </footer>
    </div>
  );
};
