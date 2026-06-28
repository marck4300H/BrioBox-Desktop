import { useState } from 'react'

interface CaptureResult {
  success: boolean
  template?: string
  imageBase64?: string
  error?: string
}

interface IdentifyResult {
  success: boolean
  fid?: number
  score?: number
  error?: string
}

interface MergeResult {
  success: boolean
  mergedTemplate?: string
  error?: string
}

export function useFingerprint() {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [scanStep, setScanStep]     = useState(0) // Counter to do scans
  const [imageBase64, setImageBase64] = useState<string | null>(null)

  const [capturedTemplates, setCapturedTemplates] = useState<string[]>([])

  /**
   * Captura UNA huella. Llamar 3 veces, una por cada clic del usuario.
   * El usuario debe poner el dedo justo antes de cada clic.
   */
  async function captureOne(): Promise<string | null> {
    setIsScanning(true)
    setError(null)

    try {
      const result: CaptureResult = await window.zkAPI.capture()
      if (!result.success) throw new Error(result.error)

      setCapturedTemplates(prev => {
        const updated = [...prev, result.template!]
        setScanStep(updated.length)
        return updated
      })

      if (result.imageBase64) {
        setImageBase64(result.imageBase64)
      }

      return result.template!
    } catch (e: any) {
      setError(e.message)
      return null
    } finally {
      setIsScanning(false)
    }
  }

  /**
   * Fusiona las 3 capturas ya hechas en un template final.
   * Llamar solo después de 3 capturas exitosas con captureOne().
   */
  async function finishRegistration(templates?: string[]): Promise<string | null> {
    const list = templates || capturedTemplates
    if (list.length < 3) {
      setError('Faltan capturas, se necesitan 3.')
      return null
    }

    setIsScanning(true)
    setError(null)

    try {
      const merged: MergeResult = await window.zkAPI.merge(
        list[0],
        list[1],
        list[2]
      )
      if (!merged.success) throw new Error(merged.error)
      return merged.mergedTemplate!
    } catch (e: any) {
      setError(e.message)
      return null
    } finally {
      setIsScanning(false)
    }
  }

  /** Reinicia el progreso de registro (ej: si el usuario quiere empezar de nuevo) */
  function resetRegistration() {
    setCapturedTemplates([])
    setScanStep(0)
    setError(null)
    setImageBase64(null)
  }

  /** Flujo del kiosko: captura + identifica en un solo paso */
  async function identifyMember(): Promise<IdentifyResult> {
    setIsScanning(true)
    setError(null)

    try {
      const result: IdentifyResult = await window.zkAPI.identify()
      if (!result.success) throw new Error(result.error)
      return result
    } catch (e: any) {
      setError(e.message)
      return { success: false, error: e.message }
    } finally {
      setIsScanning(false)
    }
  }

  async function loadMembersToCache(
    members: Array<{ id: number; fingerprint_template: string }>
  ): Promise<void> {
    await window.zkAPI.clearCache()
    for (const member of members) {
      await window.zkAPI.addToCache(member.id, member.fingerprint_template)
    }
  }

  return {
    isScanning,
    error,
    scanStep,             
    captureOne,           
    finishRegistration,   
    resetRegistration,
    identifyMember,
    loadMembersToCache,
    imageBase64,
    capturedTemplates,
  }
}