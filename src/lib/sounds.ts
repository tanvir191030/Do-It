const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
}

// Stop all sounds (for alarm dismissal)
let activeIntervals: ReturnType<typeof setInterval>[] = [];
export function stopAllSounds() {
  activeIntervals.forEach(i => clearInterval(i));
  activeIntervals = [];
}

export const sounds = {
  complete() {
    playTone(523.25, 0.15, 'sine', 0.25);
    setTimeout(() => playTone(659.25, 0.15, 'sine', 0.25), 100);
    setTimeout(() => playTone(783.99, 0.3, 'sine', 0.25), 200);
  },

  pomodoroEnd() {
    [0, 200, 400, 600].forEach((delay) => {
      setTimeout(() => playTone(880, 0.3, 'sine', 0.3), delay);
    });
  },

  breakEnd() {
    playTone(440, 0.2, 'triangle', 0.25);
    setTimeout(() => playTone(554.37, 0.2, 'triangle', 0.25), 150);
    setTimeout(() => playTone(659.25, 0.4, 'triangle', 0.25), 300);
  },

  click() {
    playTone(1000, 0.05, 'sine', 0.1);
  },

  error() {
    playTone(200, 0.3, 'sawtooth', 0.15);
  },

  levelUp() {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.25), i * 120);
    });
  },

  achievement() {
    const notes = [392, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.15, 'triangle', 0.2), i * 100);
    });
  },

  tick() {
    playTone(800, 0.02, 'sine', 0.05);
  },

  // Task Added Sound (Soft ascending chime)
  add() {
    playTone(880, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(1046, 0.15, 'sine', 0.2), 80);
  },

  // Task Deleted Sound (Soft descending tone)
  delete() {
    playTone(600, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(400, 0.2, 'sine', 0.15), 100);
  },

  // Alarm sounds for testing/playing
  playChime() {
    playTone(659.25, 0.15, 'sine', 0.4);
    setTimeout(() => playTone(523.25, 0.15, 'sine', 0.4), 150);
    setTimeout(() => playTone(659.25, 0.3, 'sine', 0.4), 300);
  },

  playBell() {
    playTone(880, 0.5, 'sine', 0.4);
    setTimeout(() => playTone(659.25, 0.7, 'sine', 0.3), 200);
  },

  playZen() {
    playTone(440, 0.8, 'sine', 0.3);
    setTimeout(() => playTone(523.25, 1.0, 'sine', 0.25), 400);
  },

  playModern() {
    playTone(1318, 0.1, 'square', 0.3);
    setTimeout(() => playTone(1567, 0.1, 'square', 0.3), 100);
    setTimeout(() => playTone(2093, 0.2, 'square', 0.3), 200);
  },

  playUrgent() {
    // 3 quick beeps for urgent notifications
    playTone(1000, 0.15, 'square', 0.4);
    setTimeout(() => playTone(1000, 0.15, 'square', 0.4), 200);
    setTimeout(() => playTone(1000, 0.15, 'square', 0.4), 400);
  },

  // Play alarm continuously for up to 2 minutes (120s)
  // Loops the selected sound every 2 seconds.
  playAlarm(soundName: string = 'chime') {
    stopAllSounds();
    const playFn = ({
      chime: () => sounds.playChime(),
      bell: () => sounds.playBell(),
      zen: () => sounds.playZen(),
      modern: () => sounds.playModern(),
    } as any)[soundName] || (() => sounds.playChime());
    
    // Play immediately
    playFn();
    
    // Loop every 2 seconds
    const interval = setInterval(() => {
      playFn();
    }, 2000);
    activeIntervals.push(interval);
    
    // Stop after 2 minutes (120 seconds)
    setTimeout(() => {
      clearInterval(interval);
      activeIntervals = activeIntervals.filter(i => i !== interval);
    }, 120000);
  },
};
