import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { Task, Priority, TaskCategory, CATEGORIES, PRIORITY_CONFIG, THEMES, ThemeName } from '../types';
import { ai } from '../lib/ai';
import { sounds } from '../lib/sounds';
import { getTodayLocal, toLocalDateString } from '../lib/dateUtils';
import {
  Plus, Check, Trash2, Edit3, ChevronRight, Clock, Calendar,
  Mic, MicOff, Sparkles, Zap, Flame, Trophy, Target, Settings,
  LayoutList, CalendarDays, Timer, BarChart3, X, FileText,
  Play, Pause, RotateCcw, Bell, Cloud, Download, Upload,
  AlertCircle, Info, CheckCircle2, Loader2, Wand2, BellRing, Volume2,
} from 'lucide-react';
import { ProfileForm } from './ProfileForm';
import { PDFExportModal } from './PDFExportModal';

// ─── Toast ───
export function Toast() {
  const { toast, dismissToast } = useStore();
  if (!toast) return null;
  const colors = {
    success: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    error: 'from-red-500/20 to-red-500/5 border-red-500/30',
    info: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
  };
  const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
  const Icon = icons[toast.type];
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className={`fixed top-4 left-4 right-4 z-[100] glass-strong rounded-2xl p-4 border bg-gradient-to-r ${colors[toast.type]} flex items-center justify-between gap-3`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0" onClick={dismissToast}>
          <Icon size={20} className="shrink-0" />
          <span className="text-sm font-medium truncate">{toast.message}</span>
        </div>
        {toast.action && (
          <button
            onClick={(e) => { e.stopPropagation(); toast.action?.onClick(); }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap"
            style={{ background: 'var(--theme-accent)', color: '#fff' }}
          >
            {toast.action.label}
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Progress Ring ───
export function ProgressRing({ progress, size = 80, strokeWidth = 6 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--theme-card-border)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="var(--theme-accent)" strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

// ─── Header ───
export function Header() {
  const { stats, settings, setShowAchievements, setShowAI, setShowPomodoro, user, setShowAuth } = useStore();
  const xpProgress = ((stats.xp % 200) / 200) * 100;
  
  // Get greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  
  // Get display name from user or settings
  const displayName = user?.email 
    ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1)
    : settings.userName || 'User';

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="safe-top px-4 pt-4 pb-2"
    >
      <div className="flex items-center justify-between mb-4">
        {/* Logo & Greeting */}
        <div className="flex items-center gap-3">
          {/* App Logo */}
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'var(--theme-accent-gradient)', boxShadow: '0 4px 15px color-mix(in srgb, var(--theme-accent) 40%, transparent)' }}>
            <svg width="22" height="22" viewBox="0 0 100 100" fill="none">
              <path d="M30 52 L45 67 L72 33" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold neon-text leading-none">Do-It</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              {greeting}, <span style={{ color: 'var(--theme-accent)', fontWeight: 600 }}>{displayName}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {user ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { /* Show user profile */ }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'var(--theme-accent-gradient)' }}
            >
              {displayName.charAt(0).toUpperCase()}
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAuth(true)}
              className="w-10 h-10 rounded-xl glass flex items-center justify-center"
              style={{ color: 'var(--theme-accent)' }}
            >
              👤
            </motion.button>
          )}
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

      {/* Stats Bar */}
      <div className="glass rounded-2xl p-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white theme-accent-gradient">
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
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/15">
          <Flame size={14} className="text-orange-400" />
          <span className="text-sm font-bold text-orange-400">{stats.streak}</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)' }}>
          <Zap size={14} style={{ color: 'var(--theme-accent)' }} />
          <span className="text-sm font-bold" style={{ color: 'var(--theme-accent)' }}>{stats.xp}</span>
        </div>
      </div>
    </motion.header>
  );
}

// ─── Bottom Navigation ───
export function BottomNav() {
  const { view, setView } = useStore();
  const items = [
    { id: 'list' as const, icon: LayoutList, label: 'Tasks' },
    { id: 'calendar' as const, icon: CalendarDays, label: 'Calendar' },
    { id: 'focus' as const, icon: Target, label: 'Focus' },
    { id: 'stats' as const, icon: BarChart3, label: 'Stats' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
  ];
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-3xl border-t border-l border-r"
      style={{ 
        background: 'var(--theme-nav-bg)', 
        borderColor: 'var(--theme-card-border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.4)',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
      }}
    >
      <div className="max-w-md mx-auto px-2 py-2.5 flex items-center justify-around">
        {items.map(item => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => setView(item.id)}
              className="relative flex flex-col items-center justify-center w-16 h-14 transition-all"
            >
              {active && (
                <motion.div
                  layoutId="nav-active-bg"
                  className="absolute inset-0 rounded-2xl -z-10"
                  style={{ background: 'color-mix(in srgb, var(--theme-accent) 20%, transparent)' }}
                  transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                />
              )}
              <Icon 
                size={22} 
                strokeWidth={active ? 2.5 : 2} 
                style={active ? { color: 'var(--theme-accent)' } : { color: 'var(--theme-text-muted)' }}
              />
              <span 
                className="text-[10px] mt-1 font-bold tracking-tight transition-colors"
                style={active ? { color: 'var(--theme-accent)' } : { color: 'var(--theme-text-muted)' }}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Task Card ───
export function TaskCard({ task }: { task: Task }) {
  const { toggleTask, deleteTask, setEditingTask, setShowAddTask, toggleSubtask } = useStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [expanded, _setExpanded] = useState(true);
  
  const cat = CATEGORIES.find(c => c.value === task.category);
  const pri = PRIORITY_CONFIG[task.priority];
  const completedSubs = task.subtasks.filter(s => s.completed).length;
  const subProgress = task.subtasks.length > 0 ? (completedSubs / task.subtasks.length) * 100 : 0;

  return (
    <>
      <motion.div
        layout
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.x > 80) { sounds.complete(); toggleTask(task.id); }
          else if (info.offset.x < -80) { setShowConfirm(true); }
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className={`glass rounded-2xl p-4 mb-3 transition-all relative overflow-hidden ${task.completed ? 'opacity-50' : ''}`}
        style={{ borderLeft: `4px solid ${pri.color}` }}
      >
        <div className="flex items-start gap-3">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => { sounds.complete(); toggleTask(task.id); }}
            className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
              task.completed
                ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-transparent'
                : 'border-white/20 hover:border-purple-400'
            }`}
          >
            {task.completed && <Check size={14} className="text-white" />}
          </motion.button>

          <div className="flex-1 min-w-0">
            <p 
              className={`font-semibold text-[15px] leading-tight ${task.completed ? 'line-through opacity-40' : ''}`} 
              style={{ color: 'var(--theme-text)' }}
            >
              {task.title}
            </p>
            
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{ background: pri.bg, color: pri.color }}>
                {pri.label}
              </span>
              {cat && (
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--theme-card)', color: 'var(--theme-text-muted)' }}>
                  {cat.icon} {cat.label}
                </span>
              )}
              {task.dueDate && (
                <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--theme-text-muted)' }}>
                  <Calendar size={10} /> {task.dueDate}
                </span>
              )}
              {task.dueTime && (
                <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--theme-text-muted)' }}>
                  <Clock size={10} /> {task.dueTime}
                </span>
              )}
            </div>

            {task.subtasks.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] font-bold mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>
                  <span>Subtasks Progress</span>
                  <span>{completedSubs}/{task.subtasks.length}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--theme-card-border)' }}>
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    animate={{ width: `${subProgress}%` }}
                    transition={{ duration: 0.5, type: 'spring' }}
                  />
                </div>
                
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 space-y-2"
                    >
                      {task.subtasks.map(sub => (
                        <div key={sub.id} className="flex items-center gap-3">
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={() => toggleSubtask(task.id, sub.id)}
                            className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${
                              sub.completed ? 'bg-emerald-500/30 border-emerald-500/50' : 'border-white/10'
                            }`}
                          >
                            {sub.completed && <Check size={12} className="text-emerald-400" />}
                          </motion.button>
                          <span className={`text-[13px] transition-all ${sub.completed ? 'line-through text-white/20' : 'text-white/60'}`}>
                            {sub.title}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { setEditingTask(task); setShowAddTask(true); }}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/20 hover:text-blue-400 bg-white/5"
            >
              <Edit3 size={14} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowConfirm(true)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/20 hover:text-red-400 bg-white/5"
            >
              <Trash2 size={14} />
            </motion.button>
          </div>
        </div>

        {/* Swipe indicators */}
        <div className="absolute inset-y-0 left-0 w-1 bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-y-0 right-0 w-1 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-strong rounded-3xl p-8 w-full max-w-xs text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4 text-red-500">
                <Trash2 size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2">Delete Task?</h2>
              <p className="text-sm text-white/40 mb-6">Are you sure? This action will remove the task permanently.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-bold glass text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { deleteTask(task.id); setShowConfirm(false); }}
                  className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white text-sm shadow-lg shadow-red-500/30"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Add/Edit Task Modal (moved to ./AddTaskModal.tsx) ───
// @ts-ignore - kept for reference, do not use
export function _DeprecatedAddTaskModal() {
  const { showAddTask, setShowAddTask, editingTask, setEditingTask, addTask, updateTask, addSubtasks, showToast, settings, updateSettings } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [customCategory, setCustomCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [reminder, setReminder] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isGeneratingSubs, setIsGeneratingSubs] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setPriority(editingTask.priority);
      setCategory(editingTask.category);
      setCustomCategory(editingTask.customCategory || '');
      setDueDate(editingTask.dueDate || '');
      setDueTime(editingTask.dueTime || '');
      setRecurring(editingTask.recurring);
      setReminder(editingTask.reminder || '');
    } else {
      resetForm();
    }
  }, [editingTask, showAddTask]);

  function resetForm() {
    setTitle(''); setDescription(''); setPriority('medium'); setCategory('personal');
    setCustomCategory(''); setDueDate(''); setDueTime(''); setRecurring(false); setReminder('');
  }

  async function handleSmartParse() {
    if (!title.trim()) {
      showToast('Please enter a task first', 'error');
      return;
    }
    setIsParsing(true);
    try {
      const parsed = await ai.parseTask(title);
      if (parsed.title) setTitle(parsed.title);
      if (parsed.dueDate) setDueDate(parsed.dueDate);
      if (parsed.dueTime) setDueTime(parsed.dueTime);
      if (parsed.priority) setPriority(parsed.priority);
      if (parsed.category) setCategory(parsed.category);
      if (parsed.reminder) setReminder(parsed.reminder);
      showToast('AI parsed your task! ✨', 'success');
    } catch (e: any) {
      showToast(e.message || 'Parse failed', 'error');
    }
    setIsParsing(false);
  }

  async function handleGenerateSubtasks() {
    if (!title.trim()) {
      showToast('Please enter a task first', 'error');
      return;
    }
    setIsGeneratingSubs(true);
    try {
      const subs = await ai.generateSubtasks(title);
      if (editingTask) {
        await addSubtasks(editingTask.id, subs);
      }
      showToast(`Generated ${subs.length} subtasks!`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Generation failed', 'error');
    }
    setIsGeneratingSubs(false);
  }

  async function startVoice() {
    // Stop any existing recognition first
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Voice not supported in this browser. Try Chrome.', 'error');
      return;
    }

    // Check if running in secure context (required for mic access)
    if (!window.isSecureContext && location.hostname !== 'localhost') {
      showToast('Voice requires HTTPS', 'error');
      return;
    }

    // Request microphone permission first
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop the stream immediately - we just needed the permission
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        showToast('Microphone permission denied. Enable it in browser settings.', 'error');
      } else {
        showToast('Microphone unavailable', 'error');
      }
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      // Use device language; fallback to English. Supports Bangla, English, etc.
      recognition.lang = navigator.language || 'en-US';
      recognition.maxAlternatives = 1;
      
      let finalTranscript = '';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('Listening...');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interim += transcript;
          }
        }
        const fullText = (finalTranscript + interim).trim();
        if (fullText) {
          setTranscript(fullText);
          setTitle(fullText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech error:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          showToast('No speech detected. Try again.', 'info');
        } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          showToast('Microphone permission denied', 'error');
        } else if (event.error === 'audio-capture') {
          showToast('No microphone found', 'error');
        } else if (event.error === 'network') {
          showToast('Network error. Check your connection.', 'error');
        } else if (event.error !== 'aborted') {
          showToast(`Voice error: ${event.error}`, 'error');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      console.error('Recognition init error:', err);
      showToast('Failed to start voice recognition', 'error');
      setIsListening(false);
    }
  }

  function stopVoice() {
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.stop(); 
      } catch (e) {
        console.warn('Stop error:', e);
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    if (transcript === 'Listening...') {
      setTranscript('');
    }
  }

  function handleSubmit() {
    if (!title.trim()) return;
    const task: Task = {
      id: editingTask?.id || `task_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      title: title.trim(),
      description: description.trim() || undefined,
      completed: editingTask?.completed || false,
      priority,
      category,
      customCategory: category === 'custom' ? customCategory : undefined,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      reminder: reminder || undefined,
      recurring,
      subtasks: editingTask?.subtasks || [],
      createdAt: editingTask?.createdAt || new Date().toISOString(),
    };
    if (editingTask) {
      updateTask(task);
      showToast('Task updated! ✏️', 'success');
    } else {
      addTask(task);
    }
    setShowAddTask(false);
    setEditingTask(null);
    resetForm();
  }

  if (!showAddTask) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
        onClick={() => { setShowAddTask(false); setEditingTask(null); }}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[90] max-h-[90vh] overflow-y-auto"
      >
        <div className="rounded-t-3xl p-5 safe-bottom" style={{ background: 'var(--theme-bg-secondary)', borderTop: '1px solid var(--theme-card-border)' }}>
          <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--theme-text-muted)' }} />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>{editingTask ? 'Edit Task' : 'New Task'}</h2>
            <button onClick={() => { setShowAddTask(false); setEditingTask(null); }} className="w-8 h-8 rounded-lg glass flex items-center justify-center" style={{ color: 'var(--theme-text-secondary)' }}>
              <X size={16} />
            </button>
          </div>

          {/* Voice Input */}
          <div className="flex gap-2 mb-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { if (isListening) stopVoice(); else startVoice(); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isListening ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'glass'
              }`}
            >
              {isListening ? <><MicOff size={16} /> Stop</> : <><Mic size={16} /> Voice</>}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSmartParse}
              disabled={isParsing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-sm font-medium"
            >
              {isParsing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              AI Parse
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleGenerateSubtasks}
              disabled={isGeneratingSubs}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-sm font-medium"
            >
              {isGeneratingSubs ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Subtasks
            </motion.button>
          </div>

          {/* Voice Recording Indicator */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-3"
              >
                <div 
                  className="rounded-xl p-3.5 border-2 flex items-start gap-3"
                  style={{ 
                    background: 'color-mix(in srgb, #ef4444 10%, transparent)',
                    borderColor: 'rgba(239, 68, 68, 0.4)'
                  }}
                >
                  {/* Pulsing red dot */}
                  <div className="relative shrink-0 mt-0.5">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <motion.div 
                      className="absolute inset-0 bg-red-500 rounded-full"
                      animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-red-400 mb-1">Recording...</p>
                    <p className="text-sm break-words" style={{ color: 'var(--theme-text)' }}>
                      {transcript || 'Speak now...'}
                    </p>
                  </div>
                  {/* Animated waveform */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    {[0, 1, 2, 3].map(i => (
                      <motion.div
                        key={i}
                        className="w-1 bg-red-400 rounded-full"
                        animate={{ height: ['8px', '16px', '8px'] }}
                        transition={{ 
                          duration: 0.6, 
                          repeat: Infinity, 
                          delay: i * 0.1
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none mb-3 theme-input"
            style={{ 
              background: 'var(--theme-card)', 
              borderColor: 'var(--theme-card-border)',
              color: 'var(--theme-text)',
              caretColor: 'var(--theme-accent)'
            }}
          />

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none mb-3 resize-none theme-input"
            style={{ 
              background: 'var(--theme-card)', 
              borderColor: 'var(--theme-card-border)',
              color: 'var(--theme-text)',
              caretColor: 'var(--theme-accent)'
            }}
          />

          {/* Priority */}
          <div className="mb-3">
            <label className="text-xs mb-2 block" style={{ color: 'var(--theme-text-muted)' }}>Priority</label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as Priority[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all border"
                  style={priority === p 
                    ? { background: PRIORITY_CONFIG[p].bg, borderColor: PRIORITY_CONFIG[p].color, color: PRIORITY_CONFIG[p].color }
                    : { background: 'var(--theme-card)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-muted)' }
                  }
                >
                  {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="mb-3">
            <label className="text-xs mb-2 block" style={{ color: 'var(--theme-text-muted)' }}>Category</label>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className="shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all border"
                  style={category === c.value
                    ? { background: 'var(--theme-card-strong)', borderColor: 'var(--theme-accent)', color: 'var(--theme-text)' }
                    : { background: 'var(--theme-card)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-muted)' }
                  }
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
            {category === 'custom' && (
              <input
                type="text"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                placeholder="Custom category name"
                className="w-full mt-2 border rounded-xl px-4 py-2 text-sm focus:outline-none theme-input"
                style={{ 
                  background: 'var(--theme-card)', 
                  borderColor: 'var(--theme-card-border)',
                  color: 'var(--theme-text)',
                  caretColor: 'var(--theme-accent)'
                }}
              />
            )}
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[10px] font-bold mb-1.5 block uppercase tracking-wider opacity-60">Due Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none theme-input"
                  style={{ 
                    background: 'var(--theme-card)', 
                    borderColor: 'var(--theme-card-border)',
                    color: 'var(--theme-text)',
                  }}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold mb-1.5 block uppercase tracking-wider opacity-60">Time</label>
              <input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className="w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none theme-input"
                style={{ 
                  background: 'var(--theme-card)', 
                  borderColor: 'var(--theme-card-border)',
                  color: 'var(--theme-text)',
                }}
              />
            </div>
          </div>

          {/* Alarm / Reminder */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Notification Alarms</label>
              <div className="flex items-center gap-2">
                <BellRing size={14} className="text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400">High Priority: 5m, 3m, 1m</span>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {['chime', 'bell', 'zen', 'modern'].map(sound => (
                <button
                  key={sound}
                  type="button"
                  onClick={() => updateSettings({ alarmSound: sound })}
                  className="shrink-0 px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all"
                  style={{
                    background: settings.alarmSound === sound ? 'var(--theme-accent)' : 'var(--theme-card)',
                    borderColor: settings.alarmSound === sound ? 'var(--theme-accent)' : 'var(--theme-card-border)',
                    color: settings.alarmSound === sound ? '#fff' : 'var(--theme-text-muted)'
                  }}
                >
                  <Volume2 size={14} />
                  {sound.charAt(0).toUpperCase() + sound.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Recurring & Reminder */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setRecurring(!recurring)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all"
              style={recurring 
                ? { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }
                : { background: 'var(--theme-card)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-muted)' }
              }
            >
              🔄 Daily Recurring
            </button>
          </div>

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm disabled:opacity-40 transition-all"
            style={{ background: 'var(--theme-accent-gradient)' }}
          >
            {editingTask ? 'Update Task' : 'Add Task'}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Floating Action Button ───
export function FAB() {
  const { setShowAddTask, setEditingTask } = useStore();
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => { setEditingTask(null); setShowAddTask(true); }}
      className="fixed right-5 z-[60] w-[60px] h-[60px] rounded-[22px] flex items-center justify-center shadow-2xl animate-pulse-glow text-white border border-white/20"
      style={{ 
        bottom: 'calc(78px + env(safe-area-inset-bottom, 0px))',
        background: 'var(--theme-accent-gradient)',
        boxShadow: '0 15px 35px -5px color-mix(in srgb, var(--theme-accent) 50%, transparent)'
      }}
    >
      <Plus size={30} strokeWidth={3} />
    </motion.button>
  );
}

// ─── Date Strip (swipeable horizontal date selector) ───
function DateStrip({ selectedDate, onSelect, tasks }: { selectedDate: string; onSelect: (d: string) => void; tasks: Task[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayStr = getTodayLocal();

  // Generate all days of the current running month
  const days = useMemo(() => {
    const arr: { dateStr: string; date: Date; dayName: string; dayNum: number; hasTasks: boolean; isToday: boolean }[] = [];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Get number of days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = toLocalDateString(d);
      arr.push({
        dateStr,
        date: d,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: day,
        hasTasks: tasks.some(t => t.dueDate === dateStr || (!t.dueDate && dateStr === todayStr && !t.completed)),
        isToday: dateStr === todayStr,
      });
    }
    return arr;
  }, [tasks, todayStr]);

  // Auto-scroll to selected date on mount/change
  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current.querySelector(`[data-date="${selectedDate}"]`) as HTMLElement;
    if (el) {
      const containerWidth = scrollRef.current.clientWidth;
      const elLeft = el.offsetLeft;
      const elWidth = el.offsetWidth;
      scrollRef.current.scrollTo({
        left: elLeft - containerWidth / 2 + elWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [selectedDate]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-1 snap-x snap-mandatory"
      style={{ scrollbarWidth: 'none' }}
    >
      {days.map(d => {
        const isSelected = d.dateStr === selectedDate;
        return (
          <motion.button
            key={d.dateStr}
            data-date={d.dateStr}
            whileTap={{ scale: 0.92 }}
            onClick={() => onSelect(d.dateStr)}
            className="snap-center shrink-0 w-[60px] h-[78px] rounded-2xl flex flex-col items-center justify-center transition-all relative"
            style={{
              background: isSelected
                ? 'var(--theme-accent-gradient)'
                : 'var(--theme-card-strong)',
              border: isSelected ? 'none' : `1px solid var(--theme-card-border)`,
              color: isSelected ? '#ffffff' : 'var(--theme-text-secondary)',
              boxShadow: isSelected ? '0 8px 24px color-mix(in srgb, var(--theme-accent) 30%, transparent)' : 'none',
            }}
          >
            <span className="text-[11px] font-medium opacity-80 mb-0.5">{d.dayName}</span>
            <span className="text-xl font-bold">{d.dayNum}</span>
            {d.isToday && !isSelected && (
              <div
                className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--theme-accent)' }}
              />
            )}
            {d.hasTasks && !isSelected && !d.isToday && (
              <div
                className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--theme-accent)' }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Task List View ───
export function TaskListView() {
  const { tasks, selectedDate, setSelectedDate } = useStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'done' | TaskCategory>('all');

  // Tasks for selected date
  const dateTasks = useMemo(() => {
    const todayStr = getTodayLocal();
    return tasks.filter(t => {
      // 1. Daily/Recurring tasks: always show on today, regardless of their original assigned date
      if (t.recurring && selectedDate === todayStr) return true;
      
      // 2. One-time tasks: ONLY show on their assigned date
      if (t.dueDate === selectedDate) return true;
      
      // 3. One-time untimed tasks: only show on today
      if (!t.dueDate && !t.recurring && selectedDate === todayStr) return true;
      
      return false;
    });
  }, [tasks, selectedDate]);

  // Apply filter
  const filteredTasks = useMemo(() => {
    return dateTasks
      .filter(t => {
        if (filter === 'pending' && t.completed) return false;
        if (filter === 'done' && !t.completed) return false;
        if (filter !== 'all' && filter !== 'pending' && filter !== 'done') {
          if (t.category !== filter) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const pOrder = { high: 0, medium: 1, low: 2 };
        return pOrder[a.priority] - pOrder[b.priority];
      });
  }, [dateTasks, filter]);

  const completedCount = dateTasks.filter(t => t.completed).length;
  const totalCount = dateTasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const isToday = selectedDate === getTodayLocal();
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const dateLabel = isToday
    ? "Today"
    : selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="px-4 pb-24">
      {/* ── Today's Progress Hero Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl p-5 mb-5 shadow-xl"
        style={{ background: 'var(--bg-card)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {isToday ? "Today's Progress" : `${dateLabel}'s Progress`}
            </p>
            <div className="flex items-baseline gap-2 mb-2">
              <motion.span
                key={completedCount}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {completedCount}
              </motion.span>
              <span className="text-sm opacity-60" style={{ color: 'var(--text-primary)' }}>
                / {totalCount} tasks
              </span>
            </div>
            <p className="text-xs opacity-60" style={{ color: 'var(--text-primary)' }}>
              {totalCount === 0
                ? "Let's get started!"
                : progress === 100
                ? '🎉 All done!'
                : `${totalCount - completedCount} remaining`}
            </p>
          </div>
          <ProgressRing progress={progress} size={84} strokeWidth={6} />
        </div>
      </motion.div>

      {/* ── Daily Tasks Section Header ── */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Daily Tasks
        </h2>
        <div className="flex items-center gap-2">
          {!isToday && (
            <button
              onClick={() => setSelectedDate(getTodayLocal())}
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/5 border border-white/10"
              style={{ color: 'var(--accent-primary)' }}
            >
              Today
            </button>
          )}
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-white/40">
            <span className="text-lg">•••</span>
          </button>
        </div>
      </div>

      {/* ── Swipeable Date Strip ── */}
      <div className="mb-6">
        <DateStrip
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          tasks={tasks}
        />
      </div>

      {/* ── Filter Pills ── */}
      <div className="flex gap-2.5 mb-5 overflow-x-auto hide-scrollbar -mx-4 px-4">
        <FilterPill
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label="All"
        />
        <FilterPill
          active={filter === 'pending'}
          onClick={() => setFilter('pending')}
          label="Pending"
        />
        <FilterPill
          active={filter === 'done'}
          onClick={() => setFilter('done')}
          label="Done"
          icon="✅"
        />
        {CATEGORIES.filter(c => c.value !== 'custom').map(c => (
          <FilterPill
            key={c.value}
            active={filter === c.value}
            onClick={() => setFilter(c.value)}
            label={c.label}
            icon={c.icon}
          />
        ))}
      </div>

      {/* ── Task List ── */}
      <AnimatePresence mode="popLayout">
        {filteredTasks.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <div className="text-5xl mb-3">
              {totalCount === 0 ? '✨' : filter === 'done' ? '🎯' : '🌟'}
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {totalCount === 0
                ? `No tasks for ${isToday ? 'today' : dateLabel}`
                : filter === 'done'
                ? 'No completed tasks yet'
                : filter === 'pending'
                ? 'All caught up! 🎉'
                : 'No tasks in this filter'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
              {totalCount === 0 && 'Tap + to add one'}
            </p>
          </motion.div>
        ) : (
          filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Filter Pill ──
function FilterPill({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon?: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 border"
      style={
        active
          ? {
              background: 'var(--theme-accent)',
              color: '#ffffff',
              borderColor: 'var(--theme-accent)',
            }
          : {
              background: 'var(--theme-card-strong)',
              color: 'var(--theme-text-secondary)',
              borderColor: 'var(--theme-card-border)',
            }
      }
    >
      {icon && <span className="text-base leading-none">{icon}</span>}
      <span style={{ color: active ? '#ffffff' : undefined }}>{label}</span>
    </motion.button>
  );
}

// ─── Calendar View ───
export function CalendarView() {
  const { tasks } = useStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(getTodayLocal());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long' });
  const year = currentMonth.getFullYear();

  // Generate years (10 before to 10 after current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(t => {
      if (t.dueDate) {
        if (!map[t.dueDate]) map[t.dueDate] = [];
        map[t.dueDate].push(t);
      }
    });
    return map;
  }, [tasks]);

  const selectedTasks = tasksByDate[selectedDay] || [];

  return (
    <div className="px-4 pb-24">
      <div className="glass rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="w-9 h-9 rounded-lg glass flex items-center justify-center"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            ←
          </button>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setShowMonthPicker(!showMonthPicker); setShowYearPicker(false); }}
              className="px-3 py-1.5 rounded-lg font-bold text-sm transition-all"
              style={{ 
                background: showMonthPicker ? 'var(--theme-accent)' : 'transparent',
                color: showMonthPicker ? '#fff' : 'var(--theme-text)'
              }}
            >
              {monthName}
            </button>
            <button
              onClick={() => { setShowYearPicker(!showYearPicker); setShowMonthPicker(false); }}
              className="px-3 py-1.5 rounded-lg font-bold text-sm transition-all"
              style={{ 
                background: showYearPicker ? 'var(--theme-accent)' : 'transparent',
                color: showYearPicker ? '#fff' : 'var(--theme-text)'
              }}
            >
              {year}
            </button>
          </div>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="w-9 h-9 rounded-lg glass flex items-center justify-center"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            →
          </button>
        </div>

        {/* Year Picker Dropdown */}
        <AnimatePresence>
          {showYearPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-3"
            >
              <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-1">
                {years.map(y => (
                  <motion.button
                    key={y}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      setCurrentMonth(new Date(y, currentMonth.getMonth(), 1));
                      setShowYearPicker(false);
                    }}
                    className="py-2 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background: y === year ? 'var(--theme-accent-gradient)' : 'var(--theme-card)',
                      color: y === year ? '#fff' : 'var(--theme-text)',
                      border: y === currentYear && y !== year ? '1px solid var(--theme-accent)' : 'none',
                    }}
                  >
                    {y}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Month Picker Dropdown */}
        <AnimatePresence>
          {showMonthPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-3"
            >
              <div className="grid grid-cols-3 gap-2 p-1">
                {months.map((m, idx) => (
                  <motion.button
                    key={m}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      setCurrentMonth(new Date(currentMonth.getFullYear(), idx, 1));
                      setShowMonthPicker(false);
                    }}
                    className="py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: idx === currentMonth.getMonth() ? 'var(--theme-accent-gradient)' : 'var(--theme-card)',
                      color: idx === currentMonth.getMonth() ? '#fff' : 'var(--theme-text)',
                    }}
                  >
                    {m.substring(0, 3)}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="text-center text-[10px] py-1" style={{ color: 'var(--theme-text-muted)' }}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasTasks = tasksByDate[dateStr]?.length > 0;
            const isSelected = dateStr === selectedDay;
            const isToday = dateStr === getTodayLocal();
            return (
              <motion.button
                key={day}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedDay(dateStr)}
                className="aspect-square rounded-xl flex flex-col items-center justify-center text-xs relative transition-all"
                style={{
                  background: isSelected ? 'var(--theme-accent-gradient)' : (isToday ? 'color-mix(in srgb, var(--theme-accent) 12%, transparent)' : 'transparent'),
                  border: isToday && !isSelected ? '1px solid var(--theme-accent)' : 'none',
                  color: isSelected ? '#fff' : (isToday ? 'var(--theme-accent)' : 'var(--theme-text)'),
                  fontWeight: isSelected || isToday ? 'bold' : 'normal',
                }}
              >
                {day}
                {hasTasks && (
                  <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: isSelected ? '#fff' : 'var(--theme-accent)' }} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <h3 className="text-sm font-semibold mb-3 text-white/60">
        {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
      </h3>

      <AnimatePresence>
        {selectedTasks.length === 0 ? (
          <div className="text-center py-8 text-white/30 text-sm">No tasks for this day</div>
        ) : (
          selectedTasks.map(task => <TaskCard key={task.id} task={task} />)
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Pomodoro Timer ───
export function PomodoroModal() {
  const { showPomodoro, setShowPomodoro, settings, incrementPomodoros } = useStore();
  const [timeLeft, setTimeLeft] = useState(settings.pomodoro.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const isLastTenSeconds = timeLeft <= 10 && timeLeft > 0 && isRunning;

  const totalTime = isBreak
    ? (sessions % settings.pomodoro.sessionsBeforeLongBreak === 0
      ? settings.pomodoro.longBreakDuration * 60
      : settings.pomodoro.breakDuration * 60)
    : settings.pomodoro.focusDuration * 60;

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          // Tick sound in last 10 seconds
          if (t <= 10 && t > 0) {
            sounds.tick();
          }
          if (t <= 1) {
            clearInterval(intervalRef.current);
            if (!isBreak) {
              // Focus session ended
              sounds.pomodoroEnd();
              incrementPomodoros();
              setSessions(s => s + 1);
              setIsBreak(true);
              const breakTime = (sessions + 1) % settings.pomodoro.sessionsBeforeLongBreak === 0
                ? settings.pomodoro.longBreakDuration * 60
                : settings.pomodoro.breakDuration * 60;
              return breakTime;
            } else {
              // Break ended
              sounds.breakEnd();
              setIsBreak(false);
              return settings.pomodoro.focusDuration * 60;
            }
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isBreak, sessions, settings.pomodoro, incrementPomodoros]);

  // Play start sound when timer starts
  function toggleTimer() {
    if (!isRunning) {
      // Starting - play start chime
      sounds.complete();
    }
    setIsRunning(!isRunning);
  }

  function resetTimer() {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(settings.pomodoro.focusDuration * 60);
    setSessions(0);
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  if (!showPomodoro) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
        onClick={() => { setShowPomodoro(false); setIsRunning(false); }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="glass-strong rounded-3xl p-8 w-full max-w-sm text-center"
          style={isLastTenSeconds ? { border: '2px solid rgba(239,68,68,0.5)', boxShadow: '0 0 40px rgba(239,68,68,0.2)' } : {}}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">{isBreak ? '☕ Break Time' : '🍅 Focus Time'}</h2>
            <button onClick={() => { setShowPomodoro(false); setIsRunning(false); }} className="w-8 h-8 rounded-lg glass flex items-center justify-center">
              <X size={16} />
            </button>
          </div>

          {/* Last 10 seconds warning */}
          <AnimatePresence>
            {isLastTenSeconds && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 px-4 py-2 rounded-xl text-sm font-bold text-red-400"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                ⚡ {timeLeft} seconds remaining!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Timer Ring */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <svg width={200} height={200} className="-rotate-90">
              <circle cx={100} cy={100} r={90} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
              <motion.circle
                cx={100} cy={100} r={90} fill="none"
                stroke={isLastTenSeconds ? '#ef4444' : (isBreak ? '#10b981' : 'var(--theme-accent)')}
                strokeWidth={isLastTenSeconds ? 10 : 8}
                strokeLinecap="round"
                strokeDasharray={565.48}
                strokeDashoffset={565.48 - (progress / 100) * 565.48}
                animate={isLastTenSeconds ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
                transition={isLastTenSeconds ? { duration: 0.5, repeat: Infinity } : {}}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-5xl font-bold tabular-nums"
                animate={isLastTenSeconds ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                transition={isLastTenSeconds ? { duration: 0.5, repeat: Infinity } : {}}
                style={{ color: isLastTenSeconds ? '#ef4444' : 'var(--theme-text)' }}
              >
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </motion.span>
              <span className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>Session {sessions + 1}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={resetTimer}
              className="w-12 h-12 rounded-2xl glass flex items-center justify-center"
            >
              <RotateCcw size={20} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTimer}
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white"
              style={{ background: 'var(--theme-accent-gradient)' }}
            >
              {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </motion.button>
            <div className="w-12 h-12" />
          </div>

          <div className="flex justify-center gap-1.5 mt-4">
            {Array.from({ length: settings.pomodoro.sessionsBeforeLongBreak }).map((_, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: i < sessions % settings.pomodoro.sessionsBeforeLongBreak
                    ? 'var(--accent-primary)'
                    : 'var(--bg-hover)',
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Focus Mode View ───
export function FocusView() {
  const { tasks, setShowPomodoro, toggleTask } = useStore();
  const activeTasks = tasks.filter(t => !t.completed).slice(0, 5);

  return (
    <div className="px-4 pb-24">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold mb-1">Focus Mode</h2>
        <p className="text-sm text-white/40">Stay focused on what matters</p>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowPomodoro(true)}
        className="w-full glass-strong rounded-2xl p-6 mb-6 text-center"
      >
        <Timer size={40} className="mx-auto mb-3 text-purple-400" />
        <p className="font-semibold">Start Pomodoro</p>
        <p className="text-xs text-white/40 mt-1">25 min focus session</p>
      </motion.button>

      <h3 className="text-sm font-semibold text-white/60 mb-3">Top Priorities</h3>
      <div className="space-y-2">
        {activeTasks.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-2xl p-4 flex items-center gap-3"
            style={{ borderLeft: `3px solid ${PRIORITY_CONFIG[task.priority].color}` }}
          >
            <button
              onClick={() => { sounds.complete(); toggleTask(task.id); }}
              className="w-6 h-6 rounded-lg border-2 border-white/20 flex items-center justify-center shrink-0 hover:border-purple-400"
            >
              {task.completed && <Check size={14} className="text-purple-400" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{task.title}</p>
              <span className="text-[10px] text-white/40">{PRIORITY_CONFIG[task.priority].label} priority</span>
            </div>
          </motion.div>
        ))}
        {activeTasks.length === 0 && (
          <div className="text-center py-8 text-white/30 text-sm">All tasks done! 🎉</div>
        )}
      </div>
    </div>
  );
}

// ─── Stats View ───
export function StatsView() {
  const { stats, tasks, setShowAchievements } = useStore();
  const categoryStats = CATEGORIES.map(c => ({
    ...c,
    count: tasks.filter(t => t.category === c.value).length,
  })).filter(c => c.count > 0);

  const priorityStats = (['high', 'medium', 'low'] as Priority[]).map(p => ({
    priority: p,
    count: tasks.filter(t => t.priority === p).length,
    completed: tasks.filter(t => t.priority === p && t.completed).length,
  }));

  const unlockedCount = stats.achievements.filter(a => a.unlockedAt).length;

  return (
    <div className="px-4 pb-24">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass rounded-2xl p-4 text-center">
          <Zap size={24} className="mx-auto mb-2 text-purple-400" />
          <p className="text-2xl font-bold">{stats.xp}</p>
          <p className="text-xs text-white/40">Total XP</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <Flame size={24} className="mx-auto mb-2 text-orange-400" />
          <p className="text-2xl font-bold">{stats.streak}</p>
          <p className="text-xs text-white/40">Day Streak</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <CheckCircle2 size={24} className="mx-auto mb-2 text-green-400" />
          <p className="text-2xl font-bold">{stats.totalTasksCompleted}</p>
          <p className="text-xs text-white/40">Tasks Done</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <Timer size={24} className="mx-auto mb-2 text-red-400" />
          <p className="text-2xl font-bold">{stats.totalPomodoros}</p>
          <p className="text-xs text-white/40">Pomodoros</p>
        </div>
      </div>

      {/* Level Progress */}
      <div className="glass rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Level {stats.level}</span>
          <span className="text-xs text-white/40">Level {stats.level + 1}</span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--level-bg)' }}
            initial={{ width: 0 }}
            animate={{ width: `${((stats.xp % 200) / 200) * 100}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <p className="text-xs text-white/40 mt-1">{stats.xp % 200}/200 XP to next level</p>
      </div>

      {/* Achievements Preview */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowAchievements(true)}
        className="w-full glass rounded-2xl p-4 mb-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Trophy size={24} className="text-amber-400" />
          <div className="text-left">
            <p className="text-sm font-semibold">Achievements</p>
            <p className="text-xs text-white/40">{unlockedCount}/{stats.achievements.length} unlocked</p>
          </div>
        </div>
        <ChevronRight size={20} className="text-white/30" />
      </motion.button>

      {/* Category Breakdown */}
      {categoryStats.length > 0 && (
        <div className="glass rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-semibold mb-3">Categories</h3>
          {categoryStats.map(cat => {
            const maxCount = Math.max(...categoryStats.map(c => c.count));
            const pct = (cat.count / maxCount) * 100;
            return (
              <div key={cat.value} className="mb-2 last:mb-0">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>{cat.icon} {cat.label}</span>
                  <span className="text-white/40">{cat.count}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: cat.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Priority Breakdown */}
      <div className="glass rounded-2xl p-4">
        <h3 className="text-sm font-semibold mb-3">Priority Breakdown</h3>
        {priorityStats.map(ps => (
          <div key={ps.priority} className="flex items-center gap-3 mb-2 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ background: PRIORITY_CONFIG[ps.priority].color }} />
            <span className="text-xs flex-1">{PRIORITY_CONFIG[ps.priority].label}</span>
            <span className="text-xs text-white/40">{ps.completed}/{ps.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Achievements Modal ───
export function AchievementsModal() {
  const { showAchievements, setShowAchievements, stats } = useStore();
  if (!showAchievements) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
        onClick={() => setShowAchievements(false)}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[90] max-h-[85vh] overflow-y-auto"
      >
        <div className="rounded-t-3xl p-5 safe-bottom" style={{ background: 'var(--theme-bg-secondary)', borderTop: '1px solid var(--theme-card-border)' }}>
          <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--theme-text-muted)' }} />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>🏆 Achievements</h2>
            <button onClick={() => setShowAchievements(false)} className="w-8 h-8 rounded-lg glass flex items-center justify-center" style={{ color: 'var(--theme-text-secondary)' }}>
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {stats.achievements.map(a => {
              const unlocked = !!a.unlockedAt;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`rounded-2xl p-4 text-center ${
                    unlocked ? 'glass border border-amber-500/20' : 'bg-white/[0.02] border border-white/5'
                  }`}
                >
                  <div className={`text-3xl mb-2 ${unlocked ? '' : 'grayscale opacity-30'}`}>{a.icon}</div>
                  <p className={`text-xs font-semibold mb-0.5 ${unlocked ? 'text-white' : 'text-white/30'}`}>{a.name}</p>
                  <p className={`text-[10px] ${unlocked ? 'text-white/50' : 'text-white/20'}`}>{a.description}</p>
                  {unlocked && (
                    <p className="text-[9px] text-amber-400/60 mt-1">
                      {new Date(a.unlockedAt!).toLocaleDateString()}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── AI Assistant Modal ───
export function AIAssistantModal() {
  const { showAI, setShowAI, tasks, showToast } = useStore();
  const [suggestions, setSuggestions] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function getSuggestions() {
    setLoading(true);
    try {
      const taskTitles = tasks.filter(t => !t.completed).map(t => t.title);
      const result = await ai.suggestImprovements(taskTitles);
      setSuggestions(result);
    } catch (e: any) {
      showToast(e.message || 'Failed to get suggestions', 'error');
    }
    setLoading(false);
  }

  if (!showAI) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
        onClick={() => setShowAI(false)}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[90] max-h-[80vh] overflow-y-auto"
      >
        <div className="rounded-t-3xl p-5 safe-bottom" style={{ background: 'var(--theme-bg-secondary)', borderTop: '1px solid var(--theme-card-border)' }}>
          <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--theme-text-muted)' }} />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
              <Sparkles size={20} className="theme-accent" /> AI Assistant
            </h2>
            <button onClick={() => setShowAI(false)} className="w-8 h-8 rounded-lg glass flex items-center justify-center" style={{ color: 'var(--theme-text-secondary)' }}>
              <X size={16} />
            </button>
          </div>

          {(
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={getSuggestions}
                  disabled={loading}
                  className="glass rounded-2xl p-4 text-center"
                >
                  {loading ? <Loader2 size={24} className="mx-auto mb-2 animate-spin text-purple-400" /> : <Wand2 size={24} className="mx-auto mb-2 text-purple-400" />}
                  <p className="text-xs font-medium">Get Suggestions</p>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setShowAI(false); useStore.getState().setShowAddTask(true); }}
                  className="glass rounded-2xl p-4 text-center"
                >
                  <Sparkles size={24} className="mx-auto mb-2 text-pink-400" />
                  <p className="text-xs font-medium">Smart Add Task</p>
                </motion.button>
              </div>

              {suggestions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-4"
                >
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-400" /> AI Suggestions
                  </h3>
                  <div className="text-sm text-white/70 whitespace-pre-line">{suggestions}</div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Theme Picker ───
export function ThemePicker() {
  const { settings, updateSettings } = useStore();
  const [showAll, setShowAll] = useState(false);

  function handleThemeChange(themeId: ThemeName) {
    document.documentElement.classList.add('theme-transition');
    updateSettings({ theme: themeId });
    setTimeout(() => document.documentElement.classList.remove('theme-transition'), 500);
  }

  const visibleThemes = showAll ? THEMES : THEMES.slice(0, 4);

  return (
    <div className="glass rounded-2xl p-4 mb-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        🎨 Theme
      </h3>
      <div className="grid grid-cols-4 gap-2 mb-2">
        {visibleThemes.map(theme => {
          const isActive = settings.theme === theme.id;
          return (
            <motion.button
              key={theme.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleThemeChange(theme.id)}
              className={`relative rounded-2xl p-3 text-center transition-all ${
                isActive
                  ? 'ring-2 ring-offset-2 ring-offset-transparent'
                  : 'hover:scale-105'
              }`}
              style={{
                background: `linear-gradient(135deg, ${theme.preview[0]}, ${theme.preview[0]}dd)`,
                border: isActive ? `2px solid ${theme.preview[1]}` : '1px solid rgba(255,255,255,0.1)',
                boxShadow: isActive ? `0 0 12px ${theme.preview[1]}60` : 'none',
              }}
            >
              <div className="text-xl mb-1">{theme.icon}</div>
              <p className="text-[10px] font-medium" style={{ color: theme.isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)' }}>
                {theme.name}
              </p>
              {/* Color dots */}
              <div className="flex justify-center gap-0.5 mt-1">
                {theme.preview.slice(1).map((c, i) => (
                  <div key={i} className="w-2 h-2 rounded-full" style={{ background: c }} />
                ))}
              </div>
              {isActive && (
                <motion.div
                  layoutId="themeCheck"
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: theme.preview[1] }}
                >
                  <Check size={10} className="text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
      {THEMES.length > 4 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-xs py-1.5 rounded-lg"
          style={{ color: 'var(--text-muted)' }}
        >
          {showAll ? 'Show less' : `+${THEMES.length - 4} more themes`}
        </button>
      )}
    </div>
  );
}

// ─── Settings View ───
export function SettingsView() {
  const { settings, updateSettings, showToast, user, logout, setShowAuth } = useStore();
  const [showExportModal, setShowExportModal] = useState(false);

  async function handleExport() {
    const { db } = await import('../lib/db');
    const data = await db.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doit-backup-${getTodayLocal()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported! 📦', 'success');
  }

  async function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      const { db } = await import('../lib/db');
      const success = await db.importData(text);
      if (success) {
        showToast('Data imported! Reloading...', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showToast('Import failed. Invalid file.', 'error');
      }
    };
    input.click();
  }

  return (
    <div className="px-4 pb-24">
      <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--theme-text)' }}>Settings</h2>

      {/* Account / Sync */}
      <div className="glass rounded-2xl p-4 mb-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
          <Cloud size={16} style={{ color: 'var(--theme-accent)' }} /> Account & Sync
        </h3>
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold theme-accent-gradient text-white">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--theme-text)' }}>{user.email}</p>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Synced to cloud</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={async () => {
                await logout();
                showToast('Logged out', 'info');
              }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold border transition-all"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                color: '#ef4444'
              }}
            >
              Sign Out
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAuth(true)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--theme-accent-gradient)' }}
          >
            Sign In / Sign Up
          </motion.button>
        )}
      </div>

      {/* Profile - Full Form */}
      <ProfileForm />

      {/* Language Selector */}
      <div className="glass rounded-2xl p-4 mb-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
          🌐 Language
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => updateSettings({ language: 'en' })}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all"
            style={settings.language === 'en' 
              ? { background: 'var(--theme-accent)', borderColor: 'var(--theme-accent)', color: '#fff' }
              : { background: 'var(--theme-card)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-secondary)' }
            }
          >
            English
          </button>
          <button
            onClick={() => updateSettings({ language: 'bn' })}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all"
            style={settings.language === 'bn' 
              ? { background: 'var(--theme-accent)', borderColor: 'var(--theme-accent)', color: '#fff' }
              : { background: 'var(--theme-card)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-secondary)' }
            }
          >
            বাংলা (Bengali)
          </button>
        </div>
        <p className="text-[10px] mt-2" style={{ color: 'var(--theme-text-muted)' }}>
          Voice input will prioritize the selected language.
        </p>
      </div>

      {/* Theme Picker */}
      <ThemePicker />

      {/* AI Settings - Just Toggle */}
      <div className="glass rounded-2xl p-4 mb-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
          <Sparkles size={16} style={{ color: 'var(--theme-accent)' }} /> AI Assistant
        </h3>
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm" style={{ color: 'var(--theme-text)' }}>Enable AI Features</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>Smart parsing & subtask generation</p>
          </div>
          <button
            onClick={() => updateSettings({ aiEnabled: !settings.aiEnabled })}
            className="relative w-11 h-6 rounded-full transition-all"
            style={{ background: settings.aiEnabled ? 'var(--theme-accent)' : 'var(--theme-card-border)' }}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-md ${settings.aiEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg" style={{ background: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)' }}>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>AI service active • Powered by Gemini</p>
        </div>
      </div>

      {/* Pomodoro Settings */}
      <div className="glass rounded-2xl p-4 mb-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Timer size={16} className="text-red-400" /> Pomodoro Timer
        </h3>
        <div className="space-y-3">
          {[
            { key: 'focusDuration' as const, label: 'Focus (min)', min: 1, max: 90 },
            { key: 'breakDuration' as const, label: 'Break (min)', min: 1, max: 30 },
            { key: 'longBreakDuration' as const, label: 'Long Break (min)', min: 1, max: 60 },
            { key: 'sessionsBeforeLongBreak' as const, label: 'Sessions', min: 1, max: 8 },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="text-sm text-white/70">{item.label}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateSettings({
                    pomodoro: { ...settings.pomodoro, [item.key]: Math.max(item.min, settings.pomodoro[item.key] - 1) }
                  })}
                  className="w-7 h-7 rounded-lg glass flex items-center justify-center text-sm"
                >−</button>
                <span className="text-sm font-medium w-6 text-center">{settings.pomodoro[item.key]}</span>
                <button
                  onClick={() => updateSettings({
                    pomodoro: { ...settings.pomodoro, [item.key]: Math.min(item.max, settings.pomodoro[item.key] + 1) }
                  })}
                  className="w-7 h-7 rounded-lg glass flex items-center justify-center text-sm"
                >+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="glass rounded-2xl p-4 mb-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Bell size={16} className="text-amber-400" /> Notifications
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">Enable Notifications</span>
          <button
            onClick={async () => {
              if (!settings.notificationsEnabled) {
                const { notifications } = await import('../lib/notifications');
                const granted = await notifications.requestPermission();
                updateSettings({ notificationsEnabled: granted });
                if (granted) showToast('Notifications enabled! 🔔', 'success');
              } else {
                updateSettings({ notificationsEnabled: false });
              }
            }}
            className={`w-11 h-6 rounded-full transition-all ${settings.notificationsEnabled ? '' : 'bg-white/10'}`}
            style={settings.notificationsEnabled ? { background: 'var(--accent-primary)' } : {}}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.notificationsEnabled ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Data */}
      <div className="glass rounded-2xl p-4 mb-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
          <Cloud size={16} style={{ color: 'var(--theme-accent)' }} /> Data Management
        </h3>
        
        {/* PDF Export Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowExportModal(true)}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 mb-2"
          style={{ background: 'var(--theme-accent-gradient)' }}
        >
          <FileText size={16} />
          Export as PDF
        </motion.button>

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 border"
            style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-secondary)' }}
          >
            <Download size={14} /> JSON Export
          </button>
          <button
            onClick={handleImport}
            className="flex-1 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 border"
            style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-secondary)' }}
          >
            <Upload size={14} /> Import
          </button>
        </div>
      </div>
      
      {/* PDF Export Modal */}
      {showExportModal && <PDFExportModal onClose={() => setShowExportModal(false)} />}
    </div>
  );
}
