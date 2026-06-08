import { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import ProfilePanel from './ProfilePanel';
import { add, cashregister, customer, membership, products, provider, settings } from '../../assets/icons';

const baseMenuItems = [
  { label: 'Clientes', icon: customer, path: '/clients' },
  { label: 'Membresías', icon: membership, path: '/memberships' },
  { label: 'Cuadre de caja', icon: cashregister, path: '/cash' },
  { label: 'Proveedores', icon: provider, path: '/suppliers' },
  { label: 'Productos', icon: products, path: '/products' },
  { label: 'Registrar Empleado', icon: add, path: '/register' },
  { label: 'Ajustes', icon: settings, path: '/settings' },
];

const adminMenuItems = [
  { label: 'Empleados', icon: add, path: '/employees' },
];

interface NavbarProps {
  onLogout?: () => void;
}

export default function Navbar({ onLogout }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleTheme } = useTheme();
  const dark = darkMode;

  const menuItems = user?.role === 'admin'
    ? [...baseMenuItems, ...adminMenuItems]
    : baseMenuItems;

  const [showProfile, setShowProfile] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const isActiveRoute = (path: string) => {
    if (path === '/products') return location.pathname === '/products' || location.pathname === '/register-product';
    if (path === '/clients') return location.pathname === '/clients' || location.pathname === '/register-client';
    if (path === '/suppliers') return location.pathname === '/suppliers' || location.pathname === '/register-supplier';
    return location.pathname === path;
  };

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await logout();
      navigate('/login');
    }
  };

  const checkScroll = () => {
    const el = navRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = navRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, []);

  const scrollNav = (dir: 'left' | 'right') => {
    navRef.current?.scrollBy({ left: dir === 'left' ? -160 : 160, behavior: 'smooth' });
  };

  return (
    <header
      className={`relative z-30 flex items-center gap-0 border-b transition-colors duration-500 h-20 ${dark ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-black/10'
        }`}
    >
      {/* ── LOGO ── */}
      <div
        className={`flex items-center gap-2.5 px-4 h-full flex-shrink-0 border-r cursor-pointer ${dark ? 'border-white/5' : 'border-black/10'
          }`}
        onClick={() => navigate('/')}
      >
        <img
          src="/brioboxlogoicon.png"
          alt="BrioBox"
          className={`w-[5rem] h-[5rem] object-contain ${dark ? 'drop-shadow-[0_0_8px_rgba(180,0,0,0.5)] ml-[0.75rem]' : ''}`}
        />
        <div>
          <p className={`font-bold text-[20px] tracking-widest uppercase leading-none ${dark ? 'text-white' : 'text-[#111]'}`}>
            BrioBox
          </p>
          <p className={`text-[11px] tracking-widest uppercase leading-none mt-0.5 ${dark ? 'text-white/25' : 'text-black/35'}`}>
            Gym Management
          </p>
        </div>
      </div>

      {/* ── LEFT SCROLL ARROW ── */}
      {canScrollLeft && (
        <button
          onClick={() => scrollNav('left')}
          className={`flex-shrink-0 h-full px-1.5 flex items-center justify-center transition-colors ${dark ? 'text-white/30 hover:text-white/70 hover:bg-white/5' : 'text-black/30 hover:text-black/70 hover:bg-black/5'
            }`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* ── NAV ITEMS ── */}
      <div
        ref={navRef}
        className="flex justify-between items-center h-full overflow-x-auto scrollbar-none flex-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {menuItems.map(item => {
          const active = isActiveRoute(item.path);
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`relative flex items-center gap-2 px-4 h-full flex-shrink-0 text-xs tracking-wide transition-all duration-200 whitespace-nowrap ${active
                  ? dark
                    ? 'text-red-400'
                    : 'text-red-600'
                  : dark
                    ? 'text-white/40 hover:text-white/75 hover:bg-white/4'
                    : 'text-black/45 hover:text-black/75 hover:bg-black/4'
                }`}
            >
              <img
                src={item.icon}
                alt={item.label}
                className={`w-3.5 h-3.5 object-contain flex-shrink-0 transition-all duration-200 ${active ? 'opacity-100' : 'opacity-40'
                  }`}
              />
              <p className="text-[1.1rem] font-medium">{item.label}</p>
              {active && (
                <span
                  className={`absolute bottom-0 left-0 right-0 h-[2px] ${dark ? 'bg-red-500' : 'bg-red-600'
                    }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── RIGHT SCROLL ARROW ── */}
      {canScrollRight && (
        <button
          onClick={() => scrollNav('right')}
          className={`flex-shrink-0 h-full px-1.5 flex items-center justify-center transition-colors ${dark ? 'text-white/30 hover:text-white/70 hover:bg-white/5' : 'text-black/30 hover:text-black/70 hover:bg-black/5'
            }`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* ── RIGHT CONTROLS ── */}
      <div
        className={`flex items-center gap-2 px-4 h-full flex-shrink-0 border-l ${dark ? 'border-white/5' : 'border-black/10'
          }`}
      >
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={`w-12 h-7 rounded-full relative transition-all duration-300 flex-shrink-0 ${dark ? 'bg-red-900/60' : 'bg-black/20'
            }`}
        >
          <div
            className={`absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center text-[7px] ${dark ? 'left-5 bg-red-500' : 'left-0.5 bg-white'
              }`}
          >
            {dark ? '🌙' : '☀️'}
          </div>
        </button>

        {/* Bell */}
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs border transition-colors cursor-pointer flex-shrink-0 ${dark
              ? 'border-white/10 text-white/50 hover:border-red-900/50 hover:text-red-400'
              : 'border-black/10 text-black/50 hover:border-red-300'
            }`}
        >
          🔔
        </div>

        {/* User avatar */}
        <div
          onClick={() => setShowProfile(prev => !prev)}
          className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer flex-shrink-0 ${showProfile
              ? dark
                ? 'border-red-900/40 bg-red-950/10'
                : 'border-red-300 bg-red-50'
              : dark
                ? 'border-white/5 bg-white/5 hover:border-red-900/30'
                : 'border-black/10 bg-black/5'
            }`}
        >
          <img src="/user.png" alt="user" className="w-7 h-7 rounded-full object-cover" />
          <span className={`text-[11px] tracking-wide ${dark ? 'text-white/60' : 'text-black/60'}`}>
            {user?.name ?? 'Admin'}
          </span>
        </div>

        {/* Divider */}
        <div className={`h-5 w-px flex-shrink-0 ${dark ? 'bg-white/8' : 'bg-black/10'}`} />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[1.0rem] tracking-wide transition-all flex-shrink-0 ${dark
              ? 'text-white/30 hover:text-red-400 hover:bg-red-950/20'
              : 'text-black/35 hover:text-red-600 hover:bg-red-50'
            }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>

      {/* ProfilePanel */}
      {showProfile && (
        <ProfilePanel dark={dark} onClose={() => setShowProfile(false)} />
      )}
    </header>
  );
}