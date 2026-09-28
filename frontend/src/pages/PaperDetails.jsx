import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  Layers,
  MessageSquare,
  ArrowLeft,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';
import {
  fetchPaper,
  fetchPaperAnalysis,
  runPaperAnalysis,
  fetchPaperChunks,
  sendChatMessage
} from '../services/api';

const TABS = [
  'Overview',
  'Summary',
  'Key Findings',
  'Methodology',
  'Datasets & Models',
  'Results',
  'Limitations',
  'Extracted Chunks',
  'Paper Chat',
];

export default function PaperDetails() {
  const { id } = useParams();
  const paperId = parseInt(id, 10);

  const [paper, setPaper] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [chunkSearch, setChunkSearch] = useState('');

  // Inline Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await fetchPaper(paperId);
      setPaper(p);

      try {
        const a = await fetchPaperAnalysis(paperId);
        setAnalysis(a);
      } catch {
        // Analysis might not have been generated yet
      }

      const c = await fetchPaperChunks(paperId);
      setChunks(c);
    } catch (err) {
      console.error('Failed to load paper details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [paperId]);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await runPaperAnalysis(paperId);
      setAnalysis(res);
      setActiveTab('Summary');
    } catch (err) {
      alert('Analysis failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!inputQuestion.trim() || chatLoading) return;

    const q = inputQuestion.trim();
    setInputQuestion('');
    setChatMessages((prev) => [...prev, { role: 'user', content: q }]);
    setChatLoading(true);

    try {
      const res = await sendChatMessage({
        question: q,
        paperIds: [paperId],
      });
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.answer, citations: res.citations },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error processing question: ' + err.message },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
        <p className="text-sm text-slate-500">Loading paper insights...</p>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Paper not found</h2>
        <Link to="/papers" className="text-sm font-semibold text-brand-600">
          Return to Library
        </Link>
      </div>
    );
  }

  const filteredChunks = chunks.filter(
    (c) =>
      c.text.toLowerCase().includes(chunkSearch.toLowerCase()) ||
      (c.section && c.section.toLowerCase().includes(chunkSearch.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Back button */}
      <div>
        <Link
          to="/papers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </Link>
      </div>

      {/* Header Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-100">
              Research Paper #{paper.id}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {paper.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {paper.authors || 'Authors not specified'}
              </span>
              {paper.publication_year && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {paper.publication_year}
                </span>
              )}
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                {paper.page_count} pages
              </span>
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                {chunks.length} chunks indexed
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow transition-colors disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{analysis ? 'Re-run AI Analysis' : 'Run AI Analysis'}</span>
                </>
              )}
            </button>
            <a
              href={`/api/papers/${paper.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Original PDF</span>
            </a>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1 text-sm font-medium">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content Panes */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-h-[350px]">
        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400 mb-2">
                Abstract
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed font-serif bg-slate-50 p-4 rounded-xl border border-slate-100">
                {paper.abstract || 'No explicit abstract could be detected in first pages.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <span className="font-bold text-slate-800">File Ingestion Details</span>
                <p className="text-slate-600">Filename: <strong className="font-mono text-slate-900">{paper.filename}</strong></p>
                <p className="text-slate-600">Processing Status: <strong className="text-emerald-700 font-semibold">{paper.processing_status}</strong></p>
                <p className="text-slate-600">Total Indexed Chunks: <strong>{chunks.length}</strong></p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <span className="font-bold text-slate-800">Vector Store & Retrieval</span>
                <p className="text-slate-600">Collection: <strong className="font-mono text-slate-900">research_paper_chunks</strong></p>
                <p className="text-slate-600">Space: <strong>Cosine Similarity (HNSW)</strong></p>
                <p className="text-slate-600">Dense Embedding Dimensions: <strong>768</strong></p>
              </div>
            </div>
          </div>
        )}

        {/* SUMMARY TAB */}
        {activeTab === 'Summary' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Executive Summary</h3>
            {analysis?.summary ? (
              <p className="text-sm text-slate-700 leading-relaxed font-serif bg-slate-50 p-5 rounded-xl border border-slate-200">
                {analysis.summary}
              </p>
            ) : (
              <div className="text-center py-10 space-y-3">
                <p className="text-xs text-slate-500">AI analysis has not been generated for this paper yet.</p>
                <button
                  onClick={handleRunAnalysis}
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold shadow"
                >
                  Generate Summary Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* KEY FINDINGS TAB */}
        {activeTab === 'Key Findings' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Important Findings & Claims</h3>
            {analysis?.key_findings && analysis.key_findings.length > 0 ? (
              <ul className="space-y-2.5">
                {analysis.key_findings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-800">
                    <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{finding}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">Run AI Analysis to extract key findings.</p>
            )}
          </div>
        )}

        {/* METHODOLOGY TAB */}
        {activeTab === 'Methodology' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Extracted Methodology & Architecture</h3>
            {analysis?.methodology ? (
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed font-serif space-y-3">
                <p>{analysis.methodology}</p>
                {analysis.objectives && analysis.objectives.length > 0 && (
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Identified Objectives:</p>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                      {analysis.objectives.map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Run AI Analysis to extract methodology breakdown.</p>
            )}
          </div>
        )}

        {/* DATASETS & MODELS TAB */}
        {activeTab === 'Datasets & Models' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500 mb-3">
                Datasets & Benchmarks
              </h3>
              {analysis?.datasets && analysis.datasets.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analysis.datasets.map((d, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-100">
                      {d}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No explicit datasets identified.</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500 mb-3">
                Models & Algorithms
              </h3>
              {analysis?.models && analysis.models.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analysis.models.map((m, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-800 text-xs font-semibold border border-purple-100">
                      {m}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No explicit models identified.</p>
              )}
            </div>
          </div>
        )}

        {/* RESULTS TAB */}
        {activeTab === 'Results' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Experimental Results & Outcomes</h3>
            {analysis?.results ? (
              <p className="text-sm text-slate-700 leading-relaxed font-serif bg-slate-50 p-5 rounded-xl border border-slate-200">
                {analysis.results}
              </p>
            ) : (
              <p className="text-xs text-slate-400">Run AI Analysis to extract experimental results.</p>
            )}
          </div>
        )}

        {/* LIMITATIONS TAB */}
        {activeTab === 'Limitations' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Documented Limitations & Scope Constraints</h3>
            {analysis?.limitations && analysis.limitations.length > 0 ? (
              <ul className="space-y-2">
                {analysis.limitations.map((lim, idx) => (
                  <li key={idx} className="p-3 bg-amber-50/50 rounded-lg border border-amber-100 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
                    <span className="font-bold text-amber-700">•</span>
                    <span>{lim}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">No limitations recorded yet.</p>
            )}

            {analysis?.future_work && (
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Proposed Future Work</h4>
                <p className="text-xs text-slate-600 italic">{analysis.future_work}</p>
              </div>
            )}
          </div>
        )}

        {/* EXTRACTED CHUNKS TAB */}
        {activeTab === 'Extracted Chunks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-bold text-slate-900">
                Indexed Chunks ({filteredChunks.length} of {chunks.length})
              </h3>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter chunk text..."
                  value={chunkSearch}
                  onChange={(e) => setChunkSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredChunks.map((c) => (
                <div key={c.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                      Chunk #{c.chunk_index} • Page {c.page_number}
                    </span>
                    <span className="text-slate-400">{c.section || 'Main Text'}</span>
                  </div>
                  <p className="text-slate-700 font-serif leading-relaxed select-text">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAPER CHAT TAB */}
        {activeTab === 'Paper Chat' && (
          <div className="flex flex-col h-[500px]">
            <div className="flex-1 overflow-y-auto space-y-4 p-4 border border-slate-100 rounded-xl bg-slate-50">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Ask questions directly about this paper</p>
                  <p className="text-xs max-w-sm mt-1">
                    Try: "What methodology is used?" or "What are the experimental results?"
                  </p>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-xl rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-brand-600 text-white font-medium'
                          : 'bg-white text-slate-800 border border-slate-200 shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendChat} className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder={`Ask anything about "${paper.title}"...`}
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                className="flex-1 px-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={!inputQuestion.trim() || chatLoading}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow disabled:opacity-50"
              >
                {chatLoading ? 'Thinking...' : 'Send'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
