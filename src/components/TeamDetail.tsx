/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PLAYERS, TEAMS } from '../data';
import { Player } from '../types';
import { TrophySvg } from './Svgs';
import { SquadPlayerResearch, TEAM_RESEARCH_DATA, getFallbackTeamResearch } from '../researchData';
import { STAR_PLAYER_PRIORITY } from '../confirmedSquads';

/**
 * 【当前未在前端使用】
 * 球队详情页已从当前底导主流程中移除。
 * 组件和接口仍保留，后续如恢复“点击球队查看详情/阵容/历史战绩”，可直接重新接入 App.tsx。
 * 依赖数据：researchData.ts、confirmedSquads.ts、data.ts 中的 PLAYERS / BRAZIL_* 旧数据。
 */
const POSITION_ORDER: Record<string, number> = {
  '门将': 0,
  '后卫': 1,
  '边后卫': 1,
  '中卫': 1,
  '中场': 2,
  '后腰': 2,
  '前腰': 2,
  '中前场': 2,
  '前锋': 3,
  '边锋': 3,
  '中锋': 3,
};

interface TeamDetailProps {
  teamId: string;
  onBack: () => void;
  onPlayerSelect: (player: Player) => void;
}

export const TeamDetail: React.FC<TeamDetailProps> = ({ teamId, onBack, onPlayerSelect }) => {
  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'squad' | 'history' | 'stats'>('schedule');
  const team = Object.values(TEAMS).find(t => t.id === teamId);
  const research = TEAM_RESEARCH_DATA[teamId] || getFallbackTeamResearch(teamId, team?.name || '球队', team?.flag || '⚽', team?.rank);
  const sortedSquad = [...research.squad].sort((a, b) => {
    const aPriority = STAR_PLAYER_PRIORITY[a.englishName || a.name] || 0;
    const bPriority = STAR_PLAYER_PRIORITY[b.englishName || b.name] || 0;
    if (aPriority !== bPriority) return bPriority - aPriority;
    const aPosition = POSITION_ORDER[a.position] ?? 99;
    const bPosition = POSITION_ORDER[b.position] ?? 99;
    if (aPosition !== bPosition) return aPosition - bPosition;
    return (a.englishName || a.name).localeCompare(b.englishName || b.name);
  });

  const getGeneratedStats = (position: string) => {
    // 联网球员资料不可用时，按位置生成雷达图兜底值。
    if (position.includes('门将')) return { shooting: 18, passing: 72, dribbling: 42, defense: 92, speed: 58 };
    if (position.includes('边后卫')) return { shooting: 52, passing: 76, dribbling: 72, defense: 82, speed: 84 };
    if (position.includes('中卫') || position.includes('后卫')) return { shooting: 45, passing: 72, dribbling: 60, defense: 86, speed: 74 };
    if (position.includes('后腰')) return { shooting: 64, passing: 84, dribbling: 72, defense: 82, speed: 72 };
    if (position.includes('前腰') || position.includes('中前场')) return { shooting: 78, passing: 88, dribbling: 86, defense: 54, speed: 78 };
    if (position.includes('中场')) return { shooting: 72, passing: 88, dribbling: 80, defense: 70, speed: 76 };
    if (position.includes('边锋')) return { shooting: 82, passing: 76, dribbling: 88, defense: 42, speed: 90 };
    if (position.includes('中锋')) return { shooting: 88, passing: 70, dribbling: 78, defense: 42, speed: 80 };
    return { shooting: 86, passing: 72, dribbling: 82, defense: 38, speed: 84 };
  };

  const getPlayerProfile = (entry: SquadPlayerResearch, index: number, profileStatus: Player['profileStatus'] = 'confirmed'): Player => {
    const existingPlayer = Object.values(PLAYERS).find((player) => {
      const sameTeam = player.teamName === team?.name;
      const sameName = player.name === entry.name || player.englishName === entry.englishName;
      return sameTeam && sameName;
    });
    if (existingPlayer) {
      return {
        ...existingPlayer,
        profileStatus,
        profileDataNote: profileStatus === 'confirmed' ? '本地档案已录入；正在逐步补充更多可核验来源。' : undefined,
      };
    }

    const stats = getGeneratedStats(entry.position);
    const ratingFromStat = (value: number) => Math.max(2, Math.min(5, Math.round(value / 20)));

    return {
      id: `${teamId}-${entry.englishName || entry.name}`.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-'),
      name: entry.name,
      englishName: entry.englishName || entry.name,
      profileStatus,
      profileSummary: profileStatus === 'loading' ? '正在联网检索球员资料。' : undefined,
      profileDataNote: profileStatus === 'pending' ? '球员未确认前不展示推测资料。' : undefined,
      number: entry.number,
      position: entry.position,
      photo: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=500',
      teamName: team?.name || research.englishName,
      flag: team?.flag || '⚽',
      worldRank: team?.rank || research.fifaRank || 0,
      age: 26,
      height: '待补充',
      weight: '待补充',
      club: entry.club || '待补充',
      nationality: team?.name || research.englishName,
      stats,
      starRatings: {
        speed: ratingFromStat(stats.speed),
        shooting: ratingFromStat(stats.shooting),
        passing: ratingFromStat(stats.passing),
        dribbling: ratingFromStat(stats.dribbling),
        defense: ratingFromStat(stats.defense),
      },
      transfers: [],
    };
  };

  const getLocalDetailedPlayerProfile = (entry: SquadPlayerResearch, index: number): Player => {
    const fallback = getPlayerProfile(entry, index, 'confirmed');
    return {
      ...fallback,
      profileSummary: `${entry.name} 当前以本地静态资料展示。页面已保留球队、位置、基础能力和俱乐部信息，适合纯前端演示场景。`,
      profileDataNote: entry.status === '官方'
        ? '当前为前端内置球员档案，无需依赖服务端生成。后续可按需接入真实球员数据库。'
        : '该球员仍处于待确认或预测名单状态，因此仅展示本地基础信息。',
      profileUpdatedAt: research.updatedAt,
      profileSources: research.sources.map((source) => ({
        title: source.title,
        uri: source.url,
      })),
    };
  };

  const handleSquadPlayerClick = (entry: SquadPlayerResearch, index: number) => {
    // 非官方名单不做联网详情，避免为未确认球员生成不可靠档案。
    if (entry.status !== '官方') {
      onPlayerSelect(getPlayerProfile(entry, index, 'pending'));
      return;
    }

    onPlayerSelect(getLocalDetailedPlayerProfile(entry, index));
  };

  return (
    <div className="flex-1 flex flex-col bg-[#050f17] text-white overflow-hidden select-none">
      
      {/* 球队详情头图：体育场视觉背景 */}
      <div className="relative h-44 bg-gradient-to-b from-[#1b341f] via-[#0d2214] to-[#050f17] px-4 pt-10 pb-4 flex flex-col justify-between overflow-hidden">
        {/* 聚光灯叠层 */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-white/10 to-transparent pointer-events-none blur-md"></div>
        
        {/* 顶部导航行 */}
        <div className="absolute top-3 inset-x-4 flex justify-between items-center z-10">
          <button 
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span className="text-xs font-semibold tracking-wider text-slate-300 font-display">国家队详情</span>
          
          <div className="w-8 h-8 flex justify-end">
            <TrophySvg className="w-5 h-5 opacity-80" />
          </div>
        </div>

        {/* 球队基础信息行 */}
        <div className="flex items-end justify-between relative mt-4">
          <div className="flex items-center space-x-3.5">
            {/* 国家队徽章 */}
            <div className="relative w-14 h-14 bg-gradient-to-b from-[#fff200] to-[#128a3a] rounded-xl p-[2px] shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-[#1b5e20] rounded-lg flex items-center justify-center">
                <span className="text-3xl">{team?.flag || '⚽'}</span>
              </div>
            </div>

            <div className="flex flex-col">
              <h2 className="text-2xl font-black font-display tracking-tight leading-none text-white">{team?.name || '球队详情'}</h2>
              <span className="text-[10px] text-[#00e676] tracking-widest font-mono uppercase mt-1">{research.englishName}</span>
              <span className="text-[10px] text-slate-300 mt-1 font-sans">
                {research.fifaRank ? `世界排名 ${research.fifaRank}` : '世界排名待补充'}
              </span>
              {research.coach && (
                <span className="text-[10px] text-slate-300 mt-1 font-sans">
                  主教练 {research.coach}
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xl">🏆</span>
            <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-mono">
              {research.titles ? `${research.titles}X WORLD CHAMP` : 'WORLD CHAMP HISTORY'}
            </span>
          </div>
        </div>
      </div>

      {/* 二级切换标签 */}
      <div className="p-3 bg-[#06111a] border-b border-white/5">
        <div className="flex bg-[#000]/25 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveSubTab('schedule')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg text-center transition-all ${
              activeSubTab === 'schedule'
                ? 'bg-[#1b3d58] text-[#00e676] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            赛程
          </button>
          
          <button
            onClick={() => setActiveSubTab('squad')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg text-center transition-all ${
              activeSubTab === 'squad'
                ? 'bg-[#1b3d58] text-[#00e676] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            阵容
          </button>
          
          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg text-center transition-all ${
              activeSubTab === 'history'
                ? 'bg-[#1b3d58] text-[#00e676] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            历史战绩
          </button>
          
          <button
            onClick={() => setActiveSubTab('stats')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg text-center transition-all ${
              activeSubTab === 'stats'
                ? 'bg-[#1b3d58] text-[#00e676] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            数据
          </button>
        </div>
      </div>

      {/* 二级内容区 */}
      <div className="flex-1 overflow-y-auto px-3.5 pb-6 pt-3 space-y-3">
        {activeSubTab === 'schedule' && (
          <div className="space-y-2">
            <span className="block text-[10px] text-slate-400 font-mono uppercase tracking-wider">近况与赛程</span>
            {research.fixtures.map((match, idx) => (
              <div 
                key={idx}
                className="sport-glass-card rounded-2xl p-3.5 flex items-center justify-between hover:bg-white/5 transition-all"
              >
                {/* 阶段与开赛时间 */}
                <div className="flex flex-col space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold">{match.stage}</span>
                  <span className="text-[9px] text-slate-500 font-mono">{match.time}</span>
                </div>

                {/* 对阵信息 */}
                <div className="flex items-center space-x-3 shrink-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm">{team?.flag || '⚽'}</span>
                    <span className="text-xs font-bold">{team?.name || '球队'}</span>
                  </div>
                  
                  <span className="text-xs font-extrabold font-mono text-[#00e676] bg-black/40 px-2 py-0.5 rounded border border-white/5">
                    {match.result || '待定'}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-200">{match.opponent}</span>
                    <span className="text-sm">{match.opponentFlag}</span>
                  </div>
                </div>

                {/* 状态图标 */}
                <div className="w-8 flex justify-end">
                  <span className="text-[10px] text-slate-400">{match.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSubTab === 'squad' && (
          <div className="space-y-2.5">
            <span className="block text-[10px] text-slate-400 font-mono uppercase tracking-wider">阵容</span>
            <div className="sport-glass-card rounded-xl px-3 py-2 flex items-center justify-between border border-white/5">
              <span className="text-[11px] text-slate-300">主教练</span>
              <span className="text-[11px] font-bold text-[#00e676]">{research.coach || '待官方确认'}</span>
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-slate-500">名单状态</span>
              <span className={`text-[10px] font-bold ${
                research.squadStatus === '官方已公布' ? 'text-[#00e676]' : 'text-amber-400'
              }`}>
                {research.squadStatus}
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-2.5">
              {sortedSquad.map((entry, idx) => {
                const starPriority = STAR_PLAYER_PRIORITY[entry.englishName || entry.name] || 0;
                return (
                <div 
                  key={`${entry.name}-${idx}`}
                  onClick={() => handleSquadPlayerClick(entry, idx)}
                  className={`sport-glass-card rounded-2xl p-3 flex items-center justify-between hover:bg-white/5 transition-all ${
                    starPriority ? 'border border-[#ffd54f]/25 shadow-[0_8px_18px_rgba(255,213,79,0.08)]' : ''
                  } cursor-pointer active:scale-[0.99]`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br from-[#1b3d58] to-[#081521] border flex items-center justify-center shrink-0 ${
                      starPriority ? 'border-[#ffd54f]/55' : 'border-[#1b3d58]'
                    }`}>
                      <span className={`text-[11px] font-black ${starPriority ? 'text-[#ffd54f]' : 'text-[#00e676]'}`}>
                        {entry.position.slice(0, 1)}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-baseline space-x-2 min-w-0">
                        <span className="text-sm font-bold text-white truncate">{entry.name}</span>
                        {starPriority > 0 && (
                          <span className="text-[8px] text-[#5b3600] bg-[#ffd54f] rounded-full px-1.5 py-[1px] font-black shrink-0">
                            球星
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400 truncate">{entry.englishName || ''}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1 flex-wrap">
                        <span className="bg-[#128a3a]/15 text-[#4ced74] text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#1b3d58]">
                          {entry.number ? `${entry.number}号` : '号码待定'}
                        </span>
                        <span className="text-[10px] text-slate-400">{entry.position}</span>
                        <span className="text-[9px] text-[#ffd54f] font-mono">{entry.status || '待确认'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-xs text-slate-400">#{idx + 1}</span>
                    <span className="text-[10px] text-[#00e676]">详情</span>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {activeSubTab === 'history' && (
          <div className="sport-glass-card rounded-2xl p-4 space-y-3.5">
            <span className="text-xs font-bold text-[#00e676]">📜 近三届世界杯战绩</span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {research.summary}
            </p>
            <div className="space-y-2">
              {research.worldCupHistory.map((item) => (
                <div key={item.year} className="grid grid-cols-[56px_1fr_auto] items-center gap-2 py-2 border-b border-white/5 last:border-b-0">
                  <span className="text-[11px] font-bold text-white">{item.year}</span>
                  <span className="text-[11px] text-slate-300">{item.finish}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{item.record || ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'stats' && (
          <div className="sport-glass-card rounded-2xl p-4 space-y-3">
            <span className="text-xs font-bold text-[#ffd54f]">📊 赛会统计得分</span>
            <div className="space-y-2.5 pt-2">
              {research.metrics.map((metric) => (
                <div key={metric.label}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>{metric.label}</span>
                    <span className="font-mono text-[#00e676]">{metric.value}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="bg-[#00e676] h-full rounded-full" style={{ width: `${metric.score}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
