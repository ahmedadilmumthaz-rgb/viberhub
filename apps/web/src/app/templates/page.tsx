'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Copy,
  Check,
  AlertTriangle,
  Search,
  Sparkles,
  Eye,
  Trash2
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { apiClient } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { ALLOWED_TEMPLATE_VARIABLES } from '@viberhub/shared';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Template Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'announcement',
    body: ''
  });

  // Preview testing
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await apiClient('/templates');
      setTemplates(res.data || []);
    } catch (err) {
      console.error('Failed to load templates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleInsertVariable = (varName: string) => {
    setForm((prev) => ({
      ...prev,
      body: `${prev.body}{{${varName}}}`
    }));
  };

  const handleTestPreview = async (bodyToTest: string) => {
    setPreviewLoading(true);
    try {
      const res = await apiClient('/templates/preview', {
        method: 'POST',
        body: JSON.stringify({ body: bodyToTest })
      });
      setPreviewResult(res.data);
    } catch (err) {
      console.error('Failed to preview', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/templates', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setIsModalOpen(false);
      setForm({ name: '', category: 'announcement', body: '' });
      setPreviewResult(null);
      fetchTemplates();
    } catch (err: any) {
      alert(err.message || 'Failed to save template');
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Message Templates</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Reusable templates with strict variable validation (name, phone, company, date)
            </p>
          </div>

          <button
            onClick={() => {
              setIsModalOpen(true);
              setForm({ name: '', category: 'announcement', body: '' });
              setPreviewResult(null);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Template</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Allowed Variables:</span>
            {ALLOWED_TEMPLATE_VARIABLES.map((v) => (
              <code key={v} className="bg-slate-100 text-violet-700 px-1.5 py-0.5 rounded font-mono text-[11px]">
                {`{{${v}}}`}
              </code>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 py-16 text-center text-xs text-slate-400">Loading templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="col-span-2 py-16 text-center text-xs text-slate-400">
              No message templates registered.
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-slate-900 text-base">{template.name}</span>
                    <Badge variant="neutral">{template.category}</Badge>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {template.body}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>{template.body.length} characters</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyText(template.id, template.body)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                    >
                      {copiedId === template.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy Body</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal: Create Template */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create Message Template"
          description="Build reusable templates with safely escaped variables."
          maxWidth="xl"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Service Update Notice"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 bg-white"
                >
                  <option value="announcement">Announcement</option>
                  <option value="service">Service Notification</option>
                  <option value="marketing">Marketing & Outreach</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>

            {/* Variable Insertion Chips */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Insert Variables (Click to append):
              </label>
              <div className="flex flex-wrap gap-2">
                {ALLOWED_TEMPLATE_VARIABLES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleInsertVariable(v)}
                    className="px-2.5 py-1 rounded bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-xs font-mono font-medium transition"
                  >
                    + {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Message Body *
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {form.body.length} characters
                </span>
              </div>
              <textarea
                rows={5}
                required
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Hello {{name}}, welcome to {{company}}..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
              />
            </div>

            {/* Test Preview Action */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => handleTestPreview(form.body)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Test Live Interpolation</span>
              </button>
            </div>

            {previewResult && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                  Interpolation Preview:
                </span>
                <p className="text-slate-800 font-mono whitespace-pre-wrap bg-white p-3 rounded border border-slate-100">
                  {previewResult.renderedText}
                </p>

                {previewResult.missingVariables.length > 0 && (
                  <div className="flex items-center gap-2 text-amber-700 text-xs">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Missing variables: {previewResult.missingVariables.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

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
                Save Template
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
