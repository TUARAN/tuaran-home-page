import { chmod, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { AcpClient, MockAcpClient } from './acp-client.mjs';
import { HardwareBridge } from './bridge.mjs';
import { MockWorkBuddyClient, WorkBuddyClient } from './workbuddy-client.mjs';

export const HARMLESS_PROMPT = '请只回复 PROBE_OK，不要调用工具。';

export const BACKEND_MATRIX = Object.freeze([
  {
    id: 'codebuddy-cli',
    label: 'MCP + CLI / CodeBuddy Runs',
    smsAsEntry: true,
    smsAsTool: false,
    sessionLocation: 'local-cli',
    entersDesktopChat: false,
    runsWithoutDesktop: false,
    permissionSurface: 'codebuddy-cli',
  },
  {
    id: 'local-acp',
    label: 'MCP + 本机 ACP',
    smsAsEntry: true,
    smsAsTool: false,
    sessionLocation: 'workbuddy-desktop-session',
    entersDesktopChat: true,
    runsWithoutDesktop: false,
    permissionSurface: 'workbuddy-desktop',
  },
  {
    id: 'official-acp',
    label: '官方硬件接入 ACP',
    smsAsEntry: true,
    smsAsTool: false,
    sessionLocation: 'workbuddy-cloud-task',
    entersDesktopChat: false,
    runsWithoutDesktop: true,
    permissionSurface: 'acp-bridge-ui',
  },
]);

function check(ok, extra = {}) {
  return { ok, ...extra };
}

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  const copy = {};
  for (const [key, entry] of Object.entries(value)) {
    if (/^(token|access_token|refresh_token|client_secret|authorization|password)$/i.test(key) && entry) {
      copy[key] = '[redacted]';
    } else {
      copy[key] = redact(entry);
    }
  }
  return copy;
}

async function runCheck(name, fn) {
  try {
    return { name, ...await fn() };
  } catch (error) {
    return { name, ok: false, error: error.message };
  }
}

export async function runOfficialProbe({
  config,
  tokenStore,
  workbuddy,
  acp,
  prompt = HARMLESS_PROMPT,
  sendLocalMessage = false,
  testPhone = '',
} = {}) {
  const mock = config.mode === 'mock';
  const client = workbuddy || (mock
    ? new MockWorkBuddyClient()
    : new WorkBuddyClient({ config, tokenStore }));
  const acpClient = acp || (mock ? new MockAcpClient() : new AcpClient());
  const bridge = new HardwareBridge({ workbuddy: client, acp: acpClient });
  const checks = [];

  checks.push(await runCheck('oauth', async () => {
    if (mock) return check(true, { authorized: true, mode: 'mock' });
    const token = await tokenStore.read();
    if (!token?.access_token) return check(false, { authorized: false, error: '尚未完成 WorkBuddy OAuth 授权' });
    return check(true, { authorized: true, hasRefreshToken: Boolean(token.refresh_token) });
  }));

  const scopes = await client.grantedScopes().catch(() => []);
  checks.push(check(scopes.includes('user.task.readable') && scopes.includes('user.task.invokable'), {
    name: 'scopes',
    granted: scopes,
  }));

  if (scopes.includes('user.profile.readable')) {
    checks.push(await runCheck('profile', async () => {
      const profile = await client.getProfile();
      return check(Boolean(profile && typeof profile === 'object'), {
        hasNickname: Boolean(profile?.nickname),
        hasAvatar: Boolean(profile?.avatar),
      });
    }));
  } else {
    checks.push({ name: 'profile', ok: true, skipped: true, reason: '当前授权未包含 user.profile.readable' });
  }

  if (scopes.includes('user.contact.readable') && testPhone) {
    checks.push(await runCheck('phoneVerification', async () => {
      const result = await client.verifyPhone(testPhone);
      return check(typeof result?.matched === 'boolean', { matched: result?.matched === true });
    }));
  } else {
    checks.push({
      name: 'phoneVerification',
      ok: true,
      skipped: true,
      reason: scopes.includes('user.contact.readable')
        ? '未配置仅用于本机烟测的 WORKBUDDY_TEST_PHONE'
        : '当前授权未包含 user.contact.readable',
    });
  }

  checks.push(await runCheck('listTasks', async () => {
    const listed = await client.listTasks(1, 5);
    const tasks = listed?.tasks || listed?.data?.tasks || [];
    return check(true, { count: Array.isArray(tasks) ? tasks.length : 0 });
  }));

  let taskId = null;
  checks.push(await runCheck('createTask', async () => {
    const task = await client.createTask({ prompt, name: 'sms-channel-probe' });
    const unwrapped = task?.task_id ? task : task?.data;
    taskId = unwrapped?.task_id;
    if (!taskId) return check(false, { error: '创建任务未返回 task_id' });
    return check(true, { taskId });
  }));

  checks.push(await runCheck('getTask', async () => {
    if (!taskId) return check(false, { skipped: true, error: '没有 task_id' });
    const task = await client.getTask(taskId);
    const unwrapped = task?.link || task?.token ? task : task?.data;
    return check(Boolean(unwrapped?.link && unwrapped?.token), {
      hasLink: Boolean(unwrapped?.link),
      hasToken: Boolean(unwrapped?.token),
    });
  }));

  checks.push(await runCheck('acp', async () => {
    if (!taskId) return check(false, { skipped: true, error: '没有 task_id' });
    await bridge.connectSession(taskId);
    const result = await acpClient.prompt(prompt);
    return check(Boolean(result), {
      stopReason: result?.stopReason || null,
      hasText: Boolean(result?.text),
    });
  }));

  const canReadAssistant = scopes.includes('user.localassistant.readable');
  const canInvokeAssistant = scopes.includes('user.localassistant.invokable');
  if (!canReadAssistant && !canInvokeAssistant) {
    checks.push({
      name: 'localassistant',
      ok: true,
      skipped: true,
      reason: '当前授权未包含 user.localassistant.*',
    });
  } else {
    checks.push(await runCheck('localassistant', async () => {
      const status = canReadAssistant ? await client.getLocalAssistant() : null;
      const history = canReadAssistant
        ? await client.listLocalAssistantMessages({ limit: 20, offset: 0 })
        : null;
      let message = null;
      if (sendLocalMessage && canInvokeAssistant) {
        message = await client.sendLocalAssistantMessage({ content: prompt, msg_type: 'text' });
      }
      return check(true, {
        online: status?.online ?? null,
        historyCount: Array.isArray(history?.messages) ? history.messages.length : null,
        historyRoles: Array.isArray(history?.messages)
          ? [...new Set(history.messages.map((item) => item?.role).filter(Boolean))]
          : [],
        sentMessage: Boolean(message),
      });
    }));
  }

  const acpOk = checks.find((item) => item.name === 'acp')?.ok === true;
  const report = {
    ok: checks.filter((item) => item.name !== 'localassistant' || !item.skipped).every((item) => item.ok),
    at: new Date().toISOString(),
    mode: config.mode,
    scopes,
    checks,
    backends: BACKEND_MATRIX.map((item) => ({
      ...item,
      probed: item.id === 'official-acp',
      available: item.id === 'official-acp' ? acpOk : null,
    })),
  };
  return redact(report);
}

export async function writeProbeReport(report, cwd = process.cwd()) {
  const path = resolve(cwd, 'var/capability-probe.json');
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await writeFile(path, JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
  await chmod(path, 0o600);
  return path;
}
