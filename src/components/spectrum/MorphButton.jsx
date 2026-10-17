/* ==========================================================================
   SPECTRUM UI - MORPH BUTTON COMPONENT
   Interactive button that fluidly transitions between idle, loading, and success.
   ========================================================================== */
import React from 'react';
import Spinner from './SpinnerDemo';
import { Check } from 'lucide-react';

export default function MorphButton({
  children,
  onClick,
  status = 'idle', // 'idle' | 'loading' | 'success' | 'error'
  disabled = false,
  variant = 'primary', // 'primary' | 'secondary' | 'danger'
  style = {},
  className = '',
  type = 'button'
}) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  const baseBg = isDanger
    ? '#DC4545'
    : isPrimary
    ? '#6B00FF'
    : '#F2ECFF';

  const textColor = isDanger || isPrimary ? '#FFFFFF' : '#6B00FF';

  return (
    <button
      type={type}
      disabled={disabled || status === 'loading'}
      onClick={onClick}
      className={`spectrum-morph-btn ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: status === 'loading' ? '10px 24px' : '10px 20px',
        borderRadius: '10px',
        border: 'none',
        background: status === 'success' ? '#16A36A' : baseBg,
        color: status === 'success' ? '#FFFFFF' : textColor,
        fontWeight: 600,
        fontSize: '0.88rem',
        cursor: disabled || status === 'loading' ? 'not-allowed' : 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isPrimary ? '0 4px 14px rgba(107, 0, 255, 0.25)' : 'none',
        minHeight: '42px',
        ...style
      }}
    >
      {status === 'loading' && <Spinner size={18} color="#FFFFFF" />}
      {status === 'success' && <Check size={18} />}
      {status !== 'loading' && status !== 'success' && children}
    </button>
  );
}
