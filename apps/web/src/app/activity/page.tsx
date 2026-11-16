'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldAlert,
  Search,
  Filter,
  User,
  Clock,
  Lock,
  Calendar
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { Badge } from '../../components/Badge';
import { apiClient } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logType, setLogType] = useState<'activity' | 'audit'>('activity');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient(`/activity?type=${logType}`);
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load activity logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [logType]);

  const filteredLogs = logs.filter((l) => {
    const q = search.toLowerCase();
    const eventName = (l.action || l.eventType || '').toLowerCase();
    const actor = (l.actorName || '').toLowerCase();
    const target = (l.entityType || l.targetType || '').toLowerCase();
    return eventName.includes(q) || actor.includes(q) || target.includes(q);
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity & Audit Logs</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Tamper-resistant timeline of user operations, state transitions, and security events
            </p>
          </div>

          {/* Type Toggle */}
          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={() => setLogType('activity')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                logType === 'activity' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Workflow Activity
            </button>
            <button
              onClick={() => setLogType('audit')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                logType === 'audit' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Security Audit Log</span>
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-slate-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-900">Immutable Audit Record: </span>
            Every login, role change, campaign approval, export, and manual completion writes an unalterable log event with IP address, actor identification, and ISO timestamp.
          </div>
        </div>

        {/* Search Filter */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by action, actor, or target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
            />
          </div>
          <span className="text-xs text-slate-400">
            Showing {filteredLogs.length} events
          </span>
        </div>

        {/* Log Entries Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Event / Action</th>
                  <th className="py-3 px-6">Actor</th>
                  <th className="py-3 px-6">Target Entity</th>
                  <th className="py-3 px-6">Context / Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Loading log records...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No matching log events found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500">
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className="py-3.5 px-6">
                        <Badge variant={logType === 'audit' ? 'warning' : 'neutral'}>
                          {item.action || item.eventType}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-6 font-medium text-slate-800">
                        {item.actorName || 'System'}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="font-semibold text-slate-700">
                          {item.entityType || item.targetType}
                        </span>{' '}
                        <code className="text-[11px] text-slate-400 font-mono">
                          {(item.entityId || item.targetId || '').slice(0, 8)}
                        </code>
                      </td>
                      <td className="py-3.5 px-6 max-w-xs truncate text-slate-500 font-mono text-[11px]">
                        {item.metadata ? (
                          typeof item.metadata === 'string' ? item.metadata : JSON.stringify(item.metadata)
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
