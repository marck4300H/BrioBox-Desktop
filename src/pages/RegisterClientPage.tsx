import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../api/user.api'
import { useFingerprint } from '../hooks/useFingerprint'
import { useTheme } from '../context/ThemeContext'

type Step = 'form' | 'fingerprint' | 'done'

export default function RegisterClientPage() {
  const navigate = useNavigate()
  const { darkMode } = useTheme()
  const dark = darkMode
  const {
    isScanning,
    error: fpError,
    scanStep,
    captureOne,
    finishRegistration,
    resetRegistration,
    imageBase64,
    capturedTemplates,
  } = useFingerprint()

  const [step, setStep] = useState<Step>('form')
  const [createdClientId, setCreatedClientId] = useState<string | null>(null)

  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    paternal_last_name: '',
    maternal_last_name: '',
    age: '',
    email: '',
    phone: '',
    address: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fpSaved, setFpSaved] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    setApiError('')
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.first_name.trim()) newErrors.first_name = 'El primer nombre es requerido.'
    if (!form.middle_name.trim()) newErrors.middle_name = 'El segundo nombre es requerido.'
    if (!form.paternal_last_name.trim()) newErrors.paternal_last_name = 'El apellido paterno es requerido.'
    if (!form.maternal_last_name.trim()) newErrors.maternal_last_name = 'El apellido materno es requerido.'
    if (!form.age || Number(form.age) < 13) newErrors.age = 'Edad mínima 13 años.'
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = 'Email inválido.'
    if (!form.phone || !/^[0-9]{10}$/.test(form.phone)) newErrors.phone = 'Teléfono debe tener 10 dígitos.'
    if (!form.address.trim()) newErrors.address = 'La dirección es requerida.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await userApi.createClient({
        first_name: form.first_name,
        middle_name: form.middle_name,
        paternal_last_name: form.paternal_last_name,
        maternal_last_name: form.maternal_last_name,
        age: Number(form.age),
        email: form.email,
        phone: form.phone,
        address: form.address,
      })
      setCreatedClientId(res.userId)
      setStep('fingerprint')
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Error al registrar cliente.')
    } finally {
      setLoading(false)
    }
  }

  const handleCaptureStep = async () => {
    const template = await captureOne()
    if (!template) return 

    const newTemplates = [...capturedTemplates, template]
    if (newTemplates.length >= 3) {
      const merged = await finishRegistration(newTemplates)
      if (!merged || !createdClientId) return

      try {
        await userApi.saveClientFingerprint(createdClientId, merged)
        setFpSaved(true)
        setStep('done')
      } catch (err: unknown) {
        setApiError('Huella capturada pero no se pudo guardar. Intenta de nuevo.' + err)
      }
    }
  }

  const handleRetryCapture = () => {
    resetRegistration()
  }

  const handleSkipFingerprint = () => {
    setStep('done')
  }

  // ─── Paso: formulario ─────────────────────────────────────────────────────────
  if (step === 'form') {
    return (
      <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-500 ${dark ? 'bg-[#020202]' : 'bg-[#f0f0f0]'}`}>
        {dark ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a0000_0%,_#050000_35%,_#000000_65%)]" />
            <div className="absolute w-[700px] h-[400px] rounded-full blur-[160px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-950/20 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(0,0,0,0.7)_70%,_rgba(0,0,0,0.95)_100%)] pointer-events-none" />
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-black/80 to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-black/80 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-black/80 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-black/80 to-transparent pointer-events-none" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(220,38,38,0.05)_0%,_rgba(255,255,255,0)_70%)]" />
            <div className="absolute w-[700px] h-[400px] rounded-full blur-[160px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-200/10 pointer-events-none" />
          </>
        )}

        <div className={`relative z-10 rounded-2xl p-8 w-full max-w-lg shadow-2xl flex flex-col items-center gap-6 border transition-colors ${dark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-black/10'}`}>
          <div className="flex flex-col items-center gap-2">
            <img src="/brioboxlogo.png" alt="BrioBox" className={`w-14 h-14 object-contain ${dark ? 'drop-shadow-[0_0_15px_rgba(180,0,0,0.4)]' : ''}`} />
            <h1 className={`text-2xl font-bold tracking-wide ${dark ? 'text-white' : 'text-black'}`}>Nuevo Cliente</h1>
            <p className={`text-xs text-center tracking-wider uppercase ${dark ? 'text-white/30' : 'text-black/40'}`}>Completa los datos del cliente</p>
          </div>

          <div className={`w-full h-px ${dark ? 'bg-red-900/30' : 'bg-red-200'}`} />

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/55'}`}>Primer nombre</label>
                <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="Juan"
                  className={`rounded-lg px-4 py-2.5 text-sm placeholder-white/20 focus:outline-none transition-colors border ${dark ? 'bg-[#111111] border-[#2a2a2a] text-white placeholder-white/20 focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black placeholder-black/35 focus:border-red-500'}`} />
                {errors.first_name && <span className="text-red-500 text-[10px]">{errors.first_name}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/55'}`}>Segundo nombre</label>
                <input name="middle_name" value={form.middle_name} onChange={handleChange} placeholder="Carlos"
                  className={`rounded-lg px-4 py-2.5 text-sm placeholder-white/20 focus:outline-none transition-colors border ${dark ? 'bg-[#111111] border-[#2a2a2a] text-white placeholder-white/20 focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black placeholder-black/35 focus:border-red-500'}`} />
                {errors.middle_name && <span className="text-red-500 text-[10px]">{errors.middle_name}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/55'}`}>Apellido paterno</label>
                <input name="paternal_last_name" value={form.paternal_last_name} onChange={handleChange} placeholder="Pérez"
                  className={`rounded-lg px-4 py-2.5 text-sm placeholder-white/20 focus:outline-none transition-colors border ${dark ? 'bg-[#111111] border-[#2a2a2a] text-white placeholder-white/20 focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black placeholder-black/35 focus:border-red-500'}`} />
                {errors.paternal_last_name && <span className="text-red-500 text-[10px]">{errors.paternal_last_name}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/55'}`}>Apellido materno</label>
                <input name="maternal_last_name" value={form.maternal_last_name} onChange={handleChange} placeholder="García"
                  className={`rounded-lg px-4 py-2.5 text-sm placeholder-white/20 focus:outline-none transition-colors border ${dark ? 'bg-[#111111] border-[#2a2a2a] text-white placeholder-white/20 focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black placeholder-black/35 focus:border-red-500'}`} />
                {errors.maternal_last_name && <span className="text-red-500 text-[10px]">{errors.maternal_last_name}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/55'}`}>Edad</label>
                <input name="age" type="number" value={form.age} onChange={handleChange} placeholder="25"
                  className={`rounded-lg px-4 py-2.5 text-sm placeholder-white/20 focus:outline-none transition-colors border ${dark ? 'bg-[#111111] border-[#2a2a2a] text-white placeholder-white/20 focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black placeholder-black/35 focus:border-red-500'}`} />
                {errors.age && <span className="text-red-500 text-[10px]">{errors.age}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/55'}`}>Teléfono</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="3001234567"
                  className={`rounded-lg px-4 py-2.5 text-sm placeholder-white/20 focus:outline-none transition-colors border ${dark ? 'bg-[#111111] border-[#2a2a2a] text-white placeholder-white/20 focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black placeholder-black/35 focus:border-red-500'}`} />
                {errors.phone && <span className="text-red-500 text-[10px]">{errors.phone}</span>}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/55'}`}>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="cliente@email.com"
                className={`rounded-lg px-4 py-2.5 text-sm placeholder-white/20 focus:outline-none transition-colors border ${dark ? 'bg-[#111111] border-[#2a2a2a] text-white placeholder-white/20 focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black placeholder-black/35 focus:border-red-500'}`} />
              {errors.email && <span className="text-red-500 text-[10px]">{errors.email}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/55'}`}>Dirección</label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="Calle 123 #45-67, Bogotá"
                className={`rounded-lg px-4 py-2.5 text-sm placeholder-white/20 focus:outline-none transition-colors border ${dark ? 'bg-[#111111] border-[#2a2a2a] text-white placeholder-white/20 focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black placeholder-black/35 focus:border-red-500'}`} />
              {errors.address && <span className="text-red-500 text-[10px]">{errors.address}</span>}
            </div>

            {apiError && (
              <p className="text-red-500 text-xs text-center bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">{apiError}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors mt-1 tracking-widest text-sm uppercase shadow-lg shadow-red-950/30 cursor-pointer">
              {loading ? 'Registrando...' : 'Registrar Cliente →'}
            </button>
          </form>

          <button onClick={() => navigate('/clients')} className={`text-xs transition-colors tracking-wider cursor-pointer ${dark ? 'text-white/25 hover:text-white/50' : 'text-black/45 hover:text-black/75'}`}>
            ← Volver a clientes
          </button>
        </div>
      </div>
    )
  }

  // ─── Paso: registro de huella ─────────────────────────────────────────────────
  if (step === 'fingerprint') {
    return (
      <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-500 ${dark ? 'bg-[#020202]' : 'bg-[#f0f0f0]'}`}>
        {dark ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a0000_0%,_#050000_35%,_#000000_65%)]" />
            <div className="absolute w-[700px] h-[400px] rounded-full blur-[160px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-950/20 pointer-events-none" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(220,38,38,0.05)_0%,_rgba(255,255,255,0)_70%)]" />
            <div className="absolute w-[700px] h-[400px] rounded-full blur-[160px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-200/10 pointer-events-none" />
          </>
        )}

        <div className={`relative z-10 rounded-2xl p-8 w-full max-w-md shadow-2xl flex flex-col items-center gap-6 border transition-colors ${dark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-black/10'}`}>

          {/* Icono huella */}
          <div className={`w-20 h-20 rounded-full border flex items-center justify-center transition-all duration-300 ${
            isScanning
              ? 'border-red-500/60 drop-shadow-[0_0_20px_rgba(200,0,0,0.4)] animate-pulse'
              : dark ? 'border-[#2a2a2a]' : 'border-black/15'
          }`}>
            <svg className={`w-10 h-10 ${dark ? 'text-white/60' : 'text-black/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                d="M12 11c0-1.657-1.343-3-3-3S6 9.343 6 11c0 3.866 2.686 7 6 7s6-3.134 6-7c0-3.314-2.686-6-6-6-1.86 0-3.527.848-4.647 2.183" />
            </svg>
          </div>

          <div className="flex flex-col items-center gap-1">
            <h1 className={`text-xl font-bold tracking-wide ${dark ? 'text-white' : 'text-black'}`}>Registrar Huella</h1>
            <p className={`text-xs text-center tracking-wider ${dark ? 'text-white/30' : 'text-black/45'}`}>
              Se necesitan 3 capturas del mismo dedo
            </p>
          </div>

          {/* Debug Visual de Huella */}
          {imageBase64 ? (
            <div className={`w-28 h-36 border rounded-xl p-1.5 flex items-center justify-center shadow-lg overflow-hidden ${dark ? 'border-red-900/30 bg-black/60 shadow-red-950/20 filter invert' : 'border-red-200 bg-gray-50 shadow-black/5'}`}>
              <img
                src={`data:image/png;base64,${imageBase64}`}
                alt="Huella capturada"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className={`w-28 h-36 border rounded-xl flex items-center justify-center ${dark ? 'border-[#2a2a2a] bg-black/20' : 'border-black/10 bg-gray-50'}`}>
              <span className={`text-[10px] uppercase tracking-widest text-center px-4 ${dark ? 'text-white/20' : 'text-black/40'}`}>
                Esperando captura...
              </span>
            </div>
          )}

          {/* Indicador de progreso */}
          <div className="flex gap-3 items-center">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                scanStep >= i
                  ? 'border-red-500 bg-red-950/40 text-red-400'
                  : dark
                    ? 'border-[#2a2a2a] text-white/20'
                    : 'border-black/10 text-black/30'
              }`}>
                {scanStep > i ? '✓' : i}
              </div>
            ))}
          </div>

          {/* Estado del escaneo */}
          <p className={`text-sm text-center min-h-[20px] ${dark ? 'text-white/50' : 'text-black/60'}`}>
            {isScanning
              ? 'Capturando... mantén el dedo firme en el lector'
              : scanStep === 0
                ? 'Pon el dedo en el lector y presiona el botón'
                : scanStep < 3
                  ? 'Levanta el dedo, vuelve a ponerlo y presiona de nuevo'
                  : 'Guardando huella...'}
          </p>

          {fpError && (
            <div className="flex flex-col gap-2 w-full">
              <p className="text-red-500 text-xs text-center bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">
                {fpError}
              </p>
              {scanStep > 0 && (
                <button
                  onClick={handleRetryCapture}
                  className={`text-xs transition-colors cursor-pointer ${dark ? 'text-white/40 hover:text-white/60' : 'text-black/50 hover:text-black/70'}`}
                >
                  Empezar de nuevo
                </button>
              )}
            </div>
          )}

          {apiError && (
            <p className="text-red-500 text-xs text-center bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2 w-full">
              {apiError}
            </p>
          )}

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={handleCaptureStep}
              disabled={isScanning || scanStep >= 3}
              className="w-full bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors tracking-widest text-sm uppercase shadow-lg shadow-red-950/30 cursor-pointer"
            >
              {isScanning
                ? 'Capturando...'
                : scanStep >= 3
                  ? 'Procesando...'
                  : `Capturar (${scanStep + 1} de 3) →`}
            </button>

            <button
              onClick={handleSkipFingerprint}
              disabled={isScanning}
              className={`w-full text-xs transition-colors tracking-wider py-1 cursor-pointer ${dark ? 'text-white/25 hover:text-white/50' : 'text-black/45 hover:text-black/75'}`}
            >
              Omitir por ahora
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Paso: done ───────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-500 ${dark ? 'bg-[#020202]' : 'bg-[#f0f0f0]'}`}>
      {dark ? (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a0000_0%,_#050000_35%,_#000000_65%)]" />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(220,38,38,0.05)_0%,_rgba(255,255,255,0)_70%)]" />
      )}

      <div className={`relative z-10 rounded-2xl p-8 w-full max-w-md shadow-2xl flex flex-col items-center gap-6 border transition-colors ${dark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-black/10'}`}>
        <div className="w-16 h-16 rounded-full border border-red-900/40 flex items-center justify-center drop-shadow-[0_0_15px_rgba(180,0,0,0.3)]">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="flex flex-col items-center gap-1">
          <h1 className={`text-xl font-bold tracking-wide ${dark ? 'text-white' : 'text-black'}`}>¡Cliente registrado!</h1>
          <p className={`text-xs text-center tracking-wider ${dark ? 'text-white/30' : 'text-black/45'}`}>
            {fpSaved ? 'Datos y huella guardados correctamente' : 'Datos guardados — huella omitida'}
          </p>
        </div>

        <div className="flex gap-1.5 items-center">
          <div className="w-1 h-1 rounded-full bg-red-500/80 animate-pulse" />
          <div className="w-8 h-px bg-red-500/40" />
          <div className="w-1 h-1 rounded-full bg-red-500/80 animate-pulse" />
        </div>

        <button
          onClick={() => navigate('/clients')}
          className="w-full bg-[#cc0000] hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition-colors tracking-widest text-sm uppercase shadow-lg shadow-red-950/30 cursor-pointer"
        >
          Ir a clientes →
        </button>
      </div>
    </div>
  )
}