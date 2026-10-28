/* ==========================================================================
   FLOCARDS PUBLIC ORDER TRACKING & LIVE JOURNEY PORTAL
   Allows customers (including direct WhatsApp buyers without an account)
   to track real-time manufacturing milestones, live courier waybills,
   and inspect their bespoke NFC card design in high-definition 3D.
   ========================================================================== */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Radio,
  FileText
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import CustomerCardPreview from '../../components/CustomerCardPreview';
import { ORDER_STAGES, EXCEPTION_STAGES, getOrderStageInfo, normalizeOrderStatus } from '../../lib/storage';
import { EDITIONS, BRAND } from '../../lib/constants';

export default function OrderTracking() {
  const { orders = [], getOrderById } = useData();

  // Parse URL search parameters
  const [queryInput, setQueryInput] = useState('');
  const [activeRef, setActiveRef] = useState('');
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('order') || params.get('id') || '';
    if (ref) {
      setActiveRef(ref.trim());
      setQueryInput(ref.trim());
    }
  }, []);

  // Lookup order
  const order = useMemo(() => {
    if (!activeRef) return null;
    if (getOrderById) {
      const found = getOrderById(activeRef, null);
      if (found) return found;
    }
    // Fallback scan local orders
    const normalizedTarget = activeRef.toLowerCase().trim();
    return orders.find(
      o => (o.orderReference && o.orderReference.toLowerCase() === normalizedTarget) ||
           (o.id && o.id.toLowerCase() === normalizedTarget)
    ) || null;
  }, [activeRef, orders, getOrderById]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchError('');
    const clean = queryInput.trim();
    if (!clean) {
      setSearchError('Please enter an order reference number.');
      return;
    }
    setActiveRef(clean);
    if (typeof window !== 'undefined') {
      const newUrl = `${window.location.pathname}?ref=${encodeURIComponent(clean)}`;
      window.history.replaceState({}, '', newUrl);
    }
  };

  const handleCopyWaybill = (trackingNum) => {
    if (!trackingNum) return;
    navigator.clipboard.writeText(trackingNum).then(() => {
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2200);
    });
  };

  const currentStatus = order ? normalizeOrderStatus(order.status) : 'design_submitted';
  const stageInfo = getOrderStageInfo(currentStatus);
  const isException = EXCEPTION_STAGES.some(s => s.key === currentStatus);
  const currentStep = isException ? -1 : (ORDER_STAGES.find(s => s.key === currentStatus)?.step || 1);
  const editionDetails = EDITIONS[order?.edition] || EDITIONS.gold;

  return (
    <div style={{ minHeight: '88vh', padding: '40px 16px 80px', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        
        {/* Navigation Breadcrumb / Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.84rem',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <ArrowLeft size={14} />
            <span>Return to FLOCARDS Home</span>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Live Tracking Hub</span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
          </div>
        </div>

        {/* Hero Section & Search Bar */}
        <div
          className="glass-panel"
          style={{
            padding: '36px 28px',
            borderRadius: '24px',
            backgroundColor: 'rgba(17, 12, 34, 0.75)',
            border: '1px solid rgba(168, 85, 247, 0.22)',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.6)',
            marginBottom: '32px'
          }}
        >
          <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 14px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(107, 0, 255, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--accent-purple)',
                marginBottom: '16px'
              }}
            >
              <Package size={14} />
              <span>FLOCARDS Fulfillment Tracking</span>
            </div>

            <h1
              style={{
                margin: '0 0 10px',
                fontSize: '2rem',
                fontWeight: 800,
                color: '#FFFFFF',
                fontFamily: 'var(--font-heading, Sora)',
                letterSpacing: '-0.02em'
              }}
            >
              Track Your Custom NFC Card
            </h1>
            <p style={{ margin: '0 0 24px', fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Follow your precision-crafted smart business card through laser engraving, chip encoding, quality assurance, and dispatch.
            </p>

            {/* Reference Search Input */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', position: 'relative' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Enter Order Reference (e.g. FLC-ORD-9081)"
                  style={{
                    width: '100%',
                    padding: '13px 16px 13px 44px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(25, 17, 44, 0.9)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    color: '#FFFFFF',
                    fontSize: '0.92rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '0 24px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Track</span>
                <ArrowRight size={16} />
              </button>
            </form>

            {searchError && (
              <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '8px', textAlign: 'left' }}>
                {searchError}
              </div>
            )}


          </div>
        </div>

        {/* Order Details Body */}
        {!order ? (
          <div
            className="glass-panel"
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              borderRadius: '20px',
              backgroundColor: 'rgba(17, 12, 34, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <AlertCircle size={44} color="#EF4444" style={{ margin: '0 auto 16px', display: 'block' }} />
            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: '#FFFFFF', fontWeight: 700 }}>
              Order Reference Not Found
            </h3>
            <p style={{ margin: '0 auto 20px', maxWidth: '440px', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              We could not find an active manufacturing record for "<strong>{activeRef}</strong>". Please verify your reference number received via WhatsApp or email.
            </p>
            <a
              href={`https://wa.me/${BRAND.whatsapp}?text=Hi%20FLOCARDS,%20I%20need%20help%20locating%20my%20order%20${encodeURIComponent(activeRef)}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <MessageSquare size={14} />
              <span>Contact Operations on WhatsApp</span>
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Order Summary Strip */}
            <div
              className="glass-panel"
              style={{
                padding: '20px 24px',
                borderRadius: '16px',
                backgroundColor: 'rgba(21, 14, 42, 0.8)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'monospace' }}>
                    {order.orderReference || order.id}
                  </span>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      backgroundColor: 'rgba(107, 0, 255, 0.2)',
                      color: editionDetails.accentColor || '#C084FC',
                      border: `1px solid ${editionDetails.accentColor || '#C084FC'}44`
                    }}
                  >
                    {order.edition} Edition ({editionDetails.badge || 'NFC Hardware'})
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Placed on {order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'} · Client: <strong>{order.customerName}</strong> {order.company ? `(${order.company})` : ''}
                </div>
              </div>

              {/* Status Pill */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  borderRadius: '9999px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  backgroundColor:
                    currentStatus === 'delivered' ? 'rgba(16, 185, 129, 0.15)' :
                    isException ? 'rgba(239, 68, 68, 0.15)' : 'rgba(107, 0, 255, 0.18)',
                  color:
                    currentStatus === 'delivered' ? '#10B981' :
                    isException ? '#EF4444' : 'var(--accent-purple)',
                  border: `1px solid ${currentStatus === 'delivered' ? '#10B98144' : isException ? '#EF444444' : 'var(--accent-purple)44'}`
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'currentColor',
                    boxShadow: '0 0 8px currentColor'
                  }}
                />
                <span>{stageInfo.label}</span>
              </div>
            </div>

            {/* Exception Warning Banner if order is in an exception state */}
            {isException && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '16px',
                  padding: '18px 24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px'
                }}
              >
                <AlertTriangle size={24} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#EF4444' }}>
                    Order Action Required: {stageInfo.label}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {stageInfo.description || 'Our operations team has flagged an update for your order. Please review the timeline notes or contact operations on WhatsApp.'}
                  </p>
                </div>
              </div>
            )}

            {/* Main Visual Fulfillment Milestone Timeline */}
            <div
              className="glass-panel"
              style={{
                padding: '32px 28px',
                borderRadius: '20px',
                backgroundColor: 'rgba(18, 12, 36, 0.8)',
                border: '1px solid rgba(168, 85, 247, 0.22)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#FFFFFF', fontWeight: 800 }}>
                    Manufacturing & Dispatch Journey
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Real-time verification directly synced with FLOCARDS manufacturing floor.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  <ShieldCheck size={14} color="#10B981" />
                  <span>Quality Assured & Cryptographically Encoded</span>
                </div>
              </div>

              {/* Desktop Horizontal Milestone Steps */}
              <div className="order-timeline-wrapper" style={{ marginTop: '36px', marginBottom: '32px' }}>
                <div
                  className="timeline-horizontal hidden-mobile"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  {/* Background connecting line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '21px',
                      left: '40px',
                      right: '40px',
                      height: '3px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      zIndex: 1
                    }}
                  />
                  {/* Progress connecting line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '21px',
                      left: '40px',
                      width: isException ? '0%' : `${Math.max(0, Math.min(100, ((currentStep - 1) / (ORDER_STAGES.length - 1)) * 100))}%`,
                      height: '3px',
                      backgroundColor: 'var(--primary-purple, #9333EA)',
                      boxShadow: '0 0 12px rgba(168, 85, 247, 0.6)',
                      transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                      zIndex: 2
                    }}
                  />

                  {ORDER_STAGES.map((st) => {
                    const isCompleted = !isException && currentStep > st.step;
                    const isCurrent = !isException && currentStep === st.step;

                    return (
                      <div
                        key={st.key}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          width: '135px',
                          position: 'relative',
                          zIndex: 3
                        }}
                      >
                        {/* Step Circle */}
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isCompleted ? '#10B981' : isCurrent ? 'var(--primary-purple, #9333EA)' : '#19112F',
                            color: isCompleted || isCurrent ? '#FFFFFF' : 'var(--text-muted)',
                            border: isCurrent ? '3px solid var(--accent-purple)' : '2px solid rgba(255, 255, 255, 0.12)',
                            boxShadow: isCurrent ? '0 0 20px rgba(168, 85, 247, 0.6)' : 'none',
                            transition: 'all 0.3s ease',
                            fontWeight: 700,
                            fontSize: '0.88rem'
                          }}
                        >
                          {isCompleted ? <CheckCircle2 size={22} /> : st.step}
                        </div>

                        {/* Title & Stage State */}
                        <div style={{ marginTop: '12px' }}>
                          <div
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: isCurrent ? 700 : 600,
                              color: isCurrent ? '#FFFFFF' : isCompleted ? '#10B981' : 'var(--text-muted)'
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

                {/* Mobile Vertical Milestone Steps */}
                <div
                  className="timeline-vertical hidden-desktop"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    position: 'relative',
                    paddingLeft: '14px'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      bottom: '16px',
                      left: '30px',
                      width: '2px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
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
                            backgroundColor: isCompleted ? '#10B981' : isCurrent ? 'var(--primary-purple, #9333EA)' : '#19112F',
                            color: isCompleted || isCurrent ? '#FFFFFF' : 'var(--text-muted)',
                            border: isCurrent ? '2px solid var(--accent-purple)' : '2px solid rgba(255, 255, 255, 0.12)',
                            boxShadow: isCurrent ? '0 0 14px rgba(168, 85, 247, 0.5)' : 'none',
                            flexShrink: 0,
                            fontWeight: 700,
                            fontSize: '0.8rem'
                          }}
                        >
                          {isCompleted ? <CheckCircle2 size={18} /> : st.step}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: isCurrent ? 700 : 600, color: isCurrent ? '#FFFFFF' : isCompleted ? '#10B981' : 'var(--text-muted)' }}>
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

              {/* Carrier Tracking Waybill Box (if assigned) */}
              {(order.carrierName || order.trackingNumber) && (
                <div
                  style={{
                    marginTop: '28px',
                    padding: '20px 24px',
                    borderRadius: '14px',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#60A5FA'
                      }}
                    >
                      <Truck size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                        Carrier: {order.carrierName || 'Express Courier Network'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <span>Waybill / Tracking #:</span>
                        <strong style={{ color: '#60A5FA', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                          {order.trackingNumber || 'Available shortly'}
                        </strong>
                        {order.trackingNumber && (
                          <button
                            type="button"
                            onClick={() => handleCopyWaybill(order.trackingNumber)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: copiedTracking ? '#10B981' : 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.72rem'
                            }}
                            title="Copy tracking number"
                          >
                            {copiedTracking ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedTracking ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{
                        borderColor: 'rgba(59, 130, 246, 0.45)',
                        color: '#60A5FA',
                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>Track on Courier Portal</span>
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Split Grid: 3D Visual Proof on Left, Specification & Timeline Events on Right */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
              
              {/* Exact Card Design Preview */}
              <div
                className="glass-panel"
                style={{
                  padding: '24px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(18, 12, 36, 0.8)',
                  border: '1px solid rgba(168, 85, 247, 0.22)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} color="var(--accent-purple)" />
                    <span>Exact Card Proof & Artwork</span>
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Interactive 3D / 2D</span>
                </div>

                <div style={{ flex: 1, minHeight: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CustomerCardPreview
                    order={order}
                    designId={order.designId}
                    edition={order.edition}
                    interactive={true}
                  />
                </div>

                {/* Provisioned NFC Card Assets if delivered */}
                {currentStatus === 'delivered' && order.cardCode && (
                  <div
                    style={{
                      marginTop: '20px',
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={15} />
                      <span>Card Successfully Activated & En Route!</span>
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
                        <span>Test NFC Tap Link</span>
                        <ExternalLink size={10} />
                      </a>

                      {order.profileSlug && (
                        <a
                          href={`/${order.profileSlug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-xs"
                          style={{ gap: '6px' }}
                        >
                          <FileText size={12} />
                          <span>View Public Profile (@{order.profileSlug})</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Public Timeline Updates Log (Strictly Suppressing Internal Notes) */}
              <div
                className="glass-panel"
                style={{
                  padding: '24px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(18, 12, 36, 0.8)',
                  border: '1px solid rgba(168, 85, 247, 0.22)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} color="var(--accent-purple)" />
                    <span>Fulfillment Activity Log</span>
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Immutable ledger</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                  {(!order.history || order.history.length === 0) ? (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '24px 0', textAlign: 'center' }}>
                      Order created and initialized in manufacturing queue.
                    </div>
                  ) : (
                    order.history.map((h, i) => (
                      <div
                        key={h.id || i}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(25, 17, 44, 0.7)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
                            {getOrderStageInfo(h.newStatus).label}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {h.createdAt ? new Date(h.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Verified'}
                          </span>
                        </div>

                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                          {h.publicMessage || getOrderStageInfo(h.newStatus).description}
                        </p>

                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Verified by: {h.actorName || 'FLOCARDS Operations Floor'}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Direct WhatsApp Inquiries */}
                <div
                  style={{
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Have questions about this shipment?
                  </span>
                  <a
                    href={`https://wa.me/${BRAND.whatsapp}?text=Hi%20FLOCARDS,%20I%20have%20an%20inquiry%20regarding%20my%20order%20${encodeURIComponent(order.orderReference || order.id)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--accent-purple)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textDecoration: 'none'
                    }}
                  >
                    <MessageSquare size={14} />
                    <span>Chat with Operations</span>
                  </a>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
