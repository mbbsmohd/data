import React, { useState } from 'react';
import { Shield, ShieldCheck, Lock, ArrowLeft, KeyRound, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { api, setStoredAdminToken, setStoredToken } from '../services/api';

export const AdminLoginPage: React.FC<{
  onLoginSuccess: (user: any) => void;
  onBackToCustomer: () => void;
  appName?: string;
}> = ({ onLoginSuccess, onBackToCustomer, appName = 'Bukar Data Sub' }) => {
  const [identifier, setIdentifier] = useState('admin@bukardatasub.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [pending2FA, setPending2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devOtpCode, setDevOtpCode] = useState<string | undefined>(undefined);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      Swal.fire({ icon: 'warning', title: 'Missing Credentials', text: 'Enter administrator email/phone and password.' });
      return;
    }

    try {
      setLoading(true);
      const res = await api.adminLogin({ identifier: identifier.trim(), password });

      if (res.require2FA) {
        setPending2FA(true);
        if (res.devOtpCode) {
          setDevOtpCode(res.devOtpCode);
          setOtpCode(res.devOtpCode);
        }
        Swal.fire({
          icon: 'info',
          title: 'Administrator 2FA Required',
          html: `
            <div style="text-align: left; font-size: 13px;">
              <p>${res.message || 'A 6-digit authorization code has been dispatched to your registered email.'}</p>
              ${res.devOtpCode ? `<div style="margin-top: 10px; padding: 10px; background: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 8px; color: #3730A3;"><b>One-Time Code:</b> <span style="font-size: 18px; font-family: monospace; font-weight: bold; letter-spacing: 2px;">${res.devOtpCode}</span></div>` : ''}
            </div>
          `,
          confirmButtonColor: '#1E5BF9'
        });
        return;
      }

      setStoredAdminToken(res.token);
      setStoredToken(res.token);
      Swal.fire({
        icon: 'success',
        title: 'Authentication Granted',
        text: `Welcome, ${res.user.name} (${res.user.role.toUpperCase()})`,
        timer: 1500,
        showConfirmButton: false
      });
      onLoginSuccess(res.user);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: err.message || 'Failed to authenticate administrator account.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpCode.trim())) {
      Swal.fire({ icon: 'warning', title: 'Invalid Code', text: 'Enter the 6-digit authorization code.' });
      return;
    }

    try {
      setLoading(true);
      const res = await api.verifyOtp({ identifier: identifier.trim(), code: otpCode.trim(), purpose: 'LOGIN_2FA' });
      setStoredAdminToken(res.token);
      setStoredToken(res.token);
      Swal.fire({
        icon: 'success',
        title: '2FA Verified',
        text: `Privileged administrative session opened.`,
        timer: 1500,
        showConfirmButton: false
      });
      onLoginSuccess(res.user);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: '2FA Failed', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden bg-grid-slate">
      {/* Decorative Ambient Background Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between relative z-10">
        <button
          onClick={onBackToCustomer}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-white transition px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md hover:border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Customer Portal</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Surity™ 105 Rules Active</span>
          </div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>TLS 256-Bit Encrypted</span>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-8 relative z-10 animate-fade-in-up">
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2.5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/30 border border-blue-500/30 text-blue-400 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/10 animate-float">
              <Shield className="w-8 h-8 stroke-[1.75]" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold block mb-1">
                {appName} • Restricted Gateway
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Staff &amp; Admin Command Center
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
              Privileged access portal. Customer logins are strictly rejected. All attempts are cryptographically audited.
            </p>
          </div>

          {!pending2FA ? (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Administrator Email / Username
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="admin@bukardatasub.com"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Security Passphrase
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••••••"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3.5 px-4 rounded-xl text-sm transition shadow-lg shadow-blue-600/30 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>{loading ? 'Verifying Credentials...' : 'Authenticate Admin Session'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div className="p-3.5 bg-blue-950/60 border border-blue-800/80 rounded-2xl text-xs text-blue-200 text-center leading-relaxed">
                A 6-digit authorization code was dispatched to <strong>{identifier}</strong>. Enter it below to unlock the command center.
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 text-center">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border-2 border-blue-500/60 rounded-xl py-3 text-center text-2xl font-black font-mono tracking-widest text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="000000"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3.5 px-4 rounded-xl text-sm transition shadow-lg shadow-blue-600/30 disabled:opacity-50"
              >
                {loading ? 'Authorizing...' : 'Authorize Administrative Access'}
              </button>

              <button
                type="button"
                onClick={() => setPending2FA(false)}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition pt-1"
              >
                ← Back to Password Entry
              </button>
            </form>
          )}

          {/* Security Alert Footer */}
          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 text-center space-y-1">
            <p className="flex items-center justify-center space-x-1.5 text-slate-400 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Strict RBAC Security Policy Enforced</span>
            </p>
            <p>Customers attempting unauthorized access will be logged and blocked by IP firewall.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto w-full text-center text-xs text-slate-600 font-mono relative z-10">
        © 2026 {appName} Command Engine • Zero-Trust Financial Infrastructure
      </div>
    </div>
  );
};
