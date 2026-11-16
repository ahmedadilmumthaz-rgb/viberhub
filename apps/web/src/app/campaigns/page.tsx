'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Send,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  FileCheck,
  Archive,
  ArrowRight
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { Badge } from '../../components/Badge';
import { apiClient } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { CampaignStatus } from '@viberhub/shared';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const statusQuery = activeTab === 'ALL' ? '' : `?status=${activeTab}`;
      const res = await apiClient(`/campaigns${statusQuery}`);
      setCampaigns(res.data || []);
    } catch (err) {
      console.error('Failed to load campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [activeTab]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campaign Workflows</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Draft, review, approve, and hand off message packages for operator execution
            </p>
          </div>

          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </Link>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {['ALL', CampaignStatus.DRAFT, CampaignStatus.IN_REVIEW, CampaignStatus.APPROVED, CampaignStatus.ARCHIVED].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === tab
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab === 'ALL' ? 'All Campaigns' : tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Campaign List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
              No campaigns found in this status.
            </div>
          ) : (
            campaigns.map((camp) => (
              <div
                key={camp.id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow transition flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <Badge status={camp.status} />
                    <Link
                      href={`/campaigns/${camp.id}`}
                      className="text-base font-bold text-slate-900 hover:text-violet-600 transition"
                    >
                      {camp.title}
                    </Link>
                  </div>

                  {camp.purpose && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {camp.purpose}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span>Owner: <strong className="text-slate-700">{camp.ownerName}</strong></span>
                    <span>Created: <strong className="text-slate-700">{formatDate(camp.createdAt)}</strong></span>
                    <span>Recipients / Items: <strong className="text-slate-700">{camp.itemCount || 0}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <Link
                    href={`/campaigns/${camp.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-sm"
                  >
                    <span>Open Workflow</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
