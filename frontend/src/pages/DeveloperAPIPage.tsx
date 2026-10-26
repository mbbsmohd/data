import React, { useState, useEffect } from 'react';
import { Code, Key, Copy, CheckCircle2, Shield, Play, Terminal, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';

export const DeveloperAPIPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [keys, setKeys] = useState<any[]>([]);
  const [keyName, setKeyName] = useState('Production Live Key');
  const [ipAllowlist, setIpAllowlist] = useState('197.210.65.12');
  const [loading, setLoading] = useState(false);
  const [newKeyDetails, setNewKeyDetails] = useState<any | null>(null);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const res = await api.getResellerKeys();
      if (res.success) setKeys(res.keys);
    } catch {
      // Fallback
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.generateResellerKey({ name: keyName, ipAllowlist });
      setNewKeyDetails(res);
      Swal.fire({
        icon: 'success',
        title: 'API Key Generated!',
        text: 'Make sure to copy your Secret Key now. It will not be shown again.',
        confirmButtonColor: '#1E5BF9'
      });
      loadKeys();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Generation Failed', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={onBack} className="text-xs font-bold text-blue-600 hover:underline mb-1 inline-block">
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Developer API & Webhooks
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Integrate high-speed telecom VTU services directly into your own website or mobile app
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Key Generator */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 card-shadow">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Generate Business API Key</h2>
          <p className="text-xs text-slate-500 mb-4">Each key includes automated daily quota tracking and IP allowlisting.</p>

          <form onSubmit={handleGenerateKey} className="space-y-4">
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Key Name / Label
              </label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="w-full text-sm font-bold border border-slate-200 rounded-2xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                IP Allowlist (Optional, comma separated)
              </label>
              <input
                type="text"
                value={ipAllowlist}
                onChange={(e) => setIpAllowlist(e.target.value)}
                placeholder="e.g. 197.210.65.12, 102.89.32.4"
                className="w-full text-sm font-mono border border-slate-200 rounded-2xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {newKeyDetails && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2 text-xs">
                <div className="font-extrabold text-emerald-900 text-sm">Save Your API Credentials:</div>
                <div>
                  <span className="text-slate-500 font-bold block">Public Key:</span>
                  <span className="font-mono font-bold text-slate-900 select-all">{newKeyDetails.apiKey}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">Secret Key (Copy now):</span>
                  <span className="font-mono font-bold text-emerald-700 bg-white p-1 rounded border border-emerald-300 block select-all">
                    {newKeyDetails.apiSecret}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl hover:bg-blue-700 transition shadow-md shadow-blue-500/20"
            >
              {loading ? 'Generating...' : 'Issue New API Key'}
            </button>
          </form>
        </div>

        {/* Existing Keys */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 card-shadow">
          <h2 className="text-base font-bold text-slate-900 mb-3">Active API Keys</h2>
          {keys.length === 0 ? (
            <p className="text-xs text-slate-400">No API keys issued yet</p>
          ) : (
            <div className="space-y-3">
              {keys.map(k => (
                <div key={k.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                  <div className="font-bold text-slate-800">{k.name}</div>
                  <div className="font-mono text-[10px] text-blue-700 mt-1 select-all">{k.api_key}</div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                    <span>Daily Quota: ₦{(k.daily_quota || 500000).toLocaleString()}</span>
                    <span className="text-emerald-600 font-bold">Active ✓</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Code Snippet & Documentation */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 md:p-8 font-mono text-xs border border-slate-800 card-shadow overflow-x-auto">
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-800 text-slate-400 text-xs font-bold">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Interactive Purchase Endpoint: POST /api/vtu/purchase</span>
        </div>
        <pre className="mt-4 text-emerald-400">{`curl -X POST https://api.bukardatasub.com/api/vtu/purchase \\
  -H "Authorization: Bearer bds_live_98124981923..." \\
  -H "Idempotency-Key: TXN-REQ-981249" \\
  -H "Content-Type: application/json" \\
  -d '{
    "category": "data",
    "billerOrNetwork": "MTN",
    "planCode": "MTN-SME-1GB",
    "recipient": "09131797675",
    "amount": 260
  }'`}</pre>
        <div className="mt-4 pt-4 border-t border-slate-800 text-blue-400">{`// Response 200 OK
{
  "success": true,
  "transactionId": "vtu_9812739182",
  "reference": "VTU-20261022-XXXXX",
  "status": "COMPLETED",
  "chargedAmount": 260.00,
  "newBalance": 4799.04
}`}</div>
      </div>
    </div>
  );
};
