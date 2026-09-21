const { app, BrowserWindow, ipcMain, shell, screen } = require('electron');
const { join } = require('node:path');

app.setName('鹿鹿精灵');
let window;

async function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  window = new BrowserWindow({
    width: 366, height: 530, minWidth: 340, minHeight: 440,
    x: Math.max(0, width - 400), y: Math.max(0, height - 565),
    frame: false, transparent: true, alwaysOnTop: true,
    icon: join(__dirname, 'icon.png'),
    resizable: true, show: false, skipTaskbar: false,
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'), contextIsolation: true,
      nodeIntegration: false, sandbox: true,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  await window.loadFile(join(__dirname, 'ui', 'index.html'));
  window.once('ready-to-show', () => window.show());
}

app.whenReady().then(() => {
  let bridge;
  async function getBridge() {
    if (!bridge) {
      const { PetBridge } = await import('./bridge.mjs');
      bridge = new PetBridge();
    }
    return bridge;
  }
  ipcMain.handle('pet:status', async () => {
    try { return await (await getBridge()).status(); }
    catch { return { connected: false, authorized: false, mode: 'offline' }; }
  });
  ipcMain.handle('pet:send', async (_event, text) => (await getBridge()).send(text));
  ipcMain.handle('pet:job', async (_event, eventId) => {
    const { replyText } = await import('./bridge.mjs');
    const job = await (await getBridge()).job(eventId);
    return { status: job.status, error: job.error, reply: job.status === 'completed' ? replyText(job.reply) : undefined };
  });
  ipcMain.handle('pet:openBridge', () => shell.openExternal('http://127.0.0.1:8080/'));
  ipcMain.handle('pet:close', () => app.quit());
  ipcMain.handle('pet:pin', (_event, value) => {
    window.setAlwaysOnTop(Boolean(value));
    return window.isAlwaysOnTop();
  });
  return createWindow();
}).catch((error) => {
  console.error(error);
  app.quit();
});

app.on('window-all-closed', () => app.quit());
