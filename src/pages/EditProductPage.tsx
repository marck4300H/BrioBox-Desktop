import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { productApi } from '../api/product.api';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

const menuItems = [
  { label: 'Clientes', icon: '👤', path: '/clients' },
  { label: 'Membresías', icon: '🎫', path: '/memberships' },
  { label: 'Cuadre de caja', icon: '💰', path: '/cash' },
  { label: 'Proveedores', icon: '📦', path: '/suppliers' },
  { label: 'Productos', icon: '🛍️', path: '/products' },
  { label: 'Registrar Empleado', icon: '➕', path: '/register' },
  { label: 'Ajustes', icon: '⚙️', path: '/settings' },
];

export default function EditProductPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const [loggingOut, setLoggingOut] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
  });

  const dark = darkMode;

  const isActiveRoute = (path: string) => {
    if (path === '/products') {
      return (
        location.pathname === '/products' ||
        location.pathname === '/register-product' ||
        location.pathname.includes('/products/')
      );
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

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        setApiError('No se encontró el identificador del producto.');
        setInitialLoading(false);
        return;
      }

      try {
        const response = await productApi.getById(Number(id));
        const product = response.product;

        setForm({
          name: product.name ?? '',
          price: String(product.price ?? ''),
          stock: String(product.stock ?? ''),
        });
      } catch (err: unknown) {
        setApiError(err instanceof Error ? err.message : 'No se pudo cargar el producto.');
      } finally {
        setInitialLoading(false);
      }
    };

    void loadProduct();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value,
    }));

    setErrors(prev => ({
      ...prev,
      [name]: '',
    }));

    setApiError('');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const name = form.name.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!name) {
      newErrors.name = 'El nombre del producto es requerido.';
    } else if (name.length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres.';
    }

    if (form.price === '') {
      newErrors.price = 'El precio es requerido.';
    } else if (Number.isNaN(price) || price <= 0) {
      newErrors.price = 'El precio debe ser mayor a 0.';
    }

    if (form.stock === '') {
      newErrors.stock = 'El stock es requerido.';
    } else if (Number.isNaN(stock) || stock < 0) {
      newErrors.stock = 'El stock no puede ser negativo.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError('');

    if (!id || !validate()) return;

    setLoading(true);

    try {
      await productApi.update(Number(id), {
        name: form.name.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
      });

      setSuccess(true);

      setTimeout(() => {
        navigate('/products');
      }, 1800);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'No se pudo actualizar el producto.');
    } finally {
      setLoading(false);
    }
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs tracking-wide transition-all text-left ${
                  isActiveRoute(item.path)
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

        <header className={`relative z-10 flex items-center justify-between px-8 py-4 border-b transition-colors duration-500 ${dark ? 'border-white/5' : 'border-black/10'}`}>
          <div>
            <p className={`text-[10px] tracking-widest uppercase mb-0.5 ${dark ? 'text-white/30' : 'text-black/40'}`}>
              Inventario
            </p>
            <h1 className={`text-2xl font-bold tracking-wide ${dark ? 'text-white' : 'text-[#111]'}`}>
              Editar producto
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
          <div className="w-full max-w-xl flex flex-col gap-4">
            <button
              onClick={() => navigate('/products')}
              className={`self-start text-xs tracking-wider transition-colors ${
                dark ? 'text-white/30 hover:text-white/60' : 'text-black/40 hover:text-black/70'
              }`}
            >
              ← Volver a productos
            </button>

            <div className={`rounded-2xl p-8 border shadow-2xl flex flex-col items-center gap-6 ${
              dark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-black/10'
            }`}>
              {initialLoading ? (
                <div className="flex flex-col items-center gap-4 py-10">
                  <p className={`text-xs tracking-[0.4em] uppercase animate-pulse ${dark ? 'text-white/30' : 'text-black/35'}`}>
                    Cargando producto...
                  </p>
                </div>
              ) : success ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className={`w-16 h-16 rounded-full border flex items-center justify-center ${
                    dark
                      ? 'border-red-900/40 drop-shadow-[0_0_15px_rgba(180,0,0,0.3)]'
                      : 'border-red-200'
                  }`}>
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className={`text-xl font-bold tracking-wide ${dark ? 'text-white' : 'text-black'}`}>
                    ¡Producto actualizado!
                  </h2>
                  <p className={`text-xs text-center tracking-wider ${dark ? 'text-white/30' : 'text-black/45'}`}>
                    Redirigiendo a productos...
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src="/brioboxlogo.png"
                      alt="BrioBox"
                      className="w-14 h-14 object-contain drop-shadow-[0_0_15px_rgba(180,0,0,0.4)]"
                    />
                    <h2 className={`text-2xl font-bold tracking-wide ${dark ? 'text-white' : 'text-black'}`}>
                      Editar Producto
                    </h2>
                    <p className={`text-xs text-center tracking-wider uppercase ${dark ? 'text-white/30' : 'text-black/45'}`}>
                      Modifica la información del producto
                    </p>
                  </div>

                  <div className={`w-full h-px ${dark ? 'bg-red-900/30' : 'bg-red-100'}`} />

                  <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/50'}`}>
                        Nombre del producto
                      </label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        disabled={loading}
                        className={`rounded-lg px-4 py-2.5 text-sm transition-colors ${
                          dark
                            ? 'bg-[#111111] border border-[#2a2a2a] text-white placeholder-white/20 focus:outline-none focus:border-red-900/60'
                            : 'bg-gray-50 border border-black/10 text-black placeholder-black/30 focus:outline-none focus:border-red-300'
                        }`}
                      />
                      {errors.name && <span className="text-red-500 text-[10px]">{errors.name}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/50'}`}>
                          Precio (COP)
                        </label>
                        <input
                          name="price"
                          type="number"
                          min="0"
                          step="1"
                          value={form.price}
                          onChange={handleChange}
                          disabled={loading}
                          className={`rounded-lg px-4 py-2.5 text-sm transition-colors ${
                            dark
                              ? 'bg-[#111111] border border-[#2a2a2a] text-white placeholder-white/20 focus:outline-none focus:border-red-900/60'
                              : 'bg-gray-50 border border-black/10 text-black placeholder-black/30 focus:outline-none focus:border-red-300'
                          }`}
                        />
                        {errors.price && <span className="text-red-500 text-[10px]">{errors.price}</span>}
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/50'}`}>
                          Stock
                        </label>
                        <input
                          name="stock"
                          type="number"
                          min="0"
                          step="1"
                          value={form.stock}
                          onChange={handleChange}
                          disabled={loading}
                          className={`rounded-lg px-4 py-2.5 text-sm transition-colors ${
                            dark
                              ? 'bg-[#111111] border border-[#2a2a2a] text-white placeholder-white/20 focus:outline-none focus:border-red-900/60'
                              : 'bg-gray-50 border border-black/10 text-black placeholder-black/30 focus:outline-none focus:border-red-300'
                          }`}
                        />
                        {errors.stock && <span className="text-red-500 text-[10px]">{errors.stock}</span>}
                      </div>
                    </div>

                    {apiError && (
                      <p className={`text-xs text-center rounded-lg px-3 py-2 border ${
                        dark
                          ? 'text-red-400 bg-red-950/20 border-red-900/30'
                          : 'text-red-700 bg-red-50 border-red-200'
                      }`}>
                        {apiError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors mt-1 tracking-widest text-sm uppercase shadow-lg shadow-red-950/30"
                    >
                      {loading ? 'Guardando cambios...' : 'Actualizar Producto →'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}