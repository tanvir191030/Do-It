import { sounds } from './sounds';

const scheduledTimers: Record<string, ReturnType<typeof setTimeout>[]> = {};

export const notifications = {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  async send(title: string, body: string, tag?: string, soundName?: string): Promise<void> {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: tag || 'doit-notification',
        requireInteraction: true,
      });
      
      // Play sound
      if (soundName) {
        sounds.playAlarm(soundName);
      } else {
        sounds.playChime();
      }
      
      // Vibrate (mobile)
      this.vibrate([300, 100, 300, 100, 300]);
      
      // Click to focus app
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.warn('Notification failed:', e);
    }
  },

  vibrate(pattern: number[]): void {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(pattern); } catch {}
    }
  },

  // Cancel all scheduled timers for a task
  cancelTaskReminders(taskId: string): void {
    if (scheduledTimers[taskId]) {
      scheduledTimers[taskId].forEach(t => clearTimeout(t));
      delete scheduledTimers[taskId];
    }
  },

  // Schedule reminder at exact time
  scheduleReminder(
    taskId: string,
    title: string,
    reminderTimeMs: number,
    soundName: string = 'chime',
    isHighPriority: boolean = false
  ): void {
    const now = Date.now();
    const delay = reminderTimeMs - now;
    if (delay <= 0) return;

    if (!scheduledTimers[taskId]) scheduledTimers[taskId] = [];

    const timer = setTimeout(() => {
      this.send(
        isHighPriority ? '🚨 URGENT TASK!' : '⏰ Task Reminder',
        title,
        `reminder-${taskId}-${reminderTimeMs}`,
        soundName
      );
    }, delay);

    scheduledTimers[taskId].push(timer);
  },

  // Schedule complete notification system for a task
  scheduleTaskNotifications(task: {
    id: string;
    title: string;
    completed: boolean;
    dueDate?: string;
    dueTime?: string;
    reminder?: string;
    reminderEnabled?: boolean;
    priority: string;
    alarmSound?: string;
  }): void {
    // Cancel any old timers first
    this.cancelTaskReminders(task.id);

    if (task.completed) return;

    const sound = task.alarmSound || 'chime';

    // 1. Manual reminder (if enabled & set)
    if (task.reminderEnabled && task.reminder) {
      const reminderMs = new Date(task.reminder).getTime();
      if (!isNaN(reminderMs)) {
        this.scheduleReminder(task.id, task.title, reminderMs, sound, false);
      }
    }

    // 2. Exact-time alarm (if dueDate + dueTime present)
    if (task.dueDate && task.dueTime) {
      const [h, m] = task.dueTime.split(':').map(Number);
      const due = new Date(task.dueDate + 'T00:00:00');
      due.setHours(h, m, 0, 0);
      const dueMs = due.getTime();

      // Alarm at exact time
      this.scheduleReminder(task.id, `🔔 "${task.title}" is due now!`, dueMs, sound, false);

      // High priority pre-alarms (5, 3, 1 min before)
      if (task.priority === 'high') {
        [5, 3, 1].forEach(offset => {
          const alarmMs = dueMs - offset * 60000;
          this.scheduleReminder(
            task.id,
            `${task.title} (in ${offset} min)`,
            alarmMs,
            sound,
            true
          );
        });
      }
    }
  },

  scheduleAllReminders(tasks: any[]): void {
    // Clear all existing first
    Object.keys(scheduledTimers).forEach(id => this.cancelTaskReminders(id));
    // Schedule new
    tasks.forEach(task => this.scheduleTaskNotifications(task));
  },
};
