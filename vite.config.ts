import vue from '@vitejs/plugin-vue';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

const DEFAULT_PRODUCTION_ORIGIN = 'https://glsw-wdgz-libs.aihuangxiaoxi.com';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const productionOrigin = (env.VITE_PRODUCTION_ORIGIN || DEFAULT_PRODUCTION_ORIGIN).replace(/\/+$/, '');
  const backendTarget = env.VITE_PROXY_TARGET || `${productionOrigin}/football`;
  const arkTarget = env.VITE_ARK_PROXY_TARGET || 'https://ark.cn-beijing.volces.com';
  const wechatTicketTarget = env.VITE_WECHAT_TICKET_PROXY_TARGET || `${productionOrigin}/football`;
  // 与 travel-client 的 H5 环境一致，为 gkh SSO 登录和用户信息接口提供同源代理。
  // 必须与 travel-client 的 h5pre/h5prod 保持同一套网关；
  // 非 libs 域会落到另一套用户/行程数据，导致“采纳成功”后列表查不到。
  const hxxAuthTarget = env.VITE_HXX_AUTH_PROXY_TARGET || 'https://glsw-wdgz-libs.aihuangxiaoxi.com/rxqdata/authAdminService';
  const basePath = env.VITE_BASE_PATH || '/football/';
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
    plugins: [vue()],
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
        '/hxx/authAdminService': {
          target: hxxAuthTarget,
          changeOrigin: true,
          rewrite: (pathValue) => pathValue.replace(/^\/hxx\/authAdminService\/?/, '/'),
        },
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
        '/asrTaskService': {
          target: wechatTicketTarget,
          changeOrigin: true,
          rewrite: (pathValue) => pathValue.replace(/^\/asrTaskService/, '/asrTaskService'),
        },
        [`${normalizedBasePath}/asrTaskService`]: {
          target: wechatTicketTarget,
          changeOrigin: true,
          rewrite: (pathValue) => pathValue.replace(new RegExp(`^${normalizedBasePath}\/asrTaskService`), '/asrTaskService'),
        },
      },
    },
  };
});
