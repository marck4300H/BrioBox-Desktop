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
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#c4c4c4ff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M4.16 20.176a.475.475 0 0 1-.439-.294 9.428 9.428 0 0 1 5-12.11.475.475 0 0 1 .364.875A8.464 8.464 0 0 0 4.6 19.521a.474.474 0 0 1-.259.62.48.48 0 0 1-.18.035zm14.544-2.648c1.52-.571 2.17-2.01 1.74-3.853-.686-2.943-4.361-6.932-9.215-6.447a.475.475 0 1 0 .094.944 8.021 8.021 0 0 1 8.198 5.72 2.143 2.143 0 0 1-1.15 2.747c-.853.32-1.816-.386-2.99-1.343a.474.474 0 1 0-.599.735c.911.743 2.005 1.636 3.158 1.636a2.154 2.154 0 0 0 .764-.14zm-3.785 4.917a.475.475 0 0 0-.237-.627c-3.015-1.361-5.06-4.272-5.078-6.135a1.351 1.351 0 0 1 .754-1.358 2.579 2.579 0 0 1 2.614.342.474.474 0 1 0 .493-.811 3.521 3.521 0 0 0-3.514-.389 2.287 2.287 0 0 0-1.296 2.225c.02 2.147 2.181 5.431 5.636 6.99a.475.475 0 0 0 .628-.237zm4.019-1.766a.475.475 0 0 0-.344-.576c-2.603-.658-5.336-2.514-6.357-4.318a.475.475 0 1 0-.826.468c1.307 2.309 4.486 4.147 6.95 4.77a.48.48 0 0 0 .117.014.475.475 0 0 0 .46-.358zm-9.97 2.22a.475.475 0 0 0 .141-.656c-3.359-5.215-2.254-8.739-.287-10.172 1.93-1.407 5.336-1.247 7.848 1.813a.474.474 0 1 0 .733-.601c-2.88-3.512-6.858-3.64-9.14-1.978-2.3 1.675-3.668 5.68.049 11.452a.474.474 0 0 0 .655.142zM4.85 4.397c1.323-1.234 8.372-4.568 13.677-.33a.474.474 0 1 0 .592-.74c-5.494-4.39-12.897-1.51-14.916.377a.474.474 0 1 0 .647.693zm17.347 8.67a.475.475 0 0 0 .378-.555 10.525 10.525 0 0 0-9.397-8.332 10.523 10.523 0 0 0-11.054 6.63.475.475 0 0 0 .87.38c1.872-4.3 5.64-6.57 10.078-6.067a9.58 9.58 0 0 1 8.57 7.565.475.475 0 0 0 .466.387.496.496 0 0 0 .089-.009z"></path><path fill="none" d="M0 0h24v24H0z"></path></g></svg>
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