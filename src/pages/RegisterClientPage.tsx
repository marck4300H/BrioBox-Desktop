import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../api/user.api'
import { useFingerprint } from '../hooks/useFingerprint'
 
type Step = 'form' | 'fingerprint' | 'done'
 
export default function RegisterClientPage() {
  const navigate = useNavigate()
  const { isScanning, error: fpError, scanStep, registerFingerprint } = useFingerprint()
 
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
 
  const handleRegisterFingerprint = async () => {
    const template = await registerFingerprint()
    if (!template || !createdClientId) return
 
    try {
      await userApi.saveClientFingerprint(createdClientId, template)
      setFpSaved(true)
      setStep('done')
    } catch {
      setApiError('Huella capturada pero no se pudo guardar. Intenta de nuevo.')
    }
  }
 
  const handleSkipFingerprint = () => {
    setStep('done')
  }
 
  // ─── Paso: formulario ─────────────────────────────────────────────────────────
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a0000_0%,_#050000_35%,_#000000_65%)]" />
        <div className="absolute w-[700px] h-[400px] rounded-full blur-[160px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-950/20 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(0,0,0,0.7)_70%,_rgba(0,0,0,0.95)_100%)] pointer-events-none" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-black/80 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-black/80 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-black/80 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-black/80 to-transparent pointer-events-none" />
 
        <div className="relative z-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-lg shadow-2xl flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <img src="/brioboxlogo.png" alt="BrioBox" className="w-14 h-14 object-contain drop-shadow-[0_0_15px_rgba(180,0,0,0.4)]" />
            <h1 className="text-white text-2xl font-bold tracking-wide">Nuevo Cliente</h1>
            <p className="text-white/30 text-xs text-center tracking-wider uppercase">Completa los datos del cliente</p>
          </div>
 
          <div className="w-full h-px bg-red-900/30" />
 
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-white/40 text-[10px] uppercase tracking-widest">Primer nombre</label>
                <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="Juan"
                  className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors" />
                {errors.first_name && <span className="text-red-500 text-[10px]">{errors.first_name}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-white/40 text-[10px] uppercase tracking-widest">Segundo nombre</label>
                <input name="middle_name" value={form.middle_name} onChange={handleChange} placeholder="Carlos"
                  className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors" />
                {errors.middle_name && <span className="text-red-500 text-[10px]">{errors.middle_name}</span>}
              </div>
            </div>
 
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-white/40 text-[10px] uppercase tracking-widest">Apellido paterno</label>
                <input name="paternal_last_name" value={form.paternal_last_name} onChange={handleChange} placeholder="Pérez"
                  className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors" />
                {errors.paternal_last_name && <span className="text-red-500 text-[10px]">{errors.paternal_last_name}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-white/40 text-[10px] uppercase tracking-widest">Apellido materno</label>
                <input name="maternal_last_name" value={form.maternal_last_name} onChange={handleChange} placeholder="García"
                  className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors" />
                {errors.maternal_last_name && <span className="text-red-500 text-[10px]">{errors.maternal_last_name}</span>}
              </div>
            </div>
 
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-white/40 text-[10px] uppercase tracking-widest">Edad</label>
                <input name="age" type="number" value={form.age} onChange={handleChange} placeholder="25"
                  className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors" />
                {errors.age && <span className="text-red-500 text-[10px]">{errors.age}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-white/40 text-[10px] uppercase tracking-widest">Teléfono</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="3001234567"
                  className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors" />
                {errors.phone && <span className="text-red-500 text-[10px]">{errors.phone}</span>}
              </div>
            </div>
 
            <div className="flex flex-col gap-1">
              <label className="text-white/40 text-[10px] uppercase tracking-widest">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="cliente@email.com"
                className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors" />
              {errors.email && <span className="text-red-500 text-[10px]">{errors.email}</span>}
            </div>
 
            <div className="flex flex-col gap-1">
              <label className="text-white/40 text-[10px] uppercase tracking-widest">Dirección</label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="Calle 123 #45-67, Bogotá"
                className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors" />
              {errors.address && <span className="text-red-500 text-[10px]">{errors.address}</span>}
            </div>
 
            {apiError && (
              <p className="text-red-500 text-xs text-center bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">{apiError}</p>
            )}
 
            <button type="submit" disabled={loading}
              className="w-full bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors mt-1 tracking-widest text-sm uppercase shadow-lg shadow-red-950/30">
              {loading ? 'Registrando...' : 'Registrar Cliente →'}
            </button>
          </form>
 
          <button onClick={() => navigate('/clients')} className="text-white/25 text-xs hover:text-white/50 transition-colors tracking-wider">
            ← Volver a clientes
          </button>
        </div>
      </div>
    )
  }
 
  // ─── Paso: registro de huella ─────────────────────────────────────────────────
  if (step === 'fingerprint') {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a0000_0%,_#050000_35%,_#000000_65%)]" />
        <div className="absolute w-[700px] h-[400px] rounded-full blur-[160px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-950/20 pointer-events-none" />
 
        <div className="relative z-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-md shadow-2xl flex flex-col items-center gap-6">
 
          {/* Icono huella */}
          <div className={`w-30 h-30  p-5 rounded-full border flex items-center justify-center transition-all duration-300 ${
            isScanning
              ? 'border-red-500/60 drop-shadow-[0_0_20px_rgba(200,0,0,0.4)] animate-pulse'
              : 'border-[#2a2a2a]'
          }`}>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#c00303ff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M4.16 20.176a.475.475 0 0 1-.439-.294 9.428 9.428 0 0 1 5-12.11.475.475 0 0 1 .364.875A8.464 8.464 0 0 0 4.6 19.521a.474.474 0 0 1-.259.62.48.48 0 0 1-.18.035zm14.544-2.648c1.52-.571 2.17-2.01 1.74-3.853-.686-2.943-4.361-6.932-9.215-6.447a.475.475 0 1 0 .094.944 8.021 8.021 0 0 1 8.198 5.72 2.143 2.143 0 0 1-1.15 2.747c-.853.32-1.816-.386-2.99-1.343a.474.474 0 1 0-.599.735c.911.743 2.005 1.636 3.158 1.636a2.154 2.154 0 0 0 .764-.14zm-3.785 4.917a.475.475 0 0 0-.237-.627c-3.015-1.361-5.06-4.272-5.078-6.135a1.351 1.351 0 0 1 .754-1.358 2.579 2.579 0 0 1 2.614.342.474.474 0 1 0 .493-.811 3.521 3.521 0 0 0-3.514-.389 2.287 2.287 0 0 0-1.296 2.225c.02 2.147 2.181 5.431 5.636 6.99a.475.475 0 0 0 .628-.237zm4.019-1.766a.475.475 0 0 0-.344-.576c-2.603-.658-5.336-2.514-6.357-4.318a.475.475 0 1 0-.826.468c1.307 2.309 4.486 4.147 6.95 4.77a.48.48 0 0 0 .117.014.475.475 0 0 0 .46-.358zm-9.97 2.22a.475.475 0 0 0 .141-.656c-3.359-5.215-2.254-8.739-.287-10.172 1.93-1.407 5.336-1.247 7.848 1.813a.474.474 0 1 0 .733-.601c-2.88-3.512-6.858-3.64-9.14-1.978-2.3 1.675-3.668 5.68.049 11.452a.474.474 0 0 0 .655.142zM4.85 4.397c1.323-1.234 8.372-4.568 13.677-.33a.474.474 0 1 0 .592-.74c-5.494-4.39-12.897-1.51-14.916.377a.474.474 0 1 0 .647.693zm17.347 8.67a.475.475 0 0 0 .378-.555 10.525 10.525 0 0 0-9.397-8.332 10.523 10.523 0 0 0-11.054 6.63.475.475 0 0 0 .87.38c1.872-4.3 5.64-6.57 10.078-6.067a9.58 9.58 0 0 1 8.57 7.565.475.475 0 0 0 .466.387.496.496 0 0 0 .089-.009z"></path><path fill="none" d="M0 0h24v24H0z"></path></g></svg>
          </div>
 
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-white text-xl font-bold tracking-wide">Registrar Huella</h1>
            <p className="text-white/30 text-xs text-center tracking-wider">
              Se necesitan 3 capturas del mismo dedo
            </p>
          </div>
 
          {/* Indicador de progreso */}
          <div className="flex gap-3 items-center">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                scanStep >= i
                  ? 'border-red-500 bg-red-950/40 text-red-400'
                  : 'border-[#2a2a2a] text-white/20'
              }`}>
                {scanStep > i ? '✓' : i}
              </div>
            ))}
          </div>
 
          {/* Estado del escaneo */}
          <p className="text-white/50 text-sm text-center min-h-[20px]">
            {isScanning
              ? `Capturando intento ${scanStep} de 3... pon el dedo en el lector`
              : 'Presiona el botón y pon el dedo en el lector'}
          </p>
 
          {fpError && (
            <p className="text-red-500 text-xs text-center bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2 w-full">
              {fpError}
            </p>
          )}
 
          {apiError && (
            <p className="text-red-500 text-xs text-center bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2 w-full">
              {apiError}
            </p>
          )}
 
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={handleRegisterFingerprint}
              disabled={isScanning}
              className="w-full bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors tracking-widest text-sm uppercase shadow-lg shadow-red-950/30"
            >
              {isScanning ? 'Capturando...' : 'Iniciar captura →'}
            </button>
 
            <button
              onClick={handleSkipFingerprint}
              disabled={isScanning}
              className="w-full text-white/25 text-xs hover:text-white/50 transition-colors tracking-wider py-1"
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
    <div className="min-h-screen bg-[#020202] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a0000_0%,_#050000_35%,_#000000_65%)]" />
 
      <div className="relative z-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-md shadow-2xl flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full border border-red-900/40 flex items-center justify-center drop-shadow-[0_0_15px_rgba(180,0,0,0.3)]">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
 
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-white text-xl font-bold tracking-wide">¡Cliente registrado!</h1>
          <p className="text-white/30 text-xs text-center tracking-wider">
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
          className="w-full bg-[#cc0000] hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition-colors tracking-widest text-sm uppercase shadow-lg shadow-red-950/30"
        >
          Ir a clientes →
        </button>
      </div>
    </div>
  )
}