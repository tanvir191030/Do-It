import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
// These are set in Vercel Settings → Environment Variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,         // Always save session to storage
    autoRefreshToken: true,       // Auto refresh before expiry
    detectSessionInUrl: false,    // Not using OAuth redirects
    storage: localStorage,        // Use browser localStorage
    storageKey: 'sb-doit-auth',   // Unique key so it never conflicts
  },
});
