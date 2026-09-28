import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 45000,
});

// Health & System
export const fetchHealth = async () => {
  const res = await api.get('/api/health');
  return res.data;
};

export const fetchDashboardStats = async () => {
  const res = await api.get('/api/dashboard/stats');
  return res.data;
};

// Papers
export const fetchPapers = async (search = '', status = '') => {
  const params = {};
  if (search) params.search = search;
  if (status) params.status_filter = status;
  const res = await api.get('/api/papers', { params });
  return res.data;
};

export const fetchPaper = async (paperId) => {
  const res = await api.get(`/api/papers/${paperId}`);
  return res.data;
};

export const fetchPaperChunks = async (paperId) => {
  const res = await api.get(`/api/papers/${paperId}/chunks`);
  return res.data;
};

export const uploadPaper = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/api/papers/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return res.data;
};

export const deletePaper = async (paperId) => {
  const res = await api.delete(`/api/papers/${paperId}`);
  return res.data;
};

// Paper Analysis
export const fetchPaperAnalysis = async (paperId) => {
  const res = await api.get(`/api/papers/${paperId}/analysis`);
  return res.data;
};

export const runPaperAnalysis = async (paperId) => {
  const res = await api.post(`/api/papers/${paperId}/analyze`);
  return res.data;
};

// Multi-Paper Comparison & Literature Review
export const comparePapers = async (paperIds) => {
  const res = await api.post('/api/compare', { paper_ids: paperIds });
  return res.data;
};

export const generateLiteratureReview = async (paperIds, topic) => {
  const res = await api.post('/api/review', { paper_ids: paperIds, topic });
  return res.data;
};

// Semantic Search
export const searchPapers = async (query, topK = 8, paperIds = null) => {
  const payload = { query, top_k: topK };
  if (paperIds && paperIds.length > 0) payload.paper_ids = paperIds;
  const res = await api.post('/api/search', payload);
  return res.data;
};

// Research Chat
export const sendChatMessage = async ({ question, conversationId = null, paperIds = null, topK = 6 }) => {
  const payload = { question, top_k: topK };
  if (conversationId) payload.conversation_id = conversationId;
  if (paperIds && paperIds.length > 0) payload.paper_ids = paperIds;
  const res = await api.post('/api/chat', payload);
  return res.data;
};

export const fetchConversations = async () => {
  const res = await api.get('/api/conversations');
  return res.data;
};

export const fetchConversation = async (conversationId) => {
  const res = await api.get(`/api/conversations/${conversationId}`);
  return res.data;
};

export const deleteConversation = async (conversationId) => {
  const res = await api.delete(`/api/conversations/${conversationId}`);
  return res.data;
};

// Research Notes
export const fetchNotes = async (paperId = null) => {
  const params = paperId ? { paper_id: paperId } : {};
  const res = await api.get('/api/notes', { params });
  return res.data;
};

export const createNote = async (data) => {
  const res = await api.post('/api/notes', data);
  return res.data;
};

export const updateNote = async (noteId, data) => {
  const res = await api.put(`/api/notes/${noteId}`, data);
  return res.data;
};

export const deleteNote = async (noteId) => {
  const res = await api.delete(`/api/notes/${noteId}`);
  return res.data;
};

export default api;
