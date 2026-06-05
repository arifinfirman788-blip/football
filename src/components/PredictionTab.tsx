/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Match, PredictionRecord, WechatUserProfile } from '../types';
import { assetUrl } from '../utils/assets';
import { Gift } from 'lucide-react';
import { getCachedWechatUser, requestWechatUserProfile } from '../utils/wechatBridge';
import {
  fetchUserPredictionRecords,
  getStoredUserId,
  resolveFirstPredictableDate,
  submitPrediction,
  upsertUserProfile,
} from '../utils/predictionApi';

interface PredictionTabProps {
  // 当前版本不再进入球队详情页，保留回调是为了后续需要恢复下钻时改动更小。
  onTeamSelect: (teamId: string) => void;
  // 竞猜记录由 App 统一持有，保证用户切换底导后记录仍然存在。
  predictionHistory: PredictionRecord[];
  setPredictionHistory: React.Dispatch<React.SetStateAction<PredictionRecord[]>>;
  onAIPredictionClick: (match: Match) => void;
  onViewingLocationsClick: () => void;
  onRewardRulesClick: () => void;
}

export const PredictionTab: React.FC<PredictionTabProps> = ({ 
  onTeamSelect,
  predictionHistory,
  setPredictionHistory,
  onAIPredictionClick,
  onViewingLocationsClick,
  onRewardRulesClick
}) => {
  const [now, setNow] = useState(() => new Date());
  const [predictableMatches, setPredictableMatches] = useState<Match[]>([]);
  const [matchCanPredictMap, setMatchCanPredictMap] = useState<Record<string, boolean>>({});
  const [displayDateKey, setDisplayDateKey] = useState<string>('');
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(() => getStoredUserId());

  const getDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMatchDate = (match: Match) => new Date(match.kickoffUtc || `${match.dateKey}T${match.timestamp}:00+08:00`);

  // 尚未提交的临时选择。提交后以 predictionHistory 为唯一可信记录。
  const [predictions, setPredictions] = useState<Record<string, 'home' | 'draw' | 'away' | null>>({});

  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [isSubmittingPrediction, setIsSubmittingPrediction] = useState<boolean>(false);
  const [wechatUser, setWechatUser] = useState<WechatUserProfile | null>(() => getCachedWechatUser());

  const submittedPredictions = useMemo(() => (
    predictionHistory.reduce((acc, record) => {
      acc[record.matchId] = record.outcome;
      return acc;
    }, {} as Record<string, 'home' | 'draw' | 'away'>)
  ), [predictionHistory]);

  const todayPredictionRecords = useMemo(() => (
    predictionHistory
      .filter(record => record.dateKey === displayDateKey)
      .sort((a, b) => `${a.dateKey} ${a.timestamp}`.localeCompare(`${b.dateKey} ${b.timestamp}`))
  ), [displayDateKey, predictionHistory]);

  const refreshPredictionPage = async (resolvedUserId: number, resolvedWechatUser: WechatUserProfile) => {
    const [{ date, matches, canPredictMap }, predictionRecords] = await Promise.all([
      resolveFirstPredictableDate(resolvedUserId, new Date()),
      fetchUserPredictionRecords(resolvedUserId, resolvedWechatUser),
    ]);

    setDisplayDateKey(date);
    setPredictableMatches(matches);
    setMatchCanPredictMap(canPredictMap);
    setPredictionHistory(predictionRecords);
    setPredictions(
      matches.reduce<Record<string, 'home' | 'draw' | 'away' | null>>((acc, match) => {
        acc[match.id] = match.userChoice || null;
        return acc;
      }, {})
    );
    setCurrentMatch((prev) => matches.find((match) => match.id === prev?.id) || matches[0] || null);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const poster = new Image();
    poster.src = assetUrl('assets/rewards/reward-poster-mobile.jpg');
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPredictionPage = async () => {
      try {
        setIsPageLoading(true);
        setPageError(null);

        const resolvedWechatUser = await requestWechatUserProfile();
        if (cancelled) return;
        setWechatUser(resolvedWechatUser);

        const resolvedUserId = await upsertUserProfile(resolvedWechatUser);
        if (cancelled) return;
        setUserId(resolvedUserId);

        await refreshPredictionPage(resolvedUserId, resolvedWechatUser);
      } catch (error) {
        console.error(error);
        if (cancelled) return;
        setPredictableMatches([]);
        setCurrentMatch(null);
        setPredictionHistory([]);
        setPageError(error instanceof Error ? error.message : '竞猜页接口加载失败。');
      } finally {
        if (!cancelled) {
          setIsPageLoading(false);
        }
      }
    };

    loadPredictionPage();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (currentMatch && !predictableMatches.some(match => match.id === currentMatch.id)) {
      setCurrentMatch(predictableMatches[0] || null);
    }
  }, [predictableMatches, currentMatch]);

  const getMatchTimeLabel = (match: Match) => {
    const date = match.dateKey.slice(5).replace('-', '/');
    return `${date} ${match.timestamp}`;
  };

  const formatMatchCountdown = (match: Match) => {
    const diff = getMatchDate(match).getTime() - now.getTime();
    if (diff <= 0) return '即将开始';
    const oneDay = 24 * 60 * 60 * 1000;
    if (diff > oneDay) {
      return `${match.dateKey.slice(5).replace('-', '月')}日`;
    }
    const totalSeconds = Math.floor(diff / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const dailySubmissionLimit = predictableMatches.length;
  const remainingSubmissions = predictableMatches.filter(match => !submittedPredictions[match.id]).length;

  const handleOutcomeClick = (outcome: 'home' | 'draw' | 'away') => {
    if (!currentMatch) return;
    // 已提交后锁定，不允许用户在前端直接改选；正式版还需由后端再次校验。
    if (submittedPredictions[currentMatch.id] || matchCanPredictMap[currentMatch.id] === false) return;
    setPredictions(prev => ({
      ...prev,
      [currentMatch.id]: outcome
    }));
  };

  const handleSubmitPrediction = async () => {
    if (!currentMatch || !userId) return;
    const selectedOutcome = predictions[currentMatch.id];
    if (!selectedOutcome || isSubmittingPrediction) return;
    if (remainingSubmissions <= 0) {
      alert('今日提交机会已用完！');
      return;
    }

    setIsSubmittingPrediction(true);

    let resolvedWechatUser: WechatUserProfile;
    try {
      resolvedWechatUser = await requestWechatUserProfile();
      setWechatUser(resolvedWechatUser);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : '当前无法获取微信用户信息，请稍后重试。';
      alert(message);
      setIsSubmittingPrediction(false);
      return;
    }

    try {
      const resolvedUserId = await upsertUserProfile(resolvedWechatUser);
      setUserId(resolvedUserId);
      await submitPrediction(resolvedUserId, currentMatch.id, selectedOutcome);
      await refreshPredictionPage(resolvedUserId, resolvedWechatUser);
      setShowSuccessToast(true);
      window.setTimeout(() => {
        setShowSuccessToast(false);
      }, 2800);
    } catch (error) {
      const message = error instanceof Error ? error.message : '提交竞猜失败，请稍后重试。';
      alert(message);
    } finally {
      setIsSubmittingPrediction(false);
    }
  };

  // 已提交选择优先于临时选择，用于回显和禁用按钮。
  const currentOutcome = currentMatch
    ? submittedPredictions[currentMatch.id] || predictions[currentMatch.id] || null
    : null;
  const isCurrentMatchSubmitted = currentMatch ? !!submittedPredictions[currentMatch.id] : false;
  const canCurrentMatchPredict = currentMatch ? matchCanPredictMap[currentMatch.id] !== false : false;

  const choiceMap = {
    home: currentMatch ? `主胜 (${currentMatch.homeTeam.name}胜)` : '主胜',
    draw: '平局 (双方打平)',
    away: currentMatch ? `客胜 (${currentMatch.awayTeam.name}胜)` : '客胜',
  };

  const getRecordChoiceClass = (outcome: 'home' | 'draw' | 'away') => (
    outcome === 'draw'
      ? 'text-[#ffd54f] bg-[#ffd54f]/10 border-[#ffd54f]/20'
      : 'text-[#00e676] bg-[#00e676]/10 border-[#00e676]/20'
  );

  const isTodayCompleted = dailySubmissionLimit > 0 && remainingSubmissions === 0;

  if (isPageLoading) {
    return (
      <div className="prediction-green-bg flex-1 flex flex-col items-center justify-center text-slate-300 space-y-3">
        <span className="text-3xl animate-pulse">⚽</span>
        <span className="text-sm font-bold">竞猜页加载中...</span>
      </div>
    );
  }

  if (!currentMatch) {
    return (
      <div className="prediction-green-bg flex-1 flex flex-col items-center justify-center text-slate-300 px-6 text-center space-y-3">
        <span className="text-3xl">📭</span>
        <span className="text-sm font-bold">{pageError || '当前暂无可竞猜比赛'}</span>
      </div>
    );
  }

  return (
    <div className="prediction-green-bg flex-1 flex flex-col text-white overflow-hidden relative">

      {/* 主内容滚动区：预留底导高度，避免内容被底部导航遮挡 */}
      <div className="flex-1 overflow-y-auto pb-36 relative z-0">
        {pageError && (
          <div className="mx-4 mt-3 rounded-2xl border border-amber-400/15 bg-amber-500/8 px-3 py-2 text-[10px] text-amber-200">
            {pageError}
          </div>
        )}
        
        {/* 竞猜头图：等比例放大切图，保证左右贴紧手机屏幕边缘 */}
        <div className="guess-hero relative w-full aspect-[390/323] overflow-hidden">
          <div
            className="guess-hero__image absolute -inset-[3px] bg-no-repeat"
            style={{
              backgroundImage: `url('${assetUrl('assets/header/guess-hero-full.png')}')`,
              backgroundPosition: 'center -12px',
              backgroundSize: '118% auto',
              transform: 'scale(1.02)',
              transformOrigin: 'center top'
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-2 bg-[#00160c] pointer-events-none z-10" />
          {/* 奖励兑换入口：原用户头像位置改为规则页二级入口 */}
          <button
            onClick={onRewardRulesClick}
            className="absolute top-4 left-4 flex items-center space-x-2.5 z-20 select-none bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#ffd54f]/25 shadow-[0_6px_16px_rgba(0,0,0,0.28)] active:scale-95 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#ffe082] to-[#c47b07] border border-[#fff3bf]/70 shadow-[0_0_10px_rgba(255,213,79,0.26)] flex items-center justify-center">
              <Gift className="w-4.5 h-4.5 text-[#3b2400]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10.5px] font-bold text-white font-sans">奖励兑换</span>
              <span className="text-[8px] font-black text-[#ffd54f]/95 font-mono flex items-center space-x-0.5 leading-none">
                <span>积分规则</span>
              </span>
            </div>
          </button>

        </div>

        {/* 线下观影地点入口：替换原竞猜公告/奖励入口 */}
        <div className="px-4 pt-3.5 select-none">
          <button
            onClick={onViewingLocationsClick}
            className="w-full max-w-[326px] mx-auto bg-gradient-to-r from-[#00e676]/12 via-[#102436]/88 to-[#ffd54f]/10 border border-[#00e676]/30 rounded-xl pl-10 pr-3 py-2.5 flex items-center justify-between gap-3 hover:bg-[#00e676]/15 hover:border-[#00e676]/55 transition-all cursor-pointer shadow-md group relative overflow-hidden"
          >
            {/* 高光扫光装饰 */}
            <div className="absolute inset-0 w-[50%] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 translate-x-[-150%] group-hover:translate-x-[250%] transition-transform duration-1000 ease-out"></div>
            <span className="absolute -left-1 top-1.5 -rotate-45 bg-[#00a86b] text-white text-[8px] font-black px-2.5 py-0.5 rounded-md border border-white/30 shadow leading-none">
              LIVE
            </span>

            <span className="relative z-10 text-white text-[11.5px] font-bold leading-none truncate min-w-0">
              线下观影地点查看，一起为喜欢的球队呐喊
            </span>

            <span className="relative z-10 text-[#ffd54f] text-[11px] font-black shrink-0">查看地点</span>
          </button>
        </div>

        {/* 当前竞猜日比赛选择器：每场比赛独立保留选择和提交状态 */}
        <div className="px-4 pt-3.5 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">
              ⚽ {displayDateKey.slice(5).replace('-', '月')}日竞猜比赛 ({predictableMatches.length}场)
            </span>
          </div>

          <div className="flex items-center space-x-2.5 overflow-x-auto scrollbar-none py-1 select-none">
            {predictableMatches.map((m) => {
              const isSelected = m.id === currentMatch.id;
              const hasPredicted = !!submittedPredictions[m.id];
              return (
                <button
                  key={m.id}
                  onClick={() => setCurrentMatch(m)}
                  className={`px-3.5 py-2.5 rounded-2xl shrink-0 transition-all border flex flex-col items-center min-w-[125px] cursor-pointer ${
                    isSelected 
                      ? 'bg-gradient-to-b from-[#112436] to-[#05101b] border-[#00e676]/65 shadow-md shadow-emerald-500/5 scale-[1.01]' 
                      : 'bg-[#0b1724]/90 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-[8px] font-mono tracking-wider text-slate-400">
                    {m.stage.split('·')[0]} {m.group && `• ${m.group}组`}
                  </span>
                  <div className="flex items-center space-x-1 mt-1 font-bold text-xs">
                    <span>{m.homeTeam.flag}</span>
                    <span className="text-white text-[11px] max-w-[45px] truncate">{m.homeTeam.name}</span>
                    <span className="text-slate-500 text-[9px] font-mono">v</span>
                    <span>{m.awayTeam.flag}</span>
                    <span className="text-white text-[11px] max-w-[45px] truncate">{m.awayTeam.name}</span>
                  </div>
                  
                  {/* 比赛状态指示 */}
                  {hasPredicted ? (
                    <span className="text-[8.5px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-md border border-emerald-500/20 mt-1.5">
                      ✓ 已预测 ({submittedPredictions[m.id] === 'home' ? '主胜' : submittedPredictions[m.id] === 'draw' ? '平' : '客胜'})
                    </span>
                  ) : (
                    <span className="text-[8.5px] font-mono text-amber-500 font-bold tracking-tight mt-1.5">
                      ⏳ {getMatchTimeLabel(m)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 当前比赛主操作区 */}
        <div className="px-4 mt-1.5 relative">
          <div className="sport-glass-card rounded-2xl p-4 flex flex-col items-center bg-[#071320] border border-white/5 relative">
            
            {/* 比赛状态和开赛倒计时 */}
            <div className="w-full flex flex-col space-y-2 mb-4">
              <div className="flex justify-between items-center w-full">
                <span className="bg-[#00e676]/15 text-[#00e676] text-[9.5px] font-extrabold px-2.5 py-0.5 rounded border border-[#00e676]/30 flex items-center space-x-1 shrink-0">
                  <span className="w-1.5 h-1.5 bg-[#00e676] rounded-full animate-pulse"></span>
                  <span className="whitespace-nowrap">
                    {isCurrentMatchSubmitted ? '已提交竞猜' : canCurrentMatchPredict ? '火热竞猜中' : '竞猜已截止'}
                  </span>
                </span>
                
                <div
                  className="relative shrink-0 w-[104px] h-[30px] flex items-center justify-center bg-no-repeat bg-center bg-contain"
                  style={{ backgroundImage: `url('${assetUrl('assets/prediction/countdown-frame.png')}')` }}
                >
                  <div className="flex items-center justify-between w-full px-3">
                    <span className="font-mono font-bold text-[9px] text-[#6d4b00] tracking-wide whitespace-nowrap">
                      {formatMatchCountdown(currentMatch)}
                    </span>
                    <span className="text-[#6d4b00] text-[14px] leading-none">⏱</span>
                  </div>
                </div>
              </div>
              
              <div className="w-full text-center bg-white/5 py-1 rounded-lg border border-white/5">
                <span className="text-[10.5px] font-bold text-slate-300 block tracking-wider uppercase whitespace-nowrap">
                  {currentMatch.stage} {currentMatch.group && `• ${currentMatch.group}组`}
                </span>
              </div>
            </div>

            {/* 主客队信息 */}
            <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center my-1 select-none min-w-0">
              
              {/* 主队 */}
              <div 
                onClick={() => onTeamSelect(currentMatch.homeTeam.id)}
                className="flex flex-col items-center cursor-pointer group min-w-0"
              >
                <div className="relative p-1 bg-white/5 group-hover:bg-white/10 rounded-full transition-all duration-300 border border-white/10 shadow-lg group-hover:scale-105 active:scale-95">
                  <span className="text-4xl filter drop-shadow">
                    {currentMatch.homeTeam.flag}
                  </span>
                </div>
                <span className="text-xs font-black mt-2 text-white group-hover:text-[#ffd54f] truncate w-full text-center px-1">
                  {currentMatch.homeTeam.name}
                </span>
                <span className="text-[9.5px] text-slate-400 mt-0.5 font-mono whitespace-nowrap">世界排名 {currentMatch.homeTeam.rank}</span>
              </div>

              {/* VS 与开赛时间 */}
              <div className="flex flex-col items-center justify-center shrink-0 px-3 min-w-[70px]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-b from-[#112437] to-[#040e15] border border-[#1b3d58] flex items-center justify-center shadow-inner">
                  <span className="text-xs font-display font-black text-slate-400 tracking-wider">VS</span>
                </div>
                {/* 开赛时间 */}
                <span className="text-[9px] font-mono bg-black/40 text-slate-300 px-2.5 py-0.5 rounded-full border border-white/5 mt-3 whitespace-nowrap">
                  {currentMatch.timestamp}
                </span>
              </div>

              {/* 客队 */}
              <div 
                onClick={() => onTeamSelect(currentMatch.awayTeam.id)}
                className="flex flex-col items-center cursor-pointer group min-w-0"
              >
                <div className="relative p-1 bg-white/5 group-hover:bg-white/10 rounded-full transition-all duration-300 border border-white/10 shadow-lg group-hover:scale-105 active:scale-95">
                  <span className="text-4xl filter drop-shadow">
                    {currentMatch.awayTeam.flag}
                  </span>
                </div>
                <span className="text-xs font-black mt-2 text-white group-hover:text-[#ffd54f] truncate w-full text-center px-1">
                  {currentMatch.awayTeam.name}
                </span>
                <span className="text-[9.5px] text-slate-400 mt-0.5 font-mono whitespace-nowrap">世界排名 {currentMatch.awayTeam.rank}</span>
              </div>
            </div>

            {/* 进入 AI 预测页，并携带当前比赛上下文 */}
            <div className="w-full flex flex-col items-center my-2.5 space-y-2">
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#1b3d58] to-transparent"></div>
              <button
                onClick={() => onAIPredictionClick(currentMatch)}
                className="px-4 py-1.5 bg-[#00e676]/10 hover:bg-[#00e676]/25 border border-[#00e676]/35 text-[#00e676] rounded-full text-[10.5px] font-bold tracking-wide flex items-center space-x-1.5 transition-all hover:scale-105 cursor-pointer shadow shadow-[#00e676]/5 group"
              >
                <span>✨</span>
                <span>呼叫黄小西帮您分析本场</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#1b3d58] to-transparent"></div>
            </div>

            {/* 胜平负选择：主胜/客胜用绿色，平局用黄色 */}
            <div className="w-full flex flex-col space-y-2 pt-1">
              <span className="text-[10px] font-bold text-slate-400 self-center tracking-wide uppercase">主客队胜负竞猜</span>
              
              <div className="grid grid-cols-3 gap-2">
                {/* 主胜 */}
                <button
                  onClick={() => handleOutcomeClick('home')}
                  disabled={isCurrentMatchSubmitted || !canCurrentMatchPredict}
                  className={`relative py-3.5 rounded-xl flex flex-col items-center justify-center transition-all border cursor-pointer ${
                    currentOutcome === 'home'
                      ? 'bg-gradient-to-b from-emerald-600 to-emerald-800 border-emerald-400 text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] scale-[1.02]'
                      : 'bg-[#0b1723]/90 border-slate-700/50 hover:bg-[#112335]/90 text-slate-200'
                  } ${isCurrentMatchSubmitted || !canCurrentMatchPredict ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
                >
                  <span className="text-xs font-extrabold font-sans">主胜</span>
                  <span className="text-[9px] mt-0.5 opacity-85 font-mono">{currentMatch.homeTeam.name}胜</span>
                  {currentOutcome === 'home' && (
                    <div className="absolute right-1 top-1 w-2 h-2 bg-[#00e676] rounded-full border border-white"></div>
                  )}
                </button>

                {/* 平局 */}
                <button
                  onClick={() => handleOutcomeClick('draw')}
                  disabled={isCurrentMatchSubmitted || !canCurrentMatchPredict}
                  className={`relative py-3.5 rounded-xl flex flex-col items-center justify-center transition-all border cursor-pointer ${
                    currentOutcome === 'draw'
                      ? 'bg-gradient-to-b from-[#dfab13] to-[#b47a05] border-yellow-400 text-white shadow-[0_4px_12px_rgba(245,158,11,0.25)] scale-[1.02]'
                      : 'bg-[#0b1723]/90 border-slate-700/50 hover:bg-[#112335]/90 text-slate-200'
                  } ${isCurrentMatchSubmitted || !canCurrentMatchPredict ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
                >
                  <span className="text-xs font-extrabold font-sans">平局</span>
                  <span className="text-[9px] mt-0.5 opacity-85 font-mono">两队打平</span>
                  {currentOutcome === 'draw' && (
                    <div className="absolute right-1 top-1 w-2 h-2 bg-[#dfab13] rounded-full border border-white"></div>
                  )}
                </button>

                {/* 客胜 */}
                <button
                  onClick={() => handleOutcomeClick('away')}
                  disabled={isCurrentMatchSubmitted || !canCurrentMatchPredict}
                  className={`relative py-3.5 rounded-xl flex flex-col items-center justify-center transition-all border cursor-pointer ${
                    currentOutcome === 'away'
                      ? 'bg-gradient-to-b from-emerald-600 to-emerald-800 border-emerald-400 text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] scale-[1.02]'
                      : 'bg-[#0b1723]/90 border-slate-700/50 hover:bg-[#112335]/90 text-slate-200'
                  } ${isCurrentMatchSubmitted || !canCurrentMatchPredict ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
                >
                  <span className="text-xs font-extrabold font-sans">客胜</span>
                  <span className="text-[9px] mt-0.5 opacity-85 font-mono">{currentMatch.awayTeam.name}胜</span>
                  {currentOutcome === 'away' && (
                    <div className="absolute right-1 top-1 w-2 h-2 bg-[#00e676] rounded-full border border-white"></div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 提交竞猜：提交后锁定，并在下方展示“我的今日竞猜” */}
        <div className="px-4 mt-4">
          <button
            onClick={handleSubmitPrediction}
            disabled={!currentOutcome || isCurrentMatchSubmitted || !canCurrentMatchPredict || remainingSubmissions <= 0 || isSubmittingPrediction}
            className="w-full max-w-[318px] mx-auto h-[76px] bg-no-repeat bg-center bg-contain flex items-center justify-center text-[#5d3300] font-display font-black text-[16px] tracking-[3px] cursor-pointer hover:brightness-105 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundImage: `url('${assetUrl('assets/prediction/submit-frame-wide.png')}')` }}
          >
            <span className="translate-y-[1px] drop-shadow-[0_1px_0_rgba(255,244,184,0.55)]">
              {isCurrentMatchSubmitted
                ? '已 提 交 成 功'
                : !canCurrentMatchPredict
                  ? '本 场 已 截 止 竞 猜'
                : isSubmittingPrediction
                  ? '获 取 微 信 身 份 中'
                  : '确 定 提 交 竞 猜'}
            </span>
          </button>
          
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1.5 px-1.5">
            <span>⚽ 当日竞猜资格：{dailySubmissionLimit}场</span>
            <span>剩余可用：{remainingSubmissions} 次</span>
          </div>

          {wechatUser && (
            <div className="mt-2.5 rounded-2xl border border-[#00e676]/12 bg-[#061a11]/70 px-3 py-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={wechatUser.avatarUrl}
                  alt={wechatUser.nickname}
                  className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                />
                <div className="min-w-0">
                  <span className="block text-[10.5px] text-white font-bold truncate">
                    {wechatUser.nickname}
                  </span>
                  <span className="block text-[9px] text-slate-500 font-mono truncate">
                    unionId: {`${wechatUser.unionId.slice(0, 6)}...${wechatUser.unionId.slice(-4)}`}
                  </span>
                </div>
              </div>
              <span className="text-[9px] text-[#00e676] font-bold shrink-0">
                已绑定微信身份
              </span>
            </div>
          )}
        </div>

        {todayPredictionRecords.length > 0 && (
          <div className="px-4 mt-3.5">
            <div className="sport-glass-card rounded-2xl border border-[#00e676]/15 bg-[#061a11]/80 p-3.5 shadow-[0_10px_22px_rgba(0,0,0,0.32)]">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white tracking-wide">我的今日竞猜</span>
                  <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                    已提交 {todayPredictionRecords.length}/{dailySubmissionLimit} 场
                  </span>
                </div>
                <span className={`text-[9.5px] font-bold px-2 py-1 rounded-full border ${
                  isTodayCompleted
                    ? 'text-[#00e676] bg-[#00e676]/10 border-[#00e676]/25'
                    : 'text-[#ffd54f] bg-[#ffd54f]/10 border-[#ffd54f]/20'
                }`}>
                  {isTodayCompleted ? '今日已完成' : '继续完成'}
                </span>
              </div>

              <div className="space-y-2">
                {todayPredictionRecords.map((record) => (
                  <div
                    key={record.matchId}
                    className="rounded-xl bg-black/18 border border-white/5 px-3 py-2 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="block text-[11px] font-bold text-slate-100 truncate">
                        {record.fixture}
                      </span>
                      <span className="block text-[9px] text-slate-500 font-mono mt-0.5">
                        {record.dateKey.slice(5).replace('-', '/')} {record.timestamp} · {record.stage}
                      </span>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-1">
                      <span className={`text-[9.5px] font-bold rounded-full border px-2 py-0.5 ${getRecordChoiceClass(record.outcome)}`}>
                        {record.choice}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {record.points === null ? '待结算' : `+${record.points}分`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 提交成功提示 */}
      {showSuccessToast && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#061421]/95 border-2 border-[#00e676] rounded-2xl p-6 text-center shadow-[0_12px_30px_rgba(0,0,0,0.85)] flex flex-col items-center w-64 select-none">
          <div className="w-11 h-11 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-2.5 animate-bounce text-xl">
            ⚽
          </div>
          <span className="text-xs font-black text-white tracking-wide uppercase">预测记录已锁定！</span>
          <span className="text-[10.5px] text-slate-300 mt-1.5 leading-relaxed">
            成功推荐 <strong>{choiceMap[submittedPredictions[currentMatch.id] || 'draw']}</strong>
          </span>
          <span className="text-xs font-bold text-[#ffd54f] mt-1.5">赛后按基础分结算</span>
          <span className="text-[9.5px] text-slate-400 mt-1 leading-relaxed">
            常规时间猜对 +1 分，猜错 +0 分
          </span>
        </div>
      )}

    </div>
  );
};
