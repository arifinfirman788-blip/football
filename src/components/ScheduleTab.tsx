/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlagMark } from './FlagMark';
import { Match, PredictionRecord } from '../types';
import { GROUPS_DATA } from '../data';
import { assetUrl } from '../utils/assets';
import { fetchUserPredictionRecords } from '../utils/predictionApi';
import {
  fetchGroupTeams,
  fetchScheduleMatches,
  getScheduleFallbackMatches,
  ScheduleGroupData,
} from '../utils/scheduleApi';

interface ScheduleTabProps {
  onTeamSelect: (teamId: string) => void;
  onAIPredictionClick: (match: Match) => void;
}

const DEFAULT_GROUP_OPTIONS = [
  { id: 'A', numericId: 1, name: 'A组' },
  { id: 'B', numericId: 2, name: 'B组' },
  { id: 'C', numericId: 3, name: 'C组' },
  { id: 'D', numericId: 4, name: 'D组' },
  { id: 'E', numericId: 5, name: 'E组' },
  { id: 'F', numericId: 6, name: 'F组' },
  { id: 'G', numericId: 7, name: 'G组' },
  { id: 'H', numericId: 8, name: 'H组' },
  { id: 'I', numericId: 9, name: 'I组' },
  { id: 'J', numericId: 10, name: 'J组' },
  { id: 'K', numericId: 11, name: 'K组' },
  { id: 'L', numericId: 12, name: 'L组' },
] as const;

const buildStandingsFromMatches = (
  matches: Match[],
  apiGroupDataList: ScheduleGroupData[],
): ScheduleGroupData[] => {
  const apiGroupMap = new Map(apiGroupDataList.map((group) => [group.id, group]));

  return DEFAULT_GROUP_OPTIONS.map((groupOption) => {
    const apiGroup = apiGroupMap.get(groupOption.id);
    const baseStandings = (apiGroup?.standings.length
      ? apiGroup.standings
      : (GROUPS_DATA.find((group) => group.id === groupOption.id)?.teams || []).map((item) => ({
          team: item.team,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDiffValue: 0,
          goalDiff: '0',
          points: 0,
          rank: item.rank,
        })))
      .map((standing) => ({
        ...standing,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiffValue: 0,
        goalDiff: '0',
        points: 0,
        rank: 0,
      }));

    const standingsMap = new Map(
      baseStandings.map((standing) => [standing.team.id, standing])
    );

    matches
      .filter((match) => match.group === groupOption.id && match.status === 'ended')
      .forEach((match) => {
        if (typeof match.homeScore !== 'number' || typeof match.awayScore !== 'number') {
          return;
        }

        const homeStanding = standingsMap.get(match.homeTeam.id);
        const awayStanding = standingsMap.get(match.awayTeam.id);
        if (!homeStanding || !awayStanding) {
          return;
        }

        homeStanding.played += 1;
        awayStanding.played += 1;
        homeStanding.goalsFor += match.homeScore;
        homeStanding.goalsAgainst += match.awayScore;
        awayStanding.goalsFor += match.awayScore;
        awayStanding.goalsAgainst += match.homeScore;

        if (match.homeScore > match.awayScore) {
          homeStanding.wins += 1;
          homeStanding.points += 3;
          awayStanding.losses += 1;
        } else if (match.homeScore < match.awayScore) {
          awayStanding.wins += 1;
          awayStanding.points += 3;
          homeStanding.losses += 1;
        } else {
          homeStanding.draws += 1;
          awayStanding.draws += 1;
          homeStanding.points += 1;
          awayStanding.points += 1;
        }
      });

    const standings = Array.from(standingsMap.values())
      .map((standing) => {
        const goalDiffValue = standing.goalsFor - standing.goalsAgainst;
        return {
          ...standing,
          goalDiffValue,
          goalDiff: goalDiffValue > 0 ? `+${goalDiffValue}` : `${goalDiffValue}`,
        };
      })
      .sort((a, b) => (
        b.points - a.points
        || b.goalDiffValue - a.goalDiffValue
        || b.goalsFor - a.goalsFor
        || a.team.rank - b.team.rank
      ))
      .map((standing, index) => ({
        ...standing,
        rank: index + 1,
      }));

    return {
      id: groupOption.id,
      numericId: groupOption.numericId,
      name: apiGroup?.name || groupOption.name,
      sortNo: apiGroup?.sortNo || groupOption.numericId,
      standings,
    };
  });
};

export const ScheduleTab: React.FC<ScheduleTabProps> = ({ onTeamSelect, onAIPredictionClick }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'group' | 'knockout' | 'mine'>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [matches, setMatches] = useState<Match[]>(() => getScheduleFallbackMatches());
  const [myPredictionRecords, setMyPredictionRecords] = useState<PredictionRecord[]>([]);
  const [groupDataList, setGroupDataList] = useState<ScheduleGroupData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [myPredictionError, setMyPredictionError] = useState<string | null>(null);
  const [isGroupFilterCollapsed, setIsGroupFilterCollapsed] = useState(false);
  const [isCompactGroupPickerOpen, setIsCompactGroupPickerOpen] = useState(false);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);

  const getBeijingKickoffLabel = (match: Match) => {
    const dateLabel = match.time.replace(/^北京时间\s*/, '');
    return `${dateLabel} ${match.timestamp}`;
  };

  const getPredictionMatchStatusLabel = (status: PredictionRecord['matchStatus']) => {
    if (status === 'conducting') return '进行中';
    if (status === 'ended') return '已结束';
    return '未开始';
  };

  useEffect(() => {
    let cancelled = false;
    const rawUserId = typeof window === 'undefined' ? null : window.localStorage.getItem('football.user-id');
    const userId = rawUserId ? Number(rawUserId) : null;

    const loadMatches = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const nextMatches = await fetchScheduleMatches();
        if (cancelled) return;
        setMatches(nextMatches);

        const nextGroupResults = await Promise.allSettled(
          DEFAULT_GROUP_OPTIONS.map((group) => fetchGroupTeams(group.numericId))
        );
        if (cancelled) return;

        const nextGroupDataList = nextGroupResults
          .filter((result): result is PromiseFulfilledResult<ScheduleGroupData> => result.status === 'fulfilled')
          .map((result) => result.value)
          .sort((a, b) => a.sortNo - b.sortNo || a.id.localeCompare(b.id));

        setGroupDataList(nextGroupDataList);

        if (userId && Number.isFinite(userId)) {
          setMyPredictionError(null);
          const myRecords = await fetchUserPredictionRecords(userId);
          if (cancelled) return;
          setMyPredictionRecords(myRecords);
        } else if (!cancelled) {
          setMyPredictionRecords([]);
          setMyPredictionError('未找到当前用户 ID，暂时无法加载“我的竞猜”。');
        }
      } catch (error) {
        console.error(error);
        if (cancelled) return;
        setMatches(getScheduleFallbackMatches());
        setGroupDataList([]);
        setMyPredictionRecords([]);
        setLoadError(error instanceof Error ? `${error.message}，已展示默认赛程数据。` : '赛程接口加载失败，已展示默认赛程数据。');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadMatches();

    return () => {
      cancelled = true;
    };
  }, []);

  // “全部赛程 / 小组赛 / 淘汰赛”的一级筛选。
  const filteredMatches = matches.filter((match) => {
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

  const groupMatchesMap = useMemo(() => {
    const map: Record<string, Match[]> = {};
    matches.forEach((match) => {
      if (!match.group) return;
      if (!map[match.group]) {
        map[match.group] = [];
      }
      map[match.group].push(match);
    });
    return map;
  }, [matches]);

  const allGroupIds = useMemo(
    () => DEFAULT_GROUP_OPTIONS.map((group) => group.id),
    []
  );

  const visibleGroupIds = useMemo(() => (
    selectedGroupId === 'all' ? allGroupIds : allGroupIds.filter((groupId) => groupId === selectedGroupId)
  ), [allGroupIds, selectedGroupId]);

  const selectedGroupLabel = selectedGroupId === 'all' ? '全部' : `${selectedGroupId}组`;

  const computedGroupDataList = useMemo(
    () => buildStandingsFromMatches(matches, groupDataList),
    [groupDataList, matches]
  );

  const groupStandingsMap = useMemo(
    () => Object.fromEntries(computedGroupDataList.map((group) => [group.id, group.standings])),
    [computedGroupDataList]
  );

  useEffect(() => {
    if (activeCategory !== 'group') {
      setIsGroupFilterCollapsed(false);
      setIsCompactGroupPickerOpen(false);
      return;
    }

    const scrollContainer = contentScrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const shouldCollapse = scrollContainer.scrollTop > 28;
      setIsGroupFilterCollapsed((prev) => (prev === shouldCollapse ? prev : shouldCollapse));
      if (!shouldCollapse) {
        setIsCompactGroupPickerOpen(false);
      }
    };

    handleScroll();
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [activeCategory]);

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    setIsCompactGroupPickerOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#050f17] text-white overflow-hidden overflow-x-hidden select-none">
      
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
              onClick={() => setActiveCategory('mine')}
              className={`schedule-filter-button ${
                activeCategory === 'mine'
                  ? 'schedule-filter-button--active'
                  : 'schedule-filter-button--idle'
              }`}
            >
              我的竞猜
            </button>
          </div>
        </div>
      </div>

      {/* 内容区：根据筛选展示我的关注、小组赛或按日期分组的赛程列表 */}
      <div
        ref={contentScrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-3.5 pb-28 pt-2 space-y-4 relative z-0"
      >
        {loadError && (
          <div className="mx-1 rounded-2xl border border-amber-400/15 bg-amber-500/8 px-3 py-2 text-[10px] text-amber-200">
            {loadError}
          </div>
        )}

        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <span className="text-2xl animate-pulse">⚽</span>
            <span>赛程加载中...</span>
          </div>
        ) : activeCategory === 'mine' ? (
          <div className="space-y-2 pb-12">
            {myPredictionError && (
              <div className="rounded-2xl border border-amber-400/15 bg-amber-500/8 px-3 py-2 text-[10px] text-amber-200">
                {myPredictionError}
              </div>
            )}
            {myPredictionRecords.length > 0 ? (
              myPredictionRecords.map((record) => (
                <div
                  key={record.matchId}
                  className="sport-glass-card rounded-2xl p-3.5 border border-white/5 shadow-[0_10px_22px_rgba(0,0,0,0.35)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-slate-100 truncate">
                        {record.fixture}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-300">
                        <FlagMark
                          flag={record.homeTeamFlag}
                          alt={record.homeTeamName}
                          className="shrink-0"
                          imageClassName="h-4 w-4 rounded-full object-cover"
                        />
                        <span className="truncate">{record.homeTeamName}</span>
                        <span className="text-slate-500">vs</span>
                        <FlagMark
                          flag={record.awayTeamFlag}
                          alt={record.awayTeamName}
                          className="shrink-0"
                          imageClassName="h-4 w-4 rounded-full object-cover"
                        />
                        <span className="truncate">{record.awayTeamName}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono mt-1">
                        {record.dateKey.slice(5).replace('-', '/')} {record.timestamp} · {record.stage}
                      </div>
                    </div>
                    <span className={`shrink-0 text-[8.5px] font-bold px-2 py-0.5 rounded-full border ${
                      record.matchStatus === 'conducting'
                        ? 'text-[#00e676] bg-[#00e676]/10 border-[#00e676]/20'
                        : record.matchStatus === 'ended'
                          ? 'text-slate-300 bg-slate-700/30 border-slate-600/30'
                          : 'text-slate-400 bg-[#1e2d3b] border-slate-700/30'
                    }`}>
                      {getPredictionMatchStatusLabel(record.matchStatus)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-black/18 border border-white/5 px-3 py-2">
                      <div className="text-[8.5px] text-slate-500 font-medium">竞猜结果</div>
                      <div className="text-[10px] text-[#00e676] font-bold mt-1">{record.choice}</div>
                    </div>
                    <div className="rounded-xl bg-black/18 border border-white/5 px-3 py-2">
                      <div className="text-[8.5px] text-slate-500 font-medium">真实结果</div>
                      <div className="text-[10px] text-white font-bold mt-1">{record.actualResult || '待开奖'}</div>
                    </div>
                    <div className="rounded-xl bg-black/18 border border-white/5 px-3 py-2">
                      <div className="text-[8.5px] text-slate-500 font-medium">比赛比分</div>
                      <div className="text-[10px] text-white font-bold mt-1">{record.score || '--'}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[9px] text-slate-500 font-mono">
                      {record.points === null ? '待结算' : `积分 +${record.points}`}
                    </span>
                    <span className={`text-[9px] font-bold rounded-full border px-2 py-0.5 ${
                      record.status === '猜对 +1'
                        ? 'text-[#00e676] bg-[#00e676]/10 border-[#00e676]/20'
                        : record.status === '猜错 +0'
                          ? 'text-[#ff8a80] bg-[#ff8a80]/10 border-[#ff8a80]/20'
                          : 'text-[#ffd54f] bg-[#ffd54f]/10 border-[#ffd54f]/20'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="sport-glass-card rounded-2xl p-6 text-center text-slate-400 border border-white/5">
                暂无我的竞猜记录
              </div>
            )}
          </div>
        ) : activeCategory === 'group' ? (
          <div className="relative pb-12">
            <div
              className={`sticky top-2 z-20 mx-1 mb-3 transition-all duration-300 ease-out ${
                isGroupFilterCollapsed
                  ? 'pointer-events-none -translate-y-3 opacity-0'
                  : 'translate-y-0 opacity-100'
              }`}
            >
                <div className="rounded-2xl border border-white/10 bg-[#071521]/92 backdrop-blur-md shadow-[0_10px_24px_rgba(0,0,0,0.35)] px-3 py-2">
                {/* 顶部分组筛选：用两行按钮把 A-L 全部放上来 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-300 font-bold tracking-wider uppercase">分组筛选</span>
                    <button
                      onClick={() => handleGroupSelect('all')}
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
                    {allGroupIds.map((groupId) => (
                      <button
                        key={groupId}
                        onClick={() => handleGroupSelect(groupId)}
                        className={`h-8 rounded-full text-[11px] font-black transition-all ${
                          selectedGroupId === groupId
                            ? 'bg-gradient-to-b from-[#67d45d] to-[#16802b] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_10px_rgba(18,128,43,0.28)]'
                            : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/8'
                        }`}
                      >
                        {groupId}
                      </button>
                    ))}
                  </div>
                </div>
            </div>

            <div
              className={`sticky top-2 z-30 ml-auto mb-3 flex w-fit justify-end transition-all duration-300 ease-out ${
                isGroupFilterCollapsed
                  ? 'translate-y-0 opacity-100'
                  : 'pointer-events-none -translate-y-2 opacity-0'
              }`}
            >
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCompactGroupPickerOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#071521]/95 px-3 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur-md active:scale-[0.98] transition-all"
                  >
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-[8px] font-bold uppercase tracking-[1.5px] text-slate-400">分组</span>
                      <span className="mt-1 text-[12px] font-black text-white">{selectedGroupLabel}</span>
                    </div>
                    <span className={`text-[10px] text-[#00e676] transition-transform ${isCompactGroupPickerOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {isCompactGroupPickerOpen && (
                    <div className="absolute right-0 top-[calc(100%+8px)] w-[212px] rounded-2xl border border-white/10 bg-[#071521]/97 p-3 shadow-[0_14px_28px_rgba(0,0,0,0.38)] backdrop-blur-md">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase tracking-[1.5px] text-slate-400">切换分组</span>
                        <button
                          type="button"
                          onClick={() => handleGroupSelect('all')}
                          className={`rounded-full px-2.5 py-1 text-[9px] font-bold transition-all ${
                            selectedGroupId === 'all'
                              ? 'bg-gradient-to-b from-[#67d45d] to-[#16802b] text-white'
                              : 'bg-white/[0.04] text-slate-300'
                          }`}
                        >
                          全部
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {allGroupIds.map((groupId) => (
                          <button
                            key={groupId}
                            type="button"
                            onClick={() => handleGroupSelect(groupId)}
                            className={`h-8 rounded-full text-[10px] font-black transition-all ${
                              selectedGroupId === groupId
                                ? 'bg-gradient-to-b from-[#67d45d] to-[#16802b] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]'
                                : 'bg-white/[0.04] text-slate-300'
                            }`}
                          >
                            {groupId}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            <div className="space-y-4">
              {visibleGroupIds.map((groupId) => {
                const groupMatches = groupMatchesMap[groupId] || [];
                const groupStandings = groupStandingsMap[groupId] || [];
                const groupMeta = computedGroupDataList.find((group) => group.id === groupId)
                  || DEFAULT_GROUP_OPTIONS.find((group) => group.id === groupId);

                return (
                  <div
                    key={groupId}
                    className="sport-glass-card rounded-2xl overflow-hidden shadow-[0_10px_22px_rgba(0,0,0,0.36)] border border-white/5"
                  >
                    <div className="px-4 py-2.5 bg-gradient-to-r from-[#173045] to-[#081521] flex items-center justify-between border-b border-white/5">
                      <span className="text-sm font-semibold text-[#00e676] tracking-wide font-display">
                        {groupMeta?.name || `${groupId}组`}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {groupStandings.length ? `${groupStandings.length} 支球队` : '暂无球队'}
                      </span>
                    </div>

                    <div className="px-4 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wide border-b border-white/5 flex items-center justify-between bg-black/10">
                      <span>球队</span>
                      <div className="flex items-center font-mono space-x-3">
                        <span className="w-7 text-center">场</span>
                        <span className="w-10 text-center">胜平负</span>
                        <span className="w-8 text-center">净胜</span>
                        <span className="w-7 text-center">分</span>
                        <span className="w-5 text-center">排</span>
                      </div>
                    </div>

                    <div className="divide-y divide-white/5">
                      {groupStandings.map((standing) => (
                        <div
                          key={standing.team.id}
                          onClick={() => onTeamSelect(standing.team.id)}
                          className="px-4 py-2.5 flex items-center justify-between hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <FlagMark
                              flag={standing.team.flag}
                              alt={standing.team.name}
                              className="shrink-0"
                              imageClassName="h-6 w-6 rounded-full object-cover shadow"
                              emojiClassName="text-xl filter drop-shadow"
                            />
                            <span className="text-xs font-bold tracking-wide text-slate-100">
                              {standing.team.name}
                            </span>
                          </div>

                          <div className="flex items-center text-[10px] text-slate-300 font-mono space-x-3">
                            <span className="w-7 text-center">{standing.played}</span>
                            <span className="w-10 text-center">{standing.wins}/{standing.draws}/{standing.losses}</span>
                            <span className={`w-8 text-center ${standing.goalDiffValue > 0 ? 'text-[#00e676]' : standing.goalDiffValue < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                              {standing.goalDiff}
                            </span>
                            <span className="w-7 text-center font-bold text-white">{standing.points}</span>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10.5px] font-bold ${
                              standing.rank <= 2
                                ? 'bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/35'
                                : 'text-slate-500'
                            }`}>
                              {standing.rank}
                            </span>
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
                          <FlagMark
                            flag={match.homeTeam.flag}
                            alt={match.homeTeam.name}
                            className="shrink-0"
                            imageClassName="h-8 w-8 rounded-full object-cover shadow"
                            emojiClassName="text-2xl filter drop-shadow"
                          />
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
                          <FlagMark
                            flag={match.awayTeam.flag}
                            alt={match.awayTeam.name}
                            className="shrink-0"
                            imageClassName="h-8 w-8 rounded-full object-cover shadow"
                            emojiClassName="text-2xl filter drop-shadow"
                          />
                          <span className="text-[10px] font-bold mt-1 text-slate-100 truncate w-full text-center">
                            {match.awayTeam.name}
                          </span>
                        </div>

                      </div>

                      {/* 右侧：关注按钮、比赛状态、AI 预测入口 */}
                      <div className="flex items-center space-x-2 shrink-0">
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
