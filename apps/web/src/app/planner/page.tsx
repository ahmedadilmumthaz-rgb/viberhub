'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Send,
  User,
  ArrowRight
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { Badge } from '../../components/Badge';
import { apiClient } from '../../lib/api';
import { formatDateTime, formatDate } from '../../lib/utils';
import { CampaignItemStatus } from '@viberhub/shared';

export default function PlannerPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    async function loadPlanner() {
      setLoading(true);
      try {
        const res = await apiClient('/planner');
        setTasks(res.data || []);
      } catch (err) {
        console.error('Failed to load planner', err);
      } finally {
        setLoading(false);
      }
    }
    loadPlanner();
  }, []);

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'ALL') return true;
    return t.status === filterStatus;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Content & Work Planner</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Task scheduling for operator message preparation, designated review, and manual Viber dispatch
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-slate-200 bg-white p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  viewMode === 'list' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  viewMode === 'calendar' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Calendar View
              </button>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-100 flex items-start gap-3">
          <Clock className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700">
            <span className="font-semibold text-violet-950">Operator Due Dates: </span>
            Planner dates represent deadlines and reminders for human operators to review content and manually send via Viber.
            They are strictly work deadlines, not unattended automated delivery triggers.
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter Status:</span>
          {['ALL', CampaignItemStatus.PREPARED, CampaignItemStatus.COMPLETED_MANUALLY].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                filterStatus === st
                  ? 'bg-violet-100 text-violet-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'ALL' ? 'All Tasks' : st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Content View */}
        {viewMode === 'list' ? (
          <div className="space-y-3">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400">Loading planner tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">No scheduled tasks found.</div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge status={task.status} />
                      <span className="text-xs font-semibold text-slate-900">
                        {task.campaignTitle}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1 font-mono">
                      "{task.body}"
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                      <span>Target: <strong className="text-slate-700">{task.destinationName}</strong> ({task.destinationType})</span>
                      {task.contactName && <span>Contact: <strong className="text-slate-700">{task.contactName}</strong></span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs flex-shrink-0">
                    <div className="text-right">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Due / Planned</span>
                      <span className="font-semibold text-slate-700">{formatDateTime(task.dueAt)}</span>
                    </div>

                    <Link
                      href={`/campaigns/${task.campaignId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-violet-50 text-slate-700 hover:text-violet-700 font-semibold text-xs transition"
                    >
                      <span>Handoff Workflow</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Calendar Grid Placeholder */
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
            <CalendarIcon className="w-12 h-12 text-violet-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Timeline & Task Scheduling View</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Visualizes upcoming campaign item deadlines across days and weeks to ensure operator staffing and preparation review cycles.
            </p>
            <div className="mt-6 grid grid-cols-7 gap-2 max-w-2xl mx-auto text-xs text-slate-600">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="p-3 bg-slate-50 rounded-lg border border-slate-100 font-semibold">
                  {day}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
