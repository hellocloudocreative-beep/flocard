/* ==========================================================================
   SPECTRUM UI - SPINNER DEMO & SPINNER COMPONENT
   ========================================================================== */
import React from 'react';

export function Spinner({ size = 20, color = 'currentColor', className = '' }) {
  return (
    <svg
      className={`spectrum-spinner ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.415, 31.415"
        style={{ opacity: 0.25 }}
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="16, 47"
      />
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
}

export function SpinnerDemo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#1B1425', borderRadius: '12px', border: '1px solid #30223F' }}>
      <Spinner size={16} color="#6B00FF" />
      <Spinner size={24} color="#A855F7" />
      <Spinner size={32} color="#FFFFFF" />
      <span style={{ fontSize: '0.85rem', color: '#B8AEC8' }}>Spectrum UI Loading States</span>
    </div>
  );
}

export default Spinner;
