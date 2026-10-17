/* ==========================================================================
   FLOCARD NAVIGATION BAR
   Responsive header with mobile drawer, brand logo, and quick role switcher.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, User, Shield, LogOut, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ currentPath = '/' }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin, isCustomer, logout, switchPersona } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen]);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Cards', href: '/cards' },
    { label: 'Digital Profiles', href: '/digital-profiles' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' }
  ];

  return (
    <>
      <header
        className={`flocard-header ${scrolled ? 'header-scrolled' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'var(--header-height)',
          zIndex: 100,
          transition: 'all 0.3s ease',
          background: scrolled ? 'rgba(8, 6, 13, 0.88)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(48, 36, 61, 0.6)' : '1px solid transparent'
        }}
      >
        <div
          className="container"
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Brand Logo */}
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none'
            }}
          >
            <img
              src="/assets/logo-light.png"
              alt="FLOCARD"
              style={{ height: '28px', width: 'auto', display: 'block', objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline';
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.45rem',
                letterSpacing: '-0.02em',
                color: '#ffffff',
                display: 'none'
              }}
            >
              <span style={{ color: 'var(--accent-purple)' }}>FLO</span>CARD
            </span>
          </a>

          {/* Desktop Navigation Links */}
          <nav
            className="desktop-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '28px'
            }}
          >
            {navLinks.map((link) => {
              const active = currentPath === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: 500,
                    color: active ? 'var(--light-lavender)' : 'var(--text-secondary)',
                    transition: 'color 0.2s ease',
                    position: 'relative',
                    padding: '6px 0'
                  }}
                  onMouseEnter={(e) => (e.target.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.target.style.color = active ? 'var(--light-lavender)' : 'var(--text-secondary)')}
                >
                  {link.label}
                  {active && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: 'var(--accent-purple)',
                        borderRadius: '2px'
                      }}
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div
            className="desktop-actions"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}
          >
            {/* Customer Account & Sign In */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a
                  href="/account"
                  style={{
                    background: 'rgba(23, 16, 32, 0.9)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-full)',
                    padding: '7px 14px',
                    color: 'var(--light-lavender)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <User size={14} color="var(--accent-purple)" />
                  <span>{user.name ? user.name.split(' ')[0] : 'Account'}</span>
                </a>
                <button
                  type="button"
                  onClick={logout}
                  title="Sign Out"
                  style={{
                    background: 'rgba(23, 16, 32, 0.7)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-full)',
                    padding: '7px 10px',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <a
                href="/login"
                style={{
                  background: 'rgba(107, 0, 255, 0.15)',
                  border: '1px solid rgba(107, 0, 255, 0.45)',
                  borderRadius: 'var(--radius-full)',
                  padding: '7px 16px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(107, 0, 255, 0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(107, 0, 255, 0.15)'; }}
              >
                <User size={14} color="var(--accent-purple)" />
                <span>Sign In</span>
              </a>
            )}

            {/* Primary Customize CTA */}
            <a href="/designer" className="btn btn-primary btn-sm">
              <span>Customize Your Card</span>
              <ArrowRight size={15} />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            style={{
              display: 'none',
              background: 'rgba(23, 16, 32, 0.9)',
              border: '1px solid var(--border-color)',
              color: '#ffffff',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div
          className="mobile-drawer"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 6, 13, 0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 99,
            padding: '100px 24px 32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflowY: 'auto'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  fontSize: '1.25rem',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  color: currentPath === link.href ? 'var(--light-lavender)' : '#ffffff',
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(48, 36, 61, 0.4)'
                }}
              >
                {link.label}
              </a>
            ))}

            <div style={{ height: '10px' }} />

            {/* Portal Links on Mobile */}
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px' }}>
                <a
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: 'var(--light-lavender)',
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  <User size={18} color="var(--accent-purple)" />
                  <span>My Account ({user.name || 'Member'})</span>
                </a>
                <button
                  type="button"
                  onClick={() => { logout(); setMobileOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'none',
                    border: 'none',
                    color: '#EF4444',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '8px' }}>
                <a
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#ffffff',
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  <User size={18} color="var(--accent-purple)" />
                  <span>Customer Sign In</span>
                </a>
                <a
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.92rem',
                    textDecoration: 'none'
                  }}
                >
                  <ArrowRight size={16} />
                  <span>Create Account</span>
                </a>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' }}>
            <a
              href="/designer"
              className="btn btn-primary btn-lg"
              onClick={() => setMobileOpen(false)}
              style={{ width: '100%' }}
            >
              <span>Design Your Card</span>
              <ArrowRight size={18} />
            </a>

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              FLOCARD — One Tap. Every Connection.
            </p>
          </div>
        </div>
      )}

      {/* Header responsive styling */}
      <style>{`
        @media (max-width: 992px) {
          .desktop-nav, .desktop-actions {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
