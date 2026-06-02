// 长期罗盘端到端加密原语（isomorphic：浏览器 + Node 20+ 共用）
//
// 单一来源：所有 PBKDF2 轮数、salt/iv 长度、payload 形状的常量只在这里定义。
// 浏览器解锁逻辑、Node 端 seed-to-d1 脚本都必须从这里 import，避免参数漂移。
//
// 注：Web Crypto API（globalThis.crypto.subtle）在浏览器、Cloudflare Edge、
//     Node 20+ 都原生存在；atob/btoa 同理。所以本文件无 polyfill 依赖。

export const CRYPTO_PARAMS = Object.freeze({
  // PBKDF2 派生密钥参数
  pbkdf2Iterations: 310000,
  pbkdf2Hash: 'SHA-256',
  // 对称加密参数
  algorithm: 'AES-GCM',
  keyLength: 256,
  saltBytes: 16,
  ivBytes: 12,
  // 密文信封格式版本（如果未来换算法 / 加 AAD，envelope 版本就 +1）
  envelopeVersion: 1,
  // payload 形状字符串（用于 schema.js 检查）
  algorithmId: 'AES-256-GCM',
  kdfId: 'PBKDF2-SHA256',
})

// ---------- base64 helpers (isomorphic) ----------

function bytesToBase64(bytes) {
  let str = ''
  for (let i = 0; i < bytes.length; i += 1) str += String.fromCharCode(bytes[i])
  return btoa(str)
}

function base64ToBytes(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
  return bytes
}

// ---------- key derivation ----------

async function deriveKey(password, salt, iterations) {
  const subtle = globalThis.crypto.subtle
  const baseKey = await subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: CRYPTO_PARAMS.pbkdf2Hash,
    },
    baseKey,
    { name: CRYPTO_PARAMS.algorithm, length: CRYPTO_PARAMS.keyLength },
    false,
    ['encrypt', 'decrypt']
  )
}

// ---------- public API ----------

/**
 * 加密一个明文对象，返回密文信封。
 * @param {object} plain - 任意可 JSON.stringify 的对象
 * @param {string} password - 用户口令
 * @returns {Promise<object>} envelope { v, alg, kdf, iter, salt, iv, data }
 */
export async function encryptPayload(plain, password) {
  const cryptoApi = globalThis.crypto
  const salt = cryptoApi.getRandomValues(new Uint8Array(CRYPTO_PARAMS.saltBytes))
  const iv = cryptoApi.getRandomValues(new Uint8Array(CRYPTO_PARAMS.ivBytes))
  const key = await deriveKey(password, salt, CRYPTO_PARAMS.pbkdf2Iterations)
  const encoded = new TextEncoder().encode(JSON.stringify(plain))
  const cipher = await cryptoApi.subtle.encrypt(
    { name: CRYPTO_PARAMS.algorithm, iv },
    key,
    encoded
  )

  return {
    v: CRYPTO_PARAMS.envelopeVersion,
    alg: CRYPTO_PARAMS.algorithmId,
    kdf: CRYPTO_PARAMS.kdfId,
    iter: CRYPTO_PARAMS.pbkdf2Iterations,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(cipher)),
  }
}

/**
 * 解密密文信封，返回明文对象。
 * 兼容 envelope v1（当前唯一版本）。未来加新算法时在这里分支。
 * @param {object} envelope - encryptPayload 的返回
 * @param {string} password
 * @returns {Promise<object>}
 */
export async function decryptPayload(envelope, password) {
  if (!envelope || envelope.v !== CRYPTO_PARAMS.envelopeVersion) {
    throw new Error(`UNSUPPORTED_ENVELOPE_VERSION: ${envelope?.v}`)
  }
  if (envelope.alg !== CRYPTO_PARAMS.algorithmId) {
    throw new Error(`UNSUPPORTED_ALG: ${envelope.alg}`)
  }
  const salt = base64ToBytes(envelope.salt)
  const iv = base64ToBytes(envelope.iv)
  const cipher = base64ToBytes(envelope.data)
  const key = await deriveKey(password, salt, envelope.iter)
  const plain = await globalThis.crypto.subtle.decrypt(
    { name: CRYPTO_PARAMS.algorithm, iv },
    key,
    cipher
  )
  return JSON.parse(new TextDecoder().decode(plain))
}

/**
 * 浅校验密文信封形状（不解密、不要密码）。给 API 层用，挡明显畸形数据。
 */
export function isValidEnvelope(envelope) {
  if (!envelope || typeof envelope !== 'object') return false
  if (envelope.v !== CRYPTO_PARAMS.envelopeVersion) return false
  if (envelope.alg !== CRYPTO_PARAMS.algorithmId) return false
  if (envelope.kdf !== CRYPTO_PARAMS.kdfId) return false
  if (!Number.isInteger(envelope.iter) || envelope.iter < 100000) return false
  if (typeof envelope.salt !== 'string') return false
  if (typeof envelope.iv !== 'string') return false
  if (typeof envelope.data !== 'string') return false
  return true
}
