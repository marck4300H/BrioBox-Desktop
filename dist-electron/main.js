import { BrowserWindow, app } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
//#region electron/main.ts
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
var adminWindow = null;
var kioskWindow = null;
function createAdminWindow() {
	adminWindow = new BrowserWindow({
		width: 1280,
		height: 800,
		webPreferences: {
			preload: path.join(__dirname, "preload.mjs"),
			contextIsolation: true
		},
		title: "BrioBox — Sistema de Gestión"
	});
	if (VITE_DEV_SERVER_URL) adminWindow.loadURL(VITE_DEV_SERVER_URL);
	else adminWindow.loadFile(path.join(__dirname, "../dist/index.html"));
}
function createKioskWindow() {
	kioskWindow = new BrowserWindow({
		fullscreen: true,
		webPreferences: {
			preload: path.join(__dirname, "preload.mjs"),
			contextIsolation: true
		},
		title: "BrioBox — Entrada"
	});
	if (VITE_DEV_SERVER_URL) kioskWindow.loadURL(`${VITE_DEV_SERVER_URL}#/kiosk`);
	else kioskWindow.loadFile(path.join(__dirname, "../dist/index.html"), { hash: "/kiosk" });
}
app.whenReady().then(() => {
	createAdminWindow();
	createKioskWindow();
});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
//#endregion
