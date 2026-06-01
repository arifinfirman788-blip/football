/**
 * 统一拼接 Vite BASE_URL。
 * GitHub Pages 部署在 /football/ 子目录下，图片路径必须通过此函数生成，避免线上 404。
 */
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
