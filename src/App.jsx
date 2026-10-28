/* ==========================================================================
   FLOCARD MAIN APPLICATION & CLIENT ROUTER
   Supports all public, customer, admin, digital profile, and NFC redirect routes.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import CardCollection from './pages/CardCollection';
import CardDetail from './pages/CardDetail';
import Designer from './pages/Designer';
import HowItWorks from './pages/HowItWorks';
import DigitalProfiles from './pages/DigitalProfiles';
import Examples from './pages/Examples';
import About from './pages/About';
import Contact from './pages/Contact';
import Faq from './pages/Faq';
import Legal from './pages/Legal';
import Login from './pages/auth/Login';
import AdminLogin from './pages/auth/AdminLogin';
import NotFound from './pages/NotFound';
import PublicProfile from './pages/public/PublicProfile';
import NfcRedirect from './pages/public/NfcRedirect';
import OrderTracking from './pages/public/OrderTracking';
import AccountDashboard from './pages/account/AccountDashboard';
import AccountDesigns from './pages/account/AccountDesigns';
import AccountProfile from './pages/account/AccountProfile';
import AdminDashboard from './pages/admin/AdminDashboard';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AnimatePresence, motion } from 'motion/react';
import CookieConsent from './components/CookieConsent';

function GlobalPlainBackground() {
  const { isDark } = useTheme();

  return (
    <div
      className="global-plain-bg"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: -1,
        backgroundColor: isDark ? '#08060D' : '#FFFFFF'
      }}
    />
  );
}

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Admin Dashboard caught runtime error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#08060D', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ maxWidth: '480px', width: '100%', background: 'rgba(23, 16, 32, 0.95)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '20px', padding: '32px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f87171', marginBottom: '12px' }}>Admin Workspace Encountered an Error</h2>
            <p style={{ fontSize: '0.86rem', color: '#b9aec9', marginBottom: '24px', lineHeight: 1.5 }}>
              {this.state.error?.message || 'A transient state error occurred while rendering the dashboard.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
                className="btn btn-primary"
                style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '0.88rem' }}
              >
                Reload Dashboard
              </button>
              <button
                onClick={() => { localStorage.removeItem('flocard_data_demo'); window.location.href = '/admin'; }}
                className="btn btn-secondary"
                style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '0.88rem' }}
              >
                Reset Cache
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

class SafeBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.warn('SafeBoundary caught non-critical component error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function ProtectedAdminRoute({ initialTab, initialOrderId }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', color: '#fff' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid rgba(168, 85, 247, 0.2)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>Securing Admin Platform...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <AdminLogin />;
  }

  return (
    <AdminErrorBoundary>
      <AdminDashboard initialTab={initialTab} initialOrderId={initialOrderId} />
    </AdminErrorBoundary>
  );
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Global Smooth Scroll Pop-Up & Fade-In Reveal Observer
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    const observeElements = () => {
      const targets = document.querySelectorAll(
        '.scroll-reveal, .scroll-pop, .glass-panel, .feature-step-card, .product-card, .hero-card-left, .hero-card-right'
      );
      targets.forEach((el) => {
        if (!el.classList.contains('scroll-reveal') && !el.classList.contains('scroll-pop')) {
          el.classList.add('scroll-reveal');
        }
        observer.observe(el);
      });
    };

    observeElements();
    const timer = setTimeout(observeElements, 300);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [currentPath]);

  // Keyboard shortcut listener for hidden admin portal: Cmd + Shift + K (Mac) / Ctrl + Shift + K (Win/Linux)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        const activeEl = document.activeElement;
        const isInputField = activeEl && (
          activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable
        );

        if (!isInputField) {
          e.preventDefault();
          window.history.pushState({}, '', '/admin-login');
          setCurrentPath('/admin-login');
          window.scrollTo(0, 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(window.location.pathname);
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', onLocationChange);

    // Intercept internal link clicks for seamless single-page navigation
    const handleLinkClick = (e) => {
      const link = e.target.closest('a');
      if (
        link &&
        link.href &&
        link.origin === window.location.origin &&
        !link.target &&
        !link.hasAttribute('download') &&
        !link.getAttribute('href')?.startsWith('mailto:') &&
        !link.getAttribute('href')?.startsWith('tel:') &&
        !link.getAttribute('href')?.startsWith('#')
      ) {
        e.preventDefault();
        const nextUrl = link.getAttribute('href');
        if (nextUrl && nextUrl !== window.location.pathname) {
          window.history.pushState({}, '', nextUrl);
          setCurrentPath(window.location.pathname);
          window.scrollTo(0, 0);
        }
      }
    };

    document.addEventListener('click', handleLinkClick);

    return () => {
      window.removeEventListener('popstate', onLocationChange);
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  // Normalize path
  const path = currentPath.replace(/\/+$/, '') || '/';

  // Determine which page to render
  let content = null;
  let showHeaderFooter = true;

  // 1. Public Profile: /p/:slug or /profile/:slug (Backward-compatible routes)
  if (path.startsWith('/p/') || path.startsWith('/profile/')) {
    const raw = path.replace(/^\/(p|profile)\//, '').split('?')[0].replace(/\/+$/, '');
    content = <PublicProfile slug={raw || 'alex'} />;
    showHeaderFooter = false;
  }
  // 1b. Hidden Admin Login: /admin-login
  else if (path === '/admin-login') {
    content = <AdminLogin />;
    showHeaderFooter = false;
  }
  // 1c. Admin Platform: /admin, /admin/orders, /admin/orders/:id
  else if (path === '/admin' || path.startsWith('/admin/')) {
    const subRoute = path.replace('/admin', '').replace(/^\//, '') || 'overview';
    let initialTab = subRoute;
    let initialOrderId = null;
    if (subRoute.startsWith('orders/')) {
      initialTab = 'orders';
      initialOrderId = subRoute.replace('orders/', '');
    }
    content = <ProtectedAdminRoute initialTab={initialTab} initialOrderId={initialOrderId} />;
    showHeaderFooter = false;
  }
  // 2. NFC Redirect: /t/:cardCode
  else if (path.startsWith('/t/')) {
    const cardCode = path.replace('/t/', '');
    content = <NfcRedirect cardCode={cardCode || 'flc-alex-001'} />;
    showHeaderFooter = false;
  }
  // 2b. Public Order Tracking & Fulfillment Journey: /track
  else if (path === '/track') {
    content = <OrderTracking />;
  }
  // 3. Homepage
  else if (path === '/') {
    content = <Home />;
  }
  // 4. Card Collection
  else if (path === '/cards') {
    content = <CardCollection />;
  }
  // 5. Individual Card Editions
  else if (path === '/cards/metal') {
    content = <CardDetail editionKey="metal" />;
  }
  else if (path === '/cards/gold') {
    content = <CardDetail editionKey="gold" />;
  }
  else if (path === '/cards/platinum') {
    content = <CardDetail editionKey="platinum" />;
  }
  else if (path === '/cards/custom-purple' || path === '/cards/purple') {
    content = <CardDetail editionKey="purple" />;
  }
  else if (path === '/cards/white' || path === '/cards/pure-white') {
    content = <CardDetail editionKey="white" />;
  }
  // 6. Interactive Card Designer Studio
  else if (path === '/designer') {
    content = <Designer />;
  }
  // 7. Platform Info Pages
  else if (path === '/how-it-works') {
    content = <HowItWorks />;
  }
  else if (path === '/digital-profiles') {
    content = <DigitalProfiles />;
  }
  else if (path === '/examples') {
    content = <Examples />;
  }
  else if (path === '/about') {
    content = <About />;
  }
  else if (path === '/contact') {
    content = <Contact />;
  }
  else if (path === '/faq') {
    content = <Faq />;
  }
  else if (path === '/privacy') {
    content = <Legal type="privacy" />;
  }
  else if (path === '/terms') {
    content = <Legal type="terms" />;
  }
  // 8. Authentication
  else if (path === '/login') {
    content = <Login view="login" />;
  }
  else if (path === '/signup' || path === '/register') {
    content = <Login view="signup" />;
  }
  else if (path === '/forgot-password') {
    content = <Login view="forgot" />;
  }
  else if (path === '/reset-password') {
    content = <Login view="reset" />;
  }
  // 10. Customer Dashboard (/dashboard, /dashboard/*)
  else if (path === '/dashboard' || path.startsWith('/dashboard/')) {
    const subRoute = path.replace('/dashboard', '').replace(/^\//, '') || 'overview';
    let initialTab = 'overview';
    let initialOrderId = null;
    if (subRoute.startsWith('orders/')) {
      initialTab = 'orders';
      initialOrderId = subRoute.replace('orders/', '');
    } else if (subRoute) {
      initialTab = subRoute;
    }
    content = <CustomerDashboard initialTab={initialTab} initialOrderId={initialOrderId} />;
    showHeaderFooter = false;
  }
  // 10b. Legacy Account redirect -> Customer Dashboard
  else if (path === '/account' || path.startsWith('/account/')) {
    const subRoute = path.replace('/account', '').replace(/^\//, '');
    let initialTab = 'overview';
    if (subRoute === 'designs') initialTab = 'cards';
    else if (subRoute === 'profile') initialTab = 'profiles';
    else if (subRoute === 'settings') initialTab = 'settings';
    content = <CustomerDashboard initialTab={initialTab} />;
    showHeaderFooter = false;
  }
  // 11. Canonical Root Digital Profile URL: https://flocard.in/username
  else if (/^\/[a-zA-Z0-9_.-]+$/.test(path)) {
    const rawSlug = path.replace(/^\//, '').split('?')[0];
    const RESERVED_ROUTES = new Set([
      'admin', 'admin-login', 't', 'p', 'profile', 'cards', 'designer',
      'how-it-works', 'digital-profiles', 'examples', 'about', 'contact',
      'faq', 'privacy', 'terms', 'legal', 'login', 'signup', 'register',
      'forgot-password', 'reset-password', 'dashboard', 'account', 'checkout',
      'orders', 'track', 'assets', 'api', 'favicon.ico', 'favicon.png', 'flocard', 'flocards'
    ]);
    if (!RESERVED_ROUTES.has(rawSlug.toLowerCase())) {
      content = <PublicProfile slug={rawSlug} />;
      showHeaderFooter = false;
    } else {
      content = <NotFound />;
    }
  }
  // 12. 404
  else {
    content = <NotFound />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <div className="flocard-app-root">
            {/* Global Solid Clean Background */}
            <GlobalPlainBackground />

            {showHeaderFooter && <Navbar currentPath={path} />}
            <AnimatePresence mode="wait" initial={false}>
              <motion.main
                key={path}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: 0.22,
                  ease: [0.16, 1, 0.3, 1]
                }}
                style={{ width: '100%', minHeight: '80vh' }}
              >
                {content}
              </motion.main>
            </AnimatePresence>
            {showHeaderFooter && <Footer />}
            <SafeBoundary>
              <CookieConsent
                storageKey="flocard-cookie-consent"
                policy={{ label: "Cookie Policy", href: "/legal" }}
              />
            </SafeBoundary>
          </div>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
