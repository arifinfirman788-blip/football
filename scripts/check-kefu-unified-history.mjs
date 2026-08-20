import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../public/kefu/index.html', import.meta.url), 'utf8');

const checks = [
  ['unified history state exists', /unifiedHistoryMessages:\s*\[\]/s],
  ['unified history key builder exists', /function unifiedHistoryMessageKey\(/s],
  ['unified history merge exists', /function mergeUnifiedHistoryMessages\(/s],
  ['unified history sort is stable', /function compareUnifiedHistoryMessages[\s\S]*?timestamp[\s\S]*?sequence/s],
  ['ai history normalizes to unified source', /function normalizeAiHistoryMessages[\s\S]*?source:\s*"ai"/s],
  ['human history normalizer exists', /function normalizeHumanHistoryMessages[\s\S]*?source:\s*"human"/s],
  ['unified history renderer exists', /function renderUnifiedHistoryMessage\(/s],
  ['source transition separators exist', /function unifiedSourceTransitionHtml[\s\S]*?已转接人工客服[\s\S]*?继续由黄小西为您服务/s],
  ['recent histories load together', /function loadUnifiedRecentHistory[\s\S]*?Promise\.allSettled/s],
  ['active human restore preserves ai history', (source) => !/activeConversation[\s\S]{0,900}?chatList\.innerHTML\s*=\s*""[\s\S]{0,900}?queryKefuMessages/s.test(source)],
  ['ai conversation navigation does not replace timeline', (source) => !/function loadConversationMessages[\s\S]{0,900}?chatList\.innerHTML\s*=\s*""/s.test(source)],
  ['history pagination uses unified loader', /function loadOlderHistoryMessages[\s\S]*?loadOlderUnifiedHistory/s],
  ['realtime human message registers unified item', /function handleKefuMessagePacket[\s\S]*?registerUnifiedRealtimeMessage/s],
];

const failures = checks.filter(([, matcher]) => (
  matcher instanceof RegExp ? !matcher.test(html) : !matcher(html)
));

if (failures.length) {
  console.error(`Kefu unified history checks failed (${failures.length}):`);
  failures.forEach(([name]) => console.error(`- ${name}`));
  process.exit(1);
}

console.log(`Kefu unified history checks passed (${checks.length}).`);
