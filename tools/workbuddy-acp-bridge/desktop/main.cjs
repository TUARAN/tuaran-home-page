const { app, BrowserWindow, ipcMain, safeStorage } = require('electron');
const { createServer } = require('node:http');
const { randomBytes } = require('node:crypto');
const { readFile, writeFile, mkdir } = require('node:fs/promises');
const { join } = require('node:path');

app.setName('ACP 短信桥接台');

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
  let clientSecret = '';
  if (stored.clientSecretEncrypted && safeStorage.isEncryptionAvailable()) {
    try { clientSecret = safeStorage.decryptString(Buffer.from(stored.clientSecretEncrypted, 'base64')); } catch {}
  }
  const settings = {
    mode: stored.mode || 'mock',
    clientId: stored.clientId || '',
    clientSecret,
    redirectUri: stored.redirectUri || 'http://localhost:8799/oauth/callback',
    bridgeKey: stored.bridgeKey || randomBytes(24).toString('base64url'),
    port: Number(stored.port || 8799),
  };
  if (shouldPersist || !stored.bridgeKey) {
    await mkdir(app.getPath('userData'), { recursive: true });
    await writeFile(settingsPath(), JSON.stringify({
      ...stored,
      mode: settings.mode,
      clientId: settings.clientId,
      redirectUri: settings.redirectUri,
      bridgeKey: settings.bridgeKey,
      port: settings.port,
    }, null, 2) + '\n', { mode: 0o600 });
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
    port: Number(input.port || 8799),
  };
  const secret = String(input.clientSecret || current.clientSecret || '');
  if (secret && safeStorage.isEncryptionAvailable()) {
    next.clientSecretEncrypted = safeStorage.encryptString(secret).toString('base64');
  }
  await mkdir(app.getPath('userData'), { recursive: true });
  await writeFile(settingsPath(), JSON.stringify(next, null, 2) + '\n', { mode: 0o600 });
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
    return { ...settings, clientSecret: settings.clientSecret ? '••••••••' : '' };
  });
  ipcMain.handle('settings:save', (_event, input) => saveSettings(input));
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
    title: 'ACP 短信桥接台',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
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
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('before-quit', () => {
  runtime?.acp?.close();
  server?.close();
});
