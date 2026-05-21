import crypto from 'node:crypto'

// PBKDF2 迭代次数：参考 OWASP 对 PBKDF2-HMAC-SHA256 的建议，抬高离线爆破成本。
export const PBKDF2_ITERATIONS = 600000

/**
 * 构建期对调研正文做 AES-256-GCM 加密。
 * 返回的对象只含密文与公开参数（salt / iv / 迭代次数），可安全发到浏览器；
 * 浏览器侧用 Web Crypto + 同一密码即可解密（见 EncryptedArticle.jsx）。
 *
 * @param {string} plaintext 调研正文（Markdown）
 * @param {string} password  全站统一加密密码（来自构建环境变量）
 */
export function encryptContent(plaintext, password) {
  if (!password) {
    throw new Error('encryptContent: 缺少加密密码')
  }

  const salt = crypto.randomBytes(16)
  const iv = crypto.randomBytes(12)
  const key = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, 'sha256')

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    v: 1,
    kdf: 'PBKDF2-SHA256',
    iter: PBKDF2_ITERATIONS,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    // Web Crypto 的 AES-GCM 解密要求「密文 || authTag」拼在一起
    data: Buffer.concat([ciphertext, authTag]).toString('base64'),
  }
}
