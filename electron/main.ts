import { app, BrowserWindow, screen, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import { execSync } from 'child_process'
import path from 'path'

const resourcesPath = path.join(process.cwd(), 'resources')
process.env.PATH = resourcesPath + ';' + (process.env.PATH || '')

// Forces 
try {
  execSync(`cd /d "${resourcesPath}"`)
} catch {}

import {
  initReader,
  captureFingerprint,
  mergeTemplates,
  addToCache,
  removeFromCache,
  clearCache,
  identifyFingerprint,
  terminateReader,
} from './zk-fingerprint'
 
const __dirname = path.dirname(fileURLToPath(import.meta.url))
 
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
 
let adminWindow: BrowserWindow | null = null
let kioskWindow: BrowserWindow | null = null
 
function createAdminWindow(display: Electron.Display) {
  const { x, y, width, height } = display.bounds
 
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
  })
 
  if (VITE_DEV_SERVER_URL) {
    adminWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    adminWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}
 
function createKioskWindow(display: Electron.Display) {
  const { x, y, width, height } = display.bounds
 
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
  })
 
  if (VITE_DEV_SERVER_URL) {
    kioskWindow.loadURL(`${VITE_DEV_SERVER_URL}#/kiosk`)
  } else {
    kioskWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: '/kiosk',
    })
  }
}
 
// ─── App ready ────────────────────────────────────────────────────────────────
 
app.whenReady().then(() => {
  const displays  = screen.getAllDisplays()
  const primary   = screen.getPrimaryDisplay()
  const secondary = displays.find(d => d.id !== primary.id)
 
  createAdminWindow(primary)
  createKioskWindow(secondary ?? primary)
 
  // Initialize fingerprint reader
  const zkInit = initReader()
  if (!zkInit.success) {
    console.warn('ZK Reader no disponible:', zkInit.error)
  } else {
    console.log('ZK Reader inicializado correctamente')
  }
})
 
app.on('before-quit', () => {
  terminateReader()
})
 
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
 
// ─── IPC: Fingerprint ─────────────────────────────────────────────────────
 
// Captures a fingerprint and returns the template in base64
ipcMain.handle('zk:capture', async () => {
  const result = captureFingerprint()
  if (!result.success) return { success: false, error: result.error }
  return { success: true, template: result.template!.toString('base64') }
})
 
// Merges 3 captured templates to generate the registration template
ipcMain.handle('zk:merge', async (_e, t1b64: string, t2b64: string, t3b64: string) => {
  const t1 = Buffer.from(t1b64, 'base64')
  const t2 = Buffer.from(t2b64, 'base64')
  const t3 = Buffer.from(t3b64, 'base64')
  const result = mergeTemplates(t1, t2, t3)
  if (!result.success) return { success: false, error: result.error }
  return { success: true, mergedTemplate: result.mergedTemplate!.toString('base64') }
})
 
// Adds a template to the identification cache
ipcMain.handle('zk:addToCache', async (_e, fid: number, templateB64: string) => {
  return addToCache(fid, Buffer.from(templateB64, 'base64'))
})
 
// Removes a member from the cache
ipcMain.handle('zk:removeFromCache', async (_e, fid: number) => {
  return removeFromCache(fid)
})
 
// Clears the entire cache
ipcMain.handle('zk:clearCache', async () => {
  return clearCache()
})
 
// Captures + identifies in one step (kiosk flow)
ipcMain.handle('zk:identify', async () => {
  const capture = captureFingerprint()
  if (!capture.success) return { success: false, error: capture.error }
 
  const result = identifyFingerprint(capture.template!)
  if (!result.success) return { success: false, error: result.error }
 
  return { success: true, fid: result.fid, score: result.score }
})