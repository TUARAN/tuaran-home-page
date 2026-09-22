import { BACKEND_MATRIX } from './capability-matrix.mjs';
import { createAgent } from './agent.mjs';

export const HARMLESS_SMS = '请只回复 PING，不要调用工具。';

function matrixRow(id) {
  return BACKEND_MATRIX.find((item) => item.id === id) || null;
}

export function compareAgentsFromConfig(config, fetchImpl = fetch) {
  return {
    'codebuddy-cli': createAgent({
      ...config.agent,
      mode: 'codebuddy',
      baseUrl: config.agent.baseUrl || 'http://127.0.0.1:8080',
    }, fetchImpl),
    'local-acp': createAgent({
      ...config.agent,
      mode: 'local-acp',
      baseUrl: config.agent.localAcpBaseUrl || 'http://127.0.0.1:50072',
    }, fetchImpl),
    'official-acp': createAgent({
      ...config.agent,
      mode: 'workbuddy-acp',
      baseUrl: config.agent.bridgeBaseUrl || 'http://127.0.0.1:8080',
    }, fetchImpl),
  };
}

export async function compareSmsBackends({
  text = HARMLESS_SMS,
  agents,
  now = () => Date.now(),
} = {}) {
  const results = [];
  for (const [id, agent] of Object.entries(agents)) {
    const meta = matrixRow(id);
    const started = now();
    try {
      const health = await agent.health();
      const run = await agent.run({
        eventId: `compare-${id}-${started}`,
        senderId: 'self-demo',
        conversationId: 'sms-self-demo',
        text,
      });
      results.push({
        id,
        ok: true,
        sessionLocation: meta?.sessionLocation || 'unknown',
        entersDesktopChat: meta?.entersDesktopChat ?? false,
        runsWithoutDesktop: meta?.runsWithoutDesktop ?? false,
        permissionSurface: meta?.permissionSurface || 'unknown',
        smsAsEntry: meta?.smsAsEntry ?? true,
        smsAsTool: meta?.smsAsTool ?? false,
        text: run.text,
        runId: run.runId,
        health: health?.data || health,
        ms: now() - started,
      });
    } catch (error) {
      results.push({
        id,
        ok: false,
        skipped: /不可用|尚未|ECONNREFUSED|fetch failed|健康检查|缺少 WORKBUDDY_BRIDGE_KEY/i.test(error.message),
        sessionLocation: meta?.sessionLocation || 'unknown',
        entersDesktopChat: meta?.entersDesktopChat ?? false,
        runsWithoutDesktop: meta?.runsWithoutDesktop ?? false,
        permissionSurface: meta?.permissionSurface || 'unknown',
        error: error.message,
        ms: now() - started,
      });
    }
  }
  return {
    text,
    at: new Date().toISOString(),
    connectorFusion: {
      allowed: false,
      reason: '官方连接器一个包只能选 MCP+Skill 或 CLI+Skill，融合只发生在短信桥这一层。',
    },
    results,
    matrix: BACKEND_MATRIX,
  };
}
