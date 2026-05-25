import { useState, useEffect } from 'react';
import { userApi } from '../../api/user.api';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  dark: boolean;
  onClose: () => void;
}

export default function ProfilePanel({ dark, onClose }: Props) {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    currentPassword: '',
    newPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      name: user?.name ?? '',
      email: user?.email ?? '',
    }));
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'El nombre es requerido.';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email inválido.';
    if (form.newPassword && form.newPassword.length < 8) newErrors.newPassword = 'Mínimo 8 caracteres.';
    if (form.newPassword && !form.currentPassword) newErrors.currentPassword = 'Ingresa tu contraseña actual.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await userApi.updateProfile({
        name: form.name,
        email: form.email,
        ...(form.currentPassword && form.newPassword ? {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        } : {}),
      } as any);
      await refreshUser();
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setEditing(false); }, 1800);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Error al actualizar.');
    } finally {
      setLoading(false);
    }
  };

  const initials = `${user?.name?.[0] ?? ''}`.toUpperCase();

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div className={`fixed top-16 right-6 z-50 w-80 rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${dark ? 'bg-[#141414] border-white/5' : 'bg-white border-black/10'}`}>

        {/* Header perfil */}
        <div className={`px-5 py-4 border-b flex items-center gap-3 ${dark ? 'border-white/5' : 'border-black/10'}`}>
          <div className="w-10 h-10 rounded-full bg-red-900/60 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm truncate ${dark ? 'text-white' : 'text-black'}`}>{user?.name}</p>
            <p className={`text-[10px] truncate ${dark ? 'text-white/30' : 'text-black/40'}`}>{user?.email}</p>
          </div>
          <button onClick={onClose} className={`text-xs w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${dark ? 'text-white/30 hover:text-white/60 hover:bg-white/5' : 'text-black/30 hover:text-black/60 hover:bg-black/5'}`}>✕</button>
        </div>

        {/* Contenido */}
        <div className="px-5 py-4 flex flex-col gap-4">

          {!editing ? (
            <>
              {/* Info */}
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Nombre', value: user?.name },
                  { label: 'Email', value: user?.email },
                  { label: 'Miembro desde', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
                ].map(field => (
                  <div key={field.label}>
                    <p className={`text-[10px] uppercase tracking-widest mb-0.5 ${dark ? 'text-white/30' : 'text-black/40'}`}>{field.label}</p>
                    <p className={`text-sm ${dark ? 'text-white/70' : 'text-black/70'}`}>{field.value ?? '—'}</p>
                  </div>
                ))}
              </div>

              <div className={`w-full h-px ${dark ? 'bg-white/5' : 'bg-black/10'}`} />

              <button
                onClick={() => setEditing(true)}
                className={`w-full py-2 rounded-lg text-xs border tracking-widest uppercase transition-colors ${dark ? 'border-white/5 text-white/40 hover:text-white/70 hover:bg-white/5' : 'border-black/10 text-black/40 hover:text-black/70 hover:bg-black/5'}`}
              >
                Editar perfil
              </button>
            </>
          ) : success ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-full border border-emerald-900/40 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-black'}`}>¡Perfil actualizado!</p>
            </div>
          ) : (
            <>
              {/* Form editar */}
              <div className="flex flex-col gap-3">
                {[
                  { name: 'name', label: 'Nombre', placeholder: 'Tu nombre', type: 'text' },
                  { name: 'email', label: 'Email', placeholder: 'tu@email.com', type: 'email' },
                ].map(field => (
                  <div key={field.name} className="flex flex-col gap-1">
                    <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/40'}`}>{field.label}</label>
                    <input
                      name={field.name}
                      type={field.type}
                      value={form[field.name as keyof typeof form]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      className={`rounded-lg px-3 py-2 text-sm outline-none border transition-colors ${dark ? 'bg-[#0f0f0f] border-white/5 text-white placeholder-white/20 focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black focus:border-red-300'}`}
                    />
                    {errors[field.name] && <span className="text-red-500 text-[10px]">{errors[field.name]}</span>}
                  </div>
                ))}

                <div className={`w-full h-px ${dark ? 'bg-white/5' : 'bg-black/10'}`} />

                <p className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/20' : 'text-black/30'}`}>Cambiar contraseña (opcional)</p>

                {[
                  { name: 'currentPassword', label: 'Contraseña actual', placeholder: '••••••••' },
                  { name: 'newPassword', label: 'Nueva contraseña', placeholder: '••••••••' },
                ].map(field => (
                  <div key={field.name} className="flex flex-col gap-1">
                    <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/40'}`}>{field.label}</label>
                    <input
                      name={field.name}
                      type="password"
                      value={form[field.name as keyof typeof form]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      className={`rounded-lg px-3 py-2 text-sm outline-none border transition-colors ${dark ? 'bg-[#0f0f0f] border-white/5 text-white placeholder-white/20 focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black focus:border-red-300'}`}
                    />
                    {errors[field.name] && <span className="text-red-500 text-[10px]">{errors[field.name]}</span>}
                  </div>
                ))}
              </div>

              {apiError && (
                <p className="text-red-500 text-xs text-center bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">{apiError}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setEditing(false); setApiError(''); setErrors({}); }}
                  className={`flex-1 py-2 rounded-lg text-xs border tracking-wide transition-colors ${dark ? 'border-white/5 text-white/40 hover:bg-white/5' : 'border-black/10 text-black/40 hover:bg-gray-50'}`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg text-xs bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold tracking-widest uppercase transition-colors"
                >
                  {loading ? 'Guardando...' : 'Guardar →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}