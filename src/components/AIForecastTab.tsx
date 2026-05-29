/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Match } from '../types';
import { Sparkles, Send, RefreshCw, HelpCircle, CheckCircle2 } from 'lucide-react';
import { apiUrl } from '../utils/api';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  sources?: Array<{ title: string; uri: string }>;
}

interface AIForecastTabProps {
  selectedMatch: Match | null;
  selectedMatchRequestKey?: string | null;
  onSelectMatch: (match: Match) => void;
  onBackToSchedule?: () => void;
}

const autoTriggeredRequestKeys = new Set<string>();

export const AIForecastTab: React.FC<AIForecastTabProps> = ({ 
  selectedMatch, 
  selectedMatchRequestKey,
  onSelectMatch,
  onBackToSchedule
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: `您好，我是黄小西，您的世界杯观赛搭子！有什么足球相关的问题都可以咨询我哦~`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Suggested questions pill list
  const suggestedQuestions = [
    { text: '🇧🇷 巴西 VS 🇫🇷 法国焦点战分析 ⚔️', prompt: '请帮我联网深度分析【🇧🇷 巴西 VS 🇫🇷 法国】这场即将开始的分组赛首轮焦点战，推荐双方战术策略和比分结果。' },
    { text: '梅西目前的核心战术定位 🐐', prompt: '请帮我探究梅西当前在国家队战局中的核心技战术作用和最新的跑动热点定位。' },
    { text: '谁最有希望夺得本届大力神杯？  🏆', prompt: '根据最新欧洲盘口、晋级之路以及大语言模型预测，分析2026年世界杯前三热门夺冠球队的战斗力。' },
    { text: '阿根廷首战的核心伤病有新消息吗？  🚑', prompt: '请联网检索并汇报阿根廷国家足球队近期备战的最新严重主力伤病报告和突发生病讯息。' }
  ];

  // Auto trigger predictions when a match is selected and navigated to
  useEffect(() => {
    if (selectedMatch) {
      const triggerKey = selectedMatchRequestKey || selectedMatch.id;
      if (autoTriggeredRequestKeys.has(triggerKey)) return;
      autoTriggeredRequestKeys.add(triggerKey);
      triggerMatchChatPrediction(selectedMatch);
    }
  }, [selectedMatch, selectedMatchRequestKey]);

  // Handle automatic messages scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const triggerMatchChatPrediction = async (match: Match) => {
    const userPromptText = `请帮我联网深度分析焦点战役【${match.homeTeam.flag} ${match.homeTeam.name} VS ${match.awayTeam.flag} ${match.awayTeam.name}】，评估双方近期状态、交手细节并预测可能胜平负比分！`;
    
    // Append User message
    setMessages(prev => [
      ...prev,
      {
        sender: 'user',
        text: userPromptText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    setIsTyping(true);

    try {
      const resp = await fetch(apiUrl('/api/predict'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          stage: match.stage,
          time: match.time
        })
      });
      const data = await resp.json();
      if (data.success) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            text: data.prediction,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: data.sources
          }
        ]);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error(err);
      // Clean fallback offline prediction
      const mockResult = `### 🏆 【AI 智能推荐落盘】 ${match.homeTeam.flag} ${match.homeTeam.name} VS ${match.awayTeam.flag} ${match.awayTeam.name}
> ⚠️ *提示：当前离线状态，战术脑已启动本地语料沙盒进行离线拟合。*

#### 1. 双方近期状态与核心伤停
* **${match.homeTeam.name}**：近期3轮保持全胜，边路套边极其强势。全队体能出色，主打 4-3-3 攻击型阵位。
* **${match.awayTeam.name}**：防守中坚在上一场曾有轻微肌肉不适拉伤，中前场配合默契，但客场打法偏缓慢防守。

#### 2. 大模型综合预测分析与推荐比分
* **胜平负预测概率**：
  * **主队胜**：**45%** | **两队打平**：**35%** | **客队胜**：**20%**
* **推荐比分**：**2-1** 或 **1-1**`;

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: mockResult,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendUserQuestion = async (queryText: string) => {
    if (!queryText.trim()) return;
    const finalQuery = queryText.trim();
    setInputValue('');

    // Append User message
    setMessages(prev => [
      ...prev,
      {
        sender: 'user',
        text: finalQuery,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    setIsTyping(true);

    try {
      const resp = await fetch(apiUrl('/api/predict'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: finalQuery })
      });
      const data = await resp.json();
      if (data.success) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            text: data.prediction,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: data.sources
          }
        ]);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error(err);
      const mockPromptAnswer = `### ⚽ 【双星 AI 离线战术智库】
> ⚠️ *提示：当前未检测到 valid GEMINI_API_KEY。沙盒大脑已从本地战术库中调用数据配合解答。*

您好！关于您咨询的：**"${finalQuery}"**

1. **基本面评估**：当前球队状态正针对淘汰赛紧密调整，后防在传控和长传打法博弈里容易扮演胜负手。
2. **阵型推演**：该话题在足球阵位研究中比较经典，各主教练对于地面压迫或全场攻守平衡都有针对性特训。
3. **模型建议**：配置火山方舟 Bot 环境变量后，即可激活联网实时足球预测。`;

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: mockPromptAnswer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Helper function to parse and display headers/markdown cleanly inside chat bubbles
  const renderAIPredictionMarkdown = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-2.5 font-sans text-xs text-slate-200 leading-relaxed tracking-wide select-text">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // Heading 3
          if (trimmed.startsWith('###')) {
            return (
              <h3 key={idx} className="text-sm font-black text-emerald-400 pt-2 border-b border-white/5 pb-1 flex items-center space-x-1.5 leading-snug">
                <span>⚡</span>
                <span>{trimmed.replace(/###/g, '').trim()}</span>
              </h3>
            );
          }

          // Heading 4
          if (trimmed.startsWith('####')) {
            return (
              <h4 key={idx} className="text-[11.5px] font-bold text-teal-300 pt-1 flex items-center space-x-1.5 leading-snug">
                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full"></span>
                <span>{trimmed.replace(/####/g, '').trim()}</span>
              </h4>
            );
          }

          // Blockquote banner
          if (trimmed.startsWith('>')) {
            return (
              <div key={idx} className="bg-emerald-500/10 border-l-[3px] border-emerald-500 p-2 rounded-r-xl text-[10px] text-emerald-300/90 italic font-medium my-1.5 leading-snug">
                {trimmed.replace(/>/g, '').trim()}
              </div>
            );
          }

          // Bullet points
          if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
            const matchBold = trimmed.match(/\*\*(.*?)\*\*/g);
            let content = trimmed.substring(1).trim();
            if (matchBold) {
              matchBold.forEach((boldText) => {
                const cleaned = boldText.replace(/\*/g, '');
                content = content.replace(boldText, `__BOLD__${cleaned}__BOLD__`);
              });
            }

            const parts = content.split('__BOLD__');

            return (
              <div key={idx} className="flex items-start space-x-1.5 pl-0.5 select-text text-[11px] leading-relaxed">
                <span className="text-emerald-400/90 mt-0.5 shrink-0">⚽</span>
                <span className="text-slate-200">
                  {parts.map((p, pIdx) => (
                    pIdx % 2 === 1 
                      ? <strong key={pIdx} className="text-white font-bold">{p}</strong> 
                      : <span key={pIdx}>{p}</span>
                  ))}
                </span>
              </div>
            );
          }

          // Plain text lines with support for bold formatting
          const matchBold = trimmed.match(/\*\*(.*?)\*\*/g);
          let content = trimmed;
          if (matchBold) {
            matchBold.forEach((boldText) => {
              const cleaned = boldText.replace(/\*/g, '');
              content = content.replace(boldText, `__BOLD__${cleaned}__BOLD__`);
            });
          }
          const parts = content.split('__BOLD__');

          return (
            <p key={idx} className="select-text text-[11px] leading-relaxed">
              {parts.map((p, pIdx) => (
                pIdx % 2 === 1 
                  ? <strong key={pIdx} className="text-white font-extrabold">{p}</strong> 
                  : <span key={pIdx}>{p}</span>
              ))}
            </p>
          );
        })}
      </div>
    );
  };

  const handleOnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendUserQuestion(inputValue);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#050f17] text-white overflow-hidden relative select-none">
      
      {/* 1. Header Title Banner */}
      <div className="relative py-3.5 px-4 bg-[#081521]/60 border-b border-white/5 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-black tracking-wide text-white block">黄小西</span>
            <span className="text-[8px] text-emerald-400 font-mono block uppercase tracking-[1.5px] leading-none mt-0.5">WORLD CUP MATE</span>
          </div>
        </div>
        <span className="text-[9px] bg-[#0d263b] text-slate-400 font-bold border border-white/5 py-0.5 px-2 rounded-md">
          🟢 联网分析
        </span>
      </div>

      {/* 2. Scrollable Messages Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-none pb-48 relative z-0">
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={idx} 
              className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-3xl p-3.5 shadow-md flex flex-col relative ${
                isUser 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 rounded-tr-none text-white' 
                  : 'bg-[#0f2334]/95 border border-[#1b3c58]/35 rounded-tl-none text-slate-200'
              }`}>
                {/* Message Body */}
                <div className="break-words">
                  {isUser ? (
                    <span className="text-xs font-semibold leading-relaxed font-sans">{msg.text}</span>
                  ) : (
                    renderAIPredictionMarkdown(msg.text)
                  )}
                </div>

                {/* Grounding Sources */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3.5 pt-2 border-t border-white/5 flex flex-col space-y-1">
                    <span className="text-[9px] text-[#00e676]/90 font-extrabold uppercase tracking-wider flex items-center space-x-1">
                      <span>🌐</span>
                      <span>网络检索参考源:</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.sources.slice(0, 3).map((src, srcIdx) => (
                        <a
                          key={srcIdx}
                          href={src.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#0b1c2a] border border-white/5 rounded px-2 py-0.5 text-[8px] font-mono text-slate-300 hover:text-white hover:border-[#00e676]/35 transition-all max-w-[120px] truncate block"
                        >
                          🔗 {src.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Timestamp */}
                <span className="text-[8px] text-slate-500 font-mono tracking-tight text-right mt-1.5 self-end block leading-none">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing message simulator */}
        {isTyping && (
          <div className="flex w-full justify-start">
            <div className="bg-[#0f2334]/95 border border-[#1b3c58]/35 rounded-3xl rounded-tl-none p-3.5 shadow-md max-w-[70%] flex flex-col">
              <span className="text-[10px] text-teal-300 font-semibold flex items-center space-x-1 animate-pulse mb-1">
                <RefreshCw className="w-3 h-3 animate-spin text-teal-400" />
                <span>黄小西正在检索最新战报并撰写分析中...</span>
              </span>
              <div className="flex space-x-1.5 mt-2 pl-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Bottom controls (Suggested pills + Input form) positioned completely at bottom stack */}
      <div className="absolute bottom-[68px] inset-x-0 bg-gradient-to-t from-[#050f17] via-[#050f17]/95 to-transparent pt-3 pb-3 px-3.5 z-10 border-t border-white/5 select-none shrink-0">
        
        {/* Suggested questions scrolling horizontal bar */}
        <div className="mb-2">
          <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
            💡 热门足球话题快捷推荐
          </span>
          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-0.5">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendUserQuestion(q.prompt)}
                className="px-2.5 py-1 text-[9.5px] bg-[#0f2334]/80 text-teal-300 border border-[#1b3c58]/35 rounded-full hover:bg-emerald-500/10 hover:text-[#00e676] hover:border-[#00e676]/35 transition-all shrink-0 cursor-pointer"
              >
                {q.text}
              </button>
            ))}
          </div>
        </div>

        {/* Input Text Form */}
        <form 
          onSubmit={handleOnSubmit}
          className="flex items-center space-x-2.5 bg-[#0b1b2a] border border-[#1b3d58] rounded-2xl py-1.5 pl-3.5 pr-1.5 focus-within:border-[#00e676]/50 transition-all shadow-inner"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="向AI咨询任何世界杯战术、赔率预测..."
            className="flex-1 bg-transparent border-none text-[11.5px] text-white focus:outline-hidden placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="w-8 h-8 rounded-xl bg-[#00e676] text-slate-950 flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-[#00e676]/10"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
};
