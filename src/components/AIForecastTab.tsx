/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Match } from '../types';
import { Sparkles, Send } from 'lucide-react';
import { ArkConversationMessage, LocalAiSource, streamArkPrediction } from '../utils/localAi';
import { storage } from '../utils/storage';
import { TEAMS } from '../data';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  sources?: LocalAiSource[];
}

interface AIForecastTabProps {
  selectedMatch: Match | null;
  selectedMatchRequestKey?: string | null;
  onSelectMatch: (match: Match) => void;
  onBackToSchedule?: () => void;
}

/**
 * 已自动触发过的 requestKey。
 * 组件切换后仍保留在模块级 Set 中，避免 React 重渲染导致同一场比赛重复发送两次问题。
 */
const autoTriggeredRequestKeys = new Set<string>();
const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const chatSessionStorageKey = 'football.ai-forecast.messages';
const teamFlagByName = new Map(Object.values(TEAMS).map((team) => [team.name, team.flag]));
const createGreetingMessage = (): ChatMessage => ({
  id: createMessageId(),
  sender: 'ai',
  text: '您好，我是黄小西，您的世界杯观赛搭子！有什么足球相关的问题都可以咨询我哦~',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
});

const toArkConversationMessages = (chatMessages: ChatMessage[]): ArkConversationMessage[] => {
  let hasUserMessage = false;

  return chatMessages.reduce<ArkConversationMessage[]>((conversation, message) => {
    const content = message.text.trim();
    if (!content) return conversation;

    if (message.sender === 'user') {
      hasUserMessage = true;
      conversation.push({ role: 'user', content });
      return conversation;
    }

    if (!hasUserMessage) {
      return conversation;
    }

    conversation.push({ role: 'assistant', content });
    return conversation;
  }, []);
};

const getMatchFlagText = (teamName: string, flag: string) => {
  if (flag && !/^https?:\/\//i.test(flag)) {
    return flag;
  }
  return teamFlagByName.get(teamName) || '🏳️';
};

export const AIForecastTab: React.FC<AIForecastTabProps> = ({ 
  selectedMatch, 
  selectedMatchRequestKey,
  onSelectMatch,
  onBackToSchedule
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => (
    storage.getSessionJson<ChatMessage[]>(chatSessionStorageKey, [createGreetingMessage()])
  ));

  const [inputValue, setInputValue] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [showCopyToast, setShowCopyToast] = useState<boolean>(false);
  const [showBusyToast, setShowBusyToast] = useState<boolean>(false);
  const activeStreamAbortRef = useRef<AbortController | null>(null);
  const copyToastTimerRef = useRef<number | null>(null);
  const busyToastTimerRef = useRef<number | null>(null);
  const isStreamingRef = useRef<boolean>(false);
  const autoTriggerBusyRef = useRef<boolean>(false);
  const typewriterStateRef = useRef<{
    messageId: string | null;
    queue: string;
    frameId: number | null;
  }>({
    messageId: null,
    queue: '',
    frameId: null,
  });

  // 预测页快捷问题。运营需要调整推荐问法时，修改这里即可。
  const suggestedQuestions = [
    { text: '🇧🇷 巴西 VS 🇫🇷 法国焦点战分析 ⚔️', prompt: '请帮我联网深度分析【🇧🇷 巴西 VS 🇫🇷 法国】这场即将开始的分组赛首轮焦点战，推荐双方战术策略和比分结果。' },
    { text: '梅西目前的核心战术定位 🐐', prompt: '请帮我探究梅西当前在国家队战局中的核心技战术作用和最新的跑动热点定位。' },
    { text: '谁最有希望夺得本届大力神杯？  🏆', prompt: '根据最新欧洲盘口、晋级之路以及大语言模型预测，分析2026年世界杯前三热门夺冠球队的战斗力。' },
    { text: '阿根廷首战的核心伤病有新消息吗？  🚑', prompt: '请联网检索并汇报阿根廷国家足球队近期备战的最新严重主力伤病报告和突发生病讯息。' }
  ];

  // 从竞猜页或赛程页带比赛进入时，自动发起一次联网分析。
  useEffect(() => {
    if (isStreaming) return;
    if (selectedMatch) {
      const triggerKey = selectedMatchRequestKey || selectedMatch.id;
      if (autoTriggeredRequestKeys.has(triggerKey)) return;
      if (autoTriggerBusyRef.current || isStreamingRef.current || activeStreamAbortRef.current) return;

      // 开发环境 StrictMode 会先执行一次“试挂载再卸载”。
      // 延迟到当前页面真正稳定挂载后再发请求，避免第一轮假挂载把 SSE 先发出去又立刻 abort。
      autoTriggerBusyRef.current = true;
      const timerId = window.setTimeout(() => {
        if (autoTriggeredRequestKeys.has(triggerKey)) {
          autoTriggerBusyRef.current = false;
          return;
        }
        autoTriggeredRequestKeys.add(triggerKey);
        void triggerMatchChatPrediction(selectedMatch, { silentWhenBusy: true });
      }, 0);

      return () => {
        window.clearTimeout(timerId);
        if (!autoTriggeredRequestKeys.has(triggerKey)) {
          autoTriggerBusyRef.current = false;
        }
      };
    }
  }, [selectedMatch, selectedMatchRequestKey, isStreaming]);

  useEffect(() => {
    storage.setSessionJson(chatSessionStorageKey, messages);
  }, [messages]);

  useEffect(() => () => {
    activeStreamAbortRef.current?.abort();
    if (typewriterStateRef.current.frameId !== null) {
      window.cancelAnimationFrame(typewriterStateRef.current.frameId);
    }
    if (copyToastTimerRef.current !== null) {
      window.clearTimeout(copyToastTimerRef.current);
    }
    if (busyToastTimerRef.current !== null) {
      window.clearTimeout(busyToastTimerRef.current);
    }
  }, []);

  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  const upsertAiMessage = (messageId: string, updater: (message: ChatMessage) => ChatMessage) => {
    setMessages(prev => prev.map((message) => (
      message.id === messageId ? updater(message) : message
    )));
  };

  const handleClearSessionMessages = () => {
    activeStreamAbortRef.current?.abort();
    resetTypewriterForMessage(null);
    setIsStreaming(false);
    setStreamingMessageId(null);
    const greetingMessage = createGreetingMessage();
    setMessages([greetingMessage]);
    storage.removeSessionItem(chatSessionStorageKey);
  };

  const showCopiedLinkToast = () => {
    setShowCopyToast(true);
    if (copyToastTimerRef.current !== null) {
      window.clearTimeout(copyToastTimerRef.current);
    }

    copyToastTimerRef.current = window.setTimeout(() => {
      setShowCopyToast(false);
      copyToastTimerRef.current = null;
    }, 1800);
  };

  const showBusyQuestionToast = () => {
    setShowBusyToast(true);
    if (busyToastTimerRef.current !== null) {
      window.clearTimeout(busyToastTimerRef.current);
    }

    busyToastTimerRef.current = window.setTimeout(() => {
      setShowBusyToast(false);
      busyToastTimerRef.current = null;
    }, 1800);
  };

  const copySourceLink = async (url: string) => {
    if (!url) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      showCopiedLinkToast();
    } catch (error) {
      console.error('复制参考资料链接失败:', error);
    }
  };

  const flushTypewriterQueue = () => {
    const state = typewriterStateRef.current;

    if (!state.messageId) {
      state.frameId = null;
      state.queue = '';
      return;
    }

    if (!state.queue) {
      state.frameId = null;
      return;
    }

    const nextChunkSize = Math.max(1, Math.ceil(state.queue.length / 18));
    const nextTextSlice = state.queue.slice(0, nextChunkSize);
    state.queue = state.queue.slice(nextChunkSize);

    upsertAiMessage(state.messageId, (message) => ({
      ...message,
      text: `${message.text}${nextTextSlice}`,
    }));

    state.frameId = window.requestAnimationFrame(flushTypewriterQueue);
  };

  const enqueueTypewriterDelta = (messageId: string, delta: string) => {
    const state = typewriterStateRef.current;
    if (state.messageId !== messageId) {
      state.messageId = messageId;
      state.queue = '';
      if (state.frameId !== null) {
        window.cancelAnimationFrame(state.frameId);
        state.frameId = null;
      }
    }

    state.queue += delta;

    if (state.frameId === null) {
      state.frameId = window.requestAnimationFrame(flushTypewriterQueue);
    }
  };

  const resetTypewriterForMessage = (messageId: string | null) => {
    const state = typewriterStateRef.current;
    state.messageId = messageId;
    state.queue = '';
    if (state.frameId !== null) {
      window.cancelAnimationFrame(state.frameId);
      state.frameId = null;
    }
  };

  const triggerMatchChatPrediction = async (
    match: Match,
    options?: { silentWhenBusy?: boolean },
  ) => {
    if (isStreamingRef.current || activeStreamAbortRef.current) {
      if (!options?.silentWhenBusy) {
        showBusyQuestionToast();
      }
      return;
    }

    const userPromptText = `请帮我联网深度分析焦点战役【${getMatchFlagText(match.homeTeam.name, match.homeTeam.flag)} ${match.homeTeam.name} VS ${getMatchFlagText(match.awayTeam.name, match.awayTeam.flag)} ${match.awayTeam.name}】，评估双方近期状态、交手细节并预测可能胜平负比分！`;
    const aiMessageId = createMessageId();
    const nextConversationMessages: ChatMessage[] = [
      ...messages,
      {
        id: createMessageId(),
        sender: 'user',
        text: userPromptText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    
    // 先把用户问题写入会话，再异步请求服务端。
    setMessages([
      ...nextConversationMessages,
      {
        id: aiMessageId,
        sender: 'ai',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setIsStreaming(true);
    setStreamingMessageId(aiMessageId);
    activeStreamAbortRef.current?.abort();
    resetTypewriterForMessage(aiMessageId);
    const abortController = new AbortController();
    activeStreamAbortRef.current = abortController;

    try {
      await streamArkPrediction({
        match,
        messages: toArkConversationMessages(nextConversationMessages),
        signal: abortController.signal,
        onChunk: (delta) => {
          enqueueTypewriterDelta(aiMessageId, delta);
        },
        onSources: (sources) => {
          upsertAiMessage(aiMessageId, (message) => ({
            ...message,
            sources,
          }));
        },
      });
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Ark 接口调用失败，请稍后重试。';
      resetTypewriterForMessage(aiMessageId);
      const mockResult = `### 接口调用失败
> ⚠️ ${message}

#### 本次请求未使用本地知识库兜底
* 对阵：**${match.homeTeam.name} VS ${match.awayTeam.name}**
* 接口：**Ark Bot**
* 状态：**请求失败，未生成预测结果**`;
      upsertAiMessage(aiMessageId, (currentMessage) => ({
        ...currentMessage,
        text: mockResult,
      }));
    } finally {
      autoTriggerBusyRef.current = false;
      setIsStreaming(false);
      setStreamingMessageId((current) => (current === aiMessageId ? null : current));
      if (activeStreamAbortRef.current === abortController) {
        activeStreamAbortRef.current = null;
      }
    }
  };

  const handleSendUserQuestion = async (queryText: string) => {
    if (!queryText.trim()) return;
    if (isStreamingRef.current || activeStreamAbortRef.current) {
      showBusyQuestionToast();
      return;
    }
    const finalQuery = queryText.trim();
    const aiMessageId = createMessageId();
    const nextConversationMessages: ChatMessage[] = [
      ...messages,
      {
        id: createMessageId(),
        sender: 'user',
        text: finalQuery,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setInputValue('');

    // 普通问答与比赛自动分析共用本地知识库生成逻辑。
    setMessages([
      ...nextConversationMessages,
      {
        id: aiMessageId,
        sender: 'ai',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setIsStreaming(true);
    setStreamingMessageId(aiMessageId);
    activeStreamAbortRef.current?.abort();
    resetTypewriterForMessage(aiMessageId);
    const abortController = new AbortController();
    activeStreamAbortRef.current = abortController;

    try {
      await streamArkPrediction({
        question: finalQuery,
        messages: toArkConversationMessages(nextConversationMessages),
        signal: abortController.signal,
        onChunk: (delta) => {
          enqueueTypewriterDelta(aiMessageId, delta);
        },
        onSources: (sources) => {
          upsertAiMessage(aiMessageId, (message) => ({
            ...message,
            sources,
          }));
        },
      });
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Ark 接口调用失败，请稍后重试。';
      resetTypewriterForMessage(aiMessageId);
      const mockPromptAnswer = `### 接口调用失败
> ⚠️ ${message}

#### 本次请求未使用本地知识库兜底
* 你的问题：**${finalQuery}**
* 接口：**Ark Bot**
* 状态：**请求失败，未生成回答内容**`;
      upsertAiMessage(aiMessageId, (currentMessage) => ({
        ...currentMessage,
        text: mockPromptAnswer,
      }));
    } finally {
      setIsStreaming(false);
      setStreamingMessageId((current) => (current === aiMessageId ? null : current));
      if (activeStreamAbortRef.current === abortController) {
        activeStreamAbortRef.current = null;
      }
    }
  };

  // 轻量 Markdown 渲染器：只处理当前模型回答会用到的标题、引用和列表。
  const renderAIPredictionMarkdown = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-2.5 font-sans text-xs text-slate-200 leading-relaxed tracking-wide select-text">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // 三级标题
          if (trimmed.startsWith('###')) {
            return (
              <h3 key={idx} className="text-sm font-black text-emerald-400 pt-2 border-b border-white/5 pb-1 flex items-center space-x-1.5 leading-snug">
                <span>⚡</span>
                <span>{trimmed.replace(/###/g, '').trim()}</span>
              </h3>
            );
          }

          // 四级标题
          if (trimmed.startsWith('####')) {
            return (
              <h4 key={idx} className="text-[11.5px] font-bold text-teal-300 pt-1 flex items-center space-x-1.5 leading-snug">
                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full"></span>
                <span>{trimmed.replace(/####/g, '').trim()}</span>
              </h4>
            );
          }

          // 引用提示块
          if (trimmed.startsWith('>')) {
            return (
              <div key={idx} className="bg-emerald-500/10 border-l-[3px] border-emerald-500 p-2 rounded-r-xl text-[10px] text-emerald-300/90 italic font-medium my-1.5 leading-snug">
                {trimmed.replace(/>/g, '').trim()}
              </div>
            );
          }

          // 列表项
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

          // 普通文本行，并支持 **加粗**。
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
    <div className="flex-1 flex flex-col bg-[#050f17] text-white overflow-hidden relative select-none pb-[68px]">
      
      {/* 顶部标题栏 */}
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
        <div className="flex items-center gap-2">
          <span className="text-[9px] bg-[#0d263b] text-slate-400 font-bold border border-white/5 py-0.5 px-2 rounded-md">
            🟢 联网分析
          </span>
          <button
            type="button"
            onClick={handleClearSessionMessages}
            className="text-[9px] bg-[#102030] text-slate-300 font-bold border border-white/8 py-0.5 px-2 rounded-md hover:text-white hover:border-[#00e676]/25 hover:bg-[#13283c] transition-all cursor-pointer"
          >
            清空记录
          </button>
        </div>
      </div>

      {/* 可滚动消息区 */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 scrollbar-none relative z-0 overscroll-contain [transform:rotate(180deg)]"
      >
        <div className="min-h-full flex flex-col">
          <div className="flex-1 min-h-8" />

          {[...messages].reverse().map((msg) => {
            const isUser = msg.sender === 'user';
            const showThinkingState = !isUser && isStreaming && streamingMessageId === msg.id && !msg.text.trim();
            return (
              <div 
                key={msg.id} 
                className={`flex w-full mb-4 [transform:rotate(180deg)] ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-3xl p-3.5 shadow-md flex flex-col relative ${
                  isUser 
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 rounded-tr-none text-white' 
                    : 'bg-[#0f2334]/95 border border-[#1b3c58]/35 rounded-tl-none text-slate-200'
                } ${!isUser && isStreaming && streamingMessageId === msg.id ? 'min-h-[84px]' : ''}`}>
                  {/* 消息正文 */}
                  <div className="break-words">
                    {isUser ? (
                      <span className="text-xs font-semibold leading-relaxed font-sans">{msg.text}</span>
                    ) : showThinkingState ? (
                      <div className="flex items-center gap-2 text-[11px] text-emerald-300/95 min-h-6">
                        <span className="font-semibold tracking-wide">思考中</span>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                        </div>
                      </div>
                    ) : (
                      renderAIPredictionMarkdown(msg.text)
                    )}
                  </div>

                  {/* 联网搜索来源 */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3.5 pt-2 border-t border-white/5 flex flex-col space-y-1">
                      <span className="text-[9px] text-[#00e676]/90 font-extrabold uppercase tracking-wider flex items-center space-x-1">
                        <span>🌐</span>
                        <span>参考资料:</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.sources.slice(0, 3).map((src, srcIdx) => (
                          <button
                            type="button"
                            key={srcIdx}
                            onClick={() => copySourceLink(src.uri)}
                            className="bg-[#0b1c2a] border border-white/5 rounded px-2 py-0.5 text-[8px] font-mono text-slate-300 hover:text-white hover:border-[#00e676]/35 transition-all max-w-[120px] truncate block"
                          >
                            🔗 {src.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 消息时间 */}
                  <span className="text-[8px] text-slate-500 font-mono tracking-tight text-right mt-1.5 self-end block leading-none">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部操作区：快捷问题 + 输入框 */}
      <div className="shrink-0 bg-gradient-to-t from-[#050f17]/92 via-[#050f17]/72 to-transparent backdrop-blur-xl pt-3 pb-3 px-3.5 border-t border-white/5 select-none">
        
        {/* 横向滚动快捷问题 */}
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
                disabled={isStreaming}
                className="px-2.5 py-1 text-[9.5px] text-teal-200/88 border border-white/12 rounded-full bg-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] hover:bg-white/6 hover:text-[#00e676] hover:border-[#00e676]/28 transition-all shrink-0 cursor-pointer"
              >
                {q.text}
              </button>
            ))}
          </div>
        </div>

        {/* 输入表单 */}
        <form 
          onSubmit={handleOnSubmit}
          className="flex items-center space-x-2.5 bg-[#0b1b2a] border border-[#1b3d58] rounded-2xl py-1.5 pl-3.5 pr-1.5 focus-within:border-[#00e676]/50 transition-all shadow-inner"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="向AI咨询任何世界杯战术"
            disabled={isStreaming}
            className="flex-1 bg-transparent border-none text-[11.5px] text-white focus:outline-hidden placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isStreaming}
            className="w-8 h-8 rounded-xl bg-[#00e676] text-slate-950 flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-[#00e676]/10"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {showCopyToast && (
        <div className="absolute top-1/2 left-1/2 z-50 w-64 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#00e676]/45 bg-[#061421]/95 px-5 py-4 text-center shadow-[0_12px_30px_rgba(0,0,0,0.85)] select-none">
          <div className="mb-2 text-lg">🔗</div>
          <div className="text-xs font-black tracking-wide text-white uppercase">链接已复制</div>
          <div className="mt-1.5 text-[10.5px] leading-relaxed text-slate-300">
            请前往系统外浏览器粘贴链接后打开
          </div>
        </div>
      )}

      {showBusyToast && (
        <div className="absolute top-1/2 left-1/2 z-50 w-64 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#ffd54f]/45 bg-[#061421]/95 px-5 py-4 text-center shadow-[0_12px_30px_rgba(0,0,0,0.85)] select-none">
          <div className="mb-2 text-lg">⏳</div>
          <div className="text-xs font-black tracking-wide text-white">当前回答尚未完成</div>
          <div className="mt-1.5 text-[10.5px] leading-relaxed text-slate-300">
            请等待上一条问题回答结束后再继续提问
          </div>
        </div>
      )}

    </div>
  );
};
