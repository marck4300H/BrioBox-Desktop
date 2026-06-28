import { app, BrowserWindow, screen, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import { execSync } from 'child_process';
import path from 'path';
const resourcesPath = path.join(process.cwd(), 'resources');
process.env.PATH = resourcesPath + ';' + (process.env.PATH || '');
// Forces 
try {
    execSync(`cd /d "${resourcesPath}"`);
}
catch { }
import { initReader, captureFingerprint, pollFingerprint, mergeTemplates, addToCache, removeFromCache, clearCache, identifyFingerprint, terminateReader, grayscaleToPNG, } from './zk-fingerprint';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
let adminWindow = null;
let kioskWindow = null;
function createAdminWindow(display) {
    const { x, y, width, height } = display.bounds;
    adminWindow = new BrowserWindow({
        x,
        y,
        width,
        height,
        icon: path.join(__dirname, '../public/brioboxlogoicon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            contextIsolation: true,
        },
        title: 'BrioBox — Sistema de Gestión',
    });
    if (VITE_DEV_SERVER_URL) {
        adminWindow.loadURL(VITE_DEV_SERVER_URL);
    }
    else {
        adminWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}
let isPollingKiosk = false;
async function startKioskPolling() {
    if (isPollingKiosk)
        return;
    isPollingKiosk = true;
    console.log('Bucle de lectura de huella para Kiosko INICIADO');
    const apiUrl = process.env.VITE_API_URL || 'https://stayaway-briobox-server.onrender.com/api';
    while (isPollingKiosk && kioskWindow && !kioskWindow.isDestroyed()) {
        try {
            const template = pollFingerprint();
            if (template) {
                const result = identifyFingerprint(template);
                if (result.success && result.fid !== undefined && result.score !== undefined && result.score >= 50) {
                    console.log(`Lector Kiosko: Huella identificada con FID ${result.fid} (Score: ${result.score})`);
                    try {
                        const apiRes = await fetch(`${apiUrl}/users/customer/${result.fid}`);
                        if (apiRes.ok) {
                            const resData = await apiRes.json();
                            if (resData.success && resData.user) {
                                const client = resData.user;
                                const fullName = `${client.first_name} ${client.paternal_last_name}`;
                                kioskWindow.webContents.send('fingerprint-detected', {
                                    id: client.id,
                                    name: fullName,
                                    membershipType: client.membershipType || 'Activa',
                                });
                            }
                        }
                        else {
                            console.warn(`Lector Kiosko: No se pudo obtener datos del cliente ${result.fid} de la API (status: ${apiRes.status})`);
                        }
                    }
                    catch (err) {
                        console.error('Lector Kiosko: Error consultando datos del cliente:', err);
                    }
                    // Esperar 4.5 segundos para que la UI del kiosko muestre el mensaje de éxito sin detectar la misma huella repetidamente
                    await new Promise(resolve => setTimeout(resolve, 4500));
                }
                else {
                    // Si detectó algo pero no coincide con la confianza mínima, espera brevemente
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }
        }
        catch (e) {
            console.error('Lector Kiosko: Error en bucle de escaneo:', e);
        }
        // Espera regular para no consumir CPU
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    isPollingKiosk = false;
    console.log('Bucle de lectura de huella para Kiosko DETENIDO');
}
function createKioskWindow(display) {
    const { x, y, width, height } = display.bounds;
    kioskWindow = new BrowserWindow({
        x,
        y,
        width,
        height,
        icon: path.join(__dirname, '../public/brioboxlogo.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            contextIsolation: true,
        },
        title: 'BrioBox — Entrada',
    });
    if (VITE_DEV_SERVER_URL) {
        kioskWindow.loadURL(`${VITE_DEV_SERVER_URL}#/kiosk`);
    }
    else {
        kioskWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
            hash: '/kiosk',
        });
    }
    kioskWindow.on('closed', () => {
        isPollingKiosk = false;
        kioskWindow = null;
    });
    startKioskPolling();
}
// ─── App ready ────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
    const displays = screen.getAllDisplays();
    const primary = screen.getPrimaryDisplay();
    const secondary = displays.find(d => d.id !== primary.id);
    createAdminWindow(primary);
    createKioskWindow(secondary ?? primary);
    console.log('arch:', process.arch);
    console.log('platform:', process.platform);
    // Initialize fingerprint reader
    const zkInit = initReader();
    if (!zkInit.success) {
        console.warn('ZK Reader no disponible:', zkInit.error);
    }
    else {
        console.log('ZK Reader inicializado correctamente');
    }
});
app.on('before-quit', () => {
    terminateReader();
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit();
});
// ─── IPC: Fingerprint ─────────────────────────────────────────────────────
// Captures a fingerprint and returns the template in base64
ipcMain.handle('zk:capture', async () => {
    const result = await captureFingerprint();
    if (!result.success)
        return { success: false, error: result.error };
    let imageBase64 = undefined;
    if (result.image && result.imageWidth && result.imageHeight) {
        try {
            const pngBuffer = grayscaleToPNG(result.image, result.imageWidth, result.imageHeight);
            imageBase64 = pngBuffer.toString('base64');
        }
        catch (err) {
            console.error('Error al convertir huella a PNG:', err);
        }
    }
    return {
        success: true,
        template: result.template.toString('base64'),
        imageBase64
    };
});
// Merges 3 captured templates to generate the registration template
ipcMain.handle('zk:merge', async (_e, t1b64, t2b64, t3b64) => {
    const t1 = Buffer.from(t1b64, 'base64');
    const t2 = Buffer.from(t2b64, 'base64');
    const t3 = Buffer.from(t3b64, 'base64');
    const result = mergeTemplates(t1, t2, t3);
    if (!result.success)
        return { success: false, error: result.error };
    return { success: true, mergedTemplate: result.mergedTemplate.toString('base64') };
});
// Adds a template to the identification cache
ipcMain.handle('zk:addToCache', async (_e, fid, templateB64) => {
    return addToCache(fid, Buffer.from(templateB64, 'base64'));
});
// Removes a member from the cache
ipcMain.handle('zk:removeFromCache', async (_e, fid) => {
    return removeFromCache(fid);
});
// Clears the entire cache
ipcMain.handle('zk:clearCache', async () => {
    return clearCache();
});
// Captures + identifies in one step (kiosk flow)
ipcMain.handle('zk:identify', async () => {
    const capture = await captureFingerprint();
    if (!capture.success)
        return { success: false, error: capture.error };
    const result = identifyFingerprint(capture.template);
    if (!result.success)
        return { success: false, error: result.error };
    return { success: true, fid: result.fid, score: result.score };
});
