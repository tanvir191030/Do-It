import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gwrzfracmntaleemcksd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cnpmcmFjbW50YWxlZW1ja3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NjQ1ODQsImV4cCI6MjA5NDE0MDU4NH0.wkEcu1ExxaMgMjR7wuFWiDRYN-QOzXEjGg4U3vHGuk8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,         // Always save session to storage
    autoRefreshToken: true,       // Auto refresh before expiry
    detectSessionInUrl: false,    // Not using OAuth redirects
    storage: localStorage,        // Use browser localStorage
    storageKey: 'sb-doit-auth',   // Unique key so it never conflicts
  },
});
