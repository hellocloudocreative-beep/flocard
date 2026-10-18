/* ==========================================================================
   FLOCARD CUSTOMER DASHBOARD — ANALYTICS TAB
   Privacy-conscious engagement analytics calculated strictly from real events.
   Displays verified NFC taps, QR scans, profile views, and vCard downloads.
   No fake numbers, fabricated charts, or simulated percentages.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import {
  Eye,
  Radio,
  QrCode,
  Download,
  Share2,
  Calendar,
  Clock,
  ShieldCheck,
  BarChart2,
  AlertCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function CustomerAnalyticsTab({ customer, cards = [], profiles = [] }) {
  const { getRealAnalytics } = useData();
  const [stats, setStats] = useState({
    totalViews: 0,
    totalTaps: 0,
    totalScans: 0,
    totalDownloads: 0,
    totalShares: 0,
    recentEvents: []
  });

  useEffect(() => {
    if (customer && getRealAnalytics) {
      const data = getRealAnalytics(customer);
      setStats(data);
    }
  }, [customer]);

  const hasEvents = stats.totalViews > 0 || stats.totalTaps > 0 || stats.totalScans > 0 || stats.totalDownloads > 0 || stats.totalShares > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--text-primary)', fontWeight: 800 }}>
          Card Engagement Analytics
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          Real verified metrics from NFC card taps, QR scans, and digital profile engagements.
        </p>
      </div>

      {/* Real Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}
      >
        {/* Metric 1: NFC Taps */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'var(--card-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Verified NFC Taps</span>
            <Radio size={16} color="var(--primary-purple)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-purple)', fontFamily: 'var(--font-display)' }}>
            {stats.totalTaps}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Direct Contactless Transmission
          </div>
        </div>

        {/* Metric 2: QR Scans */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'var(--card-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Dynamic QR Scans</span>
            <QrCode size={16} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-purple)', fontFamily: 'var(--font-display)' }}>
            {stats.totalScans}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Camera Optical Scans
          </div>
        </div>

        {/* Metric 3: Profile Page Views */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'var(--card-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Profile Visits</span>
            <Eye size={16} color="#3B82F6" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3B82F6', fontFamily: 'var(--font-display)' }}>
            {stats.totalViews}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Digital Portfolio Views
          </div>
        </div>

        {/* Metric 4: vCard Downloads */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'var(--card-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>vCard Contacts Saved</span>
            <Download size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-display)' }}>
            {stats.totalDownloads}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Saved to Address Books
          </div>
        </div>

        {/* Metric 5: Share Clicks */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'var(--card-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Share Interactions</span>
            <Share2 size={16} color="#EC4899" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#EC4899', fontFamily: 'var(--font-display)' }}>
            {stats.totalShares}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Profile Shares
          </div>
        </div>
      </div>

      {/* Events Table or Honest Empty State */}
      <div
        className="glass-panel"
        style={{
          padding: '28px',
          backgroundColor: 'var(--card-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              Recent Engagement Activity
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Chronological log of genuine contactless taps, scans, and address book downloads.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#10B981', fontWeight: 600 }}>
            <ShieldCheck size={14} />
            <span>Privacy Compliant (No PII Logged)</span>
          </div>
        </div>

        {!hasEvents ? (
          <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <BarChart2 size={36} color="var(--border-color)" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '0.95rem' }}>
              No analytics events recorded yet.
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
              Once contacts tap your NFC card or scan your QR code at meetings and events, your genuine engagement statistics will appear here in real time.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>Event Type</th>
                  <th style={{ padding: '10px 12px' }}>Identifier / Target</th>
                  <th style={{ padding: '10px 12px' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEvents.map((evt) => (
                  <tr key={evt.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          backgroundColor:
                            evt.eventType === 'nfc_tap' ? 'rgba(107, 0, 255, 0.15)' :
                            evt.eventType === 'qr_scan' ? 'rgba(168, 85, 247, 0.15)' :
                            evt.eventType === 'vcard_download' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color:
                            evt.eventType === 'nfc_tap' ? 'var(--primary-purple)' :
                            evt.eventType === 'qr_scan' ? 'var(--accent-purple)' :
                            evt.eventType === 'vcard_download' ? '#10B981' : '#3B82F6',
                          textTransform: 'capitalize'
                        }}
                      >
                        {evt.eventType?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      {evt.cardCode || `@${evt.profileSlug}` || 'General Profile'}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(evt.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
