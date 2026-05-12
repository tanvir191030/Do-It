import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<any[]>([]);

  useEffect(() => {
    if (active) {
      const newPieces = Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -20,
        color: ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'][Math.floor(Math.random() * 5)],
        size: Math.random() * 8 + 4,
        duration: Math.random() * 2 + 1,
        rotation: Math.random() * 360,
      }));
      setPieces(newPieces);
      const timer = setTimeout(() => setPieces([]), 3500);
      return () => clearTimeout(timer);
    }
  }, [active]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[300] overflow-hidden">
      <AnimatePresence>
        {pieces.map(p => (
          <motion.div
            key={p.id}
            initial={{ y: -20, x: `${p.x}vw`, rotate: 0, opacity: 1 }}
            animate={{ 
              y: '120vh', 
              x: `${p.x + (Math.random() * 20 - 10)}vw`,
              rotate: p.rotation + 720,
              opacity: 0
            }}
            transition={{ duration: p.duration, ease: 'easeOut' }}
            className="absolute rounded-sm"
            style={{ 
              width: p.size, 
              height: p.size, 
              background: p.color,
              boxShadow: `0 0 10px ${p.color}40`
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
