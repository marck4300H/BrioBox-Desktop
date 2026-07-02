import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi } from '../api/product.api';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { supplierApi } from '../api/supplier.api';
import Navbar from '../components/ui/Navbar';

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
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const dark = darkMode;

  const [loggingOut, setLoggingOut] = useState(false);

  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    supplierId: '',
  });

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    await new Promise(resolve => setTimeout(resolve, 2000));
    navigate('/login');
  };

  useEffect(() => {
    fetchActiveSuppliers();
  }, []);

  const fetchActiveSuppliers = async () => {
    setLoadingSuppliers(true);

    try {
      const response = await supplierApi.list(1, 100);
      setSuppliers((response.suppliers ?? []).filter(supplier => supplier.is_active));
    } catch (err) {
      console.error(err);
      setSuppliers([]);
      setApiError('No se pudieron cargar los proveedores activos.');
    } finally {
      setLoadingSuppliers(false);
    }
  };

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

    if (!form.supplierId) {
      newErrors.supplierId = 'Selecciona un proveedor.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    setLoading(true);

    try {
      await productApi.create({
        name: form.name.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        supplier_id: Number(form.supplierId),
      });
      setSuccess(true);

      setTimeout(() => {
        navigate('/products');
      }, 1800);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Error al registrar producto.');
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
            Inventario
          </p>
          <h1 className={`text-2xl font-bold tracking-wide ${dark ? 'text-white' : 'text-[#111]'}`}>
            Registrar producto
          </h1>
        </div>

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
              {success ? (
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
                    ¡Producto registrado!
                  </h2>
                  <p className={`text-xs text-center tracking-wider ${dark ? 'text-white/30' : 'text-black/45'}`}>
                    Redirigiendo a productos...
                  </p>
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
                    <h2 className={`text-2xl font-bold tracking-wide ${dark ? 'text-white' : 'text-black'}`}>
                      Nuevo Producto
                    </h2>
                    <p className={`text-xs text-center tracking-wider uppercase ${dark ? 'text-white/30' : 'text-black/45'}`}>
                      Completa los datos del producto
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
                        placeholder="Proteína Whey 1kg"
                        disabled={loading}
                        className={`rounded-lg px-4 py-2.5 text-sm transition-colors ${
                          dark
                            ? 'bg-[#111111] border border-[#2a2a2a] text-white placeholder-white/20 focus:outline-none focus:border-red-900/60'
                            : 'bg-gray-50 border border-black/10 text-black placeholder-black/30 focus:outline-none focus:border-red-300'
                        }`}
                      />
                      {errors.name && <span className="text-red-500 text-[10px]">{errors.name}</span>}
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/50'}`}>
                        Proveedor
                      </label>

                      <select
                        name="supplierId"
                        value={form.supplierId}
                        onChange={handleChange}
                        disabled={loading || loadingSuppliers}
                        className={`rounded-lg px-4 py-2.5 text-sm transition-colors appearance-none cursor-pointer ${
                          dark
                            ? 'bg-[#111111] border border-[#2a2a2a] text-white focus:outline-none focus:border-red-900/60'
                            : 'bg-gray-50 border border-black/10 text-black focus:outline-none focus:border-red-300'
                        }`}
                      >
                        <option value="" disabled>
                          {loadingSuppliers ? 'Cargando proveedores...' : 'Selecciona un proveedor'}
                        </option>

                        {suppliers.map((supplier) => (
                          <option
                            key={supplier.id}
                            value={supplier.id}
                            className={dark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black'}
                          >
                            {supplier.name}
                          </option>
                        ))}
                      </select>

                      {errors.supplierId && (
                        <span className="text-red-500 text-[10px]">{errors.supplierId}</span>
                      )}
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
                          placeholder="50000"
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
                          placeholder="10"
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
                      {loading ? 'Registrando...' : 'Registrar Producto →'}
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