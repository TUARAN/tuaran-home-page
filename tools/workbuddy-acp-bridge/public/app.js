const $ = (selector) => document.querySelector(selector);
const desktop = window.acpDesktop;
const consoleEl = $('#console');
let activeTaskId = null;
let currentSettings = null;
let connectingTaskId = null;
let streamingArticle = null;
let streamingText = '';
let agentRoute = localStorage.getItem('workbuddy-agent-route') || 'cloud';
let authorizationPoll = null;
const seenLocalMessages = new Set();
const pendingLocalEvents = new Set();

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

async function request(path, options = {}) {
  const response = await fetch(path, options);
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || '请求失败');
  return value;
}

function log(type, data) {
  if (consoleEl.textContent === '等待桥接事件…') consoleEl.textContent = '';
  consoleEl.textContent = '[' + new Date().toLocaleTimeString() + '] ' + type + '\n' +
    JSON.stringify(data, null, 2) + '\n\n' + consoleEl.textContent;
}

function addMessage(text, direction, meta = '') {
  const article = document.createElement('article');
  article.className = 'message ' + direction;
  article.innerHTML = '<div><div class="bubble">' + escapeHtml(text) + '</div><time>' +
    escapeHtml(meta || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) +
    '</time></div>';
  $('#message-list').append(article);
  $('#message-list').scrollTop = $('#message-list').scrollHeight;
  return article;
}

function setTyping(visible) {
  $('#typing').hidden = !visible;
  if (visible) $('#message-list').scrollTop = $('#message-list').scrollHeight;
}

function appendIncomingChunk(text) {
  if (!streamingArticle) {
    streamingArticle = addMessage('', 'incoming', 'WorkBuddy · 正在回复');
    streamingText = '';
  }
  streamingText += text;
  streamingArticle.querySelector('.bubble').textContent = streamingText;
  $('#message-list').scrollTop = $('#message-list').scrollHeight;
  setTyping(false);
}

function finishIncoming() {
  if (streamingArticle) {
    streamingArticle.querySelector('time').textContent = 'WorkBuddy · 已送达';
    streamingArticle = null;
    streamingText = '';
  }
  setTyping(false);
}

function findMessageText(value) {
  const update = value?.params?.update;
  if (update?.content?.type === 'text') return update.content.text;
  if (typeof update?.text === 'string') return update.text;
  if (typeof value?.result?.text === 'string') return value.result.text;
  return '';
}

function localAssistantText(message) {
  if (!Array.isArray(message?.content)) return '';
  return message.content.map((part) => typeof part === 'string' ? part : (part?.text || '')).join('');
}

function showLocalAssistantMessage(value) {
  const message = value?.message || value;
  const messageId = message?.message_id || message?.id;
  if (messageId && seenLocalMessages.has(messageId)) return;
  const text = localAssistantText(message);
  if (!text) return;
  if (messageId) seenLocalMessages.add(messageId);
  addMessage(text, 'incoming', '本地助理 · 已送达');
}

async function pollLocalAssistantJob(eventId) {
  for (let attempt = 0; attempt < 300 && pendingLocalEvents.has(eventId); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      const job = await request('/v1/localassistant/jobs/' + encodeURIComponent(eventId));
      if (job.status === 'completed') {
        showLocalAssistantMessage(job.reply);
        pendingLocalEvents.delete(eventId);
        setTyping(pendingLocalEvents.size > 0);
        return;
      }
      if (job.status === 'failed') throw new Error(job.error || '本地助理处理失败');
    } catch (error) {
      pendingLocalEvents.delete(eventId);
      setTyping(pendingLocalEvents.size > 0);
      addMessage('本地助理返回失败：' + error.message, 'incoming', '系统消息');
      return;
    }
  }
}

function syncRouteUi() {
  const input = document.querySelector('input[name="agent-route"][value="' + agentRoute + '"]');
  if (input) input.checked = true;
  $('#device-text').placeholder = agentRoute === 'localassistant' ? '发给本地助理' : '信息 · RCS';
}

async function health() {
  const value = await request('/health');
  $('#dot').classList.toggle('ok', value.ok);
  $('#bridge-dot')?.classList.toggle('ok', value.ok);
  $('#status').textContent = value.authorized ? '在线' : '等待连接';
  $('#authorize').hidden = value.mode !== 'real' || value.authorized;
  $('#logout').hidden = value.mode !== 'real' || !value.authorized;
  $('#auth-banner').hidden = value.mode !== 'real' || value.authorized;
  if (value.activeTaskId) setActive(value.activeTaskId);
  return value;
}

function monitorAuthorization() {
  clearInterval(authorizationPoll);
  const startedAt = Date.now();
  authorizationPoll = setInterval(async () => {
    try {
      const value = await health();
      if (value.authorized) {
        clearInterval(authorizationPoll);
        authorizationPoll = null;
        addMessage('WorkBuddy 授权成功。', 'incoming', '系统消息');
        if (agentRoute === 'cloud') await refreshTasks({ autoConnect: true });
      } else if (Date.now() - startedAt > 10 * 60_000) {
        clearInterval(authorizationPoll);
        authorizationPoll = null;
      }
    } catch (error) {
      log('oauth.poll', error.message);
    }
  }, 2000);
}

for (const link of document.querySelectorAll('a[href="/oauth/start"]')) {
  link.addEventListener('click', async (event) => {
    if (!desktop) return;
    event.preventDefault();
    try {
      await desktop.startAuthorization();
      addMessage('已在系统默认浏览器打开 WorkBuddy 授权页。完成后请回到这里。', 'incoming', '系统消息');
      monitorAuthorization();
    } catch (error) {
      addMessage('无法开始授权：' + error.message, 'incoming', '系统消息');
      await openSettings();
    }
  });
}

function setActive(taskId) {
  activeTaskId = taskId;
  $('#active').classList.add('connected');
  $('#active').innerHTML = '<span></span><p>RCS 会话已连接</p>';
  for (const item of document.querySelectorAll('.task')) {
    const active = item.dataset.id === taskId;
    item.classList.toggle('active', active);
    const button = item.querySelector('button');
    if (button) button.textContent = active ? '已连接' : '继续对话';
  }
}

async function listTasks() {
  return desktop ? desktop.listTasks() : request('/v1/tasks');
}

async function refreshTasks({ autoConnect = false } = {}) {
  const value = await listTasks();
  const tasks = value.tasks || value.data?.tasks || [];
  $('#task-count').textContent = tasks.length;
  $('#tasks').innerHTML = tasks.length ? tasks.map((task) =>
    '<div class="task" data-id="' + escapeHtml(task.task_id) + '"><div><strong>' +
    escapeHtml(task.name || task.task_id) + '</strong><small>' +
    escapeHtml(task.status || '') +
    '</small></div><button data-task="' + encodeURIComponent(task.task_id) + '">' +
    (task.task_id === activeTaskId ? '已连接' : '继续对话') + '</button></div>'
  ).join('') : '<p class="empty">暂无会话，直接发送第一条消息即可创建。</p>';
  if (activeTaskId) setActive(activeTaskId);
  if (autoConnect && !activeTaskId && tasks[0]?.task_id) {
    await connectTask(tasks[0].task_id, { announce: false });
  } else if (!activeTaskId && !tasks.length) {
    $('#active').innerHTML = '<span></span><p>发送第一条消息时将自动创建会话</p>';
  }
}

async function connectTask(taskId, { announce = true } = {}) {
  if (activeTaskId === taskId) return;
  if (connectingTaskId) return;
  connectingTaskId = taskId;
  $('#active').classList.add('connecting');
  $('#active').innerHTML = '<span></span><p>正在连接 WorkBuddy 会话…</p>';
  try {
    const result = desktop
      ? await desktop.connectSession(taskId)
      : await request('/v1/sessions/' + encodeURIComponent(taskId) + '/connect', { method: 'POST' });
    setActive(taskId);
    if (announce) addMessage('会话已连接，可以继续发送消息。', 'incoming', '云端会话已就绪');
    log('session.connected', result);
  } finally {
    $('#active').classList.remove('connecting');
    connectingTaskId = null;
  }
}

$('#tasks').addEventListener('click', async (event) => {
  const encoded = event.target.dataset.task;
  if (!encoded) return;
  event.target.disabled = true;
  try {
    await connectTask(decodeURIComponent(encoded));
    $('#more-dialog').close();
  }
  catch (error) { addMessage('接入失败：' + error.message, 'incoming', '系统消息'); log('error', error.message); }
  finally { connectingTaskId = null; $('#active').classList.remove('connecting'); event.target.disabled = false; }
});

$('#device-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = $('#device-text').value.trim();
  if (!text) return;
  $('#device-text').value = '';
  addMessage(text, 'outgoing', '短信模拟器 · 已发送');
  setTyping(true);
  const input = {
    eventId: crypto.randomUUID(),
    deviceId: $('#device-id').value,
    text,
    route: agentRoute,
    ...(activeTaskId ? { taskId: activeTaskId } : {}),
  };
  try {
    const value = desktop
      ? await desktop.sendDeviceMessage(input)
      : await request('/v1/ui/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
    if (!activeTaskId && value.taskId) {
      setActive(value.taskId);
      await refreshTasks();
    }
    if (value.route === 'localassistant') {
      pendingLocalEvents.add(value.eventId);
      void pollLocalAssistantJob(value.eventId);
    }
    log('device.accepted', value);
  } catch (error) {
    setTyping(false);
    addMessage('桥接失败：' + error.message, 'incoming', '系统消息');
    log('error', error.message);
  }
});

$('#device-text').addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    $('#device-form').requestSubmit();
  }
});

$('#create-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const input = { name: $('#name').value, prompt: $('#prompt').value };
    const task = desktop
      ? await desktop.createSession(input)
      : await request('/v1/sessions', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input),
      });
    $('#session-dialog').close();
    await refreshTasks();
    await connectTask(task.task_id);
  } catch (error) { log('error', error.message); }
});

function showPermission(message) {
  const item = document.createElement('div');
  item.className = 'permission';
  item.innerHTML = '<strong>WorkBuddy 请求本地确认</strong><pre>' +
    escapeHtml(JSON.stringify(message.params, null, 2)) +
    '</pre><button data-outcome="allow_once">仅本次允许</button>' +
    '<button class="deny" data-outcome="cancelled">拒绝</button>';
  item.addEventListener('click', async (event) => {
    const outcome = event.target.dataset.outcome;
    if (!outcome) return;
    try {
      await request('/v1/permissions/respond', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId: message.id, result: { outcome } }),
      });
      item.remove();
    } catch (error) { log('error', error.message); }
  });
  $('#permissions').prepend(item);
}

const events = new EventSource('/v1/events');
events.onmessage = (event) => {
  const value = JSON.parse(event.data);
  log(value.type, value.data);
  if (value.type === 'acp.permission') showPermission(value.data);
  if (value.type === 'acp.message') {
    const text = findMessageText(value.data);
    if (text && value.data?.method === 'session/update') appendIncomingChunk(text);
    else if (text) addMessage(text, 'incoming', 'WorkBuddy · 已送达');
    if (value.data?.result?.stopReason) finishIncoming();
  }
  if (value.type === 'localassistant.message') {
    showLocalAssistantMessage(value.data);
    if (value.data?.eventId) pendingLocalEvents.delete(value.data.eventId);
    setTyping(pendingLocalEvents.size > 0);
  }
  if (value.type === 'device.completed' || value.type === 'device.failed') {
    if (value.data?.route === 'localassistant' && value.data?.eventId) {
      pendingLocalEvents.delete(value.data.eventId);
      setTyping(pendingLocalEvents.size > 0);
    } else finishIncoming();
  }
};
events.onerror = () => log('bridge.connection', '实时事件连接正在重试');

for (const button of document.querySelectorAll('.nav-item')) {
  button.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    document.querySelectorAll('.view').forEach((item) => item.classList.remove('active'));
    const view = button.dataset.view === 'events' ? 'events-view' : 'messages-view';
    $('#' + view).classList.add('active');
  });
}

$('#new-session').addEventListener('click', () => {
  $('#more-dialog').close();
  $('#session-dialog').showModal();
});
$('#open-more').addEventListener('click', () => $('#more-dialog').showModal());
for (const input of document.querySelectorAll('input[name="agent-route"]')) {
  input.addEventListener('change', () => {
    agentRoute = input.value;
    localStorage.setItem('workbuddy-agent-route', agentRoute);
    syncRouteUi();
    addMessage(agentRoute === 'localassistant' ? '已切换到本地助理。' : '已切换到云端任务。', 'incoming', '执行位置');
    $('#more-dialog').close();
  });
}
$('#logout').addEventListener('click', async () => {
  const button = $('#logout');
  button.disabled = true;
  try {
    await request('/oauth/logout', { method: 'POST' });
    activeTaskId = null;
    connectingTaskId = null;
    finishIncoming();
    $('#tasks').innerHTML = '<p class="empty">已退出。重新授权后可读取会话。</p>';
    $('#task-count').textContent = '0';
    $('#active').className = 'active-session';
    $('#active').innerHTML = '<span></span><p>尚未连接 WorkBuddy</p>';
    $('#more-dialog').close();
    addMessage('已退出 WorkBuddy。本机授权凭证已清除。', 'incoming', '系统消息');
    await health();
  } catch (error) {
    addMessage('退出失败：' + error.message, 'incoming', '系统消息');
  } finally {
    button.disabled = false;
  }
});
$('#refresh').addEventListener('click', () => refreshTasks().catch((error) => log('error', error.message)));
$('#clear').addEventListener('click', () => { consoleEl.textContent = '等待桥接事件…'; });
for (const button of document.querySelectorAll('[data-close]')) {
  button.addEventListener('click', () => $('#' + button.dataset.close).close());
}

async function openSettings() {
  if (!desktop) {
    addMessage('浏览器预览不能修改桌面应用配置。请运行 npm run desktop。', 'incoming', '系统提醒');
    return;
  }
  currentSettings = await desktop.getSettings();
  $('#setting-mode').value = currentSettings.mode;
  $('#setting-client-id').value = currentSettings.clientId;
  $('#setting-client-secret').value = currentSettings.clientSecret;
  $('#setting-redirect-uri').value = currentSettings.redirectUri;
  $('#setting-bridge-key').value = currentSettings.bridgeKey;
  $('#setting-secret-error').textContent = currentSettings.clientSecretError || '';
  $('#setting-secret-error').hidden = !currentSettings.clientSecretError;
  $('#settings-dialog').showModal();
}

$('#open-settings').addEventListener('click', openSettings);

$('#settings-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!desktop) return;
  await desktop.saveSettings({
    mode: $('#setting-mode').value,
    clientId: $('#setting-client-id').value,
    clientSecret: $('#setting-client-secret').value === '••••••••' ? '' : $('#setting-client-secret').value,
    redirectUri: $('#setting-redirect-uri').value,
    bridgeKey: $('#setting-bridge-key').value,
  });
});

syncRouteUi();
health().then(async (value) => {
  if (desktop) {
    const settings = await desktop.getSettings();
    if (!settings.clientId || (settings.mode === 'real' && !settings.clientSecretAvailable)) {
      addMessage(
        settings.clientSecretError || '首次使用，请先填写开放平台应用凭据，保存后完成 WorkBuddy 授权。',
        'incoming',
        '接入向导',
      );
      await openSettings();
      return;
    }
  }
  if (value.authorized && agentRoute === 'cloud') await refreshTasks({ autoConnect: true });
}).catch((error) => log('error', error.message));
