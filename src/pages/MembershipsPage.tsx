import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import {
  membershipApi,
  type Membership,
  type MembershipPlan,
  type MembershipFreeze,
  type CreateFreezePayload,
  type UpdateFreezePayload,
} from '../api/membership.api';
import { userApi, type Client } from '../api/user.api';
import Navbar from '../components/ui/Navbar';
import { active, pending, activemembership } from '../assets/icons/';

const STATUS_STYLES = {
  activa: { dot: 'bg-emerald-500', badge: 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30', label: 'Activa' },
  cancelada: { dot: 'bg-red-500', badge: 'bg-red-950/40 text-red-400 border border-red-900/30', label: 'Cancelada' },
  pendiente: { dot: 'bg-yellow-500', badge: 'bg-yellow-950/40 text-yellow-400 border border-yellow-900/30', label: 'Pendiente' },
};

type Tab = 'membresias' | 'planes' | 'morosos';

export default function MembershipsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const dark = darkMode;
  const [loggingOut, setLoggingOut] = useState(false);
  const [tab, setTab] = useState<Tab>('membresias');

  // — Membresías —
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loadingM, setLoadingM] = useState(true);
  const [filter, setFilter] = useState<'todas' | 'activa' | 'pendiente' | 'cancelada'>('todas');
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  // Modal nueva membresía
  const [showNewM, setShowNewM] = useState(false);
  const [newMForm, setNewMForm] = useState({ customerId: '', planId: '' });
  const [newMError, setNewMError] = useState('');
  const [newMLoading, setNewMLoading] = useState(false);
  const [newMSuccess, setNewMSuccess] = useState(false);

  // Modal detalle membresía (freeze + cancel)
  const [selectedM, setSelectedM] = useState<Membership | null>(null);
  const [freezes, setFreezes] = useState<MembershipFreeze[]>([]);
  const [freezeMap, setFreezeMap] = useState<Record<string, MembershipFreeze[]>>({});
  const [loadingFreezes, setLoadingFreezes] = useState(false);
  const [freezeForm, setFreezeForm] = useState({ start_date: '', end_date: '', is_indefinite: false });
  const [freezeError, setFreezeError] = useState('');
  const [freezeLoading, setFreezeLoading] = useState(false);

  const [editingFreeze, setEditingFreeze] = useState<MembershipFreeze | null>(null);
  const [editFreezeForm, setEditFreezeForm] = useState({
    start_date: '',
    end_date: '',
    is_indefinite: false,
  });
  const [editFreezeLoading, setEditFreezeLoading] = useState(false);

  // — Planes —
  const [activePlans, setActivePlans] = useState<MembershipPlan[]>([]);
  const [disabledPlans, setDisabledPlans] = useState<MembershipPlan[]>([]);
  const [loadingP, setLoadingP] = useState(true);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', price: '', duration_days: '' });
  const [planError, setPlanError] = useState('');
  const [planLoading, setPlanLoading] = useState(false);
  const [planSuccess, setPlanSuccess] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [editPlanForm, setEditPlanForm] = useState({ name: '', price: '', duration_days: '' });
  const [editPlanError, setEditPlanError] = useState('');
  const [editPlanLoading, setEditPlanLoading] = useState(false);

  useEffect(() => { fetchMemberships(); fetchClients(); fetchAllPlans(); }, []);

  const fetchMemberships = async () => {
    setLoadingM(true);
    try {
      const r = await membershipApi.getAll();
      setMemberships(r.memberships);

      await Promise.all(
        (r.memberships ?? []).map(m => fetchMembershipFreezes(String(m.id)))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingM(false);
    }
  };

  const fetchMembershipFreezes = async (membershipId: string) => {
    try {
      const r = await membershipApi.getFreezes(String(membershipId));

      setFreezeMap(prev => ({
        ...prev,
        [String(membershipId)]: r.freezes ?? [],
      }));
    } catch (e) {
      console.error(e);

      setFreezeMap(prev => ({
        ...prev,
        [String(membershipId)]: [],
      }));
    }
  };

  const fetchClients = async () => {
    try { const r = await userApi.getAllClients(1, 100); setClients(r.users); } catch (e) { console.error(e); }
  };

  const fetchAllPlans = async () => {
    setLoadingP(true);
    try {
      const [a, d] = await Promise.all([membershipApi.getActivePlans(), membershipApi.getDisabledPlans()]);
      setActivePlans(a.plans);
      setDisabledPlans(d.plans);
      setPlans(a.plans);
    } catch (e) { console.error(e); } finally { setLoadingP(false); }
  };

  const openNewM = () => {
    setNewMForm({ customerId: '', planId: '' });
    setNewMError(''); setNewMSuccess(false);
    setShowNewM(true);
  };

  const handleCreateM = async () => {
    if (!newMForm.customerId || !newMForm.planId) { setNewMError('Todos los campos son obligatorios.'); return; }
    setNewMLoading(true);
    try {
      await membershipApi.create({ customerId: newMForm.customerId, planId: newMForm.planId });
      setNewMSuccess(true); fetchMemberships();
      setTimeout(() => setShowNewM(false), 1800);
    } catch (e: unknown) { setNewMError(e instanceof Error ? e.message : 'Error al crear.'); }
    finally { setNewMLoading(false); }
  };

  const openDetail = async (m: Membership) => {
    setSelectedM(m);
    setFreezeError('');
    setFreezeForm({ start_date: '', end_date: '', is_indefinite: false });
    setLoadingFreezes(true);

    try {
      const r = await membershipApi.getFreezes(String(m.id));
      setFreezes(r.freezes);

      setFreezeMap(prev => ({
        ...prev,
        [String(m.id)]: r.freezes ?? [],
      }));
    } catch (e) {
      console.error(e);
      setFreezes([]);
    } finally {
      setLoadingFreezes(false);
    }
  };

  const handleCancelM = async () => {
    if (!selectedM) return;
    try {
      await membershipApi.cancel(String(selectedM.id));
      fetchMemberships();
      setSelectedM(prev => prev ? { ...prev, status: 'cancelada' } : null);
    } catch (e: unknown) { setFreezeError(e instanceof Error ? e.message : 'Error al cancelar.'); }
  };

  const handleCreateFreeze = async () => {
    if (!selectedM) return;

    if (!freezeForm.start_date) {
      setFreezeError('La fecha de inicio es obligatoria.');
      return;
    }

    if (!freezeForm.is_indefinite && !freezeForm.end_date) {
      setFreezeError('La fecha de fin es obligatoria.');
      return;
    }

    if (
      !freezeForm.is_indefinite &&
      freezeForm.end_date &&
      freezeForm.end_date <= freezeForm.start_date
    ) {
      setFreezeError('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    if (latestFreezeBlocksNew) {
      setFreezeError('Debes descongelar o esperar a que finalice el último congelamiento antes de crear uno nuevo.');
      return;
    }

    setFreezeLoading(true);

    try {
      const payload: CreateFreezePayload = {
        start_date: freezeForm.start_date,
        is_indefinite: freezeForm.is_indefinite,
        ...(!freezeForm.is_indefinite ? { end_date: freezeForm.end_date } : {}),
      };

      await membershipApi.createFreeze(String(selectedM.id), payload);

      const r = await membershipApi.getFreezes(String(selectedM.id));
      setFreezes(r.freezes);

      setFreezeMap(prev => ({
        ...prev,
        [String(selectedM.id)]: r.freezes ?? [],
      }));

      setFreezeForm({ start_date: '', end_date: '', is_indefinite: false });
      setFreezeError('');
    } catch (e: unknown) {
      setFreezeError(e instanceof Error ? e.message : 'Error al congelar.');
    } finally {
      setFreezeLoading(false);
    }
  };

  const handleCancelFreeze = async (freezeId: string) => {
    try {
      await membershipApi.cancelFreeze(freezeId);

      if (selectedM) {
        const r = await membershipApi.getFreezes(String(selectedM.id));
        setFreezes(r.freezes);

        setFreezeMap(prev => ({
          ...prev,
          [String(selectedM.id)]: r.freezes ?? [],
        }));
      }
    } catch (e: unknown) {
      setFreezeError(e instanceof Error ? e.message : 'Error.');
    }
  };

  const handleUpdateFreeze = async () => {
    if (!editingFreeze) return;

    if (!editFreezeForm.start_date) {
      setFreezeError('La fecha de inicio es obligatoria.');
      return;
    }

    if (!editFreezeForm.is_indefinite && !editFreezeForm.end_date) {
      setFreezeError('La fecha de fin es obligatoria.');
      return;
    }

    if (
      !editFreezeForm.is_indefinite &&
      editFreezeForm.end_date &&
      editFreezeForm.end_date <= editFreezeForm.start_date
    ) {
      setFreezeError('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    const payload: UpdateFreezePayload = {};

    if (toDateOnly(editingFreeze.start_date) !== editFreezeForm.start_date) {
      payload.start_date = editFreezeForm.start_date;
    }

    if (editingFreeze.is_indefinite !== editFreezeForm.is_indefinite) {
      payload.is_indefinite = editFreezeForm.is_indefinite;
    }

    if (!editFreezeForm.is_indefinite) {
      if (toDateOnly(editingFreeze.end_date) !== editFreezeForm.end_date) {
        payload.end_date = editFreezeForm.end_date;
      }
    }

    if (Object.keys(payload).length === 0) {
      setFreezeError('No hay cambios para guardar.');
      return;
    }

    try {
      setEditFreezeLoading(true);
      setFreezeError('');

      await membershipApi.updateFreeze(String(editingFreeze.id), payload);

      if (selectedM) {
        const r = await membershipApi.getFreezes(String(selectedM.id));
        setFreezes(r.freezes);
        setFreezeMap(prev => ({
          ...prev,
          [String(selectedM.id)]: r.freezes,
        }));
      }

      setEditingFreeze(null);
      setEditFreezeForm({
        start_date: '',
        end_date: '',
        is_indefinite: false,
      });
    } catch (e: unknown) {
      setFreezeError(e instanceof Error ? e.message : 'Error al actualizar el congelamiento.');
    } finally {
      setEditFreezeLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!planForm.name || !planForm.price || !planForm.duration_days) { setPlanError('Todos los campos son obligatorios.'); return; }
    setPlanLoading(true);
    try {
      await membershipApi.createPlan({ name: planForm.name, price: Number(planForm.price), duration_days: Number(planForm.duration_days) });
      setPlanSuccess(true); fetchAllPlans();
      setTimeout(() => { setShowNewPlan(false); setPlanSuccess(false); }, 1800);
    } catch (e: unknown) { setPlanError(e instanceof Error ? e.message : 'Error al crear plan.'); }
    finally { setPlanLoading(false); }
  };

  const openEditPlan = (p: MembershipPlan) => {
    setEditingPlan(p);
    setEditPlanForm({ name: p.name, price: String(p.price), duration_days: String(p.duration_days) });
    setEditPlanError('');
  };

  const handleEditPlan = async () => {
    if (!editingPlan) return;
    setEditPlanLoading(true);
    try {
      await membershipApi.updatePlan(String(editingPlan.id), {
        name: editPlanForm.name,
        price: Number(editPlanForm.price),
        duration_days: Number(editPlanForm.duration_days),
      });
      setEditingPlan(null); fetchAllPlans();
    } catch (e: unknown) { setEditPlanError(e instanceof Error ? e.message : 'Error al actualizar.'); }
    finally { setEditPlanLoading(false); }
  };

  const handleLogout = async () => {
    setLoggingOut(true); await logout();
    await new Promise(r => setTimeout(r, 2000)); navigate('/login');
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  const daysLeft = (end: string) => Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  const toDateOnly = (value: string) => new Date(value).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const getFreezeDisplayStatus = (freeze: MembershipFreeze) => {
    const start = toDateOnly(freeze.start_date);
    const end = toDateOnly(freeze.end_date);

    if (freeze.is_active) {
      if (freeze.is_indefinite && today >= start) {
        return {
          label: 'Congelada indefinida',
          className: 'text-red-400',
        };
      }

      if (today < start) {
        return {
          label: 'Próxima a congelarse',
          className: 'text-yellow-400',
        };
      }

      if (today >= start && today <= end) {
        return {
          label: 'Congelada',
          className: 'text-red-400',
        };
      }
    }

    if (today < start) {
      return {
        label: 'Programado',
        className: 'text-yellow-400',
      };
    }

    return {
      label: 'Descongelada',
      className: dark ? 'text-white/30' : 'text-black/30',
    };
  };

  const sortedFreezes = [...freezes].sort(
    (a, b) =>
      new Date(b.created_at ?? b.start_date).getTime() -
      new Date(a.created_at ?? a.start_date).getTime()
  );

  const latestFreezeId = sortedFreezes[0]?.id ? String(sortedFreezes[0].id) : null;

  const isLatestFreeze = (freeze: MembershipFreeze) =>
    String(freeze.id) === latestFreezeId;

  const canUnfreezeLatest = (freeze: MembershipFreeze) => {
    if (!isLatestFreeze(freeze)) return false;
    return freeze.is_active;
  };

  const canEditLatestFreeze = (freeze: MembershipFreeze) => {
    if (!isLatestFreeze(freeze)) return false;
    return freeze.is_active;
  };

  const latestFreeze = sortedFreezes[0] ?? null;

  const latestFreezeStatus = latestFreeze
    ? getFreezeDisplayStatus(latestFreeze)
    : null;

  const latestFreezeBlocksNew =
    !!latestFreeze &&
    latestFreeze.is_active &&
    latestFreezeStatus !== null &&
    (latestFreezeStatus.label === 'Congelada' ||
      latestFreezeStatus.label === 'Congelada indefinida' ||
      latestFreezeStatus.label === 'Próxima a congelarse' ||
      latestFreezeStatus.label === 'Programado');

  const getMembershipFreezeSummary = (membershipId: string) => {
    const membershipFreezes = freezeMap[String(membershipId)] ?? [];

    if (!membershipFreezes.length) {
      return {
        label: 'Sin congelamiento',
        badge: dark
          ? 'bg-white/5 text-white/40 border border-white/10'
          : 'bg-black/5 text-black/40 border border-black/10',
      };
    }

    const sorted = [...membershipFreezes].sort(
      (a, b) =>
        new Date(b.created_at ?? b.start_date).getTime() -
        new Date(a.created_at ?? a.start_date).getTime()
    );

    const activeOrUpcoming = sorted.find(f => {
      const start = toDateOnly(f.start_date);
      const end = toDateOnly(f.end_date);

      return (
        f.is_active &&
        ((f.is_indefinite && today >= start) ||
          (today >= start && today <= end) ||
          today < start)
      );
    });

    if (!activeOrUpcoming) {
      return {
        label: 'Descongelada',
        badge: 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30',
      };
    }

    const start = toDateOnly(activeOrUpcoming.start_date);
    const end = toDateOnly(activeOrUpcoming.end_date);

    if (activeOrUpcoming.is_indefinite && today >= start) {
      return {
        label: 'Congelada indefinida',
        badge: 'bg-red-950/20 text-red-300 border border-red-900/30',
      };
    }

    if (today < start) {
      return {
        label: 'Próxima a congelarse',
        badge: 'bg-yellow-950/20 text-yellow-300 border border-yellow-700/30',
      };
    }

    if (today >= start && today <= end) {
      return {
        label: 'Congelada',
        badge: 'bg-red-950/20 text-red-300 border border-red-900/30',
      };
    }

    return {
      label: 'Descongelada',
      badge: 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30',
    };
  };
  
  const filtered = memberships.filter(m => filter === 'todas' ? true : m.status === filter);
  const morosos = memberships.filter(m => m.status === 'activa' && daysLeft(m.end_date) <= 0);
  const clientMap = Object.fromEntries(clients.map(c => [String(c.id), `${c.first_name} ${c.paternal_last_name}`]));
  const planMap = Object.fromEntries([...activePlans, ...disabledPlans].map(p => [String(p.id), p.name]));

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
      <div className="px-8 pt-8 pb-4">
        <p className={`text-[10px] tracking-widest uppercase mb-0.5 ${dark ? 'text-white/30' : 'text-black/40'}`}>Gestión</p>
        <h1 className={`text-2xl font-bold tracking-wide ${dark ? 'text-white' : 'text-[#111]'}`}>Membresías</h1>
      </div>

      {/* MAIN */}
      <main className="flex-1 flex flex-col">

        {/* Tabs */}
        <div className={`flex items-center gap-1 px-8 pt-4 border-b ${dark ? 'border-white/5' : 'border-black/10'}`}>
          {([
            { key: 'membresias', label: 'Membresías' },
            { key: 'planes', label: 'Planes' },
            { key: 'morosos', label: `Morosos ${morosos.length > 0 ? `(${morosos.length})` : ''}` },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-xs tracking-widest uppercase border-b-2 transition-all -mb-px ${tab === t.key
                  ? dark ? 'border-red-500 text-red-400' : 'border-red-600 text-red-600'
                  : dark ? 'border-transparent text-white/30 hover:text-white/60' : 'border-transparent text-black/40 hover:text-black/70'
                }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="flex-1 p-8 flex flex-col gap-6 overflow-auto">

          {/* ── TAB MEMBRESÍAS ── */}
          {tab === 'membresias' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total', value: memberships.length, icon: activemembership, color: dark ? 'text-white' : 'text-black' },
                  { label: 'Activas', value: memberships.filter(m => m.status === 'activa').length, icon: active, color: 'text-emerald-400' },
                  { label: 'Pendientes', value: memberships.filter(m => m.status === 'pendiente').length, icon: pending, color: 'text-yellow-400' },
                ].map((s, i) => (
                  <div key={i} className={`rounded-xl p-4 border flex items-center gap-4 ${dark ? 'bg-[#141414] border-white/5' : 'bg-white border-black/10'}`}>
                    <img src={s.icon} className="w-10 h-10 animate-pulse" />
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
                      className={`text-[10px] px-3 py-1.5 rounded-lg border tracking-widest uppercase transition-all ${filter === f
                          ? dark ? 'bg-red-900/30 text-red-400 border-red-900/40' : 'bg-red-100 text-red-700 border-red-200'
                          : dark ? 'border-white/5 text-white/30 hover:text-white/60' : 'border-black/10 text-black/40 hover:text-black/70'
                        }`}>{f}</button>
                  ))}
                </div>
                <button onClick={openNewM} className="bg-[#cc0000] hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg tracking-widest uppercase transition-colors shadow-lg shadow-red-950/30">
                  + Nueva Membresía
                </button>
              </div>

              {/* Tabla */}
              <div className={`rounded-xl border overflow-hidden ${dark ? 'border-white/5' : 'border-black/10'}`}>
                <div
                  className={`grid grid-cols-7 px-5 py-3 text-[10px] uppercase tracking-widest border-b ${
                    dark ? 'bg-[#111] border-white/5 text-white/30' : 'bg-gray-50 border-black/10 text-black/40'
                  }`}
                >
                  <span className="col-span-2">Cliente</span>
                  <span>Plan</span>
                  <span>Inicio</span>
                  <span>Vencimiento</span>
                  <span>Congelamiento</span>
                  <span className="text-right">Estado / Acción</span>
                </div>

                {loadingM ? (
                  <div className={`px-5 py-10 text-center text-xs tracking-widest uppercase animate-pulse ${dark ? 'text-white/20' : 'text-black/20'}`}>
                    Cargando...
                  </div>
                ) : filtered.length === 0 ? (
                  <div className={`px-5 py-10 text-center text-xs tracking-widest uppercase ${dark ? 'text-white/15' : 'text-black/20'}`}>
                    Sin membresías
                  </div>
                ) : (
                  filtered.map((m, i) => {
                    const days = daysLeft(m.end_date);
                    const style = STATUS_STYLES[m.status] ?? STATUS_STYLES.pendiente;
                    const freezeSummary = getMembershipFreezeSummary(String(m.id));

                    return (
                      <div
                        key={m.id}
                        className={`grid grid-cols-7 px-5 py-3.5 items-center border-b transition-colors ${
                          dark
                            ? i % 2 === 0
                              ? 'bg-[#0f0f0f] border-white/5'
                              : 'bg-[#111] hover:bg-white/[0.02] border-white/5'
                            : i % 2 === 0
                            ? 'bg-white border-black/5'
                            : 'bg-gray-50 hover:bg-gray-100 border-black/5'
                        }`}
                      >
                        <span className={`col-span-2 text-xs truncate ${dark ? 'text-white/70' : 'text-black/70'}`}>
                          {clientMap[String(m.customer_id)] ?? String(m.customer_id)}
                        </span>

                        <span className={`text-xs truncate ${dark ? 'text-white/50' : 'text-black/50'}`}>
                          {planMap[String(m.plan_id)] ?? String(m.plan_id)}
                        </span>

                        <span className={`text-xs ${dark ? 'text-white/40' : 'text-black/40'}`}>
                          {formatDate(m.start_date)}
                        </span>

                        <div className="flex flex-col gap-0.5">
                          <span className={`text-xs ${dark ? 'text-white/40' : 'text-black/40'}`}>
                            {formatDate(m.end_date)}
                          </span>

                          {m.status === 'activa' && (
                            <span
                              className={`text-[10px] ${
                                days <= 0
                                  ? 'text-red-400'
                                  : days <= 7
                                  ? 'text-red-400'
                                  : days <= 15
                                  ? 'text-yellow-400'
                                  : dark
                                  ? 'text-white/20'
                                  : 'text-black/30'
                              }`}
                            >
                              {days > 0 ? `${days}d restantes` : 'Vencida'}
                            </span>
                          )}
                        </div>

                        <span className={`text-[10px] px-2 py-0.5 rounded-full w-fit ${freezeSummary.badge}`}>
                          {freezeSummary.label}
                        </span>

                        <div className="flex items-center justify-end gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${style.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {style.label}
                          </span>

                          <button
                            onClick={() => openDetail(m)}
                            className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${
                              dark
                                ? 'border-white/10 text-white/40 hover:border-red-900/50 hover:text-red-400 hover:bg-red-950/10'
                                : 'border-black/10 text-black/40 hover:border-red-300 hover:text-red-600'
                            }`}
                          >
                            Gestionar
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* ── TAB PLANES ── */}
          {tab === 'planes' && (
            <>
              <div className="flex items-center justify-between">
                <p className={`text-xs tracking-widest uppercase ${dark ? 'text-white/30' : 'text-black/40'}`}>
                  {activePlans.length} activos · {disabledPlans.length} desactivados
                </p>
                <button onClick={() => { setShowNewPlan(true); setPlanForm({ name: '', price: '', duration_days: '' }); setPlanError(''); setPlanSuccess(false); }}
                  className="bg-[#cc0000] hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg tracking-widest uppercase transition-colors shadow-lg shadow-red-950/30">
                  + Nuevo Plan
                </button>
              </div>

              {loadingP ? (
                <div className={`py-10 text-center text-xs tracking-widest uppercase animate-pulse ${dark ? 'text-white/20' : 'text-black/20'}`}>Cargando planes...</div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {[...activePlans, ...disabledPlans].map(p => (
                    <div key={p.id} className={`rounded-xl p-5 border flex flex-col gap-3 transition-all ${dark ? 'bg-[#141414] border-white/5' : 'bg-white border-black/10'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`font-semibold text-sm ${dark ? 'text-white' : 'text-black'}`}>{p.name}</p>
                          <p className={`text-[10px] uppercase tracking-widest mt-0.5 ${p.is_active ? 'text-emerald-400' : dark ? 'text-white/30' : 'text-black/30'}`}>
                            {p.is_active ? 'Activo' : 'Desactivado'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openEditPlan(p)}
                            className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors ${dark ? 'border-white/10 text-white/40 hover:border-red-900/40 hover:text-red-400 hover:bg-red-950/10' : 'border-black/10 text-black/40 hover:border-red-300 hover:text-red-600'}`}>
                            Editar
                          </button>
                          <button
                            onClick={() => p.is_active ? membershipApi.deactivatePlan(String(p.id)).then(fetchAllPlans) : membershipApi.activatePlan(String(p.id)).then(fetchAllPlans)}
                            className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors ${p.is_active ? dark ? 'border-yellow-900/40 text-yellow-500/60 hover:bg-yellow-950/10' : 'border-yellow-300 text-yellow-600 hover:bg-yellow-50' : dark ? 'border-emerald-900/40 text-emerald-500/60 hover:bg-emerald-950/10' : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'}`}>
                            {p.is_active ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </div>
                      <div className={`w-full h-px ${dark ? 'bg-white/5' : 'bg-black/10'}`} />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/30' : 'text-black/40'}`}>Precio</p>
                          <p className={`text-lg font-bold ${dark ? 'text-white' : 'text-black'}`}>${p.price.toLocaleString('es-CO')}</p>
                        </div>
                        <div>
                          <p className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/30' : 'text-black/40'}`}>Duración</p>
                          <p className={`text-lg font-bold ${dark ? 'text-white' : 'text-black'}`}>{p.duration_days} días</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── TAB MOROSOS ── */}
          {tab === 'morosos' && (
            <>
              <div className={`rounded-xl border overflow-hidden ${dark ? 'border-white/5' : 'border-black/10'}`}>
                <div className={`grid grid-cols-4 px-5 py-3 text-[10px] uppercase tracking-widest border-b ${dark ? 'bg-[#111] border-white/5 text-white/30' : 'bg-gray-50 border-black/10 text-black/40'}`}>
                  <span className="col-span-2">Cliente</span>
                  <span>Venció</span>
                  <span className="text-right">Días vencido</span>
                </div>
                {morosos.length === 0 ? (
                  <div className={`px-5 py-10 text-center text-xs tracking-widest uppercase ${dark ? 'text-white/15' : 'text-black/20'}`}>
                    No hay clientes morosos 🎉
                  </div>
                ) : morosos.map((m, i) => {
                  const overdue = Math.abs(daysLeft(m.end_date));
                  return (
                    <div key={m.id} className={`grid grid-cols-4 px-5 py-3.5 items-center border-b transition-colors ${dark ? `border-white/5 ${i % 2 === 0 ? 'bg-[#0f0f0f]' : 'bg-[#111]'}` : `border-black/5 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}`}>
                      <span className={`col-span-2 text-xs ${dark ? 'text-white/70' : 'text-black/70'}`}>{clientMap[String(m.customer_id)] ?? String(m.customer_id)}</span>
                      <span className={`text-xs ${dark ? 'text-red-400/70' : 'text-red-600'}`}>{formatDate(m.end_date)}</span>
                      <span className="text-xs text-red-500 font-semibold text-right">{overdue}d vencido</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      {/* ── MODAL NUEVA MEMBRESÍA ── */}
      {showNewM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => !newMLoading && setShowNewM(false)} />
          <div className={`relative z-10 rounded-2xl p-6 w-full max-w-sm border shadow-2xl flex flex-col gap-5 ${dark ? 'bg-[#141414] border-white/5' : 'bg-white border-black/10'}`}>
            {newMSuccess ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-14 h-14 rounded-full border border-emerald-900/40 flex items-center justify-center">
                  <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className={`font-bold tracking-wide ${dark ? 'text-white' : 'text-black'}`}>¡Membresía creada!</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`font-bold tracking-wide ${dark ? 'text-white' : 'text-black'}`}>Nueva Membresía</h2>
                    <p className={`text-[10px] tracking-widest uppercase mt-0.5 ${dark ? 'text-white/30' : 'text-black/40'}`}>Asignar plan a cliente</p>
                  </div>
                  <button onClick={() => setShowNewM(false)} className={`text-xs w-7 h-7 rounded-lg flex items-center justify-center ${dark ? 'text-white/30 hover:text-white/60 hover:bg-white/5' : 'text-black/30 hover:bg-black/5'}`}>✕</button>
                </div>
                <div className={`w-full h-px ${dark ? 'bg-white/5' : 'bg-black/10'}`} />
                <div className="flex flex-col gap-1.5">
                  <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/40'}`}>Cliente</label>
                  <select value={newMForm.customerId} onChange={e => { setNewMForm(p => ({ ...p, customerId: e.target.value })); setNewMError(''); }}
                    className={`rounded-lg px-4 py-2.5 text-sm outline-none border transition-colors ${dark ? 'bg-[#0f0f0f] border-white/5 text-white focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black'}`}>
                    <option value="">Selecciona un cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.paternal_last_name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/40'}`}>Plan</label>
                  <select value={newMForm.planId} onChange={e => { setNewMForm(p => ({ ...p, planId: e.target.value })); setNewMError(''); }}
                    className={`rounded-lg px-4 py-2.5 text-sm outline-none border transition-colors ${dark ? 'bg-[#0f0f0f] border-white/5 text-white focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black'}`}>
                    <option value="">Selecciona un plan...</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {p.duration_days}d — ${p.price.toLocaleString('es-CO')}</option>)}
                  </select>
                </div>
                {newMError && <p className="text-red-500 text-xs text-center bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">{newMError}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setShowNewM(false)} className={`flex-1 py-2.5 rounded-lg text-xs border ${dark ? 'border-white/5 text-white/40 hover:bg-white/5' : 'border-black/10 text-black/40'}`}>Cancelar</button>
                  <button onClick={handleCreateM} disabled={newMLoading} className="flex-1 py-2.5 rounded-lg text-xs bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold tracking-widest uppercase">
                    {newMLoading ? 'Creando...' : 'Crear →'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL GESTIONAR MEMBRESÍA ── */}
      {selectedM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setSelectedM(null)} />
          <div className={`relative z-10 rounded-2xl p-6 w-full max-w-lg border shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto ${dark ? 'bg-[#141414] border-white/5' : 'bg-white border-black/10'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`font-bold tracking-wide ${dark ? 'text-white' : 'text-black'}`}>Gestionar Membresía</h2>
                <p className={`text-[10px] tracking-widest uppercase mt-0.5 ${dark ? 'text-white/30' : 'text-black/40'}`}>
                  {clientMap[String(selectedM.customer_id)] ?? String(selectedM.customer_id)}
                </p>
              </div>
              <button onClick={() => setSelectedM(null)} className={`text-xs w-7 h-7 rounded-lg flex items-center justify-center ${dark ? 'text-white/30 hover:text-white/60 hover:bg-white/5' : 'text-black/30 hover:bg-black/5'}`}>✕</button>
            </div>

            <div className={`w-full h-px ${dark ? 'bg-white/5' : 'bg-black/10'}`} />

            {/* Info membresía */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Plan', value: planMap[String(selectedM.plan_id)] ?? String(selectedM.plan_id) },
                { label: 'Inicio', value: formatDate(selectedM.start_date) },
                { label: 'Vence', value: formatDate(selectedM.end_date) },
              ].map(f => (
                <div key={f.label} className={`rounded-lg p-3 border ${dark ? 'bg-[#0f0f0f] border-white/5' : 'bg-gray-50 border-black/5'}`}>
                  <p className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/30' : 'text-black/40'}`}>{f.label}</p>
                  <p className={`text-xs font-medium mt-0.5 ${dark ? 'text-white/70' : 'text-black/70'}`}>{f.value}</p>
                </div>
              ))}
            </div>

            {/* Cancelar membresía */}
            {selectedM.status !== 'cancelada' && (
              <button onClick={handleCancelM}
                className="w-full py-2 rounded-lg text-xs border border-red-900/30 text-red-500 hover:bg-red-950/20 transition-colors tracking-widest uppercase">
                Cancelar membresía
              </button>
            )}

            <div className={`w-full h-px ${dark ? 'bg-white/5' : 'bg-black/10'}`} />

            {/* Congelamientos existentes */}
            <div>
              <p className={`text-[10px] uppercase tracking-widest mb-2 ${dark ? 'text-white/30' : 'text-black/40'}`}>Congelamientos</p>
              {loadingFreezes ? (
                <p className={`text-xs animate-pulse ${dark ? 'text-white/20' : 'text-black/20'}`}>Cargando...</p>
              ) : freezes.length === 0 ? (
                <p className={`text-xs ${dark ? 'text-white/20' : 'text-black/30'}`}>Sin congelamientos registrados.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {sortedFreezes.map(f => {
                    const freezeStatus = getFreezeDisplayStatus(f);
                    const isLatest = isLatestFreeze(f);
                    const canUnfreeze = canUnfreezeLatest(f);

                    return (
                      <div
                        key={f.id}
                        className={`rounded-lg p-3 border flex items-center justify-between ${
                          dark ? 'bg-[#0f0f0f] border-white/5' : 'bg-gray-50 border-black/5'
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <p className={`text-xs ${dark ? 'text-white/70' : 'text-black/70'}`}>
                            {f.is_indefinite
                              ? `Indefinido desde ${formatDate(String(f.start_date))}`
                              : `${formatDate(String(f.start_date))} → ${formatDate(String(f.end_date))}`}
                          </p>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] ${freezeStatus.className}`}>
                              {freezeStatus.label}
                            </span>

                            <span className={`text-[10px] ${dark ? 'text-white/20' : 'text-black/30'}`}>
                              Creado: {formatDate(String(f.created_at ?? f.start_date))}
                            </span>

                            {isLatest && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                  dark
                                    ? 'border-white/10 text-white/40 bg-white/5'
                                    : 'border-black/10 text-black/40 bg-black/[0.03]'
                                }`}
                              >
                                Último registro
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {canUnfreeze && (
                            <button
                              onClick={() => handleCancelFreeze(String(f.id))}
                              className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors ${
                                dark
                                  ? 'border-yellow-900/40 text-yellow-500/70 hover:bg-yellow-950/10'
                                  : 'border-yellow-300 text-yellow-600 hover:bg-yellow-50'
                              }`}
                            >
                              Descongelar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedM.status === 'activa' && latestFreezeBlocksNew && latestFreezeStatus && (
              <div
                className={`rounded-lg border px-3 py-2 text-xs ${
                  dark
                    ? 'bg-yellow-950/10 border-yellow-900/30 text-yellow-300'
                    : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                }`}
              >
                No puedes crear un nuevo congelamiento porque el último registro aún está en estado "{latestFreezeStatus.label}".
              </div>
            )}

            {/* Nuevo congelamiento */}
            {selectedM.status === 'activa' && !latestFreezeBlocksNew && (
              <>
                <div className={`w-full h-px ${dark ? 'bg-white/5' : 'bg-black/10'}`} />
                <p className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/30' : 'text-black/40'}`}>Nuevo congelamiento</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/40'}`}>Fecha inicio</label>
                    <input type="date" value={freezeForm.start_date} onChange={e => setFreezeForm(p => ({ ...p, start_date: e.target.value }))}
                      className={`rounded-lg px-3 py-2 text-sm outline-none border transition-colors ${dark ? 'bg-[#0f0f0f] border-white/5 text-white focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black'}`} />
                  </div>
                  {!freezeForm.is_indefinite && (
                    <div className="flex flex-col gap-1">
                      <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/40'}`}>Fecha fin</label>
                      <input type="date" value={freezeForm.end_date} onChange={e => setFreezeForm(p => ({ ...p, end_date: e.target.value }))}
                        className={`rounded-lg px-3 py-2 text-sm outline-none border transition-colors ${dark ? 'bg-[#0f0f0f] border-white/5 text-white focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black'}`} />
                    </div>
                  )}
                </div>

                <label className={`flex items-center gap-2 text-xs cursor-pointer ${dark ? 'text-white/50' : 'text-black/50'}`}>
                  <input type="checkbox" checked={freezeForm.is_indefinite} onChange={e => setFreezeForm(p => ({ ...p, is_indefinite: e.target.checked, end_date: '' }))} className="accent-red-600" />
                  Congelamiento indefinido
                </label>

                {freezeError && <p className="text-red-500 text-xs bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">{freezeError}</p>}

                <button onClick={handleCreateFreeze} disabled={freezeLoading}
                  className="w-full py-2.5 rounded-lg text-xs bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold tracking-widest uppercase transition-colors">
                  {freezeLoading ? 'Congelando...' : 'Congelar membresía →'}
                </button>
              </>
            )}

            {editingFreeze && (
              <div
                className={`mt-4 rounded-xl border p-4 flex flex-col gap-3 ${
                  dark ? 'bg-[#0f0f0f] border-white/5' : 'bg-gray-50 border-black/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/30' : 'text-black/40'}`}>
                    Editar congelamiento
                  </p>

                  <button
                    onClick={() => {
                      setEditingFreeze(null);
                      setEditFreezeForm({
                        start_date: '',
                        end_date: '',
                        is_indefinite: false,
                      });
                      setFreezeError('');
                    }}
                    className={`text-[10px] px-2 py-1 rounded-lg border ${
                      dark ? 'border-white/10 text-white/40' : 'border-black/10 text-black/40'
                    }`}
                  >
                    Cerrar
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/40'}`}>
                      Fecha inicio
                    </label>
                    <input
                      type="date"
                      value={editFreezeForm.start_date}
                      onChange={e =>
                        setEditFreezeForm(p => ({
                          ...p,
                          start_date: e.target.value,
                        }))
                      }
                      className={`rounded-lg px-3 py-2 text-sm outline-none border transition-colors ${
                        dark
                          ? 'bg-[#0f0f0f] border-white/5 text-white focus:border-red-900/60'
                          : 'bg-gray-50 border-black/10 text-black'
                      }`}
                    />
                  </div>

                  {!editFreezeForm.is_indefinite && (
                    <div className="flex flex-col gap-1">
                      <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/40'}`}>
                        Fecha fin
                      </label>
                      <input
                        type="date"
                        value={editFreezeForm.end_date}
                        onChange={e =>
                          setEditFreezeForm(p => ({
                            ...p,
                            end_date: e.target.value,
                          }))
                        }
                        className={`rounded-lg px-3 py-2 text-sm outline-none border transition-colors ${
                          dark
                            ? 'bg-[#0f0f0f] border-white/5 text-white focus:border-red-900/60'
                            : 'bg-gray-50 border-black/10 text-black'
                        }`}
                      />
                    </div>
                  )}
                </div>

                <label className={`flex items-center gap-2 text-xs cursor-pointer ${dark ? 'text-white/50' : 'text-black/50'}`}>
                  <input
                    type="checkbox"
                    checked={editFreezeForm.is_indefinite}
                    onChange={e =>
                      setEditFreezeForm(p => ({
                        ...p,
                        is_indefinite: e.target.checked,
                        end_date: '',
                      }))
                    }
                    className="accent-red-600"
                  />
                  Congelamiento indefinido
                </label>

                <button
                  onClick={handleUpdateFreeze}
                  disabled={editFreezeLoading}
                  className="w-full py-2.5 rounded-lg text-xs bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold tracking-widest uppercase transition-colors"
                >
                  {editFreezeLoading ? 'Guardando...' : 'Guardar cambios del congelamiento'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL NUEVO PLAN ── */}
      {showNewPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => !planLoading && setShowNewPlan(false)} />
          <div className={`relative z-10 rounded-2xl p-6 w-full max-w-sm border shadow-2xl flex flex-col gap-4 ${dark ? 'bg-[#141414] border-white/5' : 'bg-white border-black/10'}`}>
            {planSuccess ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-14 h-14 rounded-full border border-emerald-900/40 flex items-center justify-center">
                  <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className={`font-bold tracking-wide ${dark ? 'text-white' : 'text-black'}`}>¡Plan creado!</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className={`font-bold tracking-wide ${dark ? 'text-white' : 'text-black'}`}>Nuevo Plan</h2>
                  <button onClick={() => setShowNewPlan(false)} className={`text-xs w-7 h-7 rounded-lg flex items-center justify-center ${dark ? 'text-white/30 hover:bg-white/5' : 'text-black/30 hover:bg-black/5'}`}>✕</button>
                </div>
                <div className={`w-full h-px ${dark ? 'bg-white/5' : 'bg-black/10'}`} />
                {[
                  { key: 'name', label: 'Nombre del plan', placeholder: 'Ej: Mensual Premium', type: 'text' },
                  { key: 'price', label: 'Precio (COP)', placeholder: '50000', type: 'number' },
                  { key: 'duration_days', label: 'Duración (días)', placeholder: '30', type: 'number' },
                ].map(f => (
                  <div key={f.key} className="flex flex-col gap-1">
                    <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/40'}`}>{f.label}</label>
                    <input type={f.type} value={planForm[f.key as keyof typeof planForm]}
                      onChange={e => { setPlanForm(p => ({ ...p, [f.key]: e.target.value })); setPlanError(''); }}
                      placeholder={f.placeholder}
                      className={`rounded-lg px-4 py-2.5 text-sm outline-none border transition-colors ${dark ? 'bg-[#0f0f0f] border-white/5 text-white placeholder-white/20 focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black'}`} />
                  </div>
                ))}
                {planError && <p className="text-red-500 text-xs bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">{planError}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setShowNewPlan(false)} className={`flex-1 py-2.5 rounded-lg text-xs border ${dark ? 'border-white/5 text-white/40 hover:bg-white/5' : 'border-black/10 text-black/40'}`}>Cancelar</button>
                  <button onClick={handleCreatePlan} disabled={planLoading} className="flex-1 py-2.5 rounded-lg text-xs bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold tracking-widest uppercase">
                    {planLoading ? 'Creando...' : 'Crear →'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR PLAN ── */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => !editPlanLoading && setEditingPlan(null)} />
          <div className={`relative z-10 rounded-2xl p-6 w-full max-w-sm border shadow-2xl flex flex-col gap-4 ${dark ? 'bg-[#141414] border-white/5' : 'bg-white border-black/10'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`font-bold tracking-wide ${dark ? 'text-white' : 'text-black'}`}>Editar Plan</h2>
              <button onClick={() => setEditingPlan(null)} className={`text-xs w-7 h-7 rounded-lg flex items-center justify-center ${dark ? 'text-white/30 hover:bg-white/5' : 'text-black/30 hover:bg-black/5'}`}>✕</button>
            </div>
            <div className={`w-full h-px ${dark ? 'bg-white/5' : 'bg-black/10'}`} />
            {[
              { key: 'name', label: 'Nombre', placeholder: 'Mensual Premium', type: 'text' },
              { key: 'price', label: 'Precio (COP)', placeholder: '50000', type: 'number' },
              { key: 'duration_days', label: 'Duración (días)', placeholder: '30', type: 'number' },
            ].map(f => (
              <div key={f.key} className="flex flex-col gap-1">
                <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/40'}`}>{f.label}</label>
                <input type={f.type} value={editPlanForm[f.key as keyof typeof editPlanForm]}
                  onChange={e => { setEditPlanForm(p => ({ ...p, [f.key]: e.target.value })); setEditPlanError(''); }}
                  placeholder={f.placeholder}
                  className={`rounded-lg px-4 py-2.5 text-sm outline-none border transition-colors ${dark ? 'bg-[#0f0f0f] border-white/5 text-white placeholder-white/20 focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black'}`} />
              </div>
            ))}
            {editPlanError && <p className="text-red-500 text-xs bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">{editPlanError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setEditingPlan(null)} className={`flex-1 py-2.5 rounded-lg text-xs border ${dark ? 'border-white/5 text-white/40 hover:bg-white/5' : 'border-black/10 text-black/40'}`}>Cancelar</button>
              <button onClick={handleEditPlan} disabled={editPlanLoading} className="flex-1 py-2.5 rounded-lg text-xs bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold tracking-widest uppercase">
                {editPlanLoading ? 'Guardando...' : 'Guardar →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {dark && <div className="fixed w-[600px] h-[300px] rounded-full blur-[150px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-950/10 pointer-events-none" />}
    </div>
  );
}