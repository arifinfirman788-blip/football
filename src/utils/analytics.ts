import { API_BASE_URL } from './apiConfig';
import { USER_ID_STORAGE_KEY } from './predictionApi';
import { storage } from './storage';
import { getCachedWechatUser, hydrateWechatUserFromUrl } from './wechatBridge';

type AnalyticsEventName =
  | 'app_show'
  | 'game_home_view'
  | 'match_guess_view'
  | 'guess_result_view'
  | 'leaderboard_view'
  | 'share_click'
  | 'share_entry_open'
  | 'daily_task_click';

type AnalyticsProps = {
  user_id?: number;
  openid?: string;
  anonymous_id?: string;
  unionid?: string;
  session_id?: string;
  page_path?: string;
  source?: 'share' | 'menu' | 'group' | 'organic' | 'scan';
  scene?: string;
  match_id?: number;
  match_name?: string;
  guess_team?: 'home_win' | 'draw' | 'away_win';
  extra?: Record<string, unknown>;
};

type AnalyticsEvent = AnalyticsProps & {
  event_name: AnalyticsEventName;
  event_time: number;
};

declare global {
  interface Window {
    __FOOTBALL_TRACK_SHARE_CLICK__?: (payload?: { matchId?: number; matchName?: string }) => void;
  }
}

const QUEUE_LIMIT = 20;
const SESSION_KEY = 'football.analytics-session-id';
const ANONYMOUS_KEY = 'football.analytics-anonymous-id';
const SOURCE_KEY = 'football.analytics-source';
const SCENE_KEY = 'football.analytics-scene';

const createId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

const getOrCreateSessionId = () => {
  let sessionId = storage.getSessionJson<string | null>(SESSION_KEY, null);
  if (!sessionId) {
    sessionId = createId('sess');
    storage.setSessionJson(SESSION_KEY, sessionId);
  }
  return sessionId;
};

const getOrCreateAnonymousId = () => {
  let anonymousId = storage.getJson<string | null>(ANONYMOUS_KEY, null);
  if (!anonymousId) {
    anonymousId = createId('anon');
    storage.setJson(ANONYMOUS_KEY, anonymousId);
  }
  return anonymousId;
};

const getCurrentPagePath = () => {
  if (typeof window === 'undefined') return '';
  return `${window.location.pathname}${window.location.hash || ''}`.replace(/^\//, '') || 'football';
};

const getStoredUserId = () => {
  if (typeof window === 'undefined') return undefined;
  const raw = window.localStorage.getItem(USER_ID_STORAGE_KEY);
  const value = raw ? Number(raw) : NaN;
  return Number.isFinite(value) ? value : undefined;
};

const getSourceFromScene = (scene?: string | null): AnalyticsProps['source'] => {
  if (!scene) return 'organic';
  if (['1007', '1008', '1044'].includes(scene)) return 'share';
  if (scene === '1035') return 'menu';
  if (scene === '1011') return 'scan';
  return 'organic';
};

const getSearchParams = () => {
  if (typeof window === 'undefined') return new URLSearchParams();
  const params = new URLSearchParams(window.location.search);
  const hashQueryIndex = window.location.hash.indexOf('?');
  if (hashQueryIndex >= 0) {
    const hashParams = new URLSearchParams(window.location.hash.slice(hashQueryIndex + 1));
    hashParams.forEach((value, key) => {
      if (!params.has(key)) params.set(key, value);
    });
  }
  return params;
};

const getStoredSource = () => storage.getSessionJson<AnalyticsProps['source'] | null>(SOURCE_KEY, null);
const getStoredScene = () => storage.getSessionJson<string | null>(SCENE_KEY, null);

const normalizeEvent = (eventName: AnalyticsEventName, props: AnalyticsProps = {}): AnalyticsEvent => {
  const user = getCachedWechatUser();
  const userId = props.user_id ?? getStoredUserId();
  const openid = props.openid ?? user?.unionId;
  const anonymousId = props.anonymous_id ?? getOrCreateAnonymousId();
  return {
    ...props,
    event_name: eventName,
    event_time: Date.now(),
    user_id: userId,
    openid,
    anonymous_id: anonymousId,
    session_id: props.session_id ?? getOrCreateSessionId(),
    page_path: props.page_path ?? getCurrentPagePath(),
    source: props.source ?? getStoredSource() ?? 'organic',
    scene: props.scene ?? getStoredScene() ?? undefined,
  };
};

const queue: AnalyticsEvent[] = [];
let flushTimer: number | null = null;

const sendEvents = async (events: AnalyticsEvent[]) => {
  if (!events.length) return;
  await fetch(`${API_BASE_URL}/analytics/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events }),
    keepalive: true,
  });
};

export const flushAnalytics = async () => {
  if (flushTimer !== null) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }
  const events = queue.splice(0, queue.length);
  try {
    await sendEvents(events);
  } catch (error) {
    console.warn('analytics flush failed', error);
  }
};

const scheduleFlush = () => {
  if (typeof window === 'undefined' || flushTimer !== null) return;
  flushTimer = window.setTimeout(() => {
    void flushAnalytics();
  }, 1500);
};

export const track = (eventName: AnalyticsEventName, props: AnalyticsProps = {}) => {
  queue.push(normalizeEvent(eventName, props));
  if (queue.length >= QUEUE_LIMIT) {
    void flushAnalytics();
    return;
  }
  scheduleFlush();
};

export const initAnalytics = () => {
  if (typeof window === 'undefined') return;
  hydrateWechatUserFromUrl();
  getOrCreateSessionId();
  getOrCreateAnonymousId();

  const params = getSearchParams();
  const scene = params.get('scene');
  const source = (params.get('source') as AnalyticsProps['source'] | null) || getSourceFromScene(scene);
  storage.setSessionJson(SCENE_KEY, scene || '');
  storage.setSessionJson(SOURCE_KEY, source || 'organic');

  track('app_show', { scene: scene || undefined, source: source || 'organic' });
  if (source === 'share') {
    track('share_entry_open', { scene: scene || undefined, source });
  }

  window.__FOOTBALL_TRACK_SHARE_CLICK__ = (payload) => {
    track('share_click', {
      page_path: getCurrentPagePath(),
      match_id: payload?.matchId,
      match_name: payload?.matchName,
    });
    void flushAnalytics();
  };

  window.addEventListener('pagehide', () => {
    void flushAnalytics();
  });
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flushAnalytics();
    }
  });
};
