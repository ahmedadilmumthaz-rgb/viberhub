'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart2,
  Download,
  Calendar,
  CheckCircle2,
  Users,
  Send,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  PieChart
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import { apiClient } from '../../lib/api';
import { formatDate } from '../../lib/utils';

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [campaignReport, setCampaignReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const [metRes, campRes] = await Promise.all([
          apiClient('/reports/overview'),
          apiClient('/reports/campaigns')
        ]);
        setMetrics(metRes.data);
        setCampaignReport(campRes.data || []);
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const handleExportCsv = async () => {
    try {
      const res = await apiClient('/reports/export');
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `viberhub_campaign_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export campaign report CSV');
    }
  };

  const totalConsent = (metrics?.consentBreakdown?.GRANTED || 0) +
    (metrics?.consentBreakdown?.WITHDRAWN || 0) +
    (metrics?.consentBreakdown?.UNKNOWN || 0);

  const grantedPct = totalConsent > 0 ? Math.round(((metrics?.consentBreakdown?.GRANTED || 0) / totalConsent) * 100) : 0;
  const withdrawnPct = totalConsent > 0 ? Math.round(((metrics?.consentBreakdown?.WITHDRAWN || 0) / totalConsent) * 100) : 0;
  const unknownPct = totalConsent > 0 ? 100 - grantedPct - withdrawnPct : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operational Reports & Analytics</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Auditable records of prepared items, review turnarounds, and operator-confirmed completions
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Report CSV</span>
          </button>
        </div>

        {/* Data Source Transparency Banner */}
        <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-100 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700">
            <span className="font-semibold text-violet-950">Data Attribution Notice: </span>
            {metrics?.dataSourceNote || 'Viber Hub records operator-confirmed preparation and manual completion actions only.'}
            To protect your Viber account and uphold platform policies, we do not fabricate automated delivery or read rates.
          </div>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label="Total Database Contacts"
            value={loading ? '...' : metrics?.totalContacts || 0}
            sublabel={`${metrics?.consentBreakdown?.GRANTED || 0} with documented consent`}
            icon={Users}
            variant="primary"
          />
          <StatCard
            label="Total Curated Targets"
            value={loading ? '...' : metrics?.totalDestinations || 0}
            sublabel={`${metrics?.destinationsByType?.GROUP || 0} groups / ${metrics?.destinationsByType?.CHANNEL || 0} channels`}
            icon={Send}
            variant="info"
          />
          <StatCard
            label="Completed Manually"
            value={loading ? '...' : metrics?.itemsCompletedManually || 0}
            sublabel="Confirmed by operator inside Viber"
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            label="Drafts in Pipeline"
            value={loading ? '...' : (metrics?.campaignsByStatus?.DRAFT || 0) + (metrics?.campaignsByStatus?.IN_REVIEW || 0)}
            sublabel="Under editorial composition or review"
            icon={Calendar}
            variant="warning"
          />
        </div>

        {/* Visual Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Consent Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Audited Recipient Consent Distribution</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">{totalConsent} Contacts</span>
            </div>

            {/* Stacked Bar */}
            <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden mb-4">
              <div
                style={{ width: `${grantedPct}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Granted: ${grantedPct}%`}
              />
              <div
                style={{ width: `${withdrawnPct}%` }}
                className="bg-rose-500 h-full transition-all"
                title={`Withdrawn: ${withdrawnPct}%`}
              />
              <div
                style={{ width: `${unknownPct}%` }}
                className="bg-slate-300 h-full transition-all"
                title={`Unknown: ${unknownPct}%`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                <span className="text-[11px] text-emerald-800 font-semibold block">Granted ({grantedPct}%)</span>
                <span className="text-sm font-bold text-emerald-900">{metrics?.consentBreakdown?.GRANTED || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100">
                <span className="text-[11px] text-rose-800 font-semibold block">Withdrawn ({withdrawnPct}%)</span>
                <span className="text-sm font-bold text-rose-900">{metrics?.consentBreakdown?.WITHDRAWN || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-600 font-semibold block">Unknown ({unknownPct}%)</span>
                <span className="text-sm font-bold text-slate-800">{metrics?.consentBreakdown?.UNKNOWN || 0}</span>
              </div>
            </div>
          </div>

          {/* Destination Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Send className="w-4 h-4 text-violet-600" />
                <span>Destination Types Breakdown</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {metrics?.totalDestinations || 0} Targets
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                <p className="text-[11px] text-slate-500 font-medium">Individual Direct Chats</p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {metrics?.destinationsByType?.INDIVIDUAL_CHAT || metrics?.destinationsByType?.INDIVIDUAL || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                <p className="text-[11px] text-slate-500 font-medium">Viber Groups</p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {metrics?.destinationsByType?.GROUP || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                <p className="text-[11px] text-slate-500 font-medium">Communities</p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {metrics?.destinationsByType?.COMMUNITY || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                <p className="text-[11px] text-slate-500 font-medium">Channels</p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {metrics?.destinationsByType?.CHANNEL || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Breakdown Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              Campaign Execution Outcomes
            </h3>
            <span className="text-xs text-slate-400">
              {campaignReport.length} total campaigns
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Campaign Title</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Total Items</th>
                  <th className="py-3 px-6">Operator Completed</th>
                  <th className="py-3 px-6">Planned Date</th>
                  <th className="py-3 px-6">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading report data...
                    </td>
                  </tr>
                ) : campaignReport.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No campaign records available.
                    </td>
                  </tr>
                ) : (
                  campaignReport.map((c) => {
                    const completionPct = c.totalItems > 0 ? Math.round((c.completedManually / c.totalItems) * 100) : 0;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-6 font-semibold text-slate-900">
                          <Link
                            href={`/campaigns/${c.id}`}
                            className="hover:text-violet-600 transition"
                          >
                            {c.title}
                          </Link>
                        </td>
                        <td className="py-3.5 px-6">
                          <Badge status={c.status} />
                        </td>
                        <td className="py-3.5 px-6 font-mono">
                          {c.totalItems}
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="space-y-1">
                            <span className="font-semibold text-emerald-700">
                              {c.completedManually}
                            </span>{' '}
                            <span className="text-slate-400 text-[11px]">
                              ({completionPct}%)
                            </span>
                            <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${completionPct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 text-slate-500">
                          {formatDate(c.plannedAt)}
                        </td>
                        <td className="py-3.5 px-6 text-slate-500">
                          {formatDate(c.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
