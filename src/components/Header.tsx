import { motion } from 'framer-motion';
import { useStore } from '../store';
import { Timer, Sparkles, Trophy, Flame, Zap } from 'lucide-react';

export function Header() {
  const { stats, settings, setShowAchievements, setShowAI, setShowPomodoro, user } = useStore();
  const xpProgress = ((stats.xp % 200) / 200) * 100;
  
  // Get greeting based on time of day and language
  const hour = new Date().getHours();
  const isBengali = settings.language === 'bn';
  let greeting = '';
  if (isBengali) {
    greeting = hour < 12 ? 'শুভ সকাল' : hour < 17 ? 'শুভ অপরাহ্ন' : 'শুভ সন্ধ্যা';
  } else {
    greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  }
  
  // Use saved userName from settings; fallback to email username; fallback to 'User'
  const emailName = user?.email ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1) : '';
  const displayName = (settings.userName && settings.userName !== 'User')
    ? settings.userName
    : emailName || 'User';

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="safe-top px-5 pt-5 pb-3"
    >
      <div className="mb-4">
        {/* Top Row: Logo + App Name + Action Buttons */}
        <div className="flex items-center justify-between gap-3">
          {/* Logo & App Name */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 bg-white/5" style={{ boxShadow: '0 4px 15px color-mix(in srgb, var(--theme-accent) 25%, transparent)' }}>
              <img src="/logo.png" alt="Do-It" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold neon-text leading-none">Do-It</h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowPomodoro(true)}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center"
          >
            <Timer size={18} style={{ color: 'var(--theme-text-secondary)' }} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAI(true)}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center relative"
          >
            <Sparkles size={18} style={{ color: 'var(--theme-accent)' }} />
            {settings.openRouterApiKey && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full" />
            )}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAchievements(true)}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center"
          >
            <Trophy size={18} style={{ color: '#f59e0b' }} />
          </motion.button>
          </div>
        </div>

        {/* Greeting Row - Full width, no truncation */}
        <p className="text-sm mt-2.5" style={{ color: 'var(--theme-text-muted)' }}>
          {greeting},{' '}
          <span style={{ color: 'var(--theme-accent)', fontWeight: 700 }}>
            {displayName}
          </span>
          {' '}👋
        </p>
      </div>

      {/* Stats Bar */}
      <div className="glass rounded-2xl p-3 flex items-center gap-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white theme-accent-gradient shrink-0">
            {stats.level}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: 'var(--theme-text-secondary)' }}>Level {stats.level}</span>
              <span style={{ color: 'var(--theme-text-muted)' }}>{stats.xp % 200}/200 XP</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--theme-card-border)' }}>
              <motion.div
                className="h-full rounded-full theme-accent-gradient"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/15 shrink-0">
          <Flame size={14} className="text-orange-400" />
          <span className="text-sm font-bold text-orange-400">{stats.streak}</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg shrink-0" style={{ background: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)' }}>
          <Zap size={14} style={{ color: 'var(--theme-accent)' }} />
          <span className="text-sm font-bold" style={{ color: 'var(--theme-accent)' }}>{stats.xp}</span>
        </div>
      </div>
    </motion.header>
  );
}
