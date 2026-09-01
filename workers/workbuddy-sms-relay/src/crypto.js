const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toHex(bytes) {
  return [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
}

function toBase64(bytes) {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function toBase64Url(bytes) {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256Base64Url(value) {
  return toBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
}

export async function sha256Hex(value) {
  const bytes = typeof value === 'string' ? encoder.encode(value) : value;
  return toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)));
}

export async function hmacSha256(secret, value, output = 'bytes') {
  const secretBytes = typeof secret === 'string' ? encoder.encode(secret) : secret;
  const valueBytes = typeof value === 'string' ? encoder.encode(value) : value;
  const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const result = new Uint8Array(await crypto.subtle.sign('HMAC', key, valueBytes));
  return output === 'hex' ? toHex(result) : result;
}

export function constantTimeEqual(left, right) {
  const a = encoder.encode(String(left));
  const b = encoder.encode(String(right));
  if (typeof crypto.subtle.timingSafeEqual === 'function') {
    return a.length === b.length && crypto.subtle.timingSafeEqual(a, b);
  }
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) difference |= (a[index % a.length] ?? 0) ^ (b[index % b.length] ?? 0);
  return difference === 0;
}

async function importAesKey(secret) {
  const bytes = fromBase64(secret);
  if (bytes.length !== 32) throw new Error('QUEUE_ENCRYPTION_KEY 必须是 32 字节 base64url');
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptText(text, secret) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importAesKey(secret);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(text));
  return { ciphertext: toBase64Url(new Uint8Array(ciphertext)), iv: toBase64Url(iv) };
}

export async function decryptText(ciphertext, iv, secret) {
  const key = await importAesKey(secret);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(iv) }, key, fromBase64(ciphertext));
  return decoder.decode(plaintext);
}

export async function verifyTwilioSignature({ authToken, url, params, signature }) {
  const payload = `${url}${[...params.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}${value}`).join('')}`;
  const key = await crypto.subtle.importKey('raw', encoder.encode(authToken), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const digest = toBase64(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload))));
  return constantTimeEqual(digest, signature ?? '');
}
