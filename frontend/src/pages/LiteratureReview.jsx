import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  BookOpen,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle,
  Layers,
  ArrowRight,
  TrendingUp,
  FileQuestion
} from 'lucide-react';
import { fetchPapers, generateLiteratureReview } from '../services/api';

export default function LiteratureReview() {
  const [papers, setPapers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [topic, setTopic] = useState('Survey of Evaluated Methodologies, Benchmarks, and Research Gaps');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchPapers();
        setPapers(list);
        if (list.length > 0) {
          setSelectedIds(list.map((p) => p.id));
        }
      } catch (err) {
        console.error('Failed to load papers:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleGenerateReview = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      setError('Please select at least one paper to synthesize.');
      return;
    }

    setGenerating(true);
    setError(null);
    try {
      const res = await generateLiteratureReview(selectedIds, topic);
      setReviewResult(res);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Literature review generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-brand-600" />
          <span>Literature Review Assistant</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Synthesize multi-document literature reviews identifying common paradigms, benchmark comparisons,
          and scientifically verified research gaps across your research collection.
        </p>
      </div>

      {/* Control Card */}
      <form onSubmit={handleGenerateReview} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Literature Review Focus / Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Corpus Papers ({selectedIds.length} of {papers.length} selected)
            </label>
            <button
              type="button"
              onClick={() => setSelectedIds(selectedIds.length === papers.length ? [] : papers.map((p) => p.id))}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              {selectedIds.length === papers.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400">Loading paper library...</div>
          ) : papers.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              No research papers found. Upload papers to the library before generating a literature review.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1">
              {papers.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleSelect(p.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-brand-50/60 border-brand-300'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-brand-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{p.title}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {p.authors || 'Authors not specified'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={selectedIds.length === 0 || generating}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing Literature Review...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Literature Review</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Structured Review Results */}
      {reviewResult && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 uppercase tracking-wider">
              Grounded Literature Synthesis
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">{reviewResult.topic}</h2>
            <p className="text-sm text-slate-700 leading-relaxed font-serif mt-3 bg-slate-50 p-5 rounded-xl border border-slate-100">
              {reviewResult.executive_summary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>1. Research Landscape</span>
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-serif">
                {reviewResult.research_landscape}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>2. Methodological Divergence</span>
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-serif">
                {reviewResult.methodological_differences}
              </p>
            </div>
          </div>

          {/* Common Approaches & Benchmarks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Common Approaches & Paradigms
              </h3>
              <div className="flex flex-wrap gap-2">
                {reviewResult.common_approaches?.map((app, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-medium border border-blue-100">
                    {app}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                Datasets & Evaluated Benchmarks
              </h3>
              <div className="flex flex-wrap gap-2">
                {reviewResult.datasets_and_benchmarks?.map((ds, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 text-xs font-medium border border-indigo-100">
                    {ds}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Synthesis & Unaddressed Gaps */}
          <div className="p-5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Results & Benchmark Synthesis
            </h3>
            <p className="text-xs text-emerald-950 leading-relaxed font-serif">
              {reviewResult.results_synthesis}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <FileQuestion className="w-4 h-4" />
              <span>Identified Research Gaps (Grounded from Paper Limitations)</span>
            </h3>
            <ul className="space-y-2">
              {reviewResult.identified_research_gaps?.map((gap, i) => (
                <li key={i} className="text-xs text-amber-950 leading-relaxed flex items-start gap-2">
                  <span className="font-bold text-amber-700 mt-0.5">•</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
