/* ==========================================================================
   SUPABASE CLIENT & CONNECTION MANAGER
   Supports real Supabase project credentials with graceful offline/local fallback.
   ========================================================================== */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function getSupabaseStatus() {
  return {
    connected: isSupabaseConfigured,
    url: supabaseUrl ? supabaseUrl.replace(/^(https?:\/\/[^/]{4})[^/]+/, '$1***') : 'Not Configured (Running in Local Mode)',
    hasKey: Boolean(supabaseAnonKey),
    mode: isSupabaseConfigured ? 'Live Cloud Database' : 'Local Persistent Storage Engine'
  };
}
