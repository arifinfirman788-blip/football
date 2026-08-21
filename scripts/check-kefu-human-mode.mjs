import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../public/kefu/index.html", import.meta.url), "utf8");

const checks = [
  ["human mode hides scenario shortcuts", /\.human-chat-active \.scenario-grid\s*\{[\s\S]*?display:\s*none/s.test(html)],
  ["human mode hides shortcut container", /\.human-chat-active \.ask-panel\s*\{[\s\S]*?display:\s*none/s.test(html)],
  ["session controls update human mode class", /function updateSessionControls\([\s\S]*?document\.body\.classList\.toggle\("human-chat-active", Boolean\(serviceState\.humanActive\)\)/s.test(html)],
  ["submit question routes human messages", /async function submitQuestion\(text, source = "input"\)[\s\S]*?if \(serviceState\.humanActive\) \{[\s\S]*?sendHumanTextMessage\(question\)[\s\S]*?return;/s.test(html)],
  ["human input does not call dify directly", /function sendCurrentInput\(\)[\s\S]*?if \(serviceState\.humanActive\)[\s\S]*?sendHumanTextMessage\(value\)[\s\S]*?return;/s.test(html)],
  ["ending session restores normal mode", /function handleServiceSessionEnded[\s\S]*?serviceState\.humanActive = false[\s\S]*?updateSessionControls\(\)/s.test(html)],
];

const failures = checks.filter(([, passed]) => !passed);
if (failures.length) {
  console.error(`Kefu human mode checks failed (${failures.length}):`);
  failures.forEach(([name]) => console.error(`- ${name}`));
  process.exit(1);
}
console.log(`Kefu human mode checks passed (${checks.length}).`);
