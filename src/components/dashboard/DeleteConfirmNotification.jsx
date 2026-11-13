/* ==========================================================================
   FLOCARDS APPLE-STYLE DELETE CONFIRMATION NOTIFICATION
   Features:
   - Interactive macOS/Apple-style notification card sliding in from the side
   - Replaces native browser window.confirm() and window.alert() entirely
   - Features prominent "OK" button and "Cancel" button
   - Luxury frosted glass styling matching FLOCARDS aesthetic
   ========================================================================== */

import React, { useEffect, useRef } from 'react';
import { Trash2, AlertTriangle, X, Check } from 'lucide-react';

export default function DeleteConfirmNotification({
  isOpen,
  title = 'Confirm Deletion',
  itemName = '',
  message = 'Are you sure you want to permanently delete this? This action cannot be undone.',
  onConfirm,
  onCancel,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  isLight = false
}) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus OK button for quick keyboard navigation
    if (confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const bgCard = isLight ? 'rgba(255, 255, 255, 0.97)' : 'rgba(17, 12, 29, 0.96)';
  const borderCard = isLight ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.4)';
  const textPrimary = isLight ? '#111827' : '#F9FAFB';
  const textSecondary = isLight ? '#4B5563' : '#9CA3AF';
  const itemBg = isLight ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.14)';

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 9999999,
        maxWidth: '400px',
        width: 'calc(100vw - 48px)',
        pointerEvents: 'auto',
        animation: 'slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        style={{
          backgroundColor: bgCard,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: `1px solid ${borderCard}`,
          boxShadow: isLight
            ? '0 20px 45px rgba(0, 0, 0, 0.18), 0 0 20px rgba(239, 68, 68, 0.1)'
            : '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 30px rgba(239, 68, 68, 0.2)',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflow: 'hidden'
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.18)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
                flexShrink: 0
              }}
            >
              <Trash2 size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: '#EF4444'
                  }}
                >
                  Admin Action
                </span>
                <span style={{ fontSize: '0.7rem', color: textSecondary }}>FLOCARDS System</span>
              </div>
              <h4 style={{ margin: '2px 0 0', fontSize: '0.94rem', fontWeight: 700, color: textPrimary }}>
                {title}
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            title="Dismiss"
            style={{
              background: 'none',
              border: 'none',
              color: textSecondary,
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Item Preview Card */}
        {itemName && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: itemBg,
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertTriangle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: textPrimary,
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {itemName}
            </span>
          </div>
        )}

        {/* Message */}
        <p style={{ margin: 0, fontSize: '0.8rem', color: textSecondary, lineHeight: 1.45 }}>
          {message}
        </p>

        {/* Action Buttons: Cancel and OK */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: isLight ? '1px solid #E5E7EB' : '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: isLight ? '#F3F4F6' : 'rgba(255, 255, 255, 0.06)',
              color: textPrimary,
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {cancelLabel}
          </button>

          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#EF4444',
              backgroundImage: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              color: '#FFFFFF',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
              transition: 'all 0.15s ease'
            }}
          >
            <Check size={14} />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
