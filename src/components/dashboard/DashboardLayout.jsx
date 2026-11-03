/* ==========================================================================
   FLOCARDS PREMIUM DASHBOARD LAYOUT SYSTEM
   Inspired by minimal finance & payroll design reference:
   - Compact vertical navigation rail & expandable sidebar
   - Smooth animated navigation pill indicator (spring layoutId)
   - Breadcrumb navigation, live search, and quick action shortcuts
   - Notification bell popover and user profile dropdown
   - Dual theme support: Warm neutral light (#F7F5F0) & Matte Obsidian dark (#0D0B12)
   - FLOCARDS signature deep purple/magenta (#6B004F) brand identity
   - Fully responsive on Desktop, Tablet, and Mobile devices
   ========================================================================== */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  LogOut,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Check,
  CheckCheck,
  PanelLeftClose,
  PanelLeftOpen,
  User as UserIcon,
  Layers,
  MessageCircle
} from 'lucide-react';

export default function DashboardLayout({
  brandTitle = 'FLOCARDS',
  navItems = [],
  activeTab = 'overview',
  setActiveTab = () => {},
  breadcrumbs = ['FLOCARDS', 'Overview'],
  searchQuery = '',
  setSearchQuery = () => {},
  searchPlaceholder = 'Search customers, orders, cards...',
  quickActions = null,
  notifications = [],
  onMarkNotificationRead = () => {},
  onMarkAllNotificationsRead = () => {},
  user = null,
  isDark = true,
  toggleTheme = () => {},
  onLogout = () => {},
  children
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);
  const searchInputRef = useRef(null);

  // Keyboard shortcut listener: Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Theme color palette (Warm Neutral Light & Obsidian Dark)
  const colors = {
    bgMain: isDark ? '#0C0A10' : '#F7F5F0',
    sidebarBg: isDark ? '#110D18' : '#FFFFFF',
    sidebarBorder: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)',
    cardBg: isDark ? '#161220' : '#FFFFFF',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    headerBg: isDark ? 'rgba(12, 10, 16, 0.85)' : 'rgba(247, 245, 240, 0.88)',
    textPrimary: isDark ? '#FFFFFF' : '#191522',
    textSecondary: isDark ? '#9E95AF' : '#686074',
    textMuted: isDark ? '#685F78' : '#9B93A5',
    inputBg: isDark ? '#181324' : '#EFECE6',
    brandPurple: '#6B004F',
    brandPurpleLight: isDark ? '#A21CAF' : '#8B0068',
    activePillBg: isDark ? '#6B004F' : '#6B004F',
    activePillText: '#FFFFFF',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: colors.bgMain,
        color: colors.textPrimary,
        fontFamily: 'var(--font-body, "Inter", -apple-system, BlinkMacSystemFont, sans-serif)',
        position: 'relative',
        overflowX: 'clip',
        maxWidth: '100vw'
      }}
    >
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 999
          }}
        />
      )}

      {/* =====================================================================
          SIDEBAR & COMPACT NAVIGATION RAIL
          ===================================================================== */}
      <aside
        style={{
          width: collapsed ? '74px' : '254px',
          backgroundColor: colors.sidebarBg,
          borderRight: `1px solid ${colors.sidebarBorder}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 1000,
          padding: collapsed ? '20px 10px' : '22px 14px',
          boxSizing: 'border-box',
          overflowY: 'auto',
          overflowX: 'hidden',
          transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1), transform 0.28s ease',
          transform: mobileOpen ? 'translateX(0)' : undefined
        }}
        className={`flocard-dashboard-sidebar ${mobileOpen ? 'mobile-drawer-open' : ''}`}
      >
        <div>
          {/* Brand Logo & Header Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              paddingBottom: '20px',
              borderBottom: `1px solid ${colors.sidebarBorder}`,
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  minWidth: '36px',
                  borderRadius: '10px',
                  backgroundColor: colors.brandPurple,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.15rem',
                  letterSpacing: '0.04em',
                  boxShadow: '0 4px 14px rgba(107, 0, 79, 0.35)'
                }}
              >
                F
              </div>
              {!collapsed && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-heading, "Sora", sans-serif)',
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      letterSpacing: '0.06em',
                      color: colors.textPrimary,
                      lineHeight: 1.1
                    }}
                  >
                    FLOCARDS<sup style={{ fontSize: '0.55em', color: colors.brandPurpleLight, marginLeft: '2px' }}>®</sup>
                  </span>
                  <span style={{ fontSize: '0.68rem', color: colors.textMuted, fontWeight: 600 }}>
                    Connected Identity
                  </span>
                </div>
              )}
            </div>

            {/* Collapse toggle (desktop only) */}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="desktop-only-collapse"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{
                background: 'none',
                border: 'none',
                color: colors.textMuted,
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: collapsed ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.18s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.textPrimary}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.textMuted}
            >
              <PanelLeftClose size={18} />
            </button>
          </div>

          {/* Navigation Items with Animated Sliding Indicator */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map((item, idx) => {
              if (item.isDivider) {
                return (
                  <div
                    key={`div_${idx}`}
                    style={{
                      height: '1px',
                      backgroundColor: colors.sidebarBorder,
                      margin: '8px 4px'
                    }}
                  />
                );
              }

              if (item.isSectionHeader) {
                if (collapsed) {
                  return (
                    <div
                      key={`sec_${idx}`}
                      style={{
                        height: '1px',
                        backgroundColor: colors.sidebarBorder,
                        margin: '8px 4px'
                      }}
                    />
                  );
                }
                return (
                  <div
                    key={`sec_${idx}`}
                    style={{
                      fontSize: '0.64rem',
                      fontWeight: 800,
                      color: colors.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      padding: '12px 14px 4px',
                      userSelect: 'none'
                    }}
                  >
                    {item.label}
                  </div>
                );
              }

              const itemId = item.id || item.key;
              const Icon = item.icon;
              const active = activeTab === itemId;
              const badgeValue = item.badge !== undefined && item.badge !== null ? item.badge : item.count;

              return (
                <button
                  key={itemId || idx}
                  type="button"
                  onClick={() => {
                    setActiveTab(itemId);
                    setMobileOpen(false);
                  }}
                  title={collapsed ? item.label : undefined}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    padding: collapsed ? '11px 0' : '10px 14px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                    color: active ? colors.activePillText : colors.textSecondary,
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.86rem',
                    textAlign: 'left',
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'color 0.18s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = colors.hoverBg;
                      e.currentTarget.style.color = colors.textPrimary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = colors.textSecondary;
                    }
                  }}
                >
                  {/* Sliding active pill indicator (Layout Animation matching reference video) */}
                  {active && (
                    <motion.div
                      layoutId="dashboardNavActiveIndicator"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 34
                      }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '12px',
                        backgroundColor: colors.activePillBg,
                        boxShadow: '0 4px 16px rgba(107, 0, 79, 0.35)',
                        zIndex: 1
                      }}
                    />
                  )}

                  <div
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      overflow: 'hidden'
                    }}
                  >
                    {Icon && (
                      <Icon
                        size={18}
                        color={active ? colors.activePillText : (isDark ? '#A59BB6' : '#71687E')}
                      />
                    )}
                    {!collapsed && <span>{item.label}</span>}
                  </div>

                  {!collapsed && badgeValue !== undefined && badgeValue !== null && (
                    <span
                      style={{
                        position: 'relative',
                        zIndex: 2,
                        background: active ? 'rgba(255, 255, 255, 0.22)' : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'),
                        color: active ? '#FFFFFF' : colors.textSecondary,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '9999px'
                      }}
                    >
                      {badgeValue}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '16px', borderTop: `1px solid ${colors.sidebarBorder}` }}>
          {/* Back to Website */}
          <a
            href="/"
            title="Return to Public Website"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: '10px',
              padding: collapsed ? '9px 0' : '9px 12px',
              borderRadius: '10px',
              color: colors.textMuted,
              textDecoration: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.hoverBg;
              e.currentTarget.style.color = colors.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.textMuted;
            }}
          >
            <ArrowLeft size={16} />
            {!collapsed && <span>Back to Website</span>}
          </a>

          {/* User Mini Card */}
          {user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                padding: collapsed ? '8px 0' : '8px 10px',
                borderRadius: '12px',
                backgroundColor: colors.hoverBg
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    minWidth: '32px',
                    borderRadius: '50%',
                    backgroundColor: colors.brandPurple,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    overflow: 'hidden'
                  }}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (user.name || user.email || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                {!collapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.name || user.email?.split('@')[0] || 'User'}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: colors.textMuted, textTransform: 'capitalize' }}>
                      {user.role || 'Member'}
                    </span>
                  </div>
                )}
              </div>

              {!collapsed && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign out"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.textMuted,
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                  onMouseLeave={(e) => e.currentTarget.style.color = colors.textMuted}
                >
                  <LogOut size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* =====================================================================
          MAIN WORKSPACE
          ===================================================================== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Sticky Header with Search, Breadcrumbs & Actions */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 900,
            backgroundColor: colors.headerBg,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: `1px solid ${colors.sidebarBorder}`,
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxSizing: 'border-box'
          }}
        >
          {/* Left: Mobile Toggle & Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="mobile-only-toggle"
              style={{
                background: 'none',
                border: 'none',
                color: colors.textPrimary,
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb Trail */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb + idx}>
                  <span
                    style={{
                      fontWeight: idx === breadcrumbs.length - 1 ? 700 : 500,
                      color: idx === breadcrumbs.length - 1 ? colors.textPrimary : colors.textMuted
                    }}
                  >
                    {crumb}
                  </span>
                  {idx < breadcrumbs.length - 1 && (
                    <ChevronRight size={13} color={colors.textMuted} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Center: Live Global Search */}
          <div style={{ flex: '0 1 420px', minWidth: '180px', position: 'relative' }}>
            <Search
              size={15}
              color={colors.textMuted}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                width: '100%',
                padding: '8px 48px 8px 34px',
                borderRadius: '10px',
                border: `1px solid ${colors.cardBorder}`,
                backgroundColor: colors.inputBg,
                color: colors.textPrimary,
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.18s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = colors.brandPurpleLight}
              onBlur={(e) => e.target.style.borderColor = colors.cardBorder}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: colors.textMuted,
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            ) : (
              <span
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '0.68rem',
                  color: colors.textMuted,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 600,
                  pointerEvents: 'none'
                }}
              >
                ⌘K
              </span>
            )}
          </div>

          {/* Right: Actions, Theme, Notifications & User Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {quickActions}

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Warm Neutral Light Theme' : 'Switch to Luxury Obsidian Dark Theme'}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: `1px solid ${colors.cardBorder}`,
                backgroundColor: colors.cardBg,
                color: colors.textSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.textPrimary}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.textSecondary}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notification Bell Dropdown */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  border: `1px solid ${colors.cardBorder}`,
                  backgroundColor: colors.cardBg,
                  color: unreadCount > 0 ? colors.brandPurpleLight : colors.textSecondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.18s ease'
                }}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: '#EF4444'
                    }}
                  />
                )}
              </button>

              {notificationsOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '320px',
                    borderRadius: '16px',
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.cardBorder}`,
                    boxShadow: '0 18px 45px rgba(0, 0, 0, 0.45)',
                    padding: '14px',
                    zIndex: 1001,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: `1px solid ${colors.cardBorder}` }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={onMarkAllNotificationsRead}
                        style={{ background: 'none', border: 'none', color: colors.brandPurpleLight, fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {notifications.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '0.78rem', color: colors.textMuted }}>
                        No new notifications
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => onMarkNotificationRead(notif.id)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            backgroundColor: notif.read ? 'transparent' : colors.hoverBg,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: colors.textPrimary }}>{notif.title}</span>
                            <span style={{ fontSize: '0.66rem', color: colors.textMuted }}>{notif.time || 'Recent'}</span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: colors.textSecondary, lineHeight: 1.3 }}>{notif.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar Menu */}
            {user && (
              <div style={{ position: 'relative' }} ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 8px 4px 4px',
                    borderRadius: '24px',
                    border: `1px solid ${colors.cardBorder}`,
                    backgroundColor: colors.cardBg,
                    cursor: 'pointer'
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: colors.brandPurple,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      overflow: 'hidden'
                    }}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (user.name || user.email || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <ChevronDown size={14} color={colors.textMuted} />
                </button>

                {userMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '200px',
                      borderRadius: '14px',
                      backgroundColor: colors.cardBg,
                      border: `1px solid ${colors.cardBorder}`,
                      boxShadow: '0 18px 45px rgba(0, 0, 0, 0.45)',
                      padding: '8px',
                      zIndex: 1001,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ padding: '8px 10px', borderBottom: `1px solid ${colors.cardBorder}`, marginBottom: '4px' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: colors.textPrimary }}>{user.name || 'Account'}</div>
                      <div style={{ fontSize: '0.72rem', color: colors.textMuted, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('settings'); setUserMenuOpen(false); }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'none',
                        color: colors.textPrimary,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hoverBg}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span>Settings &amp; Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={onLogout}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'none',
                        color: '#EF4444',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content Workspace */}
        <main
          style={{
            flex: 1,
            padding: '24px 28px',
            boxSizing: 'border-box',
            maxWidth: '1600px',
            width: '100%',
            margin: '0 auto'
          }}
        >
          {children}
        </main>
      </div>

      {/* Scoped CSS for responsive styling */}
      <style>{`
        @media (max-width: 900px) {
          .flocard-dashboard-sidebar {
            position: fixed !important;
            top: 0;
            bottom: 0;
            left: 0;
            transform: translateX(-100%);
            box-shadow: 0 0 40px rgba(0, 0, 0, 0.6);
          }
          .flocard-dashboard-sidebar.mobile-drawer-open {
            transform: translateX(0) !important;
          }
          .mobile-only-toggle {
            display: flex !important;
          }
          .desktop-only-collapse {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
