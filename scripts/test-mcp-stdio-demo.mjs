import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'

const serverPath = new URL('../tools/mcp-stdio-demo/server.mjs', import.meta.url)
const child = spawn(process.execPath, [fileURLToPath(serverPath)], {
  env: { ...process.env, LOCAL_MCP_SECRET: 'automated-test-secret' },
  stdio: ['pipe', 'pipe', 'pipe'],
})
const lines = createInterface({ input: child.stdout, crlfDelay: Infinity })
const pending = new Map()
let nextId = 1

lines.on('line', (line) => {
  const message = JSON.parse(line)
  pending.get(message.id)?.(message)
  pending.delete(message.id)
})

function request(method, params = {}) {
  const id = nextId++
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`)
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`MCP request timed out: ${method}`)), 3000)
    pending.set(id, (message) => {
      clearTimeout(timeout)
      resolve(message)
    })
  })
}

try {
  const initialized = await request('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'demo-test', version: '1.0.0' } })
  assert.equal(initialized.result.serverInfo.name, 'tuaran-local-crypto-demo')
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`)

  const listed = await request('tools/list')
  assert.deepEqual(listed.result.tools.map((tool) => tool.name), ['local_encrypt_text', 'local_decrypt_text', 'local_runtime_info'])

  const encrypted = await request('tools/call', { name: 'local_encrypt_text', arguments: { plaintext: '本地 stdio 联调成功' } })
  const ciphertext = encrypted.result.structuredContent.ciphertext
  assert.match(ciphertext, /^v1\./)

  const decrypted = await request('tools/call', { name: 'local_decrypt_text', arguments: { ciphertext } })
  assert.equal(decrypted.result.structuredContent.plaintext, '本地 stdio 联调成功')

  const runtime = await request('tools/call', { name: 'local_runtime_info', arguments: {} })
  assert.equal(runtime.result.structuredContent.transport, 'stdio')
  assert.equal(runtime.result.structuredContent.secretConfigured, true)
  console.log('✓ stdio 握手、工具发现、加密和解密调用均通过')
} finally {
  child.stdin.end()
  child.kill()
}
