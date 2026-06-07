import { app, BrowserWindow } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

let adminWindow: BrowserWindow | null = null
let kioskWindow: BrowserWindow | null = null

function createAdminWindow() {
  adminWindow = new BrowserWindow({
    width: 1280,
    height: 800,
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

function createKioskWindow() {
  kioskWindow = new BrowserWindow({
    fullscreen: true,
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

app.whenReady().then(() => {
  createAdminWindow()
  createKioskWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})