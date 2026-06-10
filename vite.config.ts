import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const backendTarget = process.env.VITE_PROXY_TARGET || 'https://huangxiaoxi.rxhui.com/football';
  const arkTarget = process.env.VITE_ARK_PROXY_TARGET || 'https://ark.cn-beijing.volces.com';
  const wechatTicketTarget = process.env.VITE_WECHAT_TICKET_PROXY_TARGET || 'https://glsw-wdgz-libs.aihuangxiaoxi.com/rxqdata';
  const basePath = process.env.VITE_BASE_PATH || '/football/';
  const normalizedBasePath = basePath.replace(/\/+$/, '');

  return {
    // 当前默认部署在 /football/ 二级路径下。
    // 如果后续切回根路径或其他子路径，再通过 VITE_BASE_PATH 覆盖。
    base: basePath,
    build: {
      outDir: 'football',
      target: 'es2018',
      cssTarget: 'safari13',
      modulePreload: false,
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
        [`${normalizedBasePath}/api`]: {
          target: backendTarget,
          changeOrigin: true,
          rewrite: (pathValue) => pathValue.replace(new RegExp(`^${normalizedBasePath}`), ''),
        },
        '/ark-api': {
          target: arkTarget,
          changeOrigin: true,
          rewrite: (pathValue) => pathValue.replace(/^\/ark-api/, ''),
        },
        [`${normalizedBasePath}/ark-api`]: {
          target: arkTarget,
          changeOrigin: true,
          rewrite: (pathValue) => pathValue.replace(new RegExp(`^${normalizedBasePath}\/ark-api`), ''),
        },
        '/wechat-api': {
          target: wechatTicketTarget,
          changeOrigin: true,
          rewrite: (pathValue) => pathValue.replace(/^\/wechat-api/, ''),
        },
        [`${normalizedBasePath}/wechat-api`]: {
          target: wechatTicketTarget,
          changeOrigin: true,
          rewrite: (pathValue) => pathValue.replace(new RegExp(`^${normalizedBasePath}\/wechat-api`), ''),
        },
      },
    },
  };
});
