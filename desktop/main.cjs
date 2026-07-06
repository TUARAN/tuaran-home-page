const { app, BrowserWindow, Menu, shell } = require('electron')
const path = require('path')

const DEFAULT_START_URL = 'https://2aran.com'
const startUrl = process.env.ELECTRON_START_URL || DEFAULT_START_URL

function isSameOrigin(url) {
  try {
    return new URL(url).origin === new URL(startUrl).origin
  } catch {
    return false
  }
}

function createMenu() {
  const template = [
    ...(process.platform === 'darwin'
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 680,
    title: '2aran Desktop',
    backgroundColor: '#f2efe7',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isSameOrigin(url)) return { action: 'allow' }
    shell.openExternal(url)
    return { action: 'deny' }
  })

  win.webContents.on('will-navigate', (event, url) => {
    if (isSameOrigin(url)) return
    event.preventDefault()
    shell.openExternal(url)
  })

  win.webContents.on('did-fail-load', (_event, _code, description, failedUrl) => {
    const escapedDescription = String(description || '页面加载失败').replace(/[<>&"]/g, (char) => {
      const entities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }
      return entities[char]
    })
    const escapedUrl = String(failedUrl || startUrl).replace(/[<>&"]/g, (char) => {
      const entities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }
      return entities[char]
    })

    win.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(`
        <!doctype html>
        <html lang="zh-CN">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>2aran Desktop</title>
            <style>
              body {
                margin: 0;
                min-height: 100vh;
                display: grid;
                place-items: center;
                background: #f2efe7;
                color: #171611;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              }
              main {
                max-width: 560px;
                padding: 32px;
                line-height: 1.8;
              }
              h1 {
                margin: 0 0 12px;
                font-size: 28px;
              }
              p {
                margin: 0 0 12px;
                color: #5f5b52;
              }
              code {
                word-break: break-all;
              }
            </style>
          </head>
          <body>
            <main>
              <h1>页面加载失败</h1>
              <p>${escapedDescription}</p>
              <p><code>${escapedUrl}</code></p>
              <p>请检查网络连接，或稍后重新打开 2aran Desktop。</p>
            </main>
          </body>
        </html>
      `)}`,
    )
  })

  win.loadURL(startUrl)
}

app.setName('2aran Desktop')

app.whenReady().then(() => {
  createMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
