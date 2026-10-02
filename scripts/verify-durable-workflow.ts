import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { researchWorkflowPlan } from "../packages/research/src/workflow-plan";
import { isAuthorizedWorkerCallback } from "../apps/web/lib/research/workflow/callback-auth";

const require = createRequire(import.meta.url);
const moduleLoader = require("node:module") as {
  _resolveFilename: (request: string, parent: unknown, isMain: boolean, options?: unknown) => string;
};
const originalResolveFilename = moduleLoader._resolveFilename;
const serverOnlyStubPath = join(process.cwd(), "scripts/server-only-stub.cjs");
moduleLoader._resolveFilename = function resolveServerOnly(
  request: string,
  parent: unknown,
  isMain: boolean,
  options?: unknown
) {
  if (request === "server-only") return serverOnlyStubPath;
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

async function verify() {
  const workflow = await import("../apps/web/lib/research/workflow/index");
  const triggerModule = await import("../apps/web/lib/research/workflow/trigger");

  assert.equal(workflow.selectedResearchWorkflowProvider(undefined), "local");
  assert.equal(workflow.selectedResearchWorkflowProvider("trigger"), "trigger");
  assert.throws(() => workflow.selectedResearchWorkflowProvider("unknown"), /Unsupported/);

  const stages = researchWorkflowPlan.map((step) => step.stage);
  assert.equal(stages[0], "resolving_entity");
  assert.ok(stages.indexOf("verifying_claims") < stages.indexOf("publishing_article"));
  assert.ok(stages.indexOf("public_research_ready") < stages.indexOf("finalizing_dossier"));
  assert.equal(stages.at(-1), "done");

  const secret = "test-worker-callback-secret-123456";
  assert.equal(isAuthorizedWorkerCallback(`Bearer ${secret}`, secret), true);
  assert.equal(isAuthorizedWorkerCallback("Bearer wrong", secret), false);
  assert.equal(isAuthorizedWorkerCallback(`Bearer ${secret}`, "short"), false);

  const calls: string[] = [];
  const dispatcher = new triggerModule.TriggerWorkflowDispatcher({
    async trigger(input) {
      calls.push(`trigger:${input.idempotencyKey}`);
      return { id: "run_test" };
    },
    async cancel(runId) {
      calls.push(`cancel:${runId}`);
    }
  });
  const previousSecret = process.env.TRIGGER_SECRET_KEY;
  process.env.TRIGGER_SECRET_KEY = "tr_dev_test";
  try {
    assert.deepEqual(
      await dispatcher.dispatchResearch({ jobId: "job_1", query: "Acme", idempotencyKey: "entity:acme" }),
      { runId: "run_test" }
    );
    await dispatcher.cancelResearch("run_test");
  } finally {
    if (previousSecret === undefined) delete process.env.TRIGGER_SECRET_KEY;
    else process.env.TRIGGER_SECRET_KEY = previousSecret;
  }
  assert.deepEqual(calls, ["trigger:entity:acme", "cancel:run_test"]);

  const taskSource = readFileSync(
    join(process.cwd(), "apps/worker/src/trigger/research.ts"),
    "utf8"
  );
  assert.match(taskSource, /concurrencyLimit:\s*3/);
  assert.match(taskSource, /maxAttempts:\s*3/);
  assert.match(taskSource, /DEEPTECHLY_WORKER_CALLBACK_SECRET/);
  assert.match(taskSource, /AbortSignal\.timeout/);

  console.log("Durable workflow verification passed.");
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
