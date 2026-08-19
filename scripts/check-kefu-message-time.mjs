import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../public/kefu/index.html', import.meta.url), 'utf8');

assert.match(
  html,
  /function formatMessageTime\([^)]*\)\s*\{[^}]*formatConversationTime\(date\)/s,
  'API history messages should use the unified conversation time formatter',
);
assert.match(
  html,
  /function historyMessageHtml\([^)]*\)\s*\{[\s\S]*?formatConversationTime\(localMessageDate\)/,
  'Local history messages should use the unified conversation time formatter',
);

const extractFunction = (name) => {
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing function ${name}`);

  const bodyStart = html.indexOf('{', start);
  let depth = 0;
  let quote = '';
  let escaped = false;

  for (let index = bodyStart; index < html.length; index += 1) {
    const character = html[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      continue;
    }
    if (character === '{') depth += 1;
    if (character === '}') depth -= 1;
    if (depth === 0) return html.slice(start, index + 1);
  }

  throw new Error(`Unclosed function ${name}`);
};

const source = [
  extractFunction('formatClock'),
  extractFunction('formatConversationTime'),
  'globalThis.formatConversationTime = formatConversationTime;',
].join('\n');

const context = vm.createContext({ Date });
vm.runInContext(source, context);

const now = new Date(2026, 7, 19, 12, 0, 0);

assert.equal(
  context.formatConversationTime(new Date(2026, 7, 19, 9, 5, 0), now),
  '09:05',
  'Today messages should show time only',
);
assert.equal(
  context.formatConversationTime(new Date(2026, 7, 18, 23, 7, 0), now),
  '2026-08-18 23:07',
  'Earlier messages should show full local date and time',
);
assert.equal(
  context.formatConversationTime(new Date(2025, 11, 31, 8, 9, 0), now),
  '2025-12-31 08:09',
  'Historical messages should retain the year',
);

console.log('Kefu message time checks passed (3).');
