const COMMANDS = new Map([
  ['新对话', 'new_session'],
  ['状态', 'status'],
  ['取消', 'cancel'],
]);

export function normalizeText(value) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function classifyInbound(text, stopWords) {
  const normalized = normalizeText(text);
  const upper = normalized.toUpperCase();
  if (stopWords.some((word) => upper === String(word).toUpperCase())) return { type: 'stop', text: normalized };
  if (['恢复服务', 'START', 'UNSTOP'].includes(upper)) return { type: 'resume', text: normalized };
  for (const [prefix, type] of COMMANDS) {
    if (normalized === prefix || normalized.startsWith(`${prefix} `)) {
      return { type, argument: normalized.slice(prefix.length).trim(), text: normalized };
    }
  }
  return { type: 'message', text: normalized };
}

export function validateInbound(event, config) {
  if (!event || typeof event !== 'object') return '请求体必须是 JSON 对象';
  if (!/^[a-zA-Z0-9:_-]{6,160}$/.test(event.eventId ?? '')) return 'eventId 无效';
  if (!config.policy.allowedSenders.includes(event.senderId)) return '发送者未绑定';
  const text = normalizeText(event.text);
  if (!text) return '短信正文为空';
  if ([...text].length > config.policy.maxInboundChars) return '短信正文超过允许长度';
  return null;
}

export function summarizeForSms(text, maxChars = 240) {
  const normalized = normalizeText(text);
  if ([...normalized].length <= maxChars) return normalized;
  return `${[...normalized].slice(0, Math.max(1, maxChars - 1)).join('')}…`;
}
