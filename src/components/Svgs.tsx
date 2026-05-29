/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// World Cup Golden Trophy SVG
export const TrophySvg: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => {
  return (
    <svg className={className} viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Base */}
      <ellipse cx="60" cy="170" rx="35" ry="8" fill="url(#gold_base_gradient)" />
      <path d="M35 155h50v15H35z" fill="url(#gold_dark)" rx="3" />
      <path d="M40 135h40v20H40z" fill="url(#gold_med)" rx="2" />
      <path d="M45 135 L40 155 H80 L75 135 Z" fill="url(#gold_dark)" />
      
      {/* Green marble rings */}
      <rect x="42" y="142" width="36" height="4" fill="#00e676" rx="1" />
      <rect x="42" y="150" width="36" height="3" fill="#00bcd4" rx="1" />
      
      {/* Stem / Figures */}
      <path d="M45 80 C 45 110, 50 135, 60 135 C 70 135, 75 110, 75 80 Z" fill="url(#gold_light)" />
      
      {/* Two angelic figures stretching up, supporting globe */}
      <path d="M48 100 C 42 110, 48 128, 60 128 C 72 128, 78 110, 72 100" stroke="url(#gold_dark)" strokeWidth="3" fill="none" />
      
      {/* Angel arms/wings supporting sphere */}
      <path d="M40 75 C 38 65, 48 55, 60 62 C 72 55, 82 65, 80 75 L 75 85 L 60 90 L 45 85 Z" fill="url(#gold_med)" />
      
      {/* Sphere/Globe representing soccer/earth */}
      <circle cx="60" cy="48" r="28" fill="url(#gold_light)" />
      <circle cx="60" cy="48" r="28" fill="url(#globe_lines)" fillOpacity="0.15" />
      
      {/* Continental plates overlay */}
      <path d="M44 38c7-4 17-2 21 3 3 4-2 9-5 11-4 2-10 0-13-4-2-4-7-6-3-10z" fill="url(#gold_dark)" opacity="0.6" />
      <path d="M68 45c5-2 12-1 14 3 2 4-2 7-5 8s-8-1-10-4c-1-3-3-5 1-7z" fill="url(#gold_dark)" opacity="0.6" />
      <path d="M52 58c4-1 9 0 11 3 2 3-1 6-3 6s-6 0-8-3c-1-2-2-4 0-6z" fill="url(#gold_dark)" opacity="0.6" />

      {/* Highlights / Shine Glow */}
      <circle cx="48" cy="36" r="3" fill="white" opacity="0.5" filter="blur(1px)" />
      <circle cx="70" cy="32" r="2" fill="white" opacity="0.4" filter="blur(1px)" />
      <path d="M58 80 L60 135" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.3" />

      <defs>
        <linearGradient id="gold_light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff176" />
          <stop offset="50%" stopColor="#ffd54f" />
          <stop offset="100%" stopColor="#ffb300" />
        </linearGradient>
        <linearGradient id="gold_med" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffca28" />
          <stop offset="100%" stopColor="#ffa000" />
        </linearGradient>
        <linearGradient id="gold_dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffb300" />
          <stop offset="100%" stopColor="#e65100" />
        </linearGradient>
        <linearGradient id="gold_base_gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffe082" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#ffd54f" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffa000" stopOpacity="0.1" />
        </linearGradient>
        <pattern id="globe_lines" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="4" stroke="white" strokeWidth="0.5" fill="none" />
          <line x1="0" y1="5" x2="10" y2="5" stroke="white" strokeWidth="0.5" />
          <line x1="5" y1="0" x2="5" y2="10" stroke="white" strokeWidth="0.5" />
        </pattern>
      </defs>
    </svg>
  );
};

// Highly Polished Soccer Ball SVG
export const SoccerBallSvg: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => {
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      <svg className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Ball main body */}
        <circle cx="50" cy="50" r="46" fill="url(#ball_skin)" stroke="#e4e4e7" strokeWidth="1" />
        
        {/* Pentagons & Lines */}
        {/* Center Pent */}
        <path d="M50 35 L62 45 L58 58 L42 58 L38 45 Z" fill="#18181b" stroke="#374151" strokeWidth="1.5" strokeLinejoin="round" />
        
        {/* Connecting lines & other panels */}
        {/* Top */}
        <line x1="50" y1="35" x2="50" y2="15" stroke="#374151" strokeWidth="1.5" />
        <path d="M50 15 L35 7 L23 18 L38 45" stroke="#374151" strokeWidth="1.5" fill="none" />
        <path d="M50 15 L65 7 L77 18 L62 45" stroke="#374151" strokeWidth="1.5" fill="none" />
        <path d="M35 7 L50 4 L65 7" stroke="#374151" strokeWidth="1.5" fill="none" />

        {/* Top Left pent */}
        <path d="M23 18 L15 32 L26 42 L38 45 L23 18 Z" fill="#18181b" opacity="0.95" stroke="#374151" strokeWidth="1.5" />
        
        {/* Top Right pent */}
        <path d="M77 18 L85 32 L74 42 L62 45 L77 18 Z" fill="#18181b" opacity="0.95" stroke="#374151" strokeWidth="1.5" />

        {/* Bottom Left pent */}
        <path d="M42 58 L30 68 L36 84 L50 82" stroke="#374151" strokeWidth="1.5" fill="none" />
        <path d="M26 42 L13 54 L18 70 L30 68" stroke="#374151" strokeWidth="1.5" fill="none" />
        <path d="M13 54 L15 32" stroke="#374151" strokeWidth="1.5" />
        <path d="M18 70 L36 84" stroke="#374151" strokeWidth="1.5" />

        <path d="M30 68 L18 70 L15 88 L35 91 L36 84 Z" fill="#18181b" opacity="0.95" stroke="#374151" strokeWidth="1.5" />

        {/* Bottom Right pent */}
        <path d="M58 58 L70 68 L64 84 L50 82" stroke="#374151" strokeWidth="1.5" fill="none" />
        <path d="M74 42 L87 54 L82 70 L70 68" stroke="#374151" strokeWidth="1.5" fill="none" />
        <path d="M87 54 L85 32" stroke="#374151" strokeWidth="1.5" />
        <path d="M82 70 L64 84" stroke="#374151" strokeWidth="1.5" />

        <path d="M70 68 L82 70 L85 88 L65 91 L64 84 Z" fill="#18181b" opacity="0.95" stroke="#374151" strokeWidth="1.5" />

        {/* Bottom center pent */}
        <path d="M50 82 L36 84 L40 95 L60 95 L64 84 Z" fill="#18181b" opacity="0.95" stroke="#374151" strokeWidth="1.5" />

        {/* Shadow overlays & Spherical lighting gloss */}
        <circle cx="50" cy="50" r="46" fill="url(#ball_shade)" opacity="0.75" />
        <circle cx="42" cy="38" r="42" fill="url(#ball_highlight)" opacity="0.35" />

        <defs>
          <radialGradient id="ball_skin" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#f4f4f5" />
            <stop offset="100%" stopColor="#d4d4d8" />
          </radialGradient>
          <radialGradient id="ball_shade" cx="65%" cy="65%" r="65%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="60%" stopColor="#000000" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.65" />
          </radialGradient>
          <radialGradient id="ball_highlight" cx="30%" cy="30%" r="40%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};

// Crown badge vector
export const CrownIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.4 20h19.2" />
      <path d="M20.2 11c-.4-1.2-1.6-1.8-2.8-1.4l-1.3.4-1.8-6.1c-.3-1-1.3-1.6-2.3-1.3-.9.3-1.5 1.3-1.2 2.3l1.8 6.1-2 .5-2-6.6c-.3-1-1.3-1.6-2.3-1.3-.9.3-1.5 1.3-1.2 2.3l2 6.6-1.3.3C4.6 8.5 3.4 9.1 3 10.3l-1 3.2C1.7 14.3 2.1 15 3 15h18c.9 0 1.3-.7 1-1.5l-1.8-2.5z" fill="#ffd54f" stroke="#ffa000" strokeWidth="1" />
    </svg>
  );
};
