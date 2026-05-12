import localforage from 'localforage';
import { Task, UserStats, AppSettings } from '../types';

localforage.config({
  name: 'doit-app',
  storeName: 'doit_store',
});

const TASKS_KEY = 'doit_tasks';
const STATS_KEY = 'doit_stats';
const SETTINGS_KEY = 'doit_settings';
const LAST_RESET_KEY = 'doit_last_reset';
const PENDING_SYNC_KEY = 'doit_pending_sync';

export const db = {
  async getTasks(): Promise<Task[]> {
    return (await localforage.getItem<Task[]>(TASKS_KEY)) || [];
  },

  async saveTasks(tasks: Task[]): Promise<void> {
    await localforage.setItem(TASKS_KEY, tasks);
    this.addPendingSync({ type: 'tasks', data: tasks });
  },

  async getStats(): Promise<UserStats | null> {
    return await localforage.getItem<UserStats>(STATS_KEY);
  },

  async saveStats(stats: UserStats): Promise<void> {
    await localforage.setItem(STATS_KEY, stats);
  },

  async getSettings(): Promise<AppSettings | null> {
    return await localforage.getItem<AppSettings>(SETTINGS_KEY);
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    await localforage.setItem(SETTINGS_KEY, settings);
  },

  async getLastReset(): Promise<string | null> {
    return await localforage.getItem<string>(LAST_RESET_KEY);
  },

  async setLastReset(date: string): Promise<void> {
    await localforage.setItem(LAST_RESET_KEY, date);
  },

  async addPendingSync(item: { type: string; data: unknown }): Promise<void> {
    const pending = (await localforage.getItem<Array<{ type: string; data: unknown; timestamp: number }>>(PENDING_SYNC_KEY)) || [];
    pending.push({ ...item, timestamp: Date.now() });
    await localforage.setItem(PENDING_SYNC_KEY, pending);
  },

  async getPendingSync(): Promise<Array<{ type: string; data: unknown; timestamp: number }>> {
    return (await localforage.getItem<Array<{ type: string; data: unknown; timestamp: number }>>(PENDING_SYNC_KEY)) || [];
  },

  async clearPendingSync(): Promise<void> {
    await localforage.setItem(PENDING_SYNC_KEY, []);
  },

  async exportData(): Promise<string> {
    const [tasks, stats, settings] = await Promise.all([
      this.getTasks(),
      this.getStats(),
      this.getSettings(),
    ]);
    return JSON.stringify({ tasks, stats, settings, exportDate: new Date().toISOString() });
  },

  async importData(json: string): Promise<boolean> {
    try {
      const data = JSON.parse(json);
      if (data.tasks) await this.saveTasks(data.tasks);
      if (data.stats) await this.saveStats(data.stats);
      if (data.settings) await this.saveSettings(data.settings);
      return true;
    } catch {
      return false;
    }
  },
};
