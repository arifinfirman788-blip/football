/**
 * AI 接口地址：
 * - 本地联调可留空，直接请求同源 Express 服务；
 * - GitHub Pages 只有静态文件，必须配置 VITE_AI_API_BASE_URL 指向独立部署的后端。
 */
const apiBaseUrl = import.meta.env.VITE_AI_API_BASE_URL?.replace(/\/+$/, '') || '';

export const apiUrl = (path: string) => `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
