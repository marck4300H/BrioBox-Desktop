import { useEffect, useState } from 'react'

interface RecentEntry {
  id: string
  name: string
  time: Date
}

export default function KioskScreen() {
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([])
  const [welcomed, setWelcomed] = useState<RecentEntry | null>(null)

  useEffect(() => {
    if (!window.electronAPI) return

    window.electronAPI.onFingerprintDetected((clientData: unknown) => {
      const data = clientData as RecentEntry
      const entry: RecentEntry = { ...data, time: new Date() }

      setWelcomed(entry)
      setRecentEntries(prev => [entry, ...prev].slice(0, 5))

      setTimeout(() => setWelcomed(null), 4000)
    })

    return () => {
      window.electronAPI?.removeAllListeners('fingerprint-detected')
    }
  }, [])

  const formatTime = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 60000)
    if (diff < 1) return 'ahora mismo'
    if (diff === 1) return 'hace 1 min'
    return `hace ${diff} min`
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center relative overflow-hidden">

      {/* Fondo decorativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />

      {/* Pantalla de bienvenida — aparece cuando se detecta huella */}
      {welcomed && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 animate-fade-in">
          <div className="text-8xl mb-6">✅</div>
          <h1 className="text-5xl font-bold text-white mb-2">¡Bienvenido!</h1>
          <p className="text-3xl text-gray-300 mb-8">{welcomed.name}</p>
          <div className="w-16 h-1 bg-green-500 rounded-full" />
        </div>
      )}

      {/* Contenido principal del kiosko */}
      <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-lg px-8">

        {/* Logo / nombre del gym */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-wide text-white">🏋️ BRIOBOX</h1>
          <p className="text-gray-400 mt-1 text-sm tracking-widest uppercase">Centro de Entrenamiento</p>
        </div>

        {/* Indicador del sensor */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 rounded-full border-2 border-gray-600 flex items-center justify-center bg-gray-900">
            <span className="text-6xl select-none">👆</span>
          </div>
          <p className="text-gray-400 text-lg">Coloca tu dedo en el sensor</p>
        </div>

        {/* Últimas entradas */}
        {recentEntries.length > 0 && (
          <div className="w-full">
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">Entradas recientes</p>
            <div className="flex flex-col gap-2">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id + entry.time.getTime()}
                  className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-sm">✓</span>
                    <span className="text-gray-200 text-sm">{entry.name}</span>
                  </div>
                  <span className="text-gray-500 text-xs">{formatTime(entry.time)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}