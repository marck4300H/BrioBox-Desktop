let electron = require("electron");
//#region electron/preload.ts
electron.contextBridge.exposeInMainWorld("electronAPI", {
	onFingerprintDetected: (callback) => {
		electron.ipcRenderer.on("fingerprint-detected", (_event, clientData) => callback(clientData));
	},
	removeAllListeners: (channel) => {
		electron.ipcRenderer.removeAllListeners(channel);
	}
});
//#endregion
