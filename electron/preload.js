import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('electronAPI', {
    onFingerprintDetected: (callback) => {
        ipcRenderer.on('fingerprint-detected', (_event, clientData) => callback(clientData));
    },
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    },
});
contextBridge.exposeInMainWorld('zkAPI', {
    // ── Capture a fingerprint (returns template in base64) ──────────────────────
    capture: () => ipcRenderer.invoke('zk:capture'),
    // ── Merge 3 templates for registration ────────────────────────────────────
    merge: (t1, t2, t3) => ipcRenderer.invoke('zk:merge', t1, t2, t3),
    // ── Cache ─────────────────────────────────────────────────────────────────
    addToCache: (fid, template) => ipcRenderer.invoke('zk:addToCache', fid, template),
    removeFromCache: (fid) => ipcRenderer.invoke('zk:removeFromCache', fid),
    clearCache: () => ipcRenderer.invoke('zk:clearCache'),
    identify: () => ipcRenderer.invoke('zk:identify'),
});
