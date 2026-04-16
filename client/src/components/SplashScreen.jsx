import React, { useEffect, useState } from 'react';

/**
 * SplashScreen Component
 * Provides a macOS-style animation for "CNHHS" using animated text strokes.
 */
const SplashScreen = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      // Wait for the exit transition (1000ms) before calling onComplete
      setTimeout(onComplete, 1000); 
    }, 3500);

    return () => clearTimeout(exitTimer);
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020617] transition-all duration-1000 ease-in-out ${
        isExiting ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      <div className="relative w-full max-w-4xl px-10 flex flex-col items-center">
        <svg
          viewBox="0 0 1000 300"
          className="w-full h-auto"
        >
          <defs>
            <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* CNHHS Text with stroke animation */}
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="cnhhs-text"
            style={{
              fontFamily: '"Outfit", "Inter", "system-ui", sans-serif',
              fontWeight: '900',
              fontSize: '180px',
              letterSpacing: '0.1em'
            }}
            fill="none"
            stroke="url(#textGradient)"
            strokeWidth="3"
          >
            CNHHS
          </text>
        </svg>

        <div 
          className={`mt-4 flex flex-col items-center gap-2 transition-all duration-1000 delay-1000 ${
            isExiting ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="h-[1px] w-12 bg-indigo-500/50 mb-2"></div>
          <div className="text-slate-500 font-medium tracking-[0.4em] uppercase text-[10px]">
            CNHHS <span className="text-white/20 mx-2">|</span> Smart Campus
          </div>
        </div>

        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@900&display=swap');

            .cnhhs-text {
              stroke-dasharray: 1200;
              stroke-dashoffset: 1200;
              animation: drawText 2.8s cubic-bezier(0.65, 0, 0.35, 1) forwards,
                         fillIn 1.5s ease-in-out 2s forwards;
              filter: url(#glow);
            }

            @keyframes drawText {
              to {
                stroke-dashoffset: 0;
              }
            }

            @keyframes fillIn {
              from {
                fill: transparent;
                stroke-width: 3;
              }
              to {
                fill: rgba(255, 255, 255, 0.05);
                stroke-width: 1;
              }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default SplashScreen;
