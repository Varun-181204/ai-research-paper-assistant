import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Library,
  MessageSquare,
  GitCompare,
  FileText,
  Search,
  BookOpen,
  Settings as SettingsIcon,
  CheckCircle2
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, exact: true },
  { name: 'Paper Library', path: '/papers', icon: Library },
  { name: 'Semantic Search', path: '/search', icon: Search },
  { name: 'Research Chat', path: '/chat', icon: MessageSquare },
  { name: 'Compare Papers', path: '/compare', icon: GitCompare },
  { name: 'Research Notes', path: '/notes', icon: FileText },
  { name: 'Literature Review', path: '/review', icon: BookOpen },
  { name: 'Settings', path: '/settings', icon: SettingsIcon },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      <div className="p-4 border-b border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Navigation</p>
      </div>

      <nav className="p-3 space-y-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 m-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-medium mb-1">
          <CheckCircle2 className="w-4 h-4" />
          <span>Full Pipeline Active</span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          FastAPI, ChromaDB, and Google Gemini connected with page-grounded citations.
        </p>
      </div>
    </aside>
  );
}
