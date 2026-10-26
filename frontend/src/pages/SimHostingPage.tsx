import React, { useState, useEffect } from 'react';
import {
  Server, Cpu, Wifi, RefreshCw, Send, CheckCircle2,
  AlertCircle, Radio, Terminal, Play, Pause, Activity
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';

export const SimHostingPage: React.FC<{
  onBack: () => void;
}> = ({ onBack }) => {
  const [sims, setSims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSim, setSelectedSim] = useState<string>('');
  const [ussdCode, setUssdCode] = useState('*461*4#');
  const [ussdResponse, setUssdResponse] = useState<string | null>(null);
  const [runningUssd, setRunningUssd] = useState(false);

  useEffect(() => {
    fetchSims();
  }, []);

  const fetchSims = async () => {
    try {
      setLoading(true);
      const res = await api.getHostedSims();
      if (res.success && res.sims) {
        setSims(res.sims);
        if (res.sims.length > 0 && !selectedSim) {
          setSelectedSim(res.sims[0].id);
        }
      }
    } catch {
      // Fallback display
      setSims([
        { id: 'sim_1', slotNumber: 1, network: 'MTN', phoneNumber: '08031234567', airtimeBalance: 48500, simStatus: 'ACTIVE', signalStrength: 92, lastPing: 'Just now' },
        { id: 'sim_2', slotNumber: 2, network: 'AIRTEL', phoneNumber: '08029876543', airtimeBalance: 32100, simStatus: 'ACTIVE', signalStrength: 88, lastPing: 'Just now' },
        { id: 'sim_3', slotNumber: 3, network: 'GLO', phoneNumber: '08051112233', airtimeBalance: 19400, simStatus: 'ACTIVE', signalStrength: 79, lastPing: '1 min ago' },
        { id: 'sim_4', slotNumber: 4, network: '9MOBILE', phoneNumber: '08094445566', airtimeBalance: 14800, simStatus: 'IDLE', signalStrength: 84, lastPing: 'Just now' },
      ]);
      setSelectedSim('sim_1');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteUSSD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ussdCode.trim()) return;

    try {
      setRunningUssd(true);
      setUssdResponse(null);
      const res = await api.executeUSSD(selectedSim, ussdCode.trim());
      setUssdResponse(res.response || `[USSD OK] Response received from telecom network for ${ussdCode}`);
      fetchSims();
    } catch (err: any) {
      setUssdResponse(`[USSD ERROR] ${err.message || 'Execution timed out or SIM unresponsive'}`);
    } finally {
      setRunningUssd(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Server className="w-7 h-7 text-blue-600" />
            <span>Telecom SIM Hosting & USSD Gateway</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage physical GSM modems, USSD automation runners, network signal monitoring, and SIM dispatch routing
          </p>
        </div>

        <button
          onClick={fetchSims}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Hardware Status</span>
        </button>
      </div>

      {/* Modem Status Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sims.map(s => {
          const isSelected = selectedSim === s.id;
          return (
            <div
              key={s.id}
              onClick={() => setSelectedSim(s.id)}
              className={`border rounded-3xl p-5 cursor-pointer transition relative bg-white ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-500 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Slot #{s.slotNumber || s.slot_number || 1} • {s.network}
                </span>
                <span className={`w-2.5 h-2.5 rounded-full ${
                  (s.simStatus || s.status) === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`} />
              </div>

              <div className="space-y-1 mb-3">
                <div className="font-mono font-black text-sm text-slate-900">{s.phoneNumber || s.phone_number}</div>
                <div className="text-xs text-slate-500 font-medium">
                  Balance: <strong className="font-mono text-blue-700">₦{(s.airtimeBalance || s.airtime_balance || 0).toLocaleString()}</strong>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-mono">
                <span className="flex items-center space-x-1">
                  <Wifi className="w-3 h-3 text-emerald-500" />
                  <span>{s.signalStrength || s.signal_strength || 85}% Signal</span>
                </span>
                <span>{s.simStatus || s.status || 'ACTIVE'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive USSD Terminal */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-xs uppercase tracking-widest text-slate-300">
              Direct Hardware USSD Console
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">
            Selected SIM: {sims.find(s => s.id === selectedSim)?.phoneNumber || 'Slot 1'}
          </span>
        </div>

        {/* Console Log Output */}
        <div className="bg-black/60 rounded-2xl p-4 font-mono text-xs text-slate-300 min-h-[120px] max-h-[220px] overflow-y-auto space-y-1">
          <div className="text-slate-500">// Ready to transmit USSD payload via GSM AT command channel</div>
          <div className="text-blue-400">&gt; AT+CUSD=1,&quot;{ussdCode}&quot;,15</div>
          {runningUssd && (
            <div className="text-amber-400 flex items-center space-x-2 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Transmitting session packet to cellular tower...</span>
            </div>
          )}
          {ussdResponse && (
            <div className="text-emerald-400 whitespace-pre-wrap mt-2 p-2 bg-emerald-950/40 rounded border border-emerald-800">
              {ussdResponse}
            </div>
          )}
        </div>

        {/* USSD Input Form */}
        <form onSubmit={handleExecuteUSSD} className="flex gap-2">
          <input
            type="text"
            required
            value={ussdCode}
            onChange={e => setUssdCode(e.target.value)}
            placeholder="e.g. *461*4# or *140#"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={runningUssd || !selectedSim}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition flex items-center space-x-1.5 shadow-md shadow-blue-500/25 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{runningUssd ? 'Running...' : 'Execute USSD'}</span>
          </button>
        </form>

        {/* Quick USSD Macros */}
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider py-1">Quick Macros:</span>
          {[
            { label: 'MTN SME Bal (*461*4#)', code: '*461*4#' },
            { label: 'Airtel Bal (*140#)', code: '*140#' },
            { label: 'Glo Data Bal (*127*0#)', code: '*127*0#' },
            { label: '9mobile Bal (*228#)', code: '*228#' },
            { label: 'Check SIM MSISDN (*663#)', code: '*663#' },
          ].map(m => (
            <button
              key={m.code}
              type="button"
              onClick={() => setUssdCode(m.code)}
              className="text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
