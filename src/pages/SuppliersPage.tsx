import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';
import Navbar from '../components/ui/Navbar';

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
  const { logout } = useAuth();
  const { darkMode } = useTheme();

  const [loggingOut, setLoggingOut] = useState(false);
  const [search, setSearch] = useState('');

  const dark = darkMode;

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
            Inventory
          </p>
          <h1 className={`text-2xl font-bold tracking-wide ${dark ? 'text-white' : 'text-[#111]'}`}>
            Proveedores
          </h1>
        </div>

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