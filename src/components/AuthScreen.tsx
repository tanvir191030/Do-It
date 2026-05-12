import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { auth } from '../lib/auth';
import { Mail, Lock, Loader2, Eye, EyeOff, Sparkles, Check, ArrowRight } from 'lucide-react';

export function AuthScreen() {
  const { showToast, init } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showForm && emailRef.current) {
      setTimeout(() => emailRef.current?.focus(), 300);
    }
  }, [showForm]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) { setError('Please enter your email'); return; }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!isLogin && password !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      let result;
      if (isLogin) {
        result = await auth.signIn(email.trim(), password);
      } else {
        result = await auth.signUp(email.trim(), password);
      }
      
      if (result.error) {
        if (result.error.message.includes('Invalid login')) {
          setError('Invalid email or password');
        } else if (result.error.message.includes('already')) {
          setError('Account already exists. Please sign in.');
        } else if (result.error.message.includes('weak')) {
          setError('Password is too weak');
        } else if (result.error.message.includes('Email not confirmed')) {
          setError('Please check your email for verification link');
        } else {
          setError(result.error.message);
        }
        showToast(result.error.message, 'error');
      } else {
        setSuccess(true);
        if (!isLogin) {
          showToast('Account created! Welcome! 🎉', 'success');
        } else {
          showToast('Welcome back! 🎉', 'success');
        }
        // After successful login/signup, re-init the store.
        // The Supabase session is now saved in localStorage automatically.
        // We add a small delay to let Supabase persist the session first.
        setTimeout(async () => {
          await init();
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      showToast(err.message || 'Authentication failed', 'error');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--theme-bg)' }}>
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-[120px]" style={{ background: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-[100px]" style={{ background: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <AnimatePresence mode="wait">
          {!showForm ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              {/* Logo */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-6 rounded-3xl overflow-hidden flex items-center justify-center"
                style={{ boxShadow: '0 20px 60px color-mix(in srgb, var(--theme-accent) 40%, transparent)' }}
              >
                <img src="/logo.png" alt="Do-It" className="w-full h-full object-contain" />
              </motion.div>

              {/* App Name */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-4xl font-bold mb-2"
                style={{ 
                  background: 'var(--theme-accent-gradient)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text' 
                }}
              >
                Do-It
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm mb-8"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                Your AI-powered productivity companion
              </motion.p>

              {/* Feature highlights */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-3 mb-8"
              >
                {['✨ AI-powered task management', '📅 Smart scheduling & reminders', '🎮 Gamified productivity'].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 justify-center">
                    <span className="text-xs font-medium" style={{ color: 'var(--theme-text-secondary)' }}>{feature}</span>
                  </div>
                ))}
              </motion.div>

              {/* Get Started Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowForm(true)}
                className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2"
                style={{ background: 'var(--theme-accent-gradient)', boxShadow: '0 10px 40px color-mix(in srgb, var(--theme-accent) 30%, transparent)' }}
              >
                Get Started
                <ArrowRight size={20} />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Back button */}
              <button
                onClick={() => { setShowForm(false); setError(''); setPassword(''); setConfirmPassword(''); setEmail(''); }}
                className="mb-6 flex items-center gap-2 text-sm font-medium"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                ← Back
              </button>

              {/* Form Card */}
              <div className="glass-strong rounded-3xl p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-white/5">
                    <img src="/logo.png" alt="Do-It" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
                      {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      {isLogin ? 'Sign in to continue' : 'Join Do-It today'}
                    </p>
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 px-4 py-3 rounded-xl text-sm overflow-hidden"
                      style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                      style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981' }}
                    >
                      <Check size={18} />
                      {isLogin ? 'Signed in!' : 'Account created!'}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--theme-text-muted)' }}>
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--theme-text-muted)' }} />
                      <input
                        ref={emailRef}
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(''); }}
                        placeholder="you@example.com"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm focus:outline-none transition-colors theme-input"
                        style={{ 
                          background: 'var(--theme-card)', 
                          borderColor: error ? 'rgba(239, 68, 68, 0.3)' : 'var(--theme-card-border)',
                          color: 'var(--theme-text)'
                        }}
                        required
                        disabled={loading || success}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--theme-text-muted)' }}>
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--theme-text-muted)' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(''); }}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-11 py-3.5 rounded-xl border text-sm focus:outline-none transition-colors theme-input"
                        style={{ 
                          background: 'var(--theme-card)', 
                          borderColor: error ? 'rgba(239, 68, 68, 0.3)' : 'var(--theme-card-border)',
                          color: 'var(--theme-text)'
                        }}
                        required
                        minLength={6}
                        disabled={loading || success}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--theme-text-muted)' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <AnimatePresence>
                    {!isLogin && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <label className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--theme-text-muted)' }}>
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--theme-text-muted)' }} />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                            placeholder="••••••••"
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm focus:outline-none transition-colors theme-input"
                            style={{ 
                              background: 'var(--theme-card)', 
                              borderColor: error ? 'rgba(239, 68, 68, 0.3)' : 'var(--theme-card-border)',
                              color: 'var(--theme-text)'
                            }}
                            required
                            minLength={6}
                            disabled={loading || success}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={loading || success}
                    className="w-full py-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: 'var(--theme-accent-gradient)' }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        {isLogin ? 'Signing In...' : 'Creating Account...'}
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        {isLogin ? 'Sign In' : 'Create Account'}
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Toggle */}
                <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--theme-card-border)' }}>
                  <p className="text-center text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                    {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                    <button
                      type="button"
                      onClick={() => { 
                        setIsLogin(!isLogin); 
                        setError(''); 
                        setPassword(''); 
                        setConfirmPassword(''); 
                      }}
                      className="font-bold"
                      style={{ color: 'var(--theme-accent)' }}
                    >
                      {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
