import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../public/kefu/index.html", import.meta.url), "utf8");
const mappingDoc = await readFile(new URL("../docs/emoji/客服系统表情映射确认方案.md", import.meta.url), "utf8");
const mappingRows = [...mappingDoc.matchAll(/^\|\s*(\d+)\s*\|\s*`(\[[^`]+\])`\s*\|.*?\|\s*(\S+)\s*\|\s*(高|中|低|文本)\s*\|/gm)];
const uniqueReverseRows = [...new Map(mappingRows.map(([, , token, emoji]) => [emoji, [token, emoji]])).values()];

const checks = [
  ["forward emoji map exists", /const kefuEmojiMap\s*=\s*new Map\(\[/s.test(html)],
  ["reverse emoji map exists", /const kefuEmojiReverseMap\s*=\s*new Map\(/s.test(html)],
  ["complete document has 105 rows", mappingRows.length === 105],
  ["all document mappings are in forward map", mappingRows.every(([, , token, emoji]) => html.includes('["' + token + '", "' + emoji + '"]'))],
  ["all unique emojis have reverse mappings", uniqueReverseRows.every(([token, emoji]) => html.includes('["' + emoji + '", "' + token + '"]'))],
  ["decode helper exists", /function decodeKefuEmoji\(/s.test(html)],
  ["encode helper exists", /function encodeKefuEmoji\(/s.test(html)],
  ["human send encodes content", /function sendHumanTextMessage[\s\S]*?content:\s*encodeKefuEmoji\(text\)/s.test(html)],
  ["human realtime decodes text", /function handleKefuMessagePacket[\s\S]*?decodeKefuEmoji\(packet\.content\)/s.test(html)],
  ["human history decodes text", /function normalizeHumanHistoryMessages[\s\S]*?decodeKefuEmoji\(/s.test(html)],
  ["supported emoji panel remains", (html.match(/data-emoji=/g) || []).length === 10],
  ["cool and watermelon are in panel", html.includes('data-emoji="😎"') && html.includes('data-emoji="🍉"')]
];

const failures = checks.filter(([, passed]) => !passed);
if (failures.length) {
  console.error("Kefu emoji mapping checks failed (" + failures.length + "):");
  failures.forEach(([name]) => console.error("- " + name));
  process.exit(1);
}
console.log("Kefu emoji mapping checks passed (" + checks.length + ").");
