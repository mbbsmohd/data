import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Lock, Unlock, LogOut, History, Users, UserCheck,
  CheckCircle, AlertTriangle, RefreshCw, Search, Clock, Key
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../../services/api';

interface UserSecurityControlsProps {
  onRefreshUsers?: () => void;
}

export const UserSecurityControls: React.FC<UserSecurityControlsProps> = ({ onRefreshUsers }) => {
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('');

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await api.getUserRegistrationStats();
      if (res && res.success) {
        setStats(res.stats);
      }
    } catch (err: any) {
      console.error('Failed to load user registration stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.getLoginHistory({
        search: historySearch || undefined,
        status: historyStatusFilter || undefined,
        limit: 50
      });
      if (res && res.success) {
        setLoginHistory(res.history || []);
      }
    } catch (err: any) {
      console.error('Failed to load login history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (showHistoryModal) {
      fetchHistory();
    }
  }, [showHistoryModal, historyStatusFilter]);

  return (
    <div className="space-y-4">
      {/* Registration & User Velocity Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-5 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">User Registration & Account Velocity Metrics</h3>
              <p className="text-[11px] text-slate-300">Verified counts calculated across authoritative database timestamps</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition border border-white/10"
            >
              <History className="w-3.5 h-3.5" />
              <span>Login Security Audit Log</span>
            </button>

            <button
              onClick={fetchStats}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition text-slate-300"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center text-xs">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Users</span>
              <div className="text-lg font-black text-white mt-0.5">{stats.totalUsers || 0}</div>
            </div>

            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">New Today</span>
              <div className="text-lg font-black text-emerald-400 mt-0.5">{stats.newToday || 0}</div>
            </div>

            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-indigo-300 block">This Week</span>
              <div className="text-lg font-black text-indigo-300 mt-0.5">{stats.newThisWeek || 0}</div>
            </div>

            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-indigo-300 block">This Month</span>
              <div className="text-lg font-black text-indigo-300 mt-0.5">{stats.newThisMonth || 0}</div>
            </div>

            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-cyan-300 block">This Quarter</span>
              <div className="text-lg font-black text-cyan-300 mt-0.5">{stats.newThisQuarter || 0}</div>
            </div>

            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-cyan-300 block">This Year</span>
              <div className="text-lg font-black text-cyan-300 mt-0.5">{stats.newThisYear || 0}</div>
            </div>

            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Active Users</span>
              <div className="text-lg font-black text-emerald-400 mt-0.5">{stats.activeUsers || 0}</div>
            </div>

            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-rose-400 block">Locked Accounts</span>
              <div className="text-lg font-black text-rose-400 mt-0.5">{stats.lockedUsers || 0}</div>
            </div>
          </div>
        )}
      </div>

      {/* Login History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-4xl w-full shadow-2xl space-y-5 animate-scaleIn max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">
                  Login History & Security Activity Explorer
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchHistory()}
                  placeholder="Filter by email or IP..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <select
                value={historyStatusFilter}
                onChange={e => setHistoryStatusFilter(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
              </select>

              <button
                onClick={fetchHistory}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
              >
                Search
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              {loadingHistory ? (
                <div className="py-16 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  <span className="text-xs">Loading login records...</span>
                </div>
              ) : loginHistory.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No login attempts found.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                      <th className="py-2.5 px-3 rounded-l-xl">Status</th>
                      <th className="py-2.5 px-3">Account Email</th>
                      <th className="py-2.5 px-3">IP Address (Masked)</th>
                      <th className="py-2.5 px-3">User Agent / Platform</th>
                      <th className="py-2.5 px-3">Reason / Details</th>
                      <th className="py-2.5 px-3 rounded-r-xl">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {loginHistory.map((h: any) => (
                      <tr key={h.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            h.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{h.email}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{h.ip_masked}</td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate" title={h.user_agent}>
                          {h.user_agent}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{h.failure_reason || '—'}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                          {new Date(h.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
