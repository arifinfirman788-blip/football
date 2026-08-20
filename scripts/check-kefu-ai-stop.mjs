import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../public/kefu/index.html", import.meta.url), "utf8");

const checks = [
  ["ai streaming state exists", /aiStreaming:\s*false/s],
  ["abort controller state exists", /aiAbortController:\s*null/s],
  ["send button state updater exists", /function updateSendButtonState\(/s],
  ["stop mode keeps send button dimensions", /\.send\.stop-mode[\s\S]*?width:\s*42px[\s\S]*?height:\s*42px[\s\S]*?border-radius:\s*50%/s],
  ["stop mode uses icon only", (source) => {
    const start = source.indexOf("function updateSendButtonState");
    const end = source.indexOf("function clearAiStreamingState", start);
    const block = source.slice(start, end);
    return block.includes('data-lucide="square"') && !block.includes("<span>停止</span>");
  }],
  ["stop action exists", /function stopAiStreaming\(/s],
  ["stream request receives abort signal", /function streamDifyChat[\s\S]*?signal:\s*handlers\.signal/s],
  ["submit prevents concurrent ai questions", /function submitQuestion[\s\S]*?chatState\.aiStreaming[\s\S]*?return/s],
  ["submit creates abort controller", /function submitQuestion[\s\S]*?new AbortController\(\)/s],
  ["abort error is handled separately", /AbortError/s],
  ["agent chat preserves abort errors", (source) => {
    const start = source.indexOf("agentChat(payload");
    const end = source.indexOf("queryConversations(payload", start);
    return /error\?\.name\s*===\s*"AbortError"[\s\S]*?throw error/s.test(source.slice(start, end));
  }],
  ["send button stops ai before reading input", /function sendCurrentInput[\s\S]*?serviceState\.humanActive[\s\S]*?chatState\.aiStreaming[\s\S]*?stopAiStreaming/s],
  ["human send remains unchanged", /function sendCurrentInput[\s\S]*?serviceState\.humanActive[\s\S]*?sendHumanTextMessage/s],
];

const failures = checks.filter(([, matcher]) => (
  matcher instanceof RegExp ? !matcher.test(html) : !matcher(html)
));
if (failures.length) {
  console.error(`Kefu AI stop checks failed (${failures.length}):`);
  failures.forEach(([name]) => console.error(`- ${name}`));
  process.exit(1);
}

console.log(`Kefu AI stop checks passed (${checks.length}).`);
