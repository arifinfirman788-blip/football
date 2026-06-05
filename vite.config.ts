import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const backendTarget = process.env.VITE_PROXY_TARGET || 'http://10.0.0.34:35800';
  const arkTarget = process.env.VITE_ARK_PROXY_TARGET || 'https://ark.cn-beijing.volces.com';

  return {
    // 默认使用相对路径，适配小程序 web-view、静态子目录和任意嵌入场景。
    // 如果明确部署在固定子路径下，例如 GitHub Pages /football/，再通过 VITE_BASE_PATH 覆盖。
    base: process.env.VITE_BASE_PATH || './',
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
        '/ark-api': {
          target: arkTarget,
          changeOrigin: true,
          rewrite: (pathValue) => pathValue.replace(/^\/ark-api/, ''),
        },
      },
    },
  };
});
