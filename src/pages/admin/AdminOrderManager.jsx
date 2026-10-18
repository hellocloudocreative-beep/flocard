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
import { ORDER_STAGES, EXCEPTION_STAGES, getOrderStageInfo, normalizeOrderStatus } from '../../lib/storage';
import { EDITIONS } from '../../lib/constants';

export default function AdminOrderManager({ initialOrderId = null }) {
  const { user } = useAuth();
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px'
        }}
      >
        <div style={{ backgroundColor: 'var(--card-surface)', borderRadius: '14px', border: '1px solid var(--border-color)', padding: '16px 20px' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Orders</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{orders.length}</div>
        </div>

        <div style={{ backgroundColor: 'var(--card-surface)', borderRadius: '14px', border: '1px solid var(--border-color)', padding: '16px 20px' }}>
          <div style={{ fontSize: '0.74rem', color: '#F59E0B', textTransform: 'uppercase', fontWeight: 600 }}>In Production</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>
            {orders.filter(o => ['design_submitted', 'artwork_approved', 'manufacturing_started', 'quality_inspection'].includes(normalizeOrderStatus(o.status))).length}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-surface)', borderRadius: '14px', border: '1px solid var(--border-color)', padding: '16px 20px' }}>
          <div style={{ fontSize: '0.74rem', color: '#3B82F6', textTransform: 'uppercase', fontWeight: 600 }}>Dispatched</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3B82F6', marginTop: '4px' }}>
            {orders.filter(o => normalizeOrderStatus(o.status) === 'dispatched').length}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-surface)', borderRadius: '14px', border: '1px solid var(--border-color)', padding: '16px 20px' }}>
          <div style={{ fontSize: '0.74rem', color: '#10B981', textTransform: 'uppercase', fontWeight: 600 }}>Delivered & Live</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
            {orders.filter(o => normalizeOrderStatus(o.status) === 'delivered').length}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          backgroundColor: 'var(--card-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Controls: Search & Status Filter Chips */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search reference, customer, email..."
              className="input"
              style={{ width: '100%', paddingLeft: '34px', fontSize: '0.82rem', borderRadius: '8px' }}
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
                    border: isActive ? '1px solid var(--primary-purple)' : '1px solid var(--border-color)',
                    backgroundColor: isActive ? 'var(--primary-purple)' : 'var(--elevated-surface)',
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize'
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
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
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
                  <td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Package size={36} color="var(--border-color)" style={{ margin: '0 auto 10px', display: 'block' }} />
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {orders.length === 0 ? 'No manufacturing orders in queue' : 'No orders matching filter'}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
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
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      {/* Order Reference */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-purple)' }}>
                          {order.orderReference || order.id}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{order.customerName}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{order.customerEmail}</div>
                        {order.company && <div style={{ fontSize: '0.7rem', color: 'var(--accent-purple)' }}>{order.company}</div>}
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
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
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
                            backgroundColor: isDelivered ? 'rgba(16, 185, 129, 0.15)' : isException ? 'rgba(239, 68, 68, 0.15)' : 'rgba(107, 0, 255, 0.15)',
                            color: isDelivered ? '#10B981' : isException ? '#EF4444' : 'var(--accent-purple)',
                            border: '1px solid var(--border-color)',
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
                            <div style={{ fontSize: '0.76rem', color: '#3B82F6', fontWeight: 600 }}>
                              {order.trackingNumber}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {order.carrierName || 'Courier'}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
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
            className="glass-panel"
            style={{
              maxWidth: '620px',
              width: '100%',
              backgroundColor: 'var(--card-surface)',
              borderRadius: '20px',
              border: '1px solid var(--border-highlight)',
              padding: '28px',
              boxShadow: 'var(--shadow-card)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  Update Order Journey: {selectedOrder.orderReference || selectedOrder.id}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Customer: <strong>{selectedOrder.customerName}</strong> ({selectedOrder.customerEmail})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStatusChangePrecheck} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Select Stage */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Fulfillment Stage
                </label>
                <select
                  value={targetStatus}
                  onChange={e => setTargetStatus(e.target.value)}
                  className="input"
                  style={{ width: '100%', fontSize: '0.86rem', padding: '10px 12px', borderRadius: '8px' }}
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
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Customer-Facing Update Message (Visible in customer timeline & in-app notification)
                </label>
                <textarea
                  rows={2}
                  value={publicMessage}
                  onChange={e => setPublicMessage(e.target.value)}
                  placeholder="Optional custom message explaining this stage to the client..."
                  className="input"
                  style={{ width: '100%', fontSize: '0.82rem', resize: 'vertical', borderRadius: '8px' }}
                />
              </div>

              {/* Private Administrative Internal Note (Protected - Never Exposed to Customers) */}
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#EF4444', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Lock size={13} />
                  <span>Private Internal Administrative Note (ADMIN ONLY — Never sent to customer)</span>
                </label>
                <textarea
                  rows={2}
                  value={internalNote}
                  onChange={e => setInternalNote(e.target.value)}
                  placeholder="e.g. Quality inspection passed on batch #882. Courier waybill printed."
                  className="input"
                  style={{ width: '100%', fontSize: '0.82rem', resize: 'vertical', backgroundColor: 'var(--card-surface)', borderRadius: '8px' }}
                />
              </div>

              {/* Carrier Tracking Information */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Courier / Carrier Name
                  </label>
                  <input
                    type="text"
                    value={carrierName}
                    onChange={e => setCarrierName(e.target.value)}
                    placeholder="e.g. BlueDart / DHL / FedEx"
                    className="input"
                    style={{ width: '100%', fontSize: '0.82rem', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Tracking / Waybill Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    placeholder="e.g. BD98712345"
                    className="input"
                    style={{ width: '100%', fontSize: '0.82rem', borderRadius: '8px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Tracking URL
                  </label>
                  <input
                    type="text"
                    value={trackingUrl}
                    onChange={e => setTrackingUrl(e.target.value)}
                    placeholder="https://..."
                    className="input"
                    style={{ width: '100%', fontSize: '0.82rem', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Estimated Delivery Date
                  </label>
                  <input
                    type="date"
                    value={estimatedDeliveryAt}
                    onChange={e => setEstimatedDeliveryAt(e.target.value)}
                    className="input"
                    style={{ width: '100%', fontSize: '0.82rem', borderRadius: '8px' }}
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
                  className="btn btn-outline btn-sm"
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
            className="glass-panel"
            style={{
              maxWidth: '440px',
              width: '100%',
              backgroundColor: 'var(--card-surface)',
              borderRadius: '16px',
              border: '1px solid var(--border-highlight)',
              padding: '24px',
              textAlign: 'center'
            }}
          >
            <AlertTriangle size={36} color="#F59E0B" style={{ margin: '0 auto 12px', display: 'block' }} />
            <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
              {confirmDialog.title}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="btn btn-outline btn-sm"
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
