import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  BookOpen,
  Filter,
  Check,
  Calendar,
  Layers
} from 'lucide-react';
import { fetchNotes, createNote, updateNote, deleteNote, fetchPapers } from '../services/api';

export default function ResearchNotes() {
  const [notes, setNotes] = useState([]);
  const [papers, setPapers] = useState([]);
  const [selectedPaperId, setSelectedPaperId] = useState('');
  const [loading, setLoading] = useState(true);

  // Editor modal state
  const [isEditing, setIsEditing] = useState(false);
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [paperId, setPaperId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [notesList, papersList] = await Promise.all([
        fetchNotes(selectedPaperId ? parseInt(selectedPaperId, 10) : null),
        fetchPapers(),
      ]);
      setNotes(notesList);
      setPapers(papersList);
    } catch (err) {
      console.error('Failed to load notes data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPaperId]);

  const handleOpenNewNote = () => {
    setCurrentNoteId(null);
    setTitle('');
    setContent('');
    setPaperId(selectedPaperId || '');
    setIsEditing(true);
  };

  const handleEditNote = (note) => {
    setCurrentNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setPaperId(note.paper_id ? String(note.paper_id) : '');
    setIsEditing(true);
  };

  const handleDeleteNote = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this research note?')) return;
    try {
      await deleteNote(id);
      loadData();
    } catch (err) {
      alert('Failed to delete note: ' + err.message);
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        paper_id: paperId ? parseInt(paperId, 10) : null,
      };

      if (currentNoteId) {
        await updateNote(currentNoteId, payload);
      } else {
        await createNote(payload);
      }

      setIsEditing(false);
      loadData();
    } catch (err) {
      alert('Failed to save note: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-brand-600" />
            <span>Research Notes</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Capture scientific reflections, document key equations, and organize findings linked to your papers.
          </p>
        </div>

        <button
          onClick={handleOpenNewNote}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Research Note</span>
        </button>
      </div>

      {/* Filter by Paper */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-700">Filter by Paper:</span>
        <select
          value={selectedPaperId}
          onChange={(e) => setSelectedPaperId(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 max-w-sm truncate"
        >
          <option value="">All Papers (Global Notes)</option>
          {papers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400">Loading research notes...</div>
      ) : notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => handleEditNote(note)}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-brand-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors line-clamp-2">
                    {note.title}
                  </h3>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditNote(note);
                      }}
                      className="p-1 text-slate-400 hover:text-brand-600 rounded"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {note.paper_title && (
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md truncate max-w-full">
                    <BookOpen className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{note.paper_title}</span>
                  </div>
                )}

                <p className="text-xs text-slate-600 line-clamp-5 leading-relaxed font-sans whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(note.updated_at).toLocaleDateString()}
                </span>
                <span className="font-semibold text-brand-600 text-xs">Edit</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-3">
          <FileText className="w-10 h-10 mx-auto text-slate-300" />
          <h4 className="text-sm font-bold text-slate-700">No research notes yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create your first research note to track thoughts, summarize methodologies, or document observations.
          </p>
          <button
            onClick={handleOpenNewNote}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold shadow hover:bg-brand-500"
          >
            <Plus className="w-4 h-4" />
            <span>Create Note</span>
          </button>
        </div>
      )}

      {/* Note Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">
                {currentNoteId ? 'Edit Research Note' : 'Create Research Note'}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Note Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Attention Mechanism Complexity Observations..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Link to Research Paper (Optional)
                </label>
                <select
                  value={paperId}
                  onChange={(e) => setPaperId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">General (No Paper Linked)</option>
                  {papers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Content (Markdown Supported)
                </label>
                <textarea
                  rows={8}
                  placeholder="Write your research notes, insights, equations, and literature connections..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="w-full px-4 py-3 text-xs font-mono leading-relaxed border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !title.trim() || !content.trim()}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Note'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
