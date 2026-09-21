const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pet', Object.freeze({
  status: () => ipcRenderer.invoke('pet:status'),
  send: (text) => ipcRenderer.invoke('pet:send', text),
  job: (id) => ipcRenderer.invoke('pet:job', id),
  openBridge: () => ipcRenderer.invoke('pet:openBridge'),
  pin: (value) => ipcRenderer.invoke('pet:pin', value),
  close: () => ipcRenderer.invoke('pet:close'),
}));
