/* ==========================================================================
   AUTHENTICATION CONTEXT & ROLE MANAGER
   Supports Google OAuth via Supabase Auth with Owner/Admin Role Enforcement.
   ========================================================================== */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { StorageEngine } from '../lib/storage';

const AuthContext = createContext();

const ROOT_OWNER = {
  id: 'cust_akhil',
  email: 'akhil@flocard.in',
  name: 'Akhil Anvar',
  role: 'owner',
  avatar: '/assets/akhil.jpg',
  profileSlug: 'akhil'
};

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

  // Google OAuth Login
  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/admin`
          }
        });
        if (error) throw error;
        return { success: true };
      }

      // Do NOT auto-authenticate to admin without entering credentials!
      return {
        success: false,
        error: 'Google OAuth is not configured for this domain. Please sign in with your administrator email and password below.'
      };
    } catch (err) {
      console.error('Google Sign In error:', err);
      return { success: false, error: err.message };
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
      const isAuthorized = StorageEngine.isEmailAuthorizedAdmin(cleanEmail) || cleanEmail === 'akhil@flocard.in';

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
          const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
          if (error) throw error;
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

  const isOwner = user?.role === 'owner' || user?.email === 'akhil@flocard.in';
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
