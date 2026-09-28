import React from 'react';
import { X, BookOpen, FileText, ExternalLink, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CitationModal({ citation, onClose }) {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-brand-100 text-brand-700 text-xs font-bold font-mono">
              {citation.source_tag || `[Source ${citation.citation_index}]`}
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Verified Citation Grounding
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-base font-bold text-slate-900 leading-snug">
              {citation.paper_title}
            </h4>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <FileText className="w-3.5 h-3.5 text-brand-600" />
                Page {citation.page_number}
              </span>
              <span>•</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                Section: {citation.section || 'Main Text'}
              </span>
              {citation.similarity_score !== undefined && (
                <>
                  <span>•</span>
                  <span className="text-emerald-700 font-medium">
                    Relevance: {Math.round(citation.similarity_score * 100)}%
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-brand-500" />
              Retrieved Source Passage
            </p>
            <blockquote className="text-sm text-slate-700 leading-relaxed font-serif italic border-l-2 border-brand-500 pl-3">
              "{citation.text}"
            </blockquote>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          {citation.paper_id ? (
            <Link
              to={`/papers/${citation.paper_id}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              <span>View Full Paper Details</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          ) : <div />}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
