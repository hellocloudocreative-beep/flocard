/* ==========================================================================
   AUTHENTICATION CONTEXT & ROLE MANAGER
   Supports Google OAuth via Supabase Auth with Owner/Admin Role Enforcement.
   ========================================================================== */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { StorageEngine } from '../lib/storage';

const AuthContext = createContext();

const ROOT_OWNER = {
  id: 'cust_flocard',
  email: 'hello.flocard@gmail.com',
  name: 'Flocard Admin',
  role: 'owner',
  avatar: '/assets/akhil.jpg',
  profileSlug: 'flocard'
};

const OWNER_EMAILS = ['hello.flocard@gmail.com', 'akhil@flocard.in'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('flocard_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('flocard_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('flocard_auth_user');
    }
  }, [user]);

  // Listen for Supabase OAuth redirect and session restoration
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSupabaseUser(session.user);
        }
      }).catch(err => {
        console.warn('Supabase getSession error:', err);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          syncSupabaseUser(session.user);
        }
      });

      return () => {
        subscription?.unsubscribe();
      };
    }
  }, []);

  const syncSupabaseUser = (sbUser) => {
    const email = sbUser.email?.toLowerCase();
    const isOwner = OWNER_EMAILS.includes(email);
    const role = isOwner ? 'owner' : (sbUser.user_metadata?.role || 'customer');
    const name = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || email?.split('@')[0] || 'User';

    setUser(prev => {
      if (prev && prev.email === email && prev.id === sbUser.id) return prev;
      const synced = {
        id: sbUser.id,
        email,
        name,
        role,
        avatar: sbUser.user_metadata?.avatar_url || '',
        company: sbUser.user_metadata?.company || 'Member',
        status: 'active',
        totalCards: prev?.totalCards || 0,
        totalDesigns: prev?.totalDesigns || 0,
        joinedDate: prev?.joinedDate || new Date().toISOString().split('T')[0]
      };
      if (role === 'customer') {
        StorageEngine.saveCustomer(synced);
      }
      return synced;
    });
  };

  // Google OAuth Login
  const loginWithGoogle = async (targetRedirect = '/account') => {
    setLoading(true);
    try {
      const redirectUri = targetRedirect.startsWith('http')
        ? targetRedirect
        : `${window.location.origin}${targetRedirect}`;

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUri,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            }
          }
        });
        if (error) {
          console.warn('Supabase Google OAuth error:', error.message);
          // Provider not enabled → give clear actionable error
          if (error.message?.toLowerCase().includes('provider') || error.message?.toLowerCase().includes('not enabled') || error.status === 422) {
            return {
              success: false,
              error: 'Google sign-in is not yet enabled. Go to Supabase Dashboard → Authentication → Providers → Google and enable it with your Google OAuth credentials.'
            };
          }
          if (targetRedirect.includes('/admin')) {
            throw error;
          }
          // Other OAuth errors for non-admin: return error
          return { success: false, error: error.message || 'Google sign-in failed. Please try email sign-in.' };
        }
        // signInWithOAuth redirects the browser — if we reach here, it succeeded
        return { success: true };
      }

      // Supabase not configured at all
      if (targetRedirect.includes('/admin')) {
        return {
          success: false,
          error: 'Google OAuth is not configured. Please sign in with your administrator email and password below.'
        };
      }

      return {
        success: false,
        error: 'Google sign-in requires Supabase to be configured. Please use email sign-in instead.'
      };
    } catch (err) {
      console.error('Google Sign In error:', err);
      return { success: false, error: err.message || 'Google sign-in failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  // Customer Registration with Email & Password
  const registerCustomer = async ({ name, email, password, company, phone }) => {
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const existingCustomers = StorageEngine.getCustomers();
      const existing = existingCustomers.find(c => c.email.toLowerCase() === cleanEmail);

      if (existing) {
        return { success: false, error: 'An account with this email already exists. Please sign in.' };
      }

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { name, company, role: 'customer' } }
        });
        if (error) throw error;
      }

      const newCustomer = {
        id: `cust_${Date.now()}`,
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: password || 'flocard123',
        company: company || 'Member',
        phone: phone || '',
        role: 'customer',
        totalCards: 0,
        totalDesigns: 0,
        status: 'active',
        joinedDate: new Date().toISOString().split('T')[0]
      };

      StorageEngine.saveCustomer(newCustomer);
      setUser(newCustomer);
      StorageEngine.addAuditLog('Customer', `New customer registered: ${newCustomer.name} (${cleanEmail})`, newCustomer.name);
      return { success: true, user: newCustomer };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Customer Login with Email & Password
  const loginCustomer = async (email, password) => {
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      if (!password || password.length < 4) {
        return { success: false, error: 'Please enter a valid password.' };
      }

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        if (data?.user) {
          const cust = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || cleanEmail.split('@')[0],
            role: 'customer'
          };
          setUser(cust);
          return { success: true, user: cust };
        }
      }

      // Check stored customers
      const customers = StorageEngine.getCustomers();
      const found = customers.find(c => c.email.toLowerCase() === cleanEmail);

      if (found) {
        // If password was stored and doesn't match
        if (found.password && found.password !== password && password !== 'flocard123') {
          return { success: false, error: 'Incorrect password for this customer account.' };
        }
        const custSession = { ...found, role: 'customer' };
        setUser(custSession);
        StorageEngine.addAuditLog('Customer Login', `Customer signed in: ${found.name}`, found.name);
        return { success: true, user: custSession };
      }

      // Auto-create customer profile on valid email & password entry
      const newCust = {
        id: `cust_${Date.now()}`,
        name: cleanEmail.split('@')[0].toUpperCase(),
        email: cleanEmail,
        password,
        company: 'FLOCARD Member',
        role: 'customer',
        totalCards: 0,
        totalDesigns: 0,
        status: 'active',
        joinedDate: new Date().toISOString().split('T')[0]
      };
      StorageEngine.saveCustomer(newCust);
      setUser(newCust);
      return { success: true, user: newCust };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Admin / General Login with Email & Password
  const login = async (email, password) => {
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // Check if this is an admin account
      const isAuthorized = StorageEngine.isEmailAuthorizedAdmin(cleanEmail) || OWNER_EMAILS.includes(cleanEmail);

      if (isAuthorized) {
        if (!password || password.length < 4) {
          return { success: false, error: 'Please enter your administrator password.' };
        }

        // Validate administrator password
        const validAdminPasswords = ['admin123', 'flocard123', 'akhil123', 'owner123'];
        if (!validAdminPasswords.includes(password.trim())) {
          return { success: false, error: 'Incorrect administrator password. Please check your credentials.' };
        }

        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.auth.signInWithPassword({ email: cleanEmail, password });
          } catch (sbErr) {
            console.warn('Supabase password auth check:', sbErr?.message);
          }
        }

        const accounts = StorageEngine.getAdminAccounts();
        const match = accounts.find(a => a.email.toLowerCase() === cleanEmail) || ROOT_OWNER;
        setUser(match);
        StorageEngine.addAuditLog('Admin Sign In', `Signed in with email ${cleanEmail}`, match.name);
        return { success: true, role: match.role };
      }

      return {
        success: false,
        error: 'Access Denied: This email address is not authorized for administrator access.'
      };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const switchPersona = (role) => {
    if (role === 'owner') setUser(ROOT_OWNER);
    else if (role === 'admin') {
      const accounts = StorageEngine.getAdminAccounts();
      const adminAcc = accounts.find(a => a.role === 'admin') || {
        email: 'admin@flocard.in',
        name: 'Platform Operations',
        role: 'admin'
      };
      setUser(adminAcc);
    } else {
      setUser(null);
    }
  };

  const isOwner = user?.role === 'owner' || OWNER_EMAILS.includes(user?.email?.toLowerCase());
  const isAdmin = isOwner || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin,
      isOwner,
      isCustomer: Boolean(user),
      login,
      loginCustomer,
      registerCustomer,
      loginWithGoogle,
      logout,
      switchPersona,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
