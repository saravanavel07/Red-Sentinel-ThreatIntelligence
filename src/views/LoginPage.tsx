import React, { useState } from 'react';
import { RedSentinelLogo } from '../components/RedSentinelLogo';
import { Eye, EyeOff, Lock, Mail, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onSuccess: (user: { name: string; role: string; email: string }) => void;
  onCancel: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onCancel }) => {
  const [email, setEmail] = useState('sarah.chen@redsentinel.internal');
  const [password, setPassword] = useState('SentinelSecOps2026!');
  const [role, setRole] = useState('Lead SecOps Engineer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both authorized email address and security credential.');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid authorized security operator email.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess({
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        role,
        email,
      });
    }, 600);
  };

  const handleDemoFill = () => {
    setEmail('sarah.chen@redsentinel.internal');
    setPassword('SentinelSecOps2026!');
    setRole('Lead SecOps Engineer');
    setError(null);
  };

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-65px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#11151D] border border-[#292F3B] rounded-xl p-8 shadow-2xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <RedSentinelLogo size={54} showWordmark={false} />
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">RedSentinel Operator Sign In</h1>
            <p className="text-xs text-[#9CA7B8] mt-1">Authorized SOC & Threat Intelligence Console</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-[#FF334F]/10 border border-[#FF334F]/30 rounded-lg flex items-center gap-2.5 text-xs text-[#FF5C6C]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#9CA7B8] mb-1.5">Operator Identity / Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@redsentinel.internal"
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#151A23] border border-[#292F3B] rounded-lg text-white focus:outline-none focus:border-[#FF334F] font-mono transition-colors"
              />
              <Mail className="w-4 h-4 text-[#9CA7B8] absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[#9CA7B8]">Security Credential</label>
              <button
                type="button"
                onClick={() => alert('Demo platform note: Use any credential with the demo account to sign in.')}
                className="text-[11px] text-[#FF5C6C] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 text-xs bg-[#151A23] border border-[#292F3B] rounded-lg text-white focus:outline-none focus:border-[#FF334F] font-mono transition-colors"
              />
              <Lock className="w-4 h-4 text-[#9CA7B8] absolute left-3 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#9CA7B8] hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9CA7B8] mb-1.5">Assigned Security Role</label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#151A23] border border-[#292F3B] rounded-lg text-white focus:outline-none focus:border-[#FF334F] transition-colors"
              >
                <option value="SOC Tier 1 Analyst">SOC Tier 1 Analyst (Triage & Validation)</option>
                <option value="Tier 2 Incident Responder">Tier 2 Incident Responder (Forensics & Containment)</option>
                <option value="Lead SecOps Engineer">Lead SecOps Engineer (Policy & Escalation)</option>
                <option value="Platform Administrator">Platform Administrator (Full Permissions)</option>
              </select>
              <Shield className="w-4 h-4 text-[#9CA7B8] absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#FF334F] hover:bg-[#FF5C6C] rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Authenticate Session</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleDemoFill}
              className="w-full py-2 text-xs font-medium text-[#9CA7B8] hover:text-white bg-[#151A23] hover:bg-[#1B2230] border border-[#292F3B] rounded-lg transition-colors cursor-pointer"
            >
              Fill Demo SecOps Credentials
            </button>
          </div>
        </form>

        <div className="pt-2 text-center">
          <button
            onClick={onCancel}
            className="text-xs text-[#9CA7B8] hover:text-white transition-colors cursor-pointer"
          >
            ← Back to Overview
          </button>
        </div>
      </div>
    </div>
  );
};
