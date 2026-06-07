export {}

declare global {
  interface Window {
    electronAPI?: {
      onFingerprintDetected: (callback: (clientData: unknown) => void) => void
      removeAllListeners: (channel: string) => void
    }
  }
}