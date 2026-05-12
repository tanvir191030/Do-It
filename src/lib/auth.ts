import { supabase } from './supabase';

export const auth = {
  // Sign up new user
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  },

  // Sign in existing user
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut({ scope: 'local' }); // 'local' only clears this device
    return { error };
  },

  // Get the current session from memory/storage
  // This reads from localStorage directly - always fast, no network needed
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('[Auth] getSession error:', error.message);
      return null;
    }
    return data.session;
  },

  // Get current user directly from session (no network needed)
  async getUser() {
    const session = await this.getSession();
    return session?.user || null;
  },

  // Listen for auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  },
};
