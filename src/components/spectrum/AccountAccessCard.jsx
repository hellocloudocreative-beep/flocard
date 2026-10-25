/* ==========================================================================
   SPECTRUM UI - ACCOUNT ACCESS CARD COMPONENT
   Clean management card for owner-controlled administrator access & invitations.
   ========================================================================== */
import React from 'react';
import { ShieldCheck, Mail, Clock, Trash2, Key } from 'lucide-react';
import HoldToConfirm from './HoldToConfirm';

export default function AccountAccessCard({
  account,
  isCurrentUser = false,
  isOwner = false,
  onRevoke,
  onChangeRole
}) {
  const isSuperOwner = account.role === 'owner';

  return (
    <div
      style={{
        background: 'var(--card-surface, #100b19)',
        border: '1px solid var(--border-color, #30243d)',
        borderRadius: '14px',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.25)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: isSuperOwner ? 'linear-gradient(135deg, #7C3AED, #A855F7)' : 'rgba(124, 58, 237, 0.2)',
            color: isSuperOwner ? '#FFFFFF' : '#D8B4FE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.9rem'
          }}
        >
          {account.avatar ? (
            <img
              src={account.avatar}
              alt={account.name}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            account.name?.charAt(0) || account.email?.charAt(0).toUpperCase()
          )}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary, #FFFFFF)', fontSize: '0.94rem' }}>
              {account.name || account.email.split('@')[0]}
            </span>
            {isCurrentUser && (
              <span style={{ fontSize: '0.7rem', background: 'rgba(124, 58, 237, 0.25)', color: '#D8B4FE', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, border: '1px solid rgba(124, 58, 237, 0.35)' }}>
                You
              </span>
            )}
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                background: isSuperOwner ? 'rgba(124, 58, 237, 0.25)' : 'rgba(59, 130, 246, 0.2)',
                color: isSuperOwner ? '#D8B4FE' : '#93C5FD',
                border: isSuperOwner ? '1px solid rgba(124, 58, 237, 0.4)' : '1px solid rgba(59, 130, 246, 0.3)'
              }}
            >
              {isSuperOwner ? 'Owner' : 'Administrator'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '0.78rem', color: 'var(--text-secondary, #B8AEC8)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={13} />
              {account.email}
            </span>
            {account.grantedAt && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} />
                Granted {new Date(account.grantedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isOwner && !isSuperOwner && !isCurrentUser && (
          <HoldToConfirm
            variant="danger"
            holdDuration={1200}
            confirmText="Revoked"
            onConfirm={() => onRevoke && onRevoke(account.email)}
          >
            Revoke Access
          </HoldToConfirm>
        )}
      </div>
    </div>
  );
}
