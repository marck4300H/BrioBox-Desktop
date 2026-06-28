import { app, BrowserWindow, screen, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import { execSync } from 'child_process'
import path from 'path'

const resourcesPath = path.join(process.cwd(), 'resources')
process.env.PATH = resourcesPath + ';' + (process.env.PATH || '')

// Forces 
try {
  execSync(`cd /d "${resourcesPath}"`)
} catch { }

import {
  initReader,
  captureFingerprint,
  pollFingerprint,
  mergeTemplates,
  addToCache,
  removeFromCache,
  clearCache,
  identifyFingerprint,
  terminateReader,
  grayscaleToPNG,
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

let isPollingKiosk = false

async function loadFingerprintsIntoCache(apiUrl: string): Promise<void> {
  console.log('Kiosko: Cargando huellas desde la API...')
  try {
    const res = await fetch(`${apiUrl}/fingerprints`)
    if (!res.ok) {
      console.error(`Kiosko: Error al obtener huellas de la API (status: ${res.status})`)
      return
    }
    const data: any = await res.json()
    
    // La API retorna directamente un Array de huellas
    const fingerprintsArray = Array.isArray(data) ? data : (data?.fingerprints || [])
    
    if (!Array.isArray(fingerprintsArray)) {
      console.error('Kiosko: Respuesta de huellas inválida (no es array):', data)
      return
    }

    clearCache() // Limpiar caché previa
    let loaded = 0
    for (const entry of fingerprintsArray) {
      if (!entry.fingerprint_hash) continue 
      const numericFid = parseInt(String(entry.id), 10)
      if (isNaN(numericFid)) {
        console.warn(`Kiosko: ID no numérico ignorado: ${entry.id}`)
        continue
      }
      const templateBuffer = Buffer.from(entry.fingerprint_hash, 'base64')
      const addResult = addToCache(numericFid, templateBuffer)
      if (addResult.success) {
        loaded++
      } else {
        console.warn(`Kiosko: Error al cargar huella del cliente ${entry.id}:`, addResult.error)
      }
    }

    console.log(`Kiosko: ${loaded} huellas cargadas en la caché local del lector.`)
  } catch (err) {
    console.error('Kiosko: Excepción al cargar huellas:', err)
  }
}

async function startKioskPolling() {
  if (isPollingKiosk) return
  isPollingKiosk = true
  console.log('Bucle de lectura de huella para Kiosko INICIADO')

  const apiUrl = process.env.VITE_API_URL || 'https://stayaway-briobox-server.onrender.com/api'

  // Cargar todas las huellas en la caché local del SDK ZK antes de empezar a escuchar
  await loadFingerprintsIntoCache(apiUrl)

  while (isPollingKiosk && kioskWindow && !kioskWindow.isDestroyed()) {
    try {
      const template = pollFingerprint()
      if (template) {
        const result = identifyFingerprint(template)
        if (result.success && result.fid !== undefined && result.score !== undefined && result.score >= 50) {
          console.log(`Lector Kiosko: Huella identificada. FID/ClienteID=${result.fid}, Score=${result.score}`)

          try {
            const apiRes = await fetch(`${apiUrl}/users/customer/${result.fid}`)
            if (apiRes.ok) {
              const resData: any = await apiRes.json()
              if (resData.success && resData.user) {
                const client = resData.user
                const fullName = `${client.first_name} ${client.paternal_last_name}`

                kioskWindow?.webContents.send('fingerprint-detected', {
                  id: client.id,
                  name: fullName,
                  membershipType: client.membershipType || 'Activa',
                })
              }
            } else {
              console.warn(`Lector Kiosko: No se pudo obtener datos del cliente ${result.fid} (status: ${apiRes.status})`)
            }
          } catch (err) {
            console.error('Lector Kiosko: Error consultando datos del cliente:', err)
          }

          // Esperar 4.5s para no detectar la misma huella repetidamente
          await new Promise(resolve => setTimeout(resolve, 4500))
        } else {
          // Detectó algo pero con score bajo, espera breve antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }
    } catch (e) {
      console.error('Lector Kiosko: Error en bucle de escaneo:', e)
    }

    // Espera regular para no consumir CPU
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  isPollingKiosk = false
  console.log('Bucle de lectura de huella para Kiosko DETENIDO')
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

  kioskWindow.on('closed', () => {
    isPollingKiosk = false
    kioskWindow = null
  })

  startKioskPolling()
}

// ─── App ready ────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  const displays = screen.getAllDisplays()
  const primary = screen.getPrimaryDisplay()
  const secondary = displays.find(d => d.id !== primary.id)

  console.log('arch:', process.arch)
  console.log('platform:', process.platform)

  // Initialize fingerprint reader FIRST so deviceHandle is ready before the kiosk polling loop starts
  const zkInit = initReader()
  if (!zkInit.success) {
    console.warn('ZK Reader no disponible:', zkInit.error)
  } else {
    console.log('ZK Reader inicializado correctamente')
  }

  createAdminWindow(primary)
  createKioskWindow(secondary ?? primary)  // ← startKioskPolling() se llama aquí, el lector ya está listo
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
  const result = await captureFingerprint()
  if (!result.success) return { success: false, error: result.error }

  let imageBase64: string | undefined = undefined
  if (result.image && result.imageWidth && result.imageHeight) {
    try {
      const pngBuffer = grayscaleToPNG(result.image, result.imageWidth, result.imageHeight)
      imageBase64 = pngBuffer.toString('base64')
    } catch (err) {
      console.error('Error al convertir huella a PNG:', err)
    }
  }

  return {
    success: true,
    template: result.template!.toString('base64'),
    imageBase64
  }
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
  const capture = await captureFingerprint()
  if (!capture.success) return { success: false, error: capture.error }

  const result = identifyFingerprint(capture.template!)
  if (!result.success) return { success: false, error: result.error }

  return { success: true, fid: result.fid, score: result.score }
})