/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Player } from '../types';
import { TrophySvg } from './Svgs';

/**
 * 【当前未在前端使用】
 * 球员详情页已从当前主流程中移除。现在点击球队/球员不会进入本页。
 * 保留原因：后续如果恢复球员档案，可以继续使用这里的雷达图、转会记录和基础资料布局。
 */
interface PlayerProfileProps {
  player: Player;
  onBack: () => void;
}

type StatKey = 'speed' | 'shooting' | 'passing' | 'dribbling' | 'defense';

const statDisplayOrder: StatKey[] = ['speed', 'shooting', 'passing', 'dribbling', 'defense'];

/**
 * 球员详情页已不在当前主流程中展示。
 * 这里保留“不同位置不同雷达维度文案”，后续恢复球员页时可继续沿用。
 */
const getPositionTraitLabels = (position: string): Record<StatKey, string> => {
  if (position.includes('门将')) {
    return {
      speed: '反应启动',
      shooting: '长传开球',
      passing: '脚下出球',
      dribbling: '禁区控制',
      defense: '扑救门线',
    };
  }

  if (position.includes('边后卫')) {
    return {
      speed: '边路回追',
      shooting: '后插射门',
      passing: '传中质量',
      dribbling: '套边推进',
      defense: '一对一防守',
    };
  }

  if (position.includes('中卫') || position.includes('后卫')) {
    return {
      speed: '回追速度',
      shooting: '定位球威胁',
      passing: '后场出球',
      dribbling: '持球推进',
      defense: '拦截对抗',
    };
  }

  if (position.includes('后腰')) {
    return {
      speed: '覆盖半径',
      shooting: '远射威胁',
      passing: '节奏调度',
      dribbling: '抗压摆脱',
      defense: '拦截扫荡',
    };
  }

  if (position.includes('前腰') || position.includes('中前场')) {
    return {
      speed: '前插启动',
      shooting: '禁区前沿',
      passing: '关键传球',
      dribbling: '狭小摆脱',
      defense: '前场压迫',
    };
  }

  if (position.includes('中场')) {
    return {
      speed: '攻防覆盖',
      shooting: '后排插上',
      passing: '组织分球',
      dribbling: '持球推进',
      defense: '中路保护',
    };
  }

  if (position.includes('边锋')) {
    return {
      speed: '冲刺爆发',
      shooting: '内切终结',
      passing: '传中助攻',
      dribbling: '边路突破',
      defense: '回防压迫',
    };
  }

  if (position.includes('中锋')) {
    return {
      speed: '启动抢点',
      shooting: '禁区终结',
      passing: '背身做球',
      dribbling: '禁区摆脱',
      defense: '前场压迫',
    };
  }

  return {
    speed: '冲刺爆发',
    shooting: '终结射门',
    passing: '策应传球',
    dribbling: '持球突破',
    defense: '前场压迫',
  };
};

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ player, onBack }) => {
  const isPendingProfile = player.profileStatus === 'pending';
  const isLoadingProfile = player.profileStatus === 'loading';
  const traitLabels = getPositionTraitLabels(player.position);

  if (isPendingProfile || isLoadingProfile) {
    return (
      <div className="flex-1 flex flex-col bg-[#050f17] text-white overflow-hidden select-none">
        <div className="relative h-36 bg-gradient-to-b from-[#142a3f] to-[#050f17] px-4 pt-10 pb-4 flex flex-col justify-end">
          <div className="absolute top-3 inset-x-4 flex justify-between items-center z-10">
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs font-semibold tracking-wider text-slate-300">球员属性档案</span>
            <div className="w-8 h-8 flex justify-end">
              <TrophySvg className="w-5 h-5 opacity-80" />
            </div>
          </div>

          <div className="relative z-10">
            <h1 className="text-2xl font-black font-display tracking-tight text-white">{player.name}</h1>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono">
              {player.englishName}
            </span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-5">
          <div className="sport-glass-card rounded-2xl p-6 text-center border border-white/5 w-full">
            <div className="w-12 h-12 rounded-full bg-[#00e676]/10 border border-[#00e676]/25 mx-auto flex items-center justify-center mb-3">
              <span className="text-xl">{isLoadingProfile ? '⏳' : '!'}</span>
            </div>
            <span className="block text-base font-black text-white">
              {isLoadingProfile ? '联网检索中' : '待确认'}
            </span>
            <span className="block text-[11px] leading-relaxed text-slate-400 mt-2">
              {isLoadingProfile
                ? '正在从维基百科、官方资料与公开数据库核验球员档案。'
                : '该球员暂未进入已确认名单，暂不展示能力值、转会记录等推测信息。'}
            </span>
          </div>
        </div>
      </div>
    );
  }
  
  // 雷达图辅助方法。
  const renderRadarChart = () => {
    // 五轴坐标从 12 点方向开始顺时针排列：
    // 0 = 射门，1 = 传球，2 = 盘带，3 = 防守，4 = 速度。
    const statsArray = [
      { name: 'shooting', value: player.stats.shooting, label: traitLabels.shooting },
      { name: 'passing', value: player.stats.passing, label: traitLabels.passing },
      { name: 'dribbling', value: player.stats.dribbling, label: traitLabels.dribbling },
      { name: 'defense', value: player.stats.defense, label: traitLabels.defense },
      { name: 'speed', value: player.stats.speed, label: traitLabels.speed },
    ];
    
    const cx = 80;
    const cy = 65;
    const maxRadius = 45;
    
    // 将角度和值转换为 SVG 坐标。
    const getCoordinates = (value: number, index: number) => {
      const angle = (Math.PI / 2) - (index * 2 * Math.PI) / 5; // 顶部起点，顺时针。
      const factor = value / 100;
      const r = maxRadius * factor;
      const x = cx + r * Math.cos(angle);
      const y = cy - r * Math.sin(angle); // 屏幕坐标 y 轴向下，因此这里取反。
      return { x, y };
    };

    const getAxisCoords = (index: number) => {
      const angle = (Math.PI / 2) - (index * 2 * Math.PI) / 5;
      const x = cx + maxRadius * Math.cos(angle);
      const y = cy - maxRadius * Math.sin(angle);
      return { x, y };
    };

    // 绘制雷达图网格：30、60、100 三档同心五边形。
    const gridLevels = [30, 60, 100];
    const gridPolygons = gridLevels.map(level => {
      const points = Array.from({ length: 5 }, (_, i) => {
        const angle = (Math.PI / 2) - (i * 2 * Math.PI) / 5;
        const r = maxRadius * (level / 100);
        return `${cx + r * Math.cos(angle)},${cy - r * Math.sin(angle)}`;
      }).join(' ');
      return points;
    });

    // 球员能力填充区域。
    const playerPoints = statsArray.map((stat, i) => {
      const coords = getCoordinates(stat.value, i);
      return `${coords.x},${coords.y}`;
    }).join(' ');

    return (
      <svg className="w-40 h-32 select-none" viewBox="0 0 160 130">
        {/* 背景网格五边形 */}
        {gridPolygons.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.8"
          />
        ))}

        {/* 五项能力轴线 */}
        {Array.from({ length: 5 }).map((_, i) => {
          const axisP = getAxisCoords(i);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={axisP.x}
              y2={axisP.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.8"
            />
          );
        })}

        {/* 球员能力绿色渐变区域 */}
        <polygon
          points={playerPoints}
          fill="url(#radar_gradient)"
          stroke="#4ced74"
          strokeWidth="1.5"
          opacity="0.85"
        />

        {/* 顶点高光点 */}
        {statsArray.map((stat, i) => {
          const coords = getCoordinates(stat.value, i);
          return (
            <circle
              key={i}
              cx={coords.x}
              cy={coords.y}
              r="2"
              fill="#ffffff"
              stroke="#00e676"
              strokeWidth="1"
            />
          );
        })}

        {/* 雷达图周围的能力标签 */}
        {statsArray.map((stat, i) => {
          const angle = (Math.PI / 2) - (i * 2 * Math.PI) / 5;
          const labelPadding = 12;
          const labelR = maxRadius + labelPadding;
          const lx = cx + labelR * Math.cos(angle);
          const ly = cy - labelR * Math.sin(angle) + 2;

          let textAnchor: React.SVGProps<SVGTextElement>['textAnchor'] = "middle";
          if (Math.cos(angle) > 0.1) textAnchor = "start";
          if (Math.cos(angle) < -0.1) textAnchor = "end";

          return (
            <g key={i} className="text-[7.5px] font-semibold font-sans">
              <text
                x={lx}
                y={ly - 4}
                textAnchor={textAnchor}
                fill="rgba(255,255,255,0.6)"
              >
                {stat.label}
              </text>
              <text
                x={lx}
                y={ly + 4}
                textAnchor={textAnchor}
                fill="#ffd54f"
                className="font-mono font-bold"
              >
                {stat.value}
              </text>
            </g>
          );
        })}

        <defs>
          <radialGradient id="radar_gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00e676" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#4ced74" stopOpacity="0.45" />
          </radialGradient>
        </defs>
      </svg>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#050f17] text-white overflow-hidden select-none">
      
      {/* 球员详情视觉头图 */}
      <div className="relative h-56 bg-neutral-900 overflow-hidden flex flex-col justify-end px-4 pb-4.5">
        
        {/* 球员动作背景图 */}
        <div className="absolute inset-0 z-0">
          <img 
            src={player.photo} 
            alt={player.name}
            className="w-full h-full object-cover object-top brightness-[0.4]"
          />
          {/* 边缘渐变遮罩，保证文字可读 */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050f17] via-transparent to-black/50"></div>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-[#050f17]"></div>
        </div>

        {/* 顶部返回与状态信息 */}
        <div className="absolute top-3 inset-x-4 flex justify-between items-center z-10">
          <button 
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span className="text-xs font-semibold tracking-wider text-slate-300">球员属性档案</span>
          
          <div className="w-8 h-8 flex justify-end">
            <TrophySvg className="w-5 h-5 opacity-80" />
          </div>
        </div>

        {/* 中部信息区：左侧资料，右侧雷达图 */}
        <div className="w-full grid grid-cols-12 items-end relative z-10 mt-10">
          
          {/* 左侧球员标题信息 */}
          <div className="col-span-6 flex flex-col space-y-1.5 pb-2">
            <h1 className="text-2xl font-black font-display tracking-tight text-white">{player.name}</h1>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono line-clamp-1">{player.englishName}</span>
            
            <div className="flex items-center space-x-1.5 pt-1">
              <span className="bg-[#128a3a] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-[#1b3d58]">
                {player.number ? `${player.number}号` : '号码待定'}
              </span>
              <span className="text-[10px] font-semibold text-slate-300">{player.position}</span>
            </div>

            <div className="flex items-center space-x-1 pt-1 text-[10px]">
              <span>{player.flag}</span>
              <span className="font-semibold">{player.nationality}</span>
              <span className="text-slate-500 font-mono">|</span>
              <span className="text-[#ffd54f] font-mono font-bold">排名 #{player.worldRank}</span>
            </div>
          </div>

          {/* 右侧雷达图 */}
          <div className="col-span-6 flex justify-end">
            {renderRadarChart()}
          </div>

        </div>

      </div>

      {/* 可滚动详细资料 */}
      <div className="flex-1 overflow-y-auto px-3.5 pb-6 space-y-3.5 relative">
        
        {/* 基础资料 */}
        <div className="sport-glass-card rounded-2xl p-4">
          <span className="block text-xs font-bold text-[#00e676] mb-3">📋 基础资料</span>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-black/15 p-2 rounded-xl border border-white/5 flex flex-col">
              <span className="text-[9px] text-slate-400">年龄</span>
              <span className="text-xs font-bold text-white mt-1">{player.age}岁</span>
            </div>
            <div className="bg-black/15 p-2 rounded-xl border border-white/5 flex flex-col">
              <span className="text-[9px] text-slate-400">身高</span>
              <span className="text-xs font-bold text-white mt-1">{player.height}</span>
            </div>
            <div className="bg-black/15 p-2 rounded-xl border border-white/5 flex flex-col">
              <span className="text-[9px] text-slate-400">体重</span>
              <span className="text-xs font-bold text-white mt-1">{player.weight}</span>
            </div>
          </div>

          {/* 俱乐部与名单状态 */}
          <div className="mt-3 grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 shrink-0">俱乐部：</span>
              <span className="text-xs font-bold text-slate-100 truncate">{player.club}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 shrink-0">国籍：</span>
              <span className="text-xs font-bold text-slate-100 flex items-center space-x-1">
                <span>{player.flag}</span>
                <span>{player.nationality}</span>
              </span>
            </div>
          </div>
        </div>

        {player.profileSummary && (
          <div className="sport-glass-card rounded-2xl p-4">
            <span className="block text-xs font-bold text-[#00e676] mb-2">资料摘要</span>
            <p className="text-[11px] text-slate-300 leading-relaxed">{player.profileSummary}</p>
            {player.profileUpdatedAt && (
              <p className="text-[9.5px] text-slate-500 mt-2 font-mono">更新于 {player.profileUpdatedAt}</p>
            )}
            {player.profileDataNote && (
              <p className="text-[10px] text-amber-300/90 leading-relaxed mt-2">{player.profileDataNote}</p>
            )}
          </div>
        )}

        {/* 转会时间线 */}
        <div className="sport-glass-card rounded-2xl p-4">
          <span className="block text-xs font-bold text-[#ffd54f] mb-3">🔄 转会历史</span>
          
          <div className="relative pl-4 border-l border-white/10 space-y-4 ml-1">
            {player.transfers.length > 0 ? player.transfers.map((item, idx) => (
              <div key={idx} className="relative">
                {/* 时间线节点 */}
                <div className="absolute -left-[20.5px] top-1.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900 shadow"></div>
                
                <div className="flex justify-between items-start text-xs">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-100">{item.clubAddress}</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">{item.fee}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#00e676] bg-[#00e676]/10 px-2 py-0.5 rounded border border-[#00e676]/20">
                    {item.date}
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-[11px] text-slate-400 leading-relaxed">
                暂无可核验的完整转会记录。
              </div>
            )}
          </div>
        </div>

        {/* 能力值 */}
        <div className="sport-glass-card rounded-2xl p-4">
          <span className="block text-xs font-bold text-[#00e676] mb-1">⚔️ 专属核心特性</span>
          <span className="block text-[9.5px] text-slate-500 mb-3.5">
            {player.position}专项维度，基于公开资料和位置特征综合评分
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {statDisplayOrder.map((key) => {
              const ratingNum = player.starRatings[key] as number;
              return (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">{traitLabels[key]}</span>
                  
                  {/* 星级评分展示 */}
                  <div className="flex items-center space-x-0.5 text-[#ffd54f]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="text-xs">
                        {i < ratingNum ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {player.profileSources && player.profileSources.length > 0 && (
          <div className="sport-glass-card rounded-2xl p-4">
            <span className="block text-xs font-bold text-[#00e676] mb-3">资料来源</span>
            <div className="space-y-2">
              {player.profileSources.slice(0, 4).map((source, idx) => (
                <a
                  key={`${source.uri}-${idx}`}
                  href={source.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-[10.5px] text-slate-300 hover:text-white truncate border border-white/5 rounded-xl px-3 py-2 bg-black/10"
                >
                  {source.title}
                </a>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
