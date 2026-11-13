/* ==========================================================================
   FLOCARDS ADMIN APPOINTMENTS & BOOKINGS MANAGER
   Enterprise booking management for admin dashboard:
   - Full schedule inspection across all profiles
   - Status transitions: Confirm / Approve, Cancel, Reschedule
   - Search by customer name, phone, email, reference code
   - Filter by status & profile
   - Double-booking prevention and audit logging
   ========================================================================== */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  User,
  Tag,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  X,
  CalendarCheck,
  CalendarX,
  ExternalLink
} from 'lucide-react';
import { StorageEngine } from '../../../lib/storage';
import { appointmentService } from '../../../lib/appointmentService';
import { useAuth } from '../../../context/AuthContext';
import DeleteConfirmNotification from '../../../components/dashboard/DeleteConfirmNotification';

export default function AdminAppointmentsManager() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [deleteConfirmApptId, setDeleteConfirmApptId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [profileFilter, setProfileFilter] = useState('ALL');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);

  const loadData = () => {
    setIsRefreshing(true);
    try {
      const allAppointments = StorageEngine.getAppointments();
      setAppointments(allAppointments);
      const allProfiles = StorageEngine.getProfiles();
      setProfiles(allProfiles);
    } catch (e) {
      console.error('Failed to load appointments:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 200);
    }
  };

  useEffect(() => {
    loadData();

    const handleStorageUpdate = (e) => {
      if (e.key === 'flocard_appointments' || e.type === 'flocard_appointment_updated') {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('flocard_appointment_updated', handleStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('flocard_appointment_updated', handleStorageUpdate);
    };
  }, []);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Status updates
  const handleStatusChange = async (appointmentId, newStatus) => {
    const updated = await appointmentService.updateStatus(appointmentId, newStatus, user);
    if (updated) {
      showNotification(`Appointment marked as ${newStatus}`);
      StorageEngine.addAuditLog(
        'Appointment',
        `Appointment ${updated.referenceCode} updated to ${newStatus}`,
        user?.name || 'Administrator',
        null,
        {
          action: 'appointment.status_update',
          entityId: appointmentId,
          afterValues: { status: newStatus }
        }
      );
      loadData();
    } else {
      showNotification('Failed to update status', 'error');
    }
  };

  // Delete
  const handleDelete = (appointmentId) => {
    setDeleteConfirmApptId(appointmentId);
  };

  const executeDelete = () => {
    if (!deleteConfirmApptId) return;
    StorageEngine.deleteAppointment(deleteConfirmApptId);
    showNotification('Appointment record deleted');
    setDeleteConfirmApptId(null);
    loadData();
  };

  // Reschedule
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleModal || !newDate || !newTime) return;

    const [hours, minutes] = newTime.split(':').map(Number);
    const endH = (hours + 1).toString().padStart(2, '0');
    const endM = (minutes || 0).toString().padStart(2, '0');
    const endTimeStr = `${endH}:${endM}`;

    // Update appointment
    const all = StorageEngine.getAppointments();
    const updated = all.map(a => {
      if (a.id === rescheduleModal.id) {
        return {
          ...a,
          date: newDate,
          time: newTime,
          startTime: newTime,
          endTime: endTimeStr,
          status: 'confirmed',
          rescheduledAt: new Date().toISOString()
        };
      }
      return a;
    });

    localStorage.setItem('flocard_appointments', JSON.stringify(updated));
    window.dispatchEvent(new Event('flocard_appointment_updated'));

    StorageEngine.addAuditLog(
      'Appointment',
      `Appointment ${rescheduleModal.referenceCode} rescheduled to ${newDate} at ${newTime}`,
      user?.name || 'Administrator',
      null,
      {
        action: 'appointment.reschedule',
        entityId: rescheduleModal.id,
        beforeValues: { date: rescheduleModal.date, time: rescheduleModal.time },
        afterValues: { date: newDate, time: newTime }
      }
    );

    showNotification(`Appointment rescheduled to ${newDate} at ${newTime}`);
    setRescheduleModal(null);
    loadData();
  };

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      if (statusFilter !== 'ALL' && (a.status || 'pending').toUpperCase() !== statusFilter) {
        return false;
      }
      if (profileFilter !== 'ALL' && a.profileSlug !== profileFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (a.customerName || '').toLowerCase().includes(q) ||
          (a.customerPhone || '').toLowerCase().includes(q) ||
          (a.customerEmail || '').toLowerCase().includes(q) ||
          (a.referenceCode || '').toLowerCase().includes(q) ||
          (a.serviceName || '').toLowerCase().includes(q) ||
          (a.profileSlug || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [appointments, statusFilter, profileFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter(a => a.status === 'pending').length;
    const confirmed = appointments.filter(a => a.status === 'confirmed').length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;
    return { total, pending, confirmed, cancelled };
  }, [appointments]);

  return (
    <div style={{ padding: '4px' }}>
      {/* Toast */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: notification.type === 'error' ? '#EF4444' : '#10B981',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.85rem',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header & Stats */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--adm-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalendarCheck size={24} color="#8B5CF6" />
              <span>Appointment Bookings</span>
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--adm-text-secondary)' }}>
              Inspect incoming customer appointments across all digital profiles, approve schedules, and manage cancellations.
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={isRefreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid var(--adm-card-border, #E2E8F0)',
              backgroundColor: 'var(--adm-card-bg, #FFFFFF)',
              color: 'var(--adm-text-primary, #0F172A)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* 4 Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div style={{ backgroundColor: 'var(--adm-card-bg, #FFFFFF)', border: '1px solid var(--adm-card-border, #E2E8F0)', borderRadius: '14px', padding: '16px 20px' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--adm-text-secondary, #64748B)', fontWeight: 600, textTransform: 'uppercase' }}>Total Bookings</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--adm-text-primary, #0F172A)', marginTop: '4px' }}>{stats.total}</div>
          </div>
          <div style={{ backgroundColor: 'var(--adm-card-bg, #FFFFFF)', border: '1px solid var(--adm-card-border, #E2E8F0)', borderRadius: '14px', padding: '16px 20px' }}>
            <div style={{ fontSize: '0.74rem', color: '#F59E0B', fontWeight: 600, textTransform: 'uppercase' }}>Pending Review</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>{stats.pending}</div>
          </div>
          <div style={{ backgroundColor: 'var(--adm-card-bg, #FFFFFF)', border: '1px solid var(--adm-card-border, #E2E8F0)', borderRadius: '14px', padding: '16px 20px' }}>
            <div style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 600, textTransform: 'uppercase' }}>Confirmed</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>{stats.confirmed}</div>
          </div>
          <div style={{ backgroundColor: 'var(--adm-card-bg, #FFFFFF)', border: '1px solid var(--adm-card-border, #E2E8F0)', borderRadius: '14px', padding: '16px 20px' }}>
            <div style={{ fontSize: '0.74rem', color: '#EF4444', fontWeight: 600, textTransform: 'uppercase' }}>Cancelled</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#EF4444', marginTop: '4px' }}>{stats.cancelled}</div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div
        style={{
          backgroundColor: 'var(--adm-card-bg, #FFFFFF)',
          border: '1px solid var(--adm-card-border, #E2E8F0)',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search by customer, phone, code, service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '8px',
              border: '1px solid var(--adm-card-border, #CBD5E1)',
              backgroundColor: 'var(--adm-bg, #F8FAFC)',
              color: 'var(--adm-text-primary, #0F172A)',
              fontSize: '0.84rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Status Pills */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--adm-bg, #F1F5F9)', padding: '3px', borderRadius: '8px' }}>
            {['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: statusFilter === st ? '#8B5CF6' : 'transparent',
                  color: statusFilter === st ? '#FFFFFF' : 'var(--adm-text-secondary, #64748B)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {st.toLowerCase()}
              </button>
            ))}
          </div>

          {/* Profile Filter Dropdown */}
          {profiles.length > 1 && (
            <select
              value={profileFilter}
              onChange={(e) => setProfileFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid var(--adm-card-border, #CBD5E1)',
                backgroundColor: 'var(--adm-card-bg, #FFFFFF)',
                color: 'var(--adm-text-primary, #0F172A)',
                fontSize: '0.8rem',
                fontWeight: 600,
                outline: 'none'
              }}
            >
              <option value="ALL">All Profiles</option>
              {profiles.map(p => (
                <option key={p.id} value={p.slug}>{p.name} ({p.slug})</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Appointments List / Table */}
      <div style={{ backgroundColor: 'var(--adm-card-bg, #FFFFFF)', border: '1px solid var(--adm-card-border, #E2E8F0)', borderRadius: '14px', overflow: 'hidden' }}>
        {filteredAppointments.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--adm-text-secondary, #64748B)' }}>
            <Calendar size={40} color="#CBD5E1" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--adm-text-primary, #0F172A)', marginBottom: '4px' }}>
              No Appointments Found
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem' }}>
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or status filter.'
                : 'Appointments booked by visitors through your digital profiles will appear here.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--adm-card-border, #E2E8F0)', backgroundColor: 'var(--adm-bg, #F8FAFC)', color: 'var(--adm-text-secondary, #64748B)', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Reference</th>
                  <th style={{ padding: '12px 16px' }}>Customer</th>
                  <th style={{ padding: '12px 16px' }}>Profile & Service</th>
                  <th style={{ padding: '12px 16px' }}>Date & Time</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appt) => {
                  const statusColors = {
                    pending: { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
                    confirmed: { bg: '#D1FAE5', text: '#059669', border: '#A7F3D0' },
                    cancelled: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
                    completed: { bg: '#EDE9FE', text: '#7C3AED', border: '#DDD6FE' }
                  };
                  const colors = statusColors[appt.status] || statusColors.pending;

                  return (
                    <tr key={appt.id} style={{ borderBottom: '1px solid var(--adm-card-border, #E2E8F0)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#8B5CF6', fontSize: '0.82rem' }}>
                          {appt.referenceCode}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--adm-text-secondary, #94A3B8)', marginTop: '2px' }}>
                          {new Date(appt.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--adm-text-primary, #0F172A)' }}>
                          {appt.customerName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--adm-text-secondary, #64748B)', marginTop: '2px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Phone size={11} /> {appt.customerPhone}
                          </span>
                          {appt.customerEmail && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Mail size={11} /> {appt.customerEmail}
                            </span>
                          )}
                        </div>
                        {appt.notes && (
                          <div style={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic', marginTop: '4px' }}>
                            &ldquo;{appt.notes}&rdquo;
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--adm-text-primary, #0F172A)' }}>
                          {appt.serviceName || 'Standard Consultation'}
                        </div>
                        <a
                          href={`/p/${appt.profileSlug}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '0.74rem',
                            color: '#8B5CF6',
                            textDecoration: 'none',
                            marginTop: '2px'
                          }}
                        >
                          <span>/p/{appt.profileSlug}</span>
                          <ExternalLink size={10} />
                        </a>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--adm-text-primary, #0F172A)' }}>
                          <Calendar size={13} color="#8B5CF6" />
                          <span>{appt.date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--adm-text-secondary, #64748B)', marginTop: '2px' }}>
                          <Clock size={12} />
                          <span>{appt.time || appt.startTime}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            backgroundColor: colors.bg,
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                            textTransform: 'capitalize'
                          }}
                        >
                          ● {appt.status || 'pending'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {appt.status !== 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(appt.id, 'confirmed')}
                              title="Approve / Confirm Appointment"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#10B981',
                                color: '#FFFFFF',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Check size={12} />
                              <span>Confirm</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setRescheduleModal(appt);
                              setNewDate(appt.date);
                              setNewTime(appt.time || appt.startTime);
                            }}
                            title="Reschedule Appointment"
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid var(--adm-card-border, #CBD5E1)',
                              backgroundColor: 'var(--adm-card-bg, #FFFFFF)',
                              color: 'var(--adm-text-primary, #0F172A)',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Calendar size={12} />
                            <span>Reschedule</span>
                          </button>
                          {appt.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(appt.id, 'cancelled')}
                              title="Cancel Appointment"
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #FECACA',
                                backgroundColor: '#FEF2F2',
                                color: '#EF4444',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                            >
                              <X size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(appt.id)}
                            title="Delete Record"
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: '#94A3B8',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--adm-card-bg, #FFFFFF)',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--adm-text-primary, #0F172A)' }}>
                Reschedule Booking
              </h3>
              <button
                type="button"
                onClick={() => setRescheduleModal(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--adm-text-secondary, #64748B)' }}>
              Change the scheduled date and time for <strong>{rescheduleModal.customerName}</strong> ({rescheduleModal.referenceCode}).
            </p>

            <form onSubmit={handleRescheduleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--adm-text-primary, #0F172A)', marginBottom: '6px' }}>
                  New Date
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--adm-card-border, #CBD5E1)',
                    backgroundColor: 'var(--adm-bg, #F8FAFC)',
                    color: 'var(--adm-text-primary, #0F172A)',
                    fontSize: '0.84rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--adm-text-primary, #0F172A)', marginBottom: '6px' }}>
                  New Time Slot
                </label>
                <input
                  type="time"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--adm-card-border, #CBD5E1)',
                    backgroundColor: 'var(--adm-bg, #F8FAFC)',
                    color: 'var(--adm-text-primary, #0F172A)',
                    fontSize: '0.84rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRescheduleModal(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--adm-card-border, #CBD5E1)',
                    backgroundColor: 'transparent',
                    color: 'var(--adm-text-primary, #0F172A)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#8B5CF6',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Save Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apple-Style In-App Delete Confirmation Notification with OK Button */}
      <DeleteConfirmNotification
        isOpen={Boolean(deleteConfirmApptId)}
        title="Delete Appointment"
        itemName={`Booking #${deleteConfirmApptId}`}
        message="Are you sure you want to delete this appointment booking record?"
        onConfirm={executeDelete}
        onCancel={() => setDeleteConfirmApptId(null)}
        confirmLabel="OK"
      />
    </div>
  );
}
