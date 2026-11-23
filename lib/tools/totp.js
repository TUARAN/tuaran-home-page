/**
 * TOTP（RFC 6238）与 HOTP（RFC 4226）的纯函数实现。
 *
 * 只依赖 WebCrypto 的 HMAC，不读写文档、存储或网络，浏览器和 Node 都能直接调用。
 * 页面层负责把密钥留在内存里，这个模块不做任何持久化。
 */

export const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
export const TOTP_ALGORITHMS = ['SHA1', 'SHA256', 'SHA512']
export const TOTP_DIGITS = [6, 8]
export const TOTP_DEFAULT_PERIOD = 30
export const TOTP_DEFAULT_DIGITS = 6
export const TOTP_DEFAULT_ALGORITHM = 'SHA1'

const WEB_CRYPTO_HASH = {
  SHA1: 'SHA-1',
  SHA256: 'SHA-256',
  SHA512: 'SHA-512',
}

function requireWebCrypto() {
  const cryptoApi = globalThis.crypto
  if (!cryptoApi?.subtle) throw new Error('当前环境不支持 WebCrypto，无法计算验证码')
  return cryptoApi
}

function toArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}

/** 去掉空格、连字符和补齐用的等号，统一转成大写。 */
export function normalizeBase32(value) {
  return String(value ?? '').replace(/[\s-]/g, '').replace(/=+$/g, '').toUpperCase()
}

export function decodeBase32(value) {
  const normalized = normalizeBase32(value)
  if (!normalized) return new Uint8Array(0)
  if (!/^[A-Z2-7]+$/.test(normalized)) throw new Error('密钥只能包含 A-Z 和 2-7')

  let bits = 0
  let buffer = 0
  const bytes = []
  for (const char of normalized) {
    buffer = (buffer << 5) | BASE32_ALPHABET.indexOf(char)
    bits += 5
    if (bits >= 8) {
      bits -= 8
      bytes.push((buffer >> bits) & 0xff)
    }
  }
  return new Uint8Array(bytes)
}

export function encodeBase32(bytes) {
  const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let bits = 0
  let buffer = 0
  let output = ''
  for (const byte of input) {
    buffer = (buffer << 8) | byte
    bits += 8
    while (bits >= 5) {
      bits -= 5
      output += BASE32_ALPHABET[(buffer >> bits) & 31]
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(buffer << (5 - bits)) & 31]
  return output
}

/** 生成 n 字节随机密钥并转成 Base32，默认 160 位，与主流验证器一致。 */
export function generateSecret(byteLength = 20) {
  const cryptoApi = globalThis.crypto
  if (!cryptoApi?.getRandomValues) throw new Error('当前环境不支持安全随机数')
  const bytes = new Uint8Array(byteLength)
  cryptoApi.getRandomValues(bytes)
  return encodeBase32(bytes)
}

export function normalizeTotpOptions({ digits = TOTP_DEFAULT_DIGITS, period = TOTP_DEFAULT_PERIOD, algorithm = TOTP_DEFAULT_ALGORITHM } = {}) {
  const normalizedDigits = Number(digits)
  if (!TOTP_DIGITS.includes(normalizedDigits)) throw new Error('位数只支持 6 位或 8 位')

  const normalizedPeriod = Number(period)
  if (!Number.isInteger(normalizedPeriod) || normalizedPeriod < 1 || normalizedPeriod > 300) {
    throw new Error('周期需要是 1 到 300 秒的整数')
  }

  const normalizedAlgorithm = String(algorithm || TOTP_DEFAULT_ALGORITHM).toUpperCase().replace('-', '')
  if (!TOTP_ALGORITHMS.includes(normalizedAlgorithm)) throw new Error('算法只支持 SHA1、SHA256 或 SHA512')

  return { digits: normalizedDigits, period: normalizedPeriod, algorithm: normalizedAlgorithm }
}

/** 计数器按 RFC 4226 要求编码成 8 字节大端整数。 */
export function counterToBytes(counter) {
  let value = BigInt(counter)
  if (value < 0n) throw new Error('计数器不能为负数')
  const bytes = new Uint8Array(8)
  for (let index = 7; index >= 0; index -= 1) {
    bytes[index] = Number(value & 0xffn)
    value >>= 8n
  }
  return bytes
}

export function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function hmacSha(secretBytes, messageBytes, algorithm = TOTP_DEFAULT_ALGORITHM) {
  const { algorithm: normalizedAlgorithm } = normalizeTotpOptions({ algorithm })
  const cryptoApi = requireWebCrypto()
  const key = await cryptoApi.subtle.importKey(
    'raw',
    toArrayBuffer(secretBytes),
    { name: 'HMAC', hash: { name: WEB_CRYPTO_HASH[normalizedAlgorithm] } },
    false,
    ['sign'],
  )
  const signature = await cryptoApi.subtle.sign('HMAC', key, toArrayBuffer(messageBytes))
  return new Uint8Array(signature)
}

/** RFC 4226 的动态截断：用末字节低 4 位定位起点，取 4 字节并抹掉符号位。 */
export function dynamicTruncate(digest) {
  if (digest.length < 20) throw new Error('HMAC 摘要长度不足')
  const offset = digest[digest.length - 1] & 0x0f
  const binary = ((digest[offset] & 0x7f) << 24)
    | (digest[offset + 1] << 16)
    | (digest[offset + 2] << 8)
    | digest[offset + 3]
  return { offset, binary }
}

export function truncateToCode(binary, digits = TOTP_DEFAULT_DIGITS) {
  const modulus = 10 ** digits
  return String(binary % modulus).padStart(digits, '0')
}

function resolveSecret(secret) {
  const bytes = typeof secret === 'string' ? decodeBase32(secret) : secret
  if (!bytes || bytes.length === 0) throw new Error('请输入 Base32 密钥')
  return bytes
}

export async function generateHotp({ secret, counter, digits = TOTP_DEFAULT_DIGITS, algorithm = TOTP_DEFAULT_ALGORITHM }) {
  const options = normalizeTotpOptions({ digits, algorithm })
  const secretBytes = resolveSecret(secret)
  const digest = await hmacSha(secretBytes, counterToBytes(counter), options.algorithm)
  const { binary } = dynamicTruncate(digest)
  return truncateToCode(binary, options.digits)
}

/** 当前时间步的验证码、剩余毫秒和到期时间。 */
export async function generateTotp({
  secret,
  timestamp = Date.now(),
  digits = TOTP_DEFAULT_DIGITS,
  period = TOTP_DEFAULT_PERIOD,
  algorithm = TOTP_DEFAULT_ALGORITHM,
}) {
  const options = normalizeTotpOptions({ digits, period, algorithm })
  const counter = Math.floor(timestamp / 1000 / options.period)
  const code = await generateHotp({ secret, counter, digits: options.digits, algorithm: options.algorithm })
  const expiresAt = (counter + 1) * options.period * 1000
  return {
    code,
    counter,
    expiresAt,
    remainingMs: Math.max(0, expiresAt - timestamp),
    ...options,
  }
}

/**
 * 把 RFC 6238 的中间量全部算出来，供页面解释原理。
 * 返回值与 generateTotp 的 code 必定一致。
 */
export async function explainTotp({
  secret,
  timestamp = Date.now(),
  digits = TOTP_DEFAULT_DIGITS,
  period = TOTP_DEFAULT_PERIOD,
  algorithm = TOTP_DEFAULT_ALGORITHM,
}) {
  const options = normalizeTotpOptions({ digits, period, algorithm })
  const secretBytes = resolveSecret(secret)
  const counter = Math.floor(timestamp / 1000 / options.period)
  const messageBytes = counterToBytes(counter)
  const digest = await hmacSha(secretBytes, messageBytes, options.algorithm)
  const { offset, binary } = dynamicTruncate(digest)
  const code = truncateToCode(binary, options.digits)

  return {
    ...options,
    counter,
    counterHex: bytesToHex(messageBytes),
    digestHex: bytesToHex(digest),
    digestLength: digest.length,
    offset,
    truncatedHex: bytesToHex(digest.slice(offset, offset + 4)),
    binary,
    code,
    secretByteLength: secretBytes.length,
  }
}

/**
 * 校验验证码。window 表示允许前后各偏移几个时间步，
 * 服务端常用的「±1 步」可以容忍最多 30 秒时钟误差。
 */
export async function verifyTotp({
  secret,
  token,
  timestamp = Date.now(),
  digits = TOTP_DEFAULT_DIGITS,
  period = TOTP_DEFAULT_PERIOD,
  algorithm = TOTP_DEFAULT_ALGORITHM,
  window = 1,
}) {
  const options = normalizeTotpOptions({ digits, period, algorithm })
  const candidate = String(token ?? '').replace(/\s/g, '')
  if (!new RegExp(`^\\d{${options.digits}}$`).test(candidate)) {
    return { valid: false, reason: 'format', offset: null, counter: null }
  }

  const counter = Math.floor(timestamp / 1000 / options.period)
  const reach = Math.max(0, Math.floor(Number(window) || 0))
  for (let offset = -reach; offset <= reach; offset += 1) {
    const step = counter + offset
    if (step < 0) continue
    const code = await generateHotp({ secret, counter: step, digits: options.digits, algorithm: options.algorithm })
    if (code === candidate) return { valid: true, offset, counter: step, expected: code }
  }

  const expected = await generateHotp({ secret, counter, digits: options.digits, algorithm: options.algorithm })
  return { valid: false, reason: 'mismatch', offset: null, counter, expected }
}

export function formatCode(code) {
  const value = String(code ?? '')
  const half = Math.ceil(value.length / 2)
  return `${value.slice(0, half)} ${value.slice(half)}`
}

/** 解析 otpauth://totp/... 链接，兼容大小写和缺省参数。 */
export function parseOtpAuthUri(uri) {
  const raw = String(uri ?? '').trim()
  if (!/^otpauth:\/\//i.test(raw)) throw new Error('不是 otpauth:// 链接')

  let url
  try {
    url = new URL(raw)
  } catch {
    throw new Error('otpauth 链接格式不正确')
  }

  const type = url.host.toLowerCase()
  if (type !== 'totp' && type !== 'hotp') throw new Error('只支持 otpauth://totp 或 otpauth://hotp')

  const label = decodeURIComponent(url.pathname.replace(/^\/+/, ''))
  const [labelIssuer, labelAccount] = label.includes(':') ? label.split(/:(.+)/) : ['', label]
  const params = url.searchParams
  const options = normalizeTotpOptions({
    digits: params.get('digits') || TOTP_DEFAULT_DIGITS,
    period: params.get('period') || TOTP_DEFAULT_PERIOD,
    algorithm: params.get('algorithm') || TOTP_DEFAULT_ALGORITHM,
  })
  const secret = params.get('secret')
  if (!secret) throw new Error('链接里缺少 secret 参数')
  resolveSecret(secret)

  return {
    type,
    secret: normalizeBase32(secret),
    issuer: params.get('issuer') || labelIssuer || '',
    account: labelAccount || '',
    counter: params.get('counter') ? Number(params.get('counter')) : null,
    ...options,
  }
}

/** 生成可以导入手机验证器的 otpauth 链接。 */
export function buildOtpAuthUri({
  secret,
  account = 'demo',
  issuer = '2aran',
  digits = TOTP_DEFAULT_DIGITS,
  period = TOTP_DEFAULT_PERIOD,
  algorithm = TOTP_DEFAULT_ALGORITHM,
}) {
  const options = normalizeTotpOptions({ digits, period, algorithm })
  const normalizedSecret = normalizeBase32(secret)
  resolveSecret(normalizedSecret)
  const label = issuer ? `${issuer}:${account}` : account
  const params = new URLSearchParams({
    secret: normalizedSecret,
    issuer,
    algorithm: options.algorithm,
    digits: String(options.digits),
    period: String(options.period),
  })
  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`
}
