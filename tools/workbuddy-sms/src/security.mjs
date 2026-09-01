import { createHmac, timingSafeEqual } from 'node:crypto';

export function signRelayEvent(secret, timestamp, rawBody) {
  return createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}

export function verifyRelayEvent({ secret, timestamp, rawBody, signature, now = Date.now(), toleranceMs = 300_000 }) {
  if (!secret || !timestamp || !signature) return false;
  const time = Number(timestamp);
  if (!Number.isFinite(time) || Math.abs(now - time) > toleranceMs) return false;
  const expected = Buffer.from(signRelayEvent(secret, timestamp, rawBody), 'hex');
  let received;
  try {
    received = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }
  return expected.length === received.length && timingSafeEqual(expected, received);
}
