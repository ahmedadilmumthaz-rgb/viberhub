'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Compass,
  FileCheck,
  CheckCircle2,
  HardDrive,
  Send,
  PlusCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import { apiClient } from '../../lib/api';
import { formatBytes, formatDateTime } from '../../lib/utils';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [repRes, actRes] = await Promise.all([
          apiClient('/reports/overview'),
          apiClient('/activity?limit=5')
        ]);
        setMetrics(repRes.data);
        setActivities(actRes.data || []);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Page title and top banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Campaign coordination, contact records, and operator-confirmed completions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/contacts"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Manage Contacts</span>
            </Link>
            <Link
              href="/campaigns/new"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Campaign</span>
            </Link>
          </div>
        </div>

        {/* Platform Compliance Reminder Banner */}
        <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-100 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700">
            <span className="font-semibold text-violet-950">Operator-Led Sending Architecture: </span>
            Viber Hub prepares text, resolves verified variables, and organizes attachments for human operator dispatch in Viber.
            In compliance with Viber platform rules, all stats represent operator-recorded manual actions without unverified delivery claims.
          </div>
        </div>

        {/* Core KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label="Total Contacts"
            value={loading ? '...' : metrics?.totalContacts || 0}
            sublabel={`${metrics?.destinationsByType?.INDIVIDUAL || 0} individual destinations linked`}
            icon={Users}
            variant="primary"
          />
          <StatCard
            label="Drafts In Review"
            value={loading ? '...' : metrics?.draftsAwaitingReview || 0}
            sublabel="Awaiting designated reviewer approval"
            icon={FileCheck}
            variant="warning"
          />
          <StatCard
            label="Awaiting Operator Action"
            value={loading ? '...' : metrics?.approvedItemsAwaitingManualAction || 0}
            sublabel="Approved items ready for Viber handoff"
            icon={Clock}
            variant="info"
          />
          <StatCard
            label="Completed Manually"
            value={loading ? '...' : metrics?.itemsCompletedManually || 0}
            sublabel="Confirmed by operator inside Viber"
            icon={CheckCircle2}
            variant="success"
          />
        </div>

        {/* Secondary Row: Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick shortcuts & storage */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                Quick Shortcuts
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/contacts"
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-violet-50/50 hover:border-violet-200 transition group flex flex-col items-center text-center gap-2"
                >
                  <Users className="w-5 h-5 text-slate-600 group-hover:text-violet-600" />
                  <span className="text-xs font-semibold text-slate-800">New Contact</span>
                </Link>
                <Link
                  href="/templates"
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-violet-50/50 hover:border-violet-200 transition group flex flex-col items-center text-center gap-2"
                >
                  <FileCheck className="w-5 h-5 text-slate-600 group-hover:text-violet-600" />
                  <span className="text-xs font-semibold text-slate-800">Add Template</span>
                </Link>
                <Link
                  href="/media"
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-violet-50/50 hover:border-violet-200 transition group flex flex-col items-center text-center gap-2"
                >
                  <HardDrive className="w-5 h-5 text-slate-600 group-hover:text-violet-600" />
                  <span className="text-xs font-semibold text-slate-800">Media Upload</span>
                </Link>
                <Link
                  href="/campaigns/new"
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-violet-50/50 hover:border-violet-200 transition group flex flex-col items-center text-center gap-2"
                >
                  <Send className="w-5 h-5 text-slate-600 group-hover:text-violet-600" />
                  <span className="text-xs font-semibold text-slate-800">New Campaign</span>
                </Link>
              </div>
            </div>

            {/* Storage Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attachment Storage</span>
                <HardDrive className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xl font-bold text-slate-900">
                {loading ? '...' : formatBytes(metrics?.totalStorageBytes || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Private MinIO object storage with authenticated streaming access
              </p>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Recent Activity Feed
              </h3>
              <Link
                href="/activity"
                className="text-xs font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-1"
              >
                <span>View Full Audit Log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading activity...</div>
            ) : activities.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No activity recorded yet.</div>
            ) : (
              <div className="space-y-3 flex-1">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start justify-between p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral">{act.action}</Badge>
                        <span className="text-xs font-medium text-slate-700">
                          {act.actorName || 'System'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Target {act.entityType}: <code className="text-slate-600 font-mono">{act.entityId.slice(0, 8)}...</code>
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {formatDateTime(act.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
