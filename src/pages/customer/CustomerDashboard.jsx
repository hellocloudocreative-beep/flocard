/* ==========================================================================
   FLOCARD CUSTOMER DASHBOARD — PROTECTED CUSTOMER PORTAL
   Routes: /dashboard, /dashboard/orders, /dashboard/orders/:orderId, etc.
   Features desktop sidebar, compact mobile bottom navigation, real-time in-app
   notifications bell, and strict customer record isolation.
   ========================================================================== */

import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Radio,
  FileText,
  BarChart2,
  Package,
  Settings,
  Bell,
  LogOut,
  Sun,
  Moon,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Check,
  CheckCheck,
  X,
  Menu,
  ChevronRight,
  Clock,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';

import CustomerOverviewTab from './CustomerOverviewTab';
import CustomerCardsTab from './CustomerCardsTab';
import CustomerProfilesTab from './CustomerProfilesTab';
import CustomerAnalyticsTab from './CustomerAnalyticsTab';
import CustomerOrdersTab from './CustomerOrdersTab';
import CustomerOrderDetail from './CustomerOrderDetail';
import CustomerSettingsTab from './CustomerSettingsTab';

export default function CustomerDashboard({ initialTab = 'overview', initialOrderId = null }) {
  const { user, logout, isCustomer } = useAuth();
  const { theme, toggleTheme, isDark, isLight } = useTheme();
  const {
    cards = [],
    profiles = [],
    designs = [],
    orders = [],
    getOrdersForUser,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    lastOrderUpdate
  } = useData();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrderId);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);

  // Sync state if initial props change
  useEffect(() => {
    if (initialOrderId) {
      setSelectedOrderId(initialOrderId);
      setActiveTab('orders');
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, initialOrderId]);

  // Load customer notifications
  const reloadNotifications = () => {
    if (user && getNotifications) {
      const list = getNotifications(user);
      setNotificationsList(list);
    }
  };

  useEffect(() => {
    reloadNotifications();
  }, [user, lastOrderUpdate, orders]);

  // Filter cards, profiles, and orders belonging to this customer reactively
  const customerCards = useMemo(() => {
    if (!user) return [];
    const uId = user.id;
    const uEmail = (user.email || '').toLowerCase().trim();
    const uName = (user.name || '').toLowerCase().trim();
    return cards.filter(c => 
      (uId && c.customerId === uId) ||
      (uEmail && c.customerEmail?.toLowerCase().trim() === uEmail) ||
      (uName && c.customerName?.toLowerCase().trim() === uName)
    );
  }, [user, cards]);

  const customerProfiles = useMemo(() => {
    if (!user) return [];
    const uId = user.id;
    const uEmail = (user.email || '').toLowerCase().trim();
    const uName = (user.name || '').toLowerCase().trim();
    return profiles.filter(p => 
      (uId && p.userId === uId) ||
      (uEmail && p.email?.toLowerCase().trim() === uEmail) ||
      (uName && p.name?.toLowerCase().trim() === uName)
    );
  }, [user, profiles]);

  const customerOrders = useMemo(() => {
    if (!user) return [];
    const uId = user.id;
    const uEmail = (user.email || '').toLowerCase().trim();
    const uName = (user.name || '').toLowerCase().trim();
    return orders.filter(o =>
      (uId && o.customerId === uId) ||
      (uEmail && o.customerEmail?.toLowerCase().trim() === uEmail) ||
      (uName && o.customerName?.toLowerCase().trim() === uName)
    );
  }, [user, orders, lastOrderUpdate]);

  const unreadNotificationsCount = notificationsList.filter(n => !n.readAt).length;

  // If customer is not authenticated, show elegant sign-in gate
  if (!user) {
    return (
      <div style={{ paddingTop: 'calc(var(--header-height) + 40px)', paddingBottom: '80px', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="container" style={{ maxWidth: '460px', textAlign: 'center' }}>
          <div className="glass-panel" style={{ padding: '40px 32px', backgroundColor: 'var(--card-surface)', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(107, 0, 255, 0.15)',
                color: 'var(--accent-purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px'
              }}
            >
              <UserIcon size={28} />
            </div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 800 }}>
              Customer Dashboard
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '28px', lineHeight: 1.6 }}>
              Sign in to manage your active NFC cards, customize digital profiles, view genuine engagement analytics, and track live order progress.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a href="/login" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', gap: '8px' }}>
                <span>Sign In with Account</span>
                <ArrowRight size={16} />
              </a>
              <a href="/signup" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                <span>Create New Account</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'cards', label: 'My Cards', icon: Radio, count: customerCards.length },
    { key: 'profiles', label: 'Profiles', icon: FileText, count: customerProfiles.length },
    { key: 'analytics', label: 'Analytics', icon: BarChart2 },
    { key: 'orders', label: 'Orders & Tracking', icon: Package, count: customerOrders.length },
    { key: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSelectedOrderId(null);
    window.history.pushState({}, '', tabKey === 'overview' ? '/dashboard' : `/dashboard/${tabKey}`);
  };

  const handleViewOrderDetail = (orderId) => {
    setSelectedOrderId(orderId);
    setActiveTab('orders');
    window.history.pushState({}, '', `/dashboard/orders/${orderId}`);
  };

  const handleBackToOrders = () => {
    setSelectedOrderId(null);
    window.history.pushState({}, '', '/dashboard/orders');
  };

  const handleMarkNotification = (notif) => {
    if (!notif.readAt && markNotificationRead) {
      markNotificationRead(notif.id, user);
      reloadNotifications();
    }
    if (notif.orderId) {
      setShowNotifications(false);
      handleViewOrderDetail(notif.orderId);
    }
  };

  const handleMarkAllRead = () => {
    if (markAllNotificationsRead) {
      markAllNotificationsRead(user);
      reloadNotifications();
    }
  };

  return (
    <div
      className="flocard-customer-dashboard"
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-primary)',
        paddingTop: 'var(--header-height)'
      }}
    >
      {/* DESKTOP REFINED SIDEBAR */}
      <aside
        className="hidden-mobile"
        style={{
          width: '260px',
          borderRight: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 'var(--header-height)',
          height: 'calc(100vh - var(--header-height))',
          padding: '24px 16px',
          flexShrink: 0,
          zIndex: 40
        }}
      >
        {/* User Account Capsule in Sidebar */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            backgroundColor: 'var(--elevated-surface)',
            border: '1px solid var(--border-color)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'rgba(107, 0, 255, 0.2)',
              color: 'var(--accent-purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.95rem',
              flexShrink: 0
            }}
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              user.name?.charAt(0) || 'U'
            )}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user.email}
            </div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleTabChange(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--primary-purple)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--elevated-surface)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={17} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--elevated-surface)',
                      color: isActive ? '#FFFFFF' : 'var(--text-muted)'
                    }}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Bottom: Sign Out */}
        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#EF4444',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          paddingBottom: '90px' // safe padding for mobile bottom bar
        }}
      >
        {/* Top Header Bar inside Dashboard */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--header-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 'var(--header-height)',
            zIndex: 30,
            backdropFilter: 'blur(12px)'
          }}
        >
          {/* Active Title Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Dashboard</span>
            <ChevronRight size={14} color="var(--text-muted)" />
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {selectedOrderId ? 'Order Journey Timeline' : activeTab}
            </span>
          </div>

          {/* Right Header Actions: Notification Bell & Theme Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Order Notifications"
                title="Fulfillment Journey Notifications"
                style={{
                  position: 'relative',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--elevated-surface)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Bell size={17} />
                {unreadNotificationsCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      backgroundColor: 'var(--primary-purple)',
                      color: '#FFFFFF',
                      fontSize: '0.64rem',
                      fontWeight: 800,
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 8px var(--primary-purple-glow)'
                    }}
                  >
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* In-App Notifications Dropdown */}
              {showNotifications && (
                <div
                  style={{
                    position: 'absolute',
                    top: '46px',
                    right: 0,
                    width: '340px',
                    maxWidth: 'calc(100vw - 32px)',
                    backgroundColor: 'var(--card-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    boxShadow: 'var(--shadow-card)',
                    zIndex: 100,
                    overflow: 'hidden',
                    animation: 'fadeInUp 0.2s ease'
                  }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</span>
                      {unreadNotificationsCount > 0 && (
                        <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '9999px', backgroundColor: 'var(--primary-purple)', color: '#FFF' }}>
                          {unreadNotificationsCount} new
                        </span>
                      )}
                    </div>
                    {unreadNotificationsCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <CheckCheck size={12} />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {notificationsList.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        No notifications yet. You will receive real-time updates when an administrator updates your card order.
                      </div>
                    ) : (
                      notificationsList.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => handleMarkNotification(notif)}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--border-color)',
                            backgroundColor: notif.readAt ? 'transparent' : 'rgba(107, 0, 255, 0.08)',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: notif.readAt ? 600 : 700, color: 'var(--text-primary)' }}>
                              {notif.title}
                            </span>
                            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Switcher Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'var(--elevated-surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        <div style={{ padding: '28px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
          {selectedOrderId ? (
            <CustomerOrderDetail orderId={selectedOrderId} onBack={handleBackToOrders} />
          ) : (
            <>
              {activeTab === 'overview' && (
                <CustomerOverviewTab
                  customer={user}
                  cards={customerCards}
                  profiles={customerProfiles}
                  orders={customerOrders}
                  designs={designs}
                  onNavigateTab={handleTabChange}
                  onViewOrder={handleViewOrderDetail}
                />
              )}
              {activeTab === 'cards' && (
                <CustomerCardsTab
                  cards={customerCards}
                  profiles={customerProfiles}
                  orders={customerOrders}
                  onViewOrder={handleViewOrderDetail}
                />
              )}
              {activeTab === 'profiles' && (
                <CustomerProfilesTab
                  profiles={customerProfiles}
                  customer={user}
                />
              )}
              {activeTab === 'analytics' && (
                <CustomerAnalyticsTab
                  customer={user}
                  cards={customerCards}
                  profiles={customerProfiles}
                />
              )}
              {activeTab === 'orders' && (
                <CustomerOrdersTab
                  orders={customerOrders}
                  onViewOrder={handleViewOrderDetail}
                />
              )}
              {activeTab === 'settings' && (
                <CustomerSettingsTab
                  customer={user}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* MOBILE COMPACT BOTTOM NAVIGATION BAR */}
      <nav
        className="hidden-desktop"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '64px',
          backgroundColor: 'var(--header-bg)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 90,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}
      >
        {[
          { key: 'overview', label: 'Home', icon: LayoutDashboard },
          { key: 'cards', label: 'Cards', icon: Radio },
          { key: 'profiles', label: 'Profiles', icon: FileText },
          { key: 'orders', label: 'Orders', icon: Package, count: unreadNotificationsCount },
          { key: 'settings', label: 'Settings', icon: Settings }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key && !selectedOrderId;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleTabChange(item.key)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: isActive ? 'var(--primary-purple)' : 'var(--text-muted)',
                fontSize: '0.68rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                position: 'relative',
                padding: '4px 10px'
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.count > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '12px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-purple)'
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
