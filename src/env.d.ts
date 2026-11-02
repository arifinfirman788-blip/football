/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DIFY_API_BASE_URL?: string;
  readonly VITE_AI_APP_KEY?: string;
  readonly VITE_AI_APP_SECRET?: string;
  readonly VITE_AI_PREVIEW?: 'test' | 'production';
  readonly VITE_HXX_AUTH_BASE_URL?: string;
  readonly VITE_KEFU_API_BASE_URL?: string;
  readonly VITE_KEFU_WS_URL?: string;
  readonly VITE_KEFU_SURVEY_URL?: string;
  readonly VITE_KEFU_UPLOAD_BASE_URL?: string;
  readonly VITE_MEMBER_ACCESS_TOKEN_URL?: string;
  readonly VITE_MEMBER_USER_PROFILE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>;
  export default component;
}
