import { app } from 'electron'
import path from 'path'
import koffi from 'koffi'
import { PNG } from 'pngjs'

const DLL_PATH = path.join(app.getAppPath(), 'resources', 'zkfp_wrapper.dll')
const lib = koffi.load(DLL_PATH)
 
export const MAX_TEMPLATE_SIZE = 2048
 
// ─── Wrapper function definitions ──────────────────────────────────────────
 
const Wrap_Init            = lib.func('__stdcall', 'Wrap_Init', 'int', [])
const Wrap_Terminate       = lib.func('__stdcall', 'Wrap_Terminate', 'int', [])
const Wrap_GetDeviceCount  = lib.func('__stdcall', 'Wrap_GetDeviceCount', 'int', [])
const Wrap_OpenDevice      = lib.func('__stdcall', 'Wrap_OpenDevice', 'void *', ['int'])
const Wrap_CloseDevice     = lib.func('__stdcall', 'Wrap_CloseDevice', 'int', ['void *'])
 
const Wrap_AcquireFingerprint = lib.func(
  '__stdcall', 'Wrap_AcquireFingerprint', 'int',
  ['void *', 'uint8_t *', 'uint32_t', 'uint8_t *', 'uint32_t *']
)
 
const Wrap_DBInit    = lib.func('__stdcall', 'Wrap_DBInit', 'void *', [])
const Wrap_DBFree    = lib.func('__stdcall', 'Wrap_DBFree', 'int', ['void *'])
const Wrap_DBClear   = lib.func('__stdcall', 'Wrap_DBClear', 'int', ['void *'])
const Wrap_DBDel     = lib.func('__stdcall', 'Wrap_DBDel', 'int', ['void *', 'uint32_t'])
 
const Wrap_DBAdd = lib.func(
  '__stdcall', 'Wrap_DBAdd', 'int',
  ['void *', 'uint32_t', 'uint8_t *', 'uint32_t']
)
 
const Wrap_DBMerge = lib.func(
  '__stdcall', 'Wrap_DBMerge', 'int',
  ['void *', 'uint8_t *', 'uint8_t *', 'uint8_t *', 'uint8_t *', 'uint32_t *']
)
 
const Wrap_DBIdentify = lib.func(
  '__stdcall', 'Wrap_DBIdentify', 'int',
  ['void *', 'uint8_t *', 'uint32_t', 'uint32_t *', 'uint32_t *']
)
 
const Wrap_DBMatch = lib.func(
  '__stdcall', 'Wrap_DBMatch', 'int',
  ['void *', 'uint8_t *', 'uint32_t', 'uint8_t *', 'uint32_t']
)
 
const Wrap_GetCaptureParamsEx = lib.func(
  '__stdcall', 'Wrap_GetCaptureParamsEx', 'int',
  ['void *', 'int *', 'int *', 'int *']
)
 
// ─── Global state ───────────────────────────────────────────────────────────
 
let deviceHandle: any = null
let dbHandle: any = null                                                         
let imageSize: number = 82944 // fallback, calculated when opening the device
let currentImageWidth: number = 300
let currentImageHeight: number = 400
 
// ─── Exported functions ─────────────────────────────────────────────────────
 
export function initReader(): { success: boolean; error?: string } {
  console.log('=== ZK Init ===')
  const initResult = Wrap_Init()
  console.log('Wrap_Init returned:', initResult)
  
  if (initResult !== 0) return { success: false, error: `Init failed: ${initResult}` }
 
  const count = Wrap_GetDeviceCount()
  if (count <= 0) return { success: false, error: 'No se detectó ningún lector conectado' }
 
  deviceHandle = Wrap_OpenDevice(0)
  if (!deviceHandle) return { success: false, error: 'No se pudo abrir el dispositivo' }
 
  // Get actual image size from device using Node.js Buffers
  const widthBuf = Buffer.alloc(4)
  const heightBuf = Buffer.alloc(4)
  const dpiBuf = Buffer.alloc(4)
  const paramsResult = Wrap_GetCaptureParamsEx(deviceHandle, widthBuf, heightBuf, dpiBuf)
  if (paramsResult === 0) {
    const width = widthBuf.readInt32LE(0)
    const height = heightBuf.readInt32LE(0)
    const dpi = dpiBuf.readInt32LE(0)
    currentImageWidth = width
    currentImageHeight = height
    imageSize = width * height
    console.log(`ZK Reader: ${width}x${height} @ ${dpi}DPI — imageSize: ${imageSize}`)
  }
 
  dbHandle = Wrap_DBInit()
  if (!dbHandle) return { success: false, error: 'No se pudo inicializar la caché' }
 
  return { success: true }
}
 
export function captureFingerprint(): {
  success: boolean
  template?: Buffer
  image?: Buffer
  imageWidth?: number
  imageHeight?: number
  error?: string
} {
  if (!deviceHandle) return { success: false, error: 'Lector no inicializado' }

  const fpImage    = Buffer.alloc(imageSize)
  const fpTemplate = Buffer.alloc(MAX_TEMPLATE_SIZE)
  const cbTemplateBuf = Buffer.alloc(4)
  cbTemplateBuf.writeUInt32LE(MAX_TEMPLATE_SIZE, 0)

  const result = Wrap_AcquireFingerprint(deviceHandle, fpImage, imageSize, fpTemplate, cbTemplateBuf)
  if (result !== 0) return { success: false, error: `Captura falló: ${result}` }

  const actualSize = cbTemplateBuf.readUInt32LE(0)

  return {
    success: true,
    template: fpTemplate.subarray(0, actualSize),
    image: fpImage,
    imageWidth: currentImageWidth,
    imageHeight: currentImageHeight,
  }
}
 
export function mergeTemplates(
  t1: Buffer, t2: Buffer, t3: Buffer
): { success: boolean; mergedTemplate?: Buffer; error?: string } {
  if (!dbHandle) return { success: false, error: 'Cache no inicializada' }
 
  const merged   = Buffer.alloc(MAX_TEMPLATE_SIZE)
  const cbMergedBuf = Buffer.alloc(4)
  cbMergedBuf.writeUInt32LE(MAX_TEMPLATE_SIZE, 0)
 
  const result = Wrap_DBMerge(dbHandle, t1, t2, t3, merged, cbMergedBuf)
  if (result !== 0) return { success: false, error: `Merge falló: ${result}` }
 
  const actualSize = cbMergedBuf.readUInt32LE(0)
  return { success: true, mergedTemplate: merged.subarray(0, actualSize) }
}
 
export function addToCache(fid: number, template: Buffer): { success: boolean; error?: string } {
  if (!dbHandle) return { success: false, error: 'Cache no inicializada' }
  const result = Wrap_DBAdd(dbHandle, fid, template, template.length)
  if (result !== 0) return { success: false, error: `DBAdd falló: ${result}` }
  return { success: true }
}
 
export function removeFromCache(fid: number): { success: boolean; error?: string } {
  if (!dbHandle) return { success: false, error: 'Cache no inicializada' }
  const result = Wrap_DBDel(dbHandle, fid)
  if (result !== 0) return { success: false, error: `DBDel falló: ${result}` }
  return { success: true }
}
 
export function clearCache(): { success: boolean; error?: string } {
  if (!dbHandle) return { success: false, error: 'Cache no inicializada' }
  const result = Wrap_DBClear(dbHandle)
  if (result !== 0) return { success: false, error: `DBClear falló: ${result}` }
  return { success: true }
}
 
export function identifyFingerprint(
  template: Buffer
): { success: boolean; fid?: number; score?: number; error?: string } {
  if (!dbHandle) return { success: false, error: 'Cache no inicializada' }
 
  const fidBuf   = Buffer.alloc(4)
  const scoreBuf = Buffer.alloc(4)
 
  const result = Wrap_DBIdentify(dbHandle, template, template.length, fidBuf, scoreBuf)
  if (result !== 0) return { success: false, error: `Identify falló: ${result}` }
 
  return { success: true, fid: fidBuf.readUInt32LE(0), score: scoreBuf.readUInt32LE(0) }
}
 
export function terminateReader(): void {
  if (dbHandle)     { Wrap_DBFree(dbHandle);       dbHandle     = null }
  if (deviceHandle) { Wrap_CloseDevice(deviceHandle); deviceHandle = null }
  Wrap_Terminate()
}
 
export function grayscaleToPNG(rawImage: Buffer, width: number, height: number): Buffer {
  const png = new PNG({ width, height, colorType: 0 }) // colorType 0 = escala de grises
 
  for (let i = 0; i < rawImage.length; i++) {
    const val = rawImage[i]
    const idx = i * 4
    png.data[idx]     = val // R
    png.data[idx + 1] = val // G
    png.data[idx + 2] = val // B
    png.data[idx + 3] = 255 // A (Opaco)
  }
 
  return PNG.sync.write(png)
}
 