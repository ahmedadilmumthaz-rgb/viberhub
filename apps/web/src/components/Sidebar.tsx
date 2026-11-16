'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
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
  MessageSquareShare
} from 'lucide-react';
import { cn } from '../lib/utils';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const navigationGroups = [
    {
      group: 'Overview',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      group: 'Communication',
      items: [
        { name: 'Contacts', href: '/contacts', icon: Users },
        { name: 'Destinations', href: '/destinations', icon: Compass },
        { name: 'Templates', href: '/templates', icon: FileText },
        { name: 'Media Library', href: '/media', icon: Image },
        { name: 'Planner', href: '/planner', icon: Calendar },
        { name: 'Campaigns', href: '/campaigns', icon: Send }
      ]
    },
    {
      group: 'Insights',
      items: [
        { name: 'Reports', href: '/reports', icon: BarChart2 },
        { name: 'Activity & Audit', href: '/activity', icon: Activity }
      ]
    },
    {
      group: 'System',
      items: [
        { name: 'Settings', href: '/settings', icon: Settings }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 select-none">
      {/* Brand logo & header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-md shadow-violet-900/50">
          <MessageSquareShare className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-white text-base tracking-tight">Viber Hub</span>
          <span className="block text-[10px] uppercase font-semibold tracking-wider text-violet-400">Workspace</span>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {navigationGroups.map((group) => (
          <div key={group.group}>
            <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {group.group}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-violet-600/20 text-violet-300 font-semibold border-l-2 border-violet-500 rounded-l-none pl-[10px]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', isActive ? 'text-violet-400' : 'text-slate-400')} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Operator Safety Notice */}
      <div className="p-4 mx-4 mb-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-[11px] text-slate-400">
        <p className="font-medium text-slate-300 mb-1">Operator Mode</p>
        <p className="leading-relaxed">Manual Viber handoff active. Unofficial background automation is disabled by design.</p>
      </div>
    </aside>
  );
};
