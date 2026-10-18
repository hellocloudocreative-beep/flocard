/* ==========================================================================
   FLOCARD AI CONCIERGE — DEDICATED FULL-PAGE EXPERIENCE (/ai-concierge)
   ========================================================================== */

import React from 'react';
import AiConciergeView from '../components/ai/AiConciergeView';
import { Sparkles, ArrowLeft, ShieldCheck, Zap } from 'lucide-react';

export default function AiConciergePage() {
  return (
    <div style={{ paddingTop: 'calc(var(--header-height) + 20px)', paddingBottom: '60px', minHeight: '90vh' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        {/* Breadcrumb / Top Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.84rem',
              color: 'var(--text-secondary)',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to FLOCARD</span>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} color="#10B981" />
              <span>Real Hardware Catalog</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Zap size={14} color="var(--accent-purple)" />
              <span>Designer Integrated</span>
            </span>
          </div>
        </div>

        {/* Master AI Concierge Container */}
        <AiConciergeView isFullPage={true} />
      </div>
    </div>
  );
}
