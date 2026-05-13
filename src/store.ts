import { create } from 'zustand';
import { Task, UserStats, AppSettings, ViewMode, DEFAULT_ACHIEVEMENTS, Subtask } from './types';
import { db } from './lib/db';
import { auth } from './lib/auth';
import { supabase } from './lib/supabase';
import { getTodayLocal, getYesterdayLocal } from './lib/dateUtils';
import { sounds } from './lib/sounds';

interface AppState {
  tasks: Task[];
  stats: UserStats;
  settings: AppSettings;
  view: ViewMode;
  isLoading: boolean;
  isOnline: boolean;
  showAddTask: boolean;
  editingTask: Task | null;
  selectedDate: string;
  focusMode: boolean;
  showAI: boolean;
  showVoice: boolean;
  showPomodoro: boolean;
  showAchievements: boolean;
  showCalendar: boolean;
  showAuth: boolean;
  user: any | null;
  authStatus: 'loading' | 'authenticated' | 'unauthenticated';
  toast: { message: string; type: 'success' | 'error' | 'info'; action?: { label: string; onClick: () => void } } | null;
  deletedTaskBuffer: Task | null;

  init: () => Promise<void>;
  setView: (v: ViewMode) => void;
  setShowAddTask: (s: boolean) => void;
  setEditingTask: (t: Task | null) => void;
  setSelectedDate: (d: string) => void;
  setFocusMode: (f: boolean) => void;
  setShowAI: (s: boolean) => void;
  setShowVoice: (s: boolean) => void;
  setShowPomodoro: (s: boolean) => void;
  setShowAchievements: (s: boolean) => void;
  setShowCalendar: (s: boolean) => void;
  setShowAuth: (s: boolean) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: () => void;

  addTask: (task: Task) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  addSubtasks: (taskId: string, subtasks: Subtask[]) => Promise<void>;

  addXP: (amount: number) => Promise<void>;
  incrementStreak: () => Promise<void>;
  checkAchievements: () => Promise<void>;
  incrementPomodoros: () => Promise<void>;

  updateSettings: (s: Partial<AppSettings>) => Promise<void>;
  resetDailyTasks: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
  logout: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  darkMode: true,
  theme: 'dark',
  language: 'en',
  pomodoro: {
    focusDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
    soundEnabled: true,
    vibrationEnabled: true,
  },
  alarmSound: 'chime',
  notificationsEnabled: true,
  aiEnabled: true,
  openRouterApiKey: '',
  userName: 'User',
  syncEnabled: false,
};

const defaultStats: UserStats = {
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: '',
  totalTasksCompleted: 0,
  totalPomodoros: 0,
  totalSubtasksCompleted: 0,
  achievements: DEFAULT_ACHIEVEMENTS,
};

// Supabase Sync Helpers
async function pushTaskToCloud(task: Task, userId: string, operation: 'insert' | 'update' | 'delete') {
  if (!navigator.onLine) {
    await db.addPendingSync({ type: 'tasks', operation, data: task });
    return;
  }
  try {
    if (operation === 'delete') {
      await supabase.from('tasks').delete().eq('id', task.id).eq('user_id', userId);
    } else if (operation === 'insert') {
      await supabase.from('tasks').insert({ ...task, user_id: userId });
    } else {
      await supabase.from('tasks').update(task).eq('id', task.id).eq('user_id', userId);
    }
  } catch (e) {
    console.warn('Cloud sync warning:', e);
    // Queue for later if it failed due to network
    await db.addPendingSync({ type: 'tasks', operation, data: task });
  }
}


export const useStore = create<AppState>((set, get) => ({
  tasks: [],
  stats: { ...defaultStats },
  settings: { ...defaultSettings },
  view: 'list',
  isLoading: true,
  isOnline: navigator.onLine,
  showAddTask: false,
  editingTask: null,
  selectedDate: getTodayLocal(),
  focusMode: false,
  showAI: false,
  showVoice: false,
  showPomodoro: false,
  showAchievements: false,
  showCalendar: false,
  showAuth: false,
  user: null,
  authStatus: 'loading',
  toast: null,
  deletedTaskBuffer: null,

  init: async () => {
    // Step 1: Apply saved theme immediately (no network needed)
    try {
      const savedTheme = localStorage.getItem('doit-theme');
      if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
    } catch {}

    // Step 2: Load local data first (instant, no network)
    let localTasks: Task[] = [];
    let localStats: UserStats = { ...defaultStats };
    let localSettings: AppSettings = { ...defaultSettings };
    try {
      const [t, s, st] = await Promise.all([db.getTasks(), db.getStats(), db.getSettings()]);
      localTasks = t || [];
      localStats = s ? { ...defaultStats, ...s } : { ...defaultStats };
      localSettings = st ? { ...defaultSettings, ...st } : { ...defaultSettings };
    } catch {}

    // Apply local data right away so the app feels instant
    set({ tasks: localTasks, stats: localStats, settings: localSettings });

    // Step 3: Register auth listener & Network listeners
    window.addEventListener('online', () => set({ isOnline: true }));
    window.addEventListener('offline', () => set({ isOnline: false }));

    auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        set({ user: null, authStatus: 'unauthenticated' });
      } else if (session?.user) {
        set({ user: session.user, authStatus: 'authenticated' });
      }
    });

    // Step 4: Check session with safety timeout
    let session = null;
    try {
      // Race session check against a 5s timeout to prevent hanging on bad WiFi
      session = await Promise.race([
        auth.getSession(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 5000))
      ]) as any;
    } catch (e) {
      console.warn('[Auth] session check failed or timed out:', e);
    }

    if (session?.user) {
      set({ user: session.user, authStatus: 'authenticated', isLoading: false });
      
      // Background Sync
      if (navigator.onLine) {
        (async () => {
          try {
            const { data: cloudTasks } = await supabase.from('tasks').select('*').eq('user_id', session.user.id);
            if (cloudTasks) {
              await db.saveTasks(cloudTasks as Task[]);
              set({ tasks: cloudTasks as Task[] });
            }
          } catch {}
        })();
      }
    } else {
      set({ user: null, authStatus: 'unauthenticated', isLoading: false });
    }


    await get().resetDailyTasks();
  },

  setView: (v) => set({ view: v }),
  setShowAddTask: (s) => set({ showAddTask: s }),
  setEditingTask: (t) => set({ editingTask: t }),
  setSelectedDate: (d) => set({ selectedDate: d }),
  setFocusMode: (f) => set({ focusMode: f }),
  setShowAI: (s) => set({ showAI: s }),
  setShowVoice: (s) => set({ showVoice: s }),
  setShowPomodoro: (s) => set({ showPomodoro: s }),
  setShowAchievements: (s) => set({ showAchievements: s }),
  setShowCalendar: (s) => set({ showCalendar: s }),
  setShowAuth: (s) => set({ showAuth: s }),

  showToast: (message, type = 'info') => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3000);
  },
  dismissToast: () => set({ toast: null }),

  addTask: async (task) => {
    const state = get();
    const tasks = [...state.tasks, task];
    set({ tasks });
    await db.saveTasks(tasks);
    
    // Schedule notifications (alarms) for this new task
    try {
      const { notifications } = await import('./lib/notifications');
      notifications.scheduleTaskNotifications(task as any);
    } catch (e) {
      console.warn('Notification schedule failed:', e);
    }
    
    if (state.authStatus === 'authenticated' && state.user) {
      await pushTaskToCloud(task, state.user.id, 'insert');
    }
    sounds.add(); // Play sound effect
    get().showToast('Task added! ✨', 'success');
  },

  updateTask: async (task) => {
    const state = get();
    const tasks = get().tasks.map(t => t.id === task.id ? task : t);
    set({ tasks });
    await db.saveTasks(tasks);
    
    // Reschedule notifications for this updated task
    try {
      const { notifications } = await import('./lib/notifications');
      notifications.scheduleTaskNotifications(task as any);
    } catch (e) {
      console.warn('Notification schedule failed:', e);
    }
    
    if (state.authStatus === 'authenticated' && state.user) {
      await pushTaskToCloud(task, state.user.id, 'update');
    }
  },

  deleteTask: async (id) => {
    const state = get();
    const taskToDelete = state.tasks.find(t => t.id === id);
    if (!taskToDelete) return;

    const remainingTasks = state.tasks.filter(t => t.id !== id);
    set({ tasks: remainingTasks, deletedTaskBuffer: taskToDelete });
    await db.saveTasks(remainingTasks);
    
    // Cancel any scheduled notifications for this task
    try {
      const { notifications } = await import('./lib/notifications');
      notifications.cancelTaskReminders(id);
    } catch {}
    
    sounds.delete(); // Play delete sound effect
    
    // Show toast with Undo action
    set({ 
      toast: { 
        message: 'Task deleted', 
        type: 'info', 
        action: { 
          label: 'Undo', 
          onClick: async () => {
            const buffer = get().deletedTaskBuffer;
            if (buffer) {
              const restoredTasks = [...get().tasks, buffer];
              set({ tasks: restoredTasks, deletedTaskBuffer: null, toast: null });
              await db.saveTasks(restoredTasks);
              if (get().authStatus === 'authenticated' && get().user) {
                await pushTaskToCloud(buffer, get().user.id, 'insert');
              }
            }
          } 
        } 
      } 
    });

    // Auto-clear buffer and sync to cloud after 5 seconds
    setTimeout(async () => {
      const currentBuffer = get().deletedTaskBuffer;
      if (currentBuffer && currentBuffer.id === id) {
        if (get().authStatus === 'authenticated' && get().user) {
          await pushTaskToCloud(currentBuffer, get().user.id, 'delete');
        }
        set({ deletedTaskBuffer: null });
      }
    }, 5000);
  },

  toggleTask: async (id) => {
    const state = get();
    const tasks = get().tasks.map(t => {
      if (t.id !== id) return t;
      const nowCompleted = !t.completed;
      if (nowCompleted) {
        const xp = t.priority === 'high' ? 30 : t.priority === 'medium' ? 20 : 10;
        get().addXP(xp);
        get().incrementStreak();
        get().showToast(`+${xp} XP! 🎉`, 'success');
        return { ...t, completed: true, completedAt: new Date().toISOString(), xpEarned: xp };
      }
      return { ...t, completed: false, completedAt: undefined };
    });
    set({ tasks });
    await db.saveTasks(tasks);
    
    if (state.authStatus === 'authenticated' && state.user) {
      const task = tasks.find(t => t.id === id);
      if (task) await pushTaskToCloud(task, state.user.id, 'update');
    }
    get().checkAchievements();
  },

  toggleSubtask: async (taskId, subtaskId) => {
    const state = get();
    let mainTaskWasCompleted = false;
    
    const tasks = get().tasks.map(t => {
      if (t.id !== taskId) return t;
      
      const subtasks = t.subtasks.map(s => {
        if (s.id !== subtaskId) return s;
        const nowCompleted = !s.completed;
        if (nowCompleted) {
          get().addXP(5);
          const stats = get().stats;
          const newStats = { ...stats, totalSubtasksCompleted: stats.totalSubtasksCompleted + 1 };
          set({ stats: newStats });
          db.saveStats(newStats);
        }
        return { ...s, completed: nowCompleted };
      });

      // If all subtasks are now complete, mark main task as complete
      const allDone = subtasks.length > 0 && subtasks.every(s => s.completed);
      if (allDone && !t.completed) {
        mainTaskWasCompleted = true;
        const xp = t.priority === 'high' ? 30 : t.priority === 'medium' ? 20 : 10;
        get().addXP(xp);
        get().incrementStreak();
        return { ...t, subtasks, completed: true, completedAt: new Date().toISOString(), xpEarned: xp };
      }

      return { ...t, subtasks };
    });

    set({ tasks });
    await db.saveTasks(tasks);
    
    if (mainTaskWasCompleted) {
      get().showToast('Task complete! All subtasks done. ✨', 'success');
      get().checkAchievements();
    }
    
    if (state.authStatus === 'authenticated' && state.user) {
      const task = tasks.find(t => t.id === taskId);
      if (task) await pushTaskToCloud(task, state.user.id, 'update');
    }
  },

  addSubtasks: async (taskId, subtasks) => {
    const state = get();
    const tasks = get().tasks.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, subtasks: [...t.subtasks, ...subtasks] };
    });
    set({ tasks });
    await db.saveTasks(tasks);
    
    if (state.authStatus === 'authenticated' && state.user) {
      const task = tasks.find(t => t.id === taskId);
      if (task) await pushTaskToCloud(task, state.user.id, 'update');
    }
    get().showToast('Subtasks added! ✨', 'success');
  },

  addXP: async (amount) => {
    const stats = { ...get().stats };
    stats.xp += amount;
    stats.level = Math.floor(stats.xp / 200) + 1;
    set({ stats });
    await db.saveStats(stats);
    
    if (get().authStatus === 'authenticated' && get().user) {
      await supabase.from('stats').upsert({ user_id: get().user.id, ...stats });
    }
  },

  incrementStreak: async () => {
    const stats = { ...get().stats };
    const today = getTodayLocal();
    if (stats.lastActiveDate !== today) {
      const yesterday = getYesterdayLocal();
      if (stats.lastActiveDate === yesterday) {
        stats.streak += 1;
      } else if (stats.lastActiveDate !== today) {
        stats.streak = 1;
      }
      stats.lastActiveDate = today;
    }
    stats.totalTasksCompleted += 1;
    set({ stats });
    await db.saveStats(stats);
    
    if (get().authStatus === 'authenticated' && get().user) {
      await supabase.from('stats').upsert({ user_id: get().user.id, ...stats });
    }
  },

  checkAchievements: async () => {
    const stats = { ...get().stats };
    let changed = false;
    stats.achievements = stats.achievements.map(a => {
      if (a.unlockedAt) return a;
      let current = 0;
      switch (a.type) {
        case 'tasks_completed': current = stats.totalTasksCompleted; break;
        case 'streak_days': current = stats.streak; break;
        case 'xp_earned': current = stats.xp; break;
        case 'pomodoros': current = stats.totalPomodoros; break;
        case 'subtasks': current = stats.totalSubtasksCompleted; break;
      }
      if (current >= a.requirement) {
        changed = true;
        get().showToast(`🏆 Achievement: ${a.name}!`, 'success');
        return { ...a, unlockedAt: new Date().toISOString() };
      }
      return a;
    });
    if (changed) {
      set({ stats });
      await db.saveStats(stats);
      if (get().authStatus === 'authenticated' && get().user) {
        await supabase.from('stats').upsert({ user_id: get().user.id, ...stats });
      }
    }
  },

  incrementPomodoros: async () => {
    const stats = { ...get().stats };
    stats.totalPomodoros += 1;
    set({ stats });
    await db.saveStats(stats);
    get().addXP(15);
    get().checkAchievements();
    get().showToast('🍅 Pomodoro complete! +15 XP', 'success');
  },

  updateSettings: async (s) => {
    const settings = { ...get().settings, ...s };
    set({ settings });
    await db.saveSettings(settings);
    if (s.theme) {
      document.documentElement.setAttribute('data-theme', s.theme);
      localStorage.setItem('doit-theme', s.theme);
    }
    // Sync profile fields to Supabase if logged in
    if (get().authStatus === 'authenticated' && get().user) {
      try {
        await supabase.from('settings').upsert({
          user_id: get().user.id,
          theme: settings.theme,
          notifications_enabled: settings.notificationsEnabled,
          ai_enabled: settings.aiEnabled,
          user_name: settings.userName,
          user_age: settings.userAge || null,
          user_job: settings.userJob || null,
          user_bio: settings.userBio || null,
          profile_completed: settings.profileCompleted || false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      } catch (e) {
        console.warn('Settings sync warning:', e);
      }
    }
  },

  resetDailyTasks: async () => {
    const lastReset = await db.getLastReset();
    const today = getTodayLocal();
    if (lastReset !== today) {
      const tasks = get().tasks.map(t => {
        if (t.recurring) return { ...t, completed: false, completedAt: undefined };
        return t;
      });
      set({ tasks });
      await db.saveTasks(tasks);
      await db.setLastReset(today);
      
      if (get().authStatus === 'authenticated' && get().user) {
        const userId = get().user.id;
        for (const task of tasks) {
          if (task.recurring) {
            await supabase.from('tasks').update({ completed: false, completed_at: null }).eq('id', task.id).eq('user_id', userId);
          }
        }
      }
    }
  },

  syncFromCloud: async () => {
    get().showToast('Syncing...', 'info');
    try {
      if (get().authStatus === 'authenticated' && get().user) {
        const { data } = await supabase.from('tasks').select('*').eq('user_id', get().user.id);
        if (data) {
          await db.saveTasks(data as Task[]);
          set({ tasks: data as Task[] });
          get().showToast('Synced!', 'success');
        }
      }
    } catch {
      get().showToast('Sync failed', 'error');
    }
  },

  logout: async () => {
    await auth.signOut();
    set({ user: null, authStatus: 'unauthenticated' });
    // Clear local data on logout for privacy
    await db.saveTasks([]);
    await db.saveStats({ ...defaultStats });
    set({ tasks: [], stats: { ...defaultStats } });
    get().showToast('Logged out', 'info');
  },
}));
