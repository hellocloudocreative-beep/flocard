/* ==========================================================================
   FLOCARD CUSTOMER DASHBOARD — ORDERS TAB
   Displays authenticated customer's orders with fulfillment progress and tracking links.
   ========================================================================== */

import React, { useState } from 'react';
import {
  Package,
  Clock,
  ArrowRight,
  ExternalLink,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Calendar,
  QrCode
} from 'lucide-react';
import { EDITIONS } from '../../lib/constants';
import { ORDER_STAGES, EXCEPTION_STAGES, getOrderStageInfo, normalizeOrderStatus } from '../../lib/storage';
import { getOrderBillAmount } from '../../lib/whatsapp';
import PaymentQrModal from '../../components/dashboard/PaymentQrModal';

export default function CustomerOrdersTab({ orders = [], onViewOrder }) {
  const [paymentQrOrder, setPaymentQrOrder] = useState(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            Orders & Live Tracking
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Track your custom smart card manufacturing journey from design approval to delivery.
          </p>
        </div>

        <a href="/designer" className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
          <Sparkles size={14} />
          <span>New Card Order</span>
        </a>
      </div>

      {/* Orders List or Clean Empty State */}
      {orders.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '56px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--card-surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)'
          }}
        >
          <Package size={44} color="var(--border-color)" style={{ margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: '0 0 6px', fontWeight: 700 }}>
            Your orders will appear here once available.
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            You haven't placed any manufacturing orders yet. When you submit your artwork in the 3D studio, your real-time tracking timeline will activate here.
          </p>
          <a href="/designer" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', gap: '6px' }}>
            <Sparkles size={14} />
            <span>Customize a FLOCARD</span>
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map((order) => {
            const currentStatus = normalizeOrderStatus(order.status);
            const stageInfo = getOrderStageInfo(currentStatus);
            const isDelivered = currentStatus === 'delivered';
            const isException = EXCEPTION_STAGES.some(s => s.key === currentStatus);
            const ed = EDITIONS[order.edition] || EDITIONS.purple;

            // Step index 1-6
            const stepNum = isException ? 0 : (ORDER_STAGES.find(s => s.key === currentStatus)?.step || 1);
            const progressPercent = isException ? 0 : Math.round((stepNum / ORDER_STAGES.length) * 100);

            return (
              <div
                key={order.id || order.orderReference}
                className="glass-panel"
                style={{
                  padding: '24px',
                  backgroundColor: 'var(--card-surface)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  transition: 'border-color 0.2s ease, transform 0.2s ease'
                }}
              >
                {/* Header Row: Order Reference, Date, Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--elevated-surface)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-purple)'
                      }}
                    >
                      <Package size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                          {order.orderReference || order.id}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            backgroundColor: `${ed.accentColor}18`,
                            color: ed.accentColor,
                            border: `1px solid ${ed.accentColor}33`,
                            textTransform: 'capitalize'
                          }}
                        >
                          {ed.name}
                        </span>
                        {Boolean(order.approvedVersion === 'admin_edited' && order.editedDesign) && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              backgroundColor: 'rgba(112, 56, 248, 0.15)',
                              color: 'var(--accent-purple)',
                              border: '1px solid rgba(112, 56, 248, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Sparkles size={11} />
                            <span>Artwork updated by FLOCARDS design team</span>
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <Calendar size={12} />
                        <span>Placed on {new Date(order.orderDate || order.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Last updated {new Date(order.updatedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
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
                        isDelivered ? 'rgba(16, 185, 129, 0.15)' :
                        isException ? 'rgba(239, 68, 68, 0.15)' : 'rgba(107, 0, 255, 0.15)',
                      color:
                        isDelivered ? '#10B981' :
                        isException ? '#EF4444' : 'var(--accent-purple)',
                      border: `1px solid ${isDelivered ? '#10B98144' : isException ? '#EF444444' : 'var(--accent-purple)44'}`
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                    <span>{stageInfo.label}</span>
                  </div>
                </div>

                {/* Progress Bar & Stage Indicator */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Current Stage: <strong>{stageInfo.label}</strong>
                    </span>
                    {!isException && (
                      <span style={{ color: 'var(--text-muted)' }}>
                        Stage {stepNum} of {ORDER_STAGES.length} ({progressPercent}%)
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: 'var(--elevated-surface)',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        width: `${progressPercent}%`,
                        height: '100%',
                        backgroundColor: isDelivered ? '#10B981' : 'var(--primary-purple)',
                        borderRadius: '9999px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>

                {/* Bottom Row: Tracking number or estimated delivery & Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '4px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {order.trackingNumber ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#3B82F6', fontWeight: 600 }}>
                        <Truck size={14} />
                        <span>Tracking: {order.trackingNumber} ({order.carrierName || 'Courier'})</span>
                      </span>
                    ) : (
                      <span>Bill Amount: <strong style={{ color: 'var(--accent-purple)' }}>₹{getOrderBillAmount(order).toLocaleString('en-IN')}</strong></span>
                    )}
                  </div>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setPaymentQrOrder(order)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        gap: '6px',
                        backgroundColor: 'rgba(107, 0, 255, 0.1)',
                        color: 'var(--accent-purple)',
                        borderColor: 'rgba(107, 0, 255, 0.3)'
                      }}
                      title="Open Instant UPI Payment QR Code"
                    >
                      <QrCode size={14} />
                      <span>Pay ₹{getOrderBillAmount(order).toLocaleString('en-IN')} (QR)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onViewOrder(order.id)}
                      className="btn btn-primary btn-sm"
                      style={{ gap: '6px' }}
                    >
                      <span>View Journey Details</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamic Payment QR Modal */}
      <PaymentQrModal
        isOpen={Boolean(paymentQrOrder)}
        order={paymentQrOrder}
        onClose={() => setPaymentQrOrder(null)}
      />
    </div>
  );
}
