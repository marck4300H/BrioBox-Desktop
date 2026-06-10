export {}

declare global {
  interface Window {
    zkAPI: {
      capture: () => Promise<{ success: boolean; template?: string; error?: string }>
      merge: (t1: string, t2: string, t3: string) => Promise<{ success: boolean; mergedTemplate?: string; error?: string }>
      addToCache: (fid: number, template: string) => Promise<{ success: boolean; error?: string }>
      removeFromCache: (fid: number) => Promise<{ success: boolean; error?: string }>
      clearCache: () => Promise<{ success: boolean; error?: string }>
      identify: () => Promise<{ success: boolean; fid?: number; score?: number; error?: string }>
    }
  }
}