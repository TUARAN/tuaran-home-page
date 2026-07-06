const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('desktopApp', {
  name: '2aran Desktop',
  platform: process.platform,
  electron: process.versions.electron,
})
