import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('football');
const assetsDir = path.join(distDir, 'assets');
const htmlFile = path.join(distDir, 'index.html');
const versionFile = path.join(distDir, 'version.json');
const buildVersion = process.env.BUILD_VERSION || new Date().toISOString().replace(/[-:.TZ]/g, '');

const html = await readFile(htmlFile, 'utf8');
const assetFiles = await readdir(assetsDir);

const cssFileName = assetFiles.find((fileName) => fileName.endsWith('.css'));
const jsFileName = assetFiles.find((fileName) => fileName.endsWith('.js'));

// 从 Vite 产物中的静态资源地址推导公开部署路径。这样即使入口地址写成
// `/football?...`（没有末尾斜杠），版本文件仍会请求 `/football/version.json`，
// 而不会被 URL 相对路径规则错误解析为 `/version.json`。
const publicAssetPath = html.match(/<script\s+type="module"[^>]*src="([^"]+)"/)?.[1];
const publicBasePath = publicAssetPath
  ? `${path.posix.dirname(path.posix.dirname(new URL(publicAssetPath, 'https://build.local').pathname))}/`
  : '/football/';

if (!cssFileName) {
  throw new Error('No built CSS asset was found in football/assets.');
}

if (!jsFileName) {
  throw new Error('No built JS asset was found in football/assets.');
}

const css = await readFile(path.join(assetsDir, cssFileName), 'utf8');
const js = await readFile(path.join(assetsDir, jsFileName), 'utf8');

const htmlWithoutExternalAssets = html
  .replace(/<link\s+rel="stylesheet"[^>]*>/g, '')
  .replace(/<script\s+type="module"[^>]*src="[^"]+"[^>]*><\/script>/g, '');

const headCloseIndex = htmlWithoutExternalAssets.lastIndexOf('</head>');
const bodyCloseIndex = htmlWithoutExternalAssets.lastIndexOf('</body>');

if (headCloseIndex === -1 || bodyCloseIndex === -1) {
  throw new Error('football/index.html does not contain closing </head> or </body> tags.');
}

const withInlineCss = [
  htmlWithoutExternalAssets.slice(0, headCloseIndex),
  `<style>\n${css}\n</style>\n`,
  htmlWithoutExternalAssets.slice(headCloseIndex),
].join('');

const updatedBodyCloseIndex = withInlineCss.lastIndexOf('</body>');

// 微信小程序 WebView 可能长期复用旧页面。每次构建生成独立版本文件，
// 页面首次显示及从后台恢复时都绕过缓存校验；发现新版本后带版本号重载。
const versionBootstrap = `<script>
(function () {
  var currentVersion = ${JSON.stringify(buildVersion)};
  var versionUrl = new URL(${JSON.stringify(`${publicBasePath}version.json`)}, window.location.origin);
  function reloadWithVersion(nextVersion) {
    var nextUrl = new URL(window.location.href);
    if (nextUrl.searchParams.get('_v') === nextVersion) return;
    nextUrl.searchParams.set('_v', nextVersion);
    window.location.replace(nextUrl.toString());
  }
  function checkLatestVersion() {
    versionUrl.searchParams.set('_t', String(Date.now()));
    fetch(versionUrl.toString(), { cache: 'no-store' })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (data) {
        if (data && data.version && data.version !== currentVersion) reloadWithVersion(String(data.version));
      })
      .catch(function () {});
  }
  if (new URL(window.location.href).searchParams.get('_v') !== currentVersion) {
    reloadWithVersion(currentVersion);
  } else {
    checkLatestVersion();
  }
  window.addEventListener('pageshow', checkLatestVersion);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') checkLatestVersion();
  });
})();
</script>`;

const nextHtml = [
  withInlineCss.slice(0, updatedBodyCloseIndex),
  versionBootstrap,
  `<script>\n${js}\n</script>\n`,
  withInlineCss.slice(updatedBodyCloseIndex),
].join('');

await writeFile(htmlFile, nextHtml, 'utf8');
await writeFile(versionFile, `${JSON.stringify({ version: buildVersion })}\n`, 'utf8');
