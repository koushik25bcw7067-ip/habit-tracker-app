import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function RoamingDoll() {
  const { currentTheme } = useTheme();
  const [pos, setPos] = useState({ x: 40, y: 80 });
  const [speech, setSpeech] = useState(null);

  useEffect(() => {
    const moveInterval = setInterval(() => {
      const margin = 10;
      const nextX = Math.floor(Math.random() * (90 - margin)) + margin;
      const nextY = Math.floor(Math.random() * (85 - margin)) + margin;
      setPos({ x: nextX, y: nextY });
    }, 6000);
    return () => clearInterval(moveInterval);
  }, []);

  const handleInteraction = () => {
    const dialogues = currentTheme.dialogues || ['Nannu kadhu, task ni tick chey mowaa!'];
    const randomLine = dialogues[Math.floor(Math.random() * dialogues.length)];
    setSpeech(randomLine);
    setTimeout(() => setSpeech(null), 4500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: `${pos.x}vw`,
        top: `${pos.y}vh`,
        transition: 'all 1.6s cubic-bezier(0.25, 1, 0.5, 1)',
        zIndex: 9999,
        cursor: 'pointer'
      }}
      onClick={handleInteraction}
      className="select-none flex flex-col items-center"
    >
      {speech && (
        <div className="mb-2 max-w-[200px] text-xs font-medium px-3 py-2 rounded-xl backdrop-blur-md bg-slate-900/90 text-white border border-white/20 shadow-2xl animate-bounce">
          {speech}
        </div>
      )}
      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 shadow-lg text-2xl hover:scale-110 active:scale-95 transition-transform">
        {currentTheme.doll_emoji || '👾'}
      </div>
    </div>
  );
}