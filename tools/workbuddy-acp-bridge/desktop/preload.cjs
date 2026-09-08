const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('acpDesktop', {
  isDesktop: true,
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  sendDeviceMessage: (message) => ipcRenderer.invoke('device:send', message),
  connectSession: (taskId) => ipcRenderer.invoke('session:connect', taskId),
  createSession: (input) => ipcRenderer.invoke('session:create', input),
  listTasks: () => ipcRenderer.invoke('session:list'),
});
