'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Users,
  Compass,
  FileText,
  Image,
  Calendar,
  Send,
  BarChart2,
  Activity,
  Settings,
  PlusCircle,
  Upload
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { name: 'Dashboard Overview', icon: LayoutDashboard, href: '/dashboard', category: 'Navigation' },
    { name: 'Contacts Directory', icon: Users, href: '/contacts', category: 'Navigation' },
    { name: 'Create New Campaign', icon: PlusCircle, href: '/campaigns/new', category: 'Actions' },
    { name: 'Import Contacts CSV', icon: Upload, href: '/contacts', category: 'Actions' },
    { name: 'Destinations Directory', icon: Compass, href: '/destinations', category: 'Navigation' },
    { name: 'Message Templates', icon: FileText, href: '/templates', category: 'Navigation' },
    { name: 'Private Media Library', icon: Image, href: '/media', category: 'Navigation' },
    { name: 'Content Planner', icon: Calendar, href: '/planner', category: 'Navigation' },
    { name: 'Campaign Workflows', icon: Send, href: '/campaigns', category: 'Navigation' },
    { name: 'Operational Reports', icon: BarChart2, href: '/reports', category: 'Navigation' },
    { name: 'Activity & Audit Log', icon: Activity, href: '/activity', category: 'Navigation' },
    { name: 'Workspace Settings', icon: Settings, href: '/settings', category: 'Navigation' }
  ];

  const filtered = actions.filter((a) =>
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a page name or action... (Esc to exit)"
            className="w-full py-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-500 border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching pages or actions found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(item.href)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-violet-50 text-slate-700 hover:text-violet-900 transition text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-violet-100 group-hover:text-violet-700 text-slate-500 transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">{item.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold group-hover:text-violet-500">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer tip */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Navigation Quick Palette</span>
          <span>Press <strong>Enter</strong> to navigate</span>
        </div>
      </div>
    </div>
  );
};
