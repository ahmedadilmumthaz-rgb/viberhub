'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Building2, User, PlusCircle, Search, Menu } from 'lucide-react';
import Link from 'next/link';
import { CommandPalette } from './CommandPalette';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const router = useRouter();
  const [user, setUser] = useState<{ displayName?: string; email?: string } | null>(null);
  const [workspace, setWorkspace] = useState<{ name?: string } | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('vh_user');
    const storedWs = localStorage.getItem('vh_workspace');

    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    } else {
      setUser({ displayName: 'System Admin', email: 'admin@viberhub.local' });
    }

    if (storedWs) {
      try { setWorkspace(JSON.parse(storedWs)); } catch {}
    } else {
      setWorkspace({ name: 'Primary Organization' });
    }

    // Keyboard shortcut Cmd+K / Ctrl+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('vh_token');
    localStorage.removeItem('vh_user');
    localStorage.removeItem('vh_workspace');
    localStorage.removeItem('vh_workspace_id');
    router.push('/login');
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 flex-shrink-0">
        {/* Left: Mobile Toggle & Workspace indicator */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="p-2 rounded-lg bg-slate-100 text-slate-600 hidden sm:block">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Workspace</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800">{workspace?.name || 'Primary Organization'}</span>
          </div>
        </div>

        {/* Center: Command Palette Trigger */}
        <button
          onClick={() => setIsCommandOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-400 text-xs transition"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-slate-500">Quick Navigation...</span>
          <kbd className="ml-4 px-1.5 py-0.5 rounded bg-white text-[10px] font-mono border border-slate-200 text-slate-500">
            ⌘K
          </kbd>
        </button>

        {/* Right: Actions & User menu */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 shadow-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Campaign</span>
          </Link>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-800">{user?.displayName || 'System Admin'}</p>
              <p className="text-[10px] text-slate-400">{user?.email || 'admin@viberhub.local'}</p>
            </div>

            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
};
