'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Tag as TagIcon,
  Archive,
  Phone,
  Mail,
  Building,
  GitMerge
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { apiClient } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { ConsentStatus } from '@viberhub/shared';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedConsent, setSelectedConsent] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // New Contact Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    displayName: '',
    phoneOriginal: '',
    email: '',
    organization: '',
    notes: '',
    tagIds: [] as string[],
    consentStatus: ConsentStatus.GRANTED,
    consentPurpose: 'Direct customer communication'
  });
  const [createError, setCreateError] = useState<string | null>(null);

  // Merge Contacts Modal
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [primaryMergeId, setPrimaryMergeId] = useState('');
  const [duplicateMergeId, setDuplicateMergeId] = useState('');
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);

  // CSV Import Modal
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [duplicatePolicy, setDuplicatePolicy] = useState<'skip' | 'overwrite'>('skip');
  const [importResult, setImportResult] = useState<any>(null);
  const [importLoading, setImportLoading] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      let query = `?page=${page}&limit=25`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (selectedTag) query += `&tagId=${encodeURIComponent(selectedTag)}`;
      if (selectedConsent) query += `&consentStatus=${encodeURIComponent(selectedConsent)}`;

      const res = await apiClient(`/contacts${query}`);
      setContacts(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load contacts', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await apiClient('/contacts/tags/all');
      setTags(res.data || []);
    } catch (err) {
      console.error('Failed to load tags', err);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchTags();
  }, [page, selectedTag, selectedConsent]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchContacts();
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      await apiClient('/contacts', {
        method: 'POST',
        body: JSON.stringify(createForm)
      });
      setIsCreateOpen(false);
      setCreateForm({
        displayName: '',
        phoneOriginal: '',
        email: '',
        organization: '',
        notes: '',
        tagIds: [],
        consentStatus: ConsentStatus.GRANTED,
        consentPurpose: 'Direct customer communication'
      });
      fetchContacts();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create contact');
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await apiClient('/contacts/export');
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `viberhub_contacts_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export contacts CSV');
    }
  };

  const handleMergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryMergeId || !duplicateMergeId) {
      setMergeError('Please select both a primary contact and a duplicate contact.');
      return;
    }
    if (primaryMergeId === duplicateMergeId) {
      setMergeError('Primary and duplicate contacts cannot be the same.');
      return;
    }
    setMergeLoading(true);
    setMergeError(null);
    try {
      await apiClient('/contacts/merge', {
        method: 'POST',
        body: JSON.stringify({
          primaryContactId: primaryMergeId,
          duplicateContactId: duplicateMergeId
        })
      });
      setIsMergeOpen(false);
      setPrimaryMergeId('');
      setDuplicateMergeId('');
      fetchContacts();
    } catch (err: any) {
      setMergeError(err.message || 'Failed to merge contacts');
    } finally {
      setMergeLoading(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent) return;
    setImportLoading(true);
    setImportResult(null);

    try {
      // Parse CSV into rows
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) throw new Error('CSV must contain a header line and at least one data row');

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const rows: Array<Record<string, string>> = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        rows.push(rowObj);
      }

      // Default column mapping heuristic
      const nameCol = headers.find((h) => /name/i.test(h)) || headers[0];
      const phoneCol = headers.find((h) => /phone|mobile|tel|viber/i.test(h)) || headers[1] || headers[0];
      const emailCol = headers.find((h) => /email/i.test(h));
      const orgCol = headers.find((h) => /org|company/i.test(h));
      const notesCol = headers.find((h) => /note/i.test(h));
      const tagsCol = headers.find((h) => /tag/i.test(h));

      const payload = {
        fileName: importFileName || 'contacts_import.csv',
        columnMapping: {
          displayName: nameCol,
          phoneNumber: phoneCol,
          email: emailCol,
          organization: orgCol,
          notes: notesCol,
          tags: tagsCol
        },
        duplicatePolicy,
        defaultConsentStatus: ConsentStatus.GRANTED,
        rows
      };

      const res = await apiClient('/contacts/import', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setImportResult(res.data);
      fetchContacts();
    } catch (err: any) {
      alert(err.message || 'Import failed');
    } finally {
      setImportLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvContent(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contacts Directory</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Verified phone records with E.164 normalization, consent tracking, and tag segmentation
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsMergeOpen(true);
                setMergeError(null);
                if (contacts.length >= 2) {
                  setPrimaryMergeId(contacts[0].id);
                  setDuplicateMergeId(contacts[1].id);
                }
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <GitMerge className="w-3.5 h-3.5 text-violet-600" />
              <span>Merge Contacts</span>
            </button>
            <button
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Import CSV</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Contact</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, phone, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
            />
          </form>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Tag filter */}
            <select
              value={selectedTag}
              onChange={(e) => {
                setSelectedTag(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-violet-600"
            >
              <option value="">All Tags</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* Consent filter */}
            <select
              value={selectedConsent}
              onChange={(e) => {
                setSelectedConsent(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-violet-600"
            >
              <option value="">All Consent Statuses</option>
              <option value={ConsentStatus.GRANTED}>Granted</option>
              <option value={ConsentStatus.UNKNOWN}>Unknown</option>
              <option value={ConsentStatus.WITHDRAWN}>Withdrawn (Opt-out)</option>
            </select>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Phone (E.164)</th>
                  <th className="py-3 px-6">Organization</th>
                  <th className="py-3 px-6">Consent</th>
                  <th className="py-3 px-6">Tags</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading contacts...
                    </td>
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No contacts found matching criteria.
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="hover:text-violet-600 transition"
                        >
                          {contact.displayName}
                        </Link>
                        {contact.email && (
                          <span className="block text-[11px] font-normal text-slate-400">
                            {contact.email}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-700">
                        {contact.phoneE164}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        {contact.organization || '—'}
                      </td>
                      <td className="py-3.5 px-6">
                        <Badge status={contact.latestConsent?.status || ConsentStatus.UNKNOWN} />
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex flex-wrap gap-1.5">
                          {contact.tags && contact.tags.length > 0 ? (
                            contact.tags.map((t: any) => (
                              <span
                                key={t.id}
                                className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700"
                              >
                                {t.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="text-xs font-semibold text-violet-600 hover:text-violet-800"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Modal: Create Contact */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Create New Contact"
          description="Phone numbers are automatically normalized to E.164 and checked for duplicates."
        >
          <form onSubmit={handleCreateContact} className="space-y-4">
            {createError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {createError}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={createForm.displayName}
                onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                placeholder="e.g. Elena Rostova"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Viber Phone Number *
              </label>
              <input
                type="text"
                required
                value={createForm.phoneOriginal}
                onChange={(e) => setCreateForm({ ...createForm, phoneOriginal: e.target.value })}
                placeholder="e.g. +44 7911 123456"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="name@company.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organization
                </label>
                <input
                  type="text"
                  value={createForm.organization}
                  onChange={(e) => setCreateForm({ ...createForm, organization: e.target.value })}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
              </div>
            </div>

            {/* Tag Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assign Tags
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {tags.map((t) => {
                  const isChecked = createForm.tagIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        const newTags = isChecked
                          ? createForm.tagIds.filter((id) => id !== t.id)
                          : [...createForm.tagIds, t.id];
                        setCreateForm({ ...createForm, tagIds: newTags });
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition ${
                        isChecked
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Consent Details */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Consent Registration
              </span>
              <div className="flex gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="consentStatus"
                    value={ConsentStatus.GRANTED}
                    checked={createForm.consentStatus === ConsentStatus.GRANTED}
                    onChange={() => setCreateForm({ ...createForm, consentStatus: ConsentStatus.GRANTED })}
                  />
                  <span>Consent Granted</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="consentStatus"
                    value={ConsentStatus.UNKNOWN}
                    checked={createForm.consentStatus === ConsentStatus.UNKNOWN}
                    onChange={() => setCreateForm({ ...createForm, consentStatus: ConsentStatus.UNKNOWN })}
                  />
                  <span>Unknown / Unverified</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
              >
                Create Contact
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: CSV Import Wizard */}
        <Modal
          isOpen={isImportOpen}
          onClose={() => {
            setIsImportOpen(false);
            setImportResult(null);
          }}
          title="Import Contacts from CSV"
          description="Upload a CSV file containing contact records. Duplicates will be handled according to your selected policy."
        >
          <div className="space-y-4">
            {!importResult ? (
              <form onSubmit={handleImportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                  />
                </div>

                {csvContent && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      Preview CSV (First 3 lines)
                    </span>
                    <pre className="text-[11px] font-mono text-slate-600 overflow-x-auto">
                      {csvContent.split('\n').slice(0, 3).join('\n')}
                    </pre>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Duplicate Phone Handling Policy
                  </label>
                  <div className="flex gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="dupPolicy"
                        value="skip"
                        checked={duplicatePolicy === 'skip'}
                        onChange={() => setDuplicatePolicy('skip')}
                      />
                      <span>Skip duplicate phone numbers</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="dupPolicy"
                        value="overwrite"
                        checked={duplicatePolicy === 'overwrite'}
                        onChange={() => setDuplicatePolicy('overwrite')}
                      />
                      <span>Overwrite existing contact fields</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsImportOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={importLoading || !csvContent}
                    className="px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 disabled:opacity-50"
                  >
                    {importLoading ? 'Processing Import...' : 'Run Import'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Import Completed</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3 text-xs text-slate-700">
                    <div className="p-2 bg-white rounded border border-emerald-100 text-center">
                      <span className="block font-bold text-slate-900 text-base">{importResult.totalRows}</span>
                      <span>Total Rows</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-emerald-100 text-center">
                      <span className="block font-bold text-emerald-700 text-base">{importResult.importedRows}</span>
                      <span>Imported</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-emerald-100 text-center">
                      <span className="block font-bold text-amber-700 text-base">{importResult.rejectedRows}</span>
                      <span>Skipped/Errors</span>
                    </div>
                  </div>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <p className="font-semibold text-slate-700 mb-1">Row Exceptions:</p>
                    {importResult.errors.map((e: any, idx: number) => (
                      <p key={idx} className="text-slate-600">
                        <span className="font-mono text-slate-800 font-semibold">Row {e.row}:</span> {e.error}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setIsImportOpen(false);
                      setImportResult(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* Merge Contacts Modal */}
        <Modal
          isOpen={isMergeOpen}
          onClose={() => setIsMergeOpen(false)}
          title="Merge Duplicate Contacts"
        >
          <form onSubmit={handleMergeSubmit} className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Irreversible Consolidation</p>
                <p className="mt-0.5">
                  The primary contact will receive all tags, destinations, consent records, and notes from the duplicate. The duplicate will be archived with an audit trail.
                </p>
              </div>
            </div>

            {mergeError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {mergeError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Contact (Record to Keep)
              </label>
              <select
                value={primaryMergeId}
                onChange={(e) => setPrimaryMergeId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
              >
                <option value="">Select primary contact...</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName} ({c.phoneE164}){c.organization ? ` - ${c.organization}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duplicate Contact (Record to Merge & Archive)
              </label>
              <select
                value={duplicateMergeId}
                onChange={(e) => setDuplicateMergeId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
              >
                <option value="">Select duplicate contact...</option>
                {contacts
                  .filter((c) => c.id !== primaryMergeId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.displayName} ({c.phoneE164}){c.organization ? ` - ${c.organization}` : ''}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsMergeOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mergeLoading || !primaryMergeId || !duplicateMergeId}
                className="px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 disabled:opacity-50"
              >
                {mergeLoading ? 'Merging...' : 'Execute Merge'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
