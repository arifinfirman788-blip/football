# Football H5 Frontend

这是一个基于 `React + TypeScript + Vite` 的世界杯竞猜 H5 前端项目。

当前版本不包含仓库内 `server` 代码，但前端已经接入业务接口，并统一改为通过本地代理访问后端与 Ark SSE。

## Run Locally

前提：Node.js 18+

1. 安装依赖：`npm install`
2. 启动开发环境：`npm run dev`
3. 构建生产包：`npm run build`
4. 本地预览构建结果：`npm run preview`

## Local Proxy

开发环境下，前端不再直连后端地址，而是统一走本地代理：

- 业务接口：`/api/*`
- Ark SSE：`/ark-api/*`

`vite.config.ts` 默认代理目标：

- `VITE_PROXY_TARGET=http://10.0.0.34:35800`
- `VITE_ARK_PROXY_TARGET=https://ark.cn-beijing.volces.com`

如需覆盖，可在启动前设置环境变量，例如：

```bash
VITE_PROXY_TARGET="http://127.0.0.1:35800" \
VITE_ARK_PROXY_TARGET="https://ark.cn-beijing.volces.com" \
npm run dev
```

注意：Vite 代理只在本地开发服务器生效。线上部署时，如果仍希望使用 `/api` 和 `/ark-api`，需要由 Nginx、网关或宿主服务提供同样的转发规则。

## Current Scope

- 竞猜首页
- 赛程页
- 排行页
- AI 预测页（本地知识库模式）
- 观影地点页
- 奖励规则页

## Notes

- AI 页当前不调用后端接口，使用仓库内置数据生成回答。
- 竞猜记录和“我的关注”会保存到浏览器 `localStorage`。
- 如果后续要恢复实时 AI 或真实赛果，只需要额外接入独立 API，不影响当前前端结构。
- 默认构建会把 CSS 和 JS 内联进 `index.html`，尽量降低微信小程序 `web-view` 对外部静态资源加载失败的影响。

## WeChat Mini Program WebView Integration

竞猜页点击“确定提交竞猜”时，H5 会先请求宿主小程序返回当前微信用户资料。

H5 发出的请求消息：

```ts
{
  type: 'football:request-wechat-user',
  timestamp: Date.now()
}
```

宿主小程序需要把以下字段回传给 H5：

```ts
{
  unionId: string,
  nickname: string,
  avatarUrl: string
}
```

H5 支持以下任一回传方式：

```ts
window.__FOOTBALL_RESOLVE_WECHAT_USER__?.({
  unionId,
  nickname,
  avatarUrl,
});
```

```ts
window.dispatchEvent(new CustomEvent('football:wechat-user-response', {
  detail: { unionId, nickname, avatarUrl }
}));
```

```ts
window.postMessage({
  type: 'football:wechat-user-response',
  payload: { unionId, nickname, avatarUrl }
}, '*');
```

## Ark Bot

问答预测页当前通过本地代理路径 `/ark-api/api/v3/bots/chat/completions` 请求 Ark SSE。
