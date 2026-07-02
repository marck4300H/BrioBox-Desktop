import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../../api/client';
import { useTheme } from '../../context/ThemeContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const dark = darkMode;
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'empleado' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'El nombre es requerido.';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email inválido.';
    if (!form.password || form.password.length < 8) newErrors.password = 'Mínimo 8 caracteres.';
    if (!/[A-Z]/.test(form.password)) newErrors.password = 'Debe tener al menos una mayúscula.';
    if (!/[0-9]/.test(form.password)) newErrors.password = 'Debe tener al menos un número.';
    if (!/[^A-Za-z0-9]/.test(form.password)) newErrors.password = 'Debe tener al menos un carácter especial.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await http.post('/users/user', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Error al registrar empleado.');
    } finally {
      setLoading(false);
    }
  };

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

      <div className={`relative z-10 rounded-2xl p-8 w-full max-w-md shadow-2xl flex flex-col items-center gap-6 border transition-colors ${dark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-black/10'}`}>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full border border-red-900/40 flex items-center justify-center drop-shadow-[0_0_15px_rgba(180,0,0,0.3)]">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className={`text-xl font-bold tracking-wide ${dark ? 'text-white' : 'text-black'}`}>¡Empleado registrado!</h1>
            <p className={`text-xs text-center tracking-wider ${dark ? 'text-white/30' : 'text-black/40'}`}>Redirigiendo al dashboard...</p>
            <div className="flex gap-1.5 items-center">
              <div className="w-1 h-1 rounded-full bg-red-500/80 animate-pulse" />
              <div className="w-8 h-px bg-red-500/40" />
              <div className="w-1 h-1 rounded-full bg-red-500/80 animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2">
              <img src="/brioboxlogo.png" alt="BrioBox" className={`w-16 h-16 object-contain ${dark ? 'drop-shadow-[0_0_15px_rgba(180,0,0,0.4)]' : ''}`} />
              <h1 className={`text-2xl font-bold tracking-wide ${dark ? 'text-white' : 'text-black'}`}>Registrar Empleado</h1>
              <p className={`text-xs text-center tracking-wider uppercase ${dark ? 'text-white/30' : 'text-black/40'}`}>Completa los datos del empleado</p>
            </div>

            <div className={`w-full h-px ${dark ? 'bg-red-900/30' : 'bg-red-200'}`} />

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">

              <div className="flex flex-col gap-1">
                <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/55'}`}>Nombre</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Juan Pérez"
                  className={`rounded-lg px-4 py-2.5 text-sm placeholder-white/20 focus:outline-none transition-colors border ${dark ? 'bg-[#111111] border-[#2a2a2a] text-white placeholder-white/20 focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black placeholder-black/35 focus:border-red-500'}`}
                />
                {errors.name && <span className="text-red-500 text-[10px]">{errors.name}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/55'}`}>Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="empleado@email.com"
                  className={`rounded-lg px-4 py-2.5 text-sm placeholder-white/20 focus:outline-none transition-colors border ${dark ? 'bg-[#111111] border-[#2a2a2a] text-white placeholder-white/20 focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black placeholder-black/35 focus:border-red-500'}`}
                />
                {errors.email && <span className="text-red-500 text-[10px]">{errors.email}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/55'}`}>Contraseña</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className={`rounded-lg px-4 py-2.5 text-sm placeholder-white/20 focus:outline-none transition-colors border ${dark ? 'bg-[#111111] border-[#2a2a2a] text-white placeholder-white/20 focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black placeholder-black/35 focus:border-red-500'}`}
                />
                {errors.password && <span className="text-red-500 text-[10px]">{errors.password}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/55'}`}>Rol</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className={`rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors border ${dark ? 'bg-[#111111] border-[#2a2a2a] text-white focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black focus:border-red-500'}`}
                >
                  <option value="empleado">Empleado</option>
                  <option value="visitante">Visitante</option>
                </select>
              </div>

              {apiError && (
                <p className="text-red-500 text-xs text-center bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">
                  {apiError}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors mt-1 tracking-widest text-sm uppercase shadow-lg shadow-red-950/30 cursor-pointer"
              >
                {loading ? 'Registrando...' : 'Registrar Empleado →'}
              </button>
            </form>

            <button
              onClick={() => navigate('/dashboard')}
              className={`text-xs transition-colors tracking-wider cursor-pointer ${dark ? 'text-white/25 hover:text-white/50' : 'text-black/45 hover:text-black/75'}`}
            >
              ← Volver al dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}