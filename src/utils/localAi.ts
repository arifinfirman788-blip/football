import { fetchEventSource } from '@microsoft/fetch-event-source';
import { Match } from '../types';
import { API_BASE_URL } from './apiConfig';

export interface LocalAiSource {
  title: string;
  uri: string;
}

export interface LocalAiResult {
  success: true;
  prediction: string;
  sources: LocalAiSource[];
  provider: 'ai-stream';
  timestamp: string;
}

export interface ArkConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AiStreamChunk {
  content?: string;
  error?: string;
}

interface ArkStreamOptions {
  match?: Match | null;
  question?: string;
  messages?: ArkConversationMessage[];
  signal?: AbortSignal;
  onChunk?: (delta: string) => void;
  onSources?: (sources: LocalAiSource[]) => void;
}

const aiStreamApiUrl = `${API_BASE_URL}/ai/chat/stream`;

class ArkStreamFatalError extends Error {}

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

export const streamArkPrediction = async ({
  match,
  question,
  messages,
  signal,
  onChunk,
  onSources,
}: ArkStreamOptions): Promise<LocalAiResult> => {
  let prediction = '';
  const latestSources: LocalAiSource[] = [];

  await fetchEventSource(aiStreamApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
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
        throw new ArkStreamFatalError(`问答接口请求失败，HTTP 状态码 ${response.status}。`);
      }
    },
    onmessage(event) {
      if (!event.data || event.data === '[DONE]') return;

      let chunkData: AiStreamChunk;
      try {
        chunkData = JSON.parse(event.data) as AiStreamChunk;
      } catch {
        throw new ArkStreamFatalError('问答 SSE 返回的数据不是合法 JSON。');
      }

      if (event.event === 'error' || chunkData.error) {
        throw new ArkStreamFatalError(chunkData.error || '问答接口返回错误。');
      }

      const chunkText = chunkData.content || '';
      if (chunkText) {
        prediction += chunkText;
        onChunk?.(chunkText);
      }
    },
    onclose() {
      if (!prediction.trim()) {
        throw new ArkStreamFatalError('问答 SSE 连接已关闭，但未返回任何内容。');
      }
    },
    onerror(error) {
      if (error instanceof ArkStreamFatalError) {
        throw error;
      }

      if (signal?.aborted) {
        throw new ArkStreamFatalError('请求已取消。');
      }

      throw new ArkStreamFatalError(error instanceof Error ? error.message : '问答 SSE 请求失败。');
    },
  });

  if (!prediction.trim()) {
    throw new Error('问答接口返回成功，但内容为空。');
  }

  onSources?.([]);

  return {
    success: true,
    prediction,
    sources: latestSources,
    provider: 'ai-stream',
    timestamp: new Date().toISOString(),
  };
};
