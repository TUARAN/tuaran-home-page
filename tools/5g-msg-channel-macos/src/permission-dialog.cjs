'use strict';
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const runFile = promisify(execFile);
// Untrusted tool parameters are argv data, never interpolated into AppleScript.
const SCRIPT = `on run argv
  try
    set answer to display dialog (item 1 of argv) with title "5G 消息 · WorkBuddy 权限确认" buttons {"拒绝", "仅允许一次"} default button "拒绝" cancel button "拒绝" giving up after 45
    if gave up of answer then return "timeout"
    if button returned of answer is "仅允许一次" then return "allow_once"
    return "deny"
  on error number -128
    return "deny"
  end try
end run`;
function createPermissionPrompter({ run = runFile, platform = process.platform, onChange = () => {} } = {}) {
  let current = null, last = null;
  async function request(params, { signal } = {}) {
    const once = params?.options?.find(o => o.kind === 'allow_once');
    const raw = params?.toolCall?.rawInput;
    if (platform !== 'darwin' || !once || !raw || signal?.aborted || current) return null;
    const detail = JSON.stringify(raw, null, 2);
    // Never approve a command/path hidden by truncation.
    if (!detail || detail.length > 6000) { last = { state: 'denied', reason: 'details_too_large' }; return null; }
    current = { state: 'awaiting_local_confirmation', startedAt: new Date().toISOString() };
    onChange(current);
    try {
      const text = '手机消息请求在这台 Mac 上执行操作。请核对全部参数。\n仅允许一次不会更改全局权限，45 秒未确认将拒绝。\n\n' + detail;
      const result = await run('/usr/bin/osascript', ['-e', SCRIPT, '--', text], { timeout: 48000, maxBuffer: 8192, signal });
      const answer = result.stdout.trim();
      const allowed = answer === 'allow_once' && !signal?.aborted;
      last = { state: allowed ? 'allowed_once' : 'denied', reason: allowed ? 'user_allowed' : answer === 'timeout' ? 'timeout' : 'user_denied', finishedAt: new Date().toISOString() };
      return allowed ? once.optionId : null;
    } catch (e) {
      last = { state: 'denied', reason: signal?.aborted ? 'task_cancelled' : 'dialog_unavailable', finishedAt: new Date().toISOString() };
      return null;
    } finally { current = null; onChange(last); }
  }
  return { request, status: () => ({ pending: current, last }) };
}
module.exports = { createPermissionPrompter };
