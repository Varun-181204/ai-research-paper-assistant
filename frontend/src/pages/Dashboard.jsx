import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  FileText,
  MessageSquare,
  CheckCircle,
  Database,
  UploadCloud,
  ArrowRight,
  Sparkles,
  Server,
  Layers,
  Clock,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { fetchDashboardStats, deletePaper } from '../services/api';
import UploadModal from '../components/UploadModal';

export default function Dashboard() {
  const { systemHealth } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const loadStats = async () => {
    try {
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDeletePaper = async (paperId, e) => {
    e.preventDefault();
    if (!window.confirm(`Delete paper #${paperId}?`)) return;
    try {
      await deletePaper(paperId);
      loadStats();
    } catch (err) {
      alert('Failed to delete paper: ' + err.message);
    }
  };

  const isDbConnected = systemHealth?.database?.connected;
  const dbDialect = systemHealth?.database?.dialect || 'sqlite';

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 rounded-2xl p-8 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Pipeline Active: Ingestion • RAG • Citations • Analysis</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">AI Research Paper Assistant</h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Upload scientific PDFs to extract page-grounded text, explore semantic embeddings in ChromaDB,
              conduct multi-paper literature reviews, and chat with verifiable citations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg shadow transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Paper (PDF)</span>
            </button>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-brand-400" />
              <span>Open Research Chat</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Real Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Papers</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.total_papers ?? 0}</h3>
            <span className="text-xs text-slate-400">{stats?.papers_processed ?? 0} indexed in vectors</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Chunks</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.total_chunks ?? 0}</h3>
            <span className="text-xs text-slate-400">Page-aware dense vectors</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Chat Conversations</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.total_conversations ?? 0}</h3>
            <span className="text-xs text-slate-400">Grounded Q&A threads</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Research Notes</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.total_notes ?? 0}</h3>
            <span className="text-xs text-slate-400">Database dialect: {dbDialect}</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Papers */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              <span>Recent Research Papers</span>
            </h2>
            <Link to="/papers" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              <span>View All Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {stats?.recent_papers && stats.recent_papers.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {stats.recent_papers.map((p) => (
                  <div key={p.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Link to={`/papers/${p.id}`} className="font-semibold text-slate-900 hover:text-brand-600 text-sm truncate block">
                        {p.title}
                      </Link>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span>{p.authors || 'Authors not specified'}</span>
                        <span>•</span>
                        <span>{p.page_count} pages</span>
                        <span>•</span>
                        <span>{p.chunk_count} chunks</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        p.processing_status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        p.processing_status === 'PROCESSING' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                        p.processing_status === 'FAILED' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {p.processing_status}
                      </span>
                      <Link
                        to={`/papers/${p.id}`}
                        className="p-1.5 text-slate-400 hover:text-brand-600 rounded-md hover:bg-slate-100"
                        title="View Details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">No research papers in library</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Get started by uploading your first research paper in PDF format.
                </p>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold shadow hover:bg-brand-500"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Paper Now</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Quick Actions & System Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" />
              <span>Platform Capabilities</span>
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              <Link to="/papers" className="p-2.5 rounded-lg border border-slate-100 hover:border-brand-200 hover:bg-brand-50/40 block transition-colors">
                <strong className="text-slate-800 block">1. PDF & Page Chunking</strong>
                Extracts text, preserving page numbers & sections.
              </Link>
              <Link to="/chat" className="p-2.5 rounded-lg border border-slate-100 hover:border-brand-200 hover:bg-brand-50/40 block transition-colors">
                <strong className="text-slate-800 block">2. Grounded RAG Chat</strong>
                Answers queries with source page citations.
              </Link>
              <Link to="/compare" className="p-2.5 rounded-lg border border-slate-100 hover:border-brand-200 hover:bg-brand-50/40 block transition-colors">
                <strong className="text-slate-800 block">3. Multi-Paper Comparison</strong>
                Contrasts methodologies and datasets across papers.
              </Link>
              <Link to="/review" className="p-2.5 rounded-lg border border-slate-100 hover:border-brand-200 hover:bg-brand-50/40 block transition-colors">
                <strong className="text-slate-800 block">4. Literature Review</strong>
                Auto-generates surveys and research gap analysis.
              </Link>
            </div>
          </div>

          {/* Recent Notes Preview */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" />
                <span>Recent Notes</span>
              </h3>
              <Link to="/notes" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                View all
              </Link>
            </div>
            {stats?.recent_notes && stats.recent_notes.length > 0 ? (
              <div className="space-y-2">
                {stats.recent_notes.map((n) => (
                  <Link
                    key={n.id}
                    to="/notes"
                    className="block p-2 rounded-lg hover:bg-slate-50 text-xs border border-slate-100"
                  >
                    <p className="font-semibold text-slate-800 truncate">{n.title}</p>
                    <p className="text-slate-500 truncate mt-0.5">{n.content}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No notes written yet. Keep research notes on your papers.</p>
            )}
          </div>
        </div>
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => loadStats()}
      />
    </div>
  );
}
