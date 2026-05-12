import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { auth } from '../lib/auth';
import { Mail, Lock, Loader2, Eye, EyeOff, Sparkles, Check, X } from 'lucide-react';

export function AuthModal() {
  const { showAuth, setShowAuth, showToast, init } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAuth && emailRef.current) {
      setTimeout(() => emailRef.current?.focus(), 300);
    }
  }, [showAuth]);

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
        if (result.error.message.includes('Invalid')) {
          setError('Invalid email or password');
        } else if (result.error.message.includes('already')) {
          setError('An account with this email already exists');
        } else if (result.error.message.includes('weak')) {
          setError('Password is too weak');
        } else {
          setError(result.error.message);
        }
        showToast(result.error.message, 'error');
      } else {
        setSuccess(true);
        if (!isLogin) {
          showToast('Account created! Please check your email for verification', 'success');
          setTimeout(() => {
            setShowAuth(false);
            init();
          }, 2000);
        } else {
          showToast('Welcome back! 🎉', 'success');
          setTimeout(() => {
            setShowAuth(false);
            init();
          }, 1000);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      showToast(err.message || 'Authentication failed', 'error');
    }
    setLoading(false);
  }

  if (!showAuth) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}
        onClick={() => { if (!loading) setShowAuth(false); }}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md mx-auto sm:rounded-3xl rounded-t-3xl overflow-hidden"
          style={{ background: 'var(--theme-bg-secondary)' }}
        >
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4">
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
              style={{ background: 'var(--theme-card)', color: 'var(--theme-text-muted)' }}
            >
              <X size={18} />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--theme-accent-gradient)' }}>
                <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
                  <path d="M30 52 L45 67 L72 33" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>Do-It</h1>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  {isLogin ? 'Welcome back!' : 'Create your account'}
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mx-6 mb-4 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-6 mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981' }}
              >
                <Check size={18} />
                {isLogin ? 'Signed in successfully!' : 'Account created!'}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--theme-text-muted)' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--theme-text-muted)' }} />
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="tanvir@example.com"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border text-sm focus:outline-none transition-colors theme-input"
                  style={{ 
                    background: 'var(--theme-card)', 
                    borderColor: error ? 'rgba(239, 68, 68, 0.3)' : 'var(--theme-card-border)',
                    color: 'var(--theme-text)'
                  }}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--theme-text-muted)' }}>
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--theme-text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border text-sm focus:outline-none transition-colors theme-input"
                  style={{ 
                    background: 'var(--theme-card)', 
                    borderColor: error ? 'rgba(239, 68, 68, 0.3)' : 'var(--theme-card-border)',
                    color: 'var(--theme-text)'
                  }}
                  required
                  minLength={6}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign Up only) */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--theme-text-muted)' }}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--theme-text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border text-sm focus:outline-none transition-colors theme-input"
                      style={{ 
                        background: 'var(--theme-card)', 
                        borderColor: error ? 'rgba(239, 68, 68, 0.3)' : 'var(--theme-card-border)',
                        color: 'var(--theme-text)'
                      }}
                      required
                      minLength={6}
                      disabled={loading}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || success}
              className="w-full py-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
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

            {/* Toggle Login/Signup */}
            <div className="text-center pt-2">
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(''); setPassword(''); setConfirmPassword(''); }}
                  className="font-bold"
                  style={{ color: 'var(--theme-accent)' }}
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>

            {/* Guest Mode */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => { setShowAuth(false); showToast('Using as guest (local only)', 'info'); }}
                className="w-full py-3 rounded-xl text-xs font-medium transition-all"
                style={{ 
                  background: 'var(--theme-card)',
                  border: '1px solid var(--theme-card-border)',
                  color: 'var(--theme-text-muted)'
                }}
              >
                Continue as Guest (Offline Mode)
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
