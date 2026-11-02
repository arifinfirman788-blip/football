import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../src/kefu/Kefu.vue', import.meta.url), 'utf8');

const checks = [
  ['wrapped plat_chat_id is inherited by inner collect actions', /function normalizeMainQaActionEvents[\s\S]*?inheritedSourceId[\s\S]*?plat_chat_id:\s*sourceId[\s\S]*?collect\(parsed\.action_answer,\s*sourceId\)/s],
  ['stream action wrapper forwards plat_chat_id', /normalizeMainQaActionEvents\(\{[\s\S]*?plat_chat_id:\s*event\.plat_chat_id[\s\S]*?action_answer:\s*event\.action_answer/s],
  ['history action wrapper forwards plat_chat_id', /normalizeMainQaActionEvents\(\{[\s\S]*?plat_chat_id:\s*message\.plat_chat_id[\s\S]*?action_answer:\s*message\.action_answer/s],
  ['history render immediately restores itinerary collect status', /function renderUnifiedHistoryTimeline[\s\S]*?mountMainQaAnswerCards\(chatList,\s*\{\s*skipItineraryStatus:\s*true\s*\}\);\s*void syncMainQaItineraryCollectStatus\(chatList\)/s],
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
  ['conversation request sends the same platform-suffixed user and userId', /const conversationUser = resolveAiUser\(payload\.user\)[\s\S]*?\/conversations\?user=\$\{encodeURIComponent\(conversationUser\)\}&userId=\$\{encodeURIComponent\(conversationUser\)\}/s],
  ['message history sends the same platform-suffixed user and userId', /const messageUser = resolveAiUser\(payload\.user\)[\s\S]*?\/messages\?user=\$\{encodeURIComponent\(messageUser\)\}&userId=\$\{encodeURIComponent\(messageUser\)\}/s],
  ['chat message sends the same platform-suffixed user and userId', /const messageUser = resolveAiUser\(\)[\s\S]*?user:\s*messageUser,\s*userId:\s*messageUser/s],
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
