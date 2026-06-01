/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * 旧版“我的”页组件。
 * 当前底导已改为“竞猜、赛程、排行、预测”，用户记录入口迁移到排行页“我的排行”。
 * 如后续需要恢复个人中心，可把 PredictionRecord 类型同步过来并替换这里的旧结构。
 */
interface ProfileTabProps {
  predictionHistory: Array<{
    matchId: string;
    fixture: string;
    choice: string;
    time: string;
    status: string;
  }>;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ predictionHistory }) => {
  return (
    <div className="flex-1 flex flex-col bg-[#050f14] text-white overflow-hidden select-none">
      
      {/* 用户资料卡：旧“我的”页入口，当前底导已不展示。 */}
      <div className="relative py-8 px-5 bg-gradient-to-b from-[#102436] to-[#050f14] flex flex-col items-center justify-center text-center">
        <div className="relative mb-3">
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" 
            alt="Avatar" 
            className="w-20 h-20 rounded-full object-cover border-4 border-[#ffca28] shadow-[0_0_20px_rgba(255,202,40,0.4)]"
          />
          <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1 border-2 border-slate-900">
            👑
          </div>
        </div>

        <h3 className="text-base font-bold text-white tracking-wide">球迷小王</h3>
        <span className="text-[10px] text-slate-400 font-medium font-mono uppercase mt-0.5">Football Fan Club #40291</span>

        <div className="flex items-center space-x-2.5 mt-2">
          <span className="bg-[#ffd54f]/15 text-[#ffd54f] text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-500/20">
            Lv.18 黄金荣耀
          </span>
          <span className="text-slate-500 font-mono text-xs">|</span>
          <span className="text-emerald-400 font-semibold text-[11px] flex items-center space-x-1">
            <span>⚽</span>
            <span>预测率 82.4%</span>
          </span>
        </div>
      </div>

      {/* 用户竞猜统计宫格 */}
      <div className="px-4 py-3 bg-[#081521] border-y border-white/5 grid grid-cols-3 text-center">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400">基础积分</span>
          <span className="text-sm font-bold text-[#ffd54f] font-mono mt-0.5">5</span>
        </div>
        
        <div className="flex flex-col border-x border-white/5">
          <span className="text-[10px] text-slate-400">竞猜次数</span>
          <span className="text-sm font-bold text-slate-100 font-mono mt-0.5">
            {predictionHistory.length + 4} 次
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400">计分规则</span>
          <span className="text-sm font-bold text-[#00e676] font-mono mt-0.5">+1/场</span>
        </div>
      </div>

      {/* 竞猜历史列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#00e676] tracking-wide">📝 我的竞猜记录</span>
          <span className="text-[9px] text-slate-500 font-mono">HISTORY RECORD</span>
        </div>

        <div className="space-y-2">
          {predictionHistory.map((item, idx) => (
            <div 
              key={idx}
              className="sport-glass-card rounded-2xl p-3 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex flex-col space-y-1">
                <span className="text-xs font-bold text-white">{item.fixture}</span>
                <span className="text-[9px] text-slate-400 font-mono">{item.time}</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/10">
                    {item.choice}
                  </span>
                </div>
                
                <span className="text-[10px] font-bold text-[#ffd54f]">
                  {item.status}
                </span>
              </div>
            </div>
          ))}

          {/* 静态历史数据：用于保留旧页面的展示完整度。 */}
          <div className="sport-glass-card rounded-2xl p-3 flex items-center justify-between">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-bold text-white">阿根廷 VS 德国</span>
              <span className="text-[9px] text-slate-400 font-mono">06-03 02:00</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/10">
                主胜 (阿根廷)
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">待开奖</span>
            </div>
          </div>

          <div className="sport-glass-card rounded-2xl p-3 flex items-center justify-between">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-bold text-white">日本 VS 塞内加尔</span>
              <span className="text-[9px] text-slate-400 font-mono">06-04 20:00</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/10">
                客胜 (塞内加尔)
              </span>
              <span className="text-[10px] text-[#00e676] font-bold">猜对 +1</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
