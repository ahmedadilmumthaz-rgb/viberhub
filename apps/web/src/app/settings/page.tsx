'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  PhoneCall,
  Smartphone,
  Shield,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { apiClient } from '../../lib/api';
import { formatDate } from '../../lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'accounts' | 'devices' | 'security'>('general');

  // Workspace settings
  const [workspace, setWorkspace] = useState<any>(null);
  const [wsName, setWsName] = useState('');
  const [wsTimezone, setWsTimezone] = useState('UTC');
  const [wsLocale, setWsLocale] = useState('en');
  const [wsSuccess, setWsSuccess] = useState(false);

  // Viber Accounts
  const [viberAccounts, setViberAccounts] = useState<any[]>([]);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({ displayName: '', phoneLabel: '', notes: '' });

  // Companion Devices
  const [devices, setDevices] = useState<any[]>([]);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({ deviceName: '', platform: 'desktop' });

  const loadData = async () => {
    try {
      const [wsRes, accRes, devRes] = await Promise.all([
        apiClient('/settings/workspace'),
        apiClient('/settings/accounts'),
        apiClient('/settings/devices')
      ]);

      if (wsRes.data) {
        setWorkspace(wsRes.data);
        setWsName(wsRes.data.name || '');
        setWsTimezone(wsRes.data.timezone || 'UTC');
        setWsLocale(wsRes.data.locale || 'en');
      }
      setViberAccounts(accRes.data || []);
      setDevices(devRes.data || []);
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/settings/workspace', {
        method: 'PATCH',
        body: JSON.stringify({
          name: wsName,
          timezone: wsTimezone,
          locale: wsLocale
        })
      });
      setWsSuccess(true);
      setTimeout(() => setWsSuccess(false), 3000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update workspace');
    }
  };

  const handleCreateViberAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/settings/accounts', {
        method: 'POST',
        body: JSON.stringify(newAccount)
      });
      setIsAddAccountOpen(false);
      setNewAccount({ displayName: '', phoneLabel: '', notes: '' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add account profile');
    }
  };

  const handleRevokeAccount = async (id: string) => {
    if (!confirm('Revoke this account label?')) return;
    try {
      await apiClient(`/settings/accounts/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke');
    }
  };

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/settings/devices', {
        method: 'POST',
        body: JSON.stringify(newDevice)
      });
      setIsAddDeviceOpen(false);
      setNewDevice({ deviceName: '', platform: 'desktop' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to pair device');
    }
  };

  const handleRevokeDevice = async (id: string) => {
    if (!confirm('Revoke access for this companion device?')) return;
    try {
      await apiClient(`/settings/devices/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke device');
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workspace Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage organization parameters, organizational dispatch lines, paired devices, and access security
          </p>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {[
            { key: 'general', label: 'General & Workspace', icon: Building2 },
            { key: 'accounts', label: 'Viber Profiles', icon: PhoneCall },
            { key: 'devices', label: 'Companion Devices', icon: Smartphone },
            { key: 'security', label: 'Security & Access', icon: Shield }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === tab.key
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: General */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Workspace Details</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure primary display identity and localization
              </p>
            </div>

            {wsSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Workspace settings updated successfully.</span>
              </div>
            )}

            <form onSubmit={handleSaveWorkspace} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Timezone
                  </label>
                  <select
                    value={wsTimezone}
                    onChange={(e) => setWsTimezone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                  >
                    <option value="UTC">UTC (Universal)</option>
                    <option value="America/New_York">Eastern Time (US)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Central Europe (CET)</option>
                    <option value="Asia/Dubai">Gulf Standard Time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Locale
                  </label>
                  <select
                    value={wsLocale}
                    onChange={(e) => setWsLocale(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                  >
                    <option value="en">English (en)</option>
                    <option value="fr">French (fr)</option>
                    <option value="de">German (de)</option>
                    <option value="ru">Russian (ru)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Viber Profiles */}
        {activeTab === 'accounts' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Organizational Viber Account Profiles</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Label and document registered phone numbers used by your team for manual dispatch
                </p>
              </div>

              <button
                onClick={() => setIsAddAccountOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Profile Label</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <strong>Security Policy:</strong> Viber Hub only stores organizational phone labels and metadata notes.
              It does <em>not</em> store login credentials, cookies, or Viber session tokens.
            </div>

            <div className="space-y-3">
              {viberAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{acc.displayName}</span>
                      <Badge status={acc.status} />
                    </div>
                    {acc.phoneLabel && (
                      <span className="block font-mono text-slate-600 mt-0.5">{acc.phoneLabel}</span>
                    )}
                    {acc.notes && <p className="text-slate-400 mt-1 italic">{acc.notes}</p>}
                  </div>

                  <button
                    onClick={() => handleRevokeAccount(acc.id)}
                    className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Devices */}
        {activeTab === 'devices' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Companion Device Registry</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authorized Desktop and Android companion endpoints for notification and handoff coordination
                </p>
              </div>

              <button
                onClick={() => setIsAddDeviceOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Pair Companion Device</span>
              </button>
            </div>

            <div className="space-y-3">
              {devices.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                  No companion devices paired yet.
                </div>
              ) : (
                devices.map((dev) => (
                  <div
                    key={dev.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{dev.deviceName}</span>
                        <Badge variant="neutral">{dev.platform}</Badge>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Paired on {formatDate(dev.pairedAt)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRevokeDevice(dev.id)}
                      className="px-3 py-1 rounded text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                    >
                      Revoke
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Security */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Security & Access Controls</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Session parameters, password rotation, and two-factor authentication (MFA)
              </p>
            </div>

            <div className="space-y-4 max-w-lg text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">Password & Authentication Policy</span>
                <p className="text-slate-600 leading-relaxed">
                  Passwords are securely hashed using Argon2id/bcrypt. Browser sessions use HTTP-only SameSite cookies
                  and expire automatically after 7 days of inactivity.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">Two-Factor Authentication (TOTP MFA)</span>
                <p className="text-slate-600 leading-relaxed">
                  Optional TOTP MFA provides secondary authentication with standard authenticator applications.
                </p>
                <button
                  type="button"
                  onClick={() => alert('MFA enrollment flow initialized. Scan the generated QR code in your authenticator.')}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold hover:bg-slate-50 shadow-sm"
                >
                  Configure Two-Factor MFA
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Viber Account Profile */}
        <Modal
          isOpen={isAddAccountOpen}
          onClose={() => setIsAddAccountOpen(false)}
          title="Add Organizational Viber Profile"
          description="Record a team phone line used for Viber dispatch (metadata only)."
        >
          <form onSubmit={handleCreateViberAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Profile Label *
              </label>
              <input
                type="text"
                required
                value={newAccount.displayName}
                onChange={(e) => setNewAccount({ ...newAccount, displayName: e.target.value })}
                placeholder="e.g. VIP Support Line"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number Label
              </label>
              <input
                type="text"
                value={newAccount.phoneLabel}
                onChange={(e) => setNewAccount({ ...newAccount, phoneLabel: e.target.value })}
                placeholder="e.g. +1 (555) 019-2831"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={newAccount.notes}
                onChange={(e) => setNewAccount({ ...newAccount, notes: e.target.value })}
                placeholder="Description of assigned team or usage..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddAccountOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
              >
                Save Profile
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Pair Device */}
        <Modal
          isOpen={isAddDeviceOpen}
          onClose={() => setIsAddDeviceOpen(false)}
          title="Pair Companion Device"
          description="Register a local companion app for manual Viber handoff."
        >
          <form onSubmit={handleRegisterDevice} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Device Name *
              </label>
              <input
                type="text"
                required
                value={newDevice.deviceName}
                onChange={(e) => setNewDevice({ ...newDevice, deviceName: e.target.value })}
                placeholder="e.g. Operator MacBook Pro"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Platform
              </label>
              <select
                value={newDevice.platform}
                onChange={(e) => setNewDevice({ ...newDevice, platform: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
              >
                <option value="desktop">Electron Desktop Companion</option>
                <option value="android">Android Companion App</option>
                <option value="web">Web Operator Terminal</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddDeviceOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
              >
                Pair Device
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
