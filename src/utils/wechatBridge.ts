import { WechatUserProfile } from '../types';
import { storage } from './storage';

const USER_CACHE_KEY = 'football.wechat-user-profile';
const REQUEST_EVENT = 'football:request-wechat-user';
const RESPONSE_EVENT = 'football:wechat-user-response';
const ENTERPRISE_CUSTOMER_SERVICE_WECHAT_ID = 'hxxVIP01';
const MINI_PROGRAM_CUSTOMER_SERVICE_PAGE = '/pages/customerService/customerService';
const WECHAT_SDK_URL = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
const WECHAT_SDK_TIMEOUT_MS = 4000;
const MINI_PROGRAM_ENV_TIMEOUT_MS = 1500;

/**
 * H5 <-> 小程序宿主通信约定
 * 1. H5 提交竞猜前会通过 wx.miniProgram.postMessage 发送：
 *    { type: 'football:request-wechat-user', timestamp }
 * 2. 小程序拿到 unionId / nickname / avatarUrl 后，需要回传给 H5，以下任一方式均可：
 *    - window.__FOOTBALL_RESOLVE_WECHAT_USER__({ unionId, nickname, avatarUrl })
 *    - window.dispatchEvent(new CustomEvent('football:wechat-user-response', { detail: { ... } }))
 *    - window.postMessage({ type: 'football:wechat-user-response', payload: { ... } }, '*')
 */

type MiniProgramEnv = {
  miniprogram?: boolean;
};

declare global {
  interface Window {
    wx?: {
      miniProgram?: {
        getEnv?: (callback: (result: MiniProgramEnv) => void) => void;
        navigateTo?: (payload: { url: string }) => void;
        postMessage?: (payload: { data: unknown }) => void;
      };
    };
    __FOOTBALL_WECHAT_USER__?: Partial<WechatUserProfile>;
    __FOOTBALL_GET_WECHAT_USER__?: () => Promise<Partial<WechatUserProfile> | null> | Partial<WechatUserProfile> | null;
    __FOOTBALL_RESOLVE_WECHAT_USER__?: (payload: Partial<WechatUserProfile>) => void;
    __FOOTBALL_OPEN_CUSTOMER_SERVICE__?: () => Promise<void> | void;
    __FOOTBALL_WECHAT_SDK_LOADING__?: Promise<void>;
  }
}

const getMiniProgramApi = () => window.wx?.miniProgram;

const ensureWechatSdkLoaded = async () => {
  if (getMiniProgramApi()) return;

  if (!window.__FOOTBALL_WECHAT_SDK_LOADING__) {
    window.__FOOTBALL_WECHAT_SDK_LOADING__ = new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        reject(new Error('微信 JS-SDK 加载超时。'));
      }, WECHAT_SDK_TIMEOUT_MS);

      const resolveOnce = () => {
        window.clearTimeout(timeout);
        resolve();
      };

      const rejectOnce = () => {
        window.clearTimeout(timeout);
        reject(new Error('微信 JS-SDK 加载失败。'));
      };

      const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${WECHAT_SDK_URL}"]`);
      if (existingScript) {
        if (existingScript.dataset.loaded === 'true' || getMiniProgramApi()) {
          resolveOnce();
          return;
        }
        existingScript.addEventListener('load', resolveOnce, { once: true });
        existingScript.addEventListener('error', rejectOnce, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = WECHAT_SDK_URL;
      script.async = true;
      script.onload = () => {
        script.dataset.loaded = 'true';
        resolveOnce();
      };
      script.onerror = rejectOnce;
      document.head.appendChild(script);
    });
  }

  try {
    await window.__FOOTBALL_WECHAT_SDK_LOADING__;
  } catch {
    window.__FOOTBALL_WECHAT_SDK_LOADING__ = undefined;
  }
};

const getSearchParams = () => {
  const params = new URLSearchParams(window.location.search);
  const hashQueryIndex = window.location.hash.indexOf('?');
  if (hashQueryIndex >= 0) {
    const hashQuery = window.location.hash.slice(hashQueryIndex + 1);
    const hashParams = new URLSearchParams(hashQuery);
    hashParams.forEach((value, key) => {
      if (!params.has(key)) {
        params.set(key, value);
      }
    });
  }
  return params;
};

const getFirstParam = (params: URLSearchParams, keys: string[]) => {
  for (const key of keys) {
    const value = params.get(key);
    if (value) return value;
  }
  return null;
};

const isWechatUserProfile = (value: Partial<WechatUserProfile> | null | undefined): value is WechatUserProfile => {
  return !!value && !!value.unionId && !!value.nickname && !!value.avatarUrl;
};

const normalizeWechatUser = (
  value: (Partial<WechatUserProfile> & { openId?: string }) | null | undefined,
  source: WechatUserProfile['source'],
): WechatUserProfile | null => {
  if (!value) return null;
  const unionId = value.unionId || value.openId;
  if (!unionId || !value.nickname || !value.avatarUrl) return null;
  return {
    unionId,
    nickname: value.nickname,
    avatarUrl: value.avatarUrl,
    source,
  };
};

export const getCachedWechatUser = () => (
  storage.getJson<WechatUserProfile | null>(USER_CACHE_KEY, null)
);

const cacheWechatUser = (user: WechatUserProfile) => {
  storage.setJson(USER_CACHE_KEY, user);
};

const getMiniProgramEnv = async (): Promise<boolean> => {
  try {
    await ensureWechatSdkLoaded();
  } catch {
    return false;
  }
  const miniProgram = getMiniProgramApi();
  if (!miniProgram?.getEnv) return false;

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      resolve(false);
    }, MINI_PROGRAM_ENV_TIMEOUT_MS);

    try {
      miniProgram.getEnv?.((result) => {
        window.clearTimeout(timer);
        resolve(!!result?.miniprogram);
      });
    } catch {
      window.clearTimeout(timer);
      resolve(false);
    }
  });
};

const getInjectedWechatUser = async (): Promise<WechatUserProfile | null> => {
  const directUser = normalizeWechatUser(window.__FOOTBALL_WECHAT_USER__, 'injected');
  if (directUser) return directUser;

  if (!window.__FOOTBALL_GET_WECHAT_USER__) return null;

  const resolved = await window.__FOOTBALL_GET_WECHAT_USER__();
  return normalizeWechatUser(resolved, 'injected');
};

const getWechatUserFromUrl = (): WechatUserProfile | null => {
  const params = getSearchParams();
  const unionId = getFirstParam(params, ['unionId', 'unionid', 'openId', 'openid']);
  const nickname = getFirstParam(params, ['nickname', 'nickName', 'username', 'userName']);
  const avatarUrl = getFirstParam(params, ['avatarUrl', 'avatar', 'avatar_url', 'headimgurl', 'headImgUrl']);

  if (!unionId || !nickname || !avatarUrl) {
    return null;
  }

  return {
    unionId,
    nickname,
    avatarUrl,
    source: 'injected',
  };
};

export const resolveWechatUserFromMiniProgram = (payload: Partial<WechatUserProfile>) => {
  window.dispatchEvent(new CustomEvent(RESPONSE_EVENT, { detail: payload }));
};

export const getEnterpriseCustomerServiceFallbackWechatId = () => ENTERPRISE_CUSTOMER_SERVICE_WECHAT_ID;

export const openEnterpriseCustomerService = async () => {
  await ensureWechatSdkLoaded();

  if (window.__FOOTBALL_OPEN_CUSTOMER_SERVICE__) {
    await window.__FOOTBALL_OPEN_CUSTOMER_SERVICE__();
    return;
  }

  const inMiniProgram = await getMiniProgramEnv();
  const miniProgram = getMiniProgramApi();
  if (inMiniProgram) {
    if (miniProgram?.navigateTo) {
      miniProgram.navigateTo({
        url: MINI_PROGRAM_CUSTOMER_SERVICE_PAGE,
      });
      return;
    }
  }

  throw new Error('当前环境未注入微信小程序 navigateTo 能力，无法打开客服页。');
};

export const requestWechatUserProfile = async (timeoutMs = 6000): Promise<WechatUserProfile> => {
  const queryUser = getWechatUserFromUrl();
  if (queryUser) {
    cacheWechatUser(queryUser);
    return queryUser;
  }

  const injectedUser = await getInjectedWechatUser();
  if (injectedUser) {
    cacheWechatUser(injectedUser);
    return injectedUser;
  }

  const inMiniProgram = await getMiniProgramEnv();
  if (!inMiniProgram) {
    const cachedUser = getCachedWechatUser();
    if (cachedUser) {
      return {
        ...cachedUser,
        source: 'cache',
      };
    }
    throw new Error('当前不在微信小程序 WebView 环境，无法获取微信用户信息。');
  }

  const miniProgram = getMiniProgramApi();
  if (!miniProgram?.postMessage) {
    throw new Error('当前小程序 WebView 未注入 postMessage 能力，无法请求微信用户信息。');
  }

  return new Promise<WechatUserProfile>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('等待小程序返回微信用户信息超时。'));
    }, timeoutMs);

    const handleResolvedUser = (payload: Partial<WechatUserProfile>) => {
      const user = normalizeWechatUser(payload, 'mini-program');
      if (!user) {
        cleanup();
        reject(new Error('小程序返回的微信用户信息不完整。'));
        return;
      }

      cacheWechatUser(user);
      cleanup();
      resolve(user);
    };

    const customEventHandler = (event: Event) => {
      const detail = (event as CustomEvent<Partial<WechatUserProfile>>).detail;
      handleResolvedUser(detail);
    };

    const messageEventHandler = (event: MessageEvent) => {
      const payload = event.data?.type === RESPONSE_EVENT ? event.data?.payload : null;
      if (payload) handleResolvedUser(payload);
    };

    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener(RESPONSE_EVENT, customEventHandler);
      window.removeEventListener('message', messageEventHandler);
      if (window.__FOOTBALL_RESOLVE_WECHAT_USER__ === handleResolvedUser) {
        delete window.__FOOTBALL_RESOLVE_WECHAT_USER__;
      }
    };

    window.__FOOTBALL_RESOLVE_WECHAT_USER__ = handleResolvedUser;
    window.addEventListener(RESPONSE_EVENT, customEventHandler);
    window.addEventListener('message', messageEventHandler);

    window.dispatchEvent(new CustomEvent(REQUEST_EVENT));
    miniProgram.postMessage({
      data: {
        type: REQUEST_EVENT,
        timestamp: Date.now(),
      },
    });
  });
};
