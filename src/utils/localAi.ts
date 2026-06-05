import { fetchEventSource } from '@microsoft/fetch-event-source';
import { Match } from '../types';
import { ARK_PROXY_PATH } from './apiConfig';

export interface LocalAiSource {
  title: string;
  uri: string;
}

export interface LocalAiResult {
  success: true;
  prediction: string;
  sources: LocalAiSource[];
  provider: 'ark-bot';
  timestamp: string;
}

export interface ArkConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ArkChatCompletionChunk {
  choices?: Array<{
    message?: {
      content?: string;
    };
    delta?: {
      content?: string;
    };
  }>;
  references?: Array<{
    title?: string;
    name?: string;
    url?: string;
    uri?: string;
  }>;
}

interface ArkStreamOptions {
  match?: Match | null;
  question?: string;
  messages?: ArkConversationMessage[];
  signal?: AbortSignal;
  onChunk?: (delta: string) => void;
  onSources?: (sources: LocalAiSource[]) => void;
}

const arkApiUrl = ARK_PROXY_PATH;
const arkApiKey = 'ark-1a59cf94-e2ae-48f2-b5cf-d9e17795e8df-8f7ef';
const arkBotModel = 'bot-20260529180527-29f2t';

class ArkStreamFatalError extends Error {}

const normalizeArkApiUrl = (rawUrl: string) => {
  const normalized = rawUrl.replace(/\/+$/, '');
  if (normalized.endsWith('/chat/completions')) return normalized;
  if (normalized.endsWith('/bots')) return `${normalized}/chat/completions`;
  return normalized;
};

const buildMatchQuestion = (match: Match) => (
  `请分析并预测这场即将到来（或最近发生）的世界杯足球赛：
主队：${match.homeTeam.name} (${match.homeTeam.flag})
客队：${match.awayTeam.name} (${match.awayTeam.flag})
赛事阶段：${match.stage || '小组赛'}
比赛时间：${match.dateKey} ${match.timestamp}

请基于联网搜索获取最及时的球队状态、核心球员伤停、历史交手记录、近期战绩、欧指及盘口分析。给出具有深度和战术洞察的预测。
分析应该包括：
1. 【双方近期状态与核心伤停】
2. 【历史交战记录分析】
3. 【关键战术博弈点】
4. 【大模型综合预测分析与推荐比分】（请明确预测主胜、平局或客胜的概率）

请以专业、客观、富有体育色彩的中文 Markdown 格式输出。`
);

const buildArkPrompt = (payload: { match?: Match | null; question?: string }) => {
  if (payload.match) return buildMatchQuestion(payload.match);
  return payload.question?.trim() || '请分析一下今晚最值得关注的世界杯比赛。';
};

const getChunkText = (data: ArkChatCompletionChunk) => (
  data.choices?.[0]?.delta?.content
  || data.choices?.[0]?.message?.content
  || ''
);

const getChunkSources = (data: ArkChatCompletionChunk): LocalAiSource[] => {
  if (!Array.isArray(data.references)) return [];

  return data.references
    .map((item) => ({
      title: item.title || item.name || '联网参考来源',
      uri: item.url || item.uri || '',
    }))
    .filter((item) => item.uri);
};

export const streamArkPrediction = async ({
  match,
  question,
  messages,
  signal,
  onChunk,
  onSources,
}: ArkStreamOptions): Promise<LocalAiResult> => {
  if (!arkApiKey) {
    throw new Error('未配置 Ark API Key，无法调用 Ark 问答预测接口。');
  }

  let prediction = '';
  let latestSources: LocalAiSource[] = [];

  await fetchEventSource(normalizeArkApiUrl(arkApiUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${arkApiKey}`,
    },
    body: JSON.stringify({
      model: arkBotModel,
      stream: true,
      messages: messages?.length
        ? messages
        : [
            {
              role: 'user',
              content: buildArkPrompt({ match, question }),
            },
          ],
    }),
    signal,
    openWhenHidden: true,
    async onopen(response) {
      if (!response.ok) {
        throw new ArkStreamFatalError(`Ark 接口请求失败，HTTP 状态码 ${response.status}。`);
      }
    },
    onmessage(event) {
      if (!event.data || event.data === '[DONE]') return;

      let chunkData: ArkChatCompletionChunk;
      try {
        chunkData = JSON.parse(event.data) as ArkChatCompletionChunk;
      } catch {
        throw new ArkStreamFatalError('Ark SSE 返回的数据不是合法 JSON。');
      }

      const chunkText = getChunkText(chunkData);
      if (chunkText) {
        prediction += chunkText;
        onChunk?.(chunkText);
      }

      const chunkSources = getChunkSources(chunkData);
      if (chunkSources.length > 0) {
        latestSources = chunkSources;
        onSources?.(chunkSources);
      }
    },
    onclose() {
      if (!prediction.trim()) {
        throw new ArkStreamFatalError('Ark SSE 连接已关闭，但未返回任何内容。');
      }
    },
    onerror(error) {
      if (error instanceof ArkStreamFatalError) {
        throw error;
      }

      if (signal?.aborted) {
        throw new ArkStreamFatalError('请求已取消。');
      }

      throw new ArkStreamFatalError(error instanceof Error ? error.message : 'Ark SSE 请求失败。');
    },
  });

  if (!prediction.trim()) {
    throw new Error('Ark 接口返回成功，但内容为空。');
  }

  return {
    success: true,
    prediction,
    sources: latestSources,
    provider: 'ark-bot',
    timestamp: new Date().toISOString(),
  };
};
