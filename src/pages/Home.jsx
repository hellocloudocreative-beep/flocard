/* ==========================================================================
   FLOCARD HOMEPAGE — CINEMATIC SPACE HORIZON & PRODUCT SHOWCASE
   Supports Dark & Light themes with seamless planetary aesthetics.
   ========================================================================== */

import React, { useState } from 'react';
import { ArrowRight, Sparkles, Radio, Layers, Users, ShieldCheck, CheckCircle2, ChevronRight, Smartphone, Eye, ExternalLink, Zap } from 'lucide-react';
import Card3DPreview from '../components/Card3DPreview';
import PhoneProfileMockup from '../components/PhoneProfileMockup';
import CompactProfileCard from '../components/profile/CompactProfileCard';
import GradientASCII from '../components/GradientASCII';
import { BRAND, EDITIONS, HOW_IT_WORKS_STEPS } from '../lib/constants';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrencyINR } from '../lib/storage';

export default function Home() {
  const { profiles, getProductByEdition, demoConfig } = useData();
  const { isLight } = useTheme();

  const demoProfile = {
    ...(profiles.find(p => p.slug === 'akhil') || profiles[0] || {}),
    name: demoConfig?.name || 'Your Name',
    role: demoConfig?.role || 'Your Role',
    tagline: demoConfig?.tagline || 'Your Tagline',
    company: demoConfig?.company || 'Your Company',
    avatar: demoConfig?.avatar || '',
    logo: demoConfig?.logo || '',
    phone: demoConfig?.phone || '+91 97782 78522',
    email: demoConfig?.email || 'contact@flocard.in',
    website: demoConfig?.website || 'https://flocard.in',
    cardFinish: demoConfig?.cardFinish || 'purple'
  };

  const metalProduct = getProductByEdition('metal') || EDITIONS.metal;
  const goldProduct = getProductByEdition('gold') || EDITIONS.gold;
  const platinumProduct = getProductByEdition('platinum') || EDITIONS.platinum;
  const purpleProduct = getProductByEdition('purple') || EDITIONS.purple;

  return (
    <div className="homepage-wrapper" style={{ overflowX: 'hidden' }}>
      
      {/* ======================================================================
          HERO SECTION — CINEMATIC PLANETARY HORIZON & FLOATING CARDS
          ====================================================================== */}
      {/* Clean Static Hero Background (Dark-Purple / Obsidian branding, zero particles or canvas loops) */}
      <section
        className="hero-section"
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingTop: 'calc(var(--header-height) + 24px)',
          paddingBottom: '80px',
          overflow: 'hidden',
          background: isLight
            ? 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(168, 85, 247, 0.12) 0%, rgba(248, 247, 252, 0) 70%), #f8f7fc'
            : 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(121, 40, 202, 0.22) 0%, rgba(7, 4, 13, 0) 70%), radial-gradient(circle 600px at 50% 25%, rgba(67, 56, 202, 0.12) 0%, rgba(7, 4, 13, 0) 70%), #07040d'
        }}
      >
        {/* Animated Horizon GradientASCII Background */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            pointerEvents: 'none',
            opacity: isLight ? 0.35 : 0.75
          }}
        >
          <GradientASCII
            colors={["#731ed8", "#f6f8ff", "#cda5ff", "#7038f8"]}
            shape="horizon"
            characters=" .·•●"
            cellSize={18}
            density={0.8}
          />
        </div>

        {/* Subtle Ambient Violet Glow Accent */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '12%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(90vw, 800px)',
            height: '380px',
            background: isLight
              ? 'radial-gradient(circle, rgba(168, 85, 247, 0.14) 0%, rgba(255, 255, 255, 0) 70%)'
              : 'radial-gradient(circle, rgba(121, 40, 202, 0.22) 0%, rgba(7, 4, 13, 0) 70%)',
            filter: 'blur(60px)',
            zIndex: 1,
            pointerEvents: 'none',
            transition: 'background 0.3s ease'
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 3 }}>
          {/* Eyebrow badge */}
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <div className="badge-tag" style={{ padding: '6px 18px', fontSize: '0.78rem' }}>
              <Sparkles size={13} color="var(--primary-purple)" />
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
                textTransform: 'uppercase',
                color: 'var(--text-primary)'
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
              marginBottom: '48px'
            }}
          >
            <a href="/designer" className="btn btn-primary btn-lg" style={{ boxShadow: '0 6px 24px rgba(107, 0, 255, 0.4)' }}>
              <span>Design Your Card</span>
              <ArrowRight size={18} />
            </a>

            <a href="/cards" className="btn btn-secondary btn-lg">
              <span>Explore Collection</span>
            </a>
          </div>

          {/* Hero Cards Artwork Display (Front & Back Pair Side-by-Side) */}
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
              gap: '36px'
            }}
          >
            {/* Front Card Preview */}
            <div
              className="hero-card-left"
              style={{
                filter: isLight 
                  ? 'drop-shadow(0 20px 45px rgba(76, 29, 149, 0.18))' 
                  : 'drop-shadow(0 20px 45px rgba(0, 0, 0, 0.7))',
                transition: 'all 0.4s ease'
              }}
            >
              <Card3DPreview
                edition="purple"
                width={390}
                initialSide="front"
                allowFlip={true}
                config={{
                  front: {
                    name: (demoConfig?.name || 'YOUR NAME').toUpperCase(),
                    role: (demoConfig?.role || 'YOUR ROLE').toUpperCase(),
                    tagline: demoConfig?.tagline || 'Your Tagline'
                  },
                  customerLogo: { url: demoConfig?.logo || null }
                }}
              />
            </div>

            {/* Back Card Preview */}
            <div
              className="hero-card-right"
              style={{
                filter: isLight 
                  ? 'drop-shadow(0 20px 45px rgba(76, 29, 149, 0.18))' 
                  : 'drop-shadow(0 20px 45px rgba(0, 0, 0, 0.7))',
                transition: 'all 0.4s ease'
              }}
            >
              <Card3DPreview
                edition="purple"
                width={390}
                initialSide="back"
                allowFlip={true}
                config={{
                  back: {
                    brandUrl: `flocard.in/${(demoConfig?.name || 'yourname').toLowerCase().replace(/\s+/g, '')}`
                  }
                }}
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
          background: 'var(--elevated-surface)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '32px 0',
          position: 'relative',
          zIndex: 4,
          transition: 'background-color 0.25s ease, border-color 0.25s ease'
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
                  background: 'rgba(107, 0, 255, 0.15)',
                  border: '1px solid var(--border-highlight)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-purple)',
                  flexShrink: 0
                }}
              >
                <Radio size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>NFC Enabled</h4>
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
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>Premium Design</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Gold, Platinum & Purple</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3b82f6',
                  flexShrink: 0
                }}
              >
                <Smartphone size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>Digital Profile</h4>
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
                  color: '#10b981',
                  flexShrink: 0
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>Professional Identity</h4>
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
              <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                CHOOSE <span className="text-gradient-purple">YOUR STYLE</span>
              </h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '520px' }}>
                Four premium designs. Same powerful technology. Find the style that fits your personal and corporate brand.
              </p>
            </div>

            <a href="/cards" className="btn btn-secondary">
              <span>View All Cards</span>
              <ArrowRight size={16} />
            </a>
          </div>

          {/* Cards Grid: Platinum, Purple, Gold, Metal */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px 24px', paddingTop: '18px', alignItems: 'stretch' }}>
            {/* 1. Platinum Edition */}
            <div
              className="glass-panel"
              style={{
                padding: '24px 16px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: '16px',
                height: '100%',
                transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(203, 213, 225, 0.6)';
                e.currentTarget.style.transform = 'translateY(-6px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div style={{ marginBottom: '24px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Card3DPreview edition="platinum" width={248} allowFlip={true} />
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#CBD5E1', marginBottom: '4px' }}>
                  PLATINUM EDITION
                </div>
                <h3 style={{ fontSize: '1.22rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: '8px' }}>
                  {platinumProduct.name || EDITIONS.platinum.name}
                </h3>

                {/* Authoritative Price Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                  {formatCurrencyINR(platinumProduct.price) ? (
                    <>
                      <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {formatCurrencyINR(platinumProduct.price)}
                      </span>
                      {platinumProduct.comparePrice && platinumProduct.comparePrice > platinumProduct.price && (
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          {formatCurrencyINR(platinumProduct.comparePrice)}
                        </span>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F59E0B' }}>
                      Price coming soon
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '18px' }}>
                  {platinumProduct.description || EDITIONS.platinum.description}
                </p>
              </div>
              <a
                href="/designer?edition=platinum"
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  padding: '11px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>Customize Platinum Card</span>
                <ArrowRight size={15} />
              </a>
            </div>

            {/* 2. Purple Edition (Signature & Most Popular) */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-6px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {/* Floating Most Popular Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '-13px',
                  right: '24px',
                  background: 'linear-gradient(135deg, var(--primary-purple), var(--deep-violet))',
                  padding: '5px 14px',
                  borderRadius: '9999px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: '#ffffff',
                  boxShadow: '0 4px 16px rgba(107, 0, 255, 0.45), 0 0 0 1px rgba(168, 85, 247, 0.4)',
                  zIndex: 30,
                  pointerEvents: 'none'
                }}
              >
                <Sparkles size={12} />
                <span>Most Popular</span>
              </div>

              <div
                className="glass-panel glass-panel-glow"
                style={{
                  padding: '24px 16px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '16px',
                  borderColor: isLight ? 'rgba(107, 0, 255, 0.35)' : 'rgba(168, 85, 247, 0.5)',
                  background: isLight 
                    ? '#FFFFFF' 
                    : 'linear-gradient(180deg, rgba(23, 16, 32, 0.9) 0%, rgba(32, 11, 59, 0.4) 100%)',
                  position: 'relative',
                  height: '100%',
                  flex: 1,
                  overflow: 'visible',
                  transition: 'box-shadow 0.3s ease'
                }}
              >
                <div>
                  <div style={{ marginBottom: '24px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Card3DPreview edition="purple" width={248} allowFlip={true} />
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A855F7', marginBottom: '4px' }}>
                    PURPLE EDITION
                  </div>
                  <h3 style={{ fontSize: '1.22rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: '8px' }}>
                    {purpleProduct.name || EDITIONS.purple.name}
                  </h3>

                  {/* Authoritative Price Display */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                    {formatCurrencyINR(purpleProduct.price) ? (
                      <>
                        <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {formatCurrencyINR(purpleProduct.price)}
                        </span>
                        {purpleProduct.comparePrice && purpleProduct.comparePrice > purpleProduct.price && (
                          <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            {formatCurrencyINR(purpleProduct.comparePrice)}
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F59E0B' }}>
                        Price coming soon
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '18px' }}>
                    {purpleProduct.description || EDITIONS.purple.description}
                  </p>
                </div>
                <a
                  href="/designer?edition=purple"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    padding: '11px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>Customize Purple Card</span>
                  <ArrowRight size={15} />
                </a>
              </div>
            </div>

            {/* 3. Gold Edition */}
            <div
              className="glass-panel"
              style={{
                padding: '24px 16px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: '16px',
                height: '100%',
                transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(233, 199, 102, 0.6)';
                e.currentTarget.style.transform = 'translateY(-6px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div style={{ marginBottom: '24px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Card3DPreview edition="gold" width={248} allowFlip={true} />
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#E9C766', marginBottom: '4px' }}>
                  GOLD EDITION
                </div>
                <h3 style={{ fontSize: '1.22rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: '8px' }}>
                  {goldProduct.name || EDITIONS.gold.name}
                </h3>
                
                {/* Authoritative Price Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                  {formatCurrencyINR(goldProduct.price) ? (
                    <>
                      <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {formatCurrencyINR(goldProduct.price)}
                      </span>
                      {goldProduct.comparePrice && goldProduct.comparePrice > goldProduct.price && (
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          {formatCurrencyINR(goldProduct.comparePrice)}
                        </span>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F59E0B' }}>
                      Price coming soon
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '18px' }}>
                  {goldProduct.description || EDITIONS.gold.description}
                </p>
              </div>
              <a
                href="/designer?edition=gold"
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  padding: '11px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>Customize Gold Card</span>
                <ArrowRight size={15} />
              </a>
            </div>

            {/* 4. Metal Edition */}
            <div
              className="glass-panel"
              style={{
                padding: '24px 16px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: '16px',
                height: '100%',
                transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(203, 213, 225, 0.6)';
                e.currentTarget.style.transform = 'translateY(-6px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div style={{ marginBottom: '24px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Card3DPreview edition="metal" width={248} allowFlip={true} />
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#CBD5E1', marginBottom: '4px' }}>
                  METAL EDITION
                </div>
                <h3 style={{ fontSize: '1.22rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: '8px' }}>
                  {metalProduct.name || EDITIONS.metal.name}
                </h3>

                {/* Authoritative Price Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                  {formatCurrencyINR(metalProduct.price) ? (
                    <>
                      <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {formatCurrencyINR(metalProduct.price)}
                      </span>
                      {metalProduct.comparePrice && metalProduct.comparePrice > metalProduct.price && (
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          {formatCurrencyINR(metalProduct.comparePrice)}
                        </span>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F59E0B' }}>
                      Price coming soon
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '18px' }}>
                  {metalProduct.description || EDITIONS.metal.description}
                </p>
              </div>
              <a
                href="/designer?edition=metal"
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  padding: '11px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>Customize Metal Card</span>
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
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)',
          position: 'relative',
          transition: 'background-color 0.25s ease'
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
              <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
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
                      color: 'var(--primary-purple)'
                    }}
                  >
                    {stepItem.step}
                  </span>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(107, 0, 255, 0.12)',
                      border: '1px solid var(--border-highlight)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-purple)'
                    }}
                  >
                    <Zap size={18} />
                  </div>
                </div>

                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: 'clamp(24px, 5vw, 64px)',
              alignItems: 'center'
            }}
          >
            {/* Left: Shiny Card Demo Showcase (Luxury ReflectiveCard) */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '580px', alignItems: 'center' }}>
              <CompactProfileCard
                profile={demoProfile}
                onExpand={() => window.open(`/p/${demoProfile?.slug || 'akhil'}`, '_blank')}
                isLight={isLight}
              />
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
                  marginBottom: '18px',
                  color: 'var(--text-primary)'
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
                    <CheckCircle2 size={18} color="var(--primary-purple)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item}</span>
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
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="badge-tag" style={{ marginBottom: '14px' }}>
            NFC HARDWARE SIMULATOR
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', textTransform: 'uppercase', marginBottom: '14px', color: 'var(--text-primary)' }}>
            TEST THE <span className="text-gradient-purple">ONE-TAP EXPERIENCE</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 32px' }}>
            Curious how NFC tap works? Click the simulator below to experience how a physical card connects instantly via permanent routing link <code style={{ color: 'var(--primary-purple)', fontWeight: 600 }}>/t/flc-akhil-992</code>!
          </p>

          <div
            className="glass-panel"
            style={{
              maxWidth: '500px',
              margin: '0 auto',
              padding: '36px',
              position: 'relative'
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary-purple), var(--deep-violet))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  boxShadow: '0 0 30px rgba(107, 0, 255, 0.45)'
                }}
              >
                <Radio size={32} color="#ffffff" className="animate-pulse-glow" />
              </div>
            </div>

            <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
              NFC Contactless Antenna Ready
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Permanent Redirect Tag: <strong style={{ color: 'var(--primary-purple)' }}>flc-akhil-992</strong>
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
            background: isLight 
              ? 'radial-gradient(ellipse, rgba(167, 139, 250, 0.25) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(107, 0, 255, 0.3) 0%, transparent 70%)',
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
              marginBottom: '18px',
              color: 'var(--text-primary)'
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
