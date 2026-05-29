/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { assetUrl } from '../utils/assets';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParticipate: () => void;
}

export const RewardModal: React.FC<RewardModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-[#00160c] flex flex-col overflow-hidden select-none">
      {/* 二级页面返回按钮：覆盖底导，左上角返回上一页 */}
      <div className="absolute top-3 left-3 z-20">
        <button
          onClick={onClose}
          className="h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 pl-2 pr-3 flex items-center gap-1.5 text-white/90 hover:bg-black/55 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[11px] font-bold">返回</span>
        </button>
      </div>

      {/* 海报展示区：保证整图在手机框里完整展示 */}
      <div className="flex-1 w-full h-full bg-[#00160c]">
        <img
          src={assetUrl('assets/rewards/reward-poster.png')}
          alt="奖励海报"
          className="w-full h-full object-contain object-center"
        />
      </div>
    </div>
  );
};
