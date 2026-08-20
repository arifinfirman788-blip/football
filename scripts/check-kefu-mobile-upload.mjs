import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../public/kefu/index.html", import.meta.url), "utf8");

const checks = [
  ["socket recovery helper exists", /function ensureKefuSocketReady\(/s],
  ["socket recovery reconnects before send", /function ensureKefuSocketReady[\s\S]*?kefuSocket\.login\(/s],
  ["image send waits for socket recovery", /function sendHumanImageFile[\s\S]*?ensureKefuSocketReady\(\)[\s\S]*?api\.sendHumanMessage/s],
  ["text send waits for socket recovery", /function sendHumanTextMessage[\s\S]*?ensureKefuSocketReady\(\)[\s\S]*?api\.sendHumanMessage/s],
  ["mobile upload reports actionable connection error", /客服连接已断开|正在恢复客服连接|图片发送失败/s],
];

const failures = checks.filter(([, matcher]) => !matcher.test(html));
if (failures.length) {
  console.error(`Kefu mobile upload checks failed (${failures.length}):`);
  failures.forEach(([name]) => console.error(`- ${name}`));
  process.exit(1);
}

console.log(`Kefu mobile upload checks passed (${checks.length}).`);
