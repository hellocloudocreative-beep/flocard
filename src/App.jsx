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
import AccountDashboard from './pages/account/AccountDashboard';
import AccountDesigns from './pages/account/AccountDesigns';
import AccountProfile from './pages/account/AccountProfile';
import AdminDashboard from './pages/admin/AdminDashboard';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

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

  // 1. Public Profile: /p/:slug or /profile/:slug
  if (path.startsWith('/p/') || path.startsWith('/profile/')) {
    const raw = path.replace(/^\/(p|profile)\//, '').split('?')[0].replace(/\/+$/, '');
    content = <PublicProfile slug={raw || 'akhil'} />;
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
    content = <AdminDashboard initialTab={initialTab} initialOrderId={initialOrderId} />;
    showHeaderFooter = false;
  }
  // 2. NFC Redirect: /t/:cardCode
  else if (path.startsWith('/t/')) {
    const cardCode = path.replace('/t/', '');
    content = <NfcRedirect cardCode={cardCode || 'flc-akhil-992'} />;
    showHeaderFooter = false;
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
  // 11. 404
  else {
    content = <NotFound />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <div className="flocard-app-root">
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
          </div>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
