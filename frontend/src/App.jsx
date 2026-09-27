import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import PlaceholderPage from './pages/PlaceholderPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route
            path="papers"
            element={
              <PlaceholderPage
                title="Research Paper Library"
                description="Upload research papers in PDF format, extract page-level text, manage chunking, and view document metadata."
                phase="Phase 2 & Phase 8"
              />
            }
          />
          <Route
            path="chat"
            element={
              <PlaceholderPage
                title="Grounded Research Chat"
                description="Ask complex research questions and receive answers strictly grounded in retrieved chunks with clickable page citations."
                phase="Phase 5 & Phase 6"
              />
            }
          />
          <Route
            path="compare"
            element={
              <PlaceholderPage
                title="Multi-Paper Comparison"
                description="Select multiple research papers to compare methodologies, datasets, experimental results, and limitations."
                phase="Phase 10"
              />
            }
          />
          <Route
            path="notes"
            element={
              <PlaceholderPage
                title="AI Research Notes"
                description="Organize your thoughts, take markdown notes linked to specific papers, and save auto-generated synthesis."
                phase="Phase 11"
              />
            }
          />
          <Route
            path="review"
            element={
              <PlaceholderPage
                title="Literature Review Assistant"
                description="Synthesize literature reviews across collections of papers, identifying common trends and verified research gaps."
                phase="Phase 12"
              />
            }
          />
          <Route
            path="settings"
            element={
              <PlaceholderPage
                title="System Settings"
                description="Configure Gemini API keys, embedding models, vector store parameters, and chunking strategies."
                phase="Phase 13 & Phase 14"
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
