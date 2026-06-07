import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/ui/Navbar';

const stats = [
  { label: 'Total Users', value: '20', change: 'more admins', positive: true, icon: '👥' },
  { label: 'Active Memberships', value: '184', sub: '/ 1,248', change: '+5%', positive: true, icon: '🎫' },
  { label: 'Daily Revenue', value: 'COP $200,000', change: '▲ Trending', positive: true, icon: '💵' },
];

export default function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);
  const dark = darkMode;

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    await new Promise(resolve => setTimeout(resolve, 2000));
    navigate('/login');
  };

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
    <div className={`flex flex-col min-h-screen transition-colors duration-500 ${dark ? 'bg-[#0a0a0a] text-white' : 'bg-[#f0f0f0] text-[#111]'}`}>
      <Navbar onLogout={handleLogout} />

      {/* Page header */}
      <div className="px-8 lg:px-12 pt-8 lg:pt-10 pb-4 lg:pb-6">
        <p className={`text-[10px] lg:text-xs tracking-widest uppercase mb-1.5 ${dark ? 'text-white/30' : 'text-black/40'}`}>Overview</p>
        <h1 className={`text-2xl lg:text-4xl font-bold tracking-wide ${dark ? 'text-white' : 'text-[#111]'}`}>Dashboard</h1>
      </div>

      {/* Contenido */}
      <div className="flex-1 px-8 lg:px-12 pb-8 lg:pb-12 flex flex-col gap-8 lg:gap-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`rounded-xl p-6 lg:p-8 border flex flex-col gap-4 transition-all duration-500 hover:scale-[1.02] ${
                dark ? 'bg-[#141414] border-white/5 hover:border-red-900/30' : 'bg-white border-black/10 hover:border-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl lg:text-3xl">{stat.icon}</span>
                <span className={`text-[10px] lg:text-xs px-2.5 py-0.5 rounded-full font-medium tracking-wide ${
                  stat.positive
                    ? dark ? 'bg-red-950/40 text-red-400' : 'bg-red-100 text-red-600'
                    : dark ? 'bg-white/5 text-white/30' : 'bg-black/5 text-black/40'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div>
                <p className={`text-[10px] lg:text-xs uppercase tracking-widest mb-1.5 ${dark ? 'text-white/30' : 'text-black/40'}`}>{stat.label}</p>
                <p className={`text-2xl lg:text-4xl font-bold tracking-tight ${dark ? 'text-white' : 'text-[#111]'}`}>
                  {stat.value}
                  {stat.sub && <span className={`text-sm lg:text-lg font-normal ml-1.5 ${dark ? 'text-white/30' : 'text-black/30'}`}>{stat.sub}</span>}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className={`flex-1 min-h-[200px] lg:min-h-[300px] rounded-xl border border-dashed flex items-center justify-center transition-colors duration-500 ${dark ? 'border-white/5' : 'border-black/10'}`}>
          <p className={`text-xs lg:text-sm tracking-widest uppercase ${dark ? 'text-white/15' : 'text-black/20'}`}>
            Próximamente más contenido...
          </p>
        </div>
      </div>

      {dark && (
        <div className="fixed w-[600px] h-[300px] rounded-full blur-[150px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-950/10 pointer-events-none" />
      )}
    </div>
  );
}