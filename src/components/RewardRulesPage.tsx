/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Gift, Medal, Trophy, WalletCards } from 'lucide-react';
import { assetUrl } from '../utils/assets';

interface RewardRulesPageProps {
  isOpen: boolean;
  onClose: () => void;
}

// 规则文案集中维护，运营规则调整时只需要修改这里。
const pointRules = [
  '每场胜/平/负竞猜仅计算基础分。',
  '常规时间猜对 1 场 +1 分，猜错不加分。',
  '常规时间包含 90 分钟与伤停补时，不包含加时赛及点球大战。',
  '同一场比赛提交后不可重复领取积分，赛后按官方赛果统一结算。',
];

const rewardRules = [
  '活动结束后按用户累计基础积分进行排名。',
  '排名奖励以最终榜单为准，若积分相同，可按命中率、提交时间等维度排序。',
  '获奖用户需按页面或主办方通知完成信息登记，逾期未登记视为放弃。',
  '奖励将在活动结束并完成核验后统一发放。',
];

export const RewardRulesPage: React.FC<RewardRulesPageProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-[#040c14] text-white flex flex-col overflow-hidden select-none">
      <div className="relative h-[132px] shrink-0 overflow-hidden bg-gradient-to-b from-[#1e3415] via-[#0a1b10] to-[#040c14] px-4 pt-4 pb-3">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_0%,rgba(255,213,79,0.46),transparent_58%)]" />

        <button
          onClick={onClose}
          className="absolute left-4 top-4 z-20 h-9 rounded-full bg-black/38 backdrop-blur-md border border-white/10 pl-2 pr-3 flex items-center gap-1.5 text-white/90 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[11px] font-bold">返回</span>
        </button>

        <div className="relative z-10 h-full flex flex-col items-center justify-end text-center">
          <span className="text-[10px] text-[#ffd54f] font-bold tracking-[3px] uppercase">Reward Center</span>
          <h2 className="text-[23px] font-black tracking-[3px] mt-1">奖励兑换规则</h2>
          <p className="text-[10.5px] text-slate-300 mt-2 leading-relaxed">
            竞猜得积分，活动结束后按排名发放奖励
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-8 space-y-3">
        <div className="rounded-2xl overflow-hidden border border-[#ffd54f]/18 bg-[#071521] shadow-[0_12px_24px_rgba(0,0,0,0.36)]">
          <div className="px-3.5 py-2.5 flex items-center justify-between bg-gradient-to-r from-[#2b2309] to-[#071521] border-b border-white/5">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#ffd54f]" />
              <span className="text-xs font-black text-white">奖励是什么</span>
            </div>
            <span className="text-[9px] text-[#ffd54f] font-mono">TOP 奖励</span>
          </div>

          {/* 奖励图片替换点：运营更新奖品时，覆盖 public/assets/rewards/reward-poster-mobile.jpg 即可。 */}
          <img
            src={assetUrl('assets/rewards/reward-poster-mobile.jpg')}
            alt="奖励海报"
            className="w-full max-h-[300px] object-contain bg-[#00160c]"
            loading="eager"
            decoding="async"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-[#071521] border border-white/6 p-3 text-center">
            <Trophy className="w-5 h-5 text-[#ffd54f] mx-auto" />
            <span className="block text-[9px] text-slate-400 mt-1.5">榜单奖励</span>
            <strong className="block text-xs text-white mt-0.5">前 5 名</strong>
          </div>
          <div className="rounded-2xl bg-[#071521] border border-white/6 p-3 text-center">
            <Medal className="w-5 h-5 text-[#00e676] mx-auto" />
            <span className="block text-[9px] text-slate-400 mt-1.5">积分口径</span>
            <strong className="block text-xs text-white mt-0.5">基础分</strong>
          </div>
          <div className="rounded-2xl bg-[#071521] border border-white/6 p-3 text-center">
            <WalletCards className="w-5 h-5 text-[#ffd54f] mx-auto" />
            <span className="block text-[9px] text-slate-400 mt-1.5">发放方式</span>
            <strong className="block text-xs text-white mt-0.5">统一核验</strong>
          </div>
        </div>

        <section className="rounded-2xl bg-[#071521]/95 border border-[#00e676]/12 p-3.5 shadow-[0_10px_22px_rgba(0,0,0,0.3)]">
          <h3 className="text-sm font-black text-[#00e676] flex items-center gap-1.5">
            <Medal className="w-4 h-4" />
            积分获取规则
          </h3>
          <div className="mt-3 space-y-2">
            {pointRules.map((rule, index) => (
              <div key={rule} className="flex gap-2 text-[11px] text-slate-300 leading-relaxed">
                <span className="mt-[2px] w-4 h-4 rounded-full bg-[#00e676]/12 border border-[#00e676]/18 text-[#00e676] flex items-center justify-center text-[9px] font-black shrink-0">
                  {index + 1}
                </span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-[#071521]/95 border border-[#ffd54f]/12 p-3.5 shadow-[0_10px_22px_rgba(0,0,0,0.3)]">
          <h3 className="text-sm font-black text-[#ffd54f] flex items-center gap-1.5">
            <Gift className="w-4 h-4" />
            奖励发放规则
          </h3>
          <div className="mt-3 space-y-2">
            {rewardRules.map((rule, index) => (
              <div key={rule} className="flex gap-2 text-[11px] text-slate-300 leading-relaxed">
                <span className="mt-[2px] w-4 h-4 rounded-full bg-[#ffd54f]/12 border border-[#ffd54f]/18 text-[#ffd54f] flex items-center justify-center text-[9px] font-black shrink-0">
                  {index + 1}
                </span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-2xl border border-white/6 bg-black/16 p-3 text-[10px] text-slate-500 leading-relaxed">
          奖励图及具体权益可随活动调整，最终解释和发放以主办方公布的正式规则为准。
        </div>
      </div>
    </div>
  );
};
