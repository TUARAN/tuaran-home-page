export const CODE_MINER_TOOLS = [
  { id: 'gif', title: 'GIF 搜索下载', shortTitle: 'GIF 搜索' },
  { id: 'image', title: '图片压缩', shortTitle: '图片压缩' },
  { id: 'qr', title: '二维码生成', shortTitle: '二维码' },
  { id: 'json', title: 'JSON 格式化', shortTitle: 'JSON' },
  { id: 'base64', title: 'Base64 编解码', shortTitle: 'Base64' },
  { id: 'dice', title: '摇色子决定器', shortTitle: '做决定' },
]

export function normalizeCodeMinerTool(value) {
  return CODE_MINER_TOOLS.some((tool) => tool.id === value) ? value : CODE_MINER_TOOLS[0].id
}

export function formatJson(value, compact = false) {
  return JSON.stringify(JSON.parse(value), null, compact ? 0 : 2)
}

export function getJsonDepth(value) {
  if (value === null || typeof value !== 'object') return 0
  const children = Array.isArray(value) ? value : Object.values(value)
  return 1 + children.reduce((depth, child) => Math.max(depth, getJsonDepth(child)), 0)
}

export function encodeBase64Text(value) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export function decodeBase64Text(value) {
  const binary = atob(value.trim())
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}
