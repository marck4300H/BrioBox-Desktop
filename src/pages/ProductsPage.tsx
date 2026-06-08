import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi, type Product } from '../api/product.api';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/ui/Navbar';

export default function ProductsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const { darkMode } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
  type: 'success' | 'error';
  message: string;
} | null>(null);

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

  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);

    try {
      await productApi.delete(deleteTarget.id);

      setProducts(prev => prev.filter(product => product.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'No se pudo eliminar el producto.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);

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
    <div className={`flex flex-col min-h-screen transition-colors duration-500 ${dark ? 'bg-[#0a0a0a] text-white' : 'bg-[#f0f0f0] text-[#111]'}`}>
      <Navbar onLogout={handleLogout} />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(120,0,0,0.10),_transparent_40%)] pointer-events-none" />
        {dark && (
          <div className="absolute w-[600px] h-[300px] rounded-full blur-[150px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-950/10 pointer-events-none" />
        )}

        {/* Page header */}
        <div className="relative z-10 px-8 pt-8 pb-4">
          <p className={`text-[10px] tracking-widest uppercase mb-0.5 ${dark ? 'text-white/30' : 'text-black/40'}`}>
            Inventario
          </p>
          <h1 className={`text-2xl font-bold tracking-wide ${dark ? 'text-white' : 'text-[#111]'}`}>
            Productos
          </h1>
        </div>

        <div className="relative z-10 flex-1 p-8 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadProducts(page)}
                className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-red-900/40 hover:bg-white/5 transition-all text-sm"
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

          <div className={`rounded-2xl p-6 shadow-2xl flex flex-col gap-4 border ${dark ? 'bg-[#141414] border-white/5' : 'bg-white border-black/10'}`}>
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="w-full md:max-w-sm">
                <input
                  type="text"
                  placeholder="Buscar por nombre, categoría, descripción..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors ${dark
                    ? 'bg-[#111111] border border-[#2a2a2a] text-white placeholder-white/20 focus:border-red-900/60'
                    : 'bg-gray-50 border border-black/10 text-[#111] placeholder-black/30 focus:border-red-400'
                    }`}
                />  
              </div>

              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/30">
                <span className={`${dark ? 'text-white' : 'text-[#111]'}`}>Total:</span>
                <span className={`${dark ? 'text-white' : 'text-[#111]'}`}>{totalCount}</span>
              </div>
            </div>

            {apiError && (
              <div className="text-red-400 text-sm bg-red-950/20 border border-red-900/30 rounded-lg px-4 py-3">
                {apiError}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <p className={`text-white/30 text-xs tracking-[0.4em] uppercase animate-pulse ${dark ? 'text-white' : 'text-[#111]'}`}>
                  Cargando productos...
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div
              className={`w-16 h-16 rounded-full border flex items-center justify-center text-2xl ${
                dark
                  ? 'border-white/10 text-white/30'
                  : 'border-black/10 text-black/30'
              }`}
            >
              🛍️
            </div>
            <h2
              className={`text-lg font-semibold tracking-wide ${
                dark ? 'text-white' : 'text-[#111]'
              }`}
            >
              No hay productos
            </h2>
            <p
              className={`text-sm text-center max-w-md ${
                dark ? 'text-white/40' : 'text-black/50'
              }`}
            >
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
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-[#101010]">
                    <tr className="text-left text-white/40 uppercase tracking-widest text-[10px]">
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
                        className="border-t border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-white font-medium">{product.name}</span>
                            <span className="text-white/35 text-xs">
                              {product.description}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-white/70">{product.category}</td>

                        <td className="px-4 py-4 text-white font-medium">
                          {formatPrice(product.price)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                              product.stock > 0
                                ? 'bg-white/5 text-white/70 border border-white/10'
                                : 'bg-red-950/30 text-red-400 border border-red-900/30'
                            }`}
                          >
                            {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                              product.is_active
                                ? 'bg-green-950/20 text-green-400 border-green-900/30'
                                : 'bg-white/5 text-white/40 border-white/10'
                            }`}
                          >
                            {product.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/products/${product.id}/edit`)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider transition-colors ${
                                dark
                                  ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                  : 'bg-black/5 text-black/60 hover:bg-black/10 hover:text-black'
                              }`}
                            >
                              Editar
                            </button>

                            <button
                              onClick={() => setDeleteTarget(product)}
                              disabled={deletingId === product.id}
                              className={`px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider transition-colors disabled:opacity-50 ${
                                dark
                                  ? 'bg-red-950/20 text-red-300 hover:bg-red-900/30 hover:text-red-200'
                                  : 'bg-red-50 text-red-700 hover:bg-red-100'
                              }`}
                            >
                              {deletingId === product.id ? 'Eliminando...' : 'Eliminar'}
                            </button>

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
                <div className="flex items-center justify-between gap-4 pt-2">
                  <p className="text-xs text-white/35 uppercase tracking-widest">
                    Página {page}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadProducts(Math.max(1, page - 1))}
                      disabled={page <= 1 || loading}
                      className="px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-red-900/40 hover:bg-white/5 transition-all text-xs disabled:opacity-40"
                    >
                      Anterior
                    </button>

                    <button
                      onClick={() => loadProducts(page + 1)}
                      disabled={loading || products.length < limit || page * limit >= totalCount}
                      className="px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-red-900/40 hover:bg-white/5 transition-all text-xs disabled:opacity-40"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => (deletingId ? null : setDeleteTarget(null))}
          />

          <div
            className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
              dark
                ? 'bg-[#151515] border-white/10'
                : 'bg-white border-black/10'
            }`}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center ${
                    dark ? 'bg-red-950/30 text-red-300' : 'bg-red-50 text-red-700'
                  }`}
                >
                  🗑️
                </div>

                <div>
                  <h3 className={`text-lg font-semibold ${dark ? 'text-white' : 'text-black'}`}>
                    Eliminar producto
                  </h3>
                  <p className={`text-xs tracking-wide ${dark ? 'text-white/40' : 'text-black/45'}`}>
                    Esta acción cambiará el estado del producto.
                  </p>
                </div>
              </div>

              <div
                className={`rounded-xl px-4 py-3 text-sm ${
                  dark ? 'bg-white/5 text-white/70' : 'bg-black/5 text-black/70'
                }`}
              >
                ¿Deseas eliminar <span className="font-semibold">{deleteTarget.name}</span>?
              </div>

              <p className={`text-xs ${dark ? 'text-white/35' : 'text-black/45'}`}>
                Podrás seguir controlando su visibilidad desde la lógica del backend si manejas borrado lógico.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={!!deletingId}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 ${
                    dark
                      ? 'bg-white/5 text-white/70 hover:bg-white/10'
                      : 'bg-black/5 text-black/70 hover:bg-black/10'
                  }`}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  disabled={!!deletingId}
                  className="px-4 py-2 rounded-lg text-sm bg-[#cc0000] hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                >
                  {deletingId ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}