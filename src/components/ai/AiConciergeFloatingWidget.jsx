/* ==========================================================================
   FLOCARD AI CONCIERGE — FLOATING ASSISTANT WIDGET
   Renders a persistent, clean purple glowing floating button in the bottom corner.
   Clicking opens a sliding panel on desktop and responsive modal on mobile.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { Sparkles, X, MessageSquare } from 'lucide-react';
import AiConciergeView from './AiConciergeView';

export default function AiConciergeFloatingWidget({ currentPath = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);

  // If on /ai-concierge full page or public profile / NFC redirect, don't show floating widget
  if (currentPath === '/ai-concierge' || currentPath.startsWith('/p/') || currentPath.startsWith('/t/')) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <div
        className="flocard-ai-floating-trigger"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 990,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        {/* Subtle Greeting Pill on first load */}
        {!isOpen && !hasPrompted && (
          <div
            onClick={() => {
              setIsOpen(true);
              setHasPrompted(true);
            }}
            style={{
              backgroundColor: 'var(--card-surface)',
              border: '1px solid var(--border-highlight)',
              boxShadow: 'var(--shadow-card)',
              borderRadius: '9999px',
              padding: '8px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              animation: 'floatGlow 3s ease-in-out infinite'
            }}
          >
            <Sparkles size={14} color="var(--accent-purple)" />
            <span>Need advice? Ask AI Concierge</span>
          </div>
        )}

        {/* Floating Button */}
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setHasPrompted(true);
          }}
          aria-label={isOpen ? "Close FLOCARD AI Concierge" : "Open FLOCARD AI Concierge"}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-purple) 0%, #8B5CF6 100%)',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 8px 30px rgba(107, 0, 255, 0.5), 0 0 15px rgba(168, 85, 247, 0.4)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s ease',
            outline: 'none'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(107, 0, 255, 0.65)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(107, 0, 255, 0.5), 0 0 15px rgba(168, 85, 247, 0.4)';
          }}
        >
          {isOpen ? <X size={22} /> : <Sparkles size={22} />}
        </button>
      </div>

      {/* Floating Sliding Panel / Dialog */}
      {isOpen && (
        <div
          className="flocard-ai-drawer-container"
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '24px',
            width: '440px',
            maxWidth: 'calc(100vw - 32px)',
            height: '620px',
            maxHeight: 'calc(100vh - 120px)',
            zIndex: 991,
            animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <AiConciergeView onClose={() => setIsOpen(false)} isFullPage={false} />
        </div>
      )}
    </>
  );
}
