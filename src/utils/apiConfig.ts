const PRODUCTION_ORIGIN = (
  import.meta.env.VITE_PRODUCTION_ORIGIN || 'https://glsw-wdgz-libs.aihuangxiaoxi.com'
).replace(/\/+$/, '');
const APP_BASE_PATH = '/football';

/** 业务接口与微信 ticket 等服务共用的 /football 前缀。 */
export const SERVICE_BASE_URL = import.meta.env.PROD
  ? `${PRODUCTION_ORIGIN}${APP_BASE_PATH}`
  : APP_BASE_PATH;

export { APP_BASE_PATH };

export const API_BASE_URL = `${SERVICE_BASE_URL}/api`;

export const ARK_PROXY_PATH = `${SERVICE_BASE_URL}/ark-api/api/v3/bots/chat/completions`;
