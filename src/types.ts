export type Priority = 'high' | 'medium' | 'low';
export type TaskCategory = 'work' | 'study' | 'personal' | 'shopping' | 'health' | 'custom';
export type ViewMode = 'list' | 'calendar' | 'focus' | 'stats' | 'settings';
export type ThemeName = 'dark' | 'light' | 'midnight' | 'forest' | 'sunset' | 'rose' | 'ocean' | 'nord';

export interface ThemeConfig {
  id: ThemeName;
  name: string;
  icon: string;
  description: string;
  gradient: string;
  preview: string[];
  isDark: boolean;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'dark',
    name: 'Dark',
    icon: '🌙',
    description: 'Classic purple neon',
    gradient: 'from-purple-600 to-pink-600',
    preview: ['#0f0a1a', '#8b5cf6', '#ec4899'],
    isDark: true,
  },
  {
    id: 'light',
    name: 'Light',
    icon: '☀️',
    description: 'Clean & bright',
    gradient: 'from-violet-500 to-purple-500',
    preview: ['#f8f9fc', '#7c3aed', '#a855f7'],
    isDark: false,
  },
  {
    id: 'midnight',
    name: 'Midnight',
    icon: '🌌',
    description: 'Deep navy blue',
    gradient: 'from-blue-600 to-indigo-600',
    preview: ['#0a0e27', '#3b82f6', '#6366f1'],
    isDark: true,
  },
  {
    id: 'forest',
    name: 'Forest',
    icon: '🌿',
    description: 'Natural green vibes',
    gradient: 'from-emerald-600 to-green-600',
    preview: ['#0a1a0f', '#10b981', '#34d399'],
    isDark: true,
  },
  {
    id: 'sunset',
    name: 'Sunset',
    icon: '🌅',
    description: 'Warm orange glow',
    gradient: 'from-orange-500 to-rose-500',
    preview: ['#1a0f0a', '#f97316', '#f43f5e'],
    isDark: true,
  },
  {
    id: 'rose',
    name: 'Rose',
    icon: '🌹',
    description: 'Elegant pink & gold',
    gradient: 'from-pink-500 to-rose-400',
    preview: ['#1a0f14', '#ec4899', '#fbbf24'],
    isDark: true,
  },
  {
    id: 'ocean',
    name: 'Ocean',
    icon: '🌊',
    description: 'Deep sea blue',
    gradient: 'from-cyan-500 to-blue-600',
    preview: ['#0a1628', '#06b6d4', '#3b82f6'],
    isDark: true,
  },
  {
    id: 'nord',
    name: 'Nord',
    icon: '❄️',
    description: 'Arctic cool tones',
    gradient: 'from-sky-400 to-blue-500',
    preview: ['#2e3440', '#88c0d0', '#81a1c1'],
    isDark: true,
  },
];

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  category: TaskCategory;
  customCategory?: string;
  dueDate?: string;
  dueTime?: string;
  reminder?: string;
  reminderEnabled?: boolean;
  alarmSound?: string;
  recurring: boolean;
  subtasks: Subtask[];
  createdAt: string;
  completedAt?: string;
  xpEarned?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  requirement: number;
  type: 'tasks_completed' | 'streak_days' | 'xp_earned' | 'pomodoros' | 'subtasks';
}

export interface UserStats {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string;
  totalTasksCompleted: number;
  totalPomodoros: number;
  totalSubtasksCompleted: number;
  achievements: Achievement[];
}

export interface PomodoroSettings {
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface AppSettings {
  darkMode: boolean;
  theme: ThemeName;
  language: 'en' | 'bn';
  pomodoro: PomodoroSettings;
  alarmSound: string;
  notificationsEnabled: boolean;
  aiEnabled: boolean;
  openRouterApiKey: string;
  userName: string;
  userAge?: string;
  userJob?: string;
  userBio?: string;
  profileCompleted?: boolean;
  syncEnabled: boolean;
}

export interface ParsedTask {
  title: string;
  dueDate?: string;
  dueTime?: string;
  priority?: Priority;
  category?: TaskCategory;
  reminder?: string;
}

export const CATEGORIES: { value: TaskCategory; label: string; icon: string; color: string }[] = [
  { value: 'work', label: 'Work', icon: '💼', color: '#3b82f6' },
  { value: 'study', label: 'Study', icon: '📚', color: '#8b5cf6' },
  { value: 'personal', label: 'Personal', icon: '🌟', color: '#ec4899' },
  { value: 'shopping', label: 'Shopping', icon: '🛒', color: '#f59e0b' },
  { value: 'health', label: 'Health', icon: '💪', color: '#10b981' },
  { value: 'custom', label: 'Custom', icon: '🏷️', color: '#06b6d4' },
];

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  high: { label: 'High', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  low: { label: 'Low', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
};

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_task', name: 'First Step', description: 'Complete your first task', icon: '🎯', requirement: 1, type: 'tasks_completed' },
  { id: 'ten_tasks', name: 'Getting Started', description: 'Complete 10 tasks', icon: '🚀', requirement: 10, type: 'tasks_completed' },
  { id: 'fifty_tasks', name: 'Productivity Pro', description: 'Complete 50 tasks', icon: '⚡', requirement: 50, type: 'tasks_completed' },
  { id: 'hundred_tasks', name: 'Task Master', description: 'Complete 100 tasks', icon: '👑', requirement: 100, type: 'tasks_completed' },
  { id: 'streak_3', name: 'On Fire', description: '3-day streak', icon: '🔥', requirement: 3, type: 'streak_days' },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day streak', icon: '💎', requirement: 7, type: 'streak_days' },
  { id: 'streak_30', name: 'Monthly Master', description: '30-day streak', icon: '🏆', requirement: 30, type: 'streak_days' },
  { id: 'xp_500', name: 'XP Hunter', description: 'Earn 500 XP', icon: '⭐', requirement: 500, type: 'xp_earned' },
  { id: 'xp_2000', name: 'XP Legend', description: 'Earn 2000 XP', icon: '🌟', requirement: 2000, type: 'xp_earned' },
  { id: 'pomo_5', name: 'Focus Beginner', description: 'Complete 5 pomodoros', icon: '🍅', requirement: 5, type: 'pomodoros' },
  { id: 'pomo_25', name: 'Focus Expert', description: 'Complete 25 pomodoros', icon: '🧠', requirement: 25, type: 'pomodoros' },
  { id: 'sub_20', name: 'Detail Oriented', description: 'Complete 20 subtasks', icon: '📋', requirement: 20, type: 'subtasks' },
];
