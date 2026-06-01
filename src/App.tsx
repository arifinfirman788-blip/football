/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, Trophy, Sparkles, ClipboardList } from 'lucide-react';

import { PredictionTab } from './components/PredictionTab';
import { ScheduleTab } from './components/ScheduleTab';
import { GroupsTab } from './components/GroupsTab';
import { AIForecastTab } from './components/AIForecastTab';
import { SplashAd } from './components/SplashAd';
import { ViewingLocationsPage } from './components/ViewingLocationsPage';
import { RewardRulesPage } from './components/RewardRulesPage';

import { Match, PredictionRecord } from './types';

/**
 * 当前前端实际入口说明：
 * - 已接入主流程：PredictionTab、ScheduleTab、GroupsTab、AIForecastTab、SplashAd、
 *   ViewingLocationsPage、RewardRulesPage。
 * - 暂未接入主流程但保留备用：PhoneFrame、ProfileTab、TeamDetail、PlayerProfile、Svgs。
 *   这些文件不会从 App.tsx 渲染，后续恢复对应页面时再重新引入。
 */
export default function App() {
  /**
   * 全局竞猜记录。
   * 当前保存在前端内存中，刷新页面后会清空。正式开发时建议替换为：
   * 1. 登录后从后端读取用户记录；
   * 2. 提交竞猜时调用后端接口；
   * 3. 服务端在赛后写入 points 和 status，前端只负责展示。
   */
  const [predictionHistory, setPredictionHistory] = useState<PredictionRecord[]>([]);

  // AI 预测页的比赛上下文。请求标识用于允许用户重复点击同一场比赛并重新发起分析。
  const [selectedMatchForAI, setSelectedMatchForAI] = useState<Match | null>(null);
  const [selectedMatchForAIRequestKey, setSelectedMatchForAIRequestKey] = useState<string | null>(null);

  // 两个覆盖底导的二级页面：线下观影地点、奖励兑换规则。
  const [isViewingLocationsOpen, setIsViewingLocationsOpen] = useState<boolean>(false);
  const [isRewardRulesOpen, setIsRewardRulesOpen] = useState<boolean>(false);

  // 开屏广告状态：资源加载完成后停留 2.4 秒，再用 0.7 秒淡出。
  const [showSplashAd, setShowSplashAd] = useState<boolean>(true);
  const [isSplashLeaving, setIsSplashLeaving] = useState<boolean>(false);
  const [isSplashReady, setIsSplashReady] = useState<boolean>(false);

  // 一级页面路由。项目未引入 react-router，底导切换由这个状态统一控制。
  const [phoneState, setPhoneState] = useState<{
    activeTab: 'prediction' | 'schedule' | 'groups' | 'ai-forecast';
  }>({
    activeTab: 'prediction',
  });

  // 底导固定为：竞猜、赛程、排行、预测。
  const tabs = [
    { id: 'prediction', label: '竞猜', icon: Trophy },
    { id: 'schedule', label: '赛程', icon: Calendar },
    { id: 'groups', label: '排行', icon: ClipboardList },
    { id: 'ai-forecast', label: '预测', icon: Sparkles }
  ];

  // 从竞猜页或赛程页进入 AI 分析时，将当前比赛一并传给预测页。
  const handleAIPredictionTransition = (match: Match) => {
    setSelectedMatchForAI(match);
    setSelectedMatchForAIRequestKey(`${match.id}-${Date.now()}`);
    setPhoneState(prev => ({
      ...prev,
      activeTab: 'ai-forecast',
    }));
  };

  // 一级页面渲染入口。球队和球员详情页已退出当前产品流程，不再从球队旗帜下钻。
  const renderPhoneContent = () => {
    switch (phoneState.activeTab) {
      case 'prediction':
        return (
          <PredictionTab
            onTeamSelect={() => undefined}
            predictionHistory={predictionHistory}
            setPredictionHistory={setPredictionHistory}
            onAIPredictionClick={handleAIPredictionTransition}
            onViewingLocationsClick={() => setIsViewingLocationsOpen(true)}
            onRewardRulesClick={() => setIsRewardRulesOpen(true)}
          />
        );
      case 'schedule':
        return (
          <ScheduleTab
            onTeamSelect={() => undefined}
            onAIPredictionClick={handleAIPredictionTransition}
          />
        );
      case 'groups':
        return (
          <GroupsTab
            predictionHistory={predictionHistory}
          />
        );
      case 'ai-forecast':
        return (
          <AIForecastTab
            selectedMatch={selectedMatchForAI}
            selectedMatchRequestKey={selectedMatchForAIRequestKey}
            onSelectMatch={(match) => setSelectedMatchForAI(match)}
          />
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <span>数据异常</span>
          </div>
        );
    }
  };

  // 底导固定在 390x844 H5 画布底部，二级覆盖页通过更高 z-index 遮住底导。
  const renderBottomNav = () => {
    return (
      <div className="absolute bottom-0 inset-x-0 h-[68px] pb-4.5 bg-[#081521]/95 text-xs flex justify-around items-center border-t border-white/5 px-2 z-40 select-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = phoneState.activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setPhoneState(prev => ({ ...prev, activeTab: tab.id as any }))}
              className="flex flex-col items-center justify-center w-14 h-full relative group cursor-pointer"
            >
              {isActive ? (
                /* 选中态：绿色高亮 */
                <div className="flex flex-col items-center justify-center text-[#00e676] -translate-y-0.5 transition-all">
                  <div className="p-1 rounded-full bg-[#00e676]/10 border border-[#00e676]/20 shadow-[0_0_12px_rgba(0,230,118,0.15)] mb-0.5">
                    <Icon className="w-4 h-4 text-[#00e676]" />
                  </div>
                  <span className="text-[9.5px] font-bold tracking-wide">{tab.label}</span>
                </div>
              ) : (
                /* 未选中态 */
                <div className="flex flex-col items-center justify-center text-slate-500 hover:text-slate-300 transition-colors">
                  <Icon className="w-4.5 h-4.5 mb-1" />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const closeSplashAd = () => {
    setIsSplashLeaving(true);
    window.setTimeout(() => {
      setShowSplashAd(false);
    }, 700);
  };

  React.useEffect(() => {
    if (!showSplashAd || !isSplashReady) return;

    // 必须等待海报 onLoad 后再计时，避免弱网下海报还没显示就开始淡出。
    const visibleTimer = window.setTimeout(() => {
      setIsSplashLeaving(true);
    }, 2400);
    const removeTimer = window.setTimeout(() => {
      setShowSplashAd(false);
    }, 3100);

    return () => {
      window.clearTimeout(visibleTimer);
      window.clearTimeout(removeTimer);
    };
  }, [showSplashAd, isSplashReady]);

  return (
    <div className="min-h-screen bg-[#030a0f] text-slate-100 flex items-center justify-center font-sans relative overflow-hidden antialiased">
      {/* 页面背景只承托 H5 画布，真实内容不再放进手机框体 */}
      <div className="absolute inset-0 bg-[#030a0f] pointer-events-none z-0"></div>

      {/* 390x844 标准 H5 画布：桌面居中预览，移动端直接贴合屏幕打开 */}
      <main className="h5-app-shell relative z-10 bg-[#050f17] overflow-hidden">
        <div className="h-full flex flex-col overflow-hidden relative">
          {renderPhoneContent()}

          {/* 底导固定在 H5 页面底部 */}
          {renderBottomNav()}

          <ViewingLocationsPage
            isOpen={isViewingLocationsOpen}
            onClose={() => setIsViewingLocationsOpen(false)}
          />

          <RewardRulesPage
            isOpen={isRewardRulesOpen}
            onClose={() => setIsRewardRulesOpen(false)}
          />

          {showSplashAd && (
            <SplashAd
              isLeaving={isSplashLeaving}
              onReady={() => setIsSplashReady(true)}
              onSkip={closeSplashAd}
            />
          )}
        </div>
      </main>
    </div>
  );
}
