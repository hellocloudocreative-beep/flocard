/* ==========================================================================
   FLOCARD HOMEPAGE — CINEMATIC SPACE HORIZON & PRODUCT SHOWCASE
   Faithfully implements the QUANTUM reference aesthetic adapted for FLOCARD.
   ========================================================================== */

import React, { useState } from 'react';
import { ArrowRight, Sparkles, Radio, Layers, Users, ShieldCheck, CheckCircle2, ChevronRight, Smartphone, Eye, ExternalLink, Zap } from 'lucide-react';
import Card3DPreview from '../components/Card3DPreview';
import PhoneProfileMockup from '../components/PhoneProfileMockup';
import { BRAND, EDITIONS, HOW_IT_WORKS_STEPS } from '../lib/constants';
import { useData } from '../context/DataContext';

export default function Home() {
  const { profiles } = useData();
  const akhilProfile = profiles.find(p => p.slug === 'akhil') || profiles[0];
  const [activeEditionPreview, setActiveEditionPreview] = useState('purple');
  const [simulatedTap, setSimulatedTap] = useState(false);

  return (
    <div className="homepage-wrapper" style={{ overflowX: 'hidden' }}>
      
      {/* ======================================================================
          HERO SECTION — CINEMATIC PLANETARY HORIZON & FLOATING CARDS
          ====================================================================== */}
      <section
        className="hero-section"
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingTop: 'calc(var(--header-height) + 20px)',
          paddingBottom: '60px',
          overflow: 'hidden'
        }}
      >
        {/* Planetary Cosmic Background Image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/assets/hero-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            opacity: 0.75,
            zIndex: 0
          }}
        />

        {/* Deep Violet & Obsidian Atmospheric Gradients */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(8, 6, 13, 0.4) 0%, rgba(8, 6, 13, 0.2) 40%, rgba(8, 6, 13, 0.95) 90%, #08060D 100%)',
            zIndex: 1
          }}
        />

        {/* Ambient Nebula Light Flare */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '400px',
            background: 'radial-gradient(ellipse, rgba(168, 85, 247, 0.3) 0%, rgba(107, 0, 255, 0.15) 45%, transparent 75%)',
            filter: 'blur(40px)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 3 }}>
          {/* Eyebrow badge */}
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <div className="badge-tag" style={{ padding: '6px 16px' }}>
              <Sparkles size={12} color="var(--accent-purple)" />
              <span>{BRAND.heroEyebrow}</span>
            </div>
          </div>

          {/* Central Hero Headline */}
          <div style={{ textAlign: 'center', maxWidth: '880px', margin: '0 auto 20px' }}>
            <h1
              style={{
                fontSize: 'clamp(2.4rem, 5.5vw, 4.4rem)',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                lineHeight: 1.08,
                textTransform: 'uppercase'
              }}
            >
              YOUR IDENTITY.{' '}
              <span className="text-gradient-purple" style={{ display: 'block' }}>
                ONE TAP AWAY.
              </span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(1rem, 1.8vw, 1.25rem)',
                color: 'var(--text-secondary)',
                maxWidth: '640px',
                margin: '18px auto 0',
                lineHeight: 1.55
              }}
            >
              {BRAND.heroSubtitle}
            </p>
          </div>

          {/* Hero CTAs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              marginBottom: '44px'
            }}
          >
            <a href="/designer" className="btn btn-primary btn-lg">
              <span>Design Your Card</span>
              <ArrowRight size={18} />
            </a>

            <a href="/cards" className="btn btn-secondary btn-lg">
              <span>Explore Collection</span>
            </a>
          </div>

          {/* Hero Cards Artwork Display (Front & Back Pair in Perspective) */}
          <div
            className="hero-cards-showcase"
            style={{
              position: 'relative',
              maxWidth: '920px',
              margin: '0 auto',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '32px'
            }}
          >
            {/* Front Card Preview */}
            <div
              className="hero-card-left animate-float"
              style={{
                transform: 'rotate(-4deg) translateY(-10px)',
                transition: 'all 0.4s ease'
              }}
            >
              <Card3DPreview
                edition="purple"
                width={380}
                initialSide="front"
                allowFlip={true}
              />
            </div>

            {/* Back Card Preview (showing real scannable QR code to akhil profile) */}
            <div
              className="hero-card-right animate-float"
              style={{
                transform: 'rotate(3deg) translateY(10px)',
                animationDelay: '1.5s',
                transition: 'all 0.4s ease'
              }}
            >
              <Card3DPreview
                edition="purple"
                width={380}
                initialSide="back"
                allowFlip={true}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          FEATURE STRIP — 4 KEY PILLARS
          ====================================================================== */}
      <section
        style={{
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(13, 9, 21, 0.85)',
          backdropFilter: 'blur(16px)',
          padding: '32px 0',
          position: 'relative',
          zIndex: 4
        }}
      >
        <div className="container">
          <div className="grid-4" style={{ alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'rgba(107, 0, 255, 0.2)',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-purple)',
                  flexShrink: 0
                }}
              >
                <Radio size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#ffffff' }}>NFC Enabled</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>One tap sharing</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold-primary)',
                  flexShrink: 0
                }}
              >
                <Sparkles size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#ffffff' }}>Premium Design</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Gold, Platinum & Purple</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.18)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60a5fa',
                  flexShrink: 0
                }}
              >
                <Smartphone size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#ffffff' }}>Digital Profile</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Everything in one link</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399',
                  flexShrink: 0
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#ffffff' }}>Professional Identity</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Make a lasting impression</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          CARD COLLECTION SECTION — 3 SIGNATURE EDITIONS
          ====================================================================== */}
      <section
        id="collection"
        style={{
          padding: '100px 0',
          position: 'relative'
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '20px',
              marginBottom: '48px'
            }}
          >
            <div>
              <div className="badge-tag" style={{ marginBottom: '12px' }}>
                OUR COLLECTION
              </div>
              <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', textTransform: 'uppercase' }}>
                CHOOSE <span className="text-gradient-purple">YOUR STYLE</span>
              </h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '520px' }}>
                Three premium designs. Same powerful technology. Find the style that fits your personal and corporate brand.
              </p>
            </div>

            <a href="/cards" className="btn btn-secondary">
              <span>View All Cards</span>
              <ArrowRight size={16} />
            </a>
          </div>

          {/* Cards Grid */}
          <div className="grid-3" style={{ alignItems: 'stretch' }}>
            {/* Gold Edition */}
            <div
              className="glass-panel"
              style={{
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.3s ease, border-color 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)';
                e.currentTarget.style.transform = 'translateY(-6px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <Card3DPreview edition="gold" width={320} allowFlip={true} />
                </div>
                <h3 style={{ fontSize: '1.35rem', color: '#ffffff', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {EDITIONS.gold.name}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                  {EDITIONS.gold.description}
                </p>
              </div>
              <a href="/designer?edition=gold" className="btn btn-secondary" style={{ width: '100%' }}>
                <span>Customize Now</span>
                <ArrowRight size={15} />
              </a>
            </div>

            {/* Platinum Edition */}
            <div
              className="glass-panel"
              style={{
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.3s ease, border-color 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.5)';
                e.currentTarget.style.transform = 'translateY(-6px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <Card3DPreview edition="platinum" width={320} allowFlip={true} />
                </div>
                <h3 style={{ fontSize: '1.35rem', color: '#ffffff', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {EDITIONS.platinum.name}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                  {EDITIONS.platinum.description}
                </p>
              </div>
              <a href="/designer?edition=platinum" className="btn btn-secondary" style={{ width: '100%' }}>
                <span>Customize Now</span>
                <ArrowRight size={15} />
              </a>
            </div>

            {/* Purple Edition (Signature & Most Popular) */}
            <div
              className="glass-panel glass-panel-glow"
              style={{
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderColor: 'rgba(168, 85, 247, 0.5)',
                background: 'linear-gradient(180deg, rgba(23, 16, 32, 0.9) 0%, rgba(32, 11, 59, 0.4) 100%)',
                position: 'relative',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-6px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'linear-gradient(135deg, var(--primary-purple), var(--accent-purple))',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(107, 0, 255, 0.4)'
                }}
              >
                <Sparkles size={11} />
                <span>Most Popular</span>
              </div>

              <div>
                <div style={{ marginBottom: '24px' }}>
                  <Card3DPreview edition="purple" width={320} allowFlip={true} />
                </div>
                <h3 style={{ fontSize: '1.35rem', color: '#ffffff', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {EDITIONS.purple.name}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                  {EDITIONS.purple.description}
                </p>
              </div>
              <a href="/designer?edition=purple" className="btn btn-primary" style={{ width: '100%' }}>
                <span>Customize Now</span>
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          HOW IT WORKS SECTION — 4 SEAMLESS STEPS
          ====================================================================== */}
      <section
        style={{
          padding: '90px 0',
          background: 'linear-gradient(180deg, var(--bg-main) 0%, var(--bg-secondary) 100%)',
          position: 'relative'
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '20px',
              marginBottom: '54px'
            }}
          >
            <div>
              <div className="badge-tag" style={{ marginBottom: '12px' }}>
                HOW IT WORKS
              </div>
              <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', textTransform: 'uppercase' }}>
                SIMPLE. SMART. <span className="text-gradient-purple">POWERFUL.</span>
              </h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '540px' }}>
                Share your contact details, portfolio, and more with a single tap or QR code scan. No external apps required.
              </p>
            </div>

            <a href="/how-it-works" className="btn btn-secondary">
              <span>Learn More</span>
              <ArrowRight size={16} />
            </a>
          </div>

          {/* 4 Steps Row */}
          <div className="grid-4">
            {HOW_IT_WORKS_STEPS.map((stepItem) => (
              <div
                key={stepItem.step}
                className="glass-panel"
                style={{
                  padding: '28px 24px',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px'
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      color: 'var(--accent-purple)',
                      opacity: 0.8
                    }}
                  >
                    {stepItem.step}
                  </span>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(107, 0, 255, 0.2)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--light-lavender)'
                    }}
                  >
                    <Zap size={18} />
                  </div>
                </div>

                <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '8px' }}>
                  {stepItem.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {stepItem.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================================
          DIGITAL PROFILE SECTION — SMARTPHONE SHOWCASE & FEATURES
          ====================================================================== */}
      <section
        style={{
          padding: '100px 0',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '64px',
              alignItems: 'center'
            }}
          >
            {/* Left: Interactive Phone Mockup */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PhoneProfileMockup profile={akhilProfile} />
            </div>

            {/* Right: Digital Profile Description & Bullet Points */}
            <div>
              <div className="badge-tag" style={{ marginBottom: '16px' }}>
                DIGITAL PROFILES
              </div>
              <h2
                style={{
                  fontSize: 'clamp(2.2rem, 3.8vw, 3.2rem)',
                  textTransform: 'uppercase',
                  lineHeight: 1.15,
                  marginBottom: '18px'
                }}
              >
                MORE THAN JUST A <span className="text-gradient-purple">BUSINESS CARD</span>
              </h2>

              <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
                Your digital profile brings your professional identity to life with contact details, portfolio projects, social links, and real-time updates.
              </p>

              {/* Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '36px' }}>
                {[
                  'Custom profile link (flocard.in/p/yourname)',
                  'Contact details, phone, email & social links',
                  'Interactive portfolio, projects and services tabs',
                  '1-Tap direct vCard contact save to phonebook',
                  'Always accessible, edit anytime without re-printing card'
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle2 size={18} color="var(--accent-purple)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.95rem', color: '#ffffff' }}>{item}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <a href="/digital-profiles" className="btn btn-primary btn-lg">
                  <span>Explore Digital Profiles</span>
                  <ArrowRight size={18} />
                </a>

                <a href="/p/akhil" target="_blank" rel="noreferrer" className="btn btn-secondary btn-lg">
                  <span>View Live Demo Profile</span>
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          INTERACTIVE NFC TAP SIMULATOR
          ====================================================================== */}
      <section
        style={{
          padding: '80px 0',
          background: 'linear-gradient(180deg, #0d0915 0%, #08060d 100%)',
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="badge-tag" style={{ marginBottom: '14px' }}>
            NFC HARDWARE SIMULATOR
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', textTransform: 'uppercase', marginBottom: '14px' }}>
            TEST THE <span className="text-gradient-purple">ONE-TAP EXPERIENCE</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 32px' }}>
            Curious how NFC tap works? Click the simulator below to experience how a physical card connects instantly via permanent routing link <code style={{ color: 'var(--light-lavender)' }}>/t/flc-akhil-992</code>!
          </p>

          <div
            style={{
              maxWidth: '500px',
              margin: '0 auto',
              background: 'rgba(23, 16, 32, 0.9)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              position: 'relative'
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary-purple), var(--accent-purple))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  boxShadow: '0 0 30px rgba(107, 0, 255, 0.6)'
                }}
              >
                <Radio size={32} color="#ffffff" className="animate-pulse-glow" />
              </div>
            </div>

            <h4 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '8px' }}>
              NFC Contactless Antenna Ready
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Permanent Redirect Tag: <strong style={{ color: 'var(--light-lavender)' }}>flc-akhil-992</strong>
            </p>

            <a
              href="/t/flc-akhil-992"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
            >
              <span>Tap Phone Against Card</span>
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* ======================================================================
          CTA BANNER — DESIGN YOUR CARD
          ====================================================================== */}
      <section
        style={{
          padding: '110px 0',
          position: 'relative',
          textAlign: 'center',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '300px',
            background: 'radial-gradient(ellipse, rgba(107, 0, 255, 0.3) 0%, transparent 70%)',
            filter: 'blur(50px)',
            pointerEvents: 'none'
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <h2
            style={{
              fontSize: 'clamp(2.2rem, 4.2vw, 3.8rem)',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              marginBottom: '18px'
            }}
          >
            READY TO ELEVATE <span className="text-gradient-purple">YOUR NETWORK?</span>
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 36px' }}>
            Customize your card with precision artwork, preview in 3D, and deploy your smart digital identity today.
          </p>

          <a href="/designer" className="btn btn-primary btn-lg" style={{ padding: '18px 44px', fontSize: '1.1rem' }}>
            <span>Launch Card Designer</span>
            <ArrowRight size={20} />
          </a>
        </div>
      </section>
    </div>
  );
}
