import { app, BrowserWindow, screen } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

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

app.whenReady().then(() => {
  const displays = screen.getAllDisplays()
  const primary = screen.getPrimaryDisplay()
  const secondary = displays.find(d => d.id !== primary.id)

  // Admin siempre en pantalla principal
  createAdminWindow(primary)

  // Kiosk en secundaria si existe, si no en la misma primaria
  createKioskWindow(secondary ?? primary)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})