import { useEffect, useState } from 'react'

interface ClientEntry {
  id: string
  name: string
  membershipType?: string
  time: Date
}

type KioskState = 'idle' | 'scanning' | 'success' | 'error'

export default function KiosScreen() {
  const [kioskState, setKioskState] = useState<KioskState>('idle')
  const [currentClient, setCurrentClient] = useState<ClientEntry | null>(null)
  const [recentEntries, setRecentEntries] = useState<ClientEntry[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!window.electronAPI) return

    window.electronAPI.onFingerprintDetected((clientData: unknown) => {
      const data = clientData as ClientEntry
      const entry: ClientEntry = { ...data, time: new Date() }

      setKioskState('scanning')

      setTimeout(() => {
        setCurrentClient(entry)
        setKioskState('success')
        setRecentEntries(prev => [entry, ...prev].slice(0, 4))

        setTimeout(() => {
          setKioskState('idle')
          setCurrentClient(null)
        }, 4000)
      }, 800)
    })

    return () => {
      window.electronAPI?.removeAllListeners('fingerprint-detected')
    }
  }, [])

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  const formatDate = (date: Date) =>
    date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex overflow-hidden select-none">

      {/* Panel principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 relative">

        {/* Header con fecha y hora */}
        <div className="absolute top-8 left-12 right-12 flex items-center justify-between">
          <p className="text-zinc-400 text-sm uppercase tracking-widest">{formatDate(currentTime)}</p>
          <p className="text-white text-2xl font-light tabular-nums">{formatTime(currentTime)}</p>
        </div>

        {/* Estado: esperando huella */}
        {kioskState === 'idle' && (
          <div className="flex flex-col items-center gap-10">
            <div className="text-center">
              <h1 className="text-5xl font-bold tracking-tight text-white">BRIOBOX</h1>
              <p className="text-zinc-500 mt-2 text-sm tracking-widest uppercase">Centro de Entrenamiento</p>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute w-48 h-48 rounded-full border border-zinc-800 animate-ping opacity-20" />
              <div className="absolute w-40 h-40 rounded-full border border-zinc-700 opacity-30" />
              <div className="w-32 h-32 rounded-full border-2 border-zinc-600 bg-zinc-900 flex items-center justify-center">
                <FingerprintIcon className="w-14 h-14 text-zinc-500" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-zinc-300 text-xl">Coloca tu dedo en el sensor</p>
              <p className="text-zinc-600 text-sm mt-1">para registrar tu entrada</p>
            </div>
          </div>
        )}

        {/* Estado: leyendo */}
        {kioskState === 'scanning' && (
          <div className="flex flex-col items-center gap-8">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-40 h-40 rounded-full border-2 border-blue-500 opacity-40 animate-ping" />
              <div className="w-32 h-32 rounded-full border-2 border-blue-400 bg-blue-950 flex items-center justify-center">
                <FingerprintIcon className="w-14 h-14 text-blue-400" />
              </div>
            </div>
            <p className="text-blue-300 text-xl">Leyendo huella...</p>
          </div>
        )}

        {/* Estado: bienvenida */}
        {kioskState === 'success' && currentClient && (
          <div className="flex flex-col items-center gap-8">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-48 h-48 rounded-full border-2 border-green-500 opacity-20 animate-ping" />
              <div className="w-32 h-32 rounded-full border-2 border-green-500 bg-green-950 flex items-center justify-center">
                <CheckIcon className="w-14 h-14 text-green-400" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-zinc-400 text-sm uppercase tracking-widest mb-2">¡Bienvenido!</p>
              <h2 className="text-4xl font-bold text-white">{currentClient.name}</h2>
              {currentClient.membershipType && (
                <span className="inline-block mt-3 px-4 py-1 bg-green-900 text-green-300 text-xs rounded-full uppercase tracking-wider">
                  {currentClient.membershipType}
                </span>
              )}
            </div>

            <p className="text-green-400 text-sm">Entrada registrada · {formatTime(currentClient.time)}</p>
          </div>
        )}

        {/* Estado: error */}
        {kioskState === 'error' && (
          <div className="flex flex-col items-center gap-8">
            <div className="w-32 h-32 rounded-full border-2 border-red-500 bg-red-950 flex items-center justify-center">
              <XIcon className="w-14 h-14 text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-red-300 text-xl">Huella no reconocida</p>
              <p className="text-zinc-500 text-sm mt-1">Intenta de nuevo o contacta recepción</p>
            </div>
          </div>
        )}
      </div>

      {/* Panel lateral — entradas recientes */}
      {recentEntries.length > 0 && (
        <div className="w-72 bg-zinc-900 border-l border-zinc-800 flex flex-col p-6 gap-4">
          <p className="text-zinc-500 text-xs uppercase tracking-widest">Entradas recientes</p>
          <div className="flex flex-col gap-3">
            {recentEntries.map((entry, index) => (
              <div
                key={entry.id + entry.time.getTime()}
                className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800"
                style={{ opacity: 1 - index * 0.2 }}
              >
                <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-400 text-xs">✓</span>
                </div>
                <div className="min-w-0">
                  <p className="text-zinc-200 text-sm font-medium truncate">{entry.name}</p>
                  <p className="text-zinc-500 text-xs">{formatTime(entry.time)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FingerprintIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <path d="M2 12a10 10 0 0 1 18-6" />
      <path d="M2 17c1 .5 2.5 1.5 3.5 3" />
      <path d="M4.22 12a8 8 0 0 1 11.29-7.27" />
      <path d="M6.47 13.84A6 6 0 0 1 6 12" />
      <path d="M6.5 17.5C7 15 7 12 7 10" />
      <path d="M8 21.13c.21-1.16.45-1.45 1.01-1.92" />
      <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}