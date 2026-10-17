/* ==========================================================================
   UI ARC - BOTTOM SHEET COMPONENT
   Mobile-first slide-up sheet with grabber, backdrop, and keyboard escape.
   ========================================================================== */
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function BottomSheet({
  open = false,
  onOpenChange,
  title,
  description,
  children,
  trigger
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        onOpenChange && onOpenChange(false);
      }
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <>
      {trigger && (
        <div onClick={() => onOpenChange && onOpenChange(true)} style={{ display: 'inline-block' }}>
          {trigger}
        </div>
      )}

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'center'
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => onOpenChange && onOpenChange(false)}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(8, 6, 13, 0.75)',
              backdropFilter: 'blur(4px)',
              animation: 'fadeBackdrop 0.25s ease'
            }}
          />

          {/* Sheet Surface */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#15101D',
              borderTopLeftRadius: '28px',
              borderTopRightRadius: '28px',
              border: '1px solid #30223F',
              borderBottom: 'none',
              boxShadow: '0 -20px 50px rgba(0, 0, 0, 0.5)',
              padding: '16px 24px 32px',
              maxHeight: '90vh',
              overflowY: 'auto',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              zIndex: 1
            }}
          >
            {/* Grabber handle */}
            <div
              style={{
                width: '40px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: '#30223F',
                margin: '0 auto 16px'
              }}
            />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                {title && (
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-heading, Sora)' }}>
                    {title}
                  </h3>
                )}
                {description && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#B8AEC8' }}>
                    {description}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onOpenChange && onOpenChange(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div>{children}</div>
          </div>

          <style>{`
            @keyframes fadeBackdrop {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}

export default BottomSheet;
