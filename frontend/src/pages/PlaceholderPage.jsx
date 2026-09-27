import React from 'react';
import { Layers, Clock } from 'lucide-react';

export default function PlaceholderPage({ title, description, phase }) {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm space-y-4">
        <div className="inline-flex p-4 rounded-2xl bg-brand-50 text-brand-600 mb-2">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-slate-500 max-w-lg mx-auto text-sm leading-relaxed">
          {description}
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Scheduled for {phase}</span>
        </div>
      </div>
    </div>
  );
}
