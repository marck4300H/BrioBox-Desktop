import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useMemo, useState } from 'react';
import { supplierApi, type Supplier } from '../api/supplier.api';


const menuItems = [
  { label: 'Clientes', icon: '👤', path: '/clients' },
  { label: 'Membresías', icon: '🎫', path: '/memberships' },
  { label: 'Cuadre de caja', icon: '💰', path: '/cash' },
  { label: 'Proveedores', icon: '📦', path: '/suppliers' },
  { label: 'Productos', icon: '🛍️', path: '/products' },
  { label: 'Registrar Empleado', icon: '➕', path: '/register' },
  { label: 'Ajustes', icon: '⚙️', path: '/settings' },
];


export default function SuppliersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const [loggingOut, setLoggingOut] = useState(false);
  const [search, setSearch] = useState('');

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    nit: '',
    phone: '',
    address: '',
    is_active: true,
  });

  const dark = darkMode;

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await supplierApi.list(page, limit);

      setSuppliers(data.suppliers);
      setTotal(data.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [page]);

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

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('¿Deseas desactivar este proveedor?');

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError('');

      await supplierApi.remove(id);
      await loadSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el proveedor');
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setEditForm({
      name: supplier.name,
      email: supplier.email,
      nit: supplier.nit,
      phone: supplier.phone ?? '',
      address: supplier.address,
      is_active: supplier.is_active,
    });
  };

  const closeEditModal = () => {
    setEditingSupplier(null);
    setEditForm({
      name: '',
      email: '',
      nit: '',
      phone: '',
      address: '',
      is_active: true,
    });
  };

  const handleEditChange = (
    field: keyof typeof editForm,
    value: string | boolean
  ) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingSupplier) return;

    try {
      setEditSaving(true);
      setError('');

      await supplierApi.update(editingSupplier.id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        nit: editForm.nit.trim(),
        phone: editForm.phone.trim() || undefined,
        address: editForm.address.trim(),
        is_active: editForm.is_active,
      });

      await loadSuppliers();
      closeEditModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el proveedor');
    } finally {
      setEditSaving(false);
    }
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier =>
      [supplier.name, supplier.nit, supplier.phone ?? '', supplier.email, supplier.address]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [suppliers, search]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(120,0,0,0.10),_transparent_40%)] pointer-events-none" />
        {dark && (
          <div className="absolute w-[600px] h-[300px] rounded-full blur-[150px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-950/10 pointer-events-none" />
        )}

        <header className={`relative z-10 flex items-center justify-between px-8 py-4 border-b transition-colors duration-500 ${dark ? 'border-white/5' : 'border-black/10'}`}>
          <div>
            <p className={`text-[10px] tracking-widest uppercase mb-0.5 ${dark ? 'text-white/30' : 'text-black/40'}`}>
              Inventory
            </p>
            <h1 className={`text-2xl font-bold tracking-wide ${dark ? 'text-white' : 'text-[#111]'}`}>
              Proveedores
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
              <p className="text-[10px] tracking-widest uppercase text-white/30 mb-1">
                Gestión de proveedores
              </p>
              <h2 className="text-3xl font-bold tracking-wide text-white">Proveedores</h2>
              <p className="text-sm text-white/40 mt-1">
                Visualiza y administra los proveedores registrados en BrioBox
              </p>
            </div>

            <button
              onClick={() => navigate('/register-supplier')}
              className="px-5 py-2.5 rounded-lg bg-[#cc0000] hover:bg-red-700 text-white font-semibold tracking-wide text-sm transition-colors shadow-lg shadow-red-950/30"
            >
              + Nuevo Proveedor
            </button>
          </div>

          <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 flex flex-col gap-4 shadow-2xl">
          {error && (
            <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {loading && (
            <div className="rounded-lg border border-white/5 bg-[#111111] px-4 py-3 text-sm text-white/60">
              Cargando proveedores...
            </div>
          )}
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="w-full md:max-w-sm">
                <input
                  type="text"
                  placeholder="Buscar por nombre, NIT, teléfono o correo..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/30">
                <span>Total:</span>
                <span className="text-white">{filteredSuppliers.length}</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full min-w-[950px] text-sm">
                <thead className="bg-[#101010]">
                  <tr className="text-left text-white/40 uppercase tracking-widest text-[10px]">
                    <th className="px-4 py-4">Proveedor</th>
                    <th className="px-4 py-4">NIT</th>
                    <th className="px-4 py-4">Teléfono</th>
                    <th className="px-4 py-4">Correo</th>
                    <th className="px-4 py-4">Dirección</th>
                    <th className="px-4 py-4">Estado</th>
                    <th className="px-4 py-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map(supplier => (
                    <tr
                      key={supplier.id}
                      className="border-t border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-4 text-white font-medium">{supplier.name}</td>
                      <td className="px-4 py-4 text-white/70">{supplier.nit}</td>
                      <td className="px-4 py-4 text-white/70">{supplier.phone ?? '—'}</td>
                      <td className="px-4 py-4 text-white/70">{supplier.email}</td>
                      <td className="px-4 py-4 text-white/70">{supplier.address}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                            supplier.is_active
                              ? 'bg-green-950/20 text-green-400 border-green-900/30'
                              : 'bg-yellow-950/20 text-yellow-300 border-yellow-700/30'
                          }`}
                        >
                          {supplier.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(supplier)}
                            className="px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            disabled={deletingId === supplier.id}
                            className="px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider bg-red-950/20 text-red-300 hover:bg-red-900/30 transition-colors disabled:opacity-60"
                          >
                            {deletingId === supplier.id ? 'Eliminando...' : 'Eliminar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs uppercase tracking-widest text-white/30">
                  Página {page} de {totalPages} · Total registros: {total}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="px-3 py-2 rounded-lg border border-white/10 text-white/60 disabled:opacity-40"
                  >
                    Anterior
                  </button>

                  <button
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-2 rounded-lg border border-white/10 text-white/60 disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {editingSupplier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30">
                    Proveedores
                  </p>
                  <h3 className="text-xl font-bold text-white">
                    Editar proveedor
                  </h3>
                </div>

                <button
                  onClick={closeEditModal}
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/60 hover:bg-white/5"
                >
                  Cerrar
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-white/40 text-[10px] uppercase tracking-widest">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => handleEditChange('name', e.target.value)}
                      className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-white/40 text-[10px] uppercase tracking-widest">
                      NIT
                    </label>
                    <input
                      type="text"
                      value={editForm.nit}
                      onChange={e => handleEditChange('nit', e.target.value)}
                      className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-900/60 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-white/40 text-[10px] uppercase tracking-widest">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={e => handleEditChange('phone', e.target.value)}
                      className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-900/60 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-white/40 text-[10px] uppercase tracking-widest">
                      Correo
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={e => handleEditChange('email', e.target.value)}
                      className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-900/60 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-white/40 text-[10px] uppercase tracking-widest">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={e => handleEditChange('address', e.target.value)}
                    className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-900/60 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#111111] px-4 py-3">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={e => handleEditChange('is_active', e.target.checked)}
                    className="h-4 w-4 accent-red-600"
                  />
                  <label htmlFor="is_active" className="text-sm text-white/70">
                    Proveedor activo
                  </label>
                </div>

                <div className="flex flex-col gap-3 pt-2 md:flex-row">
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="w-full md:w-auto px-6 py-2.5 rounded-lg bg-[#cc0000] hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold tracking-widest text-sm uppercase transition-colors shadow-lg shadow-red-950/30"
                  >
                    {editSaving ? 'Guardando...' : 'Guardar cambios'}
                  </button>

                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="w-full md:w-auto px-6 py-2.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-red-900/40 hover:bg-white/5 transition-all text-sm uppercase tracking-widest"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}