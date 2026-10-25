/* ==========================================================================
   FLOCARDS OWNER-ONLY LIVE ADMIN ACTIVITY FEED
   Exclusively restricted to the verified platform owner.
   Real-time event stream, multi-factor filtering, expandable diffs & export.
   ========================================================================== */

import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Clock,
  Layers,
  FileJson,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { StorageEngine } from '../../../lib/storage';
import { useAuth } from '../../../context/AuthContext';

export default function OwnerActivityFeed() {
  const { user, isOwner } = useAuth();
  const [logs, setLogs] = useState(() => StorageEngine.getAuditLogs(user));
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [expandedEvents, setExpandedEvents] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newEventCount, setNewEventCount] = useState(0);

  // Poll / refresh audit logs
  const refreshLogs = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const fresh = StorageEngine.getAuditLogs(user);
      setLogs(fresh);
      setNewEventCount(0);
      setIsRefreshing(false);
    }, 300);
  };

  useEffect(() => {
    // Listen for storage changes across tabs
    const handleStorage = (e) => {
      if (e.key === 'flocard_audit_logs') {
        const fresh = StorageEngine.getAuditLogs(user);
        if (fresh.length > logs.length) {
          setNewEventCount(fresh.length - logs.length);
        }
        setLogs(fresh);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [user, logs.length]);

  // Strict owner enforcement
  if (!isOwner) {
    return (
      <div
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          backgroundColor: '#130B21',
          borderRadius: '16px',
          border: '1px solid #EF444433',
          maxWidth: '680px',
          margin: '40px auto'
        }}
      >
        <ShieldAlert size={48} color="#EF4444" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
          Access Restricted: Platform Owner Only
        </h3>
        <p style={{ color: '#B8AEC8', fontSize: '0.9rem', marginTop: '8px', lineHeight: 1.5 }}>
          The Live Platform Activity Feed and system audit ledger are restricted exclusively to the verified Owner.
          Staff members are prohibited from inspecting administrative activity records.
        </p>
      </div>
    );
  }

  // Multi-factor filtering
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = (
          (log.description || '') +
          ' ' +
          (log.details || '') +
          ' ' +
          (log.actorName || '') +
          ' ' +
          (log.actorEmail || '') +
          ' ' +
          (log.entityId || '') +
          ' ' +
          (log.action || '') +
          ' ' +
          (log.correlationId || '')
        ).toLowerCase();
        if (!matchText.includes(q)) return false;
      }

      // Entity
      if (entityFilter !== 'ALL') {
        const ent = (log.entityType || log.type || '').toUpperCase();
        if (ent !== entityFilter.toUpperCase()) return false;
      }

      // Role
      if (roleFilter !== 'ALL') {
        if ((log.actorRole || '').toLowerCase() !== roleFilter.toLowerCase()) return false;
      }

      // Severity / Status
      if (severityFilter !== 'ALL') {
        if (severityFilter === 'SUCCESS' && log.status !== 'success') return false;
        if (severityFilter === 'FAILURE' && log.status !== 'failure') return false;
        if (severityFilter === 'CRITICAL' && log.severity !== 'critical') return false;
        if (severityFilter === 'WARNING' && log.severity !== 'warning') return false;
      }

      // Date Range
      if (dateFilter !== 'ALL') {
        const eventTime = new Date(log.timestamp || 0).getTime();
        const now = Date.now();
        if (dateFilter === 'TODAY' && now - eventTime > 86400000) return false;
        if (dateFilter === '7DAYS' && now - eventTime > 7 * 86400000) return false;
        if (dateFilter === '30DAYS' && now - eventTime > 30 * 86400000) return false;
      }

      return true;
    });
  }, [logs, searchQuery, entityFilter, roleFilter, severityFilter, dateFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const toggleExpand = (id) => {
    setExpandedEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Export to CSV
  const exportCSV = () => {
    const headers = ['Event ID', 'Timestamp (UTC)', 'Actor Name', 'Actor Email', 'Actor Role', 'Action', 'Entity Type', 'Entity ID', 'Status', 'Severity', 'Description', 'Correlation ID'];
    const rows = filteredLogs.map((l) => [
      `"${l.id || ''}"`,
      `"${l.timestamp || ''}"`,
      `"${(l.actorName || l.userName || '').replace(/"/g, '""')}"`,
      `"${(l.actorEmail || '').replace(/"/g, '""')}"`,
      `"${l.actorRole || ''}"`,
      `"${l.action || ''}"`,
      `"${l.entityType || l.type || ''}"`,
      `"${l.entityId || ''}"`,
      `"${l.status || 'success'}"`,
      `"${l.severity || 'info'}"`,
      `"${(l.description || l.details || '').replace(/"/g, '""')}"`,
      `"${l.correlationId || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `flocards-audit-feed-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `flocards-audit-feed-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Stats calculation
  const stats = useMemo(() => {
    let success = 0;
    let failure = 0;
    let critical = 0;
    logs.forEach((l) => {
      if (l.status === 'failure') failure++;
      else success++;
      if (l.severity === 'critical') critical++;
    });
    return { total: logs.length, success, failure, critical };
  }, [logs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Stats */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(27, 16, 44, 0.95) 0%, rgba(13, 8, 22, 0.98) 100%)',
          border: '1px solid #6B00FF35',
          borderRadius: '18px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #6B00FF 0%, #A855F7 100%)',
                  color: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                <ShieldCheck size={13} />
                Owner Privileged
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                Live Platform Activity Feed
              </h2>
            </div>
            <p style={{ color: '#A59BB6', fontSize: '0.86rem', marginTop: '6px', marginBottom: 0 }}>
              Immutable real-time audit trail of operational milestones, security logins, NFC allocations, and staff permissions.
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {newEventCount > 0 && (
              <button
                type="button"
                onClick={refreshLogs}
                style={{
                  background: '#6B00FF',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  animation: 'pulse 1.8s infinite'
                }}
              >
                <span>{newEventCount} New Events</span>
              </button>
            )}

            <button
              type="button"
              onClick={refreshLogs}
              title="Refresh Activity Log"
              style={{
                background: '#1F1530',
                border: '1px solid #3E2963',
                color: '#C4B9D8',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={15} className={isRefreshing ? 'spin-animation' : ''} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={exportCSV}
              style={{
                background: '#1F1530',
                border: '1px solid #3E2963',
                color: '#C4B9D8',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FileSpreadsheet size={15} color="#10B981" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={exportJSON}
              style={{
                background: '#1F1530',
                border: '1px solid #3E2963',
                color: '#C4B9D8',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FileJson size={15} color="#A855F7" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Metric Badges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            marginTop: '20px'
          }}
        >
          <div style={{ background: '#170E26', border: '1px solid #2F1E4C', borderRadius: '12px', padding: '12px 16px' }}>
            <span style={{ fontSize: '0.74rem', color: '#9387A6', textTransform: 'uppercase', fontWeight: 600 }}>Total Records</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>{stats.total}</div>
          </div>
          <div style={{ background: '#170E26', border: '1px solid #2F1E4C', borderRadius: '12px', padding: '12px 16px' }}>
            <span style={{ fontSize: '0.74rem', color: '#10B981', textTransform: 'uppercase', fontWeight: 600 }}>Successful Operations</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#10B981', marginTop: '2px' }}>{stats.success}</div>
          </div>
          <div style={{ background: '#170E26', border: '1px solid #2F1E4C', borderRadius: '12px', padding: '12px 16px' }}>
            <span style={{ fontSize: '0.74rem', color: '#F59E0B', textTransform: 'uppercase', fontWeight: 600 }}>Security Warnings</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#F59E0B', marginTop: '2px' }}>{stats.critical}</div>
          </div>
          <div style={{ background: '#170E26', border: '1px solid #2F1E4C', borderRadius: '12px', padding: '12px 16px' }}>
            <span style={{ fontSize: '0.74rem', color: '#EF4444', textTransform: 'uppercase', fontWeight: 600 }}>Failed Attempts</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#EF4444', marginTop: '2px' }}>{stats.failure}</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        style={{
          background: '#130B22',
          border: '1px solid #291A42',
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div
            style={{
              flex: '1 1 240px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#0B0515',
              border: '1px solid #362254',
              borderRadius: '10px',
              padding: '0 14px'
            }}
          >
            <Search size={16} color="#7D6F92" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by actor, entity ID, action, description, or correlation ID..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                padding: '10px 0'
              }}
            />
          </div>

          {/* Entity Type Filter */}
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              background: '#0B0515',
              border: '1px solid #362254',
              color: '#FFFFFF',
              borderRadius: '10px',
              padding: '9px 12px',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Entities</option>
            <option value="ORDER">Orders</option>
            <option value="CARD">NFC Cards</option>
            <option value="DESIGN">Designs & Artwork</option>
            <option value="CUSTOMER">Customers</option>
            <option value="STAFF">Staff & Permissions</option>
            <option value="PAYMENT">Finance & Payments</option>
            <option value="SMART QR">Smart QR</option>
            <option value="AUTH">Authentication</option>
            <option value="SYSTEM">System Settings</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              background: '#0B0515',
              border: '1px solid #362254',
              color: '#FFFFFF',
              borderRadius: '10px',
              padding: '9px 12px',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Roles</option>
            <option value="owner">Owner</option>
            <option value="sales">Sales</option>
            <option value="designer">Designer</option>
            <option value="production">Production</option>
            <option value="accounts">Accounts</option>
            <option value="system">System / Gateway</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              background: '#0B0515',
              border: '1px solid #362254',
              color: '#FFFFFF',
              borderRadius: '10px',
              padding: '9px 12px',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Severity / Status</option>
            <option value="SUCCESS">Success Only</option>
            <option value="FAILURE">Failures Only</option>
            <option value="CRITICAL">Critical Security</option>
            <option value="WARNING">Warnings</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              background: '#0B0515',
              border: '1px solid #362254',
              color: '#FFFFFF',
              borderRadius: '10px',
              padding: '9px 12px',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Last 24 Hours</option>
            <option value="7DAYS">Last 7 Days</option>
            <option value="30DAYS">Last 30 Days</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#9387A6' }}>
          <span>Showing {paginatedLogs.length} of {filteredLogs.length} matching events</span>
          {(searchQuery || entityFilter !== 'ALL' || roleFilter !== 'ALL' || severityFilter !== 'ALL' || dateFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setEntityFilter('ALL');
                setRoleFilter('ALL');
                setSeverityFilter('ALL');
                setDateFilter('ALL');
                setCurrentPage(1);
              }}
              style={{ background: 'none', border: 'none', color: '#A855F7', cursor: 'pointer', fontWeight: 600, padding: 0 }}
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Activity Timeline List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {paginatedLogs.length === 0 ? (
          <div
            style={{
              background: '#130B22',
              border: '1px solid #291A42',
              borderRadius: '14px',
              padding: '48px 24px',
              textAlign: 'center'
            }}
          >
            <Clock size={36} color="#6B5985" style={{ marginBottom: '12px' }} />
            <div style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '1rem' }}>No activity records found</div>
            <p style={{ color: '#8F82A4', fontSize: '0.84rem', marginTop: '4px' }}>
              Try adjusting your search terms or filter selections.
            </p>
          </div>
        ) : (
          paginatedLogs.map((log) => {
            const isExpanded = Boolean(expandedEvents[log.id]);
            const isFailed = log.status === 'failure';
            const isCritical = log.severity === 'critical';
            const isWarning = log.severity === 'warning';

            // Role badge colors
            const roleBadgeBg = {
              owner: '#6B00FF25',
              sales: '#2563EB25',
              designer: '#EC489925',
              production: '#F59E0B25',
              accounts: '#10B98125',
              system: '#4B556325'
            }[log.actorRole] || '#6B00FF20';

            const roleBadgeColor = {
              owner: '#C084FC',
              sales: '#60A5FA',
              designer: '#F472B6',
              production: '#FBBF24',
              accounts: '#34D399',
              system: '#9CA3AF'
            }[log.actorRole] || '#C084FC';

            const dateObj = new Date(log.timestamp);
            const localFormatted = isNaN(dateObj.getTime())
              ? log.timestamp
              : dateObj.toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                });

            return (
              <div
                key={log.id}
                style={{
                  background: isCritical
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(19, 11, 34, 0.95) 100%)'
                    : '#130B22',
                  border: isCritical
                    ? '1px solid #EF444455'
                    : isWarning
                    ? '1px solid #F59E0B44'
                    : '1px solid #271940',
                  borderRadius: '14px',
                  padding: '16px 18px',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Status Icon */}
                    {isFailed ? (
                      <XCircle size={18} color="#EF4444" />
                    ) : isCritical ? (
                      <AlertTriangle size={18} color="#EF4444" />
                    ) : isWarning ? (
                      <AlertTriangle size={18} color="#F59E0B" />
                    ) : (
                      <CheckCircle2 size={18} color="#10B981" />
                    )}

                    {/* Action & Entity */}
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: '#24143D',
                        color: '#C4B5FD',
                        border: '1px solid #3F2369'
                      }}
                    >
                      {log.entityType || log.type || 'SYSTEM'}
                    </span>

                    <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#9387A6' }}>
                      {log.action}
                    </span>

                    {log.entityId && (
                      <span
                        style={{
                          fontSize: '0.74rem',
                          background: '#1A0E2E',
                          color: '#E9D5FF',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid #4C1D95'
                        }}
                      >
                        #{log.entityId}
                      </span>
                    )}
                  </div>

                  {/* Timestamp & Actor */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#FFFFFF' }}>
                        {log.actorName || log.userName || 'FLOCARDS Administrator'}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          background: roleBadgeBg,
                          color: roleBadgeColor,
                          textTransform: 'uppercase'
                        }}
                      >
                        {log.actorRole || 'OWNER'}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.78rem', color: '#887B9E' }}>
                      {localFormatted}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleExpand(log.id)}
                      style={{
                        background: '#1D1331',
                        border: '1px solid #36245A',
                        color: '#B8AEC8',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.74rem',
                        fontWeight: 600
                      }}
                    >
                      <span>{isExpanded ? 'Less' : 'Diff'}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#EDE8F5', fontWeight: 500 }}>
                  {log.description || log.details}
                </div>

                {/* Correlation ID & Actor Email */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '0.74rem', color: '#7E7194' }}>
                  {log.actorEmail && <span>Actor: {log.actorEmail}</span>}
                  {log.correlationId && <span>Req ID: <code style={{ color: '#A855F7' }}>{log.correlationId}</code></span>}
                  <span>UTC: {log.timestamp}</span>
                </div>

                {/* Expandable Before/After Diff Block */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '14px',
                      padding: '14px',
                      background: '#090412',
                      border: '1px solid #2D1A4A',
                      borderRadius: '10px',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                      {/* Before State */}
                      <div style={{ background: '#120721', border: '1px solid #2B1647', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#EF4444', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
                          Previous Value (Before)
                        </div>
                        {log.beforeValues ? (
                          <pre style={{ margin: 0, color: '#FCA5A5', fontFamily: 'monospace', fontSize: '0.76rem', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(log.beforeValues, null, 2)}
                          </pre>
                        ) : (
                          <span style={{ color: '#7E7194', fontStyle: 'italic' }}>None (New Resource Created / Entry Event)</span>
                        )}
                      </div>

                      {/* After State */}
                      <div style={{ background: '#0F1A1B', border: '1px solid #134E4A', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#10B981', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                          Committed Value (After)
                        </div>
                        {log.afterValues ? (
                          <pre style={{ margin: 0, color: '#6EE7B7', fontFamily: 'monospace', fontSize: '0.76rem', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(log.afterValues, null, 2)}
                          </pre>
                        ) : (
                          <span style={{ color: '#7E7194', fontStyle: 'italic' }}>None (Resource Purged)</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              background: '#130B22',
              border: '1px solid #291A42',
              color: currentPage === 1 ? '#5A4E6E' : '#FFFFFF',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>

          <span style={{ fontSize: '0.82rem', color: '#9387A6', padding: '0 8px' }}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              background: '#130B22',
              border: '1px solid #291A42',
              color: currentPage === totalPages ? '#5A4E6E' : '#FFFFFF',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
