import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { validateEmail } from '../../utils/validators';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
    } catch {
      // El backend no revela si el email existe por seguridad
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center relative overflow-hidden">

      {/* Fondo igual al login */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a0000_0%,_#050000_35%,_#000000_65%)]" />
      <div className="absolute w-[700px] h-[400px] rounded-full blur-[160px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-950/20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(0,0,0,0.7)_70%,_rgba(0,0,0,0.95)_100%)] pointer-events-none" />

      {/* Esquinas */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-black/80 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-black/80 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-black/80 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-black/80 to-transparent pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-sm shadow-2xl flex flex-col items-center gap-6">

        {!submitted ? (
          <>
            {/* Header */}
            <div className="flex flex-col items-center gap-2">
              <img
                src="/brioboxlogoicon.png"
                alt="BrioBox"
                className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(180,0,0,0.4)]"
              />
              <h1 className="text-white text-2xl font-bold tracking-wide">Recuperar acceso</h1>
              <p className="text-white/30 text-xs text-center tracking-wider">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
              </p>
            </div>

            {/* Separador */}
            <div className="w-full h-px bg-red-900/30" />

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-white/40 text-[10px] uppercase tracking-widest">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                  placeholder="tu@email.com"
                  className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors"
                />
                {emailError && <span className="text-red-500 text-[10px]">{emailError}</span>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors mt-1 tracking-widest text-sm uppercase shadow-lg shadow-red-950/30"
              >
                {loading ? 'Enviando...' : 'Enviar enlace →'}
              </button>
            </form>

            <Link
              to="/login"
              className="text-white/25 text-xs hover:text-white/50 transition-colors tracking-wider"
            >
              ← Volver al inicio de sesión
            </Link>
          </>
        ) : (
          <>
            {/* Estado de éxito */}
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full border border-red-900/40 flex items-center justify-center drop-shadow-[0_0_15px_rgba(180,0,0,0.3)]">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-white text-xl font-bold tracking-wide">Revisa tu correo</h1>
              <p className="text-white/30 text-xs text-center tracking-wider leading-relaxed">
                Si el email existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
              </p>
              <div className="w-full h-px bg-red-900/30" />
              <Link
                to="/login"
                className="text-red-600/80 hover:text-red-500 transition-colors text-xs tracking-widest uppercase"
              >
                ← Volver al inicio de sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}