'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  Download,
  Calendar,
  CheckCircle2,
  Users,
  Send,
  ShieldCheck,
  AlertCircle
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

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operational Reports</h1>
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
                  campaignReport.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        {c.title}
                      </td>
                      <td className="py-3.5 px-6">
                        <Badge status={c.status} />
                      </td>
                      <td className="py-3.5 px-6 font-mono">
                        {c.totalItems}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="font-semibold text-emerald-700">
                          {c.completedManually}
                        </span>{' '}
                        <span className="text-slate-400 text-[11px]">
                          ({c.totalItems > 0 ? Math.round((c.completedManually / c.totalItems) * 100) : 0}%)
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-500">
                        {formatDate(c.plannedAt)}
                      </td>
                      <td className="py-3.5 px-6 text-slate-500">
                        {formatDate(c.createdAt)}
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
