import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(process.cwd(), "apps/web/components/research/ResearchQueueClient.tsx"),
  "utf8"
);

assert.match(source, /Research queue · \{jobs\.length\}/);
assert.match(source, /function CompactWorkflowStatus/);
assert.match(source, /Completed in/);
assert.match(source, /OPEN ARTICLE/);
assert.match(source, /OPEN PROFILE/);
assert.match(source, /OPEN DOSSIER/);
assert.match(source, /the queue will keep working/);

assert.doesNotMatch(source, /function QueueSection/);
assert.doesNotMatch(source, /ResearchWorkflowChecklist/);
assert.doesNotMatch(source, /QUEUE CAPACITY/);
assert.doesNotMatch(source, /Current Job/);
assert.doesNotMatch(source, /Keep this tab open/);

console.log("Research queue UI verification passed.");
