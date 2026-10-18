/* ==========================================================================
   FLOCARD CUSTOMER DASHBOARD — OVERVIEW TAB
   Displays real database metrics, active cards, orders in progress, and honest empty states.
   ========================================================================== */

import React from 'react';
import {
  Layers,
  Radio,
  FileText,
  Package,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { EDITIONS } from '../../lib/constants';
import { getOrderStageInfo } from '../../lib/storage';

export default function CustomerOverviewTab({
  customer,
  cards = [],
  profiles = [],
  orders = [],
  designs = [],
  onNavigateTab,
  onViewOrder
}) {
  // Calculate real metrics strictly from customer's records
  const totalCards = cards.length;
  const activeCards = cards.filter(c => c.status === 'active').length;
  const pendingCards = cards.filter(c => c.status !== 'active' && c.status !== 'revoked').length;
  const totalProfiles = profiles.length;
  const ordersInProgress = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;

  const primaryProfile = profiles[0] || null;
  const recentOrder = orders[0] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Welcome Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '28px 32px',
          backgroundColor: 'var(--card-surface)',
          borderRadius: '18px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          background: 'linear-gradient(135deg, rgba(107, 0, 255, 0.08) 0%, rgba(168, 85, 247, 0.02) 100%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              padding: '2px',
              background: 'linear-gradient(135deg, var(--accent-purple), var(--primary-purple))',
              flexShrink: 0
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: 'var(--card-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.4rem',
                color: 'var(--accent-purple)',
                overflow: 'hidden'
              }}
            >
              {customer?.avatar ? (
                <img src={customer.avatar} alt={customer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                customer?.name?.charAt(0) || 'C'
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-purple)', fontWeight: 700 }}>
              FLOCARD MEMBER ACCOUNT
            </div>
            <h1 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', margin: '4px 0', fontWeight: 800 }}>
              Welcome back, {customer?.name || 'Member'}
            </h1>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              {primaryProfile ? (
                <>Managing digital identity at <strong style={{ color: 'var(--accent-purple)' }}>flocard.in/p/{primaryProfile.slug}</strong></>
              ) : (
                'Manage your smart business cards, digital profiles, and live orders.'
              )}
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {primaryProfile && (
            <a href={`/p/${primaryProfile.slug}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
              <span>View Live Profile</span>
              <ExternalLink size={13} />
            </a>
          )}
          <a href="/designer" className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
            <Sparkles size={14} />
            <span>Customize New Card</span>
          </a>
        </div>
      </div>

      {/* Real Customer Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
          gap: '16px'
        }}
      >
        {/* Metric 1: My Cards */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'var(--card-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>My Cards</span>
            <Radio size={16} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            {totalCards}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Physical NFC Cards
          </div>
        </div>

        {/* Metric 2: Active Cards */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'var(--card-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Active Cards</span>
            <CheckCircle2 size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-display)' }}>
            {activeCards}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            NFC Transmission Live
          </div>
        </div>

        {/* Metric 3: Pending Cards */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'var(--card-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Pending Cards</span>
            <Clock size={16} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-display)' }}>
            {pendingCards}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            In Production / Unassigned
          </div>
        </div>

        {/* Metric 4: My Digital Profiles */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'var(--card-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Digital Profiles</span>
            <FileText size={16} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            {totalProfiles}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Contact Portfolios
          </div>
        </div>

        {/* Metric 5: Orders In Progress */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'var(--card-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>Orders In Progress</span>
            <Package size={16} color="var(--primary-purple)" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--primary-purple)', fontFamily: 'var(--font-display)' }}>
            {ordersInProgress}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Fulfillment Pipeline
          </div>
        </div>
      </div>

      {/* Two Column Section: Live Order Status & Active Cards */}
      <div className="grid-2" style={{ gap: '24px' }}>
        {/* Recent Order Status */}
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            backgroundColor: 'var(--card-surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={16} color="var(--accent-purple)" />
              <span>Latest Order Status</span>
            </h3>
            {orders.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigateTab('orders')}
                className="btn btn-outline btn-xs"
                style={{ fontSize: '0.74rem' }}
              >
                <span>View All ({orders.length})</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          {recentOrder ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, justifyContent: 'space-between' }}>
              <div style={{ backgroundColor: 'var(--elevated-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-purple)', fontSize: '0.88rem' }}>
                    {recentOrder.orderReference || recentOrder.id}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      backgroundColor: recentOrder.status === 'delivered' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 0, 255, 0.15)',
                      color: recentOrder.status === 'delivered' ? '#10B981' : 'var(--accent-purple)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    ● {getOrderStageInfo(recentOrder.status).label}
                  </span>
                </div>

                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {recentOrder.designTitle || `${recentOrder.customerName}'s Card Design`}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  Edition: <strong style={{ textTransform: 'capitalize' }}>{recentOrder.edition} Edition</strong> | Placed on {new Date(recentOrder.orderDate || recentOrder.createdAt).toLocaleDateString()}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onViewOrder(recentOrder.id)}
                className="btn btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center', gap: '6px' }}
              >
                <span>View Live Journey Timeline</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div style={{ padding: '36px 12px', textAlign: 'center', color: 'var(--text-secondary)', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={32} color="var(--border-color)" style={{ marginBottom: '10px' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '0.9rem' }}>
                Your orders will appear here once available.
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '300px', margin: '0 0 16px' }}>
                When you design and submit a new FLOCARD, you can track its manufacturing journey in real time right here.
              </p>
              <a href="/designer" className="btn btn-outline btn-xs">
                <span>Start a Card Design</span>
              </a>
            </div>
          )}
        </div>

        {/* Active Cards List Preview */}
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            backgroundColor: 'var(--card-surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={16} color="var(--accent-purple)" />
              <span>My NFC Cards</span>
            </h3>
            {cards.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigateTab('cards')}
                className="btn btn-outline btn-xs"
                style={{ fontSize: '0.74rem' }}
              >
                <span>Manage Cards ({cards.length})</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          {cards.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {cards.slice(0, 3).map((card) => {
                const ed = EDITIONS[card.edition] || EDITIONS.purple;
                const isActive = card.status === 'active';
                return (
                  <div
                    key={card.id || card.cardCode}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--elevated-surface)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {card.cardCode}
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '2px 6px',
                            borderRadius: '9999px',
                            backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: isActive ? '#10B981' : '#F59E0B',
                            fontWeight: 700
                          }}
                        >
                          {isActive ? 'Active' : 'Pending'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {ed.name} | Linked to @{card.profileSlug || 'unassigned'}
                      </div>
                    </div>

                    <a
                      href={`/t/${card.cardCode}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline btn-xs"
                      style={{ padding: '5px 10px', fontSize: '0.72rem', gap: '4px' }}
                    >
                      <span>Test Tap</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '36px 12px', textAlign: 'center', color: 'var(--text-secondary)', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Radio size={32} color="var(--border-color)" style={{ marginBottom: '10px' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '0.9rem' }}>
                You haven't added any cards yet.
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '300px', margin: '0 0 16px' }}>
                Explore the Cards collection or open our 3D Studio to order your first customized NFC smart card.
              </p>
              <a href="/cards" className="btn btn-outline btn-xs">
                <span>Explore Card Collection</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
