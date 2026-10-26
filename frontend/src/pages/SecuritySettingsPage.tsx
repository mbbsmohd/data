import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Lock, KeyRound, Fingerprint, Smartphone, AlertCircle,
  CheckCircle2, RefreshCw, Eye, EyeOff, ShieldAlert, Laptop, Mail, Shield,
  Volume2, VolumeX
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import { soundEngine, playSuccessSound } from '../utils/sound';

export const SecuritySettingsPage: React.FC<{
  user: any;
  onRefreshUser: () => void;
  onBack: () => void;
}> = ({ user, onRefreshUser, onBack }) => {
  // PIN change state
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loadingPin, setLoadingPin] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Biometrics
  const [biometricEnabled, setBiometricEnabled] = useState(Boolean(user?.biometric_enabled || user?.biometricEnabled));
  const [loadingBio, setLoadingBio] = useState(false);

  // Two-Factor Authentication (2FA)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(Boolean(user?.two_factor_enabled || user?.twoFactorEnabled));
  const [loading2FA, setLoading2FA] = useState(false);

  // Audio & Sound Feedback
  const [soundEnabled, setSoundEnabled] = useState(soundEngine.isEnabled());

  // Active Sessions
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.getSessions();
      if (res.success) {
        setSessions(res.sessions || []);
      }
    } catch {
      setSessions([
        {
          id: 'sess_1',
          device: 'Current Authoritative Session (Active)',
          ip: '127.0.0.1',
          location: 'Nigeria',
          lastActive: 'Just now',
          isCurrent: true
        }
      ]);
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      Swal.fire({ icon: 'warning', title: 'Invalid PIN', text: 'New PIN must be exactly 4 digits.' });
      return;
    }
    if (newPin !== confirmPin) {
      Swal.fire({ icon: 'error', title: 'PIN Mismatch', text: 'The confirmed PIN does not match.' });
      return;
    }

    try {
      setLoadingPin(true);
      const res = await api.changePin({ oldPin: oldPin || undefined, newPin });
      Swal.fire({
        icon: 'success',
        title: 'Transaction PIN Updated!',
        text: res.message || 'Your 4-digit authorization PIN has been saved securely.',
        confirmButtonColor: '#2563EB'
      });
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      onRefreshUser();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message });
    } finally {
      setLoadingPin(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      Swal.fire({ icon: 'warning', title: 'Weak Password', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Swal.fire({ icon: 'error', title: 'Password Mismatch', text: 'Passwords do not match.' });
      return;
    }

    try {
      setLoadingPassword(true);
      await api.changePassword({ oldPassword, newPassword });
      Swal.fire({
        icon: 'success',
        title: 'Password Changed!',
        text: 'Your account login password has been successfully updated.',
        confirmButtonColor: '#2563EB'
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onRefreshUser();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message });
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleToggleBiometrics = async () => {
    try {
      setLoadingBio(true);
      const next = !biometricEnabled;
      await api.toggleBiometrics(next);
      setBiometricEnabled(next);
      onRefreshUser();
      Swal.fire({
        icon: 'success',
        title: next ? 'Biometrics Enabled' : 'Biometrics Disabled',
        text: next ? 'Hardware biometric authorization is now active.' : 'Biometric login has been deactivated.',
        timer: 1800,
        showConfirmButton: false
      });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    } finally {
      setLoadingBio(false);
    }
  };

  const handleToggle2FA = async () => {
    try {
      setLoading2FA(true);
      const next = !twoFactorEnabled;
      const res = await api.toggle2FA(next);
      setTwoFactorEnabled(res.twoFactorEnabled);
      onRefreshUser();
      Swal.fire({
        icon: 'success',
        title: next ? 'Two-Factor Authentication Active' : '2FA Deactivated',
        text: next
          ? `2FA is now activated. Every sign-in attempt will require a real-time 6-digit OTP dispatched to ${user?.email || 'your registered email'}.`
          : 'Two-Factor Authentication has been turned off for this account.',
        confirmButtonColor: '#2563EB'
      });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: '2FA Update Failed', text: err.message });
    } finally {
      setLoading2FA(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1.5 mb-2 transition"
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </button>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center space-x-3">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-2xl">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <span>Security & Authentication Center</span>
        </h1>
        <p className="text-sm text-slate-600 font-medium mt-1">
          Configure authoritative Two-Factor Authentication (2FA), 4-digit transaction PIN, login password, and hardware biometrics.
        </p>
      </div>

      {/* Two-Factor Authentication (2FA) Feature Highlight Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              twoFactorEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-base font-black text-slate-900">Two-Factor Authentication (2FA via Email OTP)</h3>
                <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  twoFactorEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {twoFactorEnabled ? 'Active & Protected' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Requires a 6-digit one-time verification code dispatched to <strong className="font-semibold text-slate-900">{user?.email}</strong> upon every login attempt. Blocks unauthorized logins even if someone knows your password.
              </p>
            </div>
          </div>

          <button
            onClick={handleToggle2FA}
            disabled={loading2FA}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm shrink-0 ${
              twoFactorEnabled
                ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {loading2FA ? 'Updating 2FA...' : twoFactorEnabled ? 'Turn Off 2FA' : 'Enable 2FA (Email OTP)'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transaction PIN Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">4-Digit Transaction PIN</h3>
              <p className="text-xs text-slate-500 font-medium">Authorizes all debits, VTU orders, and print requests</p>
            </div>
          </div>

          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs text-blue-900 font-medium leading-relaxed">
            Default platform PIN is <strong className="font-mono font-bold text-blue-950">1234</strong>. Locked for 15 minutes after 4 consecutive failed attempts.
          </div>

          <form onSubmit={handleUpdatePin} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Current PIN (Optional if never changed)</label>
              <input
                type="password"
                maxLength={4}
                value={oldPin}
                onChange={e => setOldPin(e.target.value.replace(/\D/g, ''))}
                placeholder="****"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">New 4-Digit PIN</label>
              <input
                type="password"
                maxLength={4}
                required
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4 digits"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Confirm New PIN</label>
              <input
                type="password"
                maxLength={4}
                required
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Repeat 4 digits"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loadingPin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl transition shadow-sm disabled:opacity-50 mt-2"
            >
              {loadingPin ? 'Updating PIN...' : 'Save New Transaction PIN'}
            </button>
          </form>
        </div>

        {/* Account Password Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Change Account Password</h3>
              <p className="text-xs text-slate-500 font-medium">Protect your portal login credentials</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Current Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">New Password (min 8 chars)</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter strong new password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={e => setShowPassword(e.target.checked)}
                  className="rounded text-purple-600 w-4 h-4"
                />
                <span className="font-semibold text-slate-700">Show passwords</span>
              </label>

              <button
                type="submit"
                disabled={loadingPassword}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {loadingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Biometric Security Row */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Fingerprint className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-900">Biometric Authentication (Touch ID / Face ID)</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Enable hardware biometric verification on supported mobile devices and browsers for fast, zero-password login.
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleBiometrics}
          disabled={loadingBio}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm shrink-0 ${
            biometricEnabled
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          {biometricEnabled ? 'Biometrics Active ✓' : 'Enable Biometrics'}
        </button>
      </div>

      {/* Audio Feedback & Success Chimes */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            soundEnabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
          }`}>
            {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-base font-black text-slate-900">Transaction Audio Confirmation Chime</h4>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                soundEnabled ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'
              }`}>
                {soundEnabled ? 'Enabled' : 'Muted'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Plays a synthesized dual-tone fintech chime upon confirmed VTU delivery, payment receipt, and wallet credit.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              playSuccessSound();
              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Chime preview played!',
                showConfirmButton: false,
                timer: 1500
              });
            }}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5"
          >
            <Volume2 className="w-4 h-4 text-blue-600" />
            <span>Test Sound</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              soundEngine.setEnabled(next);
              setSoundEnabled(next);
            }}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm ${
              soundEnabled
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {soundEnabled ? 'Mute Chimes' : 'Turn On Audio'}
          </button>
        </div>
      </div>

      {/* Active Login Sessions */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h4 className="text-base font-black text-slate-900 flex items-center space-x-2">
          <Laptop className="w-5 h-5 text-slate-600" />
          <span>Active Login Sessions</span>
        </h4>

        <div className="space-y-2.5">
          {sessions.map(sess => (
            <div key={sess.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 text-sm block">{sess.device}</span>
                <span className="text-xs text-slate-500 font-mono mt-0.5 block">
                  IP: {sess.ip} • Location: {sess.location} • Last active: {sess.lastActive}
                </span>
              </div>
              {sess.isCurrent ? (
                <span className="text-xs font-black bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  Current Device
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-400">Authenticated</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
