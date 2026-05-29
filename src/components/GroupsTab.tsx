/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { assetUrl } from '../utils/assets';

interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  level: number;
  guesses: number;
  accuracy: string;
  points: number;
}

interface GroupsTabProps {
  onTeamSelect?: (teamId: string) => void;
}

const bannerBg = assetUrl('assets/schedule/stadium-header.png');
const bannerTrophy = assetUrl('assets/schedule/trophy-cup.png');

// High-fidelity custom medallions rendered based exactly on Attachment 1 (medals have beautiful colored ribbon tails)
interface MedalProps {
  rank: number;
}
const CustomMedal: React.FC<MedalProps> = ({ rank }) => {
  const c = {
    1: { outline: '#faaa15', gradient: 'from-[#ffdf73] to-[#e49b14]', ribbonL: '#bf2121', ribbonR: '#2c5fb3', text: '#5a3b05' },
    2: { outline: '#a3bacd', gradient: 'from-[#e2eaf0] to-[#8fa2be]', ribbonL: '#2757a3', ribbonR: '#2757a3', text: '#3c4d5d' },
    3: { outline: '#d58749', gradient: 'from-[#f1b88e] to-[#ab6a35]', ribbonL: '#bd4128', ribbonR: '#ab6a35', text: '#5a2d0c' }
  }[rank as 1 | 2 | 3];

  if (!c) return null;

  return (
    <div className="relative w-10 h-10 flex flex-col items-center justify-center shrink-0">
      {/* Medallion hanging ribbons behind */}
      <svg className="absolute top-[21px] w-6.5 h-4.5 drop-shadow-sm" viewBox="0 0 24 20" fill="none">
        <path d="M5 0L0 18L5.5 14L11 18L5.5 0" fill={c.ribbonL} />
        <path d="M19 0L13.5 18L19 14L24.5 18L19 0" fill={c.ribbonR} />
      </svg>
      {/* Circle Medallion */}
      <div 
        className="w-7 h-7 rounded-full flex items-center justify-center font-black text-sm relative z-10 shadow-lg border"
        style={{
          background: `radial-gradient(circle at 35% 35%, #ffffff 0%, rgba(255,255,255,0) 70%), linear-gradient(135deg, ${c.gradient.split(' ')[0].replace('from-[', '').replace(']', '')}, ${c.gradient.split(' ')[1].replace('to-[', '').replace(']', '')})`,
          borderColor: c.outline,
          color: c.text,
          boxShadow: `0 3px 8px rgba(0,0,0,0.4), inset 0 1px 1.5px rgba(255,255,255,0.7), 0 0 8px ${c.outline}33`
        }}
      >
        {rank}
      </div>
    </div>
  );
};

export const GroupsTab: React.FC<GroupsTabProps> = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'all-time'>('daily');
  const [showRules, setShowRules] = useState<boolean>(false);

  // Attachment 1 accurate Leaderboard list data
  const dailyLeaderboard: LeaderboardUser[] = [
    {
      rank: 1,
      name: '绿茵达人',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80',
      level: 28,
      guesses: 12,
      accuracy: '85%',
      points: 12
    },
    {
      rank: 2,
      name: '球场小诸葛',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=80',
      level: 24,
      guesses: 11,
      accuracy: '78%',
      points: 11
    },
    {
      rank: 3,
      name: '足球狂热者',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=80',
      level: 22,
      guesses: 10,
      accuracy: '71%',
      points: 10
    },
    {
      rank: 4,
      name: '进球机器',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=80',
      level: 20,
      guesses: 9,
      accuracy: '69%',
      points: 9
    },
    {
      rank: 5,
      name: '红黑传奇',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=80',
      level: 18,
      guesses: 8,
      accuracy: '67%',
      points: 8
    },
    {
      rank: 6,
      name: '战术大师',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=80',
      level: 18,
      guesses: 8,
      accuracy: '62%',
      points: 8
    },
    {
      rank: 7,
      name: '逆风翻盘',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=80',
      level: 16,
      guesses: 7,
      accuracy: '58%',
      points: 7
    },
    {
      rank: 8,
      name: '幸运星',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=80',
      level: 15,
      guesses: 7,
      accuracy: '54%',
      points: 7
    },
    {
      rank: 9,
      name: '蓝月亮',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=80',
      level: 14,
      guesses: 6,
      accuracy: '50%',
      points: 6
    },
    {
      rank: 10,
      name: '射手本色',
      avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=80',
      level: 14,
      guesses: 6,
      accuracy: '46%',
      points: 6
    }
  ];

  const baseScoreLeaderboard: LeaderboardUser[] = dailyLeaderboard.map((user) => ({
    ...user,
    points: user.guesses
  }));

  const allTimeLeaderboard: LeaderboardUser[] = baseScoreLeaderboard.map((user) => {
    const correctGuesses = Math.round(user.guesses * 8.2);
    return {
      ...user,
      level: Math.round(user.level * 1.5),
      guesses: correctGuesses,
      points: correctGuesses
    };
  }).sort((a,b) => b.points - a.points);

  const activeLeaderboardList = activeTab === 'daily' ? baseScoreLeaderboard : allTimeLeaderboard;

  return (
    <div className="flex-1 flex flex-col bg-[#040c14] text-white overflow-hidden relative select-none font-sans">
      
      {/* 1. Header with Stadium Night Ambience & World Cup Trophy */}
      <div className="relative h-[194px] shrink-0 overflow-hidden bg-[#06111a]">
        <img
          src={bannerBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-[#071521]/10 to-[#050f17]/85" />
        <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black/45 to-transparent" />

        <h2 className="absolute top-[74px] inset-x-0 text-center text-[26px] font-black tracking-[6px] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
          排行榜
        </h2>

        <div className="absolute top-[22px] right-4 flex items-center gap-2">
          <button
            onClick={() => setShowRules(true)}
            className="h-9 px-4 rounded-full border border-white/12 bg-black/18 backdrop-blur-md text-white text-[13px] font-bold shadow-[0_2px_10px_rgba(0,0,0,0.28)] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <span>规则说明</span>
            <HelpCircle className="w-4 h-4 text-white/90" />
          </button>
        </div>

        <img
          src={bannerTrophy}
          alt="大力神杯"
          className="absolute right-4 top-[62px] w-[62px] h-[122px] object-contain drop-shadow-[0_8px_18px_rgba(255,190,48,0.28)]"
        />

        {/* 排行榜分段切换：左右各半的圆角矩形 */}
        <div className="leaderboard-segment-shell absolute left-16 right-16 bottom-3">
          <div className="grid grid-cols-2 h-full">
          <button
            onClick={() => setActiveTab('daily')}
            className={`leaderboard-segment-button rounded-l-[20px] ${
              activeTab === 'daily'
                ? 'leaderboard-segment-button--active'
                : 'leaderboard-segment-button--idle'
            }`}
          >
            当日排行
          </button>
          <button
            onClick={() => setActiveTab('all-time')}
            className={`leaderboard-segment-button rounded-r-[20px] ${
              activeTab === 'all-time'
                ? 'leaderboard-segment-button--active'
                : 'leaderboard-segment-button--idle'
            }`}
          >
            总排行
          </button>
          </div>
        </div>
      </div>

      {/* 2. Horizontal Table Header - Column alignment strictly mapped 1:1 on screenshot grid */}
      <div className="leaderboard-table-header grid grid-cols-[48px_minmax(110px,1fr)_54px_54px_52px] items-center mx-3.5 mt-2 px-3.5 py-2 text-[10px] text-slate-300 font-bold tracking-wider shrink-0 select-none">
        <span className="text-center font-medium">排名</span>
        <span className="pl-1 font-medium">用户</span>
        <span className="text-center font-medium">猜对场次</span>
        <span className="text-center font-medium">命中率</span>
        <span className="text-right font-medium pr-1">积分</span>
      </div>

      {/* 3. Fully replicated Scrollable List of players */}
      <div className="flex-1 overflow-y-auto px-3.5 pt-2 pb-44 space-y-2 relative z-0 scrollbar-none">
        {activeLeaderboardList.map((user) => {
          const isRank1 = user.rank === 1;
          const isRank2 = user.rank === 2;
          const isRank3 = user.rank === 3;
          
          let cardBg = 'bg-[#06111be1] border border-white/[0.08] rounded-xl shadow-[0_8px_18px_rgba(0,0,0,0.34)]';
          let borderStyle = '';
          let textAccent = 'text-white';
          
          if (isRank1) {
            cardBg = 'bg-gradient-to-r from-[#e5a93b]/10 via-[#06111b] to-[#06111b]';
            borderStyle = 'border-[1.2px] border-[#e5a93b]/70 shadow-[0_8px_22px_rgba(229,169,59,0.2),0_6px_18px_rgba(0,0,0,0.38)]';
            textAccent = 'text-[#ffe082]';
          } else if (isRank2) {
            cardBg = 'bg-gradient-to-r from-[#8ba3bd]/10 via-[#06111b] to-[#06111b]';
            borderStyle = 'border-[1.2px] border-[#8ba3bd]/62 shadow-[0_8px_22px_rgba(139,163,189,0.18),0_6px_18px_rgba(0,0,0,0.38)]';
            textAccent = 'text-white';
          } else if (isRank3) {
            cardBg = 'bg-gradient-to-r from-[#c68953]/10 via-[#06111b] to-[#06111b]';
            borderStyle = 'border-[1.2px] border-[#c68953]/62 shadow-[0_8px_22px_rgba(198,137,83,0.18),0_6px_18px_rgba(0,0,0,0.38)]';
            textAccent = 'text-white';
          } else {
            cardBg = 'bg-[#06111b]/86 border border-white/[0.08] shadow-[0_7px_16px_rgba(0,0,0,0.32)]';
          }

          return (
            <div
              key={user.rank}
              className={`grid grid-cols-[48px_minmax(110px,1fr)_54px_54px_52px] items-center px-3.5 py-2.5 rounded-xl transition-all ${cardBg} ${borderStyle}`}
            >
              {/* Rank column */}
              <div className="flex justify-center shrink-0">
                {user.rank <= 3 ? (
                  <CustomMedal rank={user.rank} />
                ) : (
                  <div className="w-6 h-6 text-slate-400 flex items-center justify-center text-xs font-bold select-none font-mono">
                    {user.rank}
                  </div>
                )}
              </div>

              {/* User Avatar + Profile details column */}
              <div className="pl-1 flex items-center space-x-2 min-w-0 overflow-hidden">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className={`w-9 h-9 rounded-full object-cover shrink-0 select-none shadow ${
                    isRank1 
                      ? 'border-[1.5px] border-[#e5a93b]' 
                      : isRank2 
                        ? 'border-[1.5px] border-[#8ba3bd]' 
                        : isRank3 
                          ? 'border-[1.5px] border-[#c68953]' 
                          : 'border border-white/10'
                  }`}
                />
                <div className="flex flex-col justify-center min-w-0">
                  <span className={`text-[12px] font-bold tracking-wide whitespace-nowrap ${textAccent}`}>
                    {user.name}
                  </span>
                  
                </div>
              </div>

              {/* Guesses column */}
              <span className="text-center text-[12px] font-bold font-mono text-slate-100 select-all">
                {user.guesses}
              </span>

              {/* Accuracy column - Neon green as screenshot */}
              <span className="text-center text-[12px] font-bold font-mono text-[#00e676] select-all">
                {user.accuracy}
              </span>

              {/* Points column - Gold colors for Top 3 */}
              <span className={`text-right pr-2 text-[12.5px] font-bold font-mono select-all ${
                isRank1 
                  ? 'text-[#ffe082]' 
                  : isRank2 
                    ? 'text-slate-200' 
                    : isRank3 
                      ? 'text-[#f1b88e]' 
                      : 'text-slate-300'
              }`}>
                {user.points}
              </span>
            </div>
          );
        })}
      </div>

      {/* 4. Bottom Floating User Banner exact match to design bar with sports aesthetic */}
      <div className="absolute bottom-22 left-4 right-4 bg-[#0c2419ec] backdrop-blur-md border border-[#00e676]/30 px-3.5 py-2.5 rounded-full z-20 flex justify-between items-center text-slate-100 shadow-[0_10px_25px_rgba(0,230,118,0.15)] select-none">
        
        {/* Left spinning green soccer indicator */}
        <div className="flex items-center space-x-2">
          <div className="w-5.5 h-5.5 bg-gradient-to-r from-emerald-500 to-[#00e676] rounded-full flex items-center justify-center shadow-lg animate-[spin_4s_linear_infinite]">
            <span className="text-xs">⚽</span>
          </div>
          <span className="text-[11px] font-bold">
            我的排名 <strong className="text-sm font-black text-[#00e676] font-mono leading-none ml-0.5">15</strong>
          </span>
        </div>

        {/* Separated specs metrics items */}
        <div className="flex items-center space-x-2 text-[10.5px]">
          <span className="h-3.5 w-[1px] bg-slate-700/65"></span>
          <span className="text-slate-300">猜对场次 <strong className="text-[#00e676] font-mono font-extrabold ml-0.5">5</strong></span>
          
          <span className="h-3.5 w-[1px] bg-slate-700/65"></span>
          <span className="text-slate-300">命中率 <strong className="text-[#00e676] font-mono font-extrabold ml-0.5">42%</strong></span>
          
          <span className="h-3.5 w-[1px] bg-slate-700/65"></span>
          <span className="text-slate-300 font-medium">积分 <strong className="text-amber-400 font-mono font-extrabold ml-0.5">5</strong></span>
        </div>

        {/* Action interactive arrow chevron */}
        <span className="text-slate-400 hover:text-white transition-colors text-[10.5px] pr-0.5">
          ❯
        </span>

      </div>

      {/* Rules Modal Overlay with rich glassmorphism details */}
      {showRules && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-40 p-5 flex flex-col justify-center animate-in fade-in duration-200">
          <div className="bg-[#0b1724] border border-white/10 rounded-2xl p-4 shadow-2xl text-xs space-y-3">
            <h4 className="text-sm font-black text-[#00e676] border-b border-white/10 pb-1.5 flex items-center space-x-1.5">
              <span>📜</span>
              <span>排行榜积分挑战规则说明</span>
            </h4>
            <div className="text-slate-300 space-y-2 leading-relaxed font-sans">
              <p>1. <strong>积分来源</strong>：仅计算基础分，猜对一场胜/平/负 +1 分，猜错不加分。</p>
              <p>2. <strong>结算口径</strong>：所有场次均以常规时间结算，即 90 分钟加伤停补时，不包含加时赛及点球大战。</p>
              <p>3. <strong>命中率考核</strong>：每日排行榜以单天内竞猜结束后的正确率（猜对场次 ÷ 总提交次数）为准计算前十强。</p>
              <p>4. <strong>当日与总排行</strong>：【当日排行】于每日 24:00 结束当天考核结算；【总排行】累计活动期间全部基础分。</p>
            </div>
            <button
              onClick={() => setShowRules(false)}
              className="w-full mt-2 py-2 bg-[#00e676] text-slate-950 font-black rounded-lg transition-all active:scale-95 cursor-pointer"
            >
              我知道了
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
