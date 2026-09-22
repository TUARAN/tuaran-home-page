import { homedir } from 'node:os';
import { probeClawbot, DEFAULT_CLAWBOT_BASE_URL } from './clawbot.mjs';
import { callFiveGMcp, DEFAULT_FIVEG_SOCKET } from './fiveg-mcp.mjs';
import { probeAllFiveGHttp, WORKBUDDY_5G_HTTP } from './workbuddy-5g-http.mjs';

export class MockChannel {
  constructor() { this.messages = []; }
  async health() { return { ok: true, provider: 'mock' }; }
  async send(message) {
    const result = { ok: true, provider: 'mock', messageId: `mock-${this.messages.length + 1}`, ...message };
    this.messages.push(result);
    return result;
  }
}

function loadSenderMap(config = {}) {
  const fromConfig = config.senderMap && typeof config.senderMap === 'object' && !Array.isArray(config.senderMap)
    ? config.senderMap
    : {};
  if (!process.env.WORKBUDDY_SMS_SENDER_MAP) return { ...fromConfig };
  try {
    return { ...fromConfig, ...JSON.parse(process.env.WORKBUDDY_SMS_SENDER_MAP) };
  } catch {
    throw new Error('WORKBUDDY_SMS_SENDER_MAP 不是有效 JSON 对象');
  }
}

export class FiveGChannel {
  constructor(config = {}, {
    fetchImpl = fetch,
    mcpCall = callFiveGMcp,
    probeHttp = probeAllFiveGHttp,
    probeGateway = probeClawbot,
  } = {}) {
    this.config = config;
    this.fetch = fetchImpl;
    this.mcpCall = mcpCall;
    this.probeHttp = probeHttp;
    this.probeGateway = probeGateway;
    this.socketPath = String(config.socketPath || process.env.BRIDGE_SOCKET || DEFAULT_FIVEG_SOCKET)
      .replace(/^~(?=\/|$)/, homedir());
    this.fivegEnv = config.fivegEnv || 'production';
    this.clawbotBaseUrl = config.clawbotBaseUrl || DEFAULT_CLAWBOT_BASE_URL;
    this.senderMap = loadSenderMap(config);
    this.dry = config.dry === true;
  }

  resolveRecipient(message = {}) {
    const recipient = String(message.recipient || message.to || '').trim();
    const mapped = this.senderMap[recipient];
    const to = String(mapped || recipient).trim();
    if (!to) throw new Error('缺少真实 5G 下发目标');
    return to;
  }

  async health() {
    let socket = { ok: false };
    try {
      const status = await this.mcpCall({ socketPath: this.socketPath, name: 'bridge_status' });
      socket = {
        ok: Boolean(status.wsAuthed && status.runtimeReady && status.dry === false),
        wsConnected: Boolean(status.wsConnected),
        wsAuthed: Boolean(status.wsAuthed),
        dry: Boolean(status.dry),
        wsMode: status.wsMode || null,
        version: status.version || null,
      };
    } catch (error) {
      socket = { ok: false, error: error.message };
    }
    const http = await this.probeHttp(this.fetch);
    const clawbot = await this.probeGateway(this.clawbotBaseUrl, this.fetch);
    const localCallback = http.find((item) => item.env === 'local') || null;
    return {
      ok: socket.ok,
      provider: 'fiveg',
      simulator: false,
      fivegEnv: this.fivegEnv,
      socketPath: this.socketPath.replace(homedir(), '~'),
      socket,
      http,
      localCallback: {
        ready: localCallback?.ok === true && localCallback?.serviceMatch === true,
        conflict: localCallback?.reachable === true && localCallback?.serviceMatch === false,
        service: localCallback?.service || null,
      },
      clawbot,
      callback: WORKBUDDY_5G_HTTP,
    };
  }

  async send(message) {
    const to = this.resolveRecipient(message);
    if (this.dry) {
      return { ok: true, provider: 'fiveg', dry: true, to, text: message.text };
    }
    const result = await this.mcpCall({
      socketPath: this.socketPath,
      name: 'send_5g',
      args: { to, text: message.text },
    });
    return { ok: true, provider: 'fiveg', to, result };
  }
}

export class TwilioChannel {
  constructor(config, fetchImpl = fetch) {
    this.config = config;
    this.fetch = fetchImpl;
    this.accountSid = process.env.TWILIO_ACCOUNT_SID ?? '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN ?? '';
    this.to = process.env.TWILIO_TO ?? '';
  }

  credentialsPresent() {
    return Boolean(this.accountSid && this.authToken && this.to && this.config.from);
  }

  async health() {
    return { ok: this.credentialsPresent(), provider: 'twilio', credentialsPresent: this.credentialsPresent() };
  }

  async send({ text }) {
    if (!this.credentialsPresent()) throw new Error('Twilio 凭证不完整');
    const body = new URLSearchParams({ To: this.to, From: this.config.from, Body: text });
    const response = await this.fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(this.accountSid)}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Twilio 发送失败：${data.message ?? `HTTP ${response.status}`}`);
    return { ok: true, provider: 'twilio', messageId: data.sid, status: data.status };
  }
}

export class RelayChannel {
  constructor(config, fetchImpl = fetch) {
    this.config = config;
    this.fetch = fetchImpl;
    this.token = process.env.WORKBUDDY_SMS_DEVICE_TOKEN ?? '';
  }

  async health() {
    if (!this.token || !this.config.relayBaseUrl) {
      return { ok: false, provider: 'relay', credentialsPresent: Boolean(this.token) };
    }
    try {
      const response = await this.request('/v1/doctor');
      const details = await response.json();
      return { ok: response.ok && details.ok, provider: 'relay', credentialsPresent: true, relay: details };
    } catch (error) {
      return { ok: false, provider: 'relay', credentialsPresent: true, error: error.message };
    }
  }

  async request(path, options = {}) {
    if (!this.token) throw new Error('缺少 WORKBUDDY_SMS_DEVICE_TOKEN');
    const response = await this.fetch(new URL(path, this.config.relayBaseUrl), {
      ...options,
      headers: { Authorization: `Bearer ${this.token}`, ...(options.headers ?? {}) },
    });
    return response;
  }

  async next() {
    const response = await this.request('/v1/events/next');
    if (response.status === 204) return null;
    if (!response.ok) throw new Error(`中继领取失败：HTTP ${response.status}`);
    return response.json();
  }

  async acknowledge(eventId, outcome) {
    const response = await this.request(`/v1/events/${encodeURIComponent(eventId)}/ack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome }),
    });
    if (!response.ok) throw new Error(`中继回执失败：HTTP ${response.status}`);
  }

  async send({ text, messageType, taskId }) {
    const response = await this.request('/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, messageType, taskId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`中继发送失败：${data.error ?? `HTTP ${response.status}`}`);
    return data;
  }
}

export function createChannel(config, fetchImpl = fetch) {
  if (config.provider === 'twilio') return new TwilioChannel(config, fetchImpl);
  if (config.provider === 'relay') return new RelayChannel(config, fetchImpl);
  if (config.provider === 'fiveg') return new FiveGChannel(config, { fetchImpl });
  return new MockChannel();
}
