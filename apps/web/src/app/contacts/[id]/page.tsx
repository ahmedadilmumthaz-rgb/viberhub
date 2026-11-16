'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Mail,
  Building,
  Calendar,
  ShieldCheck,
  Tag as TagIcon,
  Archive,
  Edit2,
  CheckCircle2
} from 'lucide-react';
import { AppShell } from '../../../components/AppShell';
import { Badge } from '../../../components/Badge';
import { Modal } from '../../../components/Modal';
import { apiClient } from '../../../lib/api';
import { formatDate, formatDateTime } from '../../../lib/utils';
import { ConsentStatus } from '@viberhub/shared';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Consent update modal
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>(ConsentStatus.GRANTED);
  const [consentPurpose, setConsentPurpose] = useState('');
  const [consentEvidence, setConsentEvidence] = useState('');

  const fetchContact = async () => {
    try {
      const res = await apiClient(`/contacts/${contactId}`);
      setContact(res.data);
      if (res.data?.latestConsent) {
        setConsentStatus(res.data.latestConsent.status);
        setConsentPurpose(res.data.latestConsent.purpose || '');
      }
    } catch (err) {
      console.error('Failed to load contact', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContact();
  }, [contactId]);

  const handleUpdateConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient(`/contacts/${contactId}/consent`, {
        method: 'POST',
        body: JSON.stringify({
          status: consentStatus,
          purpose: consentPurpose,
          evidenceRef: consentEvidence,
          source: 'manual_operator_update'
        })
      });
      setIsConsentModalOpen(false);
      fetchContact();
    } catch (err: any) {
      alert(err.message || 'Failed to update consent');
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this contact?')) return;
    try {
      await apiClient(`/contacts/${contactId}`, { method: 'DELETE' });
      router.push('/contacts');
    } catch (err: any) {
      alert(err.message || 'Failed to archive contact');
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="py-24 text-center text-xs text-slate-400">Loading contact profile...</div>
      </AppShell>
    );
  }

  if (!contact) {
    return (
      <AppShell>
        <div className="py-24 text-center text-xs text-rose-500">Contact not found.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Navigation */}
        <Link
          href="/contacts"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Contacts Directory</span>
        </Link>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 text-violet-700 font-bold text-xl flex items-center justify-center">
                {contact.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900">{contact.displayName}</h1>
                  <Badge status={contact.latestConsent?.status || ConsentStatus.UNKNOWN} />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Added on {formatDate(contact.createdAt)} • Source: <span className="font-medium text-slate-700">{contact.source}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsConsentModalOpen(true)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                Update Consent
              </button>
              <button
                onClick={handleArchive}
                className="px-3.5 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
              >
                Archive Contact
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-slate-100 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Verified Phone (E.164)
              </span>
              <span className="font-mono font-semibold text-slate-800 text-sm">
                {contact.phoneE164}
              </span>
              <span className="block text-slate-400 mt-0.5 text-[11px]">
                Original input: {contact.phoneOriginal}
              </span>
            </div>

            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Email Address
              </span>
              <span className="text-slate-800 text-sm">
                {contact.email || 'Not specified'}
              </span>
            </div>

            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Organization / Company
              </span>
              <span className="text-slate-800 text-sm">
                {contact.organization || 'Not specified'}
              </span>
            </div>
          </div>

          {/* Notes and Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Internal Operator Notes
              </span>
              <p className="text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                {contact.notes || 'No internal notes recorded for this contact.'}
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Assigned Tags
              </span>
              <div className="flex flex-wrap gap-2">
                {contact.tags && contact.tags.length > 0 ? (
                  contact.tags.map((t: any) => (
                    <span
                      key={t.id}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100"
                    >
                      {t.name}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs">No tags assigned.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Consent Audit History */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-violet-600" />
            <span>Consent & Communication Preference History</span>
          </h3>

          <div className="space-y-3">
            {contact.consentRecords && contact.consentRecords.length > 0 ? (
              contact.consentRecords.map((cr: any) => (
                <div
                  key={cr.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge status={cr.status} />
                      <span className="font-medium text-slate-700">
                        Purpose: {cr.purpose || 'General Communication'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Source: {cr.source} {cr.evidenceRef && `• Evidence: ${cr.evidenceRef}`}
                    </p>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    {formatDateTime(cr.recordedAt)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No consent history records available.</p>
            )}
          </div>
        </div>

        {/* Modal: Update Consent */}
        <Modal
          isOpen={isConsentModalOpen}
          onClose={() => setIsConsentModalOpen(false)}
          title="Update Consent Record"
          description="Log changes in subscriber communication preferences or opt-outs."
        >
          <form onSubmit={handleUpdateConsent} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                New Consent Status
              </label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="modalConsent"
                    value={ConsentStatus.GRANTED}
                    checked={consentStatus === ConsentStatus.GRANTED}
                    onChange={() => setConsentStatus(ConsentStatus.GRANTED)}
                  />
                  <div>
                    <span className="font-semibold text-emerald-700">GRANTED</span>
                    <span className="block text-[11px] text-slate-500">Contact has affirmatively consented to communication.</span>
                  </div>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="modalConsent"
                    value={ConsentStatus.WITHDRAWN}
                    checked={consentStatus === ConsentStatus.WITHDRAWN}
                    onChange={() => setConsentStatus(ConsentStatus.WITHDRAWN)}
                  />
                  <div>
                    <span className="font-semibold text-rose-700">WITHDRAWN (Opt-Out / Do Not Contact)</span>
                    <span className="block text-[11px] text-slate-500">Contact requested removal from messaging outreach.</span>
                  </div>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="modalConsent"
                    value={ConsentStatus.UNKNOWN}
                    checked={consentStatus === ConsentStatus.UNKNOWN}
                    onChange={() => setConsentStatus(ConsentStatus.UNKNOWN)}
                  />
                  <div>
                    <span className="font-semibold text-slate-700">UNKNOWN</span>
                    <span className="block text-[11px] text-slate-500">No explicit consent or withdrawal on file.</span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Communication Purpose
              </label>
              <input
                type="text"
                value={consentPurpose}
                onChange={(e) => setConsentPurpose(e.target.value)}
                placeholder="e.g. Monthly updates, urgent account alerts"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Evidence Reference / Ticket
              </label>
              <input
                type="text"
                value={consentEvidence}
                onChange={(e) => setConsentEvidence(e.target.value)}
                placeholder="e.g. TICKET-4921, Signed Form Ref"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConsentModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
              >
                Save Consent Record
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
