import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../../tools/x-reply-clipboard-extension/background.js', import.meta.url), 'utf8');
function context() {
  const sandbox = vm.createContext({
    SHARED_FOLLOW_MODES: ['mutual-targetFollow', 'mutual-followBack'],
    recordScheduleSegment() {},
    normalizedTaskRules: rules => rules,
    saveTaskSchedule: async () => {},
    applySharedFollowWait() { throw new Error('Exhaustion must not trigger shared rate-limit cooldown'); }
  });
  for (const name of ['terminalRunReason', 'limitRunReason', 'finishTerminalTask']) {
    const match = source.match(new RegExp(`(?:async )?function ${name}\\([\\s\\S]*?\\n\\}`));
    assert.ok(match, name);
    vm.runInContext(match[0], sandbox);
  }
  return sandbox;
}
test('Retry with exhausted sources releases scheduler slot and clears restart state', async () => {
  const c = context();
  const mode = 'mutual-targetFollow';
  const reason = '粉丝列表显示 Retry，本批没有下一个可换的人';
  const plan = { current: mode, startedAt: 100, rules: { [mode]: { minGapMs: 60000 } }, items: {
    [mode]: { reloadAttempts: 1, lastStartError: reason },
    'mutual-followBack': { resumeAt: 0 }
  } };
  assert.equal(await c.finishTerminalTask(plan, mode, reason, 1000), plan);
  assert.equal(plan.current, '');
  assert.equal(plan.startedAt, 0);
  assert.equal(plan.items[mode].reloadAttempts, 0);
  assert.equal(plan.items[mode].lastStartError, '');
  assert.equal(plan.items[mode].resumeAt, 61000);
  assert.equal(plan.items['mutual-followBack'].resumeAt, 0);
});
test('Retry while another source is available remains navigational', () => {
  assert.equal(context().terminalRunReason('粉丝列表显示 Retry，转到 @next 的粉丝列表'), false);
});
