import { randomUUID } from 'node:crypto';

export const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:8080';

export function bridgeUrl(value = DEFAULT_BRIDGE_URL) {
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname)
      || url.username || url.password || url.pathname !== '/' || url.search || url.hash
      || !url.port || !Number.isInteger(Number(url.port)) || Number(url.port) < 1 || Number(url.port) > 65535) {
    throw new Error('桥接器地址只能是 http://localhost:端口 或 http://127.0.0.1:端口');
  }
  return url.origin;
}

async function getJson(response) {
  const body = await response.json();
  if (!response.ok || body?.ok === false) throw new Error(body?.error || `桥接器返回 ${response.status}`);
  return body;
}

export class PetBridge {
  constructor({ base = DEFAULT_BRIDGE_URL, fetchImpl = fetch } = {}) {
    this.base = bridgeUrl(base);
    this.fetch = fetchImpl;
  }

  async status() {
    const response = await this.fetch(this.base + '/health', { signal: AbortSignal.timeout(3500) });
    const body = await getJson(response);
    return { connected: true, mode: body.mode, authorized: body.authorized };
  }

  async send(text) {
    const content = String(text || '').trim();
    if (!content || content.length > 2000) throw new Error('请输入 1–2000 字的消息');
    const eventId = randomUUID();
    const accepted = await getJson(await this.fetch(this.base + '/v1/ui/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ eventId, deviceId: 'desktop-pet', route: 'localassistant', text: content }),
      signal: AbortSignal.timeout(10000),
    }));
    if (!accepted.accepted || accepted.eventId !== eventId) throw new Error('桥接器未接收消息');
    return eventId;
  }

  async job(eventId) {
    if (!/^[0-9a-f-]{36}$/.test(eventId)) throw new Error('消息 ID 无效');
    return getJson(await this.fetch(this.base + '/v1/localassistant/jobs/' + eventId, {
      signal: AbortSignal.timeout(3500),
    }));
  }
}

export function replyText(reply) {
  if (typeof reply === 'string') return reply;
  if (!reply || typeof reply !== 'object') return '任务已完成，请在 WorkBuddy 中查看详情。';
  const content = reply.content ?? reply.text ?? reply.message ?? reply.data?.content;
  if (Array.isArray(content)) {
    const text = content.filter((part) => typeof part === 'string').join('\n').trim();
    return text || '任务已完成，请在 WorkBuddy 中查看详情。';
  }
  return typeof content === 'string' ? content : '任务已完成，请在 WorkBuddy 中查看详情。';
}
