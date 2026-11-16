'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Plus,
  Search,
  User,
  Users,
  Radio,
  Share2,
  AlertCircle,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { apiClient } from '../../lib/api';
import { DestinationType, AccountStatus } from '@viberhub/shared';

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    type: DestinationType.INDIVIDUAL,
    displayName: '',
    description: '',
    notes: '',
    contactId: ''
  });
  const [contacts, setContacts] = useState<any[]>([]);

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const typeQuery = activeTab === 'ALL' ? '' : `?type=${activeTab}`;
      const res = await apiClient(`/destinations${typeQuery}`);
      setDestinations(res.data || []);
    } catch (err) {
      console.error('Failed to load destinations', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await apiClient('/contacts?limit=100');
      setContacts(res.data || []);
    } catch (err) {
      console.error('Failed to load contacts for destination selector', err);
    }
  };

  useEffect(() => {
    fetchDestinations();
    fetchContacts();
  }, [activeTab]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/destinations', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          contactId: form.contactId || null
        })
      });
      setIsModalOpen(false);
      setForm({
        type: DestinationType.INDIVIDUAL,
        displayName: '',
        description: '',
        notes: '',
        contactId: ''
      });
      fetchDestinations();
    } catch (err: any) {
      alert(err.message || 'Failed to create destination');
    }
  };

  const getDestinationIcon = (type: DestinationType) => {
    switch (type) {
      case DestinationType.INDIVIDUAL:
        return <User className="w-4 h-4 text-violet-600" />;
      case DestinationType.GROUP:
        return <Users className="w-4 h-4 text-sky-600" />;
      case DestinationType.CHANNEL:
        return <Radio className="w-4 h-4 text-emerald-600" />;
      case DestinationType.COMMUNITY:
        return <Share2 className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Destination Directory</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manually curated directory of Viber individuals, groups, communities, and broadcast channels
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Destination</span>
          </button>
        </div>

        {/* Policy Boundary Notice */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-900">Privacy & Policy Guardrail: </span>
            Destinations in Viber Hub are manually maintained references. Viber Hub does not scrape your Viber account, intercept private chats, or automatically discover group memberships without authorization.
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {['ALL', DestinationType.INDIVIDUAL, DestinationType.GROUP, DestinationType.COMMUNITY, DestinationType.CHANNEL].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === tab
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab === 'ALL' ? 'All Types' : tab}
            </button>
          ))}
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-3 py-16 text-center text-xs text-slate-400">Loading directory...</div>
          ) : destinations.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-xs text-slate-400">
              No destinations registered in this category.
            </div>
          ) : (
            destinations.map((dest) => (
              <div
                key={dest.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        {getDestinationIcon(dest.type)}
                      </div>
                      <Badge variant="neutral">{dest.type}</Badge>
                    </div>
                    <Badge status={dest.status} />
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{dest.displayName}</h3>
                  {dest.description && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{dest.description}</p>
                  )}

                  {dest.contact && (
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">
                        Associated Contact
                      </span>
                      <span className="font-medium text-slate-800">{dest.contact.displayName}</span>
                      <span className="block font-mono text-[11px] text-slate-500">{dest.contact.phoneE164}</span>
                    </div>
                  )}

                  {dest.notes && (
                    <p className="text-[11px] text-slate-400 mt-3 italic">
                      Note: {dest.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>ID: {dest.id.slice(0, 8)}</span>
                  <span className="text-violet-600 font-semibold cursor-pointer hover:underline">
                    Use in Campaign
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal: Add Destination */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add New Destination"
          description="Register a known conversation target in your Viber directory for manual operator handoff."
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Destination Type *
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as DestinationType })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 bg-white"
              >
                <option value={DestinationType.INDIVIDUAL}>Individual 1-on-1 Chat</option>
                <option value={DestinationType.GROUP}>Viber Group</option>
                <option value={DestinationType.COMMUNITY}>Viber Community</option>
                <option value={DestinationType.CHANNEL}>Viber Channel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="e.g. VIP Customer Advisory Group"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
              />
            </div>

            {form.type === DestinationType.INDIVIDUAL && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link Contact Record (Optional)
                </label>
                <select
                  value={form.contactId}
                  onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 bg-white"
                >
                  <option value="">None (Standalone)</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.displayName} ({c.phoneE164})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description / Purpose
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description of group purpose, audience, or guidelines..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Internal Operator Notes
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. Operator must have admin posting rights"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
              >
                Save Destination
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
