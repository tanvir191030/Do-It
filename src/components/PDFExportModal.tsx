import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { X, FileText, Download, Loader2, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { CATEGORIES, PRIORITY_CONFIG } from '../types';

type RangeType = 'week' | 'month' | 'year' | 'all';

export function PDFExportModal({ onClose }: { onClose: () => void }) {
  const { tasks, stats, settings, user, showToast } = useStore();
  const [range, setRange] = useState<RangeType>('week');
  const [generating, setGenerating] = useState(false);

  function getDateRange(rangeType: RangeType): { start: Date; end: Date; label: string } {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    let start = new Date(now);
    let label = '';

    switch (rangeType) {
      case 'week':
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        label = 'Last 7 Days';
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        label = 'Last 30 Days';
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        start.setHours(0, 0, 0, 0);
        label = 'Last 365 Days';
        break;
      case 'all':
        start = new Date(2020, 0, 1);
        label = 'All Time';
        break;
    }
    return { start, end, label };
  }

  async function generatePDF() {
    setGenerating(true);
    try {
      const { start, end, label } = getDateRange(range);

      // Filter tasks within range
      const filteredTasks = tasks.filter(t => {
        const taskDate = t.dueDate ? new Date(t.dueDate + 'T00:00:00') : new Date(t.createdAt);
        return taskDate >= start && taskDate <= end;
      });

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header with gradient simulation
      doc.setFillColor(139, 92, 246);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Do-It', 14, 15);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('AI-Powered Productivity Report', 14, 22);
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      
      y = 45;

      // User Info
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('User Profile', 14, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${settings.userName || 'User'}`, 14, y); y += 5;
      if (user?.email) { doc.text(`Email: ${user.email}`, 14, y); y += 5; }
      if (settings.userJob) { doc.text(`Job: ${settings.userJob}`, 14, y); y += 5; }
      if (settings.userAge) { doc.text(`Age: ${settings.userAge}`, 14, y); y += 5; }
      y += 5;

      // Stats Section
      doc.setFillColor(245, 240, 255);
      doc.rect(10, y - 2, pageWidth - 20, 28, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 92, 246);
      doc.text('Statistics Overview', 14, y + 4);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.text(`Total XP: ${stats.xp}`, 14, y + 12);
      doc.text(`Level: ${stats.level}`, 60, y + 12);
      doc.text(`Streak: ${stats.streak} days`, 100, y + 12);
      doc.text(`Tasks Completed: ${stats.totalTasksCompleted}`, 14, y + 19);
      doc.text(`Pomodoros: ${stats.totalPomodoros}`, 100, y + 19);
      y += 35;

      // Report Title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text(`Tasks Report - ${label}`, 14, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text(`From: ${start.toLocaleDateString()} - To: ${end.toLocaleDateString()}`, 14, y);
      y += 8;

      // Task Summary
      const completedCount = filteredTasks.filter(t => t.completed).length;
      const pendingCount = filteredTasks.filter(t => !t.completed).length;
      
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(`Total: ${filteredTasks.length}  |  Completed: ${completedCount}  |  Pending: ${pendingCount}`, 14, y);
      y += 8;

      // Tasks Table Header
      if (filteredTasks.length === 0) {
        doc.setFontSize(11);
        doc.setTextColor(150, 150, 150);
        doc.text('No tasks found in this period.', 14, y + 5);
      } else {
        doc.setFillColor(139, 92, 246);
        doc.rect(10, y - 2, pageWidth - 20, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('STATUS', 14, y + 3);
        doc.text('TASK', 35, y + 3);
        doc.text('CATEGORY', 110, y + 3);
        doc.text('PRIORITY', 145, y + 3);
        doc.text('DATE', 175, y + 3);
        y += 10;

        // Tasks rows
        doc.setFont('helvetica', 'normal');
        for (const task of filteredTasks) {
          if (y > 275) {
            doc.addPage();
            y = 20;
          }
          
          // Alternate row backgrounds
          if (filteredTasks.indexOf(task) % 2 === 0) {
            doc.setFillColor(248, 248, 252);
            doc.rect(10, y - 4, pageWidth - 20, 7, 'F');
          }
          
          // Status
          if (task.completed) {
            doc.setTextColor(16, 185, 129);
            doc.text('[x]', 14, y);
          } else {
            doc.setTextColor(150, 150, 150);
            doc.text('[ ]', 14, y);
          }
          
          // Task title (truncate if too long)
          doc.setTextColor(50, 50, 50);
          doc.setFontSize(9);
          const titleText = task.title.length > 45 ? task.title.substring(0, 45) + '...' : task.title;
          doc.text(titleText, 35, y);
          
          // Category
          const cat = CATEGORIES.find(c => c.value === task.category);
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(cat?.label || task.category, 110, y);
          
          // Priority
          const priColor = task.priority === 'high' ? [239, 68, 68] : task.priority === 'medium' ? [245, 158, 11] : [16, 185, 129];
          doc.setTextColor(priColor[0], priColor[1], priColor[2]);
          doc.text(PRIORITY_CONFIG[task.priority].label, 145, y);
          
          // Date
          doc.setTextColor(120, 120, 120);
          doc.text(task.dueDate || new Date(task.createdAt).toLocaleDateString(), 175, y);
          
          y += 7;
        }
      }

      // Footer on each page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Do-It Productivity Report  |  Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
      }

      // Download
      const fileName = `Do-It_Report_${range}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      showToast('PDF downloaded successfully! 📄', 'success');
      setTimeout(onClose, 500);
    } catch (e: any) {
      showToast('Failed to generate PDF', 'error');
      console.error(e);
    }
    setGenerating(false);
  }

  const ranges: { value: RangeType; label: string; icon: string; desc: string }[] = [
    { value: 'week', label: 'Weekly', icon: '📅', desc: 'Last 7 days of tasks' },
    { value: 'month', label: 'Monthly', icon: '📆', desc: 'Last 30 days of tasks' },
    { value: 'year', label: 'Yearly', icon: '🗓️', desc: 'Last 365 days of tasks' },
    { value: 'all', label: 'All Time', icon: '∞', desc: 'Complete task history' },
  ];

  const { start, end } = getDateRange(range);
  const filtered = tasks.filter(t => {
    const taskDate = t.dueDate ? new Date(t.dueDate + 'T00:00:00') : new Date(t.createdAt);
    return taskDate >= start && taskDate <= end;
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md mx-auto rounded-t-3xl sm:rounded-3xl p-6 safe-bottom"
          style={{ background: 'var(--theme-bg-secondary)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--theme-accent-gradient)' }}>
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>Export PDF Report</h2>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Choose a time range</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--theme-card)', color: 'var(--theme-text-muted)' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Range Options */}
          <div className="space-y-2 mb-5">
            {ranges.map(r => (
              <motion.button
                key={r.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => setRange(r.value)}
                className="w-full p-3.5 rounded-xl border flex items-center gap-3 text-left transition-all"
                style={{
                  background: range === r.value ? 'color-mix(in srgb, var(--theme-accent) 15%, transparent)' : 'var(--theme-card)',
                  borderColor: range === r.value ? 'var(--theme-accent)' : 'var(--theme-card-border)',
                }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0" style={{ background: range === r.value ? 'var(--theme-accent-gradient)' : 'var(--theme-card-border)' }}>
                  {r.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--theme-text)' }}>{r.label}</p>
                  <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{r.desc}</p>
                </div>
                {range === r.value && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--theme-accent)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          {/* Preview Info */}
          <div className="rounded-xl p-3 mb-5 flex items-center gap-3" style={{ background: 'var(--theme-card)' }}>
            <Calendar size={16} style={{ color: 'var(--theme-accent)' }} />
            <div className="flex-1">
              <p className="text-xs font-semibold" style={{ color: 'var(--theme-text)' }}>{filtered.length} tasks found</p>
              <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                {start.toLocaleDateString()} → {end.toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Download Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={generatePDF}
            disabled={generating}
            className="w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--theme-accent-gradient)' }}
          >
            {generating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download size={18} />
                Download PDF
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
