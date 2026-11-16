'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageSquareShare, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { apiClient } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@viberhub.local');
  const [password, setPassword] = useState('Admin1234!');
  const [mfaCode, setMfaCode] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          mfaCode: showMfa ? mfaCode : undefined
        })
      });

      const { token, user, workspaces } = response.data;
      localStorage.setItem('vh_token', token);
      localStorage.setItem('vh_user', JSON.stringify(user));

      if (workspaces && workspaces.length > 0) {
        localStorage.setItem('vh_workspace', JSON.stringify(workspaces[0]));
        localStorage.setItem('vh_workspace_id', workspaces[0].id);
      }

      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'MFA_REQUIRED') {
        setShowMfa(true);
        setError('Please enter your 6-digit MFA security code');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header banner */}
        <div className="p-8 text-center border-b border-slate-100 bg-slate-50/50">
          <div className="w-12 h-12 bg-violet-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-violet-600/30 mb-4">
            <MessageSquareShare className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sign in to Viber Hub</h1>
          <p className="text-xs text-slate-500 mt-1">
            Operator-led Viber communication workspace
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@organization.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition"
            />
          </div>

          {showMfa && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Two-Factor Security Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="123456"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 tracking-widest text-center font-mono font-bold"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 focus:ring-4 focus:ring-violet-500/20 shadow-md shadow-violet-600/20 transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <Link
              href="/register"
              className="text-xs text-violet-600 hover:text-violet-800 font-medium hover:underline"
            >
              Need to create a new workspace? Register here
            </Link>
          </div>
        </form>

        {/* Security badge */}
        <div className="px-8 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Compliant operator-led handoff architecture</span>
        </div>
      </div>
    </div>
  );
}
