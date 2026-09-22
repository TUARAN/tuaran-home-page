const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const { createServer } = require('node:http');
const { randomBytes } = require('node:crypto');
const { readFile, writeFile, mkdir, chmod } = require('node:fs/promises');
const { join } = require('node:path');

app.setName('WorkBuddy 硬件接入助手');

const DESKTOP_SCOPE = [
  'user.task.readable',
  'user.task.invokable',
  'user.localassistant.readable',
  'user.localassistant.invokable',
].join(' ');

let mainWindow;
let server;
let runtime;

function settingsPath() {
  return join(app.getPath('userData'), 'settings.json');
}

async function readSettings() {
  let stored = {};
  let shouldPersist = false;
  try { stored = JSON.parse(await readFile(settingsPath(), 'utf8')); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    shouldPersist = true;
  }
  const clientSecret = String(stored.clientSecret || '');
  const clientSecretError = stored.clientSecretEncrypted && !clientSecret
    ? '检测到旧版钥匙串配置。新版不再访问钥匙串，请重新填写一次 Client Secret。'
    : '';
  const settings = {
    mode: stored.mode || 'real',
    clientId: stored.clientId || '',
    clientSecret,
    redirectUri: stored.redirectUri || 'http://localhost:8080/workbuddy/api',
    bridgeKey: stored.bridgeKey || randomBytes(24).toString('base64url'),
    port: Number(stored.port || 8080),
    clientSecretError,
  };
  if (shouldPersist || !stored.bridgeKey) {
    await mkdir(app.getPath('userData'), { recursive: true });
    await writeFile(settingsPath(), JSON.stringify({
      mode: settings.mode,
      clientId: settings.clientId,
      ...(settings.clientSecret ? { clientSecret: settings.clientSecret } : {}),
      redirectUri: settings.redirectUri,
      bridgeKey: settings.bridgeKey,
      port: settings.port,
    }, null, 2) + '\n', { mode: 0o600 });
    await chmod(settingsPath(), 0o600);
  }
  return settings;
}

async function saveSettings(input) {
  const current = await readSettings();
  const next = {
    mode: input.mode === 'real' ? 'real' : 'mock',
    clientId: String(input.clientId || '').trim(),
    redirectUri: String(input.redirectUri || current.redirectUri).trim(),
    bridgeKey: String(input.bridgeKey || current.bridgeKey).trim(),
    port: Number(input.port || 8080),
  };
  const secret = String(input.clientSecret || current.clientSecret || '').trim();
  if (next.mode === 'real' && !secret) {
    throw new Error(current.clientSecretError || 'Real 模式必须填写 Client Secret');
  }
  if (secret) next.clientSecret = secret;
  await mkdir(app.getPath('userData'), { recursive: true });
  await writeFile(settingsPath(), JSON.stringify(next, null, 2) + '\n', { mode: 0o600 });
  await chmod(settingsPath(), 0o600);
  app.relaunch();
  app.exit(0);
}

async function buildRuntime(settings) {
  const base = join(app.getPath('userData'), 'runtime');
  const env = {
    WORKBUDDY_BRIDGE_MODE: settings.mode,
    WORKBUDDY_BRIDGE_HOST: '127.0.0.1',
    WORKBUDDY_BRIDGE_PORT: String(settings.port),
    WORKBUDDY_CLIENT_ID: settings.clientId,
    WORKBUDDY_CLIENT_SECRET: settings.clientSecret,
    WORKBUDDY_REDIRECT_URI: settings.redirectUri,
    WORKBUDDY_SCOPE: DESKTOP_SCOPE,
    WORKBUDDY_BRIDGE_KEY: settings.bridgeKey,
    WORKBUDDY_TOKEN_FILE: join(base, 'workbuddy-token.json'),
  };
  const [
    { loadConfig },
    { FileTokenStore },
    { WorkBuddyClient, MockWorkBuddyClient },
    { AcpClient, MockAcpClient },
    { HardwareBridge },
    { createBridgeHandler },
  ] = await Promise.all([
    import('../src/config.mjs'),
    import('../src/token-store.mjs'),
    import('../src/workbuddy-client.mjs'),
    import('../src/acp-client.mjs'),
    import('../src/bridge.mjs'),
    import('../src/server.mjs'),
  ]);
  const config = loadConfig(env, base);
  const tokenStore = new FileTokenStore(config.tokenFile);
  if (config.mode === 'real') {
    const token = await tokenStore.read();
    const granted = new Set(String(token?.scope || '').split(/\s+/).filter(Boolean));
    const required = config.scope.split(/\s+/).filter(Boolean);
    if (token?.access_token && required.some((scope) => !granted.has(scope))) {
      console.warn('Clearing legacy OAuth token because required scopes changed.');
      await tokenStore.clear();
    }
  }
  const workbuddy = config.mode === 'mock' ? new MockWorkBuddyClient() : new WorkBuddyClient({ config, tokenStore });
  const acp = config.mode === 'mock' ? new MockAcpClient() : new AcpClient();
  const bridge = new HardwareBridge({ workbuddy, acp });
  const handler = createBridgeHandler({ config, bridge, workbuddy, tokenStore });
  return { config, settings, tokenStore, workbuddy, acp, bridge, handler };
}

async function startServer() {
  const settings = await readSettings();
  runtime = await buildRuntime(settings);
  server = createServer(runtime.handler);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(runtime.config.port, '127.0.0.1', resolve);
  });
}

function registerIpc() {
  ipcMain.handle('settings:get', async () => {
    const settings = await readSettings();
    return {
      ...settings,
      clientSecret: settings.clientSecret ? '••••••••' : '',
      clientSecretAvailable: Boolean(settings.clientSecret),
    };
  });
  ipcMain.handle('settings:save', (_event, input) => saveSettings(input));
  ipcMain.handle('auth:start', async () => {
    if (!runtime.config.clientId || !runtime.config.clientSecret) {
      throw new Error('请先在接入设置中填写可读取的 Client ID 和 Client Secret');
    }
    const url = 'http://127.0.0.1:' + runtime.config.port + '/oauth/start';
    await shell.openExternal(url);
    return { ok: true };
  });
  ipcMain.handle('device:send', (_event, input) => runtime.bridge.handleDeviceEvent(input));
  ipcMain.handle('session:connect', (_event, taskId) => runtime.bridge.connectSession(taskId));
  ipcMain.handle('session:create', (_event, input) => runtime.bridge.createSession(input));
  ipcMain.handle('session:list', () => runtime.workbuddy.listTasks());
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 920,
    minHeight: 660,
    backgroundColor: '#07100d',
    title: 'WorkBuddy 硬件接入助手',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      partition: 'workbuddy-local-memory',
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  const openExternal = (url) => {
    try {
      const target = new URL(url);
      if (target.protocol === 'https:' || target.protocol === 'http:') {
        void shell.openExternal(target.toString());
      }
    } catch (error) {
      console.error('Failed to open external URL:', error);
    }
  };
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const target = new URL(url);
    if (!['127.0.0.1', 'localhost'].includes(target.hostname)) {
      event.preventDefault();
      openExternal(url);
    }
  });
  await mainWindow.loadURL('http://127.0.0.1:' + runtime.config.port);
}

app.whenReady().then(async () => {
  registerIpc();
  await startServer();
  await createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
}).catch((error) => {
  console.error(error);
  dialog.showErrorBox(
    'WorkBuddy 启动失败',
    error?.code === 'EADDRINUSE'
      ? '本机 8080 端口已被占用。请关闭其他短信回调或桥接程序后重试。'
      : String(error?.message || error),
  );
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('before-quit', () => {
  runtime?.acp?.close();
  server?.close();
});
