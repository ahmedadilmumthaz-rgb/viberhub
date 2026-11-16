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
  ArrowRight,
  ChevronLeft,
  ChevronRight
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
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarCells = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    calendarCells.push({
      day: dayNum,
      isCurrentMonth: false,
      dateStr: new Date(year, month - 1, dayNum).toISOString().slice(0, 10)
    });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarCells.push({
      day: i,
      isCurrentMonth: true,
      isToday: new Date().toDateString() === d.toDateString(),
      dateStr
    });
  }
  const remaining = (7 - (calendarCells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    calendarCells.push({
      day: i,
      isCurrentMonth: false,
      dateStr: new Date(year, month + 1, i).toISOString().slice(0, 10)
    });
  }

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
          /* Interactive Month Calendar Grid */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Calendar Month Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-slate-900">
                  {monthNames[month]} {year}
                </h2>
                <button
                  onClick={handleToday}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day of Week Labels */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center text-xs font-semibold text-slate-600 py-2.5">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Month Day Cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
              {calendarCells.map((cell, idx) => {
                const dayTasks = filteredTasks.filter((t) => {
                  if (!t.dueAt) return false;
                  return t.dueAt.slice(0, 10) === cell.dateStr;
                });

                return (
                  <div
                    key={idx}
                    className={`min-h-[110px] p-2 flex flex-col justify-between transition ${
                      cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/60 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          cell.isToday
                            ? 'bg-violet-600 text-white font-bold'
                            : cell.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {cell.day}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full">
                          {dayTasks.length}
                        </span>
                      )}
                    </div>

                    {/* Day Task Chips */}
                    <div className="space-y-1 mt-1.5 flex-1">
                      {dayTasks.slice(0, 2).map((t) => (
                        <Link
                          key={t.id}
                          href={`/campaigns/${t.campaignId}`}
                          className="block p-1 rounded bg-violet-50/80 hover:bg-violet-100 border border-violet-100 text-[10px] font-medium text-violet-900 truncate transition"
                          title={`${t.campaignTitle}: ${t.body}`}
                        >
                          <span className="font-semibold block truncate">{t.campaignTitle}</span>
                        </Link>
                      ))}
                      {dayTasks.length > 2 && (
                        <span className="block text-[10px] text-slate-400 font-semibold px-1">
                          +{dayTasks.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
