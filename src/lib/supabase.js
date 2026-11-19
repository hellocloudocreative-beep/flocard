/* ==========================================================================
   SUPABASE CLIENT & CONNECTION MANAGER
   Supports real Supabase project credentials with graceful offline/local fallback.
   ========================================================================== */

import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) || (typeof process !== 'undefined' && process.env) || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://myfznpeynuvftqfinxzb.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_tH8BRS5DTbGkBK1g8yC5DA_CCKWgAYT';
const supabaseServiceKey = env.VITE_SUPABASE_SERVICE_KEY || 'sb_secret_DVTVdCekywmyjn0IYLj1Fg_Y7ty8nbG';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Anon client — used for Auth and customer session management
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: 'flocard-supabase-auth',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

// Service-role client — used ONLY on the server for administrative operations
// Strictly isolated from browser execution to prevent Supabase Gateway "Forbidden use of secret API key in browser" 403 errors
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey && typeof window === 'undefined')
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        storageKey: 'flocard-supabase-admin-service',
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
  : null;

export function getSupabaseStatus() {
  return {
    connected: isSupabaseConfigured,
    url: supabaseUrl ? supabaseUrl.replace(/^(https?:\/\/[^/]{4})[^/]+/, '$1***') : 'Not Configured (Running in Local Mode)',
    hasKey: Boolean(supabaseAnonKey),
    mode: isSupabaseConfigured ? 'Live Cloud Database' : 'Local Persistent Storage Engine'
  };
}
