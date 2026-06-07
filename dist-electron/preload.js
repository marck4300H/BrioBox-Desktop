import { contextBridge, ipcRenderer } from "electron";
//#region electron/preload.ts
contextBridge.exposeInMainWorld("electronAPI", {
	onFingerprintDetected: (callback) => {
		ipcRenderer.on("fingerprint-detected", (_event, clientData) => callback(clientData));
	},
	removeAllListeners: (channel) => {
		ipcRenderer.removeAllListeners(channel);
	}
});
//#endregion
export {};
