/* ==========================================================================
   SPECTRUM UI - ANIMATED SWITCH COMPONENT
   Smooth pill toggle with spring-like transition and accessible states.
   ========================================================================== */
import React from 'react';

export default function AnimatedSwitch({
  checked = false,
  onChange,
  disabled = false,
  label,
  description,
  activeColor = '#6B00FF',
  size = 'medium'
}) {
  const isSmall = size === 'small';
  const width = isSmall ? 36 : 46;
  const height = isSmall ? 20 : 26;
  const thumbSize = isSmall ? 16 : 20;
  const offset = isSmall ? 16 : 20;

  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none'
      }}
    >
      <div
        role="switch"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && onChange && onChange(!checked)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onChange && onChange(!checked);
          }
        }}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: `${height}px`,
          backgroundColor: checked ? activeColor : '#D1D5DB',
          padding: '3px',
          transition: 'background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          boxShadow: checked ? `0 0 10px ${activeColor}44` : 'none'
        }}
      >
        <div
          style={{
            width: `${thumbSize}px`,
            height: `${thumbSize}px`,
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            transform: checked ? `translateX(${offset}px)` : 'translateX(0px)',
            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </div>

      {(label || description) && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {label && (
            <span style={{ fontSize: isSmall ? '0.8rem' : '0.88rem', fontWeight: 600, color: '#191522' }}>
              {label}
            </span>
          )}
          {description && (
            <span style={{ fontSize: '0.75rem', color: '#777184' }}>
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}
