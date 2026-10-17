/* ==========================================================================
   SPECTRUM UI - AVATAR STACK COMPONENT
   Overlapping avatar row with initials fallback, border clipping, and +N pill.
   ========================================================================== */
import React from 'react';

export default function AvatarStack({
  users = [],
  max = 4,
  size = 32,
  borderColor = '#FFFFFF'
}) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
      {visible.map((user, idx) => {
        const initials = user.name
          ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
          : 'U';

        return (
          <div
            key={user.id || user.email || idx}
            title={user.name || user.email}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              marginLeft: idx > 0 ? `-${Math.round(size * 0.28)}px` : 0,
              border: `2px solid ${borderColor}`,
              boxSizing: 'content-box',
              overflow: 'hidden',
              backgroundColor: '#6B00FF',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${Math.round(size * 0.38)}px`,
              fontWeight: 700,
              position: 'relative',
              zIndex: visible.length - idx,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)'
            }}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || 'User'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
        );
      })}

      {remaining > 0 && (
        <div
          title={`${remaining} more`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            marginLeft: `-${Math.round(size * 0.28)}px`,
            border: `2px solid ${borderColor}`,
            boxSizing: 'content-box',
            backgroundColor: '#1B1425',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${Math.round(size * 0.34)}px`,
            fontWeight: 700,
            zIndex: 0,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)'
          }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
