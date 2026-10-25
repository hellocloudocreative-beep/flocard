/* ==========================================================================
   FLOCARD ABOUT PAGE (/about)
   Brand mission, craftsmanship, hardware engineering, and sustainability.
   ========================================================================== */

import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Heart, Leaf, Cpu } from 'lucide-react';
import { BRAND } from '../lib/constants';

export default function About() {
  return (
    <div style={{ paddingTop: 'calc(var(--header-height) + 40px)', paddingBottom: '100px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 60px' }}>
          <div className="badge-tag" style={{ marginBottom: '14px' }}>
            THE FLOCARD STORY
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', textTransform: 'uppercase', marginBottom: '16px' }}>
            REDEFINING <span className="text-gradient-purple">HUMAN CONNECTION</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Over 27 million paper business cards are printed every single day. 88% of them are thrown away within one week. We founded FLOCARD to replace waste with eternal, intelligent, tactile luxury.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid-3" style={{ marginBottom: '80px' }}>
          <div className="glass-panel" style={{ padding: '36px 28px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(107, 0, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-purple)', marginBottom: '20px' }}>
              <Cpu size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '10px' }}>Microchip Precision</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Every card is manufactured with high-frequency 13.56 MHz antenna coils, ultrasonic bonding, and multi-layer structural reinforcement.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '36px 28px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: '20px' }}>
              <Leaf size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '10px' }}>Net Carbon Negative</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              One FLOCARD replaces thousands of disposable paper cards throughout your entire career. Update your numbers and company anytime in the cloud.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '36px 28px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-primary)', marginBottom: '20px' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '10px' }}>Privacy By Design</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              No invasive tracking, no spyware, and no mandatory app installs. You own 100% of your data and control who connects with your network.
            </p>
          </div>
        </div>

        {/* Founder note */}
        <div className="glass-panel" style={{ padding: '48px 36px', maxWidth: '840px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', padding: '2px', background: 'linear-gradient(135deg, var(--primary-purple), var(--deep-violet))', margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.4rem', fontWeight: 700 }}>
            <span style={{ background: 'var(--primary-purple)', width: '100%', height: '100%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>FLC</span>
          </div>
          <blockquote style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '20px' }}>
            &ldquo;Networking shouldn&apos;t feel like handing someone a scrap of paper that will end up in the laundry. It should feel like a moment of true impact—effortless, memorable, and instant.&rdquo;
          </blockquote>
          <div style={{ fontWeight: 700, color: 'var(--primary-purple)' }}>FLOCARDS Leadership Team</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Connected Identity Systems, FLOCARDS Technologies</div>
        </div>
      </div>
    </div>
  );
}
