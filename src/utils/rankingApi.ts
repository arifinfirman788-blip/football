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
}

interface ApiPageResponse<T> {
  data: ApiPageData<T> & {
    weekStart?: string;
    weekEnd?: string;
    date?: string;
  };
  message: ApiMessage;
}

interface ApiResponse<T> {
  data: T;
  message: ApiMessage;
}

interface ApiWeeklyRankingItem {
  user_id: number;
  nickname: string;
  avatar_url: string;
  points: number;
  correct_count: number;
  wrong_count: number;
  prediction_count: number;
  hit_rate: number;
}

interface ApiTotalRankingItem {
  user_id: number;
  nickname: string;
  avatar_url: string;
  total_predictions: number;
  correct_predictions: number;
  wrong_predictions: number;
  hit_rate: number;
  total_points: number;
}

interface ApiMyRankingData {
  type: 'weekly' | 'total';
  date?: string;
  weekStart?: string;
  weekEnd?: string;
  rank: number | null;
  user_id: number;
  nickname: string;
  avatar_url: string;
  points: number;
  correct_count: number;
  wrong_count: number;
  prediction_count: number;
  hit_rate: number;
}

export interface RankingListUser {
  rank: number;
  name: string;
  avatar: string;
  guesses: number;
  accuracy: string;
  points: number;
}

export interface RankingListPageResult {
  list: RankingListUser[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPage: number;
}

export interface MyRankingSummary {
  rank: number | null;
  nickname: string;
  avatar: string;
  submittedCount: number;
  accuracy: string;
  points: number;
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80';

const formatHitRate = (value: number) => `${Math.round(value * 100)}%`;

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayDateKey = () => formatDateKey(new Date());

const ensureSuccess = <T extends { message: ApiMessage }>(payload: T) => {
  if (payload.message?.code !== 0) {
    throw new Error(payload.message?.message || '排行榜接口返回异常');
  }
};

export const fetchWeeklyLeaderboard = async (
  date: string,
  page = 1,
  pageSize = 21
): Promise<RankingListPageResult> => {
  const response = await fetch(`${API_BASE_URL}/rankings/weekly?date=${date}&page=${page}&page_size=${pageSize}`);
  if (!response.ok) {
    throw new Error(`周排行榜接口请求失败，HTTP 状态码 ${response.status}`);
  }

  const payload = (await response.json()) as ApiPageResponse<ApiWeeklyRankingItem>;
  ensureSuccess(payload);

  return {
    list: payload.data.list.map((item, index) => ({
      rank: (payload.data.currentPage - 1) * payload.data.pageSize + index + 1,
      name: item.nickname,
      avatar: item.avatar_url || DEFAULT_AVATAR,
      guesses: item.correct_count,
      accuracy: formatHitRate(item.hit_rate),
      points: item.points,
    })),
    currentPage: payload.data.currentPage,
    pageSize: payload.data.pageSize,
    totalCount: payload.data.totalCount,
    totalPage: payload.data.totalPage,
  };
};

export const fetchTotalLeaderboard = async (
  page = 1,
  pageSize = 55
): Promise<RankingListPageResult> => {
  const response = await fetch(`${API_BASE_URL}/rankings/total?page=${page}&page_size=${pageSize}`);
  if (!response.ok) {
    throw new Error(`总排行榜接口请求失败，HTTP 状态码 ${response.status}`);
  }

  const payload = (await response.json()) as ApiPageResponse<ApiTotalRankingItem>;
  ensureSuccess(payload);

  return {
    list: payload.data.list.map((item, index) => ({
      rank: (payload.data.currentPage - 1) * payload.data.pageSize + index + 1,
      name: item.nickname,
      avatar: item.avatar_url || DEFAULT_AVATAR,
      guesses: item.correct_predictions,
      accuracy: formatHitRate(item.hit_rate),
      points: item.total_points,
    })),
    currentPage: payload.data.currentPage,
    pageSize: payload.data.pageSize,
    totalCount: payload.data.totalCount,
    totalPage: payload.data.totalPage,
  };
};

export const fetchMyRankingSummary = async (
  userId: number,
  type: 'weekly' | 'total',
  date?: string
): Promise<MyRankingSummary> => {
  const params = new URLSearchParams({
    user_id: String(userId),
    type,
  });

  if (type === 'weekly' && date) {
    params.set('date', date);
  }

  const response = await fetch(`${API_BASE_URL}/rankings/me?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`我的排行接口请求失败，HTTP 状态码 ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<ApiMyRankingData>;
  ensureSuccess(payload);

  return {
    rank: payload.data.rank,
    nickname: payload.data.nickname,
    avatar: payload.data.avatar_url || DEFAULT_AVATAR,
    submittedCount: payload.data.prediction_count,
    accuracy: formatHitRate(payload.data.hit_rate),
    points: payload.data.points,
  };
};
