import { TEAMS } from '../data';
import { Match, PredictionRecord, WechatUserProfile } from '../types';
import { API_BASE_URL } from './apiConfig';

interface ApiMessage {
  code: number;
  detail: string | null;
  message: string;
  status: number;
}

interface ApiPageData<T> {
  currentPage: number;
  list: T[];
  pageSize: number;
  totalCount: number;
  totalPage: number;
  date?: string;
  dates?: string[];
  date_groups?: Array<{
    date: string;
    match_total: number;
    list: T[];
  }>;
  match_total?: number;
}

interface ApiPageResponse<T> {
  data: ApiPageData<T>;
  message: ApiMessage;
}

interface ApiResponse<T> {
  data: T;
  message: ApiMessage;
}

export interface ApiDebugSnapshot {
  step: string;
  request?: {
    url: string;
    method: string;
    body?: unknown;
  };
  response?: {
    status: number;
    ok: boolean;
    rawText: string;
    json?: unknown;
  };
}

interface ApiUserUpsertData {
  user_id: number;
  openid: string;
  nickname: string;
  avatar_url: string;
  phone?: string;
  status: string;
}

interface ApiPredictableMatchItem {
  id: number;
  match_no: number;
  stage: string;
  stage_label: string;
  group_id: number | null;
  group_name: string | null;
  round_no: number | null;
  home_team_id: number;
  away_team_id: number;
  home_team_name: string;
  away_team_name: string;
  home_team_flag: string | null;
  away_team_flag: string | null;
  home_world_rank: number | null;
  away_world_rank: number | null;
  venue_name: string | null;
  start_time: string;
  status: 'not_started' | 'live' | 'finished';
  home_score: number | null;
  away_score: number | null;
  regular_result: string | null;
  is_settled: boolean;
  my_prediction_result: 'home_win' | 'draw' | 'away_win' | null;
  lock_time: string;
  can_predict: boolean;
}

interface ApiPredictionRecordItem {
  prediction_id: number;
  match_id: number;
  match_no: number;
  stage: string;
  stage_label: string;
  group_id: number | null;
  group_name: string | null;
  round_no: number | null;
  venue_name: string | null;
  start_time: string;
  status: 'not_started' | 'live' | 'finished';
  home_team_id: number;
  home_team_name: string;
  home_team_flag: string | null;
  home_world_rank: number | null;
  away_team_id: number;
  away_team_name: string;
  away_team_flag: string | null;
  away_world_rank: number | null;
  prediction_result: 'home_win' | 'draw' | 'away_win';
  prediction_label: string;
  home_score: number | null;
  away_score: number | null;
  regular_result: 'home_win' | 'draw' | 'away_win' | null;
  regular_result_label: string | null;
  settlement_status: 'pending' | 'settled';
  is_correct: number | null;
  points_awarded: number;
  submitted_at: string;
  last_updated_at: string;
  settled_at: string | null;
}

export const USER_ID_STORAGE_KEY = 'football.user-id';

const teamByName = new Map(Object.values(TEAMS).map((team) => [team.name, team]));

const ensureSuccess = <T extends { message: ApiMessage }>(payload: T) => {
  if (payload.message?.code !== 0) {
    throw new Error(payload.message?.message || '竞猜接口返回异常');
  }
};

export class PredictionApiDebugError extends Error {
  debug: ApiDebugSnapshot;

  constructor(message: string, debug: ApiDebugSnapshot) {
    super(message);
    this.name = 'PredictionApiDebugError';
    this.debug = debug;
  }
}

const readResponsePayload = async (response: Response) => {
  const rawText = await response.text();
  let json: unknown;

  if (rawText) {
    try {
      json = JSON.parse(rawText);
    } catch {
      json = undefined;
    }
  }

  return { rawText, json };
};

const pad2 = (value: number) => String(value).padStart(2, '0');

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
};

const formatBeijingDateParts = (isoString: string) => {
  const date = new Date(isoString);
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || '';

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const weekday = getPart('weekday');
  const hour = getPart('hour');
  const minute = getPart('minute');

  return {
    dateKey: `${year}-${pad2(Number(month))}-${pad2(Number(day))}`,
    time: `北京时间 ${month}月${day}日 ${weekday}`,
    timestamp: `${hour}:${minute}`,
  };
};

const mapStatus = (status: ApiPredictableMatchItem['status']): Match['status'] => {
  if (status === 'live') return 'conducting';
  if (status === 'finished') return 'ended';
  return 'unstarted';
};

const mapStageLabel = (stageLabel: string, stage: string, roundNo: number | null) => {
  if (stage === 'group' && roundNo) return `${stageLabel}·第${roundNo}轮`;
  return stageLabel || stage;
};

const mapTeam = (name: string, rank: number | null, fallbackFlagUrl: string | null) => {
  const localTeam = teamByName.get(name);
  if (localTeam) {
    return {
      ...localTeam,
      rank: rank ?? localTeam.rank,
    };
  }

  return {
    id: name,
    name,
    flag: fallbackFlagUrl || '🏳️',
    rank: rank ?? 0,
  };
};

const mapPredictableMatchToMatch = (item: ApiPredictableMatchItem): Match => {
  const beijingTime = formatBeijingDateParts(item.start_time);
  return {
    id: String(item.id),
    stage: mapStageLabel(item.stage_label, item.stage, item.round_no),
    time: beijingTime.time,
    dateKey: beijingTime.dateKey,
    timestamp: beijingTime.timestamp,
    kickoffUtc: item.start_time,
    venue: item.venue_name || undefined,
    homeTeam: mapTeam(item.home_team_name, item.home_world_rank, item.home_team_flag),
    awayTeam: mapTeam(item.away_team_name, item.away_world_rank, item.away_team_flag),
    homeScore: item.home_score ?? undefined,
    awayScore: item.away_score ?? undefined,
    status: mapStatus(item.status),
    userChoice: item.my_prediction_result === 'home_win'
      ? 'home'
      : item.my_prediction_result === 'away_win'
        ? 'away'
        : item.my_prediction_result === 'draw'
          ? 'draw'
          : undefined,
    group: item.group_name?.replace(/组$/, '') || undefined,
  };
};

const mapPredictionOutcome = (prediction: ApiPredictionRecordItem['prediction_result']): PredictionRecord['outcome'] => {
  if (prediction === 'home_win') return 'home';
  if (prediction === 'away_win') return 'away';
  return 'draw';
};

const mapPredictionMatchStatus = (status: ApiPredictionRecordItem['status']): Match['status'] => {
  if (status === 'live') return 'conducting';
  if (status === 'finished') return 'ended';
  return 'unstarted';
};

const mapPredictionRecord = (
  item: ApiPredictionRecordItem,
  wechatUser?: WechatUserProfile | null
): PredictionRecord => {
  const beijingTime = formatBeijingDateParts(item.start_time);
  const outcome = mapPredictionOutcome(item.prediction_result);

  return {
    matchId: String(item.match_id),
    fixture: `${item.home_team_name} VS ${item.away_team_name}`,
    homeTeamName: item.home_team_name,
    awayTeamName: item.away_team_name,
    homeTeamFlag: mapTeam(item.home_team_name, item.home_world_rank, item.home_team_flag).flag,
    awayTeamFlag: mapTeam(item.away_team_name, item.away_world_rank, item.away_team_flag).flag,
    choice: item.prediction_label,
    outcome,
    time: beijingTime.time,
    dateKey: beijingTime.dateKey,
    timestamp: beijingTime.timestamp,
    stage: mapStageLabel(item.stage_label, item.stage, item.round_no),
    matchStatus: mapPredictionMatchStatus(item.status),
    actualResult: item.regular_result_label || null,
    score: item.home_score !== null && item.away_score !== null
      ? `${item.home_score} : ${item.away_score}`
      : null,
    status: item.settlement_status === 'pending'
      ? '待开奖'
      : item.points_awarded > 0
        ? '猜对 +1'
        : '猜错 +0',
    points: item.settlement_status === 'pending' ? null : item.points_awarded,
    wechatUser: wechatUser || undefined,
  };
};

export const getStoredUserId = () => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(USER_ID_STORAGE_KEY);
  const parsed = raw ? Number(raw) : null;
  return parsed && Number.isFinite(parsed) ? parsed : null;
};

export const upsertUserProfile = async (wechatUser: WechatUserProfile): Promise<number> => {
  const response = await fetch(`${API_BASE_URL}/users/upsert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      openid: wechatUser.unionId,
      nickname: wechatUser.nickname,
      avatar_url: wechatUser.avatarUrl,
    }),
  });

  if (!response.ok) {
    throw new Error(`用户初始化接口请求失败，HTTP 状态码 ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<ApiUserUpsertData>;
  ensureSuccess(payload);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(USER_ID_STORAGE_KEY, String(payload.data.user_id));
  }

  return payload.data.user_id;
};

export const fetchPredictableMatchesByDate = async (userId: number, date: string) => {
  const response = await fetch(`${API_BASE_URL}/public/matches/predictable?user_id=${userId}&date=${date}&page=1&page_size=100`);
  if (!response.ok) {
    throw new Error(`竞猜比赛接口请求失败，HTTP 状态码 ${response.status}`);
  }

  const payload = (await response.json()) as ApiPageResponse<ApiPredictableMatchItem>;
  ensureSuccess(payload);

  return {
    date,
    matches: payload.data.list.map(mapPredictableMatchToMatch),
    canPredictMap: payload.data.list.reduce<Record<string, boolean>>((acc, item) => {
      acc[String(item.id)] = item.can_predict;
      return acc;
    }, {}),
  };
};

export const resolveFirstPredictableDate = async (userId: number, fromDate = new Date()) => {
  const date = formatDateKey(fromDate);
  const dayCount = 2;
  const response = await fetch(`${API_BASE_URL}/public/matches/nearest-predictable?user_id=${userId}&date=${date}&day_count=${dayCount}&page=1&page_size=100`);
  if (!response.ok) {
    throw new Error(`最近比赛日竞猜接口请求失败，HTTP 状态码 ${response.status}`);
  }

  const payload = (await response.json()) as ApiPageResponse<ApiPredictableMatchItem>;
  ensureSuccess(payload);

  const dateGroups = Array.isArray(payload.data.date_groups) ? payload.data.date_groups : [];
  const groupedMatches = Object.fromEntries(
    dateGroups.map((group) => [
      group.date,
      {
        matches: group.list.map(mapPredictableMatchToMatch),
        canPredictMap: group.list.reduce<Record<string, boolean>>((acc, item) => {
          acc[String(item.id)] = item.can_predict;
          return acc;
        }, {}),
      },
    ])
  );

  return {
    date: payload.data.date || date,
    dates: Array.isArray(payload.data.dates) ? payload.data.dates : [payload.data.date || date],
    matches: payload.data.list.map(mapPredictableMatchToMatch),
    canPredictMap: payload.data.list.reduce<Record<string, boolean>>((acc, item) => {
      acc[String(item.id)] = item.can_predict;
      return acc;
    }, {}),
    groupedMatches,
  };
};

export const submitPrediction = async (
  userId: number,
  matchId: string,
  outcome: 'home' | 'draw' | 'away'
) => {
  const predictionResult = outcome === 'home' ? 'home_win' : outcome === 'away' ? 'away_win' : 'draw';
  const url = `${API_BASE_URL}/public/matches/${matchId}/prediction`;
  const requestBody = {
    user_id: userId,
    prediction_result: predictionResult,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const payloadInfo = await readResponsePayload(response);
  const debug: ApiDebugSnapshot = {
    step: 'submitPrediction',
    request: {
      url,
      method: 'POST',
      body: requestBody,
    },
    response: {
      status: response.status,
      ok: response.ok,
      rawText: payloadInfo.rawText,
      json: payloadInfo.json,
    },
  };

  if (!response.ok) {
    throw new PredictionApiDebugError(`提交竞猜失败，HTTP 状态码 ${response.status}`, debug);
  }

  if (!payloadInfo.json) {
    throw new PredictionApiDebugError('提交竞猜失败，接口返回了空响应或非 JSON 响应。', debug);
  }

  const payload = payloadInfo.json as ApiResponse<{
    id: number;
    user_id: number;
    match_id: number;
    prediction_result: string;
    is_correct: number | null;
    points_awarded: number;
  }>;

  if (payload && typeof payload === 'object' && 'data' in payload && 'message' in payload) {
    if (payload.message?.code !== 0) {
      throw new PredictionApiDebugError(payload.message?.message || '竞猜接口返回异常', debug);
    }

    return payload.data;
  }

  const rawPayload = payloadInfo.json as {
    id: number;
    user_id: number;
    match_id: number;
    prediction_result: string;
    is_correct: number | null;
    points_awarded: number;
  };

  if (!rawPayload || typeof rawPayload.id !== 'number' || typeof rawPayload.match_id !== 'number') {
    throw new PredictionApiDebugError('竞猜接口返回异常，返回结构既不是文档包装格式，也不是裸对象格式。', debug);
  }

  return rawPayload;
};

export const fetchUserPredictionRecords = async (
  userId: number,
  wechatUser?: WechatUserProfile | null
) => {
  const response = await fetch(`${API_BASE_URL}/public/users/${userId}/predictions?page=1&page_size=100`);
  if (!response.ok) {
    throw new Error(`我的竞猜记录接口请求失败，HTTP 状态码 ${response.status}`);
  }

  const payload = (await response.json()) as ApiPageResponse<ApiPredictionRecordItem>;
  ensureSuccess(payload);

  return payload.data.list.map((item) => mapPredictionRecord(item, wechatUser));
};
