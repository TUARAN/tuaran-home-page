const test = require("node:test");
const assert = require("node:assert/strict");

const Core = require("./automation-core.js");

test("normalizes settings into safe limits", () => {
  assert.deepEqual(Core.normalizeSettings({ maxItems: 0, actionDelayMs: 1, stepTimeoutMs: 999999 }), {
    maxItems: 1,
    actionDelayMs: 300,
    stepTimeoutMs: 60000
  });
});

test("builds stable row fingerprints from normalized cell text", () => {
  assert.equal(
    Core.rowFingerprint(["  关于低代码的通知 ", "部门收文", "杨文婷\n", "10-08"]),
    "关于低代码的通知 | 部门收文 | 杨文婷 | 10-08"
  );
});

test("advances through one complete item lifecycle", () => {
  const phases = ["list"];
  for (let index = 0; index < 4; index += 1) phases.push(Core.nextPhase(phases.at(-1)));
  assert.deepEqual(phases, ["list", "detail", "submit-dialog", "completion", "list"]);
});

test("selectors retain the supplied stable DOM contracts", () => {
  assert.match(Core.SELECTORS.title, /title/);
  assert.match(Core.SELECTORS.oneKeyButton, /onekeySubmit/);
  assert.equal(Core.SELECTORS.finalSubmitButton, ".onekey-submit-button");
});
