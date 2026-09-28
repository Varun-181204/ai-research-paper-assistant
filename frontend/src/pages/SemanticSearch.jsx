import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Sparkles,
  FileText,
  Bookmark,
  Calendar,
  User,
  ArrowRight,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { searchPapers } from '../services/api';
import CitationModal from '../components/CitationModal';

export default function SemanticSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeCitation, setActiveCitation] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await searchPapers(query.trim(), 10);
      setResults(data.results || []);
    } catch (err) {
      console.error('Semantic search error:', err);
      alert('Search failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <Search className="w-6 h-6 text-brand-600" />
          <span>Semantic Paper Search</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Search across the entire indexed paper corpus using natural language queries and dense vector similarity.
        </p>
      </div>

      {/* Search Input Card */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 ml-2" />
          <input
            type="text"
            placeholder="Search concepts, findings, or algorithms (e.g., 'attention mechanisms in medical imaging')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Semantic Search</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Results Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
            <p className="text-xs">Computing query embedding and searching ChromaDB vectors...</p>
          </div>
        ) : searched && results.length === 0 ? (
          <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-2">
            <Search className="w-8 h-8 mx-auto text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">No matching passages found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try searching with broader terms or check that you have uploaded and processed research papers in the library.
            </p>
          </div>
        ) : (
          results.map((res, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-brand-300 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <Link
                  to={`/papers/${res.paper_id}`}
                  className="text-base font-bold text-slate-900 hover:text-brand-600 transition-colors"
                >
                  {res.paper_title}
                </Link>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                  {Math.round(res.similarity_score * 100)}% Match
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                {res.authors && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {res.authors}
                  </span>
                )}
                {res.publication_year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {res.publication_year}
                  </span>
                )}
                <span className="flex items-center gap-1 font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                  <FileText className="w-3.5 h-3.5" />
                  Page {res.page_number} ({res.section})
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <p className="text-xs text-slate-700 leading-relaxed font-serif italic">
                  "{res.matching_excerpt}"
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  onClick={() =>
                    setActiveCitation({
                      paper_title: res.paper_title,
                      page_number: res.page_number,
                      section: res.section,
                      text: res.matching_excerpt,
                      similarity_score: res.similarity_score,
                      paper_id: res.paper_id,
                    })
                  }
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
                >
                  View Full Passage
                </button>
                <Link
                  to={`/chat?paper=${res.paper_id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat with Paper</span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <CitationModal
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />
    </div>
  );
}
