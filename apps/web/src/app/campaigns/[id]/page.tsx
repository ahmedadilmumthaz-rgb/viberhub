'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileCheck,
  Send,
  Copy,
  Check,
  Download,
  AlertTriangle,
  ShieldCheck,
  MessageSquare,
  User,
  Paperclip,
  Archive,
  RefreshCw
} from 'lucide-react';
import { AppShell } from '../../../components/AppShell';
import { Badge } from '../../../components/Badge';
import { Modal } from '../../../components/Modal';
import { apiClient } from '../../../lib/api';
import { formatDate, formatDateTime, formatBytes } from '../../../lib/utils';
import {
  CampaignStatus,
  CampaignItemStatus,
  ApprovalDecision,
  ConsentStatus
} from '@viberhub/shared';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  // Review / Decision Modal
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decision, setDecision] = useState<ApprovalDecision>(ApprovalDecision.APPROVED);
  const [decisionNote, setDecisionNote] = useState('');

  // Mark Completed Manually Modal
  const [completingItemId, setCompletingItemId] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState('Sent via Viber application by operator');

  const fetchCampaign = async () => {
    try {
      const res = await apiClient(`/campaigns/${campaignId}`);
      setCampaign(res.data);
    } catch (err) {
      console.error('Failed to load campaign', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, [campaignId]);

  const handleSubmitReview = async () => {
    try {
      await apiClient(`/campaigns/${campaignId}/submit-review`, { method: 'POST' });
      fetchCampaign();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    }
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient(`/campaigns/${campaignId}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          decision,
          note: decisionNote
        })
      });
      setIsDecisionModalOpen(false);
      setDecisionNote('');
      fetchCampaign();
    } catch (err: any) {
      alert(err.message || 'Failed to record decision');
    }
  };

  const handleMarkCompleted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingItemId) return;
    try {
      await apiClient(`/campaigns/${campaignId}/items/${completingItemId}/mark-completed`, {
        method: 'POST',
        body: JSON.stringify({
          completionNote
        })
      });
      setCompletingItemId(null);
      fetchCampaign();
    } catch (err: any) {
      alert(err.message || 'Failed to record manual completion');
    }
  };

  const handleCopyText = (itemId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItemId(itemId);
    setTimeout(() => setCopiedItemId(null), 2500);
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this campaign?')) return;
    try {
      await apiClient(`/campaigns/${campaignId}/archive`, { method: 'POST' });
      router.push('/campaigns');
    } catch (err: any) {
      alert(err.message || 'Failed to archive');
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="py-24 text-center text-xs text-slate-400">Loading campaign workflow...</div>
      </AppShell>
    );
  }

  if (!campaign) {
    return (
      <AppShell>
        <div className="py-24 text-center text-xs text-rose-500">Campaign not found.</div>
      </AppShell>
    );
  }

  const steps = [
    { key: CampaignStatus.DRAFT, label: '1. Draft' },
    { key: CampaignStatus.IN_REVIEW, label: '2. In Review' },
    { key: CampaignStatus.APPROVED, label: '3. Approved' },
    { key: 'COMPLETED_MANUALLY', label: '4. Manual Handoff' }
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Campaigns</span>
          </Link>

          <button
            onClick={handleArchive}
            className="text-xs text-slate-400 hover:text-slate-600 transition"
          >
            Archive Campaign
          </button>
        </div>

        {/* Stepper Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{campaign.title}</h1>
                <Badge status={campaign.status} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Owner: <strong className="text-slate-700">{campaign.ownerName}</strong> • Planned Date:{' '}
                <strong className="text-slate-700">{formatDate(campaign.plannedAt)}</strong>
              </p>
            </div>

            {/* State Transition Actions */}
            <div className="flex items-center gap-3">
              {campaign.status === CampaignStatus.DRAFT && (
                <button
                  onClick={handleSubmitReview}
                  className="px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition shadow-sm"
                >
                  Submit for Review
                </button>
              )}

              {campaign.status === CampaignStatus.IN_REVIEW && (
                <button
                  onClick={() => setIsDecisionModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-sm"
                >
                  Review & Decide
                </button>
              )}
            </div>
          </div>

          {/* Stepper bar */}
          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100 text-xs">
            {steps.map((st, idx) => {
              const isCurrent =
                campaign.status === st.key ||
                (st.key === 'COMPLETED_MANUALLY' &&
                  campaign.items?.every((i: any) => i.status === CampaignItemStatus.COMPLETED_MANUALLY));
              return (
                <div
                  key={st.key}
                  className={`p-3 rounded-xl border text-center transition ${
                    isCurrent
                      ? 'bg-violet-600 text-white border-violet-600 font-semibold shadow-sm'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  {st.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Operator Handoff Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Operator Handoff & Dispatch Items
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review recipient consent, copy formatted message text, and download attachments for manual dispatch
              </p>
            </div>
          </div>

          {campaign.items?.map((item: any) => {
            const isCompleted = item.status === CampaignItemStatus.COMPLETED_MANUALLY;
            const consentStatus = item.contact?.latestConsent?.status || ConsentStatus.UNKNOWN;
            const isConsentValid = consentStatus === ConsentStatus.GRANTED;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-7 shadow-sm transition space-y-6 ${
                  isCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                }`}
              >
                {/* Item Top Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {item.destination?.displayName}
                      </span>
                      <Badge variant="neutral">{item.destination?.type}</Badge>
                      <Badge status={item.status} />
                    </div>

                    {item.contact && (
                      <p className="text-xs text-slate-500">
                        Contact: <strong className="text-slate-800">{item.contact.displayName}</strong>{' '}
                        (<code className="font-mono text-slate-700">{item.contact.phoneE164}</code>)
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Consent Indicator */}
                    <div
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
                        isConsentValid
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Consent: {consentStatus}</span>
                    </div>

                    {!isCompleted && campaign.status === CampaignStatus.APPROVED && (
                      <button
                        onClick={() => setCompletingItemId(item.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-sm"
                      >
                        Mark Completed Manually
                      </button>
                    )}
                  </div>
                </div>

                {/* Handoff Checklist Item */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Prepared Message Content
                    </span>
                    <button
                      onClick={() => handleCopyText(item.id, item.body)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition shadow-sm"
                    >
                      {copiedItemId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied to Clipboard</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy Text</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {item.body}
                  </div>
                </div>

                {/* Attachments Section */}
                {item.attachments && item.attachments.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Attached Media Files for Dispatch
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {item.attachments.map((att: any) => (
                        <div
                          key={att.id}
                          className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                        >
                          <div className="truncate pr-2">
                            <p className="font-semibold truncate">{att.originalName}</p>
                            <span className="text-[10px] text-slate-400">{formatBytes(att.sizeBytes)}</span>
                          </div>
                          <a
                            href={att.downloadUrl}
                            download={att.originalName}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition"
                            title="Download for handoff"
                          >
                            <Download className="w-4 h-4 text-violet-600" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Operator Manual Confirmation Note */}
                {isCompleted && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Operator-Confirmed Completed: </span>
                      {item.completionNote} (Recorded on {formatDateTime(item.completedAt)})
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Approval History Audit Trail */}
        {campaign.approvals && campaign.approvals.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-violet-600" />
              <span>Review & Governance Trail</span>
            </h3>

            <div className="space-y-3">
              {campaign.approvals.map((app: any) => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge status={app.decision} />
                      <span className="font-semibold text-slate-800">
                        Reviewer: {app.reviewerName}
                      </span>
                    </div>
                    {app.note && (
                      <p className="text-slate-600 italic mt-1">"{app.note}"</p>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {formatDateTime(app.decidedAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Review & Decide */}
        <Modal
          isOpen={isDecisionModalOpen}
          onClose={() => setIsDecisionModalOpen(false)}
          title="Review Campaign Package"
          description="Designated reviewer decision. Approvals unlock manual operator handoff; change requests return the campaign to draft."
        >
          <form onSubmit={handleDecisionSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Review Decision *
              </label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="decision"
                    value={ApprovalDecision.APPROVED}
                    checked={decision === ApprovalDecision.APPROVED}
                    onChange={() => setDecision(ApprovalDecision.APPROVED)}
                  />
                  <div>
                    <span className="font-semibold text-emerald-700">APPROVE CAMPAIGN</span>
                    <span className="block text-[11px] text-slate-500">Allows operator to proceed with manual Viber handoff.</span>
                  </div>
                </label>
                <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="decision"
                    value={ApprovalDecision.CHANGES_REQUESTED}
                    checked={decision === ApprovalDecision.CHANGES_REQUESTED}
                    onChange={() => setDecision(ApprovalDecision.CHANGES_REQUESTED)}
                  />
                  <div>
                    <span className="font-semibold text-amber-700">REQUEST CHANGES</span>
                    <span className="block text-[11px] text-slate-500">Returns package to Draft for editor revisions.</span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Review Feedback / Notes
              </label>
              <textarea
                rows={3}
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="Required when requesting changes. Feedback on content or recipient eligibility..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDecisionModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
              >
                Submit Decision
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Mark Completed Manually */}
        <Modal
          isOpen={completingItemId !== null}
          onClose={() => setCompletingItemId(null)}
          title="Confirm Manual Action in Viber"
          description="Record that you explicitly pasted and sent this message inside the official Viber application."
        >
          <form onSubmit={handleMarkCompleted} className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
              Viber Hub stores this as an <strong>operator-confirmed action</strong>. In compliance with platform policies,
              we do not inspect Viber's private database or fabricate unverified delivery receipts.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Operator Execution Note
              </label>
              <input
                type="text"
                required
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder="e.g. Sent via Viber Desktop on MacBook Pro"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCompletingItemId(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
              >
                Confirm Completion
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
