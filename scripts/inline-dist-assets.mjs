import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('football');
const assetsDir = path.join(distDir, 'assets');
const htmlFile = path.join(distDir, 'index.html');

const html = await readFile(htmlFile, 'utf8');
const assetFiles = await readdir(assetsDir);

const cssFileName = assetFiles.find((fileName) => fileName.endsWith('.css'));
const jsFileName = assetFiles.find((fileName) => fileName.endsWith('.js'));

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

const nextHtml = [
  withInlineCss.slice(0, updatedBodyCloseIndex),
  `<script>\n${js}\n</script>\n`,
  withInlineCss.slice(updatedBodyCloseIndex),
].join('');

await writeFile(htmlFile, nextHtml, 'utf8');
