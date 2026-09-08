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
  async exchangeCode(code) {
    const token = await this.tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: this.config.redirectUri });
    return this.saveToken(token);
  }
  async refresh(refreshToken) {
    const token = await this.tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken });
    return this.saveToken(token);
  }
  async tokenRequest(fields) {
    const body = new URLSearchParams({ ...fields, client_id: this.config.clientId, client_secret: this.config.clientSecret });
    return parseResponse(await this.fetch(this.config.apiBaseUrl + '/token', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' }, body,
    }));
  }
  async saveToken(token) {
    const previous = await this.tokenStore.read();
    const normalized = {
      ...previous, ...token,
      refresh_token: token.refresh_token || previous?.refresh_token,
      expires_at: Date.now() + Number(token.expires_in || 3600) * 1000,
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
  listTasks(page = 1, size = 20) { return this.request('/tasks?page=' + page + '&size=' + size); }
  getTask(taskId) { return this.request('/tasks/' + encodeURIComponent(taskId)); }
  createTask({ prompt, name }) {
    return this.request('/tasks', { method: 'POST', body: JSON.stringify({ prompt, ...(name ? { name } : {}) }) });
  }
}

export class MockWorkBuddyClient {
  constructor() { this.tasks = []; }
  authorizationUrl() { return '/?mock=1'; }
  async accessToken() { return 'mock-access-token'; }
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
    return task;
  }
}
