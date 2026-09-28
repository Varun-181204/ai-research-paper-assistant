import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Library,
  UploadCloud,
  Search,
  FileText,
  MessageSquare,
  Sparkles,
  Trash2,
  ExternalLink,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { fetchPapers, deletePaper } from '../services/api';
import UploadModal from '../components/UploadModal';

export default function PaperLibrary() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const navigate = useNavigate();

  const loadPapers = async () => {
    setLoading(true);
    try {
      const data = await fetchPapers(searchTerm, statusFilter);
      setPapers(data);
    } catch (err) {
      console.error('Error fetching papers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPapers();
  }, [searchTerm, statusFilter]);

  const handleDelete = async (paperId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will remove all chunks and vectors.`)) {
      return;
    }
    try {
      await deletePaper(paperId);
      loadPapers();
    } catch (err) {
      alert('Failed to delete paper: ' + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Library className="w-6 h-6 text-brand-600" />
            <span>Research Paper Library</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your indexed research papers, view page-level chunks, and trigger deep analyses.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg shadow transition-colors"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Paper (PDF)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search papers by title, author, or filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PROCESSING">Processing</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Papers Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600 mx-auto" />
            <p className="text-xs">Loading research papers...</p>
          </div>
        ) : papers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Paper</th>
                  <th className="py-3.5 px-4">Pages & Chunks</th>
                  <th className="py-3.5 px-4">Processing Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {papers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 max-w-md">
                      <Link
                        to={`/papers/${paper.id}`}
                        className="font-bold text-slate-900 hover:text-brand-600 line-clamp-2"
                      >
                        {paper.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>{paper.authors || 'Authors not specified'}</span>
                        {paper.publication_year && (
                          <>
                            <span>•</span>
                            <span>{paper.publication_year}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="font-mono text-slate-400">{paper.filename}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800">{paper.page_count} pages</span>
                        <p className="text-slate-400">{paper.chunk_count} chunks indexed</p>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        paper.processing_status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        paper.processing_status === 'PROCESSING' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                        paper.processing_status === 'FAILED' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {paper.processing_status === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {paper.processing_status === 'FAILED' && <AlertCircle className="w-3.5 h-3.5" />}
                        {paper.processing_status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/papers/${paper.id}`}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                          <span>Analyze</span>
                        </Link>
                        <Link
                          to={`/chat?paper=${paper.id}`}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Chat with paper"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(paper.id, paper.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete paper"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No research papers found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || statusFilter
                ? 'Try adjusting your search terms or filter settings.'
                : 'Upload your first research paper to get started.'}
            </p>
            {!searchTerm && !statusFilter && (
              <button
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold shadow hover:bg-brand-500"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Paper Now</span>
              </button>
            )}
          </div>
        )}
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => loadPapers()}
      />
    </div>
  );
}
