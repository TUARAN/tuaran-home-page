export const ALLOWED_MESSAGE_TYPES = new Set([
  'task-accepted',
  'task-completed',
  'task-failed',
  'service-paused',
  'service-resumed',
]);

function parseMap(raw, name) {
  let map;
  try {
    map = JSON.parse(raw ?? '{}');
  } catch {
    throw new Error(`${name} 不是有效 JSON`);
  }
  if (!map || typeof map !== 'object' || Array.isArray(map)) throw new Error(`${name} 必须是对象`);
  return map;
}

function values(message) {
  return {
    taskId: String(message.taskId ?? ''),
    text: String(message.text ?? ''),
  };
}

export function resolveTencentTemplate(message, rawMap) {
  const config = parseMap(rawMap, 'TENCENT_TEMPLATE_MAP_JSON')[message.messageType];
  if (!config?.id || !Array.isArray(config.params)) throw new Error('腾讯云消息类型没有配置已审核模板');
  const source = values(message);
  const params = config.params.map((name) => {
    if (!Object.hasOwn(source, name)) throw new Error('腾讯云模板参数只能引用 taskId 或 text');
    return source[name];
  });
  return { templateId: String(config.id), params };
}

export function resolveAliyunTemplate(message, rawMap) {
  const config = parseMap(rawMap, 'ALIYUN_TEMPLATE_MAP_JSON')[message.messageType];
  if (!config?.id || !config.params || typeof config.params !== 'object' || Array.isArray(config.params)) {
    throw new Error('阿里云消息类型没有配置已审核模板');
  }
  const source = values(message);
  const params = {};
  for (const [templateName, sourceName] of Object.entries(config.params)) {
    if (!Object.hasOwn(source, sourceName)) throw new Error('阿里云模板参数只能引用 taskId 或 text');
    params[templateName] = source[sourceName];
  }
  return { templateCode: String(config.id), params };
}

export function validateOutboundMessage(message, maxChars = 240) {
  const text = String(message?.text ?? '').trim();
  const messageType = String(message?.messageType ?? '');
  if (!text || [...text].length > maxChars || !ALLOWED_MESSAGE_TYPES.has(messageType)) {
    throw new Error('message rejected by deterministic policy');
  }
  return { text, messageType, taskId: message.taskId ? String(message.taskId) : null };
}
