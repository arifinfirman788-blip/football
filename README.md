<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/89328e9f-b947-4d58-b503-397849946fcf

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Set the needed keys in [.env.local](.env.local)
3. Run the app: `npm run dev`

## GitHub Pages + AI

GitHub Pages 只能托管静态前端，不能直接运行 `server.ts` 里的 `/api/predict`。
要让页面里的 AI 功能在 Pages 里可用，请把 Node API 单独部署到 Render、Railway、Vercel 或 Cloudflare Workers，再在仓库变量里设置 `VITE_AI_API_BASE_URL`，同时给后端设置 `ALLOWED_ORIGINS`。
