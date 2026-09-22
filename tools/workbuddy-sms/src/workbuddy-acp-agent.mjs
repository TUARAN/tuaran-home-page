function extractText(value) {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (!value || typeof value !== 'object') return '';
  const candidates = [
    value.text,
    value.content,
    value.result?.text,
    value.update?.content?.text,
    value.update?.text,
    value.params?.update?.content?.text,
  ];
  return candidates.find((entry) => typeof entry === 'string' && entry.trim())?.trim() ?? '';
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function readBridgeEvents(response, { eventId, timeoutMs, fetchAbort }) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const timer = setTimeout(() => fetchAbort.abort(), timeoutMs);
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() ?? '';
      for (const block of blocks) {
        const data = block.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trimStart()).join('\n');
        if (!data) continue;
        let parsed;
        try { parsed = JSON.parse(data); } catch { continue; }
        if (parsed?.data?.eventId !== eventId) continue;
        if (parsed.type === 'device.completed') {
          const text = extractText(parsed.data.result) || extractText(parsed.data) || '';
          if (!text) throw new Error('官方 ACP 完成，但没有可见摘要');
          return { text, result: parsed.data.result };
        }
        if (parsed.type === 'device.failed') {
          throw new Error(parsed.data?.error || '官方 ACP 执行失败');
        }
      }
      if (done) throw new Error('官方 ACP 事件流结束，任务未完成');
    }
  } finally {
    clearTimeout(timer);
    await reader.cancel().catch(() => {});
  }
}

export class WorkBuddyAcpAgent {
  constructor(config, fetchImpl = fetch) {
    this.config = config;
    this.fetch = fetchImpl;
    this.baseUrl = String(config.baseUrl || 'http://127.0.0.1:8080').replace(/\/$/, '');
    this.deviceId = config.deviceId || 'sms-channel';
    this.bridgeKey = process.env.WORKBUDDY_BRIDGE_KEY || config.bridgeKey || '';
  }

  headers(extra = {}) {
    return {
      ...(this.bridgeKey ? { 'X-Bridge-Key': this.bridgeKey } : {}),
      ...extra,
    };
  }

  async health() {
    const response = await this.fetch(`${this.baseUrl}/health`);
    if (!response.ok) throw new Error(`WorkBuddy ACP 桥接健康检查返回 HTTP ${response.status}`);
    const body = await readJson(response);
    return { data: { status: 'ok', mode: 'workbuddy-acp', ...body } };
  }

  async ensureSession(text) {
    const health = await this.health();
    if (health.data?.activeTaskId && health.data?.acpConnected) return health.data.activeTaskId;
    const created = await this.fetch(`${this.baseUrl}/v1/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text, name: 'sms-channel' }),
    });
    if (!created.ok) throw new Error(`创建官方 ACP 会话失败：HTTP ${created.status}`);
    const task = await readJson(created);
    const taskId = task.task_id || task.data?.task_id;
    if (!taskId) throw new Error('官方 ACP 会话响应缺少 task_id');
    const connected = await this.fetch(`${this.baseUrl}/v1/sessions/${encodeURIComponent(taskId)}/connect`, { method: 'POST' });
    if (!connected.ok) throw new Error(`接入官方 ACP 会话失败：HTTP ${connected.status}`);
    return taskId;
  }

  async run({ eventId, senderId, text, onEvent }) {
    if (!this.bridgeKey) throw new Error('缺少 WORKBUDDY_BRIDGE_KEY');
    const taskId = await this.ensureSession(text);
    const abort = new AbortController();
    const stream = await this.fetch(`${this.baseUrl}/v1/events`, {
      headers: { Accept: 'text/event-stream' },
      signal: abort.signal,
    });
    if (!stream.ok) throw new Error(`订阅官方 ACP 事件失败：HTTP ${stream.status}`);
    const pending = readBridgeEvents(stream, {
      eventId,
      timeoutMs: this.config.timeoutMs || 120_000,
      fetchAbort: abort,
    });
    const accepted = await this.fetch(`${this.baseUrl}/v1/device/events`, {
      method: 'POST',
      headers: this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        eventId,
        deviceId: this.deviceId,
        text,
        taskId,
        senderId,
      }),
    });
    if (!accepted.ok && accepted.status !== 202) {
      abort.abort();
      throw new Error(`提交短信到官方 ACP 失败：HTTP ${accepted.status}`);
    }
    const body = await readJson(accepted);
    onEvent?.({ event: 'accepted', data: { taskId, duplicate: body.duplicate === true } });
    if (body.duplicate) {
      abort.abort();
      return { runId: eventId, text: '重复事件已忽略' };
    }
    const completed = await pending;
    return { runId: taskId, text: completed.text };
  }
}
