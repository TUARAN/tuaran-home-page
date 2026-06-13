import { getD1 } from './d1'
import { getSecrets } from './edgeSession'

const CODE_TTL_MS = 10 * 60 * 1000
const RESEND_INTERVAL_MS = 60 * 1000
const EMAIL_DAILY_LIMIT = 10
const IP_MINUTE_LIMIT = 6
const MAX_CODE_ATTEMPTS = 5
const PBKDF2_ITERATIONS = 600000

const encoder = new TextEncoder()

function bytesToBase64(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToBytes(value) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function randomBytes(length) {
  return crypto.getRandomValues(new Uint8Array(length))
}

function randomId() {
  return crypto.randomUUID()
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

async function hmacHex(message, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(message)))
  return Array.from(signature, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function safeEqualString(a, b) {
  const left = String(a || '')
  const right = String(b || '')
  if (left.length !== right.length) return false
  let difference = 0
  for (let i = 0; i < left.length; i += 1) {
    difference |= left.charCodeAt(i) ^ right.charCodeAt(i)
  }
  return difference === 0
}

function getClientIp(req) {
  return req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ''
}

function generateCode() {
  const value = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000
  return String(value).padStart(6, '0')
}

async function sendWithResend({ to, code, resendApiKey, emailFrom }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [to],
      subject: '你的 2aran.com 注册验证码',
      text: `你的注册验证码是 ${code}。验证码 10 分钟内有效，请勿转发给他人。`,
      html: `<div style="font-family:Arial,sans-serif;color:#222;line-height:1.6"><p>你的 2aran.com 注册验证码是：</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>验证码 10 分钟内有效，请勿转发给他人。</p></div>`,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`RESEND_SEND_FAILED: ${response.status} ${detail}`)
  }
}

export async function requestRegistrationCode(req, rawEmail) {
  const email = normalizeEmail(rawEmail)
  if (!isValidEmail(email)) return { error: 'INVALID_EMAIL', status: 400 }

  const { emailCodeSecret, resendApiKey, emailFrom } = getSecrets()
  const missing = []
  if (!emailCodeSecret) missing.push('EMAIL_CODE_SECRET')
  if (!resendApiKey) missing.push('RESEND_API_KEY')
  if (!emailFrom) missing.push('EMAIL_FROM')
  if (missing.length) return { error: 'MISSING_EMAIL_AUTH_CONFIG', missing, status: 500 }

  const db = getD1()
  const now = Date.now()
  const dayAgo = now - 24 * 60 * 60 * 1000
  const minuteAgo = now - RESEND_INTERVAL_MS
  const ip = getClientIp(req)
  const ipHash = ip ? await hmacHex(ip, emailCodeSecret) : null

  const existingUser = await db.prepare('SELECT id FROM email_users WHERE email = ?').bind(email).first()
  if (existingUser) return { error: 'EMAIL_ALREADY_REGISTERED', status: 409 }

  const recent = await db
    .prepare(
      `SELECT created_at
       FROM email_verification_codes
       WHERE email = ? AND purpose = 'register'
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .bind(email)
    .first()
  if (recent && Number(recent.created_at) > minuteAgo) {
    return { error: 'CODE_SENT_TOO_RECENTLY', retryAfter: 60, status: 429 }
  }

  const emailDaily = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM email_verification_codes
       WHERE email = ? AND purpose = 'register' AND created_at >= ?`
    )
    .bind(email, dayAgo)
    .first()
  if (Number(emailDaily?.count || 0) >= EMAIL_DAILY_LIMIT) {
    return { error: 'EMAIL_DAILY_LIMIT_REACHED', status: 429 }
  }

  if (ipHash) {
    const ipMinute = await db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM email_verification_codes
         WHERE requester_ip_hash = ? AND created_at >= ?`
      )
      .bind(ipHash, minuteAgo)
      .first()
    if (Number(ipMinute?.count || 0) >= IP_MINUTE_LIMIT) {
      return { error: 'IP_RATE_LIMIT_REACHED', status: 429 }
    }
  }

  const code = generateCode()
  const codeHash = await hmacHex(`${email}:register:${code}`, emailCodeSecret)
  const id = randomId()

  await db
    .prepare(
      `INSERT INTO email_verification_codes
       (id, email, code_hash, purpose, requester_ip_hash, expires_at, created_at)
       VALUES (?, ?, ?, 'register', ?, ?, ?)`
    )
    .bind(id, email, codeHash, ipHash, now + CODE_TTL_MS, now)
    .run()

  try {
    await sendWithResend({ to: email, code, resendApiKey, emailFrom })
  } catch (error) {
    await db.prepare('DELETE FROM email_verification_codes WHERE id = ?').bind(id).run()
    throw error
  }

  return { ok: true }
}

async function hashPassword(password) {
  const salt = randomBytes(16)
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS },
    keyMaterial,
    256
  )
  return `pbkdf2_sha256$${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(
    new Uint8Array(bits)
  )}`
}

async function verifyPassword(password, storedHash) {
  const [algorithm, iterationsValue, saltValue, expectedValue] = String(storedHash || '').split('$')
  const iterations = Number(iterationsValue)
  if (algorithm !== 'pbkdf2_sha256' || !iterations || !saltValue || !expectedValue) return false

  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: base64ToBytes(saltValue), iterations },
    keyMaterial,
    256
  )
  const actual = new Uint8Array(bits)
  const expected = base64ToBytes(expectedValue)
  if (actual.length !== expected.length) return false

  let difference = 0
  for (let i = 0; i < actual.length; i += 1) difference |= actual[i] ^ expected[i]
  return difference === 0
}

export async function registerEmailUser({ rawEmail, password, rawCode, rawName }) {
  const email = normalizeEmail(rawEmail)
  const code = String(rawCode || '').trim()
  const name = String(rawName || '').trim()

  if (!isValidEmail(email)) return { error: 'INVALID_EMAIL', status: 400 }
  if (!/^\d{6}$/.test(code)) return { error: 'INVALID_CODE_FORMAT', status: 400 }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return { error: 'INVALID_PASSWORD', status: 400 }
  }
  if (!name || name.length > 50) return { error: 'INVALID_NAME', status: 400 }

  const { emailCodeSecret } = getSecrets()
  if (!emailCodeSecret) return { error: 'MISSING_EMAIL_AUTH_CONFIG', missing: ['EMAIL_CODE_SECRET'], status: 500 }

  const db = getD1()
  const now = Date.now()
  const existingUser = await db.prepare('SELECT id FROM email_users WHERE email = ?').bind(email).first()
  if (existingUser) return { error: 'EMAIL_ALREADY_REGISTERED', status: 409 }

  const verification = await db
    .prepare(
      `SELECT id, code_hash, expires_at, consumed_at, attempts
       FROM email_verification_codes
       WHERE email = ? AND purpose = 'register'
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .bind(email)
    .first()

  if (!verification || verification.consumed_at) return { error: 'CODE_NOT_FOUND', status: 400 }
  if (Number(verification.expires_at) < now) return { error: 'CODE_EXPIRED', status: 400 }
  if (Number(verification.attempts) >= MAX_CODE_ATTEMPTS) return { error: 'CODE_ATTEMPTS_EXCEEDED', status: 429 }

  const expectedHash = await hmacHex(`${email}:register:${code}`, emailCodeSecret)
  if (!safeEqualString(expectedHash, verification.code_hash)) {
    await db
      .prepare('UPDATE email_verification_codes SET attempts = attempts + 1 WHERE id = ?')
      .bind(verification.id)
      .run()
    return { error: 'INVALID_CODE', status: 400 }
  }

  const id = `email:${randomId()}`
  const passwordHash = await hashPassword(password)

  await db.batch([
    db
      .prepare(
        `INSERT INTO email_users
         (id, email, name, password_hash, email_verified_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, email, name, passwordHash, now, now, now),
    db
      .prepare('UPDATE email_verification_codes SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL')
      .bind(now, verification.id),
  ])

  return {
    ok: true,
    user: {
      id,
      provider: 'email',
      login: email,
      email,
      name,
      image: null,
    },
  }
}

export async function authenticateEmailUser(rawEmail, password) {
  const email = normalizeEmail(rawEmail)
  if (!isValidEmail(email) || typeof password !== 'string') {
    return { error: 'INVALID_CREDENTIALS', status: 401 }
  }

  const db = getD1()
  const record = await db
    .prepare('SELECT id, email, name, password_hash FROM email_users WHERE email = ?')
    .bind(email)
    .first()
  if (!record || !(await verifyPassword(password, record.password_hash))) {
    return { error: 'INVALID_CREDENTIALS', status: 401 }
  }

  return {
    ok: true,
    user: {
      id: String(record.id),
      provider: 'email',
      login: String(record.email),
      email: String(record.email),
      name: String(record.name),
      image: null,
    },
  }
}
