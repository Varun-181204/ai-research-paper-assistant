import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Database,
  Cpu,
  Key,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { fetchHealth } from '../services/api';

export default function Settings() {
  const [health, setHealth] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const loadHealth = async () => {
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (err) {
      console.error('Failed to load health:', err);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const handleTestBackend = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const data = await fetchHealth();
      setHealth(data);
      setTestResult({ success: true, message: 'Backend API & Database connection healthy.' });
    } catch (err) {
      setTestResult({ success: false, message: 'Connection failed: ' + err.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-brand-600" />
          <span>System Settings & Configuration</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Inspect backend architecture, AI model configurations, vector store settings, and environment variables.
        </p>
      </div>

      {/* Backend & Diagnostics Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <Server className="w-4 h-4 text-brand-600" />
            <span>FastAPI Server Diagnostics</span>
          </div>
          <button
            onClick={handleTestBackend}
            disabled={testing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Pinging...' : 'Ping Server'}</span>
          </button>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400">Application Name</span>
            <p className="font-bold text-slate-800">{health?.app_name || 'AI Research Paper Assistant'}</p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400">Version</span>
            <p className="font-bold font-mono text-slate-800">{health?.version || '1.0.0'}</p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400">Environment</span>
            <p className="font-bold capitalize text-slate-800">{health?.environment || 'development'}</p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400">Database Dialect</span>
            <p className="font-bold text-slate-800 uppercase font-mono">{health?.database?.dialect || 'sqlite'}</p>
          </div>
        </div>
      </div>

      {/* AI & Model Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm pb-3 border-b border-slate-100">
          <Cpu className="w-4 h-4 text-brand-600" />
          <span>Generative AI & Model Parameters</span>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Active Gemini Generation Model
            </label>
            <input
              type="text"
              readOnly
              value="gemini-2.5-flash (Configurable via GEMINI_MODEL)"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Active Dense Embedding Model
            </label>
            <input
              type="text"
              readOnly
              value="text-embedding-004 (768 Dimensions, Cosine Space)"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Vector Storage Provider
            </label>
            <input
              type="text"
              readOnly
              value="ChromaDB Persistent (HNSW Indexing, ./chroma_db)"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-xs"
            />
          </div>

          <div className="p-4 bg-brand-50/60 rounded-xl border border-brand-100 text-slate-700 space-y-1.5 leading-relaxed">
            <span className="font-bold text-brand-900 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              <span>Configuring Google Gemini API Key</span>
            </span>
            <p>
              To run live inference with Google's Gemini models, ensure your API key is provided in{' '}
              <code className="bg-white px-1.5 py-0.5 rounded border border-brand-200 font-mono text-brand-800">
                backend/.env
              </code>{' '}
              as <code className="bg-white px-1.5 py-0.5 rounded border border-brand-200 font-mono text-brand-800">GOOGLE_API_KEY</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
