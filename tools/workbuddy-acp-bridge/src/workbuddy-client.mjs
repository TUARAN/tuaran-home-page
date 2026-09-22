import { randomBytes } from 'node:crypto';

export class HttpError extends Error {
  constructor(message, status, body) { super(message); this.status = status; this.body = body; }
}

async function parseResponse(response) {
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new HttpError('WorkBuddy 请求失败 (' + response.status + ')', response.status, body);
  return body;
}

export function parseScopes(value) {
  return String(value || '').split(/\s+/).filter(Boolean);
}

export function unwrapWorkBuddyBody(body) {
  if (!body || typeof body !== 'object') return body;
  if (body.task_id || body.tasks || body.link || body.online !== undefined || body.message_id) return body;
  if (body.data && typeof body.data === 'object') return body.data;
  return body;
}

export class WorkBuddyClient {
  constructor({ config, tokenStore, fetchImpl = fetch }) {
    this.config = config; this.tokenStore = tokenStore; this.fetch = fetchImpl;
  }
  authorizationUrl(state) {
    const url = new URL(this.config.apiBaseUrl + '/authorize');
    url.search = new URLSearchParams({
      response_type: 'code', client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri, scope: this.config.scope, state,
    });
    return url.toString();
  }
  createAuthorizationRequest() {
    const state = randomBytes(24).toString('base64url');
    return { state, url: this.authorizationUrl(state) };
  }
  async exchangeCode(code) {
    const token = await this.tokenRequest({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
    });
    return this.saveToken(token);
  }
  async refresh(refreshToken) {
    const token = await this.tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken });
    return this.saveToken(token);
  }
  async tokenRequest(fields) {
    return parseResponse(await this.fetch(this.config.apiBaseUrl + '/token', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
      },
      body: new URLSearchParams({
        ...fields,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    }));
  }
  async saveToken(token) {
    const previous = await this.tokenStore.read();
    const payload = unwrapWorkBuddyBody(token) || token;
    const normalized = {
      ...previous, ...payload,
      refresh_token: payload.refresh_token || previous?.refresh_token,
      expires_at: Date.now() + Number(payload.expires_in || 3600) * 1000,
      saved_at: Date.now(),
    };
    await this.tokenStore.write(normalized);
    return normalized;
  }
  async accessToken() {
    let token = await this.tokenStore.read();
    if (!token?.access_token) throw new Error('尚未完成 WorkBuddy OAuth 授权');
    if (token.expires_at && token.expires_at <= Date.now() + 60_000) {
      if (!token.refresh_token) throw new Error('WorkBuddy access_token 已过期，且没有 refresh_token');
      token = await this.refresh(token.refresh_token);
    }
    return token.access_token;
  }
  async request(path, init = {}, retry = true) {
    const token = await this.accessToken();
    const response = await this.fetch(this.config.apiBaseUrl + path, {
      ...init,
      headers: {
        accept: 'application/json',
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...init.headers,
        authorization: 'Bearer ' + token,
      },
    });
    if (response.status === 401 && retry) {
      const saved = await this.tokenStore.read();
      if (saved?.refresh_token) { await this.refresh(saved.refresh_token); return this.request(path, init, false); }
    }
    return parseResponse(response);
  }
  async grantedScopes() {
    const token = await this.tokenStore.read();
    const fromToken = parseScopes(token?.scope);
    return fromToken.length ? fromToken : parseScopes(this.config.scope);
  }

  hasScope(scope, scopes) {
    return (scopes || []).includes(scope);
  }

  listTasks(page = 1, size = 20) { return this.request('/tasks?page=' + page + '&size=' + size); }
  getTask(taskId) { return this.request('/tasks/' + encodeURIComponent(taskId)); }
  createTask({ prompt, name }) {
    return this.request('/tasks', { method: 'POST', body: JSON.stringify({ prompt, ...(name ? { name } : {}) }) });
  }
  getLocalAssistant() {
    return this.request('/localassistant').then(unwrapWorkBuddyBody);
  }
  getProfile() {
    return this.request('/user/profile').then(unwrapWorkBuddyBody);
  }
  verifyPhone(phoneNumber) {
    if (!String(phoneNumber || '').trim()) throw new Error('手机号不能为空');
    return this.request('/user/phoneverification', {
      method: 'POST',
      body: JSON.stringify({ phone_number: String(phoneNumber).trim() }),
    }).then(unwrapWorkBuddyBody);
  }
  sendLocalAssistantMessage({ content, msg_type = 'text' }) {
    return this.request('/localassistant/message', {
      method: 'POST',
      body: JSON.stringify({ content, msg_type }),
    }).then(unwrapWorkBuddyBody);
  }
  listLocalAssistantMessages({ limit = 20, offset = 0, messageId = '' } = {}) {
    const query = messageId
      ? new URLSearchParams({ message_id: messageId })
      : new URLSearchParams({ limit: String(limit), offset: String(offset) });
    return this.request('/localassistant/message?' + query).then(unwrapWorkBuddyBody);
  }
}

async function readTokenError(response) {
  const text = await response.text();
  let parsed = text;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return {
    status: response.status,
    error: parsed?.error || null,
    description: parsed?.error_description || parsed?.message || null,
  };
}

export async function probeTokenCredentials(config, fetchImpl = fetch) {
  const post = (body) => fetchImpl(config.apiBaseUrl + '/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
    },
    body: new URLSearchParams(body),
  });
  const codeProbe = await readTokenError(await post({
    grant_type: 'authorization_code',
    code: 'probe-not-a-real-code',
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  }));
  const credentialsAccepted = codeProbe.error === 'invalid_grant';
  return {
    ok: credentialsAccepted,
    status: codeProbe.status,
    error: codeProbe.error,
    description: codeProbe.description,
    meaning: !credentialsAccepted
      ? ((codeProbe.error === 'unauthorized_client' || codeProbe.error === 'invalid_client')
        ? '应用凭据不被 token 端点接受'
        : 'token 端点返回了未预期错误')
      : '应用凭据已被文档支持的 authorization_code 端点接受；假授权码按预期被拒绝。该预检不能代替真实授权码换 token。',
  };
}

export class MockWorkBuddyClient {
  constructor({ scopes, localAssistantOnline = false } = {}) {
    this.tasks = [];
    this.scopes = scopes || ['user.task.readable', 'user.task.invokable'];
    this.localAssistantOnline = localAssistantOnline;
    this.localAssistantMessages = [];
    this.taskRefreshCount = new Map();
  }
  authorizationUrl() { return '/?mock=1'; }
  createAuthorizationRequest() { return { url: '/?mock=1', state: 'mock', codeVerifier: '' }; }
  async accessToken() { return 'mock-access-token'; }
  async grantedScopes() { return [...this.scopes]; }
  hasScope(scope, scopes) { return (scopes || this.scopes).includes(scope); }
  async listTasks() { return { tasks: [...this.tasks].reverse(), total: this.tasks.length, pagination: { page: 1, size: 20 } }; }
  async createTask({ prompt, name }) {
    const task = {
      task_id: 'mock-' + Date.now(), status: 'working', name: name || prompt.slice(0, 24),
      link: 'mock://acp', token: 'mock-acp-token', created_at: new Date().toISOString(),
    };
    this.tasks.push(task); return task;
  }
  async getTask(taskId) {
    const task = this.tasks.find((item) => item.task_id === taskId);
    if (!task) throw new Error('mock 会话不存在');
    const count = (this.taskRefreshCount.get(taskId) || 0) + 1;
    this.taskRefreshCount.set(taskId, count);
    return { ...task, token: count > 1 ? 'mock-acp-token-rotated' : task.token };
  }
  async getLocalAssistant() { return { online: this.localAssistantOnline }; }
  async getProfile() { return { nickname: 'mock-user', avatar: '' }; }
  async verifyPhone(phoneNumber) { return { matched: Boolean(String(phoneNumber || '').trim()) }; }
  async sendLocalAssistantMessage({ content, msg_type = 'text' }) {
    if (!this.scopes.includes('user.localassistant.invokable')) {
      throw new Error('缺少 user.localassistant.invokable');
    }
    const message = { content, msg_type, message_id: 'mock-msg-' + this.localAssistantMessages.length };
    this.localAssistantMessages.push(message);
    return message;
  }
  async listLocalAssistantMessages() {
    return { messages: [...this.localAssistantMessages] };
  }
}
