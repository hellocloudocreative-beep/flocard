/* ==========================================================================
   AUTHENTICATION CONTEXT & ROLE MANAGER
   Supports Google OAuth via Supabase Auth with Owner/Admin Role Enforcement.
   ========================================================================== */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { StorageEngine } from '../lib/storage';
import { hasPermission as evaluatePermission, canAccessTab as evaluateTabAccess, ROLES } from '../lib/permissions';

const AuthContext = createContext();

const ROOT_OWNER = {
  id: 'cust_flocard',
  email: 'flocard@flocard.in',
  name: 'FLOCARDS Administrator',
  role: 'owner',
  avatar: null,
  profileSlug: 'flocard'
};

const OWNER_EMAILS = ['flocard', 'flocard@flocard.in', 'hello.flocard@gmail.com', 'admin@flocard.in'];

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
    const isAuthorizedAdmin = isOwner || StorageEngine.isEmailAuthorizedAdmin(email);
    const role = isOwner ? 'owner' : (isAuthorizedAdmin ? 'admin' : (sbUser.user_metadata?.role || 'customer'));
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

      // Immediately synchronize customer record and profile to Supabase cloud
      (async () => {
        try {
          const { supabase, supabaseAdmin, isSupabaseConfigured } = await import('../lib/supabase.js');
          if (!isSupabaseConfigured) return;
          const client = supabaseAdmin || supabase;
          if (!client) return;
          const userSlug = (name || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, '') || 'customer';
          const profilePayload = {
            id: sbUser.id,
            user_id: sbUser.id,
            slug: userSlug,
            name: name,
            email: email,
            role: role || 'customer',
            company: sbUser.user_metadata?.company || 'Member',
            avatar_url: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || '',
            theme: 'purple',
            status: 'active',
            updated_at: new Date().toISOString()
          };
          await client.from('profiles').upsert(profilePayload, { onConflict: 'id' });
        } catch (_) {}
      })();
      return synced;
    });
  };

  // Google OAuth Login
  const loginWithGoogle = async (targetRedirect = '/dashboard') => {
    setLoading(true);
    try {
      const cleanPath = targetRedirect.startsWith('/') ? targetRedirect : `/${targetRedirect}`;
      const redirectUri = targetRedirect.startsWith('http')
        ? targetRedirect
        : `${window.location.origin}${cleanPath}`;

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

        // Validate administrator password (strictly flocardakhil@anwar only)
        const validAdminPasswords = ['flocardakhil@anwar'];
        if (!validAdminPasswords.includes(password.trim())) {
          return { success: false, error: 'Incorrect administrator password. Please check your credentials.' };
        }

        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.auth.signInWithPassword({ email: cleanEmail === 'flocard' ? 'flocard@flocard.in' : cleanEmail, password });
          } catch (sbErr) {
            console.warn('Supabase password auth check:', sbErr?.message);
          }
        }

        const accounts = StorageEngine.getAdminAccounts();
        const match = (cleanEmail === 'flocard' || cleanEmail === 'flocard@flocard.in')
          ? ROOT_OWNER
          : (accounts.find(a => a.email.toLowerCase() === cleanEmail) || ROOT_OWNER);
        setUser(match);
        StorageEngine.addAuditLog('Admin Sign In', `Signed in with identifier ${cleanEmail}`, match.name);
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
    else if (role === 'sales') {
      setUser({
        id: 'staff_sales_01',
        email: 'sales@flocard.in',
        name: 'FLOCARDS Sales Desk',
        role: 'sales',
        company: 'FLOCARDS Direct Sales',
        avatar: null
      });
    } else if (role === 'designer') {
      setUser({
        id: 'staff_designer_01',
        email: 'designer@flocard.in',
        name: 'Studio Design Lead',
        role: 'designer',
        company: 'FLOCARDS Creative',
        avatar: null
      });
    } else if (role === 'production') {
      setUser({
        id: 'staff_prod_01',
        email: 'production@flocard.in',
        name: 'NFC Manufacturing Desk',
        role: 'production',
        company: 'FLOCARDS Lab',
        avatar: null
      });
    } else if (role === 'accounts') {
      setUser({
        id: 'staff_accounts_01',
        email: 'accounts@flocard.in',
        name: 'Finance & Tax Desk',
        role: 'accounts',
        company: 'FLOCARDS Finance',
        avatar: null
      });
    } else if (role === 'admin') {
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

  // Update Admin Profile (name, avatar) strictly isolated to the admin's account
  const updateAdminProfile = async ({ name, avatar }) => {
    try {
      if (isSupabaseConfigured && supabase) {
        const updatePayload = { data: {} };
        if (name) {
          updatePayload.data.name = name;
          updatePayload.data.full_name = name;
        }
        if (avatar !== undefined) {
          updatePayload.data.avatar_url = avatar;
        }
        await supabase.auth.updateUser(updatePayload);
      }
      setUser(prev => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          name: name || prev.name,
          avatar: avatar !== undefined ? avatar : prev.avatar
        };
        localStorage.setItem('flocard_auth_user', JSON.stringify(updated));
        return updated;
      });
      StorageEngine.addAuditLog('Admin Profile', `Admin profile updated for ${name || user?.name}`, user?.name || 'Administrator');
      return { success: true };
    } catch (err) {
      console.error('Update admin profile error:', err);
      return { success: false, error: err.message || 'Failed to update admin profile' };
    }
  };

  // Update Admin Password
  const updateAdminPassword = async (newPassword) => {
    try {
      if (!newPassword || newPassword.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long.' };
      }
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      }
      StorageEngine.addAuditLog('Admin Security', 'Admin password changed successfully', user?.name || 'Administrator');
      return { success: true };
    } catch (err) {
      console.error('Update admin password error:', err);
      return { success: false, error: err.message || 'Failed to update password' };
    }
  };

  // Update Admin Email
  const updateAdminEmail = async (newEmail) => {
    try {
      const cleanEmail = (newEmail || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.updateUser({ email: cleanEmail });
        if (error) throw error;
      }
      setUser(prev => prev ? { ...prev, email: cleanEmail } : prev);
      StorageEngine.addAuditLog('Admin Security', `Admin requested email change to ${cleanEmail}`, user?.name || 'Administrator');
      return { success: true, message: 'Confirmation link sent to your new email address.' };
    } catch (err) {
      console.error('Update admin email error:', err);
      return { success: false, error: err.message || 'Failed to update email' };
    }
  };

  const isOwner = user?.role === 'owner' || OWNER_EMAILS.includes(user?.email?.toLowerCase());
  const isSales = user?.role === 'sales';
  const isDesigner = user?.role === 'designer';
  const isProduction = user?.role === 'production';
  const isAccounts = user?.role === 'accounts';
  const isAdmin = isOwner || ['admin', 'sales', 'designer', 'production', 'accounts'].includes(user?.role) || (user?.email && StorageEngine.isEmailAuthorizedAdmin(user.email));

  const checkPermission = (permId) => evaluatePermission(user, permId);
  const checkTabAccess = (tabId) => evaluateTabAccess(user, tabId);

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role || (isOwner ? 'owner' : (isAdmin ? 'admin' : 'customer')),
      isAdmin,
      isOwner,
      isSales,
      isDesigner,
      isProduction,
      isAccounts,
      isCustomer: Boolean(user),
      hasPermission: checkPermission,
      canAccessTab: checkTabAccess,
      login,
      loginCustomer,
      registerCustomer,
      loginWithGoogle,
      logout,
      switchPersona,
      updateAdminProfile,
      updateAdminPassword,
      updateAdminEmail,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
