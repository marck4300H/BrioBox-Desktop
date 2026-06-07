import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../utils/validators';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const emailErr = validateEmail(form.email);
    const passErr = validatePassword(form.password);
    if (emailErr) newErrors.email = emailErr;
    if (passErr) newErrors.password = passErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      navigate('/dashboard');
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center relative overflow-hidden">

  <div className="absolute inset-0 bg-gradient-to-br from-[#1a0000] via-[#0f0f0f] to-[#000000] opacity-90" />

  {/* Card más compacta */}
  <div className="relative z-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-8 py-8 w-full max-w-sm shadow-2xl flex flex-col items-center gap-6">

    {/* Logo más pequeño */}
    <div className="flex flex-col items-center gap-2">
      <img src="/brioboxlogoicon.png" alt="BrioBox" className="w-24 h-24 object-contain" />
      <h1 className="text-white text-2xl font-bold tracking-wide">Bienvenido</h1>
      <p className="text-gray-400 text-sm text-center">Ingresa a tu cuenta para continuar</p>
    </div>

    {/* Formulario */}
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">

      <div className="flex flex-col gap-2">
        <label className="text-gray-400 text-xs uppercase tracking-widest">Correo Electrónico</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="tucorreo@gmail.com"
          className="bg-[#111111] border border-[#3a3a3a] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#cc0000] transition-colors"
        />
        {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-gray-400 text-xs uppercase tracking-widest">Contraseña</label>
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••••••"
          className="bg-[#111111] border border-[#3a3a3a] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#cc0000] transition-colors"
        />
        {errors.password && <span className="text-red-500 text-xs">{errors.password}</span>}
      </div>

      <div className="flex items-center justify-between text-xs">
        <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
          <input type="checkbox" className="accent-[#cc0000]" />
          Recuérdame
        </label>
        <Link to="/forgot-password" className="text-[#cc0000] hover:text-red-400 transition-colors">
          ¿Olvidaste la contraseña?
        </Link>
      </div>

      {apiError && (
        <p className="text-red-500 text-xs text-center bg-red-950/30 border border-red-900 rounded-lg px-3 py-2">
          {apiError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#cc0000] hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors tracking-wide"
      >
        {loading ? 'Cargando...' : 'INGRESAR →'}
      </button>
    </form>
  </div>
</div>
  );
}