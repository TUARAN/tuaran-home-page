import { createServer } from 'node:http';
import { verifyRelayEvent } from './security.mjs';

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(`${JSON.stringify(body)}\n`);
}

export async function handleBridgeRequest({ method, url, headers = {}, rawBody = '', bridge, relaySecret }) {
  const parsedUrl = new URL(url, `http://${headers.host ?? '127.0.0.1'}`);
  if (method === 'GET' && parsedUrl.pathname === '/health') {
    return {
      status: 200,
      body: { ok: true, service: 'workbuddy-sms', agent: await bridge.agent.health(), channel: await bridge.channel.health() },
    };
  }
  if (method !== 'POST' || parsedUrl.pathname !== '/v1/events') {
    return { status: 404, body: { ok: false, error: 'not found' } };
  }
  const verified = verifyRelayEvent({
    secret: relaySecret,
    timestamp: headers['x-workbuddy-timestamp'],
    signature: headers['x-workbuddy-signature'],
    rawBody,
  });
  if (!verified) return { status: 401, body: { ok: false, error: 'invalid relay signature' } };
  const result = await bridge.handle(JSON.parse(rawBody));
  return { status: result.status ?? (result.ok ? 200 : 400), body: result };
}

async function readBody(request, maxBytes = 16_384) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('请求体过大');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export function createBridgeServer({ config, bridge, relaySecret = process.env.WORKBUDDY_SMS_RELAY_SECRET }) {
  return createServer(async (request, response) => {
    try {
      const rawBody = request.method === 'POST' ? await readBody(request) : '';
      const result = await handleBridgeRequest({
        method: request.method,
        url: request.url,
        headers: request.headers,
        rawBody,
        bridge,
        relaySecret,
      });
      return json(response, result.status, result.body);
    } catch (error) {
      return json(response, 400, { ok: false, error: error.message });
    }
  });
}
