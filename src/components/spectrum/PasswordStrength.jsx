/* ==========================================================================
   SPECTRUM UI - PASSWORD STRENGTH METER
   Visual indicator of password complexity with entropy bars and criteria.
   ========================================================================== */
import React from 'react';

export default function PasswordStrength({ password = '' }) {
  const getStrength = (pwd) => {
    let score = 0;
    if (!pwd) return { score: 0, label: '', color: '#E8E3EF' };
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: '#DC4545' };
      case 2:
        return { score: 2, label: 'Fair', color: '#E9A23B' };
      case 3:
        return { score: 3, label: 'Good', color: '#6B00FF' };
      case 4:
        return { score: 4, label: 'Strong', color: '#16A36A' };
      default:
        return { score: 0, label: 'Too short', color: '#DC4545' };
    }
  };

  const strength = getStrength(password);

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', height: '4px', marginBottom: '6px' }}>
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            style={{
              flex: 1,
              height: '100%',
              borderRadius: '2px',
              backgroundColor: step <= strength.score ? strength.color : '#E8E3EF',
              transition: 'background-color 0.25s ease'
            }}
          />
        ))}
      </div>
      {password && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#777184' }}>
          <span>Security level:</span>
          <span style={{ fontWeight: 600, color: strength.color }}>{strength.label}</span>
        </div>
      )}
    </div>
  );
}
