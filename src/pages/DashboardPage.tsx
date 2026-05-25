import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import ProfilePanel from '../components/ui/ProfilePanel';

const menuItems = [
  { label: 'Clientes', icon: '👤', path: '/clients' },
  { label: 'Membresías', icon: '🎫', path: '/memberships' },
  { label: 'Cuadre de caja', icon: '💰', path: '/cash' },
  { label: 'Proveedores', icon: '📦', path: '/suppliers' },
  { label: 'Productos', icon: '🛍️', path: '/products' },
  { label: 'Registrar Empleado', icon: '➕', path: '/register' },
  { label: 'Ajustes', icon: '⚙️', path: '/settings' },
];

const stats = [
  { label: 'Total Users', value: '20', change: 'more admins', positive: true, icon: '👥' },
  { label: 'Active Memberships', value: '184', sub: '/ 1,248', change: '+5%', positive: true, icon: '🎫' },
  { label: 'Daily Revenue', value: 'COP $200,000', change: '▲ Trending', positive: true, icon: '💵' },
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleTheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const isActiveRoute = (path: string) => {
    if (path === '/products') return location.pathname === '/products' || location.pathname === '/register-product';
    if (path === '/clients') return location.pathname === '/clients' || location.pathname === '/register-client';
    return location.pathname === path;
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    await new Promise(resolve => setTimeout(resolve, 2000));
    navigate('/login');
  };

  const dark = darkMode;

  if (loggingOut) return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a0000_0%,_#050000_35%,_#000000_65%)]" />
      <div className="absolute w-[400px] h-[400px] rounded-full blur-[120px] bg-red-950/20 pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <img src="/brioboxlogo.png" alt="BrioBox" className="w-16 h-16 object-contain opacity-60 animate-pulse" />
        <div className="w-16 h-px bg-red-900/40" />
        <p className="text-white/30 text-[11px] tracking-[0.5em] uppercase animate-pulse">Cerrando sesión...</p>
      </div>
    </div>
  );

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${dark ? 'bg-[#0a0a0a] text-white' : 'bg-[#f0f0f0] text-[#111]'}`}>

      {/* SIDEBAR */}
      <aside className={`w-56 flex flex-col justify-between py-6 px-4 border-r transition-colors duration-500 ${dark ? 'bg-[#0f0f0f] border-white/5' : 'bg-white border-black/10'}`}>
        <div className="flex flex-col gap-6">
          <div className={`flex flex-col items-center gap-2 pb-4 border-b ${dark ? 'border-white/5' : 'border-black/10'}`}>
            <img src="/brioboxlogo.png" alt="BrioBox" className={`w-12 h-12 object-contain ${dark ? 'drop-shadow-[0_0_10px_rgba(180,0,0,0.4)]' : ''}`} />
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
                    ? dark ? 'bg-red-900/30 text-red-400 border border-red-900/30' : 'bg-red-100 text-red-700 border border-red-200'
                    : dark ? 'text-white/40 hover:text-white/70 hover:bg-white/5' : 'text-black/50 hover:text-black/80 hover:bg-black/5'
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

      {/* MAIN */}
      <main className="flex-1 flex flex-col">

        {/* Topbar */}
        <header className={`flex items-center justify-between px-8 py-4 border-b transition-colors duration-500 ${dark ? 'border-white/5' : 'border-black/10'}`}>
          <div>
            <p className={`text-[10px] tracking-widest uppercase mb-0.5 ${dark ? 'text-white/30' : 'text-black/40'}`}>Overview</p>
            <h1 className={`text-2xl font-bold tracking-wide ${dark ? 'text-white' : 'text-[#111]'}`}>Dashboard</h1>
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

            {/* Avatar — abre ProfilePanel */}
            <div
              onClick={() => setShowProfile(prev => !prev)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                showProfile
                  ? dark ? 'border-red-900/40 bg-red-950/10' : 'border-red-300 bg-red-50'
                  : dark ? 'border-white/5 bg-white/5 hover:border-red-900/30' : 'border-black/10 bg-black/5'
              }`}
            >
              <img src="/user.png" alt="user" className="w-6 h-6 rounded-full object-cover" />
              <span className={`text-xs tracking-wide ${dark ? 'text-white/60' : 'text-black/60'}`}>
                {user?.name ?? 'Admin'} {user?.lastName ?? ''}
              </span>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <div className="flex-1 p-8 flex flex-col gap-8">
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <div
                key={i}
                className={`rounded-xl p-5 border flex flex-col gap-3 transition-all duration-500 hover:scale-[1.02] ${
                  dark ? 'bg-[#141414] border-white/5 hover:border-red-900/30' : 'bg-white border-black/10 hover:border-red-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{stat.icon}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full tracking-wide ${
                    stat.positive
                      ? dark ? 'bg-red-950/40 text-red-400' : 'bg-red-100 text-red-600'
                      : dark ? 'bg-white/5 text-white/30' : 'bg-black/5 text-black/40'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <div>
                  <p className={`text-[10px] uppercase tracking-widest mb-1 ${dark ? 'text-white/30' : 'text-black/40'}`}>{stat.label}</p>
                  <p className={`text-2xl font-bold ${dark ? 'text-white' : 'text-[#111]'}`}>
                    {stat.value}
                    {stat.sub && <span className={`text-sm font-normal ml-1 ${dark ? 'text-white/30' : 'text-black/30'}`}>{stat.sub}</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className={`flex-1 rounded-xl border border-dashed flex items-center justify-center transition-colors duration-500 ${dark ? 'border-white/5' : 'border-black/10'}`}>
            <p className={`text-xs tracking-widest uppercase ${dark ? 'text-white/15' : 'text-black/20'}`}>
              Próximamente más contenido...
            </p>
          </div>
        </div>
      </main>

      {/* ProfilePanel */}
      {showProfile && (
        <ProfilePanel dark={dark} onClose={() => setShowProfile(false)} />
      )}

      {dark && (
        <div className="fixed w-[600px] h-[300px] rounded-full blur-[150px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-950/10 pointer-events-none" />
      )}
    </div>
  );
}