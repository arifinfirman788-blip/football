/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Trophy, Sparkles, ClipboardList, Wallet, ArrowRight, UserCheck } from 'lucide-react';

import { PhoneFrame } from './components/PhoneFrame';
import { PredictionTab } from './components/PredictionTab';
import { ScheduleTab } from './components/ScheduleTab';
import { GroupsTab } from './components/GroupsTab';
import { TeamDetail } from './components/TeamDetail';
import { PlayerProfile } from './components/PlayerProfile';
import { AIForecastTab } from './components/AIForecastTab';
import { RewardModal } from './components/RewardModal';

import { PLAYERS, MATCHES_DATA, ACTIVE_BET_MATCH } from './data';
import { Player, Match } from './types';

export default function App() {
  // Global virtual currency wallet
  const [coins, setCoins] = useState<number>(2888); // Sandbox start coins balance

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
            coins={coins}
            setCoins={setCoins}
            onTeamSelect={(teamId) => setPhoneState(prev => ({ ...prev, selectedTeamId: teamId }))}
            predictionHistory={predictionHistory}
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
    <div className="min-h-screen bg-[#030a0f] text-slate-100 flex flex-col font-sans relative overflow-x-hidden antialiased">
      
      {/* Turf grass and spotlight backgrounds */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-radial-gradient from-emerald-950/15 via-transparent to-transparent pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-grid-white/[0.006] pointer-events-none z-0"></div>

      {/* Main Single Simulator Viewport Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex items-center justify-center relative z-10">
        
        {/* Centered Mobile Simulator with no gaps bottom-0 bottom-nav */}
        <div className="relative">
          <PhoneFrame phoneId="main" phoneTitle="世界杯交互主界面 (高精仿真屏)">
            <div className="flex-grow flex flex-col overflow-hidden relative">
              {renderPhoneContent()}
              
              {/* iOS style bottom nav seated completely bottom-0 with zero gaps */}
              {renderBottomNav()}

              <RewardModal
                isOpen={isRewardOpen}
                onClose={() => setIsRewardOpen(false)}
                onParticipate={() => setIsRewardOpen(false)}
              />
            </div>
          </PhoneFrame>
        </div>

      </main>

      <footer className="w-full text-center py-6 border-t border-white/5 text-[10px] text-slate-500 font-mono tracking-widest relative z-10">
        CRAFTED VIA PROFESSIONAL DESIGN • FULL-STACK SANDBOXED ENVIRONMENT
      </footer>
    </div>
  );
}
