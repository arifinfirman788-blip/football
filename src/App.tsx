/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, Trophy, Sparkles, ClipboardList } from 'lucide-react';

import { PredictionTab } from './components/PredictionTab';
import { ScheduleTab } from './components/ScheduleTab';
import { GroupsTab } from './components/GroupsTab';
import { TeamDetail } from './components/TeamDetail';
import { PlayerProfile } from './components/PlayerProfile';
import { AIForecastTab } from './components/AIForecastTab';
import { RewardModal } from './components/RewardModal';

import { Player, Match } from './types';

export default function App() {
  // Prediction database historical log state shared across profile views
  const [predictionHistory, setPredictionHistory] = useState<Array<{
    matchId: string;
    fixture: string;
    choice: string;
    time: string;
    status: string;
  }>>([]);

  // State parameter for match forecast context switching
  const [selectedMatchForAI, setSelectedMatchForAI] = useState<Match | null>(null);
  const [selectedMatchForAIRequestKey, setSelectedMatchForAIRequestKey] = useState<string | null>(null);
  const [isRewardOpen, setIsRewardOpen] = useState<boolean>(false);

  // Single centralized view state for mobile phone simulator (merged as requested by user)
  const [phoneState, setPhoneState] = useState<{
    activeTab: 'prediction' | 'schedule' | 'groups' | 'ai-forecast';
    selectedTeamId: string | null;
    selectedPlayer: Player | null;
  }>({
    activeTab: 'prediction', // Default to Bettings/Predictions tab
    selectedTeamId: null,
    selectedPlayer: null
  });

  // Four customized tab buttons matching the user's specific guidelines:
  // "底导改为竞猜（prediction），赛程（schedule），排行（groups），预测（ai-forecast）"
  const tabs = [
    { id: 'prediction', label: '竞猜', icon: Trophy },
    { id: 'schedule', label: '赛程', icon: Calendar },
    { id: 'groups', label: '排行', icon: ClipboardList },
    { id: 'ai-forecast', label: '预测', icon: Sparkles }
  ];

  // Helper function to transition to AI forecast page with match context!
  const handleAIPredictionTransition = (match: Match) => {
    setSelectedMatchForAI(match);
    setSelectedMatchForAIRequestKey(`${match.id}-${Date.now()}`);
    setPhoneState(prev => ({
      ...prev,
      activeTab: 'ai-forecast',
      selectedTeamId: null,      // Reset detail views to avoid page occlusion
      selectedPlayer: null
    }));
  };

  // Helper method to router/render Phone displays
  const renderPhoneContent = () => {
    // 1. If viewing player detail profiles (such as Neymar Jr.)
    if (phoneState.selectedPlayer) {
      return (
        <PlayerProfile
          player={phoneState.selectedPlayer}
          onBack={() => setPhoneState(prev => ({ ...prev, selectedPlayer: null }))}
        />
      );
    }

    // 2. If viewing team rosters & details (such as Brazil)
    if (phoneState.selectedTeamId) {
      return (
        <TeamDetail
          teamId={phoneState.selectedTeamId}
          onBack={() => setPhoneState(prev => ({ ...prev, selectedTeamId: null }))}
          onPlayerSelect={(player) => setPhoneState(prev => ({ ...prev, selectedPlayer: player }))}
        />
      );
    }

    // 3. Render active tab
    switch (phoneState.activeTab) {
      case 'prediction':
        return (
          <PredictionTab
            onTeamSelect={(teamId) => setPhoneState(prev => ({ ...prev, selectedTeamId: teamId }))}
            setPredictionHistory={setPredictionHistory}
            onAIPredictionClick={handleAIPredictionTransition}
            onRewardClick={() => setIsRewardOpen(true)}
          />
        );
      case 'schedule':
        return (
          <ScheduleTab
            onTeamSelect={(teamId) => setPhoneState(prev => ({ ...prev, selectedTeamId: teamId }))}
            onAIPredictionClick={handleAIPredictionTransition}
          />
        );
      case 'groups':
        return (
          <GroupsTab
            onTeamSelect={(teamId) => setPhoneState(prev => ({ ...prev, selectedTeamId: teamId }))}
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

  // Bottom Navigation Bar custom renderer sitting exactly flush at bottom-0 of phone display
  const renderBottomNav = () => {
    // Hide footer if nested deep inside squad rosters or players charts
    if (phoneState.selectedTeamId || phoneState.selectedPlayer) return null;

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
                /* Glowing bottom selected tab option */
                <div className="flex flex-col items-center justify-center text-[#00e676] -translate-y-0.5 transition-all">
                  <div className="p-1 rounded-full bg-[#00e676]/10 border border-[#00e676]/20 shadow-[0_0_12px_rgba(0,230,118,0.15)] mb-0.5">
                    <Icon className="w-4 h-4 text-[#00e676]" />
                  </div>
                  <span className="text-[9.5px] font-bold tracking-wide">{tab.label}</span>
                </div>
              ) : (
                /* Inactive navigation tab option */
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

  return (
    <div className="min-h-screen bg-[#030a0f] text-slate-100 flex items-center justify-center font-sans relative overflow-hidden antialiased">
      {/* 页面背景只承托 H5 画布，真实内容不再放进手机框体 */}
      <div className="absolute inset-0 bg-[#030a0f] pointer-events-none z-0"></div>

      {/* 390x844 标准 H5 画布：桌面居中预览，移动端直接贴合屏幕打开 */}
      <main className="h5-app-shell relative z-10 bg-[#050f17] overflow-hidden">
        <div className="h-full flex flex-col overflow-hidden relative">
          {renderPhoneContent()}

          {/* 底导固定在 H5 页面底部，详情页按原逻辑自动隐藏 */}
          {renderBottomNav()}

          <RewardModal
            isOpen={isRewardOpen}
            onClose={() => setIsRewardOpen(false)}
            onParticipate={() => setIsRewardOpen(false)}
          />
        </div>
      </main>
    </div>
  );
}
