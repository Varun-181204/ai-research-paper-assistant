import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  FileText,
  MessageSquare,
  CheckCircle,
  Database,
  Server,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export default function Dashboard() {
  const { systemHealth, loading } = useOutletContext();

  const isDbConnected = systemHealth?.database?.connected;
  const dbDialect = systemHealth?.database?.dialect || 'pending';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 rounded-2xl p-8 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 1: Architecture & Foundation Initialized</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">AI Research Paper Assistant</h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Production-quality research paper analysis platform powered by FastAPI, PostgreSQL, ChromaDB, and Google Gemini.
              Extract page-grounded insights, explore literature, and chat with your papers with verifiable citations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/papers"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg shadow transition-colors"
            >
              <span>Explore Library</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* System Status & Real Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Papers</p>
            <h3 className="text-2xl font-bold text-slate-900">0</h3>
            <span className="text-xs text-slate-400">No papers uploaded yet</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Processed</p>
            <h3 className="text-2xl font-bold text-slate-900">0</h3>
            <span className="text-xs text-slate-400">Ready for Phase 2 upload</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Conversations</p>
            <h3 className="text-2xl font-bold text-slate-900">0</h3>
            <span className="text-xs text-slate-400">RAG chat sessions</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Database Status</p>
            <h3 className="text-lg font-bold text-slate-900 capitalize">
              {isDbConnected ? 'Connected' : loading ? 'Checking...' : 'Offline'}
            </h3>
            <span className="text-xs text-slate-500">Dialect: {dbDialect}</span>
          </div>
        </div>
      </div>

      {/* Diagnostics & Architecture Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backend Connectivity Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Server className="w-5 h-5 text-brand-600" />
              <span>Backend & Database Health</span>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              systemHealth?.status === 'healthy'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {systemHealth?.status || 'Polling'}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">FastAPI Project</span>
              <span className="font-medium text-slate-800">{systemHealth?.app_name || 'AI Research Paper Assistant'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Version</span>
              <span className="font-mono text-slate-800">{systemHealth?.version || '1.0.0'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Environment</span>
              <span className="capitalize font-medium text-slate-800">{systemHealth?.environment || 'development'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Primary Database Engine</span>
              <span className="font-medium text-slate-800">PostgreSQL (SQLAlchemy 2.0)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Active Connection Dialect</span>
              <span className="font-mono font-medium text-slate-800">{dbDialect}</span>
            </div>
          </div>
        </div>

        {/* Pipeline Architecture Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Layers className="w-5 h-5 text-brand-600" />
              <span>RAG Pipeline Architecture</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 text-blue-800">
              Specification
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <span className="font-bold text-brand-600">1.</span>
              <span><strong>PDF Parsing:</strong> PyMuPDF extracts text, preserving page numbers & metadata.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-brand-600">2.</span>
              <span><strong>Page-Aware Chunking:</strong> Configurable chunk size and overlap tied to source pages.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-brand-600">3.</span>
              <span><strong>Dense Vectors:</strong> Batch embeddings via Google Embedding models into ChromaDB.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-brand-600">4.</span>
              <span><strong>Grounded Citations:</strong> Synthesize answers with strict paper title and page citations.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-brand-600">5.</span>
              <span><strong>Multi-Paper Review:</strong> Cross-document reasoning and structured comparative analysis.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
