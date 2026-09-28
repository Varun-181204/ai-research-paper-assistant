import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  Layers,
  Sparkles,
  CheckSquare,
  Square,
  Loader2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { fetchPapers, comparePapers } from '../services/api';

export default function ComparePapers() {
  const [papers, setPapers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchPapers();
        setPapers(list);
        if (list.length >= 2) {
          setSelectedIds([list[0].id, list[1].id]);
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

  const handleRunComparison = async () => {
    if (selectedIds.length < 2) {
      setError('Please select at least 2 research papers to contrast.');
      return;
    }

    setComparing(true);
    setError(null);
    try {
      const res = await comparePapers(selectedIds);
      setComparisonResult(res);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Comparison failed.');
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <GitCompare className="w-6 h-6 text-brand-600" />
          <span>Multi-Paper Comparison</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Select multiple research papers from your library to automatically contrast methodologies,
          datasets, models, and shared limitations.
        </p>
      </div>

      {/* Paper Selection Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" />
            <span>Select Papers to Compare ({selectedIds.length} selected)</span>
          </h2>
          <button
            onClick={handleRunComparison}
            disabled={selectedIds.length < 2 || comparing}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow transition-colors disabled:opacity-50"
          >
            {comparing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing Comparative Analysis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Compare Selected Papers</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading library...</div>
        ) : papers.length < 2 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            You need at least 2 uploaded papers to run comparative analysis. Please upload more papers in the Library.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {papers.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => toggleSelect(p.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-brand-50/60 border-brand-300 shadow-xs'
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
                    <p className="text-xs font-bold text-slate-800 line-clamp-2">{p.title}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-1">
                      {p.authors || 'Authors not specified'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparison Results Card */}
      {comparisonResult && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 uppercase tracking-wider">
              Comparative Synthesis
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">Executive Comparison Summary</h2>
            <p className="text-sm text-slate-700 leading-relaxed font-serif mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
              {comparisonResult.comparison_summary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-700">
                1. Methodological Differences
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-serif">
                {comparisonResult.methodological_differences}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700">
                2. Dataset & Benchmark Comparison
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-serif">
                {comparisonResult.dataset_comparison}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700">
                3. Model Architectures & Baselines
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-serif">
                {comparisonResult.model_architectures}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                4. Performance & Trade-offs
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-serif">
                {comparisonResult.results_and_performance}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800">
              5. Shared Limitations & Scope Boundaries
            </h3>
            <p className="text-xs text-amber-900 leading-relaxed font-serif">
              {comparisonResult.common_limitations}
            </p>
          </div>

          {comparisonResult.recommendations && (
            <div className="p-5 rounded-xl bg-slate-900 text-white space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-300">
                Synthesis & Practical Recommendations
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {comparisonResult.recommendations}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
