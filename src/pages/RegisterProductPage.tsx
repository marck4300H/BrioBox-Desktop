import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { productApi, type Product } from '../api/product.api';
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

export default function ProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const [loggingOut, setLoggingOut] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const dark = darkMode;

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

  const loadProducts = async (currentPage = page) => {
    setLoading(true);
    setApiError('');
    try {
      const response = await productApi.getAll(currentPage, limit);
      setProducts(response.products ?? []);
      setTotalCount(response.count ?? 0);
      setPage(response.page ?? currentPage);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Error al cargar productos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(1);
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;

    return products.filter(product =>
      [
        product.name,
        product.description,
        product.category,
        String(product.price),
        String(product.stock),
      ]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [products, search]);

  const handleToggleStatus = async (product: Product) => {
    setUpdatingId(product.id);
    try {
      const response = await productApi.toggleStatus(product.id, !product.is_active);
      setProducts(prev =>
        prev.map(item => (item.id === product.id ? response.product : item))
      );
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'No se pudo actualizar el estado.');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);

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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(120,0,0,0.10),_transparent_40%)] pointer-events-none" />
        {dark && (
          <div className="absolute w-[600px] h-[300px] rounded-full blur-[150px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-950/10 pointer-events-none" />
        )}

        <header className={`relative z-10 flex items-center justify-between px-8 py-4 border-b transition-colors duration-500 ${dark ? 'border-white/5' : 'border-black/10'}`}>
          <div>
            <p className={`text-[10px] tracking-widest uppercase mb-0.5 ${dark ? 'text-white/30' : 'text-black/40'}`}>
              Inventario
            </p>
            <h1 className={`text-2xl font-bold tracking-wide ${dark ? 'text-white' : 'text-[#111]'}`}>
              Productos
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

        <div className="relative z-10 flex-1 p-8 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className={`text-[10px] tracking-widest uppercase mb-1 ${dark ? 'text-white/30' : 'text-black/40'}`}>
                Inventario
              </p>
              <h2 className={`text-3xl font-bold tracking-wide ${dark ? 'text-white' : 'text-[#111]'}`}>
                Productos
              </h2>
              <p className={`text-sm mt-1 ${dark ? 'text-white/40' : 'text-black/50'}`}>
                Administra los productos registrados en BrioBox
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadProducts(page)}
                className={`px-4 py-2 rounded-lg border transition-all text-sm ${
                  dark
                    ? 'border-white/10 text-white/60 hover:text-white hover:border-red-900/40 hover:bg-white/5'
                    : 'border-black/10 text-black/60 hover:text-black hover:border-red-300 hover:bg-black/5'
                }`}
              >
                Recargar
              </button>

              <button
                onClick={() => navigate('/register-product')}
                className="px-5 py-2.5 rounded-lg bg-[#cc0000] hover:bg-red-700 text-white font-semibold tracking-wide text-sm transition-colors shadow-lg shadow-red-950/30"
              >
                + Nuevo Producto
              </button>
            </div>
          </div>

          <div className={`border rounded-2xl p-5 flex flex-col gap-4 shadow-2xl ${
            dark ? 'bg-[#141414] border-white/5' : 'bg-white border-black/10'
          }`}>
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="w-full md:max-w-sm">
                <input
                  type="text"
                  placeholder="Buscar por nombre, categoría, descripción..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`w-full rounded-lg px-4 py-2.5 text-sm transition-colors focus:outline-none ${
                    dark
                      ? 'bg-[#111111] border border-[#2a2a2a] text-white placeholder-white/20 focus:border-red-900/60'
                      : 'bg-gray-50 border border-black/10 text-black placeholder-black/30 focus:border-red-300'
                  }`}
                />
              </div>

              <div className={`flex items-center gap-2 text-xs uppercase tracking-widest ${dark ? 'text-white/30' : 'text-black/40'}`}>
                <span>Total:</span>
                <span className={dark ? 'text-white' : 'text-black'}>{totalCount}</span>
              </div>
            </div>

            {apiError && (
              <div className={`text-sm rounded-lg px-4 py-3 border ${
                dark
                  ? 'text-red-400 bg-red-950/20 border-red-900/30'
                  : 'text-red-700 bg-red-50 border-red-200'
              }`}>
                {apiError}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <p className={`text-xs tracking-[0.4em] uppercase animate-pulse ${dark ? 'text-white/30' : 'text-black/30'}`}>
                  Cargando productos...
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className={`w-16 h-16 rounded-full border flex items-center justify-center text-2xl ${
                  dark ? 'border-white/10 text-white/30' : 'border-black/10 text-black/30'
                }`}>
                  🛍️
                </div>
                <h2 className={`text-lg font-semibold tracking-wide ${dark ? 'text-white' : 'text-black'}`}>
                  No hay productos
                </h2>
                <p className={`text-sm text-center max-w-md ${dark ? 'text-white/35' : 'text-black/45'}`}>
                  Aún no se han registrado productos o no hay resultados para la búsqueda actual.
                </p>
                <button
                  onClick={() => navigate('/register-product')}
                  className="mt-2 px-5 py-2.5 rounded-lg bg-[#cc0000] hover:bg-red-700 text-white font-semibold tracking-wide text-sm transition-colors"
                >
                  Registrar primer producto
                </button>
              </div>
            ) : (
              <>
                <div className={`overflow-x-auto rounded-xl border ${dark ? 'border-white/5' : 'border-black/10'}`}>
                  <table className="w-full min-w-[900px] text-sm">
                    <thead className={dark ? 'bg-[#101010]' : 'bg-gray-50'}>
                      <tr className={`text-left uppercase tracking-widest text-[10px] ${dark ? 'text-white/40' : 'text-black/40'}`}>
                        <th className="px-4 py-4">Producto</th>
                        <th className="px-4 py-4">Categoría</th>
                        <th className="px-4 py-4">Precio</th>
                        <th className="px-4 py-4">Stock</th>
                        <th className="px-4 py-4">Estado</th>
                        <th className="px-4 py-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(product => (
                        <tr
                          key={product.id}
                          className={`border-t transition-colors ${dark ? 'border-white/5 hover:bg-white/[0.02]' : 'border-black/5 hover:bg-black/[0.02]'}`}
                        >
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={`font-medium ${dark ? 'text-white' : 'text-black'}`}>
                                {product.name}
                              </span>
                              <span className={`text-xs ${dark ? 'text-white/35' : 'text-black/45'}`}>
                                {product.description}
                              </span>
                            </div>
                          </td>

                          <td className={`px-4 py-4 ${dark ? 'text-white/70' : 'text-black/70'}`}>
                            {product.category}
                          </td>

                          <td className={`px-4 py-4 font-medium ${dark ? 'text-white' : 'text-black'}`}>
                            {formatPrice(product.price)}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                                product.stock > 0
                                  ? dark
                                    ? 'bg-white/5 text-white/70 border-white/10'
                                    : 'bg-black/5 text-black/70 border-black/10'
                                  : dark
                                    ? 'bg-red-950/30 text-red-400 border-red-900/30'
                                    : 'bg-red-50 text-red-700 border-red-200'
                              }`}
                            >
                              {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                                product.is_active
                                  ? dark
                                    ? 'bg-green-950/20 text-green-400 border-green-900/30'
                                    : 'bg-green-50 text-green-700 border-green-200'
                                  : dark
                                    ? 'bg-white/5 text-white/40 border-white/10'
                                    : 'bg-gray-100 text-gray-600 border-gray-200'
                              }`}
                            >
                              {product.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleStatus(product)}
                                disabled={updatingId === product.id}
                                className={`px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider transition-colors disabled:opacity-50 ${
                                  product.is_active
                                    ? dark
                                      ? 'bg-white/5 text-white/60 hover:bg-red-950/20 hover:text-red-400'
                                      : 'bg-black/5 text-black/60 hover:bg-red-50 hover:text-red-700'
                                    : dark
                                      ? 'bg-red-950/20 text-red-300 hover:bg-red-900/30 hover:text-red-200'
                                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                                }`}
                              >
                                {updatingId === product.id
                                  ? 'Actualizando...'
                                  : product.is_active
                                    ? 'Desactivar'
                                    : 'Activar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <p className={`text-xs uppercase tracking-widest ${dark ? 'text-white/35' : 'text-black/45'}`}>
                    Página {page}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadProducts(Math.max(1, page - 1))}
                      disabled={page <= 1 || loading}
                      className={`px-3 py-1.5 rounded-lg border transition-all text-xs disabled:opacity-40 ${
                        dark
                          ? 'border-white/10 text-white/60 hover:text-white hover:border-red-900/40 hover:bg-white/5'
                          : 'border-black/10 text-black/60 hover:text-black hover:border-red-300 hover:bg-black/5'
                      }`}
                    >
                      Anterior
                    </button>

                    <button
                      onClick={() => loadProducts(page + 1)}
                      disabled={loading || products.length < limit || page * limit >= totalCount}
                      className={`px-3 py-1.5 rounded-lg border transition-all text-xs disabled:opacity-40 ${
                        dark
                          ? 'border-white/10 text-white/60 hover:text-white hover:border-red-900/40 hover:bg-white/5'
                          : 'border-black/10 text-black/60 hover:text-black hover:border-red-300 hover:bg-black/5'
                      }`}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}