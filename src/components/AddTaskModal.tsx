import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { Task, Subtask, Priority, TaskCategory, CATEGORIES, PRIORITY_CONFIG } from '../types';
import { ai } from '../lib/ai';
import { sounds } from '../lib/sounds';
import { getTodayLocal } from '../lib/dateUtils';
import {
  X, Mic, MicOff, Wand2, Sparkles, Loader2, Check, Plus, Trash2, Bell, BellOff,
  Volume2, Calendar, Clock, AlertCircle,
} from 'lucide-react';

const ALARM_SOUNDS = [
  { id: 'chime', label: 'Chime', icon: '🔔' },
  { id: 'bell', label: 'Bell', icon: '🛎️' },
  { id: 'zen', label: 'Zen', icon: '🎐' },
  { id: 'modern', label: 'Modern', icon: '⚡' },
];

export function AddTaskModal() {
  const { showAddTask, setShowAddTask, editingTask, setEditingTask, addTask, updateTask, showToast, settings } = useStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [customCategory, setCustomCategory] = useState('');
  const [dueDate, setDueDate] = useState(getTodayLocal());
  const [dueTime, setDueTime] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('');
  const [alarmSound, setAlarmSound] = useState(settings.alarmSound || 'chime');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskText, setEditingSubtaskText] = useState('');
  
  const [isParsing, setIsParsing] = useState(false);
  const [isGeneratingSubs, setIsGeneratingSubs] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (showAddTask) {
      if (editingTask) {
        setTitle(editingTask.title);
        setDescription(editingTask.description || '');
        setPriority(editingTask.priority);
        setCategory(editingTask.category);
        setCustomCategory(editingTask.customCategory || '');
        setDueDate(editingTask.dueDate || getTodayLocal());
        setDueTime(editingTask.dueTime || '');
        setRecurring(editingTask.recurring);
        setReminderEnabled(editingTask.reminderEnabled || false);
        setReminderTime(editingTask.reminder || '');
        setAlarmSound(editingTask.alarmSound || settings.alarmSound || 'chime');
        setSubtasks(editingTask.subtasks || []);
      } else {
        resetForm();
      }
    }
  }, [editingTask, showAddTask]);

  function resetForm() {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setCategory('personal');
    setCustomCategory('');
    setDueDate(getTodayLocal());
    setDueTime('');
    setRecurring(false);
    setReminderEnabled(false);
    setReminderTime('');
    setAlarmSound(settings.alarmSound || 'chime');
    setSubtasks([]);
    setNewSubtask('');
    setTranscript('');
  }

  function close() {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setShowAddTask(false);
    setEditingTask(null);
    setTimeout(resetForm, 300);
  }

  async function handleAIParse() {
    if (!title.trim()) {
      showToast('Type a task first', 'error');
      return;
    }
    setIsParsing(true);
    try {
      const parsed = await ai.parseTask(title);
      if (parsed.title) setTitle(parsed.title);
      // Always set date - if not provided by AI, use today
      setDueDate(parsed.dueDate || getTodayLocal());
      if (parsed.dueTime) setDueTime(parsed.dueTime);
      if (parsed.priority) setPriority(parsed.priority);
      if (parsed.category) setCategory(parsed.category);
      showToast('AI organized your task! ✨', 'success');
    } catch (err: any) {
      showToast('AI failed: ' + (err.message || 'unknown'), 'error');
    }
    setIsParsing(false);
  }

  async function handleGenerateSubtasks() {
    if (!title.trim()) {
      showToast('Type a task title first', 'error');
      return;
    }
    setIsGeneratingSubs(true);
    try {
      const generated = await ai.generateSubtasks(title);
      if (generated.length > 0) {
        // Append AI subtasks to existing list
        setSubtasks(prev => [...prev, ...generated]);
        showToast(`Added ${generated.length} subtasks! ✨`, 'success');
      } else {
        showToast('Could not generate subtasks', 'error');
      }
    } catch (err: any) {
      showToast('Failed: ' + (err.message || 'unknown'), 'error');
    }
    setIsGeneratingSubs(false);
  }

  function addManualSubtask() {
    if (!newSubtask.trim()) return;
    const sub: Subtask = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      title: newSubtask.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, sub]);
    setNewSubtask('');
  }

  function toggleSubtaskLocal(subId: string) {
    setSubtasks(subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s));
  }

  function deleteSubtask(subId: string) {
    setSubtasks(subtasks.filter(s => s.id !== subId));
  }

  function startEditSubtask(sub: Subtask) {
    setEditingSubtaskId(sub.id);
    setEditingSubtaskText(sub.title);
  }

  function saveEditSubtask() {
    if (!editingSubtaskId || !editingSubtaskText.trim()) {
      setEditingSubtaskId(null);
      return;
    }
    setSubtasks(subtasks.map(s => 
      s.id === editingSubtaskId ? { ...s, title: editingSubtaskText.trim() } : s
    ));
    setEditingSubtaskId(null);
    setEditingSubtaskText('');
  }

  async function startVoice() {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      showToast('Voice not supported. Try Chrome.', 'error');
      return;
    }

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      }
    } catch (err: any) {
      showToast('Microphone permission denied', 'error');
      return;
    }

    try {
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      // Set language based on user setting in Settings
      recognition.lang = settings.language === 'bn' ? 'bn-BD' : (navigator.language || 'en-US');
      
      let finalTranscript = '';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('Listening...');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTranscript += t + ' ';
          else interim += t;
        }
        const fullText = (finalTranscript + interim).trim();
        if (fullText) {
          setTranscript(fullText);
          setTitle(fullText);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'no-speech') showToast('No speech detected', 'info');
        else if (event.error !== 'aborted') showToast(`Voice error: ${event.error}`, 'error');
      };

      recognition.onend = () => setIsListening(false);
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      showToast('Voice failed', 'error');
      setIsListening(false);
    }
  }

  function stopVoice() {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }

  function previewSound(soundId: string) {
    setAlarmSound(soundId);
    sounds.click();
    setTimeout(() => {
      const playFn = ({
        chime: sounds.playChime,
        bell: sounds.playBell,
        zen: sounds.playZen,
        modern: sounds.playModern,
      } as any)[soundId];
      if (playFn) playFn();
    }, 50);
  }

  async function handleSubmit() {
    if (!title.trim()) {
      showToast('Please enter a task title', 'error');
      return;
    }
    
    // Build reminder ISO string if enabled
    let reminderStr: string | undefined = undefined;
    if (reminderEnabled && reminderTime && dueDate) {
      reminderStr = `${dueDate}T${reminderTime}`;
    }

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
      reminder: reminderStr,
      reminderEnabled,
      alarmSound,
      recurring,
      subtasks,
      createdAt: editingTask?.createdAt || new Date().toISOString(),
      completedAt: editingTask?.completedAt,
    };

    try {
      if (editingTask) {
        await updateTask(task);
        showToast('Task updated! ✏️', 'success');
      } else {
        await addTask(task);
      }
      close();
    } catch (err: any) {
      showToast('Failed to save: ' + (err.message || 'unknown'), 'error');
    }
  }

  if (!showAddTask) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-md"
        onClick={close}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        className="fixed bottom-0 left-0 right-0 z-[90] max-h-[92vh] overflow-y-auto rounded-t-3xl"
        style={{ background: 'var(--theme-bg-secondary)', borderTop: '1px solid var(--theme-card-border)' }}
      >
        <div className="p-5 safe-bottom">
          <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--theme-text-muted)' }} />
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
              {editingTask ? 'Edit Task' : 'New Task'}
            </h2>
            <button onClick={close} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--theme-card)', color: 'var(--theme-text-muted)' }}>
              <X size={18} />
            </button>
          </div>

          {/* AI Action Buttons */}
          <div className="flex gap-2 mb-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => isListening ? stopVoice() : startVoice()}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all"
              style={isListening ? {
                background: 'rgba(239, 68, 68, 0.15)',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                color: '#ef4444'
              } : {
                background: 'var(--theme-card)',
                borderColor: 'var(--theme-card-border)',
                color: 'var(--theme-text-secondary)'
              }}
            >
              {isListening ? <><MicOff size={14} /> Stop</> : <><Mic size={14} /> Voice</>}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAIParse}
              disabled={isParsing}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border"
              style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-secondary)' }}
            >
              {isParsing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
              AI Parse
            </motion.button>
          </div>

          {/* Voice Indicator */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="rounded-xl p-3 border-2 flex items-start gap-3" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                  <div className="relative shrink-0 mt-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <motion.div className="absolute inset-0 bg-red-500 rounded-full" animate={{ scale: [1, 2.5, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-red-400 mb-0.5">Recording...</p>
                    <p className="text-sm break-words" style={{ color: 'var(--theme-text)' }}>{transcript || 'Speak now...'}</p>
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
            className="w-full border rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none mb-3 theme-input"
            style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text)' }}
          />

          {/* Description */}
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none mb-4 resize-none theme-input"
            style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text)' }}
          />

          {/* Subtasks Section (Moved here as requested) */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                Subtasks ({subtasks.length})
              </label>
              <button
                type="button"
                onClick={handleGenerateSubtasks}
                disabled={isGeneratingSubs || !title.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-50"
                style={{
                  background: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)',
                  color: 'var(--theme-accent)'
                }}
              >
                {isGeneratingSubs ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Break Into Subtasks
              </button>
            </div>

            {/* Subtask List */}
            <div className="space-y-2 mb-3">
              <AnimatePresence>
                {subtasks.map((sub, idx) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border"
                    style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-card-border)' }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSubtaskLocal(sub.id)}
                      className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
                      style={sub.completed
                        ? { background: 'var(--theme-accent)', borderColor: 'var(--theme-accent)' }
                        : { background: 'transparent', borderColor: 'var(--theme-card-border)' }
                      }
                    >
                      {sub.completed && <Check size={12} className="text-white" strokeWidth={3} />}
                    </button>
                    {editingSubtaskId === sub.id ? (
                      <input
                        type="text"
                        value={editingSubtaskText}
                        onChange={e => setEditingSubtaskText(e.target.value)}
                        onBlur={saveEditSubtask}
                        onKeyDown={e => { if (e.key === 'Enter') saveEditSubtask(); }}
                        className="flex-1 bg-transparent border-b border-white/30 focus:outline-none text-sm"
                        autoFocus
                      />
                    ) : (
                      <span 
                        className={`text-sm flex-1 cursor-pointer ${sub.completed ? 'line-through opacity-50' : ''}`} 
                        style={{ color: 'var(--theme-text)' }}
                        onClick={() => startEditSubtask(sub)}
                      >
                        {sub.title}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteSubtask(sub.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center opacity-40 hover:opacity-100 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Add Manual Subtask */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addManualSubtask(); } }}
                placeholder="Add a subtask..."
                className="flex-1 border rounded-xl px-3 py-2.5 text-sm focus:outline-none theme-input"
                style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text)' }}
              />
              <button
                type="button"
                onClick={addManualSubtask}
                disabled={!newSubtask.trim()}
                className="w-11 rounded-xl flex items-center justify-center disabled:opacity-40"
                style={{ background: 'var(--theme-accent-gradient)' }}
              >
                <Plus size={20} className="text-white" />
              </button>
            </div>
          </div>

          {/* Priority */}
          <div className="mb-4">
            <label className="text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-60">Priority</label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as Priority[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all"
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
          <div className="mb-4">
            <label className="text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-60">Category</label>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className="shrink-0 px-3 py-2 rounded-xl text-xs font-bold border transition-all"
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
                style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text)' }}
              />
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1 opacity-60">
                <Calendar size={11} /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full border rounded-xl px-3 py-3 text-sm focus:outline-none theme-input [color-scheme:dark]"
                style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text)' }}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1 opacity-60">
                <Clock size={11} /> Time
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className="w-full border rounded-xl px-3 py-3 text-sm focus:outline-none theme-input [color-scheme:dark]"
                style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text)' }}
              />
            </div>
          </div>

          {/* Recurring Toggle */}
          <button
            type="button"
            onClick={() => setRecurring(!recurring)}
            className="w-full mb-4 flex items-center justify-between px-4 py-3 rounded-xl border transition-all"
            style={recurring
              ? { background: 'rgba(6, 182, 212, 0.15)', borderColor: '#06b6d4', color: '#06b6d4' }
              : { background: 'var(--theme-card)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-muted)' }
            }
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              🔄 Daily Recurring
            </span>
            <div className="w-10 h-5 rounded-full relative" style={{ background: recurring ? '#06b6d4' : 'var(--theme-card-border)' }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: recurring ? 'translateX(22px)' : 'translateX(2px)' }} />
            </div>
          </button>

          {/* Reminder/Alarm Section */}
          <div className="mb-4 p-4 rounded-2xl border" style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-card-border)' }}>
            <button
              type="button"
              onClick={() => setReminderEnabled(!reminderEnabled)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {reminderEnabled ? <Bell size={16} className="text-amber-400" /> : <BellOff size={16} className="opacity-40" />}
                <span className="text-sm font-bold" style={{ color: reminderEnabled ? 'var(--theme-text)' : 'var(--theme-text-muted)' }}>
                  Set Alarm / Reminder
                </span>
              </div>
              <div className="w-11 h-6 rounded-full relative" style={{ background: reminderEnabled ? 'var(--theme-accent)' : 'var(--theme-card-border)' }}>
                <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow" style={{ transform: reminderEnabled ? 'translateX(22px)' : 'translateX(2px)' }} />
              </div>
            </button>

            <AnimatePresence>
              {reminderEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-3">
                    {/* Reminder Time */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block opacity-60">Alarm Time</label>
                      <input
                        type="time"
                        value={reminderTime}
                        onChange={e => setReminderTime(e.target.value)}
                        className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none theme-input [color-scheme:dark]"
                        style={{ background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text)' }}
                      />
                    </div>

                    {/* Sound Selector */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1 opacity-60">
                        <Volume2 size={10} /> Sound (Tap to Preview)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {ALARM_SOUNDS.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => previewSound(s.id)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all"
                            style={alarmSound === s.id
                              ? { background: 'var(--theme-accent)', borderColor: 'var(--theme-accent)', color: '#fff' }
                              : { background: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-muted)' }
                            }
                          >
                            <span className="text-base">{s.icon}</span>
                            <span>{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* High Priority Note */}
                    {priority === 'high' && (
                      <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                        <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-red-400 font-medium">High priority tasks get extra alerts at 5, 3, and 1 minute before due time.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
           </div>

           {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            style={{ 
              background: 'var(--theme-accent-gradient)',
              boxShadow: '0 8px 25px color-mix(in srgb, var(--theme-accent) 30%, transparent)'
            }}
          >
            <Check size={20} strokeWidth={3} />
            {editingTask ? 'Update Task' : 'Save Task'}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
