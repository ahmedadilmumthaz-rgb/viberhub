'use client';

import React, { useState, useEffect } from 'react';
import {
  Image,
  Upload,
  Download,
  Trash2,
  FileText,
  FileCheck,
  HardDrive,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { apiClient } from '../../lib/api';
import { formatBytes, formatDateTime } from '../../lib/utils';

export default function MediaPage() {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    try {
      await apiClient(`/attachments/${id}`, { method: 'DELETE' });
      fetchAttachments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
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

        {/* Security boundary card */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-900">Protected Object Storage: </span>
            All files are stored in private MinIO/S3 buckets with random cryptographic storage keys.
            Download URLs are short-lived and authenticated. Raw bucket endpoints are never publicly exposed.
          </div>
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-3 py-16 text-center text-xs text-slate-400">Loading attachments...</div>
          ) : attachments.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-xs text-slate-400">
              No media files uploaded yet.
            </div>
          ) : (
            attachments.map((file) => (
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
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {file.mimeType}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    {formatDateTime(file.createdAt)}
                  </span>
                  <div className="flex items-center gap-1">
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
