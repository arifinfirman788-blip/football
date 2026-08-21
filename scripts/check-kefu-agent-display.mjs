import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../public/kefu/index.html", import.meta.url), "utf8");

const checks = [
  ["agent display uses customer label", /function formatAgentDisplay\(agent = \{\}\)[\s\S]*?return workNumber \? `客服 \$\{workNumber\}`/s.test(html)],
  ["history agent keeps work number", /agent:\s*message\.fromUser \|\| \{[\s\S]*?username:\s*message\.fromUserUserName \|\| message\.fromUserUsername \|\| message\.fromUserAgentNo/s.test(html)],
  ["realtime agent keeps work number", /agent:\s*\{[\s\S]*?username:\s*packet\.fromUserUserName \|\| packet\.fromUserUsername \|\| packet\.fromUserAgentNo/s.test(html)],
  ["image realtime agent keeps work number", /humanAgentImageMessageHtml\([\s\S]*?username:\s*packet\.fromUserUserName \|\| packet\.fromUserUsername \|\| packet\.fromUserAgentNo/s.test(html)],
  ["display does not use nickname first", !/return agent\.nickname \|\| agent\.username/s.test(html)],
];

const failures = checks.filter(([, passed]) => !passed);
if (failures.length) {
  console.error(`Kefu agent display checks failed (${failures.length}):`);
  failures.forEach(([name]) => console.error(`- ${name}`));
  process.exit(1);
}
console.log(`Kefu agent display checks passed (${checks.length}).`);
