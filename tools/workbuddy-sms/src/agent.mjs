function headers(token, extra = {}) {
  return {
    'X-CodeBuddy-Request': '1',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

function unwrapRunId(body) {
  return body?.data?.runId ?? body?.runId;
}

function extractText(value) {
  if (!value || typeof value !== 'object') return '';
  const candidates = [
    value.text,
    value.content,
    value.message?.text,
    value.message?.content,
    value.data?.text,
    value.data?.content,
    value.data?.message?.text,
    value.data?.message?.content,
    value.result?.text,
    value.result?.content,
  ];
  return candidates.find((entry) => typeof entry === 'string' && entry.trim()) ?? '';
}

export async function readSse(response, onEvent = () => {}) {
  if (!response.ok) throw new Error(`CodeBuddy SSE 返回 HTTP ${response.status}`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalText = '';
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() ?? '';
    for (const block of blocks) {
      const eventName = block.split(/\r?\n/).find((line) => line.startsWith('event:'))?.slice(6).trim() ?? 'message';
      const data = block.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trimStart()).join('\n');
      if (!data || data === '[DONE]') continue;
      let parsed = data;
      try { parsed = JSON.parse(data); } catch {}
      const text = typeof parsed === 'string' ? parsed : extractText(parsed);
      if (text) finalText = text;
      onEvent({ event: eventName, data: parsed, text });
    }
    if (done) break;
  }
  return finalText;
}

export class CodeBuddyAgent {
  constructor(config, fetchImpl = fetch) {
    this.config = config;
    this.fetch = fetchImpl;
    this.token = process.env.CODEBUDDY_API_TOKEN ?? '';
  }

  async health() {
    const response = await this.fetch(`${this.config.baseUrl}/api/v1/health`);
    if (!response.ok) throw new Error(`CodeBuddy 健康检查返回 HTTP ${response.status}`);
    return response.json();
  }

  async run({ eventId, senderId, conversationId, text, onEvent }) {
    const response = await this.fetch(`${this.config.baseUrl}/api/v1/runs`, {
      method: 'POST',
      headers: headers(this.token, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        id: eventId,
        type: 'message',
        version: '1.0',
        source: {
          platform: 'sms',
          sender: { id: senderId, name: 'bound-user' },
          conversation: { id: conversationId, type: 'direct' },
        },
        payload: { text },
        timeoutMs: this.config.timeoutMs,
      }),
    });
    if (!response.ok) throw new Error(`CodeBuddy Run 创建失败：HTTP ${response.status}`);
    const runId = unwrapRunId(await response.json());
    if (!runId) throw new Error('CodeBuddy 响应缺少 runId');
    onEvent?.({ event: 'accepted', data: { runId } });
    const stream = await this.fetch(`${this.config.baseUrl}/api/v1/runs/${encodeURIComponent(runId)}/stream`, {
      headers: headers(this.token, { Accept: 'text/event-stream' }),
    });
    const finalText = await readSse(stream, onEvent);
    if (!finalText) throw new Error('CodeBuddy 执行结束，但 SSE 中没有可见结果');
    return { runId, text: finalText };
  }
}

export class MockAgent {
  async health() { return { data: { status: 'ok', mode: 'mock' } }; }
  async run({ eventId, text, onEvent }) {
    onEvent?.({ event: 'accepted', data: { runId: `mock-${eventId}` } });
    return { runId: `mock-${eventId}`, text: `模拟专家已处理：${text}` };
  }
}
