'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  FileText,
  Paperclip,
  Check,
  AlertTriangle,
  User,
  Users,
  Sparkles,
  Tag as TagIcon,
  Layers
} from 'lucide-react';
import { AppShell } from '../../../components/AppShell';
import { Badge } from '../../../components/Badge';
import { apiClient } from '../../../lib/api';
import { ALLOWED_TEMPLATE_VARIABLES } from '@viberhub/shared';

export default function NewCampaignPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [plannedAt, setPlannedAt] = useState('');

  // Target Mode & Destination selection
  const [targetMode, setTargetMode] = useState<'single' | 'multiple' | 'tag'>('single');
  const [destinations, setDestinations] = useState<any[]>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState('');
  const [selectedDestinationIds, setSelectedDestinationIds] = useState<string[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTagId, setSelectedTagId] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);

  // Template selection
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [body, setBody] = useState('');

  // Attachments
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([]);

  // Preview
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [destRes, tempRes, mediaRes, tagsRes, contactsRes] = await Promise.all([
          apiClient('/destinations'),
          apiClient('/templates'),
          apiClient('/attachments'),
          apiClient('/contacts/tags/all'),
          apiClient('/contacts?limit=200')
        ]);
        setDestinations(destRes.data || []);
        setTemplates(tempRes.data || []);
        setMediaFiles(mediaRes.data || []);
        setTags(tagsRes.data || []);
        setContacts(contactsRes.data || []);

        if (destRes.data && destRes.data.length > 0) {
          setSelectedDestinationId(destRes.data[0].id);
          setSelectedDestinationIds([destRes.data[0].id]);
        }
        if (tagsRes.data && tagsRes.data.length > 0) {
          setSelectedTagId(tagsRes.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load initial data for new campaign', err);
      }
    }
    loadData();
  }, []);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const found = templates.find((t) => t.id === templateId);
    if (found) {
      setBody(found.body);
    }
  };

  const handleDestinationChange = (destId: string) => {
    setSelectedDestinationId(destId);
  };

  // Preview interpolation live
  useEffect(() => {
    if (!body || !selectedDestinationId) return;

    const dest = destinations.find((d) => d.id === selectedDestinationId);
    const contactId = dest?.contactId;

    apiClient('/templates/preview', {
      method: 'POST',
      body: JSON.stringify({
        body,
        contactId
      })
    })
      .then((res) => setPreviewResult(res.data))
      .catch((err) => console.error('Preview error', err));
  }, [body, selectedDestinationId, destinations]);

  const getRecipientCount = () => {
    if (targetMode === 'single') return selectedDestinationId ? 1 : 0;
    if (targetMode === 'multiple') return selectedDestinationIds.length;
    if (targetMode === 'tag') {
      return contacts.filter((c) =>
        c.tags?.some((t: any) => t.id === selectedTagId || t.name === selectedTagId)
      ).length;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!body.trim()) {
      setError('Message body cannot be empty');
      return;
    }

    setSubmitting(true);
    try {
      let items: any[] = [];

      if (targetMode === 'single') {
        if (!selectedDestinationId) {
          setError('Please select a target destination');
          setSubmitting(false);
          return;
        }
        const dest = destinations.find((d) => d.id === selectedDestinationId);
        items = [
          {
            destinationId: selectedDestinationId,
            contactId: dest?.contactId || null,
            body,
            attachmentIds: selectedAttachmentIds
          }
        ];
      } else if (targetMode === 'multiple') {
        if (selectedDestinationIds.length === 0) {
          setError('Please select at least one destination target');
          setSubmitting(false);
          return;
        }
        items = selectedDestinationIds.map((destId) => {
          const dest = destinations.find((d) => d.id === destId);
          return {
            destinationId: destId,
            contactId: dest?.contactId || null,
            body,
            attachmentIds: selectedAttachmentIds
          };
        });
      } else if (targetMode === 'tag') {
        if (!selectedTagId) {
          setError('Please select a tag for segmentation');
          setSubmitting(false);
          return;
        }
        const taggedContacts = contacts.filter((c) =>
          c.tags?.some((t: any) => t.id === selectedTagId || t.name === selectedTagId)
        );
        if (taggedContacts.length === 0) {
          setError('No contacts found with the selected tag');
          setSubmitting(false);
          return;
        }

        for (const contact of taggedContacts) {
          let dest = destinations.find((d) => d.contactId === contact.id);
          if (!dest) {
            try {
              const newDestRes = await apiClient('/destinations', {
                method: 'POST',
                body: JSON.stringify({
                  type: 'INDIVIDUAL_CHAT',
                  displayName: contact.displayName,
                  contactId: contact.id
                })
              });
              dest = newDestRes.data;
            } catch (e) {
              console.error('Failed to create destination for contact', contact.id, e);
            }
          }
          if (dest) {
            items.push({
              destinationId: dest.id,
              contactId: contact.id,
              body,
              attachmentIds: selectedAttachmentIds
            });
          }
        }

        if (items.length === 0) {
          setError('Could not prepare destinations for the tagged contacts');
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        title,
        purpose,
        notes,
        plannedAt: plannedAt ? new Date(plannedAt).toISOString() : null,
        items
      };

      const res = await apiClient('/campaigns', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      router.push(`/campaigns/${res.data.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Campaigns</span>
        </Link>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="border-b border-slate-100 pb-5 mb-6">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create Campaign Package</h1>
            <p className="text-xs text-slate-500 mt-1">
              Prepare verified content, resolve personalization variables, and queue for designated approval
            </p>
          </div>

          {error && (
            <div className="p-3.5 mb-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Campaign Metadata */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                1. Campaign Details
              </span>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q1 Partnership Briefing Announcement"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purpose / Audience
                  </label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. Priority client liaisons briefing"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Planned Date (Operator Reminder)
                  </label>
                  <input
                    type="datetime-local"
                    value={plannedAt}
                    onChange={(e) => setPlannedAt(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Destination & Template */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  2. Target Destination & Message Content
                </span>
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setTargetMode('single')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                      targetMode === 'single'
                        ? 'bg-white text-violet-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Single</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode('multiple')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                      targetMode === 'multiple'
                        ? 'bg-white text-violet-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Multi-Select ({selectedDestinationIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode('tag')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                      targetMode === 'tag'
                        ? 'bg-white text-violet-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TagIcon className="w-3.5 h-3.5" />
                    <span>By Tag</span>
                  </button>
                </div>
              </div>

              {/* Target Mode Specific Selector */}
              {targetMode === 'single' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Select Target Destination *
                    </label>
                    <select
                      value={selectedDestinationId}
                      onChange={(e) => handleDestinationChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                    >
                      {destinations.map((d) => (
                        <option key={d.id} value={d.id}>
                          [{d.type}] {d.displayName} {d.contact ? `— ${d.contact.displayName}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Load Existing Template (Optional)
                    </label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => handleTemplateSelect(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                    >
                      <option value="">Custom Message Body</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {targetMode === 'multiple' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Choose Multiple Target Destinations ({selectedDestinationIds.length} selected)
                    </label>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedDestinationIds(destinations.map((d) => d.id))}
                        className="text-violet-600 hover:text-violet-800 font-semibold"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedDestinationIds([])}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                    {destinations.map((d) => {
                      const checked = selectedDestinationIds.includes(d.id);
                      return (
                        <label
                          key={d.id}
                          className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer text-xs transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                if (checked) {
                                  setSelectedDestinationIds((prev) => prev.filter((id) => id !== d.id));
                                } else {
                                  setSelectedDestinationIds((prev) => [...prev, d.id]);
                                }
                              }}
                              className="rounded text-violet-600 focus:ring-violet-500"
                            />
                            <div>
                              <span className="font-semibold text-slate-800">{d.displayName}</span>
                              {d.contact && (
                                <span className="text-slate-500 ml-1.5">
                                  ({d.contact.displayName} • {d.contact.phoneE164})
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant="neutral">{d.type}</Badge>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {targetMode === 'tag' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Filter Recipients by Tag *
                    </label>
                    <select
                      value={selectedTagId}
                      onChange={(e) => setSelectedTagId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                    >
                      {tags.map((t) => {
                        const count = contacts.filter((c) =>
                          c.tags?.some((ct: any) => ct.id === t.id || ct.name === t.id)
                        ).length;
                        return (
                          <option key={t.id} value={t.id}>
                            {t.name} ({count} contact{count === 1 ? '' : 's'})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Load Existing Template (Optional)
                    </label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => handleTemplateSelect(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                    >
                      <option value="">Custom Message Body</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Message Composer Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Message Body *
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {body.length} characters
                  </span>
                </div>
                <textarea
                  rows={6}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Compose message here. Supported variables: {{name}}, {{phone}}, {{company}}, {{date}}..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
              </div>

              {/* Resolved Preview Card */}
              {previewResult && (
                <div className="p-4 rounded-xl bg-violet-50/50 border border-violet-100 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-violet-900 font-semibold text-[11px] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                    <span>Live Personalization Preview for Destination</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-violet-100 font-mono whitespace-pre-wrap text-slate-800">
                    {previewResult.renderedText}
                  </div>
                  {previewResult.missingVariables.length > 0 && (
                    <div className="flex items-center gap-1.5 text-amber-700 text-xs">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Missing variables in target contact: {previewResult.missingVariables.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Attachments */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                3. Attachments from Media Library
              </span>

              {mediaFiles.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No files in media library. You can attach images/documents later or upload them under Media Library.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {mediaFiles.map((m) => {
                    const isSelected = selectedAttachmentIds.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedAttachmentIds((prev) => prev.filter((id) => id !== m.id));
                          } else {
                            setSelectedAttachmentIds((prev) => [...prev, m.id]);
                          }
                        }}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-violet-50 border-violet-500 text-violet-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="font-semibold truncate">{m.originalName}</p>
                          <span className="text-[10px] text-slate-400 uppercase">{m.mimeType}</span>
                        </div>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200">
                <Layers className="w-4 h-4 text-violet-600" />
                <span>
                  Batch Package: <strong className="text-slate-900 font-bold">{getRecipientCount()}</strong> recipient item(s) will be generated for approval & dispatch.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/campaigns"
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting || getRecipientCount() === 0}
                  className="px-5 py-2.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 disabled:opacity-50 shadow-md shadow-violet-600/20"
                >
                  {submitting ? 'Creating Campaign...' : 'Save Draft Campaign'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
