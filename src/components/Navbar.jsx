/* ==========================================================================
   FLOCARD FLOATING CARD NAVIGATION BAR
   Modern floating pill card navbar based on React Bits CardNav.
   Matches the digital profile navbar aesthetics with full theme support,
   smooth card unfold animations, theme toggle, and account status.
   ========================================================================== */

import React from 'react';
import { Sun, Moon, User } from 'lucide-react';
import CardNav from './CardNav/CardNav';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

export default function Navbar({ currentPath = '/' }) {
  const { user } = useAuth();
  const { isLight, isDark, toggleTheme } = useTheme();
  const { profiles = [] } = useData();

  const userAvatar =
    user?.avatar ||
    profiles.find(
      p =>
        (user?.id && p.customerId === user.id) ||
        (user?.email && p.email === user.email) ||
        p.slug === 'akhil'
    )?.avatar;

  const navItems = [
    {
      label: 'NFC Cards',
      description: 'Engineered luxury NFC metal and hybrid cards.',
      links: [
        { label: 'Signature Purple', href: '/cards/purple' },
        { label: '24K Mirror Gold', href: '/cards/gold' },
        { label: 'Matte Platinum', href: '/cards/platinum' },
        { label: 'Explore All Editions', href: '/cards' }
      ]
    },
    {
      label: 'Digital Identity',
      description: 'Dynamic personal brand & digital portfolio profiles.',
      links: [
        { label: 'Profiles Overview', href: '/digital-profiles' },
        { label: 'Live Demo Profile', href: '/p/akhil' },
        { label: 'Card Studio Designer', href: '/designer' },
        { label: 'Customer Showcase', href: '/examples' }
      ]
    },
    {
      label: 'Platform',
      description: 'Instant touch networking with zero apps required.',
      links: [
        { label: 'How It Works', href: '/how-it-works' },
        { label: 'About FLOCARD', href: '/about' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'FAQ & Support', href: '/faq' }
      ]
    }
  ];

  const actions = (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      {/* Theme Toggle Button */}
      <button
        type="button"
        onClick={toggleTheme}
        className="nav-theme-toggle-btn"
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          border: '1px solid var(--cn-edge)',
          background: 'var(--cn-hover)',
          color: 'var(--cn-text)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease',
          outline: 'none',
          flexShrink: 0
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {isDark ? (
          <Sun size={17} color="#fbbf24" style={{ transition: 'transform 0.3s ease' }} />
        ) : (
          <Moon size={17} color="#6366f1" style={{ transition: 'transform 0.3s ease' }} />
        )}
      </button>

      {/* Account / User Portal Button */}
      {user ? (
        <a
          href={user.role === 'admin' ? '/admin' : '/dashboard'}
          title={`Logged in as ${user.name || user.email}`}
          className="nav-account-pill"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '3px 12px 3px 5px',
            height: '38px',
            borderRadius: '9999px',
            border: '1px solid var(--cn-edge)',
            background: 'var(--cn-hover)',
            color: 'var(--cn-text)',
            textDecoration: 'none',
            fontSize: '0.82rem',
            fontWeight: 600,
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease',
            flexShrink: 0,
            boxSizing: 'border-box'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          {userAvatar ? (
            <img
              src={userAvatar}
              alt=""
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7928CA, #B87CF8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <User size={13} color="#fff" />
            </div>
          )}
          <span
            style={{
              maxWidth: '85px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {user.name?.split(' ')[0] || 'Account'}
          </span>
        </a>
      ) : (
        <a
          href="/login"
          className="nav-signin-link"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 12px',
            height: '38px',
            borderRadius: '12px',
            border: '1px solid var(--cn-edge)',
            background: 'transparent',
            color: 'var(--cn-text)',
            textDecoration: 'none',
            fontSize: '0.82rem',
            fontWeight: 600,
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease',
            flexShrink: 0,
            boxSizing: 'border-box'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--cn-hover)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <User size={14} />
          <span>Sign In</span>
        </a>
      )}
    </div>
  );

  return (
    <header
      className="flocard-floating-nav-wrapper"
      style={{
        position: 'fixed',
        top: '14px',
        left: 0,
        right: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 16px',
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1080px',
          pointerEvents: 'auto'
        }}
      >
        <CardNav
          logo={
            <img
              src={isLight ? '/assets/logo-dark.png' : '/assets/logo-light.png'}
              alt="FLOCARD"
              style={{
                height: '24px',
                width: 'auto',
                display: 'block',
                objectFit: 'contain'
              }}
            />
          }
          logoAlt="FLOCARD"
          logoHref="/"
          items={navItems}
          actions={actions}
          cta={{ label: 'Design Card', href: '/designer' }}
          theme={isLight ? 'light' : 'dark'}
          surface="glass"
          cardHeight={215}
          maxWidth={1080}
          accentColor="linear-gradient(135deg, #7928CA 0%, #4338CA 100%)"
          openOn="click"
          cardEffect="rise"
        />
      </div>
    </header>
  );
}
