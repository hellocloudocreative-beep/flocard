/* ==========================================================================
   FLOCARD NAVIGATION BAR
   Supports Dark & Light themes, mobile drawer, brand logo switching,
   interactive theme toggle, and account status.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, User, LogOut, Sun, Moon, ChevronDown, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

export default function Navbar({ currentPath = '/' }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { theme, isDark, isLight, toggleTheme } = useTheme();
  const { profiles = [] } = useData();

  const userAvatar = user?.avatar || profiles.find(p => (user?.id && p.customerId === user.id) || (user?.email && p.email === user.email) || p.slug === 'akhil')?.avatar;

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
    { label: 'AI Concierge', href: '/ai-concierge', badge: 'AI' },
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
          transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
          background: scrolled ? 'var(--header-bg)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--header-border)' : '1px solid transparent',
          boxShadow: scrolled ? 'var(--shadow-soft)' : 'none'
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
          {/* Brand Logo - Theme-Aware */}
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
              src={isLight ? "/assets/logo-dark.png" : "/assets/logo-light.png"}
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
                color: 'var(--text-primary)',
                display: 'none'
              }}
            >
              <span style={{ color: 'var(--primary-purple)' }}>FLO</span>CARD
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
                    color: active ? 'var(--nav-active-color)' : 'var(--nav-link-color)',
                    transition: 'color 0.2s ease',
                    position: 'relative',
                    padding: '6px 0'
                  }}
                  onMouseEnter={(e) => (e.target.style.color = 'var(--nav-hover-color)')}
                  onMouseLeave={(e) => (e.target.style.color = active ? 'var(--nav-active-color)' : 'var(--nav-link-color)')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {link.badge && <Sparkles size={13} color="var(--accent-purple)" />}
                    {link.label}
                    {link.badge && (
                      <span
                        style={{
                          fontSize: '0.62rem',
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(107,0,255,0.25))',
                          border: '1px solid rgba(168,85,247,0.4)',
                          color: 'var(--accent-purple)',
                          fontWeight: 700,
                          letterSpacing: '0.5px'
                        }}
                      >
                        {link.badge}
                      </span>
                    )}
                  </span>
                  {active && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: 'var(--primary-purple)',
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
              gap: '12px'
            }}
          >
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
              title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
              style={{
                background: 'var(--theme-toggle-bg)',
                border: '1px solid var(--border-color)',
                color: 'var(--theme-toggle-color)',
                borderRadius: 'var(--radius-full)',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: 'var(--shadow-soft)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.borderColor = 'var(--primary-purple)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Customer Account & Sign In */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a
                  href="/dashboard"
                  style={{
                    background: 'var(--btn-sec-bg)',
                    border: '1px solid var(--btn-sec-border)',
                    borderRadius: 'var(--radius-full)',
                    padding: '7px 14px',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: 'var(--shadow-soft)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary-purple)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--btn-sec-border)')}
                >
                  {userAvatar ? (
                    <img src={userAvatar} alt="" style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <User size={14} color="var(--primary-purple)" />
                  )}
                  <span>{user.name ? user.name.split(' ')[0] : 'Account'}</span>
                  <ChevronDown size={13} color="var(--text-muted)" />
                </a>
                <button
                  type="button"
                  onClick={logout}
                  title="Sign Out"
                  style={{
                    background: 'var(--btn-sec-bg)',
                    border: '1px solid var(--btn-sec-border)',
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
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--btn-sec-border)'; }}
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <a
                href="/login"
                style={{
                  background: 'var(--btn-sec-bg)',
                  border: '1px solid var(--btn-sec-border)',
                  borderRadius: 'var(--radius-full)',
                  padding: '7px 16px',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--shadow-soft)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-purple)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--btn-sec-border)'; }}
              >
                <User size={14} color="var(--primary-purple)" />
                <span>Sign In</span>
              </a>
            )}

            {/* Primary Customize CTA */}
            <a href="/designer" className="btn btn-primary btn-sm">
              <span>Customize Your Card</span>
              <ArrowRight size={15} />
            </a>
          </div>

          {/* Mobile Right Controls: Theme Toggle + Menu Button */}
          <div className="mobile-actions" style={{ display: 'none', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
              style={{
                background: 'var(--theme-toggle-bg)',
                border: '1px solid var(--border-color)',
                color: 'var(--theme-toggle-color)',
                borderRadius: '8px',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
              style={{
                background: 'var(--btn-sec-bg)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div
          className="mobile-drawer"
          style={{
            position: 'fixed',
            inset: 0,
            background: isLight ? 'rgba(248, 247, 252, 0.98)' : 'rgba(8, 6, 13, 0.98)',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Quick theme switcher in mobile drawer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--elevated-surface)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                marginBottom: '8px'
              }}
            >
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Theme: {isLight ? 'Light Mode' : 'Dark Mode'}
              </span>
              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--primary-purple)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
                <span>Switch to {isDark ? 'Light' : 'Dark'}</span>
              </button>
            </div>

            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  fontSize: '1.25rem',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  color: currentPath === link.href ? 'var(--primary-purple)' : 'var(--text-primary)',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span
                    style={{
                      fontSize: '0.66rem',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(107,0,255,0.3))',
                      border: '1px solid var(--accent-purple)',
                      color: 'var(--accent-purple)',
                      fontWeight: 700
                    }}
                  >
                    {link.badge}
                  </span>
                )}
              </a>
            ))}

            <div style={{ height: '6px' }} />

            {/* Portal Links on Mobile */}
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px' }}>
                <a
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  {userAvatar ? (
                    <img src={userAvatar} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <User size={18} color="var(--primary-purple)" />
                  )}
                  <span>Dashboard ({user.name || 'Member'})</span>
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
                    color: 'var(--text-primary)',
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  <User size={18} color="var(--primary-purple)" />
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
          .mobile-actions {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
