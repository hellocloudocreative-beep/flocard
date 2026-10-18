/* ==========================================================================
   FLOCARD CUSTOMER DASHBOARD — SETTINGS TAB
   Account preferences, theme selection (Dark & Light), privacy settings, and logout.
   ========================================================================== */

import React, { useState } from 'react';
import {
  User,
  Moon,
  Sun,
  Bell,
  Shield,
  LogOut,
  Save,
  Check,
  Smartphone,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';

export default function CustomerSettingsTab({ customer }) {
  const { logout } = useAuth();
  const { theme, toggleTheme, setTheme, isDark, isLight } = useTheme();
  const { saveCustomer } = useData();

  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    company: customer?.company || '',
    phone: customer?.phone || ''
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUpdate = (e) => {
    e.preventDefault();
    if (saveCustomer && customer) {
      saveCustomer({
        ...customer,
        ...formData
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '780px' }}>
      {/* Top Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--text-primary)', fontWeight: 800 }}>
          Account & Preferences
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          Manage your personal details, theme mode, privacy, and notifications.
        </p>
      </div>

      {/* Profile Details Form */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          backgroundColor: 'var(--card-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)'
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={16} color="var(--accent-purple)" />
          <span>Customer Profile Information</span>
        </h3>

        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="input"
                style={{ width: '100%', fontSize: '0.84rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Email Address</label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="input"
                style={{ width: '100%', fontSize: '0.84rem', opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
                className="input"
                style={{ width: '100%', fontSize: '0.84rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Phone / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                style={{ width: '100%', fontSize: '0.84rem' }}
              />
            </div>
          </div>

          {saveSuccess && (
            <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={14} />
              <span>Customer details updated successfully!</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button type="submit" className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
              <Save size={14} />
              <span>Save Account Details</span>
            </button>
          </div>
        </form>
      </div>

      {/* Theme Preference */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          backgroundColor: 'var(--card-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isDark ? <Moon size={16} color="var(--accent-purple)" /> : <Sun size={16} color="var(--accent-purple)" />}
            <span>Interface Theme Appearance</span>
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Switch between Obsidian Cosmic Dark (Default) and Lavender Radiant Light.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={isDark ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm"}
            style={{ gap: '6px' }}
          >
            <Moon size={14} />
            <span>Dark Theme</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('light')}
            className={isLight ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm"}
            style={{ gap: '6px' }}
          >
            <Sun size={14} />
            <span>Light Theme</span>
          </button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          backgroundColor: 'var(--card-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} color="var(--accent-purple)" />
            <span>In-App Order Journey Alerts</span>
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Receive instant bell notifications whenever manufacturing status advances.
          </p>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem', color: 'var(--text-primary)' }}>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={e => setNotificationsEnabled(e.target.checked)}
          />
          <span>Enabled</span>
        </label>
      </div>

      {/* Privacy & Security */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          backgroundColor: 'var(--card-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color="var(--accent-purple)" />
          <span>Security & Data Isolation</span>
        </h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Your orders, card IDs, and profile portfolio entries are protected with Row Level Security. Only you and authorized platform operators can view fulfillment logs.
        </p>
      </div>

      {/* Sign Out Card */}
      <div
        style={{
          padding: '20px',
          borderRadius: '16px',
          backgroundColor: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#EF4444' }}>
            Sign Out of Customer Dashboard
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Terminate active session on this device.
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="btn btn-outline btn-sm"
          style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#EF4444', gap: '6px' }}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
