const $ = (selector) => document.querySelector(selector);
const desktop = window.acpDesktop;
const consoleEl = $('#console');
let activeTaskId = null;
let currentSettings = null;

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
  article.innerHTML = (direction === 'incoming' ? '<span class="bubble-avatar">W</span>' : '') +
    '<div><div class="bubble">' + escapeHtml(text) + '</div><time>' +
    escapeHtml(meta || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) +
    '</time></div>';
  $('#message-list').append(article);
  $('#message-list').scrollTop = $('#message-list').scrollHeight;
}

function findMessageText(value) {
  const update = value?.params?.update;
  if (update?.content?.type === 'text') return update.content.text;
  if (typeof update?.text === 'string') return update.text;
  if (typeof value?.result?.text === 'string') return value.result.text;
  return '';
}

async function health() {
  const value = await request('/health');
  $('#dot').classList.toggle('ok', value.ok);
  $('#status').textContent = value.mode + ' · ' + (value.authorized ? '已授权' : '待授权');
  $('#authorize').hidden = value.mode !== 'real' || value.authorized;
  if (value.activeTaskId) setActive(value.activeTaskId);
}

function setActive(taskId) {
  activeTaskId = taskId;
  $('#active').classList.add('connected');
  $('#active').innerHTML = '<span></span><p>当前会话：' + escapeHtml(taskId) + '</p>';
  for (const item of document.querySelectorAll('.task')) {
    item.classList.toggle('active', item.dataset.id === taskId);
  }
}

async function listTasks() {
  return desktop ? desktop.listTasks() : request('/v1/tasks');
}

async function refreshTasks() {
  const value = await listTasks();
  const tasks = value.tasks || value.data?.tasks || [];
  $('#task-count').textContent = tasks.length;
  $('#tasks').innerHTML = tasks.length ? tasks.map((task) =>
    '<div class="task" data-id="' + escapeHtml(task.task_id) + '"><div><strong>' +
    escapeHtml(task.name || task.task_id) + '</strong><small>' +
    escapeHtml(task.status || '') + ' · ' + escapeHtml(task.task_id) +
    '</small></div><button data-task="' + encodeURIComponent(task.task_id) + '">接入</button></div>'
  ).join('') : '<p class="empty">暂无会话，点击顶部“新会话”创建。</p>';
  if (activeTaskId) setActive(activeTaskId);
}

async function connectTask(taskId) {
  const result = desktop
    ? await desktop.connectSession(taskId)
    : await request('/v1/sessions/' + encodeURIComponent(taskId) + '/connect', { method: 'POST' });
  setActive(taskId);
  addMessage('已切入 WorkBuddy 会话：' + taskId, 'incoming', 'ACP 路由已建立');
  log('session.connected', result);
}

$('#tasks').addEventListener('click', async (event) => {
  const encoded = event.target.dataset.task;
  if (!encoded) return;
  event.target.disabled = true;
  try { await connectTask(decodeURIComponent(encoded)); }
  catch (error) { addMessage('接入失败：' + error.message, 'incoming', '系统消息'); log('error', error.message); }
  finally { event.target.disabled = false; }
});

$('#device-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = $('#device-text').value.trim();
  if (!text) return;
  if (!activeTaskId) {
    addMessage('请先在右侧选择并接入一个 WorkBuddy 会话。', 'incoming', '系统提醒');
    return;
  }
  $('#device-text').value = '';
  addMessage(text, 'outgoing', '短信模拟器 · 已发送');
  const input = {
    eventId: crypto.randomUUID(),
    deviceId: $('#device-id').value,
    text,
    taskId: activeTaskId,
  };
  try {
    const value = desktop
      ? await desktop.sendDeviceMessage(input)
      : await request('/v1/device/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-bridge-key': $('#bridge-key').value },
        body: JSON.stringify(input),
      });
    log('device.accepted', value);
  } catch (error) {
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
  item.innerHTML = '<strong>ACP 请求本地确认</strong><pre>' +
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
    if (text) addMessage(text, 'incoming', 'WorkBuddy · ACP');
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

$('#new-session').addEventListener('click', () => $('#session-dialog').showModal());
$('#refresh').addEventListener('click', () => refreshTasks().catch((error) => log('error', error.message)));
$('#clear').addEventListener('click', () => { consoleEl.textContent = '等待桥接事件…'; });
for (const button of document.querySelectorAll('[data-close]')) {
  button.addEventListener('click', () => $('#' + button.dataset.close).close());
}

$('#open-settings').addEventListener('click', async () => {
  if (!desktop) {
    addMessage('浏览器预览不提供桌面安全存储。请运行 npm run desktop。', 'incoming', '系统提醒');
    return;
  }
  currentSettings = await desktop.getSettings();
  $('#setting-mode').value = currentSettings.mode;
  $('#setting-client-id').value = currentSettings.clientId;
  $('#setting-client-secret').value = currentSettings.clientSecret;
  $('#setting-redirect-uri').value = currentSettings.redirectUri;
  $('#setting-bridge-key').value = currentSettings.bridgeKey;
  $('#settings-dialog').showModal();
});

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

health().then(refreshTasks).catch((error) => log('error', error.message));
