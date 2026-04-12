'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';

interface ExamTimerProps {
  totalMinutes?: number;
  onPause?: (paused: boolean) => void;
}

export default function ExamTimer({ totalMinutes = 120, onPause }: ExamTimerProps) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const togglePause = () => {
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    onPause?.(newPaused);
  };

  const totalSeconds = totalMinutes * 60;
  const secondsRemaining = Math.max(0, totalSeconds - secondsElapsed);
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const percentRemaining = (secondsRemaining / totalSeconds) * 100;

  // Determine color based on time remaining
  let timerColor = 'text-blue-600';
  let bgColor = 'bg-blue-50';

  if (percentRemaining <= 10) {
    timerColor = 'text-red-600';
    bgColor = 'bg-red-50';
  } else if (percentRemaining <= 25) {
    timerColor = 'text-orange-600';
    bgColor = 'bg-orange-50';
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg ${bgColor}`}
    >
      <motion.div
        animate={{ scale: percentRemaining <= 10 ? [1, 1.05, 1] : 1 }}
        transition={{ duration: percentRemaining <= 10 ? 1 : 0, repeat: percentRemaining <= 10 ? Infinity : 0 }}
        className={`text-lg font-bold font-mono ${timerColor}`}
      >
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </motion.div>

      <button
        onClick={togglePause}
        className={`p-1 rounded hover:bg-white/50 transition-colors ${isPaused ? 'bg-white/30' : ''}`}
        title={isPaused ? 'Resume' : 'Pause'}
      >
        {isPaused ? (
          <Play className="w-4 h-4 text-slate-600" />
        ) : (
          <Pause className="w-4 h-4 text-slate-600" />
        )}
      </button>
    </motion.div>
  );
}
