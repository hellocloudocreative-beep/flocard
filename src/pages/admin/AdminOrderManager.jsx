/* ==========================================================================
   FLOCARD ADMIN ORDER MANAGEMENT & CONTROLLED STATUS UPDATES
   Supports full fulfillment lifecycle stages (Design Submitted to Delivered + Exceptions),
   public update messages, private internal notes, real carrier tracking, and immutable audit history.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Filter,
  Sliders,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  Lock,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Calendar,
  X,
  Radio,
  FileText,
  Check,
  Send,
  Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { ORDER_STAGES, EXCEPTION_STAGES, getOrderStageInfo, normalizeOrderStatus } from '../../lib/storage';
import { EDITIONS } from '../../lib/constants';

export default function AdminOrderManager({ initialOrderId = null }) {
  const { user } = useAuth();
  const themeContext = useTheme();
  const isLight = themeContext ? themeContext.isLight : true;
  const isDark = themeContext ? themeContext.isDark : false;

  const cardBg = isLight ? '#FFFFFF' : '#100B19';
  const cardBorder = isLight ? '#E8E3EF' : '#2A1D3B';
  const elevatedBg = isLight ? '#F7F6FA' : '#171022';
  const textPrimary = isLight ? '#191522' : '#FFFFFF';
  const textSecondary = isLight ? '#777184' : '#B8AEC8';
  const textMuted = isLight ? '#9CA3AF' : '#7C728E';
  const {
    orders = [],
    updateOrderStatus,
    getOrderHistory,
    getOrderInternalNotes,
    addOrderInternalNote
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Status update form states
  const [targetStatus, setTargetStatus] = useState('');
  const [publicMessage, setPublicMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [estimatedDeliveryAt, setEstimatedDeliveryAt] = useState('');

  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      o.id?.toLowerCase().includes(q) ||
      o.orderReference?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.customerEmail?.toLowerCase().includes(q) ||
      o.company?.toLowerCase().includes(q);

    const normStatus = normalizeOrderStatus(o.status);
    const matchesStatus = statusFilter === 'all' || normStatus === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const handleOpenUpdateModal = (order) => {
    const currentNorm = normalizeOrderStatus(order.status);
    setSelectedOrder(order);
    setTargetStatus(currentNorm);
    setPublicMessage('');
    setInternalNote('');
    setCarrierName(order.carrierName || '');
    setTrackingNumber(order.trackingNumber || '');
    setTrackingUrl(order.trackingUrl || '');
    setEstimatedDeliveryAt(order.estimatedDeliveryAt ? order.estimatedDeliveryAt.split('T')[0] : '');
    setActionError('');
    setActionSuccess('');
    setIsUpdateModalOpen(true);
  };

  useEffect(() => {
    if (initialOrderId && orders.length > 0) {
      const match = orders.find(
        (o) => o.id === initialOrderId || o.orderReference === initialOrderId
      );
      if (match) {
        handleOpenUpdateModal(match);
      }
    }
  }, [initialOrderId, orders]);

  const handleStatusChangePrecheck = (e) => {
    e.preventDefault();
    setActionError('');

    if (!targetStatus) {
      setActionError('Please select a valid target status.');
      return;
    }

    // If changing to delivered or cancelled, prompt confirmation
    if (targetStatus === 'delivered' || targetStatus === 'cancelled') {
      setConfirmDialog({
        title: targetStatus === 'delivered' ? 'Confirm Order Delivery' : 'Confirm Order Cancellation',
        message: targetStatus === 'delivered'
          ? `Marking order ${selectedOrder.orderReference || selectedOrder.id} as Delivered will finalize the order and automatically activate the customer's live NFC card and digital profile. Proceed?`
          : `Cancelling order ${selectedOrder.orderReference || selectedOrder.id} will stop manufacturing operations. Proceed?`,
        action: executeStatusUpdate
      });
      return;
    }

    executeStatusUpdate();
  };

  const executeStatusUpdate = () => {
    setIsSubmitting(true);
    setActionError('');
    setConfirmDialog(null);

    try {
      updateOrderStatus({
        orderId: selectedOrder.id,
        newStatus: targetStatus,
        publicMessage: publicMessage.trim(),
        internalNote: internalNote.trim(),
        carrierName: carrierName.trim() || null,
        trackingNumber: trackingNumber.trim() || null,
        trackingUrl: trackingUrl.trim() || null,
        estimatedDeliveryAt: estimatedDeliveryAt ? new Date(estimatedDeliveryAt).toISOString() : null,
        actorUser: user
      });

      setActionSuccess(`Order status successfully updated to "${getOrderStageInfo(targetStatus).label}".`);
      setTimeout(() => {
        setIsUpdateModalOpen(false);
        setActionSuccess('');
      }, 1200);
    } catch (err) {
      setActionError(err.message || 'Failed to update order status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Metrics Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
          gap: '14px'
        }}
      >
        <div style={{ backgroundColor: cardBg, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
          <div style={{ fontSize: '0.78rem', color: textSecondary, fontWeight: 500 }}>Total Orders</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: textPrimary, marginTop: '4px', fontFamily: 'var(--font-heading, Sora)' }}>{orders.length}</div>
        </div>

        <div style={{ backgroundColor: cardBg, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
          <div style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 500 }}>In Production</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706', marginTop: '4px', fontFamily: 'var(--font-heading, Sora)' }}>
            {orders.filter(o => ['design_submitted', 'artwork_approved', 'manufacturing_started', 'quality_inspection'].includes(normalizeOrderStatus(o.status))).length}
          </div>
        </div>

        <div style={{ backgroundColor: cardBg, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
          <div style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: 500 }}>Dispatched</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563EB', marginTop: '4px', fontFamily: 'var(--font-heading, Sora)' }}>
            {orders.filter(o => normalizeOrderStatus(o.status) === 'dispatched').length}
          </div>
        </div>

        <div style={{ backgroundColor: cardBg, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
          <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 500 }}>Delivered & Live</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginTop: '4px', fontFamily: 'var(--font-heading, Sora)' }}>
            {orders.filter(o => normalizeOrderStatus(o.status) === 'delivered').length}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div
        style={{
          padding: '24px',
          backgroundColor: cardBg,
          borderRadius: '16px',
          border: `1px solid ${cardBorder}`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
        }}
      >
        {/* Controls: Search & Status Filter Chips */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: textSecondary }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search reference, customer, email..."
              style={{
                width: '100%',
                paddingLeft: '34px',
                paddingRight: '12px',
                paddingTop: '8px',
                paddingBottom: '8px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                border: `1px solid ${cardBorder}`,
                backgroundColor: elevatedBg,
                color: textPrimary,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Status Filter Chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['all', 'design_submitted', 'artwork_approved', 'manufacturing_started', 'quality_inspection', 'dispatched', 'delivered'].map((st) => {
              const isActive = statusFilter === st;
              const count = st === 'all' ? orders.length : orders.filter(o => normalizeOrderStatus(o.status) === st).length;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: isActive ? '1px solid #6B00FF' : `1px solid ${cardBorder}`,
                    backgroundColor: isActive ? '#6B00FF' : elevatedBg,
                    color: isActive ? '#FFFFFF' : textSecondary,
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    boxShadow: isActive ? '0 2px 8px rgba(107, 0, 255, 0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {st === 'all' ? `All (${count})` : `${getOrderStageInfo(st).label} (${count})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${cardBorder}`, color: textSecondary, fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>
                <th style={{ padding: '12px 14px' }}>Order Reference</th>
                <th style={{ padding: '12px 14px' }}>Customer & Company</th>
                <th style={{ padding: '12px 14px' }}>Card Edition</th>
                <th style={{ padding: '12px 14px' }}>Fulfillment Stage</th>
                <th style={{ padding: '12px 14px' }}>Carrier / Tracking</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: textSecondary }}>
                    <Package size={36} color={cardBorder} style={{ margin: '0 auto 10px', display: 'block' }} />
                    <div style={{ fontWeight: 600, color: textPrimary, marginBottom: '4px' }}>
                      {orders.length === 0 ? 'No manufacturing orders in queue' : 'No orders matching filter'}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: textMuted }}>
                      {orders.length === 0 ? 'Approved designs from the Card Designs queue will appear here as real production orders.' : 'Try adjusting your search query or status filter.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const normStatus = normalizeOrderStatus(order.status);
                  const stageInfo = getOrderStageInfo(normStatus);
                  const isDelivered = normStatus === 'delivered';
                  const isException = EXCEPTION_STAGES.some(s => s.key === normStatus);
                  const ed = EDITIONS[order.edition] || EDITIONS.purple;

                  return (
                    <tr key={order.id} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                      {/* Order Reference */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#6B00FF' }}>
                          {order.orderReference || order.id}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: textMuted, marginTop: '2px' }}>
                          {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: textPrimary }}>{order.customerName}</div>
                        <div style={{ fontSize: '0.74rem', color: textSecondary }}>{order.customerEmail}</div>
                        {order.company && <div style={{ fontSize: '0.7rem', color: '#6B00FF', fontWeight: 600 }}>{order.company}</div>}
                      </td>

                      {/* Card Edition */}
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            backgroundColor: `${ed.accentColor}18`,
                            color: ed.accentColor,
                            border: `1px solid ${ed.accentColor}33`,
                            textTransform: 'capitalize'
                          }}
                        >
                          {ed.name}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: textMuted, marginTop: '4px' }}>
                          {order.templateType === 'customer_logo' ? 'With Customer Logo' : 'Standard Format'}
                        </div>
                      </td>

                      {/* Fulfillment Stage */}
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            backgroundColor: isDelivered ? (isLight ? '#ECFDF5' : 'rgba(16, 185, 129, 0.15)') : isException ? (isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.15)') : (isLight ? '#F3EEFF' : 'rgba(107, 0, 255, 0.15)'),
                            color: isDelivered ? '#059669' : isException ? '#DC2626' : '#6B00FF',
                            border: `1px solid ${isDelivered ? (isLight ? '#A7F3D0' : 'rgba(16, 185, 129, 0.3)') : isException ? (isLight ? '#FECACA' : 'rgba(239, 68, 68, 0.3)') : (isLight ? '#DDD6FE' : 'rgba(107, 0, 255, 0.3)')}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          ● {stageInfo.label}
                        </span>
                      </td>

                      {/* Carrier / Tracking */}
                      <td style={{ padding: '12px 14px' }}>
                        {order.trackingNumber ? (
                          <div>
                            <div style={{ fontSize: '0.76rem', color: '#2563EB', fontWeight: 600 }}>
                              {order.trackingNumber}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: textMuted }}>
                              {order.carrierName || 'Courier'}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: textMuted, fontStyle: 'italic' }}>
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenUpdateModal(order)}
                            className="btn btn-primary btn-xs"
                            style={{ gap: '4px' }}
                          >
                            <Sliders size={12} />
                            <span>Update Status</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONTROLLED STATUS UPDATE MODAL */}
      {isUpdateModalOpen && selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              maxWidth: '620px',
              width: '100%',
              backgroundColor: cardBg,
              borderRadius: '20px',
              border: `1px solid ${cardBorder}`,
              padding: '28px',
              boxShadow: isLight ? '0 20px 45px rgba(76, 29, 149, 0.12)' : '0 20px 50px rgba(0, 0, 0, 0.6)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: textPrimary, fontWeight: 700 }}>
                  Update Order Journey: {selectedOrder.orderReference || selectedOrder.id}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: textSecondary }}>
                  Customer: <strong>{selectedOrder.customerName}</strong> ({selectedOrder.customerEmail})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: textMuted, cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStatusChangePrecheck} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Select Stage */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: textSecondary, display: 'block', marginBottom: '6px' }}>
                  Fulfillment Stage
                </label>
                <select
                  value={targetStatus}
                  onChange={e => setTargetStatus(e.target.value)}
                  style={{ width: '100%', fontSize: '0.86rem', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${cardBorder}`, backgroundColor: elevatedBg, color: textPrimary }}
                >
                  <optgroup label="Standard Sequential Pipeline">
                    {ORDER_STAGES.map(s => (
                      <option key={s.key} value={s.key}>
                        Step {s.step}: {s.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Exception & Correction States">
                    {EXCEPTION_STAGES.map(s => (
                      <option key={s.key} value={s.key}>
                        ⚠️ {s.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Customer-Facing Public Update Message */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: textSecondary, display: 'block', marginBottom: '6px' }}>
                  Customer-Facing Update Message (Visible in customer timeline & in-app notification)
                </label>
                <textarea
                  rows={2}
                  value={publicMessage}
                  onChange={e => setPublicMessage(e.target.value)}
                  placeholder="Optional custom message explaining this stage to the client..."
                  style={{ width: '100%', fontSize: '0.82rem', resize: 'vertical', borderRadius: '8px', border: `1px solid ${cardBorder}`, backgroundColor: elevatedBg, color: textPrimary, padding: '10px 12px' }}
                />
              </div>

              {/* Private Administrative Internal Note (Protected - Never Exposed to Customers) */}
              <div style={{ backgroundColor: isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.05)', padding: '14px', borderRadius: '10px', border: `1px solid ${isLight ? '#FECACA' : 'rgba(239, 68, 68, 0.2)'}` }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#EF4444', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Lock size={13} />
                  <span>Private Internal Administrative Note (ADMIN ONLY — Never sent to customer)</span>
                </label>
                <textarea
                  rows={2}
                  value={internalNote}
                  onChange={e => setInternalNote(e.target.value)}
                  placeholder="e.g. Quality inspection passed on batch #882. Courier waybill printed."
                  style={{ width: '100%', fontSize: '0.82rem', resize: 'vertical', backgroundColor: cardBg, borderRadius: '8px', border: `1px solid ${cardBorder}`, color: textPrimary, padding: '8px 10px' }}
                />
              </div>

              {/* Carrier Tracking Information */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: textSecondary, display: 'block', marginBottom: '4px' }}>
                    Courier / Carrier Name
                  </label>
                  <input
                    type="text"
                    value={carrierName}
                    onChange={e => setCarrierName(e.target.value)}
                    placeholder="e.g. BlueDart / DHL / FedEx"
                    style={{ width: '100%', fontSize: '0.82rem', borderRadius: '8px', border: `1px solid ${cardBorder}`, backgroundColor: elevatedBg, color: textPrimary, padding: '8px 12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: textSecondary, display: 'block', marginBottom: '4px' }}>
                    Tracking / Waybill Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    placeholder="e.g. BD98712345"
                    style={{ width: '100%', fontSize: '0.82rem', borderRadius: '8px', border: `1px solid ${cardBorder}`, backgroundColor: elevatedBg, color: textPrimary, padding: '8px 12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: textSecondary, display: 'block', marginBottom: '4px' }}>
                    Tracking URL
                  </label>
                  <input
                    type="text"
                    value={trackingUrl}
                    onChange={e => setTrackingUrl(e.target.value)}
                    placeholder="https://..."
                    style={{ width: '100%', fontSize: '0.82rem', borderRadius: '8px', border: `1px solid ${cardBorder}`, backgroundColor: elevatedBg, color: textPrimary, padding: '8px 12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: textSecondary, display: 'block', marginBottom: '4px' }}>
                    Estimated Delivery Date
                  </label>
                  <input
                    type="date"
                    value={estimatedDeliveryAt}
                    onChange={e => setEstimatedDeliveryAt(e.target.value)}
                    style={{ width: '100%', fontSize: '0.82rem', borderRadius: '8px', border: `1px solid ${cardBorder}`, backgroundColor: elevatedBg, color: textPrimary, padding: '8px 12px' }}
                  />
                </div>
              </div>

              {actionError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', fontSize: '0.82rem' }}>
                  {actionError}
                </div>
              )}

              {actionSuccess && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontSize: '0.82rem' }}>
                  {actionSuccess}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${cardBorder}`,
                    backgroundColor: elevatedBg,
                    color: textPrimary,
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '6px' }}
                >
                  <Check size={14} />
                  <span>Save Status Transition</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG FOR CRITICAL ACTIONS */}
      {confirmDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              maxWidth: '440px',
              width: '100%',
              backgroundColor: cardBg,
              borderRadius: '16px',
              border: `1px solid ${cardBorder}`,
              padding: '24px',
              textAlign: 'center',
              boxShadow: isLight ? '0 20px 45px rgba(76, 29, 149, 0.12)' : '0 20px 50px rgba(0, 0, 0, 0.6)'
            }}
          >
            <AlertTriangle size={36} color="#F59E0B" style={{ margin: '0 auto 12px', display: 'block' }} />
            <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', color: textPrimary }}>
              {confirmDialog.title}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.82rem', color: textSecondary, lineHeight: 1.5 }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${cardBorder}`,
                  backgroundColor: elevatedBg,
                  color: textPrimary,
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={confirmDialog.action}
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
              >
                Yes, Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
