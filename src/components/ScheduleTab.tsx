/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { MATCHES_DATA, GROUPS_DATA } from '../data';
import { Match } from '../types';
import { assetUrl } from '../utils/assets';

interface ScheduleTabProps {
  onTeamSelect: (teamId: string) => void;
  onAIPredictionClick: (match: Match) => void;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({ onTeamSelect, onAIPredictionClick }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'group' | 'knockout' | 'follow'>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  /**
   * 我的关注目前是前端演示状态。
   * 正式版建议登录后从后端读取，并在 toggleStar 中调用收藏/取消收藏接口。
   */
  const [starredMatches, setStarredMatches] = useState<string[]>(['m1', 'm3']);

  const toggleStar = (e: React.MouseEvent, matchId: string) => {
    e.stopPropagation();
    setStarredMatches(prev => 
      prev.includes(matchId) ? prev.filter(id => id !== matchId) : [...prev, matchId]
    );
  };

  const getBeijingKickoffLabel = (match: Match) => {
    const dateLabel = match.time.replace(/^北京时间\s*/, '');
    return `${dateLabel} ${match.timestamp}`;
  };

  // “全部赛程 / 小组赛 / 淘汰赛”的一级筛选。
  const filteredMatches = MATCHES_DATA.filter((match) => {
    if (activeCategory === 'group') {
      return match.stage.includes('小组赛');
    }
    if (activeCategory === 'knockout') {
      return !match.stage.includes('小组赛');
    }
    return true;
  });

  // 普通列表按北京时间日期分段展示。
  const daysMap: Record<string, Match[]> = {};
  filteredMatches.forEach((match) => {
    if (!daysMap[match.time]) {
      daysMap[match.time] = [];
    }
    daysMap[match.time].push(match);
  });

  const followMatches = useMemo(
    () => MATCHES_DATA.filter(match => starredMatches.includes(match.id)),
    [starredMatches]
  );

  const groupMatchesMap = useMemo(() => {
    // 小组赛页同时展示小组积分表和本组赛程，预先构造 group -> matches 映射。
    const map: Record<string, Match[]> = {};
    MATCHES_DATA.forEach((match) => {
      if (!match.group) return;
      if (!map[match.group]) {
        map[match.group] = [];
      }
      map[match.group].push(match);
    });
    return map;
  }, []);

  const visibleGroups = useMemo(() => {
    // 顶部筛选只负责切组，不做侧边定位，避免滚动后按钮消失
    return selectedGroupId === 'all'
      ? GROUPS_DATA
      : GROUPS_DATA.filter(group => group.id === selectedGroupId);
  }, [selectedGroupId]);

  return (
    <div className="flex-1 flex flex-col bg-[#050f17] text-white overflow-hidden select-none">
      
      {/* 赛程顶部：体育场灯光背景 + 右侧大力神杯 */}
      <div className="relative h-[194px] shrink-0 overflow-hidden bg-[#06111a]">
        <img
          src={assetUrl('assets/schedule/stadium-header.png')}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-[#071521]/10 to-[#050f17]/85" />
        <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black/45 to-transparent" />

        <h1 className="absolute top-[74px] inset-x-0 text-center text-[26px] font-black tracking-[6px] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
          赛程
        </h1>

        <img
          src={assetUrl('assets/schedule/trophy-cup.png')}
          alt="大力神杯"
          className="absolute right-4 top-[62px] w-[62px] h-[122px] object-contain drop-shadow-[0_8px_18px_rgba(255,190,48,0.28)]"
        />

        {/* 赛程筛选条：参考附件位置叠在头图底部 */}
        <div className="schedule-filter-shell absolute left-3 right-3 bottom-3">
          <div className="flex items-center justify-between h-full">
            <button
              onClick={() => setActiveCategory('all')}
              className={`schedule-filter-button ${
                activeCategory === 'all'
                  ? 'schedule-filter-button--active'
                  : 'schedule-filter-button--idle'
              }`}
            >
              全部赛程
            </button>
            
            <button
              onClick={() => setActiveCategory('group')}
              className={`schedule-filter-button ${
                activeCategory === 'group'
                  ? 'schedule-filter-button--active'
                  : 'schedule-filter-button--idle'
              }`}
            >
              小组赛
            </button>
            
            <button
              onClick={() => setActiveCategory('knockout')}
              className={`schedule-filter-button ${
                activeCategory === 'knockout'
                  ? 'schedule-filter-button--active'
                  : 'schedule-filter-button--idle'
              }`}
            >
              淘汰赛
            </button>

            <div className="schedule-filter-divider"></div>

            <button
              onClick={() => setActiveCategory('follow')}
              className={`schedule-filter-button ${
                activeCategory === 'follow'
                  ? 'schedule-filter-button--active'
                  : 'schedule-filter-button--idle'
              }`}
            >
              我的关注
            </button>
          </div>
        </div>
      </div>

      {/* 内容区：根据筛选展示我的关注、小组赛或按日期分组的赛程列表 */}
      <div className="flex-1 overflow-y-auto px-3.5 pb-28 pt-2 space-y-4 relative z-0">
        {activeCategory === 'follow' ? (
          <div className="space-y-2 pb-12">
            {followMatches.length > 0 ? (
              followMatches.map((match) => (
                <div
                  key={match.id}
                  className="sport-glass-card rounded-2xl p-3.5 flex items-center justify-between border border-white/5 shadow-[0_10px_22px_rgba(0,0,0,0.35)]"
                >
                  <div className="flex flex-col space-y-1 w-16 border-r border-white/5 pr-2 shrink-0">
                    <span className="text-[13px] font-bold font-mono tracking-tight text-white">{match.timestamp}</span>
                    <span className="text-[8px] text-slate-400 font-medium truncate">{match.stage.split('·')[0]}</span>
                    {match.group && (
                      <span className="text-[8.5px] self-start text-[#00e676] bg-[#00e676]/10 font-bold px-1 py-[1.5px] rounded mt-0.5 border border-[#00e676]/20">
                        {match.group}组
                      </span>
                    )}
                  </div>

                  <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center px-2 select-none min-w-0">
                    <div
                      onClick={() => onTeamSelect(match.homeTeam.id)}
                      className="flex flex-col items-center cursor-pointer group min-w-0"
                    >
                      <span className="text-2xl filter drop-shadow">{match.homeTeam.flag}</span>
                      <span className="text-[10px] font-bold mt-1 text-slate-100 truncate w-full text-center">
                        {match.homeTeam.name}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center shrink-0 px-2 min-w-[56px]">
                      <span className="text-slate-400 font-display text-[10px] font-bold uppercase tracking-[1px] whitespace-nowrap">VS</span>
                      <span className="text-[8px] text-slate-500 font-mono mt-0.5 whitespace-nowrap">{match.stage.split('·')[1]}</span>
                    </div>

                    <div
                      onClick={() => onTeamSelect(match.awayTeam.id)}
                      className="flex flex-col items-center cursor-pointer group min-w-0"
                    >
                      <span className="text-2xl filter drop-shadow">{match.awayTeam.flag}</span>
                      <span className="text-[10px] font-bold mt-1 text-slate-100 truncate w-full text-center">
                        {match.awayTeam.name}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => toggleStar(e, match.id)}
                    className="w-8 h-8 shrink-0 flex items-center justify-center text-[#ffd54f] hover:scale-105 transition-transform"
                  >
                    <span className="text-base">{starredMatches.includes(match.id) ? '★' : '☆'}</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="sport-glass-card rounded-2xl p-6 text-center text-slate-400 border border-white/5">
                暂无关注比赛
              </div>
            )}
          </div>
        ) : activeCategory === 'group' ? (
          <div className="relative pb-12">
            <div className="sticky top-2 z-20 mx-1 mb-3">
              <div className="rounded-2xl border border-white/10 bg-[#071521]/92 backdrop-blur-md shadow-[0_10px_24px_rgba(0,0,0,0.35)] px-3 py-2">
                {/* 顶部分组筛选：用两行按钮把 A-L 全部放上来 */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-slate-300 font-bold tracking-wider uppercase">分组筛选</span>
                  <button
                    onClick={() => setSelectedGroupId('all')}
                    className={`h-7 px-3 rounded-full text-[10px] font-bold transition-all ${
                      selectedGroupId === 'all'
                        ? 'bg-gradient-to-b from-[#67d45d] to-[#16802b] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    全部
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {GROUPS_DATA.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroupId(group.id)}
                      className={`h-8 rounded-full text-[11px] font-black transition-all ${
                        selectedGroupId === group.id
                          ? 'bg-gradient-to-b from-[#67d45d] to-[#16802b] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_10px_rgba(18,128,43,0.28)]'
                          : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/8'
                      }`}
                    >
                      {group.id}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {visibleGroups.map((group) => {
                const groupMatches = groupMatchesMap[group.id] || [];

                return (
                  <div
                    key={group.id}
                    className="sport-glass-card rounded-2xl overflow-hidden shadow-[0_10px_22px_rgba(0,0,0,0.36)] border border-white/5"
                  >
                    <div className="px-4 py-2.5 bg-gradient-to-r from-[#173045] to-[#081521] flex items-center justify-between border-b border-white/5">
                      <span className="text-sm font-semibold text-[#00e676] tracking-wide font-display">
                        {group.id} 组
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {groupMatches.length ? `${groupMatches.length} 场赛程` : '暂无赛程'}
                      </span>
                    </div>

                    <div className="divide-y divide-white/5">
                      {group.teams.map((groupTeam) => (
                        <div
                          key={groupTeam.team.id}
                          onClick={() => onTeamSelect(groupTeam.team.id)}
                          className="px-4 py-2.5 flex items-center justify-between hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-xl filter drop-shadow">{groupTeam.team.flag}</span>
                            <span className="text-xs font-bold tracking-wide text-slate-100">
                              {groupTeam.team.name}
                            </span>
                          </div>

                          <div className="flex items-center text-xs text-slate-300 font-mono space-x-6">
                            <span className="w-8 text-center font-bold text-white">{groupTeam.points}</span>
                            <span className={`w-10 text-center font-medium ${
                              groupTeam.goalDiff.startsWith('+')
                                ? 'text-[#00e676]'
                                : groupTeam.goalDiff.startsWith('-')
                                  ? 'text-rose-400'
                                  : 'text-slate-400'
                            }`}>
                              {groupTeam.goalDiff}
                            </span>
                            <div className="w-8 flex justify-center">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10.5px] font-bold ${
                                groupTeam.rank <= 2
                                  ? 'bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/35'
                                  : 'text-slate-500'
                              }`}>
                                {groupTeam.rank}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {groupMatches.length > 0 && (
                      <div className="border-t border-white/5 bg-black/10 px-4 py-3 space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">本组赛程</div>
                        <div className="space-y-2">
                          {groupMatches.map((match) => (
                            <div
                              key={match.id}
                              className="rounded-xl border border-white/5 bg-[#081521]/70 px-3 py-2 flex items-center justify-between"
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="text-[11px] font-bold text-slate-100 truncate">
                                  {match.homeTeam.name} vs {match.awayTeam.name}
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono">
                                  {getBeijingKickoffLabel(match)} · {match.stage}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAIPredictionClick(match);
                                }}
                                className="ml-3 shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold text-[#00e676] border border-[#00e676]/20 bg-[#00e676]/10"
                              >
                                AI分析
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        ) : Object.keys(daysMap).length > 0 ? (
          Object.keys(daysMap).map((dayName) => (
            <div key={dayName} className="space-y-2">
              {/* 日期标题 */}
              <div className="text-[11px] text-slate-400 font-semibold tracking-wide flex items-center justify-between px-1">
                <span>{dayName}</span>
                <span className="text-[9px] font-mono text-slate-500">北京时间</span>
              </div>

              {/* 当天比赛卡片 */}
              <div className="space-y-2">
                {daysMap[dayName].map((match) => {
                  const isStarred = starredMatches.includes(match.id);
                  return (
                    <div
                      key={match.id}
                      className="sport-glass-card rounded-2xl p-3.5 flex items-center justify-between hover:scale-[1.01] active:translate-y-[0.5px] transition-all cursor-pointer relative"
                    >
                      {/* 左侧：时间与比赛阶段 */}
                      <div className="flex flex-col space-y-1 w-14 border-r border-white/5 pr-1.5 shrink-0 select-none">
                        <span className="text-[13px] font-bold font-mono tracking-tight text-white">{match.timestamp}</span>
                        <span className="text-[8px] text-slate-400 font-medium truncate">{match.stage.split('·')[0]}</span>
                        {match.group && (
                          <span className="text-[8.5px] self-start text-[#00e676] bg-[#00e676]/10 font-bold px-1 py-[1.5px] rounded mt-0.5 border border-[#00e676]/20">
                            {match.group}组
                          </span>
                        )}
                      </div>

                      {/* 中部：主客队和比分 */}
                      <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center px-1.5 select-none min-w-0">
                        
                        {/* 主队 */}
                        <div 
                          onClick={(e) => { e.stopPropagation(); onTeamSelect(match.homeTeam.id); }}
                          className="flex flex-col items-center hover:bg-white/5 py-1 px-1 rounded-xl transition-all min-w-0"
                        >
                          <span className="text-2xl filter drop-shadow">{match.homeTeam.flag}</span>
                          <span className="text-[10px] font-bold mt-1 text-slate-100 truncate w-full text-center">
                            {match.homeTeam.name}
                          </span>
                        </div>

                        {/* 比分或 VS */}
                        <div className="flex flex-col items-center justify-center shrink-0 px-2 min-w-[56px]">
                          {match.status === 'unstarted' ? (
                            <span className="text-slate-400 font-display text-[10px] font-bold uppercase tracking-[1px] whitespace-nowrap">VS</span>
                          ) : (
                            <div className="flex items-center justify-center bg-black/30 px-1.5 py-0.5 rounded-md border border-white/10 shrink-0">
                              <span className={`text-[12px] font-extrabold font-mono tracking-tight whitespace-nowrap ${match.status === 'conducting' ? 'text-[#00e676]' : 'text-slate-300'}`}>
                                {match.homeScore} - {match.awayScore}
                              </span>
                            </div>
                          )}
                          <span className="text-[8px] text-slate-500 font-mono mt-0.5 whitespace-nowrap">{match.stage.split('·')[1]}</span>
                        </div>

                        {/* 客队 */}
                        <div 
                          onClick={(e) => { e.stopPropagation(); onTeamSelect(match.awayTeam.id); }}
                          className="flex flex-col items-center hover:bg-white/5 py-1 px-1 rounded-xl transition-all min-w-0"
                        >
                          <span className="text-2xl filter drop-shadow">{match.awayTeam.flag}</span>
                          <span className="text-[10px] font-bold mt-1 text-slate-100 truncate w-full text-center">
                            {match.awayTeam.name}
                          </span>
                        </div>

                      </div>

                      {/* 右侧：关注按钮、比赛状态、AI 预测入口 */}
                      <div className="flex items-center space-x-2 shrink-0">
                        {/* 关注比赛 */}
                        <button 
                          onClick={(e) => toggleStar(e, match.id)}
                          className="p-1 text-slate-400 hover:text-amber-450 transition-colors"
                        >
                          <span className="text-xs">{isStarred ? '★' : '☆'}</span>
                        </button>

                        <div className="flex flex-col items-end space-y-1">
                          {match.status === 'conducting' && (
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-blue-400/40 shadow-sm animate-pulse select-none">
                              进行中
                            </div>
                          )}
                          {match.status === 'unstarted' && (
                            <div className="bg-[#1e2d3b] text-slate-400 text-[8px] font-medium px-1.5 py-0.5 rounded border border-slate-750 select-none">
                              未开始
                            </div>
                          )}
                          {match.status === 'ended' && (
                            <div className="bg-slate-800 text-slate-500 text-[8px] font-medium px-1.5 py-0.5 rounded select-none">
                              已结束
                            </div>
                          )}

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onAIPredictionClick(match);
                            }}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-[#00e676] text-[8.5px] font-bold px-1.5 py-0.5 rounded-md border border-[#00e676]/30 transition-all cursor-pointer flex items-center space-x-0.5"
                          >
                            <span>✨</span>
                            <span>AI预测</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <span>🔍 没有符合该筛选条件的赛事</span>
          </div>
        )}
      </div>

    </div>
  );
};
