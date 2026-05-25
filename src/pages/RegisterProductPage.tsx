import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { productApi } from '../api/product.api';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

const CATEGORIES = [
  'Suplementos',
  'Ropa deportiva',
  'Accesorios',
  'Equipos',
  'Bebidas',
  'Otros',
];

const menuItems = [
  { label: 'Clientes', icon: '👤', path: '/clients' },
  { label: 'Membresías', icon: '🎫', path: '/memberships' },
  { label: 'Cuadre de caja', icon: '💰', path: '/cash' },
  { label: 'Proveedores', icon: '📦', path: '/suppliers' },
  { label: 'Productos', icon: '🛍️', path: '/products' },
  { label: 'Registrar Empleado', icon: '➕', path: '/register' },
  { label: 'Ajustes', icon: '⚙️', path: '/settings' },
];

export default function RegisterProductPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const { darkMode, toggleTheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isActiveRoute = (path: string) => {
    if (path === '/products') {
      return location.pathname === '/products' || location.pathname === '/register-product';
    }

    if (path === '/clients') {
      return location.pathname === '/clients' || location.pathname === '/register-client';
    }

    return location.pathname === path;
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    await new Promise(resolve => setTimeout(resolve, 2000));
    navigate('/login');
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'El nombre del producto es requerido.';
    if (!form.description.trim()) newErrors.description = 'La descripción es requerida.';
    if (!form.price || Number(form.price) <= 0) newErrors.price = 'El precio debe ser mayor a 0.';
    if (!form.stock || Number(form.stock) < 0) newErrors.stock = 'El stock no puede ser negativo.';
    if (!form.category) newErrors.category = 'Selecciona una categoría.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await productApi.create({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        category: form.category,
      });
      setSuccess(true);
      setTimeout(() => navigate('/products'), 2000);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Error al registrar producto.');
    } finally {
      setLoading(false);
    }
  };

  const dark = darkMode;

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
    <div className={`flex min-h-screen transition-colors duration-500 ${dark ? 'bg-[#0a0a0a] text-white' : 'bg-[#f0f0f0] text-[#111]'}`}>
      <aside className={`w-56 flex flex-col justify-between py-6 px-4 border-r transition-colors duration-500 ${dark ? 'bg-[#0f0f0f] border-white/5' : 'bg-white border-black/10'}`}>
        <div className="flex flex-col gap-6">
          <div className={`flex flex-col items-center gap-2 pb-4 border-b ${dark ? 'border-white/5' : 'border-black/10'}`}>
            <img
              src="/brioboxlogo.png"
              alt="BrioBox"
              className={`w-12 h-12 object-contain ${dark ? 'drop-shadow-[0_0_10px_rgba(180,0,0,0.4)]' : ''}`}
            />
            <div className="text-center">
              <p className={`font-bold text-sm tracking-widest uppercase ${dark ? 'text-white' : 'text-[#111]'}`}>BrioBox</p>
              <p className={`text-[9px] tracking-widest uppercase ${dark ? 'text-white/30' : 'text-black/40'}`}>Gym Management</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {menuItems.map(item => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs tracking-wide transition-all text-left ${isActiveRoute(item.path)
                  ? dark
                    ? 'bg-red-900/30 text-red-400 border border-red-900/30'
                    : 'bg-red-100 text-red-700 border border-red-200'
                  : dark
                    ? 'text-white/40 hover:text-white/70 hover:bg-white/5'
                    : 'text-black/50 hover:text-black/80 hover:bg-black/5'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs tracking-wide transition-all ${dark ? 'text-white/30 hover:text-red-500 hover:bg-red-950/20' : 'text-black/40 hover:text-red-600 hover:bg-red-50'}`}
        >
          <span>{loggingOut ? '⏳' : '🚪'}</span>
          {loggingOut ? 'Cerrando sesión...' : 'Logout'}
        </button>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a0000_0%,_#050000_35%,_#000000_65%)]" />
        <div className="absolute w-[700px] h-[400px] rounded-full blur-[160px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-950/20 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(0,0,0,0.7)_70%,_rgba(0,0,0,0.95)_100%)] pointer-events-none" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-black/80 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-black/80 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-black/80 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-black/80 to-transparent pointer-events-none" />

        <header className={`relative z-10 flex items-center justify-between px-8 py-4 border-b transition-colors duration-500 ${dark ? 'border-white/5' : 'border-black/10'}`}>
          <div>
            <p className={`text-[10px] tracking-widest uppercase mb-0.5 ${dark ? 'text-white/30' : 'text-black/40'}`}>
              Inventario
            </p>
            <h1 className={`text-2xl font-bold tracking-wide ${dark ? 'text-white' : 'text-[#111]'}`}>
              Registrar producto
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full relative transition-all duration-300 ${dark ? 'bg-red-900/60' : 'bg-black/20'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 flex items-center justify-center text-[8px] ${dark ? 'left-7 bg-red-500' : 'left-1 bg-white'}`}>
                {dark ? '🌙' : '☀️'}
              </div>
            </button>

            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border transition-colors cursor-pointer ${dark ? 'border-white/10 text-white/50 hover:border-red-900/50 hover:text-red-400' : 'border-black/10 text-black/50'}`}>
              🔔
            </div>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${dark ? 'border-white/5 bg-white/5 hover:border-red-900/30' : 'border-black/10 bg-black/5'}`}>
              <img
                src="/user.png"
                alt="user"
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className={`text-xs tracking-wide ${dark ? 'text-white/60' : 'text-black/60'}`}>
                {user?.name ?? 'Admin'} {user?.lastName ?? ''}
              </span>
            </div>
          </div>
        </header>

        <div className="relative z-10 flex-1 flex items-center justify-center p-8">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-lg shadow-2xl flex flex-col items-center gap-6">
            {success ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-16 h-16 rounded-full border border-red-900/40 flex items-center justify-center drop-shadow-[0_0_15px_rgba(180,0,0,0.3)]">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-white text-xl font-bold tracking-wide">¡Producto registrado!</h2>
                <p className="text-white/30 text-xs text-center tracking-wider">Redirigiendo a productos...</p>
                <div className="flex gap-1.5 items-center">
                  <div className="w-1 h-1 rounded-full bg-red-500/80 animate-pulse" />
                  <div className="w-8 h-px bg-red-500/40" />
                  <div className="w-1 h-1 rounded-full bg-red-500/80 animate-pulse" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-2">
                  <img
                    src="/brioboxlogo.png"
                    alt="BrioBox"
                    className="w-14 h-14 object-contain drop-shadow-[0_0_15px_rgba(180,0,0,0.4)]"
                  />
                  <h2 className="text-white text-2xl font-bold tracking-wide">Nuevo Producto</h2>
                  <p className="text-white/30 text-xs text-center tracking-wider uppercase">
                    Completa los datos del producto
                  </p>
                </div>

                <div className="w-full h-px bg-red-900/30" />

                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-white/40 text-[10px] uppercase tracking-widest">
                      Nombre del producto
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Proteína Whey 1kg"
                      className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors"
                    />
                    {errors.name && <span className="text-red-500 text-[10px]">{errors.name}</span>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-white/40 text-[10px] uppercase tracking-widest">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Descripción breve del producto..."
                      rows={3}
                      className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors resize-none"
                    />
                    {errors.description && (
                      <span className="text-red-500 text-[10px]">{errors.description}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-white/40 text-[10px] uppercase tracking-widest">
                        Precio (COP)
                      </label>
                      <input
                        name="price"
                        type="number"
                        min="0"
                        value={form.price}
                        onChange={handleChange}
                        placeholder="50000"
                        className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors"
                      />
                      {errors.price && <span className="text-red-500 text-[10px]">{errors.price}</span>}
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-white/40 text-[10px] uppercase tracking-widest">
                        Stock
                      </label>
                      <input
                        name="stock"
                        type="number"
                        min="0"
                        value={form.stock}
                        onChange={handleChange}
                        placeholder="10"
                        className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors"
                      />
                      {errors.stock && <span className="text-red-500 text-[10px]">{errors.stock}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-white/40 text-[10px] uppercase tracking-widest">
                      Categoría
                    </label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-900/60 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="text-white/20">
                        Selecciona una categoría
                      </option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className="bg-[#1a1a1a] text-white">
                          {cat}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <span className="text-red-500 text-[10px]">{errors.category}</span>
                    )}
                  </div>

                  {apiError && (
                    <p className="text-red-500 text-xs text-center bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">
                      {apiError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors mt-1 tracking-widest text-sm uppercase shadow-lg shadow-red-950/30"
                  >
                    {loading ? 'Registrando...' : 'Registrar Producto →'}
                  </button>
                </form>

                <button
                  onClick={() => navigate('/products')}
                  className="text-white/25 text-xs hover:text-white/50 transition-colors tracking-wider"
                >
                  ← Volver a productos
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}