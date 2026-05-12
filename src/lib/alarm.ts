// Persistent Alarm System - plays until user dismisses
// Uses Web Audio API for sound + Notification API for background alerts

let audioCtx: AudioContext | null = null;
let alarmInterval: ReturnType<typeof setInterval> | null = null;
let alarmTimeout: ReturnType<typeof setTimeout> | null = null;
let currentAlarmTask: { id: string; title: string; sound: string } | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.4) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch (e) {
    console.warn('Audio play failed:', e);
  }
}

// All alarm sound patterns (10 seconds each)
const alarmPatterns: Record<string, () => void> = {
  chime: () => {
    // Ascending chime - plays repeatedly every ~2s for full 10s effect
    playTone(523.25, 0.3, 'sine', 0.5);
    setTimeout(() => playTone(659.25, 0.3, 'sine', 0.5), 350);
    setTimeout(() => playTone(783.99, 0.3, 'sine', 0.5), 700);
    setTimeout(() => playTone(1046.5, 0.6, 'sine', 0.5), 1050);
    setTimeout(() => playTone(783.99, 0.3, 'sine', 0.4), 1700);
    setTimeout(() => playTone(659.25, 0.3, 'sine', 0.4), 2050);
    setTimeout(() => playTone(523.25, 0.8, 'sine', 0.4), 2400);
  },

  bell: () => {
    // Rich bell pattern
    playTone(880, 0.8, 'sine', 0.5);
    setTimeout(() => playTone(1108.73, 0.5, 'sine', 0.4), 200);
    setTimeout(() => playTone(880, 0.6, 'sine', 0.3), 900);
    setTimeout(() => playTone(659.25, 0.8, 'sine', 0.4), 1500);
    setTimeout(() => playTone(880, 1.0, 'sine', 0.5), 2200);
  },

  zen: () => {
    // Slow, deep zen tone
    playTone(110, 1.5, 'sine', 0.35);
    setTimeout(() => playTone(220, 1.2, 'sine', 0.3), 800);
    setTimeout(() => playTone(330, 1.0, 'sine', 0.25), 1600);
    setTimeout(() => playTone(440, 2.0, 'sine', 0.3), 2400);
  },

  modern: () => {
    // Punchy modern alert
    playTone(1318, 0.12, 'square', 0.4);
    setTimeout(() => playTone(1567, 0.12, 'square', 0.4), 130);
    setTimeout(() => playTone(2093, 0.12, 'square', 0.4), 260);
    setTimeout(() => playTone(1318, 0.12, 'square', 0.4), 500);
    setTimeout(() => playTone(1567, 0.12, 'square', 0.4), 630);
    setTimeout(() => playTone(2093, 0.25, 'square', 0.4), 760);
    setTimeout(() => playTone(1318, 0.12, 'square', 0.4), 1100);
    setTimeout(() => playTone(2637, 0.4, 'square', 0.4), 1230);
  },
};

// Preview a sound once (for Settings)
export function previewAlarmSound(soundName: string) {
  const pattern = alarmPatterns[soundName] || alarmPatterns.chime;
  pattern();
}

// Start persistent alarm - loops every 3 seconds until stopAlarm() is called
export function startAlarm(taskId: string, taskTitle: string, soundName: string = 'chime') {
  // Stop any existing alarm first
  stopAlarm();

  currentAlarmTask = { id: taskId, title: taskTitle, sound: soundName };
  const pattern = alarmPatterns[soundName] || alarmPatterns.chime;

  // Play immediately
  pattern();

  // Then repeat every 3 seconds
  alarmInterval = setInterval(() => {
    pattern();
    // Vibrate on each repeat
    if ('vibrate' in navigator) {
      navigator.vibrate([400, 200, 400, 200, 400]);
    }
  }, 3000);

  // Safety: auto-stop after 2 minutes if user doesn't dismiss
  alarmTimeout = setTimeout(() => {
    stopAlarm();
  }, 120000); // 2 minutes

  // Show alarm UI notification
  showAlarmUI(taskId, taskTitle);
}

// Stop the alarm completely
export function stopAlarm() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  if (alarmTimeout) {
    clearTimeout(alarmTimeout);
    alarmTimeout = null;
  }
  currentAlarmTask = null;
  hideAlarmUI();
}

export function isAlarmRunning(): boolean {
  return alarmInterval !== null;
}

export function getCurrentAlarm() {
  return currentAlarmTask;
}

// Alarm UI Overlay - shown on top of the app
function showAlarmUI(taskId: string, taskTitle: string) {
  // Remove any existing alarm UI
  const existing = document.getElementById('doit-alarm-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'doit-alarm-overlay';
  overlay.innerHTML = `
    <div style="
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,0.85);
      backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      font-family: -apple-system, system-ui, sans-serif;
    ">
      <div style="
        background: linear-gradient(135deg, #1a1128, #2e1a46);
        border: 1px solid rgba(139, 92, 246, 0.4);
        border-radius: 28px;
        padding: 36px 28px;
        width: 100%; max-width: 360px;
        text-align: center;
        box-shadow: 0 0 60px rgba(139, 92, 246, 0.3);
        animation: alarmPulse 1s ease-in-out infinite alternate;
      ">
        <div style="font-size: 56px; margin-bottom: 16px; animation: alarmBell 0.5s ease-in-out infinite alternate;">⏰</div>
        <div style="color: rgba(255,255,255,0.5); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 12px;">⚠️ TASK REMINDER</div>
        <h2 style="color: #fff; font-size: 22px; font-weight: 800; margin: 0 0 8px; line-height: 1.3;">${taskTitle}</h2>
        <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0 0 32px;">This task needs your attention</p>
        <button id="doit-dismiss-alarm" style="
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          border: none; border-radius: 16px;
          color: white; font-size: 16px; font-weight: 800;
          padding: 16px 40px; width: 100%;
          cursor: pointer; letter-spacing: 0.5px;
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
          transition: transform 0.1s;
        ">✓ DISMISS ALARM</button>
        <button id="doit-snooze-alarm" style="
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px; color: rgba(255,255,255,0.6);
          font-size: 13px; font-weight: 600;
          padding: 10px 20px; margin-top: 12px; width: 100%;
          cursor: pointer;
        ">😴 Snooze 5 minutes</button>
      </div>
    </div>
    <style>
      @keyframes alarmPulse {
        from { box-shadow: 0 0 40px rgba(139, 92, 246, 0.2); }
        to { box-shadow: 0 0 80px rgba(236, 72, 153, 0.5); }
      }
      @keyframes alarmBell {
        from { transform: rotate(-15deg); }
        to { transform: rotate(15deg); }
      }
    </style>
  `;

  document.body.appendChild(overlay);

  // Dismiss button
  document.getElementById('doit-dismiss-alarm')?.addEventListener('click', () => {
    stopAlarm();
  });

  // Snooze button (5 min delay)
  document.getElementById('doit-snooze-alarm')?.addEventListener('click', () => {
    stopAlarm();
    setTimeout(() => {
      startAlarm(taskId, taskTitle, currentAlarmTask?.sound || 'chime');
    }, 5 * 60 * 1000); // 5 minutes
  });
}

function hideAlarmUI() {
  const overlay = document.getElementById('doit-alarm-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => overlay.remove(), 300);
  }
}

// Schedule alarm for a specific time
export function scheduleAlarm(
  taskId: string,
  taskTitle: string,
  alarmTimeMs: number,
  soundName: string = 'chime',
  isHighPriority: boolean = false
): ReturnType<typeof setTimeout> | null {
  const delay = alarmTimeMs - Date.now();
  if (delay <= 0) return null;

  return setTimeout(() => {
    startAlarm(taskId, taskTitle, soundName);

    // Also send system notification for background
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(
        isHighPriority ? '🚨 URGENT: Task Due!' : '⏰ Task Reminder',
        {
          body: taskTitle,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: `alarm-${taskId}`,
          requireInteraction: true,
        }
      );
    }
  }, delay);
}

// Schedule all reminders for tasks
export function scheduleAllAlarms(tasks: any[]): void {
  // Clear existing scheduled alarms stored in localStorage
  const existingAlarms = JSON.parse(localStorage.getItem('doit-scheduled-alarms') || '[]');
  existingAlarms.forEach((id: number) => clearTimeout(id));
  localStorage.setItem('doit-scheduled-alarms', '[]');

  const newAlarmIds: number[] = [];

  tasks.forEach(task => {
    if (task.completed) return;
    const sound = task.alarmSound || 'chime';
    const isHigh = task.priority === 'high';

    // Alarm at reminder time (if enabled)
    if (task.reminderEnabled && task.reminder) {
      const reminderMs = new Date(task.reminder).getTime();
      const id = scheduleAlarm(task.id, task.title, reminderMs, sound, false);
      if (id) newAlarmIds.push(id as any);
    }

    // Alarm at due time
    if (task.dueDate && task.dueTime) {
      const [h, m] = task.dueTime.split(':').map(Number);
      const dueDate = new Date(task.dueDate + 'T00:00:00');
      dueDate.setHours(h, m, 0, 0);
      const dueMs = dueDate.getTime();

      // Alarm at exact due time
      const id1 = scheduleAlarm(task.id, `"${task.title}" is due NOW!`, dueMs, sound, isHigh);
      if (id1) newAlarmIds.push(id1 as any);

      // High priority pre-alarms (5, 3, 1 minute before)
      if (isHigh) {
        [5, 3, 1].forEach(offset => {
          const preMs = dueMs - offset * 60000;
          const id = scheduleAlarm(task.id, `"${task.title}" due in ${offset} min!`, preMs, sound, true);
          if (id) newAlarmIds.push(id as any);
        });
      }
    }
  });

  localStorage.setItem('doit-scheduled-alarms', JSON.stringify(newAlarmIds));
}
