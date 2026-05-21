import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { membershipApi, type Membership, type MembershipPlan } from '../api/membership.api';
import { userApi, type Client } from '../api/user.api';

const menuItems = [
  { label: 'Clientes', icon: '👤', path: '/clients' },
  { label: 'Membresías', icon: '🎫', path: '/memberships' },
  { label: 'Cuadre de caja', icon: '💰', path: '/cash' },
  { label: 'Proveedores', icon: '📦', path: '/suppliers' },
  { label: 'Productos', icon: '🛍️', path: '/products' },
  { label: 'Registrar Empleado', icon: '➕', path: '/register' },
  { label: 'Ajustes', icon: '⚙️', path: '/settings' },
];

const STATUS_STYLES = {
  activa: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30',
    label: 'Activa',
  },
  cancelada: {
    dot: 'bg-red-500',
    badge: 'bg-red-950/40 text-red-400 border border-red-900/30',
    label: 'Cancelada',
  },
  pendiente: {
    dot: 'bg-yellow-500',
    badge: 'bg-yellow-950/40 text-yellow-400 border border-yellow-900/30',
    label: 'Pendiente',
  },
};

export default function MembershipsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(true);
  const [active, setActive] = useState('Membresías');
  const [loggingOut, setLoggingOut] = useState(false);

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todas' | 'activa' | 'pendiente' | 'cancelada'>('todas');

  const [showModal, setShowModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [form, setForm] = useState({ customerId: '', planId: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    setLoading(true);
    try {
      const res = await membershipApi.getAll();
      setMemberships(res.memberships);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await userApi.getAllClients(1, 100);
      setClients(res.users);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await membershipApi.getActivePlans();
      setPlans(res.plans);
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = () => {
    setForm({ customerId: '', planId: '' });
    setFormError('');
    setFormSuccess(false);
    fetchClients();
    fetchPlans();
    setShowModal(true);
  };

  const handleCreate = async () => {
    if (!form.customerId || !form.planId) {
      setFormError('Todos los campos son obligatorios.');
      return;
    }
    setFormLoading(true);
    try {
      await membershipApi.create({ customerId: form.customerId, planId: form.planId });
      setFormSuccess(true);
      fetchMemberships();
      setTimeout(() => setShowModal(false), 1800);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al crear membresía.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    await new Promise(r => setTimeout(r, 2000));
    navigate('/login');
  };

  const filtered = memberships.filter(m => filter === 'todas' ? true : m.status === filter);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

  const daysLeft = (end: string) => Math.ceil((new Date(end).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

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
              <button key={item.label} onClick={() => { setActive(item.label); navigate(item.path); }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs tracking-wide transition-all text-left ${
                  active === item.label
                    ? dark ? 'bg-red-900/30 text-red-400 border border-red-900/30' : 'bg-red-100 text-red-700 border border-red-200'
                    : dark ? 'text-white/40 hover:text-white/70 hover:bg-white/5' : 'text-black/50 hover:text-black/80 hover:bg-black/5'
                }`}>
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <button onClick={handleLogout} disabled={loggingOut}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs tracking-wide transition-all ${dark ? 'text-white/30 hover:text-red-500 hover:bg-red-950/20' : 'text-black/40 hover:text-red-600 hover:bg-red-50'}`}>
          <span>🚪</span> Logout
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col">

        {/* Topbar */}
        <header className={`flex items-center justify-between px-8 py-4 border-b transition-colors duration-500 ${dark ? 'border-white/5' : 'border-black/10'}`}>
          <div>
            <p className={`text-[10px] tracking-widest uppercase mb-0.5 ${dark ? 'text-white/30' : 'text-black/40'}`}>Gestión</p>
            <h1 className={`text-2xl font-bold tracking-wide ${dark ? 'text-white' : 'text-[#111]'}`}>Membresías</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setDark(!dark)}
              className={`w-12 h-6 rounded-full relative transition-all duration-300 ${dark ? 'bg-red-900/60' : 'bg-black/20'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 flex items-center justify-center text-[8px] ${dark ? 'left-7 bg-red-500' : 'left-1 bg-white'}`}>
                {dark ? '🌙' : '☀️'}
              </div>
            </button>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border transition-colors cursor-pointer ${dark ? 'border-white/10 text-white/50 hover:border-red-900/50 hover:text-red-400' : 'border-black/10 text-black/50'}`}>🔔</div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${dark ? 'border-white/5 bg-white/5 hover:border-red-900/30' : 'border-black/10 bg-black/5'}`}>
              <img src="/user.png" alt="user" className="w-6 h-6 rounded-full object-cover" />
              <span className={`text-xs tracking-wide ${dark ? 'text-white/60' : 'text-black/60'}`}>{user?.name ?? 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <div className="flex-1 p-8 flex flex-col gap-6">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total', value: memberships.length, icon: '🎫', color: dark ? 'text-white' : 'text-black' },
              { label: 'Activas', value: memberships.filter(m => m.status === 'activa').length, icon: '✅', color: 'text-emerald-400' },
              { label: 'Pendientes', value: memberships.filter(m => m.status === 'pendiente').length, icon: '⏳', color: 'text-yellow-400' },
            ].map((s, i) => (
              <div key={i} className={`rounded-xl p-4 border flex items-center gap-4 transition-all ${dark ? 'bg-[#141414] border-white/5' : 'bg-white border-black/10'}`}>
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/30' : 'text-black/40'}`}>{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filtros + botón */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {(['todas', 'activa', 'pendiente', 'cancelada'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-[10px] px-3 py-1.5 rounded-lg border tracking-widest uppercase transition-all ${
                    filter === f
                      ? dark ? 'bg-red-900/30 text-red-400 border-red-900/40' : 'bg-red-100 text-red-700 border-red-200'
                      : dark ? 'border-white/5 text-white/30 hover:text-white/60 hover:border-white/10' : 'border-black/10 text-black/40 hover:text-black/70'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
            <button onClick={openModal}
              className="bg-[#cc0000] hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg tracking-widest uppercase transition-colors shadow-lg shadow-red-950/30">
              + Nueva Membresía
            </button>
          </div>

          {/* Tabla */}
          <div className={`rounded-xl border overflow-hidden ${dark ? 'border-white/5' : 'border-black/10'}`}>
            <div className={`grid grid-cols-5 px-5 py-3 text-[10px] uppercase tracking-widest border-b ${dark ? 'bg-[#111] border-white/5 text-white/30' : 'bg-gray-50 border-black/10 text-black/40'}`}>
              <span>Cliente ID</span>
              <span>Plan ID</span>
              <span>Inicio</span>
              <span>Vencimiento</span>
              <span className="text-right">Estado</span>
            </div>

            {loading ? (
              <div className={`px-5 py-10 text-center text-xs tracking-widest uppercase animate-pulse ${dark ? 'text-white/20' : 'text-black/20'}`}>
                Cargando membresías...
              </div>
            ) : filtered.length === 0 ? (
              <div className={`px-5 py-10 text-center text-xs tracking-widest uppercase ${dark ? 'text-white/15' : 'text-black/20'}`}>
                No hay membresías {filter !== 'todas' ? `con estado "${filter}"` : ''}
              </div>
            ) : (
              filtered.map((m, i) => {
                const days = daysLeft(m.end_date);
                const style = STATUS_STYLES[m.status] ?? STATUS_STYLES.pendiente;
                return (
                  <div key={m.id}
                    className={`grid grid-cols-5 px-5 py-3.5 items-center border-b transition-colors ${
                      dark
                        ? `border-white/5 ${i % 2 === 0 ? 'bg-[#0f0f0f]' : 'bg-[#111]'} hover:bg-white/[0.02]`
                        : `border-black/5 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`
                    }`}>
                 <span className={`text-xs font-mono truncate ${dark ? 'text-white/50' : 'text-black/50'}`}>{String(m.customer_id).slice(0, 8)}...</span>
                 <span className={`text-xs font-mono truncate ${dark ? 'text-white/50' : 'text-black/50'}`}>{String(m.plan_id).slice(0, 8)}...</span>
                    <span className={`text-xs ${dark ? 'text-white/40' : 'text-black/40'}`}>{formatDate(m.start_date)}</span>
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-xs ${dark ? 'text-white/40' : 'text-black/40'}`}>{formatDate(m.end_date)}</span>
                      {m.status === 'activa' && (
                        <span className={`text-[10px] ${days <= 7 ? 'text-red-400' : days <= 15 ? 'text-yellow-400' : 'text-white/20'}`}>
                          {days > 0 ? `${days}d restantes` : 'Vencida'}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1.5 tracking-wide ${style.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {style.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Modal nueva membresía */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => !formLoading && setShowModal(false)} />
          <div className={`relative z-10 rounded-2xl p-6 w-full max-w-sm border shadow-2xl flex flex-col gap-5 ${dark ? 'bg-[#141414] border-white/5' : 'bg-white border-black/10'}`}>

            {formSuccess ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-14 h-14 rounded-full border border-emerald-900/40 flex items-center justify-center drop-shadow-[0_0_15px_rgba(0,180,80,0.2)]">
                  <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className={`font-bold tracking-wide ${dark ? 'text-white' : 'text-black'}`}>¡Membresía creada!</p>
                <p className={`text-xs tracking-wider ${dark ? 'text-white/30' : 'text-black/40'}`}>La membresía fue asignada correctamente.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`font-bold tracking-wide ${dark ? 'text-white' : 'text-black'}`}>Nueva Membresía</h2>
                    <p className={`text-[10px] tracking-widest uppercase mt-0.5 ${dark ? 'text-white/30' : 'text-black/40'}`}>Asignar plan a cliente</p>
                  </div>
                  <button onClick={() => setShowModal(false)}
                    className={`text-xs w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${dark ? 'text-white/30 hover:text-white/60 hover:bg-white/5' : 'text-black/30 hover:text-black/60 hover:bg-black/5'}`}>✕</button>
                </div>

                <div className={`w-full h-px ${dark ? 'bg-white/5' : 'bg-black/10'}`} />

                {/* Cliente */}
                <div className="flex flex-col gap-1.5">
                  <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/40'}`}>Cliente</label>
                  <select
                    value={form.customerId}
                    onChange={e => { setForm(prev => ({ ...prev, customerId: e.target.value })); setFormError(''); }}
                    className={`rounded-lg px-4 py-2.5 text-sm outline-none border transition-colors ${dark ? 'bg-[#0f0f0f] border-white/5 text-white focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black focus:border-red-300'}`}
                  >
                    <option value="">Selecciona un cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.paternal_last_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Plan */}
                <div className="flex flex-col gap-1.5">
                  <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/40'}`}>Plan</label>
                  <select
                    value={form.planId}
                    onChange={e => { setForm(prev => ({ ...prev, planId: e.target.value })); setFormError(''); }}
                    className={`rounded-lg px-4 py-2.5 text-sm outline-none border transition-colors ${dark ? 'bg-[#0f0f0f] border-white/5 text-white focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black focus:border-red-300'}`}
                  >
                    <option value="">Selecciona un plan...</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.duration_days} días — ${p.price.toLocaleString('es-CO')}
                      </option>
                    ))}
                  </select>
                  {plans.length === 0 && (
                    <p className={`text-[10px] ${dark ? 'text-white/20' : 'text-black/30'}`}>No hay planes activos disponibles.</p>
                  )}
                </div>

                {formError && (
                  <p className="text-red-500 text-xs text-center bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">{formError}</p>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setShowModal(false)}
                    className={`flex-1 py-2.5 rounded-lg text-xs border tracking-wide transition-colors ${dark ? 'border-white/5 text-white/40 hover:bg-white/5' : 'border-black/10 text-black/40 hover:bg-gray-50'}`}>
                    Cancelar
                  </button>
                  <button onClick={handleCreate} disabled={formLoading}
                    className="flex-1 py-2.5 rounded-lg text-xs bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold tracking-widest uppercase transition-colors shadow-lg shadow-red-950/30">
                    {formLoading ? 'Creando...' : 'Crear →'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {dark && <div className="fixed w-[600px] h-[300px] rounded-full blur-[150px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-950/10 pointer-events-none" />}
    </div>
  );
}