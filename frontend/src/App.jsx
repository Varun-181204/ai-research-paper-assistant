import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import PaperLibrary from './pages/PaperLibrary';
import PaperDetails from './pages/PaperDetails';
import ResearchChat from './pages/ResearchChat';
import ComparePapers from './pages/ComparePapers';
import SemanticSearch from './pages/SemanticSearch';
import ResearchNotes from './pages/ResearchNotes';
import LiteratureReview from './pages/LiteratureReview';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="papers" element={<PaperLibrary />} />
          <Route path="papers/:id" element={<PaperDetails />} />
          <Route path="search" element={<SemanticSearch />} />
          <Route path="chat" element={<ResearchChat />} />
          <Route path="compare" element={<ComparePapers />} />
          <Route path="notes" element={<ResearchNotes />} />
          <Route path="review" element={<LiteratureReview />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
