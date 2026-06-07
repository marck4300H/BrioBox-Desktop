import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  onFingerprintDetected: (callback: (clientData: unknown) => void) => {
    ipcRenderer.on('fingerprint-detected', (_event, clientData) => callback(clientData))
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },
})