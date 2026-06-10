import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { supplierApi } from '../api/supplier.api';
import Navbar from '../components/ui/Navbar';

const menuItems = [
  { label: 'Clientes', icon: '👤', path: '/clients' },
  { label: 'Membresías', icon: '🎫', path: '/memberships' },
  { label: 'Cuadre de caja', icon: '💰', path: '/cash' },
  { label: 'Proveedores', icon: '📦', path: '/suppliers' },
  { label: 'Productos', icon: '🛍️', path: '/products' },
  { label: 'Registrar Empleado', icon: '➕', path: '/register' },
  { label: 'Ajustes', icon: '⚙️', path: '/settings' },
];

export default function RegisterSupplierPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { darkMode } = useTheme();

  const [loggingOut, setLoggingOut] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    nit: '',
    phone: '',
    email: '',
    address: '',
  });

  const dark = darkMode;

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name.trim() || !form.nit.trim() || !form.email.trim() || !form.address.trim()) {
      setError('Completa nombre, NIT, correo y dirección.');
      return;
    }

    try {
      setSaving(true);

      await supplierApi.create({
        name: form.name.trim(),
        nit: form.nit.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
      });

      setSuccess('Proveedor registrado correctamente.');

      setForm({
        name: '',
        nit: '',
        phone: '',
        email: '',
        address: '',
      });

      setTimeout(() => navigate('/suppliers'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el proveedor');
    } finally {
      setSaving(false);
    }
  };

  const isActiveRoute = (path: string) => {
    if (path === '/products') {
      return location.pathname === '/products' || location.pathname === '/register-product';
    }

    if (path === '/clients') {
      return location.pathname === '/clients' || location.pathname === '/register-client';
    }

    if (path === '/suppliers') {
      return location.pathname === '/suppliers' || location.pathname === '/register-supplier';
    }

    return location.pathname === path;
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    await new Promise(resolve => setTimeout(resolve, 2000));
    navigate('/login');
  };

  if (loggingOut) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a0000_0%,_#050000_35%,_#000000_65%)]" />
        <div className="absolute w-[400px] h-[400px] rounded-full blur-[120px] bg-red-950/20 pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <img
            src="/brioboxlogo.png"
            alt="BrioBox"
            className="w-16 h-16 object-contain opacity-60 animate-pulse"
          />
          <div className="w-16 h-px bg-red-900/40" />
          <p className="text-white/30 text-[11px] tracking-[0.5em] uppercase animate-pulse">
            Cerrando sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-500 ${dark ? 'bg-[#0a0a0a] text-white' : 'bg-[#f0f0f0] text-[#111]'}`}>
      <Navbar onLogout={handleLogout} />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a0000_0%,_#050000_35%,_#000000_65%)]" />
        <div className="absolute w-[700px] h-[400px] rounded-full blur-[160px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-950/20 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(0,0,0,0.7)_70%,_rgba(0,0,0,0.95)_100%)] pointer-events-none" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-black/80 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-black/80 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-black/80 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-black/80 to-transparent pointer-events-none" />

        {/* Page header */}
        <div className="relative z-10 px-8 pt-8 pb-4">
          <p className={`text-[10px] tracking-widest uppercase mb-0.5 ${dark ? 'text-white/30' : 'text-black/40'}`}>
            Inventory
          </p>
          <h1 className={`text-2xl font-bold tracking-wide ${dark ? 'text-white' : 'text-[#111]'}`}>
            Registrar proveedor
          </h1>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center p-8">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-2xl shadow-2xl flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <img
                src="/brioboxlogo.png"
                alt="BrioBox"
                className="w-14 h-14 object-contain drop-shadow-[0_0_15px_rgba(180,0,0,0.4)]"
              />
              <h2 className="text-white text-2xl font-bold tracking-wide">Nuevo Proveedor</h2>
              <p className="text-white/30 text-xs text-center tracking-wider uppercase">
                Completa la información visual del proveedor
              </p>
            </div>

            <div className="w-full h-px bg-red-900/30" />

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-white/40 text-[10px] uppercase tracking-widest">
                    Nombre del proveedor
                  </label>
                  <input
                    type="text"
                    placeholder="Distribuciones Fitness SAS"
                    value={form.name}
                    onChange={e => handleChange('name', e.target.value)}
                    className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-white/40 text-[10px] uppercase tracking-widest">
                    NIT
                  </label>
                  <input
                  type="text"
                  placeholder="900123456-1"
                  value={form.nit}
                  onChange={e => handleChange('nit', e.target.value)}
                  className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors"
                />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-white/40 text-[10px] uppercase tracking-widest">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="3104567890"
                    value={form.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-white/40 text-[10px] uppercase tracking-widest">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="contacto@empresa.com"
                    value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                    className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-white/40 text-[10px] uppercase tracking-widest">
                  Dirección
                </label>
                <input
                  type="text"
                  placeholder="Av. 6N # 23-45, Cali"
                  value={form.address}
                  onChange={e => handleChange('address', e.target.value)}
                  className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg border border-green-900/40 bg-green-950/20 px-4 py-3 text-sm text-green-300">
                  {success}
                </div>
              )}

              <div className="rounded-xl border border-white/5 bg-[#111111] p-4 flex flex-col gap-2">
                <p className="text-[10px] uppercase tracking-widest text-white/30">
                  Vista previa
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-[#161616] border border-white/5 p-3">
                    <span className="text-white/30 block text-[10px] uppercase tracking-widest mb-1">
                      Relación con productos
                    </span>
                    <span className="text-white/70">
                      Se conectará cuando el backend de productos/proveedores esté listo.
                    </span>
                  </div>

                  <div className="rounded-lg bg-[#161616] border border-white/5 p-3">
                    <span className="text-white/30 block text-[10px] uppercase tracking-widest mb-1">
                      Validación NIT
                    </span>
                    <span className="text-white/70">
                      La validación de duplicados se integrará con backend más adelante.
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full md:w-auto px-6 py-2.5 rounded-lg bg-[#cc0000] hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold tracking-widest text-sm uppercase transition-colors shadow-lg shadow-red-950/30"
                >
                  {saving ? 'Guardando...' : 'Guardar proveedor'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/suppliers')}
                  className="w-full md:w-auto px-6 py-2.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-red-900/40 hover:bg-white/5 transition-all text-sm uppercase tracking-widest"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}