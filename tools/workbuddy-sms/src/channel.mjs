export class MockChannel {
  constructor() { this.messages = []; }
  async health() { return { ok: true, provider: 'mock' }; }
  async send(message) {
    const result = { ok: true, provider: 'mock', messageId: `mock-${this.messages.length + 1}`, ...message };
    this.messages.push(result);
    return result;
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
  return new MockChannel();
}
