import React from 'react';
import { BookOpen, Sparkles, Activity } from 'lucide-react';

export default function Navbar({ systemHealth }) {
  const isHealthy = systemHealth?.status === 'healthy';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="bg-brand-600 text-white p-2 rounded-lg shadow-sm flex items-center justify-center">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-slate-900 tracking-tight text-lg">AI Research Paper Assistant</span>
          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            v1.0.0
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-slate-50 border-slate-200">
          <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-slate-600">
            Backend API: <strong className="text-slate-800">{systemHealth?.status || 'Connecting...'}</strong>
          </span>
          {systemHealth?.database?.dialect && (
            <span className="text-slate-400">({systemHealth.database.dialect})</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-brand-50 text-brand-700 rounded-md border border-brand-100">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini RAG Engine</span>
        </div>
      </div>
    </header>
  );
}
