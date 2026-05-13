import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './store';
import { THEMES } from './types';
import {
  BottomNav, FAB, Toast, TaskListView, CalendarView,
  FocusView, StatsView, SettingsView,
  PomodoroModal, AchievementsModal, AIAssistantModal,
} from './components';
import { AddTaskModal } from './components/AddTaskModal';
import { Header } from './components/Header';
import { AuthScreen } from './components/AuthScreen';
import { Confetti } from './components/Confetti';
import { getTodayLocal } from './lib/dateUtils';
import { scheduleAllAlarms } from './lib/alarm';
import { notifications } from './lib/notifications';

function LoadingScreen() {
  const { settings } = useStore();
  const theme = THEMES.find(t => t.id === settings.theme) || THEMES[0];
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ background: theme.preview[0], color: theme.isDark ? '#ffffff' : '#1a1a2e' }}>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.img
          src="/logo.png"
          alt="Do-It"
          className="w-24 h-24 mx-auto mb-4 object-contain"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="text-4xl font-bold mb-2" style={{ background: `linear-gradient(135deg, ${theme.preview[1]}, ${theme.preview[2]})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Do-It</div>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-sm"
          style={{ color: theme.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(26,26,46,0.4)' }}
        >
          Loading your productivity...
        </motion.div>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const { view, isLoading, init, tasks, settings, authStatus } = useStore();

  // Daily completion state
  const today = getTodayLocal();
  const todayTasks = tasks.filter(t => t.dueDate === today || t.recurring);
  const isDailyDone = todayTasks.length > 0 && todayTasks.every(t => t.completed);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    localStorage.setItem('doit-theme', settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    init();
    notifications.requestPermission();
  }, [init]); // Only run once on mount (init is stable)

  useEffect(() => {
    // Check for incomplete tasks every hour
    const checkIncomplete = setInterval(() => {
      const incomplete = tasks.filter(t => (t.dueDate === getTodayLocal() || t.recurring) && !t.completed);
      if (incomplete.length > 0 && new Date().getHours() > 18) {
        notifications.send('🔔 Daily Reminder', `You have ${incomplete.length} tasks remaining for today!`);
      }
    }, 3600000);

    return () => clearInterval(checkIncomplete);
  }, [tasks]);

  useEffect(() => {
    if (!isLoading) {
      const activeTasks = tasks.filter(t => !t.completed);
      // Schedule ALL alarms (persistent until dismissed)
      scheduleAllAlarms(activeTasks);
    }
  }, [isLoading, tasks]);


  // Show loading screen while checking session
  if (isLoading) return <LoadingScreen />;

  // Still checking auth status - show loading to prevent flash of login screen
  if (authStatus === 'loading') return <LoadingScreen />;

  // No session found - show auth screen
  if (authStatus === 'unauthenticated') {
    return <AuthScreen />;
  }

  const theme = THEMES.find(t => t.id === settings.theme) || THEMES[0];

  const renderView = () => {
    switch (view) {
      case 'list': return <TaskListView />;
      case 'calendar': return <CalendarView />;
      case 'focus': return <FocusView />;
      case 'stats': return <StatsView />;
      case 'settings': return <SettingsView />;
      default: return <TaskListView />;
    }
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto relative" style={{ background: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-[100px]" style={{ background: `${theme.preview[1]}10` }} />
        <div className="absolute bottom-1/4 right-0 w-48 h-48 rounded-full blur-[80px]" style={{ background: `${theme.preview[2]}10` }} />
      </div>

      <div className="relative z-10">
        {view !== 'settings' && <Header />}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>

      <FAB />
      <BottomNav />
      <Toast />
      <AddTaskModal />
      <PomodoroModal />
      <AchievementsModal />
      <AIAssistantModal />
      <Confetti active={isDailyDone} />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
