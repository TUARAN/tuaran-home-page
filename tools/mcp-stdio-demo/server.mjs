#!/usr/bin/env node

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'

const PROTOCOL_VERSION = '2025-11-25'
const SUPPORTED_VERSIONS = new Set(['2025-11-25', '2025-06-18', '2025-03-26'])
const MAX_TEXT_LENGTH = 16 * 1024

const TOOLS = [
  {
    name: 'local_encrypt_text',
    title: '本地加密文本',
    description: '在本机进程中使用 AES-256-GCM 加密文本。密钥不会通过 MCP 响应返回。',
    inputSchema: {
      type: 'object',
      properties: {
        plaintext: { type: 'string', minLength: 1, maxLength: MAX_TEXT_LENGTH, description: '待加密文本。' },
      },
      required: ['plaintext'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  {
    name: 'local_decrypt_text',
    title: '本地解密文本',
    description: '在本机进程中解密由 local_encrypt_text 生成的密文。',
    inputSchema: {
      type: 'object',
      properties: {
        ciphertext: { type: 'string', minLength: 1, maxLength: MAX_TEXT_LENGTH * 2, description: 'v1 格式密文。' },
      },
      required: ['ciphertext'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'local_runtime_info',
    title: '查看本地运行信息',
    description: '返回 stdio MCP 进程的非敏感运行信息，用于确认 WorkBuddy 确实拉起了本地进程。',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
]

function jsonResult(id, result) {
  return { jsonrpc: '2.0', id, result }
}

function jsonError(id, code, message) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } }
}

function toolResult(data) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  }
}

function toolError(message) {
  return { content: [{ type: 'text', text: message }], isError: true }
}

function readSecret(env = process.env) {
  if (env.LOCAL_MCP_SECRET_FILE) {
    const secret = readFileSync(env.LOCAL_MCP_SECRET_FILE, 'utf8').trim()
    if (secret) return { secret, source: 'file' }
  }
  if (env.LOCAL_MCP_SECRET?.trim()) return { secret: env.LOCAL_MCP_SECRET.trim(), source: 'environment' }
  return null
}

function encryptionKey(env) {
  const configured = readSecret(env)
  if (!configured) throw new Error('未配置密钥：请设置 LOCAL_MCP_SECRET_FILE 或 LOCAL_MCP_SECRET。')
  return createHash('sha256').update(configured.secret, 'utf8').digest()
}

function encrypt(plaintext, env) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(env), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1.${iv.toString('base64url')}.${encrypted.toString('base64url')}.${tag.toString('base64url')}`
}

function decrypt(payload, env) {
  const [version, ivText, encryptedText, tagText, extra] = String(payload).split('.')
  if (version !== 'v1' || !ivText || !encryptedText || !tagText || extra) throw new Error('密文格式无效。')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(env), Buffer.from(ivText, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(encryptedText, 'base64url')), decipher.final()]).toString('utf8')
}

function validateText(value, field, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== 'string' || value.length < 1 || value.length > maxLength) {
    throw new Error(`${field} 必须是 1 到 ${maxLength} 个字符的字符串。`)
  }
  return value
}

export function handleMcpMessage(message, env = process.env) {
  if (!message || typeof message !== 'object' || Array.isArray(message) || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    return jsonError(message?.id, -32600, 'Invalid JSON-RPC request')
  }

  if (message.method.startsWith('notifications/')) return null
  if (message.method === 'initialize') {
    const requested = message.params?.protocolVersion
    return jsonResult(message.id, {
      protocolVersion: SUPPORTED_VERSIONS.has(requested) ? requested : PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: {
        name: 'tuaran-local-crypto-demo',
        title: '本地加解密 stdio MCP Demo',
        version: '1.0.0',
        description: '由 WorkBuddy 在本机拉起，通过 stdin/stdout 交换 MCP JSON-RPC 消息。',
      },
      instructions: '仅在用户明确要求时加密或解密。不要声称 stdio 会阻止工具参数进入模型上下文。',
    })
  }
  if (message.method === 'ping') return jsonResult(message.id, {})
  if (message.method === 'tools/list') return jsonResult(message.id, { tools: TOOLS })
  if (message.method !== 'tools/call') return jsonError(message.id, -32601, `Method not found: ${message.method}`)

  const name = String(message.params?.name || '')
  const args = message.params?.arguments
  if (!args || typeof args !== 'object' || Array.isArray(args)) return jsonResult(message.id, toolError('工具参数必须是对象。'))

  try {
    if (name === 'local_encrypt_text') {
      return jsonResult(message.id, toolResult({ ciphertext: encrypt(validateText(args.plaintext, 'plaintext'), env), algorithm: 'AES-256-GCM' }))
    }
    if (name === 'local_decrypt_text') {
      return jsonResult(message.id, toolResult({ plaintext: decrypt(validateText(args.ciphertext, 'ciphertext', MAX_TEXT_LENGTH * 2), env) }))
    }
    if (name === 'local_runtime_info') {
      const configured = readSecret(env)
      return jsonResult(message.id, toolResult({
        transport: 'stdio',
        runtime: `Node.js ${process.version}`,
        platform: `${process.platform}/${process.arch}`,
        processId: process.pid,
        secretConfigured: Boolean(configured),
        secretSource: configured?.source || 'none',
      }))
    }
    return jsonError(message.id, -32602, `Unknown tool: ${name}`)
  } catch (error) {
    return jsonResult(message.id, toolError(error?.message || '工具调用失败。'))
  }
}

export function startStdioServer({ input = process.stdin, output = process.stdout, env = process.env } = {}) {
  const lines = createInterface({ input, crlfDelay: Infinity })
  lines.on('line', (line) => {
    if (!line.trim()) return
    let response
    try {
      response = handleMcpMessage(JSON.parse(line), env)
    } catch {
      response = jsonError(null, -32700, 'Parse error')
    }
    if (response) output.write(`${JSON.stringify(response)}\n`)
  })
  console.error('[tuaran-local-crypto-demo] stdio MCP server started')
  return lines
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) startStdioServer()
