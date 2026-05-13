import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
// These are set in Vercel Settings → Environment Variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Prevent app from crashing if keys are missing during development or initial deployment
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase credentials missing! Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
}

// Custom fetch with timeout to prevent hanging on poor WiFi
const fetchWithTimeout = async (url: string, options: any = {}) => {
  const timeout = 10000; // 10 seconds timeout
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co', 
  SUPABASE_ANON_KEY || 'placeholder', 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: localStorage,
      storageKey: 'sb-doit-auth',
    },
    global: {
      fetch: fetchWithTimeout,
    },
  }
);

