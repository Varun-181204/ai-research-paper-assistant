import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Bookmark,
  Sparkles,
  Bot,
  User,
  Layers,
  ChevronDown,
  CheckSquare,
  Square,
  Loader2,
  ExternalLink
} from 'lucide-react';
import {
  fetchPapers,
  fetchConversations,
  fetchConversation,
  sendChatMessage,
  deleteConversation
} from '../services/api';
import CitationModal from '../components/CitationModal';

export default function ResearchChat() {
  const [searchParams] = useSearchParams();
  const initialPaperId = searchParams.get('paper') ? parseInt(searchParams.get('paper'), 10) : null;

  const [papers, setPapers] = useState([]);
  const [selectedPaperIds, setSelectedPaperIds] = useState(initialPaperId ? [initialPaperId] : []);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState(null);
  const [paperDropdownOpen, setPaperDropdownOpen] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load papers and conversations on mount
  useEffect(() => {
    const init = async () => {
      try {
        const pList = await fetchPapers();
        setPapers(pList);

        const convs = await fetchConversations();
        setConversations(convs);

        if (convs.length > 0 && !initialPaperId) {
          loadConversation(convs[0].id);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    };
    init();
  }, []);

  const loadConversation = async (convId) => {
    try {
      const conv = await fetchConversation(convId);
      setCurrentConversationId(conv.id);
      setMessages(conv.messages || []);
      if (conv.selected_paper_ids) {
        setSelectedPaperIds(conv.selected_paper_ids);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const handleStartNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setInputQuestion('');
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation history?')) return;
    try {
      await deleteConversation(convId);
      const updated = conversations.filter((c) => c.id !== convId);
      setConversations(updated);
      if (currentConversationId === convId) {
        handleStartNewChat();
      }
    } catch (err) {
      alert('Failed to delete conversation: ' + err.message);
    }
  };

  const togglePaperSelection = (pid) => {
    setSelectedPaperIds((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  };

  const selectAllPapers = () => {
    if (selectedPaperIds.length === papers.length) {
      setSelectedPaperIds([]);
    } else {
      setSelectedPaperIds(papers.map((p) => p.id));
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputQuestion.trim() || loading) return;

    const q = inputQuestion.trim();
    setInputQuestion('');

    // Optimistically append user message
    const tempUserMsg = { id: Date.now(), role: 'user', content: q };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await sendChatMessage({
        question: q,
        conversationId: currentConversationId,
        paperIds: selectedPaperIds.length > 0 ? selectedPaperIds : null,
      });

      setCurrentConversationId(res.conversation_id);

      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.answer,
        citations: res.citations,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh conversations list to update titles/timestamps
      const updatedConvs = await fetchConversations();
      setConversations(updatedConvs);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: 'Error: ' + (err.response?.data?.detail || err.message),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = selectedPaperIds.length;

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 max-w-7xl mx-auto pb-4">
      {/* Left Sidebar: Conversations & Target Papers */}
      <div className="w-80 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden flex-shrink-0">
        <div className="p-4 border-b border-slate-200 space-y-3">
          <button
            onClick={handleStartNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Research Chat</span>
          </button>

          {/* Paper Scope Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setPaperDropdownOpen(!paperDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Layers className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                <span className="truncate">
                  {selectedCount === 0
                    ? 'All Papers in Library'
                    : selectedCount === 1
                    ? `1 Paper Selected`
                    : `${selectedCount} Papers Selected`}
                </span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {paperDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-30 max-h-60 overflow-y-auto space-y-1">
                <button
                  onClick={selectAllPapers}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-brand-600 hover:bg-brand-50 flex items-center justify-between"
                >
                  <span>{selectedPaperIds.length === papers.length ? 'Deselect All' : 'Select All Papers'}</span>
                </button>
                <div className="border-t border-slate-100 pt-1" />
                {papers.map((p) => {
                  const isSelected = selectedPaperIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => togglePaperSelection(p.id)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-50 cursor-pointer text-slate-700"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      )}
                      <span className="truncate">{p.title}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Conversations History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
            Chat History
          </p>
          {conversations.length === 0 ? (
            <p className="text-xs text-slate-400 p-3">No conversations yet.</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`group flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                  currentConversationId === conv.id
                    ? 'bg-brand-50 text-brand-900 border border-brand-200 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="truncate flex-1 pr-2">{conv.title}</span>
                <button
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* Chat Feed Header */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-brand-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {currentConversationId ? `Conversation #${currentConversationId}` : 'New Research Thread'}
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Grounded RAG Mode • Gemini API
          </span>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-4">
              <div className="p-4 bg-brand-50 text-brand-600 rounded-2xl">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-800">Ask your research papers anything</h4>
                <p className="text-xs text-slate-500 max-w-md">
                  Every answer is strictly grounded in retrieved document chunks with verifiable page-level citations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full pt-4">
                {[
                  'What methodology does this paper propose?',
                  'Which datasets were evaluated?',
                  'What are the stated experimental limitations?',
                  'How does the model architecture work?',
                ].map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => setInputQuestion(sample)}
                    className="p-3 text-left bg-slate-50 hover:bg-brand-50 hover:text-brand-700 rounded-xl text-xs border border-slate-200 transition-colors text-slate-700"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-2xl space-y-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl p-4 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-600 text-white font-medium shadow-sm'
                        : 'bg-slate-50 text-slate-800 border border-slate-200 shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</p>
                  </div>

                  {/* Render Verified Citations if assistant message */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Bookmark className="w-3 h-3 text-brand-500" />
                        Verified Grounded Sources:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {msg.citations.map((c, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => setActiveCitation(c)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-brand-50 text-slate-700 hover:text-brand-700 text-[11px] font-medium border border-slate-200 shadow-xs transition-colors"
                          >
                            <span className="font-bold text-brand-600 font-mono">[{cIdx + 1}]</span>
                            <span className="truncate max-w-[180px]">{c.paper_title}</span>
                            <span className="text-slate-400">— Page {c.page_number}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Question Input Form */}
        <form onSubmit={handleSendMessage} className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
          <input
            type="text"
            placeholder={
              selectedCount === 0
                ? 'Ask a question across all research papers...'
                : `Ask a question across ${selectedCount} selected paper(s)...`
            }
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || loading}
            className="px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow transition-colors disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Retrieving...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Ask</span>
              </>
            )}
          </button>
        </form>
      </div>

      <CitationModal
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />
    </div>
  );
}
