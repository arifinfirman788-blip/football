/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { assetUrl } from '../utils/assets';

interface SplashAdProps {
  isLeaving: boolean;
  onReady: () => void;
  onSkip: () => void;
}

export const SplashAd: React.FC<SplashAdProps> = ({ isLeaving, onReady, onSkip }) => {
  return (
    <div
      className={`absolute inset-0 z-[80] bg-[#00160c] flex flex-col overflow-hidden select-none transition-opacity duration-700 ${
        isLeaving ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <button
        onClick={onSkip}
        className="absolute right-4 top-4 z-20 rounded-full bg-black/40 border border-white/15 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold text-white/85 active:scale-95 transition-all"
      >
        跳过
      </button>

      <div className="absolute inset-0 bg-gradient-to-b from-[#00160c] via-[#00160c] to-[#030a0f]" />

      <img
        src={assetUrl('assets/rewards/reward-poster-mobile.jpg')}
        alt="世界杯竞猜活动海报"
        className="relative z-10 w-full h-full object-contain object-center"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        onLoad={onReady}
        onError={onReady}
      />
    </div>
  );
};
