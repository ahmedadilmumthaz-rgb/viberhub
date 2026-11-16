'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Image,
  Upload,
  Download,
  Trash2,
  FileText,
  FileCheck,
  HardDrive,
  ShieldCheck,
  AlertCircle,
  Search,
  Filter,
  Copy,
  Check,
  FolderOpen,
  Layers
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { apiClient } from '../../lib/api';
import { formatBytes, formatDateTime } from '../../lib/utils';

export default function MediaPage() {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IMAGE' | 'PDF' | 'DOCUMENT'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAttachments = async () => {
    setLoading(true);
    try {
      const res = await apiClient('/attachments');
      setAttachments(res.data || []);
    } catch (err) {
      console.error('Failed to load media attachments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      await apiClient('/attachments/upload', {
        method: 'POST',
        body: formData
      });

      fetchAttachments();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      // Reset input value so same file can be re-uploaded if needed
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media attachment?')) return;
    try {
      await apiClient(`/attachments/${id}`, { method: 'DELETE' });
      fetchAttachments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleCopyLink = (file: any) => {
    const url = file.downloadUrl.startsWith('http')
      ? file.downloadUrl
      : `${window.location.origin}${file.downloadUrl}`;
    navigator.clipboard.writeText(url);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) {
      return <Image className="w-5 h-5 text-violet-600" />;
    }
    if (mime.includes('pdf')) {
      return <FileText className="w-5 h-5 text-rose-600" />;
    }
    return <FileCheck className="w-5 h-5 text-sky-600" />;
  };

  // Filter attachments by search and category
  const filteredAttachments = useMemo(() => {
    return attachments.filter((file) => {
      const matchesSearch = file.originalName.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      if (typeFilter === 'IMAGE') return file.mimeType.startsWith('image/');
      if (typeFilter === 'PDF') return file.mimeType.includes('pdf');
      if (typeFilter === 'DOCUMENT') {
        return (
          file.mimeType.includes('word') ||
          file.mimeType.includes('document') ||
          file.mimeType.includes('sheet') ||
          file.mimeType.includes('text') ||
          file.mimeType.includes('csv')
        );
      }
      return true;
    });
  }, [attachments, search, typeFilter]);

  const totalStorageBytes = useMemo(() => {
    return attachments.reduce((acc, file) => acc + (file.sizeBytes || 0), 0);
  }, [attachments]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Private Media Library</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Secure object storage for campaign images, PDFs, and briefing documents
            </p>
          </div>

          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition shadow-sm cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Media File'}</span>
            <input
              type="file"
              disabled={uploading}
              onChange={handleUpload}
              className="hidden"
              accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
            />
          </label>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Storage stats overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-violet-50 text-violet-600 border border-violet-100">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Files</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{attachments.length}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Storage Consumed</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{formatBytes(totalStorageBytes)}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Storage Boundary</p>
              <p className="text-xs font-semibold text-emerald-700 mt-1">Private Authenticated S3/MinIO</p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search media files by name..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
            <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Type:
            </span>
            {(['ALL', 'IMAGE', 'PDF', 'DOCUMENT'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTypeFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  typeFilter === filter
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter === 'ALL' ? 'All Files' : filter === 'IMAGE' ? 'Images' : filter === 'PDF' ? 'PDFs' : 'Documents'}
              </button>
            ))}
          </div>
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-3 py-16 text-center text-xs text-slate-400">Loading attachments...</div>
          ) : filteredAttachments.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              <FolderOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              {attachments.length === 0 ? 'No media files uploaded yet.' : 'No media files matching the current filter.'}
            </div>
          ) : (
            filteredAttachments.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {formatBytes(file.sizeBytes)}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-xs truncate" title={file.originalName}>
                    {file.originalName}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate font-mono">
                    {file.mimeType}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    {formatDateTime(file.createdAt)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyLink(file)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-slate-100 transition relative"
                      title="Copy download link"
                    >
                      {copiedId === file.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <a
                      href={file.downloadUrl}
                      download={file.originalName}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-slate-100 transition"
                      title="Download securely"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete attachment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
