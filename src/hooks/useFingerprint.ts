import { useState } from 'react'
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
interface CaptureResult {
  success: boolean
  template?: string
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
 
// ─── Hook ─────────────────────────────────────────────────────────────────────
 
export function useFingerprint() {
  const [isScanning, setIsScanning]   = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [scanStep, setScanStep]       = useState(0) // 0-3 to show progress in registration
 
  /**
   * Registration flow:
   * Captures 3 fingerprints of the same finger and returns the final merged template.
   * Use it when registering a new member.
   */
  async function registerFingerprint(): Promise<string | null> {
    setIsScanning(true)
    setError(null)
    setScanStep(0)
 
    const templates: string[] = []
 
    try {
      for (let i = 0; i < 3; i++) {
        setScanStep(i + 1)
        const result: CaptureResult = await window.zkAPI.capture()
        if (!result.success) throw new Error(result.error)
        templates.push(result.template!)
      }
 
      const merged: MergeResult = await window.zkAPI.merge(
        templates[0],
        templates[1],
        templates[2]
      )
      if (!merged.success) throw new Error(merged.error)
 
      return merged.mergedTemplate!
    } catch (e: any) {
      setError(e.message)
      return null
    } finally {
      setIsScanning(false)
      setScanStep(0)
    }
  }
 
  /**
   * Kiosko flow:
   * The member places their finger and returns their fid + score.
   * fid corresponds to the member's ID in Supabase.
   * Score > 50 is reliable.
   */
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
 
  /**
   * Loads the templates of all active members to the cache.
   * Call this when starting the app with the data from Supabase.
   */
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
    scanStep,       // useful for showing "Attempt 1 of 3", "Attempt 2 of 3"...
    registerFingerprint,
    identifyMember,
    loadMembersToCache,
  }
}
 

 