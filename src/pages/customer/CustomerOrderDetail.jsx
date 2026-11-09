/* ==========================================================================
   FLOCARD ORDER JOURNEY TIMELINE & TRACKING DETAIL
   Displays live fulfillment stages, real carrier tracking, immutable status history,
   and realtime reactive updates without page reload.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Radio,
  FileText,
  MapPin,
  Calendar,
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ORDER_STAGES, EXCEPTION_STAGES, getOrderStageInfo, normalizeOrderStatus } from '../../lib/storage';
import { EDITIONS, BRAND } from '../../lib/constants';
import CustomerCardPreview from '../../components/CustomerCardPreview';

export default function CustomerOrderDetail({ orderId, onBack }) {
  const { user } = useAuth();
  const { getOrderById, lastOrderUpdate, orders = [] } = useData();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch order data and enforce ownership check
  const loadOrder = () => {
    if (!orderId) return;
    const found = getOrderById(orderId, user);
    setOrder(found);
    setLoading(false);
  };

  useEffect(() => {
    loadOrder();
  }, [orderId, user, orders, lastOrderUpdate]);

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Clock size={32} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block', color: 'var(--accent-purple)' }} />
        <span>Loading order journey...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '500px', margin: '0 auto', padding: '36px' }}>
          <AlertTriangle size={36} color="#EF4444" style={{ margin: '0 auto 12px', display: 'block' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Order Not Found</h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            The requested order reference could not be found or you do not have permission to access it.
          </p>
          <button type="button" onClick={onBack} className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} />
            <span>Return to Orders List</span>
          </button>
        </div>
      </div>
    );
  }

  const currentStatus = normalizeOrderStatus(order.status);
  const stageInfo = getOrderStageInfo(currentStatus);
  const isException = EXCEPTION_STAGES.some(s => s.key === currentStatus);
  const currentStep = isException ? -1 : (ORDER_STAGES.find(s => s.key === currentStatus)?.step || 1);

  const editionDetails = EDITIONS[order.edition] || EDITIONS.purple;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <button
          type="button"
          onClick={onBack}
          className="btn btn-outline btn-sm"
          style={{ gap: '6px' }}
        >
          <ArrowLeft size={14} />
          <span>Back to All Orders</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Order Reference:</span>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--accent-purple)',
              backgroundColor: 'rgba(107, 0, 255, 0.1)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(168, 85, 247, 0.25)'
            }}
          >
            {order.orderReference || order.id}
          </span>
        </div>
      </div>

      {/* Exception Warning Banner if order is in an exception state */}
      {isException && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '14px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          <AlertTriangle size={22} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#EF4444' }}>
              Order Attention: {stageInfo.label}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {stageInfo.description || 'Our operations team has flagged an update for your order. Please review the timeline notes below.'}
            </p>
          </div>
        </div>
      )}

      {/* Main Order Journey Timeline Card */}
      <div
        className="glass-panel"
        style={{
          padding: '28px',
          backgroundColor: 'var(--card-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              Order Journey Timeline
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Live fulfillment status updated directly by FLOCARD manufacturing operations.
            </p>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 700,
              backgroundColor:
                currentStatus === 'delivered' ? 'rgba(16, 185, 129, 0.15)' :
                isException ? 'rgba(239, 68, 68, 0.15)' : 'rgba(107, 0, 255, 0.15)',
              color:
                currentStatus === 'delivered' ? '#10B981' :
                isException ? '#EF4444' : 'var(--accent-purple)',
              border: `1px solid ${currentStatus === 'delivered' ? '#10B98144' : isException ? '#EF444444' : 'var(--accent-purple)44'}`
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
            <span>{stageInfo.label}</span>
          </div>
        </div>

        {/* Visual Timeline — Responsive Horizontal Desktop / Vertical Mobile */}
        <div className="order-timeline-wrapper" style={{ marginTop: '32px', marginBottom: '24px' }}>
          {/* Desktop Timeline */}
          <div className="timeline-horizontal hidden-mobile" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
            {/* Background connecting bar */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '40px',
                right: '40px',
                height: '3px',
                backgroundColor: 'var(--border-color)',
                zIndex: 1
              }}
            />
            {/* Active connecting bar */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '40px',
                width: isException ? '0%' : `${Math.max(0, Math.min(100, ((currentStep - 1) / (ORDER_STAGES.length - 1)) * 100))}%`,
                height: '3px',
                backgroundColor: 'var(--primary-purple)',
                boxShadow: '0 0 10px var(--primary-purple-glow)',
                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: 2
              }}
            />

            {ORDER_STAGES.map((st) => {
              const isCompleted = !isException && currentStep > st.step;
              const isCurrent = !isException && currentStep === st.step;
              const isUpcoming = isException || currentStep < st.step;

              return (
                <div
                  key={st.key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    width: '130px',
                    position: 'relative',
                    zIndex: 3
                  }}
                >
                  {/* Step Circle */}
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isCompleted ? '#10B981' : isCurrent ? 'var(--primary-purple)' : 'var(--elevated-surface)',
                      color: isCompleted || isCurrent ? '#FFFFFF' : 'var(--text-muted)',
                      border: isCurrent ? '3px solid var(--accent-purple)' : '2px solid var(--border-color)',
                      boxShadow: isCurrent ? '0 0 16px var(--primary-purple-glow)' : 'none',
                      transition: 'all 0.3s ease',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}
                  >
                    {isCompleted ? <CheckCircle2 size={20} /> : st.step}
                  </div>

                  {/* Title & Status */}
                  <div style={{ marginTop: '10px' }}>
                    <div
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: isCurrent ? 700 : 600,
                        color: isCurrent ? 'var(--text-primary)' : isCompleted ? '#10B981' : 'var(--text-muted)'
                      }}
                    >
                      {st.label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Upcoming'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Vertical Timeline */}
          <div className="timeline-vertical hidden-desktop" style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '16px' }}>
            {/* Vertical connector line */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                bottom: '16px',
                left: '32px',
                width: '2px',
                backgroundColor: 'var(--border-color)'
              }}
            />

            {ORDER_STAGES.map((st) => {
              const isCompleted = !isException && currentStep > st.step;
              const isCurrent = !isException && currentStep === st.step;

              return (
                <div key={st.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative', zIndex: 2 }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isCompleted ? '#10B981' : isCurrent ? 'var(--primary-purple)' : 'var(--card-surface)',
                      color: isCompleted || isCurrent ? '#FFFFFF' : 'var(--text-muted)',
                      border: isCurrent ? '2px solid var(--accent-purple)' : '2px solid var(--border-color)',
                      boxShadow: isCurrent ? '0 0 12px var(--primary-purple-glow)' : 'none',
                      flexShrink: 0,
                      fontWeight: 700,
                      fontSize: '0.78rem'
                    }}
                  >
                    {isCompleted ? <CheckCircle2 size={16} /> : st.step}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: isCurrent ? 700 : 600, color: isCurrent ? 'var(--text-primary)' : isCompleted ? '#10B981' : 'var(--text-muted)' }}>
                      {st.label}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {st.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carrier Tracking Information (Only displayed if genuinely configured) */}
        {(order.carrierName || order.trackingNumber) && (
          <div
            style={{
              marginTop: '28px',
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Truck size={22} color="#3B82F6" />
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Carrier: {order.carrierName || 'Standard Express Courier'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Waybill / Tracking #: <strong style={{ color: '#3B82F6' }}>{order.trackingNumber}</strong>
                </div>
              </div>
            </div>

            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline btn-xs"
                style={{ borderColor: 'rgba(59, 130, 246, 0.4)', color: '#3B82F6', gap: '6px' }}
              >
                <span>Track on Carrier Website</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}

        {/* Estimated Delivery Date if present */}
        {order.estimatedDeliveryAt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <Calendar size={14} color="var(--accent-purple)" />
            <span>Estimated Delivery: <strong>{new Date(order.estimatedDeliveryAt).toLocaleDateString()}</strong></span>
          </div>
        )}
      </div>

      {/* Two Column Grid: Order Items & Live Provisioned NFC Assets */}
      <div className="grid-2" style={{ gap: '24px' }}>
        {/* Card Specification Details */}
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
            <Package size={16} color="var(--accent-purple)" />
            <span>Card Specification & Artwork</span>
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <CustomerCardPreview
              order={order}
              designId={order.designId}
              edition={order.edition}
              interactive={true}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Design Title</span>
              <strong style={{ color: 'var(--text-primary)' }}>{order.designTitle || `${order.customerName}'s FLOCARD`}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Edition</span>
              <strong style={{ color: editionDetails.accentColor, textTransform: 'capitalize' }}>
                {order.edition} Edition ({editionDetails.badge})
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Template Format</span>
              <span style={{ color: 'var(--text-primary)' }}>
                {order.templateType === 'customer_logo' ? 'With Customer Logo' : 'Standard (Without Logo)'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>NFC Microchip</span>
              <span style={{ color: 'var(--text-primary)' }}>NXP NTAG216 (888 Bytes EEPROM)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Quantity</span>
              <span style={{ color: 'var(--text-primary)' }}>{order.quantity || 1} Custom Card</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Shipping Destination</span>
              <span style={{ color: 'var(--text-primary)', textAlign: 'right', maxWidth: '240px' }}>
                {order.shippingAddress || 'Plot 42, Infopark Kochi, Kerala 682042'}
              </span>
            </div>
          </div>

          {/* Provisioned NFC Card Assets if delivered, else In Process Notice */}
          {currentStatus === 'delivered' && order.cardCode ? (
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} />
                <span>NFC Card & Digital Profile Live!</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <a
                  href={`/t/${order.cardCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary btn-xs"
                  style={{ gap: '6px' }}
                >
                  <Radio size={12} />
                  <span>Test NFC Redirect ({order.cardCode})</span>
                  <ExternalLink size={10} />
                </a>

                {order.profileSlug && (
                  <a
                    href={`/p/${order.profileSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-xs"
                    style={{ gap: '6px' }}
                  >
                    <FileText size={12} />
                    <span>View Profile (@{order.profileSlug})</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                marginTop: '20px',
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <Clock size={16} color="#F59E0B" />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: '#F59E0B' }}>Order In Process:</strong> Physical card manufacturing & chip encoding are underway. Public NFC links will activate upon delivery.
              </div>
            </div>
          )}
        </div>

        {/* Public Status History Log (Immutable Audit Trail) */}
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
            <Clock size={16} color="var(--accent-purple)" />
            <span>Fulfillment Update History</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '340px', overflowY: 'auto' }}>
            {(!order.history || order.history.length === 0) ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '16px 0' }}>
                No status history events recorded yet.
              </div>
            ) : (
              order.history.map((h, i) => (
                <div
                  key={h.id || i}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--elevated-surface)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
                      {getOrderStageInfo(h.newStatus).label}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(h.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {h.publicMessage}
                  </p>

                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Updated by: {h.actorName || 'Operations Team'}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Support Notice */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Need assistance with your order?</span>
            <a
              href={`https://wa.me/${BRAND.whatsapp}?text=Hi%20FLOCARD,%20I%20have%20a%20question%20regarding%20my%20order%20${order.orderReference || order.id}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--accent-purple)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Contact Operations</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
