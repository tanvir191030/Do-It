import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { User, Briefcase, Calendar as CalendarIcon, FileText, Check, Edit3, X } from 'lucide-react';

export function ProfileForm() {
  const { settings, updateSettings, stats, user, showToast } = useStore();
  const [isEditing, setIsEditing] = useState(!settings.profileCompleted);
  const [name, setName] = useState(settings.userName === 'User' ? '' : settings.userName);
  const [age, setAge] = useState(settings.userAge || '');
  const [job, setJob] = useState(settings.userJob || '');
  const [bio, setBio] = useState(settings.userBio || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(settings.userName === 'User' ? '' : settings.userName);
    setAge(settings.userAge || '');
    setJob(settings.userJob || '');
    setBio(settings.userBio || '');
  }, [settings.userName, settings.userAge, settings.userJob, settings.userBio]);

  async function handleSave() {
    if (!name.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateSettings({
        userName: name.trim(),
        userAge: age.trim(),
        userJob: job.trim(),
        userBio: bio.trim(),
        profileCompleted: true,
      });
      setIsEditing(false);
      showToast('Profile saved successfully! 🎉', 'success');
    } catch (e) {
      showToast('Failed to save profile', 'error');
    }
    setSaving(false);
  }

  function handleCancel() {
    // Reset values
    setName(settings.userName === 'User' ? '' : settings.userName);
    setAge(settings.userAge || '');
    setJob(settings.userJob || '');
    setBio(settings.userBio || '');
    setIsEditing(false);
  }

  const initials = (name || 'U').charAt(0).toUpperCase();
  const hasChanges = 
    name.trim() !== (settings.userName === 'User' ? '' : settings.userName) ||
    age.trim() !== (settings.userAge || '') ||
    job.trim() !== (settings.userJob || '') ||
    bio.trim() !== (settings.userBio || '');

  return (
    <div className="glass rounded-2xl p-5 mb-4 relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
          <User size={16} style={{ color: 'var(--theme-accent)' }} /> Profile
        </h3>
        {!isEditing && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ 
              background: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)',
              color: 'var(--theme-accent)'
            }}
          >
            <Edit3 size={12} />
            Edit
          </motion.button>
        )}
      </div>

      {/* Profile Avatar Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0" style={{ background: 'var(--theme-accent-gradient)', boxShadow: '0 8px 20px color-mix(in srgb, var(--theme-accent) 30%, transparent)' }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate" style={{ color: 'var(--theme-text)' }}>
            {name || 'Set your name'}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--theme-text-muted)' }}>
            {user?.email || 'Guest'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--theme-accent)' }}>
            Level {stats.level} • {stats.xp} XP
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Name */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--theme-text-muted)' }}>
                Full Name *
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--theme-text-muted)' }} />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none theme-input"
                  style={{ 
                    background: 'var(--theme-card)', 
                    borderColor: 'var(--theme-card-border)',
                    color: 'var(--theme-text)'
                  }}
                />
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--theme-text-muted)' }}>
                Age
              </label>
              <div className="relative">
                <CalendarIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--theme-text-muted)' }} />
                <input
                  type="number"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="25"
                  min="1"
                  max="120"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none theme-input"
                  style={{ 
                    background: 'var(--theme-card)', 
                    borderColor: 'var(--theme-card-border)',
                    color: 'var(--theme-text)'
                  }}
                />
              </div>
            </div>

            {/* Job */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--theme-text-muted)' }}>
                Job / Profession
              </label>
              <div className="relative">
                <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--theme-text-muted)' }} />
                <input
                  type="text"
                  value={job}
                  onChange={e => setJob(e.target.value)}
                  placeholder="Software Engineer"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none theme-input"
                  style={{ 
                    background: 'var(--theme-card)', 
                    borderColor: 'var(--theme-card-border)',
                    color: 'var(--theme-text)'
                  }}
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--theme-text-muted)' }}>
                About Me
              </label>
              <div className="relative">
                <FileText size={16} className="absolute left-3.5 top-3.5" style={{ color: 'var(--theme-text-muted)' }} />
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none resize-none theme-input"
                  style={{ 
                    background: 'var(--theme-card)', 
                    borderColor: 'var(--theme-card-border)',
                    color: 'var(--theme-text)'
                  }}
                />
              </div>
            </div>

            {/* SAVE BUTTONS - Big and Visible */}
            <div className="flex gap-2 pt-2 sticky bottom-0">
              {settings.profileCompleted && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2"
                  style={{ 
                    background: 'var(--theme-card)', 
                    borderColor: 'var(--theme-card-border)',
                    color: 'var(--theme-text-secondary)'
                  }}
                >
                  <X size={16} />
                  Cancel
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={saving || !name.trim() || (settings.profileCompleted && !hasChanges)}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                style={{ 
                  background: 'var(--theme-accent-gradient)',
                  boxShadow: '0 8px 20px color-mix(in srgb, var(--theme-accent) 30%, transparent)'
                }}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={18} strokeWidth={3} />
                    Save Profile
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2.5 overflow-hidden"
          >
            {settings.userAge && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--theme-card)' }}>
                <CalendarIcon size={14} style={{ color: 'var(--theme-text-muted)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>Age</span>
                <span className="text-sm font-semibold ml-auto" style={{ color: 'var(--theme-text)' }}>{settings.userAge}</span>
              </div>
            )}
            {settings.userJob && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--theme-card)' }}>
                <Briefcase size={14} style={{ color: 'var(--theme-text-muted)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>Job</span>
                <span className="text-sm font-semibold ml-auto truncate ml-2" style={{ color: 'var(--theme-text)' }}>{settings.userJob}</span>
              </div>
            )}
            {settings.userBio && (
              <div className="px-3 py-2.5 rounded-xl" style={{ background: 'var(--theme-card)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={14} style={{ color: 'var(--theme-text-muted)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>About</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{settings.userBio}</p>
              </div>
            )}
            {!settings.userAge && !settings.userJob && !settings.userBio && (
              <p className="text-xs text-center py-2" style={{ color: 'var(--theme-text-muted)' }}>
                Click Edit to add more details about yourself
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
