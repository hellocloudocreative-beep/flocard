/* ==========================================================================
   SPECTRUM UI - HOLD TO CONFIRM BUTTON
   Long-press button with radial progress animation to prevent accidental actions.
   ========================================================================== */
import React, { useState, useRef, useEffect } from 'react';

export default function HoldToConfirm({
  onConfirm,
  holdDuration = 1500,
  children = 'Hold to Confirm',
  confirmText = 'Confirmed!',
  variant = 'danger', // 'danger' | 'primary' | 'warning'
  disabled = false,
  className = ''
}) {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const timerRef = useRef(null);
  const startRef = useRef(0);

  const colors = {
    danger: { bg: '#DC4545', text: '#FFFFFF', track: 'rgba(220, 69, 69, 0.2)' },
    primary: { bg: '#6B00FF', text: '#FFFFFF', track: 'rgba(107, 0, 255, 0.2)' },
    warning: { bg: '#E9A23B', text: '#FFFFFF', track: 'rgba(233, 162, 59, 0.2)' }
  }[variant] || { bg: '#DC4545', text: '#FFFFFF', track: 'rgba(220, 69, 69, 0.2)' };

  const startHold = () => {
    if (disabled || isConfirmed) return;
    setIsHolding(true);
    startRef.current = Date.now();

    const update = () => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(100, (elapsed / holdDuration) * 100);
      setProgress(pct);

      if (pct >= 100) {
        setIsConfirmed(true);
        setIsHolding(false);
        if (onConfirm) onConfirm();
        setTimeout(() => {
          setIsConfirmed(false);
          setProgress(0);
        }, 2000);
      } else {
        timerRef.current = requestAnimationFrame(update);
      }
    };

    timerRef.current = requestAnimationFrame(update);
  };

  const cancelHold = () => {
    if (isConfirmed) return;
    setIsHolding(false);
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, []);

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '10px 20px',
        borderRadius: '10px',
        border: isConfirmed ? '1px solid #16A36A' : (variant === 'danger' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color, rgba(168, 85, 247, 0.3))'),
        background: isConfirmed ? '#16A36A' : colors.track,
        color: isConfirmed ? '#FFFFFF' : (variant === 'danger' ? '#F87171' : 'var(--text-primary, #FFFFFF)'),
        fontWeight: 600,
        fontSize: '0.86rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        transition: 'background 0.2s ease, transform 0.1s ease',
        transform: isHolding ? 'scale(0.98)' : 'scale(1)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '140px'
      }}
    >
      {/* Fill bar */}
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${progress}%`,
          backgroundColor: colors.bg,
          opacity: 0.35,
          transition: isHolding ? 'none' : 'width 0.2s ease',
          pointerEvents: 'none'
        }}
      />
      <span style={{ position: 'relative', zIndex: 1 }}>
        {isConfirmed ? confirmText : children}
      </span>
    </button>
  );
}
