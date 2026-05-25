import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

const menuItems = [
  { label: 'Clientes', icon: '👤', path: '/clients' },
  { label: 'Membresías', icon: '🎫', path: '/memberships' },
  { label: 'Cuadre de caja', icon: '💰', path: '/cash' },
  { label: 'Proveedores', icon: '📦', path: '/suppliers' },
  { label: 'Productos', icon: '🛍️', path: '/products' },
  { label: 'Registrar Empleado', icon: '➕', path: '/register' },
  { label: 'Ajustes', icon: '⚙️', path: '/settings' },
];

const mockSuppliers = [
  {
    id: 1,
    name: 'Distribuciones Fitness SAS',
    nit: '900123456-1',
    phone: '3104567890',
    email: 'contacto@fitnesssas.com',
    products: 12,
    status: 'Activo',
  },
  {
    id: 2,
    name: 'Suplementos del Valle',
    nit: '901987654-2',
    phone: '3152223344',
    email: 'ventas@suplementosvalle.com',
    products: 8,
    status: 'Activo',
  },
  {
    id: 3,
    name: 'Importadora Power Gym',
    nit: '800456123-9',
    phone: '3009988776',
    email: 'admin@powergym.com',
    products: 5,
    status: 'Pendiente',
  },
];

export default function SuppliersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const [loggingOut, setLoggingOut] = useState(false);
  const [search, setSearch] = useState('');

  const dark = darkMode;

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

  const filteredSuppliers = mockSuppliers.filter(supplier =>
    [supplier.name, supplier.nit, supplier.phone, supplier.email]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

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
                    <th className="px-4 py-4">Productos</th>
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
                      <td className="px-4 py-4 text-white/70">{supplier.phone}</td>
                      <td className="px-4 py-4 text-white/70">{supplier.email}</td>
                      <td className="px-4 py-4 text-white">{supplier.products}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                            supplier.status === 'Activo'
                              ? 'bg-green-950/20 text-green-400 border-green-900/30'
                              : 'bg-yellow-950/20 text-yellow-300 border-yellow-700/30'
                          }`}
                        >
                          {supplier.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider bg-white/5 text-white/60 hover:bg-white/10 transition-colors">
                            Editar
                          </button>
                          <button className="px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider bg-red-950/20 text-red-300 hover:bg-red-900/30 transition-colors">
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}