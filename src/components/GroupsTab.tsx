/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ChevronLeft, HelpCircle } from 'lucide-react';
import { assetUrl } from '../utils/assets';
import { PredictionRecord } from '../types';
import {
  fetchMyRankingSummary,
  fetchTotalLeaderboard,
  fetchWeeklyLeaderboard,
  getTodayDateKey,
  MyRankingSummary,
  RankingListUser,
} from '../utils/rankingApi';

type LeaderboardUser = RankingListUser;

interface GroupsTabProps {
  // 用户自己的竞猜记录，用于“我的排行”二级页计算已提交、积分、命中率。
  predictionHistory: PredictionRecord[];
}

const bannerBg = assetUrl('assets/schedule/stadium-header.png');
const bannerTrophy = assetUrl('assets/schedule/trophy-cup.png');

// 前三名奖牌是纯前端绘制，后续如有品牌奖牌切图，可在这里直接替换。
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
      {/* 奖牌飘带 */}
      <svg className="absolute top-[21px] w-6.5 h-4.5 drop-shadow-sm" viewBox="0 0 24 20" fill="none">
        <path d="M5 0L0 18L5.5 14L11 18L5.5 0" fill={c.ribbonL} />
        <path d="M19 0L13.5 18L19 14L24.5 18L19 0" fill={c.ribbonR} />
      </svg>
      {/* 奖牌主体 */}
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

export const GroupsTab: React.FC<GroupsTabProps> = ({ predictionHistory }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'all-time'>('daily');
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showMyRankingDetail, setShowMyRankingDetail] = useState<boolean>(false);
  const [dailyLeaderboard, setDailyLeaderboard] = useState<LeaderboardUser[]>([]);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<LeaderboardUser[]>([]);
  const [myWeeklyRanking, setMyWeeklyRanking] = useState<MyRankingSummary | null>(null);
  const [myTotalRanking, setMyTotalRanking] = useState<MyRankingSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const todayDateKey = getTodayDateKey();

  useEffect(() => {
    let cancelled = false;
    const rawUserId = typeof window === 'undefined' ? null : window.localStorage.getItem('football.user-id');
    const userId = rawUserId ? Number(rawUserId) : null;

    const loadRankings = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const [weeklyList, totalList] = await Promise.all([
          fetchWeeklyLeaderboard(todayDateKey),
          fetchTotalLeaderboard(),
        ]);

        if (cancelled) return;
        setDailyLeaderboard(weeklyList);
        setAllTimeLeaderboard(totalList);

        if (userId && Number.isFinite(userId)) {
          const [weeklyMine, totalMine] = await Promise.all([
            fetchMyRankingSummary(userId, 'weekly', todayDateKey),
            fetchMyRankingSummary(userId, 'total'),
          ]);

          if (cancelled) return;
          setMyWeeklyRanking(weeklyMine);
          setMyTotalRanking(totalMine);
        } else if (!cancelled) {
          setMyWeeklyRanking(null);
          setMyTotalRanking(null);
          setLoadError('未找到当前用户 ID，暂时无法加载“我的排行”。');
        }
      } catch (error) {
        console.error(error);
        if (cancelled) return;
        setDailyLeaderboard([]);
        setAllTimeLeaderboard([]);
        setMyWeeklyRanking(null);
        setMyTotalRanking(null);
        setLoadError(error instanceof Error ? error.message : '排行榜接口加载失败。');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadRankings();

    return () => {
      cancelled = true;
    };
  }, [todayDateKey]);

  const activeLeaderboardList = activeTab === 'daily' ? dailyLeaderboard : allTimeLeaderboard;
  const activeMyRanking = activeTab === 'daily' ? myWeeklyRanking : myTotalRanking;

  // 当前用户统计：points 为 null 代表尚未结算，因此不计入命中率分母。
  const submittedCount = predictionHistory.length;
  const settledRecords = predictionHistory.filter(record => record.points !== null);
  const pendingCount = predictionHistory.filter(record => record.points === null).length;
  const earnedPoints = predictionHistory.reduce((sum, record) => sum + (record.points ?? 0), 0);
  const correctCount = predictionHistory.filter(record => record.points === 1).length;
  const accuracy = settledRecords.length > 0
    ? `${Math.round((correctCount / settledRecords.length) * 100)}%`
    : '待结算';

  if (showMyRankingDetail) {
    // “我的排行”二级页：展示用户每一场竞猜的选择与积分结算明细。
    return (
      <div className="flex-1 flex flex-col bg-[#040c14] text-white overflow-hidden relative select-none font-sans">
        <div className="relative h-[118px] shrink-0 bg-gradient-to-b from-[#102436] to-[#040c14] border-b border-white/5 px-4 pt-5 pb-3">
          <button
            onClick={() => setShowMyRankingDetail(false)}
            className="absolute left-4 top-5 w-9 h-9 rounded-full bg-black/32 border border-white/10 backdrop-blur-md flex items-center justify-center active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div className="h-full flex flex-col items-center justify-center">
            <span className="text-[10px] text-[#00e676] font-bold tracking-[3px] uppercase">My Ranking Detail</span>
            <h2 className="text-xl font-black tracking-[3px] mt-1">竞猜积分明细</h2>
          </div>
        </div>

        <div className="px-4 pt-3 pb-2 grid grid-cols-3 gap-2 shrink-0">
          <div className="rounded-2xl bg-[#071521] border border-white/6 p-3 text-center shadow-[0_8px_18px_rgba(0,0,0,0.3)]">
            <span className="block text-[9px] text-slate-400">已提交</span>
            <strong className="block text-lg text-white font-mono mt-0.5">{submittedCount}</strong>
          </div>
          <div className="rounded-2xl bg-[#071521] border border-[#00e676]/12 p-3 text-center shadow-[0_8px_18px_rgba(0,0,0,0.3)]">
            <span className="block text-[9px] text-slate-400">当前积分</span>
            <strong className="block text-lg text-[#ffd54f] font-mono mt-0.5">{earnedPoints}</strong>
          </div>
          <div className="rounded-2xl bg-[#071521] border border-white/6 p-3 text-center shadow-[0_8px_18px_rgba(0,0,0,0.3)]">
            <span className="block text-[9px] text-slate-400">命中率</span>
            <strong className="block text-sm text-[#00e676] font-mono mt-1">{accuracy}</strong>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-2 pb-28 space-y-2.5">
          <div className="rounded-2xl border border-[#00e676]/14 bg-[#061a11]/70 p-3 text-[10.5px] text-slate-300 leading-relaxed">
            基础分规则：常规时间猜对 +1 分，猜错 +0 分；未开赛或未结算的竞猜先显示为待结算。
          </div>

          {predictionHistory.length > 0 ? (
            predictionHistory.map((record) => (
              <div
                key={record.matchId}
                className="rounded-2xl bg-[#071521]/95 border border-white/[0.08] shadow-[0_8px_18px_rgba(0,0,0,0.32)] p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block text-xs font-black text-white truncate">{record.fixture}</span>
                    <span className="block text-[9px] text-slate-500 font-mono mt-1">
                      {record.dateKey.slice(5).replace('-', '/')} {record.timestamp} · {record.stage}
                    </span>
                  </div>

                  <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${
                    record.outcome === 'draw'
                      ? 'text-[#ffd54f] bg-[#ffd54f]/10 border-[#ffd54f]/20'
                      : 'text-[#00e676] bg-[#00e676]/10 border-[#00e676]/20'
                  }`}>
                    {record.choice}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10.5px]">
                  <span className="text-slate-400">结算状态</span>
                  <div className="flex items-center gap-2">
                    <span className={record.points === null ? 'text-slate-400' : record.points > 0 ? 'text-[#00e676]' : 'text-rose-300'}>
                      {record.status}
                    </span>
                    <strong className="text-[#ffd54f] font-mono">
                      {record.points === null ? '待结算' : `+${record.points} 分`}
                    </strong>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-64 rounded-2xl border border-white/5 bg-[#071521]/80 flex flex-col items-center justify-center text-center px-6">
              <span className="text-3xl mb-3">⚽</span>
              <span className="text-sm font-black text-white">暂无竞猜记录</span>
              <span className="text-[10.5px] text-slate-400 mt-2 leading-relaxed">
                在竞猜页提交当日比赛后，这里会显示每一场选择和后续积分变化。
              </span>
            </div>
          )}

          {pendingCount > 0 && (
            <div className="text-center text-[9.5px] text-slate-500 font-mono pt-1">
              还有 {pendingCount} 场等待赛后按基础分结算
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#040c14] text-white overflow-hidden relative select-none font-sans">
      
      {/* 排行榜顶部：体育场背景、大力神杯和规则入口 */}
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
            周排行
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

      {/* 表头和列表必须使用同一套 grid 列宽，确保字段上下对齐 */}
      <div className="leaderboard-table-header grid grid-cols-[48px_minmax(110px,1fr)_54px_54px_52px] items-center mx-3.5 mt-2 px-3.5 py-2 text-[10px] text-slate-300 font-bold tracking-wider shrink-0 select-none">
        <span className="text-center font-medium">排名</span>
        <span className="pl-1 font-medium">用户</span>
        <span className="text-center font-medium">猜对场次</span>
        <span className="text-center font-medium">命中率</span>
        <span className="text-right font-medium pr-1">积分</span>
      </div>

      {/* 排行榜数据列表 */}
      <div className="flex-1 overflow-y-auto px-3.5 pt-2 pb-44 space-y-2 relative z-0 scrollbar-none">
        {loadError && (
          <div className="rounded-2xl border border-amber-400/15 bg-amber-500/8 px-3 py-2 text-[10px] text-amber-200">
            {loadError}
          </div>
        )}

        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <span className="text-2xl animate-pulse">🏆</span>
            <span>排行榜加载中...</span>
          </div>
        ) : activeLeaderboardList.length > 0 ? activeLeaderboardList.map((user) => {
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
              {/* 排名 */}
              <div className="flex justify-center shrink-0">
                {user.rank <= 3 ? (
                  <CustomMedal rank={user.rank} />
                ) : (
                  <div className="w-6 h-6 text-slate-400 flex items-center justify-center text-xs font-bold select-none font-mono">
                    {user.rank}
                  </div>
                )}
              </div>

              {/* 用户头像与昵称 */}
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

              {/* 猜对场次 */}
              <span className="text-center text-[12px] font-bold font-mono text-slate-100 select-all">
                {user.guesses}
              </span>

              {/* 命中率 */}
              <span className="text-center text-[12px] font-bold font-mono text-[#00e676] select-all">
                {user.accuracy}
              </span>

              {/* 积分 */}
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
        }) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <span>📭</span>
            <span>暂无排行榜数据</span>
          </div>
        )}
      </div>

      {/* 底部“我的排行”入口：点击后进入用户积分明细二级页 */}
      <button
        onClick={() => setShowMyRankingDetail(true)}
        className="absolute bottom-22 left-4 right-4 bg-[#0c2419ec] backdrop-blur-md border border-[#00e676]/30 px-3.5 py-2.5 rounded-full z-20 flex justify-between items-center text-slate-100 shadow-[0_10px_25px_rgba(0,230,118,0.15)] select-none"
      >
        
        {/* 左侧入口名称 */}
        <div className="flex items-center space-x-2">
          <div className="w-5.5 h-5.5 bg-gradient-to-r from-emerald-500 to-[#00e676] rounded-full flex items-center justify-center shadow-lg animate-[spin_4s_linear_infinite]">
            <span className="text-xs">⚽</span>
          </div>
          <span className="text-[11px] font-bold">
            我的排行 <strong className="text-sm font-black text-[#00e676] font-mono leading-none ml-0.5">{activeMyRanking?.rank ?? '-'}</strong>
          </span>
        </div>

        {/* 用户实时统计 */}
        <div className="flex items-center space-x-2 text-[10.5px]">
          <span className="h-3.5 w-[1px] bg-slate-700/65"></span>
          <span className="text-slate-300">提交 <strong className="text-[#00e676] font-mono font-extrabold ml-0.5">{activeMyRanking?.submittedCount ?? submittedCount}</strong></span>
          
          <span className="h-3.5 w-[1px] bg-slate-700/65"></span>
          <span className="text-slate-300">命中率 <strong className="text-[#00e676] font-mono font-extrabold ml-0.5">{activeMyRanking?.accuracy ?? accuracy}</strong></span>
          
          <span className="h-3.5 w-[1px] bg-slate-700/65"></span>
          <span className="text-slate-300 font-medium">积分 <strong className="text-amber-400 font-mono font-extrabold ml-0.5">{activeMyRanking?.points ?? earnedPoints}</strong></span>
        </div>

        {/* 进入二级页箭头 */}
        <span className="text-slate-400 hover:text-white transition-colors text-[10.5px] pr-0.5">
          ❯
        </span>

      </button>

      {/* 排行榜规则弹层 */}
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
              <p>3. <strong>命中率考核</strong>：周排行榜以每周统计周期内竞猜结束后的正确率（猜对场次 ÷ 总提交次数）为准计算排名。</p>
              <p>4. <strong>周排行与总排行</strong>：【周排行】按每周统计周期结算；【总排行】累计活动期间全部基础分。</p>
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
