import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  cashRegisterApi,
  type CashMovement,
  type CashSummary,
  type CashSession,
} from '../api/cashRegister.api';
import { paymentApi } from '../api/payment.api';
import type { RegisterPaymentPayload } from '../api/payment.api';
import { productApi } from '../api/product.api';
import type { Product, PaymentMethod, SellProductResponse } from '../api/product.api';
import { membershipApi } from '../api/membership.api';
import type { Membership, MembershipPlan } from '../api/membership.api';
import { userApi } from '../api/user.api';
import type { Client } from '../api/user.api';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/ui/Navbar';

interface CurrentSessionState {
  session: CashSession;
  movements: CashMovement[];
  summary: CashSummary;
}

interface SplitRow {
  payment_method: PaymentMethod;
  amount: string;
}

interface MembershipPaymentInfo {
  paidAmount: number;
  remainingAmount: number;
  isPaidInFull: boolean;
  planPrice: number;
}

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const PAYMENT_METHODS: PaymentMethod[] = ['efectivo', 'transferencia', 'tarjeta', 'otro'];

export default function CashRegisterPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { darkMode } = useTheme();

  const [loggingOut, setLoggingOut] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [currentSession, setCurrentSession] = useState<CurrentSessionState | null>(null);
  const [pageError, setPageError] = useState('');

  const [openForm, setOpenForm] = useState({ openingBalance: '', notes: '' });
  const [movementForm, setMovementForm] = useState({
    movementType: 'egreso' as 'ingreso' | 'egreso',
    amount: '',
    description: '',
  });
  const [closeForm, setCloseForm] = useState({ closingBalance: '', notes: '' });

  const [openLoading, setOpenLoading] = useState(false);
  const [movementLoading, setMovementLoading] = useState(false);
  const [closeLoading, setCloseLoading] = useState(false);

  const [openError, setOpenError] = useState('');
  const [movementError, setMovementError] = useState('');
  const [closeError, setCloseError] = useState('');

  // ── MEMBERSHIP PAYMENT ────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'movements' | 'membership' | 'product'>('movements');

  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientMemberships, setClientMemberships] = useState<Membership[]>([]);
  const [membershipInfoMap, setMembershipInfoMap] = useState<Record<string, MembershipPaymentInfo>>({});
  const [membershipPlansMap, setMembershipPlansMap] = useState<Record<string, MembershipPlan>>({});
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);
  const [membershipSplits, setMembershipSplits] = useState<SplitRow[]>([
    { payment_method: 'efectivo', amount: '' },
  ]);
  const [membershipNotes, setMembershipNotes] = useState('');
  const [membershipPayLoading, setMembershipPayLoading] = useState(false);
  const [membershipPayError, setMembershipPayError] = useState('');
  const [membershipPaySuccess, setMembershipPaySuccess] = useState('');
  const clientSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── PRODUCT SALE ──────────────────────────────────────────────────────────
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState('1');
  const [productPaymentMethod, setProductPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [productSellLoading, setProductSellLoading] = useState(false);
  const [productSellError, setProductSellError] = useState('');
  const [productSellSuccess, setProductSellSuccess] = useState('');
  const productSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dark = darkMode;

  const formatCurrency = (value: number | null) => currencyFormatter.format(value ?? 0);

  const normalizeMovementType = (type: string): 'ingreso' | 'egreso' => {
    if (type === 'ingreso' || type === 'income') return 'ingreso';
    return 'egreso';
  };
  const formatDateTime = (value?: string | null) => {
    if (!value) return '—';
    return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  };

  function buildSessionState(payload: {
  session: CashSession;
  movements?: CashMovement[];
  summary?: CashSummary;
  totalIncome?: number;
  totalExpense?: number;
  expectedBalance?: number;
  difference?: number | null;
}): CurrentSessionState {
  const movements = Array.isArray(payload.movements) ? payload.movements : [];

  const openingBal   = Number(payload.session?.opening_balance ?? (payload.session as any)?.openingbalance ?? 0);
  const closingRaw   = payload.session?.closing_balance ?? (payload.session as any)?.closingbalance ?? null;
  const closingBal   = closingRaw != null ? Number(closingRaw) : null;
  const totalIncome  = Number(payload.totalIncome  ?? 0);
  const totalExpense = Number(payload.totalExpense ?? 0);
  const expectedBalance = Number(
    payload.expectedBalance ?? (openingBal + totalIncome - totalExpense)
  );
  const difference = payload.difference != null ? Number(payload.difference) : null;

  const summary: CashSummary = payload.summary ?? {
    openingBalance:  openingBal,
    totalIncome,
    totalExpense,
    expectedBalance,
    closingBalance:  closingBal,
    difference,
  };

  return {
    session:   payload.session,
    movements,
    summary,
  };
}

  const loadCurrentSession = async () => {
    setLoadingCurrent(true);
    setPageError('');
    try {
      const response = await cashRegisterApi.getCurrent();
      const payload = response?.data;
      if (!payload || !payload.session) {
        setCurrentSession(null);
        setCloseForm(prev => ({ ...prev, closingBalance: '' }));
        return;
      }
      const state = buildSessionState(payload);
      setCurrentSession(state);
      setCloseForm(prev => ({
        ...prev,
        closingBalance: state.summary.expectedBalance != null ? String(state.summary.expectedBalance) : '',
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar la sesión de caja.';
      if (message.toLowerCase().includes('no hay ninguna sesión de caja abierta')) {
        setCurrentSession(null);
        setCloseForm(prev => ({ ...prev, closingBalance: '' }));
      } else {
        setPageError(message);
      }
    } finally {
      setLoadingCurrent(false);
    }
  };

  const refreshSummary = async () => {
  try {
    const response = await cashRegisterApi.getCurrent();
    const payload = response?.data;

    if (!payload || !payload.session) return;

    const movements = Array.isArray(payload.movements) ? payload.movements : [];

    const freshSummary: CashSummary = {
      openingBalance: payload.session.opening_balance ?? 0,
      totalIncome: payload.totalIncome ?? 0,
      totalExpense: payload.totalExpense ?? 0,
      expectedBalance: payload.expectedBalance ?? payload.session.opening_balance ?? 0,
      closingBalance: payload.session.closing_balance ?? null,
      difference: payload.difference ?? null,
    };

    setCurrentSession({
      session: payload.session,
      movements,
      summary: freshSummary,
    });

    setCloseForm(prev => ({
      ...prev,
      closingBalance:
        freshSummary.expectedBalance != null
          ? String(freshSummary.expectedBalance)
          : prev.closingBalance,
    }));
  } catch {
    // silent
  }
};

  useEffect(() => { loadCurrentSession(); }, []);

  // ── PRODUCT SEARCH ────────────────────────────────────────────────────────
  const handleProductSearchChange = useCallback((value: string) => {
    setProductSearch(value);
    setSelectedProduct(null);
    setProductSellError('');
    setProductSellSuccess('');
    if (productSearchTimer.current) clearTimeout(productSearchTimer.current);
    if (!value.trim()) { setProductResults([]); return; }
    productSearchTimer.current = setTimeout(async () => {
      setProductSearchLoading(true);
      try {
        const res = await productApi.getAll(1, 100);
        const q = value.toLowerCase();
        const filtered = (res.products ?? []).filter(
          (p) => p.is_active && p.name.toLowerCase().includes(q)
        );
        setProductResults(filtered);
      } catch {
        setProductResults([]);
      } finally {
        setProductSearchLoading(false);
      }
    }, 300);
  }, []);

  // ── CLIENT SEARCH ─────────────────────────────────────────────────────────
  const handleClientSearchChange = useCallback((value: string) => {
  setClientSearch(value);
  setSelectedClient(null);
  setClientMemberships([]);
  setSelectedMembership(null);
  setMembershipInfoMap({});
  setMembershipPayError('');
  setMembershipPaySuccess('');

  if (clientSearchTimer.current) clearTimeout(clientSearchTimer.current);

  if (!value.trim()) {
    setClientResults([]);
    return;
  }

  clientSearchTimer.current = setTimeout(async () => {
    setClientSearchLoading(true);
    try {
      const res = await userApi.getAllClients(1, 100);
      const q = value.toLowerCase().trim();

      const filtered = (res.users ?? []).filter((c) => {
        const firstName       = (c.first_name ?? '').toLowerCase();
        const middleName      = (c.middle_name ?? '').toLowerCase();
        const paternalLast    = (c.paternal_last_name ?? '').toLowerCase();
        const maternalLast    = (c.maternal_last_name ?? '').toLowerCase();
        const phone           = c.phone ?? '';
        const email           = (c.email ?? '').toLowerCase();

        const fullName = `${firstName} ${middleName} ${paternalLast} ${maternalLast}`.trim();

        return (
          firstName.includes(q)    ||
          paternalLast.includes(q) ||
          maternalLast.includes(q) ||
          fullName.includes(q)     ||
          phone.includes(value.trim()) ||
          email.includes(q)
        );
      });

      setClientResults(filtered);
    } catch {
      setClientResults([]);
    } finally {
      setClientSearchLoading(false);
    }
  }, 300);
}, []);

  const handleSelectClient = useCallback(async (client: Client) => {
    setSelectedClient(client);
    setClientResults([]);
    setClientSearch(`${client.first_name} ${client.paternal_last_name}`);
    setSelectedMembership(null);
    setMembershipInfoMap({});
    setMembershipPayError('');
    setMembershipPaySuccess('');
    try {
      const allRes = await membershipApi.getAll();
      const memberships = (allRes.memberships ?? []).filter(
        (m) => m.customer_id === client.id && m.status !== 'cancelada'
      );
      setClientMemberships(memberships);

      const plansMap: Record<string, MembershipPlan> = {};
      const infoMap: Record<string, MembershipPaymentInfo> = {};

      await Promise.all(
        memberships.map(async (m) => {
          try {
            const [planRes, paymentsRes] = await Promise.all([
              membershipApi.getPlanById(m.plan_id),
              paymentApi.getByMembership(Number(m.id)),
            ]);
            const plan = planRes.plan;
            if (plan) plansMap[m.plan_id] = plan;
            const planPrice = plan?.price ?? 0;
            const payments = paymentsRes.data ?? [];
            const paid = payments.reduce((acc, pw) => acc + pw.payment.total_amount, 0);
            infoMap[m.id] = {
              paidAmount: paid,
              remainingAmount: Math.max(0, planPrice - paid),
              isPaidInFull: paid >= planPrice,
              planPrice,
            };
          } catch {
            infoMap[m.id] = { paidAmount: 0, remainingAmount: 0, isPaidInFull: false, planPrice: 0 };
          }
        })
      );

      setMembershipPlansMap(plansMap);
      setMembershipInfoMap(infoMap);
    } catch {
      setClientMemberships([]);
    }
  }, []);

  // ── MEMBERSHIP PAYMENT ────────────────────────────────────────────────────
  const addSplitRow = () => {
    setMembershipSplits(prev => [...prev, { payment_method: 'efectivo', amount: '' }]);
  };

  const removeSplitRow = (index: number) => {
    setMembershipSplits(prev => prev.filter((_, i) => i !== index));
  };

  const updateSplitRow = (index: number, field: keyof SplitRow, value: string) => {
    setMembershipSplits(prev =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleMembershipPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setMembershipPayError('');
    setMembershipPaySuccess('');

    if (!selectedMembership) {
      setMembershipPayError('Selecciona una membresía.');
      return;
    }

    const validSplits = membershipSplits.filter(
      (s) => s.payment_method && Number(s.amount) > 0
    );
    if (validSplits.length === 0) {
      setMembershipPayError('Ingresa al menos un método de pago con monto mayor a cero.');
      return;
    }

    const info = membershipInfoMap[selectedMembership.id];
    if (info?.isPaidInFull) {
      setMembershipPayError('Esta membresía ya está pagada en su totalidad.');
      return;
    }

    const totalSplits = validSplits.reduce((acc, s) => acc + Number(s.amount), 0);
    if (info && totalSplits > info.remainingAmount) {
      setMembershipPayError(
        `El monto ingresado (${formatCurrency(totalSplits)}) supera el saldo pendiente (${formatCurrency(info.remainingAmount)}).`
      );
      return;
    }

    setMembershipPayLoading(true);
    try {
      const payload: RegisterPaymentPayload = {
        membershipId: Number(selectedMembership.id),
        splits: validSplits.map((s) => ({
          payment_method: s.payment_method,
          amount: Number(s.amount),
        })),
        notes: membershipNotes.trim() || undefined,
      };
      const res = await paymentApi.register(payload);
      const receipt = res.receipt;
      setMembershipPaySuccess(
        receipt.isPaidInFull
          ? `✅ Membresía pagada en su totalidad. Total: ${formatCurrency(receipt.paidAmount)}`
          : `✅ Abono registrado. Pendiente: ${formatCurrency(receipt.remainingAmount)}`
      );
      setMembershipSplits([{ payment_method: 'efectivo', amount: '' }]);
      setMembershipNotes('');
      await handleSelectClient(selectedClient!);
    } catch (err: unknown) {
      setMembershipPayError(
        err instanceof Error ? err.message : 'No se pudo registrar el pago.'
      );
    } finally {
      setMembershipPayLoading(false);
    }
  };

  // ── PRODUCT SELL ──────────────────────────────────────────────────────────
  const handleProductSell = async (e: React.FormEvent) => {
  e.preventDefault();
  setProductSellError('');
  setProductSellSuccess('');

  if (!selectedProduct) {
    setProductSellError('Selecciona un producto.');
    return;
  }
  if (!currentSession?.session?.id) {
    setProductSellError('No hay una sesión de caja abierta.');
    return;
  }
  const qty = Number(productQuantity);
  if (!qty || qty <= 0) {
    setProductSellError('La cantidad debe ser mayor a cero.');
    return;
  }
  if (qty > selectedProduct.stock) {
    setProductSellError(`Stock insuficiente. Disponible: ${selectedProduct.stock}`);
    return;
  }

  setProductSellLoading(true);
  try {
    const res: SellProductResponse = await productApi.sell(selectedProduct.id, {
      quantity: qty,
      payment_method: productPaymentMethod,
    });
    const total = res.payment?.total_amount ?? 0;
    setProductSellSuccess(`✅ Venta registrada. Total: ${formatCurrency(total)}`);
    setSelectedProduct(null);
    setProductSearch('');
    setProductQuantity('1');
    await refreshSummary();
    setActiveTab('movements');
  } catch (err: unknown) {
    setProductSellError(
      err instanceof Error ? err.message : 'No se pudo registrar la venta.'
    );
  } finally {
    setProductSellLoading(false);
  }
};

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    await new Promise(resolve => setTimeout(resolve, 2000));
    navigate('/login');
  };

  const handleOpenCash = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpenError('');
    if (!openForm.openingBalance || Number(openForm.openingBalance) < 0) {
      setOpenError('El monto inicial debe ser mayor o igual a cero.');
      return;
    }
    setOpenLoading(true);
    try {
      await cashRegisterApi.open({
        openingBalance: Number(openForm.openingBalance),
        notes: openForm.notes.trim() || undefined,
      });
      setOpenForm({ openingBalance: '', notes: '' });
      await loadCurrentSession();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo abrir la caja.';
      setOpenError(message);
      if (message.toLowerCase().includes('ya existe una caja abierta')) {
        await loadCurrentSession();
      }
    } finally {
      setOpenLoading(false);
    }
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setMovementError('');
    if (!currentSession?.session?.id) {
      setMovementError('No hay una sesión de caja activa.');
      return;
    }
    if (!movementForm.amount || Number(movementForm.amount) <= 0) {
      setMovementError('El valor del movimiento debe ser mayor a cero.');
      return;
    }
    if (!movementForm.description.trim()) {
      setMovementError('La descripción del movimiento es obligatoria.');
      return;
    }
    setMovementLoading(true);
    try {
      await cashRegisterApi.createMovement({
        sessionId: currentSession.session.id,
        movementType: movementForm.movementType,
        amount: Number(movementForm.amount),
        description: movementForm.description.trim(),
      });
      setMovementForm({ movementType: movementForm.movementType, amount: '', description: '' });
      await refreshSummary();
    } catch (err: unknown) {
      setMovementError(err instanceof Error ? err.message : 'No se pudo registrar el movimiento.');
    } finally {
      setMovementLoading(false);
    }
  };

  const handleCloseCash = async (e: React.FormEvent) => {
    e.preventDefault();
    setCloseError('');
    if (!currentSession?.session?.id) {
      setCloseError('No hay una sesión activa para cerrar.');
      return;
    }
    if (!closeForm.closingBalance || Number(closeForm.closingBalance) < 0) {
      setCloseError('El total real debe ser mayor o igual a cero.');
      return;
    }
    setCloseLoading(true);
    try {
      await cashRegisterApi.close({
        sessionId: currentSession.session.id,
        closingBalance: Number(closeForm.closingBalance),
        notes: closeForm.notes.trim() || undefined,
      });
      setCloseForm({ closingBalance: '', notes: '' });
      setCurrentSession(null);
      await loadCurrentSession();
    } catch (err: unknown) {
      setCloseError(err instanceof Error ? err.message : 'No se pudo cerrar la caja.');
    } finally {
      setCloseLoading(false);
    }
  };

  const totals = useMemo(() => {
    if (!currentSession) return null;
    return {
      opening: currentSession.summary.openingBalance,
      income: currentSession.summary.totalIncome,
      expense: currentSession.summary.totalExpense,
      expected: currentSession.summary.expectedBalance,
      counted: currentSession.summary.closingBalance ?? (closeForm.closingBalance ? Number(closeForm.closingBalance) : null),
      difference:
        currentSession.summary.closingBalance !== null
          ? currentSession.summary.difference
          : closeForm.closingBalance
            ? Number(closeForm.closingBalance) - currentSession.summary.expectedBalance
            : null,
    };
  }, [currentSession, closeForm.closingBalance]);

  const exportDayReport = () => {
    if (!currentSession) return;
    const rows = [
      ['Report Type', 'Cash Register Daily Report'],
      ['Session ID', String(currentSession.session.id)],
      ['Opened At', currentSession.session.opened_at],
      ['Closed At', currentSession.session.closed_at ?? 'OPEN'],
      ['Opening Balance', String(currentSession.summary.openingBalance)],
      ['Total Income', String(currentSession.summary.totalIncome)],
      ['Total Expense', String(currentSession.summary.totalExpense)],
      ['Expected Balance', String(currentSession.summary.expectedBalance)],
      ['Closing Balance', String(currentSession.summary.closingBalance ?? '')],
      ['Difference', String(currentSession.summary.difference ?? '')],
      [],
      ['Movement ID', 'Type', 'Amount', 'Description', 'Created At'],
      ...currentSession.movements.map(movement => [
        String(movement.id),
        movement.movement_type,
        String(movement.amount),
        movement.description.replace(/,/g, ' '),
        movement.created_at,
      ]),
    ];
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cash-register-report-session-${currentSession.session.id}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const inputCls = `bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors w-full`;

  if (loggingOut) {
    return (
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
  }

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-500 ${dark ? 'bg-[#0a0a0a] text-white' : 'bg-[#f0f0f0] text-[#111]'}`}>
      <Navbar onLogout={handleLogout} />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(120,0,0,0.10),_transparent_40%)] pointer-events-none" />
        {dark && (
          <div className="absolute w-[600px] h-[300px] rounded-full blur-[150px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-950/10 pointer-events-none" />
        )}

        <div className="relative z-10 px-8 pt-8 pb-4">
          <p className={`text-[10px] tracking-widest uppercase mb-0.5 ${dark ? 'text-white/30' : 'text-black/40'}`}>Finance</p>
          <h1 className={`text-2xl font-bold tracking-wide ${dark ? 'text-white' : 'text-[#111]'}`}>Cuadre de caja</h1>
        </div>

        <div className="relative z-10 flex-1 p-8 flex flex-col gap-6">
          {pageError && (
            <div className="text-red-400 text-sm bg-red-950/20 border border-red-900/30 rounded-xl px-4 py-3">{pageError}</div>
          )}

          {loadingCurrent ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white/30 text-xs tracking-[0.4em] uppercase animate-pulse">Cargando caja...</p>
            </div>
          ) : !currentSession ? (
            // ── SIN SESIÓN ─────────────────────────────────────────────────
            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
              <div className={dark ? 'bg-[#141414] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col gap-4' : 'bg-white border border-black/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4'}>
                <div>
                  <p className={`text-[10px] uppercase tracking-widest mb-1 ${dark ? 'text-white/30' : 'text-black/40'}`}>Apertura</p>
                  <h2 className={dark ? 'text-2xl font-bold text-white' : 'text-2xl font-bold text-black'}>Abrir caja</h2>
                  <p className={`text-sm mt-1 ${dark ? 'text-white/40' : 'text-black/60'}`}>Registra el monto inicial para comenzar el turno.</p>
                </div>
                <form onSubmit={handleOpenCash} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/50'}`}>Monto inicial</label>
                    <input type="number" min="0" value={openForm.openingBalance} onChange={e => setOpenForm(prev => ({ ...prev, openingBalance: e.target.value }))} placeholder="100000"
                      className={`rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors ${dark ? 'bg-[#111111] border border-[#2a2a2a] text-white placeholder-white/20 focus:border-red-900/60' : 'bg-gray-50 border border-black/10 text-[#111] placeholder-black/30 focus:border-red-400'}`} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/50'}`}>Notas</label>
                    <textarea rows={4} value={openForm.notes} onChange={e => setOpenForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Apertura turno mañana"
                      className={`rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors resize-none ${dark ? 'bg-[#111111] border border-[#2a2a2a] text-white placeholder-white/20 focus:border-red-900/60' : 'bg-gray-50 border border-black/10 text-[#111] placeholder-black/30 focus:border-red-400'}`} />
                  </div>
                  {openError && <div className="text-red-400 text-sm bg-red-950/20 border border-red-900/30 rounded-lg px-4 py-3">{openError}</div>}
                  <button type="submit" disabled={openLoading} className="w-full bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors tracking-widest text-sm uppercase shadow-lg shadow-red-950/30">
                    {openLoading ? 'Abriendo...' : 'Abrir caja'}
                  </button>
                </form>
              </div>

              <div className={dark ? 'bg-[#141414] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col gap-4' : 'bg-white border border-black/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4'}>
                <p className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/30' : 'text-black/40'}`}>Estado</p>
                <h3 className={dark ? 'text-xl font-bold text-white' : 'text-xl font-bold text-black'}>No hay caja abierta</h3>
                <p className={`text-sm mt-1 ${dark ? 'text-white/40' : 'text-black/60'}`}>Para comenzar a registrar movimientos y visualizar el resumen del día, primero debes abrir una sesión de caja.</p>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className={dark ? 'rounded-xl border border-white/5 bg-[#101010] p-4' : 'rounded-xl border border-black/10 bg-gray-50 p-4'}>
                    <p className={`text-[10px] uppercase tracking-widest mb-1 ${dark ? 'text-white/30' : 'text-black/40'}`}>Session</p>
                    <p className={dark ? 'text-white font-semibold' : 'text-black font-semibold'}>Pendiente</p>
                  </div>
                  <div className={dark ? 'rounded-xl border border-white/5 bg-[#101010] p-4' : 'rounded-xl border border-black/10 bg-gray-50 p-4'}>
                    <p className={`text-[10px] uppercase tracking-widest mb-1 ${dark ? 'text-white/30' : 'text-black/40'}`}>Expected</p>
                    <p className={dark ? 'text-white font-semibold' : 'text-black font-semibold'}>{formatCurrency(0)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // ── CON SESIÓN ACTIVA ─────────────────────────────────────────
            <>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Sesión activa</p>
                  <h2 className="text-2xl font-bold text-white">Caja #{currentSession.session.id}</h2>
                  <p className="text-sm text-white/40 mt-1">Abierta el {formatDateTime(currentSession.session.opened_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={loadCurrentSession} className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-red-900/40 hover:bg-white/5 transition-all text-sm">Recargar</button>
                  <button onClick={exportDayReport} className="px-5 py-2.5 rounded-lg bg-[#1b1b1b] border border-white/10 hover:border-red-900/40 hover:bg-white/5 text-white font-semibold tracking-wide text-sm transition-colors">Exportar reporte</button>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                {[
                  { label: 'Apertura', value: totals?.opening ?? 0, color: 'text-white' },
                  { label: 'Ingresos', value: totals?.income ?? 0, color: 'text-green-400' },
                  { label: 'Egresos', value: totals?.expense ?? 0, color: 'text-red-400' },
                  { label: 'Esperado', value: totals?.expected ?? 0, color: 'text-white' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl p-5 border bg-[#141414] border-white/5">
                    <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{formatCurrency(value)}</p>
                  </div>
                ))}
                <div className="rounded-xl p-5 border bg-[#141414] border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Diferencia</p>
                  <p className={`text-2xl font-bold ${(totals?.difference ?? 0) > 0 ? 'text-green-400' : (totals?.difference ?? 0) < 0 ? 'text-red-400' : 'text-white'}`}>
                    {formatCurrency(totals?.difference ?? 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6">
                {/* ── PANEL IZQUIERDO: TABS ── */}
                <div className="bg-[#141414] border border-white/5 rounded-2xl shadow-2xl flex flex-col">
                  {/* Tab headers */}
                  <div className="flex border-b border-white/5">
                    {(
                      [
                        { key: 'movements', label: 'Movimientos' },
                        { key: 'membership', label: 'Pago membresía' },
                        { key: 'product', label: 'Venta producto' },
                      ] as { key: typeof activeTab; label: string }[]
                    ).map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex-1 py-3.5 text-sm font-semibold tracking-wide transition-colors border-b-2 ${
                          activeTab === key
                            ? 'border-red-600 text-white'
                            : 'border-transparent text-white/30 hover:text-white/60'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="p-6 flex flex-col gap-4 flex-1">
                    {/* ── TAB: MOVIMIENTOS ── */}
                    {activeTab === 'movements' && (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-white">Resumen del día</h3>
                          <span className="text-xs uppercase tracking-widest text-white/30">{currentSession.movements.length} registros</span>
                        </div>
                        {currentSession.movements.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-white/30 text-sm">No hay movimientos registrados en esta sesión.</div>
                        ) : (
                          <div className="overflow-x-auto rounded-xl border border-white/5">
                            <table className="w-full min-w-[600px] text-sm">
                              <thead className="bg-[#101010]">
                                <tr className="text-left text-white/40 uppercase tracking-widest text-[10px]">
                                  <th className="px-4 py-4">Tipo</th>
                                  <th className="px-4 py-4">Monto</th>
                                  <th className="px-4 py-4">Descripción</th>
                                  <th className="px-4 py-4">Fecha</th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentSession.movements.map(movement => (
                                  <tr key={movement.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-4">
                                      <span
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                                          normalizeMovementType(movement.movement_type) === 'ingreso'
                                            ? 'bg-green-950/20 text-green-400 border-green-900/30'
                                            : 'bg-red-950/20 text-red-400 border-red-900/30'
                                        }`}
                                      >
                                        {normalizeMovementType(movement.movement_type)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 text-white font-medium">{formatCurrency(movement.amount)}</td>
                                    <td className="px-4 py-4 text-white/70">{movement.description}</td>
                                    <td className="px-4 py-4 text-white/50 text-xs">{formatDateTime(movement.created_at)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    )}

                    {/* ── TAB: PAGO MEMBRESÍA ── */}
                    {activeTab === 'membership' && (
                      <div className="flex flex-col gap-5">
                        <h3 className="text-xl font-bold text-white">Pago de membresía</h3>

                        {/* Buscar cliente */}
                        <div className="flex flex-col gap-1 relative">
                          <label className="text-white/40 text-[10px] uppercase tracking-widest">Buscar cliente</label>
                          <input
                            type="text"
                            value={clientSearch}
                            onChange={e => handleClientSearchChange(e.target.value)}
                            placeholder="Nombre, apellido o teléfono..."
                            className={inputCls}
                          />
                          {clientSearchLoading && (
                            <p className="text-white/30 text-xs mt-1 animate-pulse">Buscando...</p>
                          )}
                          {clientResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                              {clientResults.map(c => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => handleSelectClient(c)}
                                  className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                >
                                  <p className="text-white text-sm font-medium">
                                    {c.first_name} {c.paternal_last_name} {c.maternal_last_name ?? ''}
                                  </p>
                                  <p className="text-white/40 text-xs">{c.phone ?? c.email}</p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Membresías del cliente */}
                        {selectedClient && clientMemberships.length === 0 && (
                          <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-white/30 text-sm">
                            Este cliente no tiene membresías activas o pendientes.
                          </div>
                        )}

                        {clientMemberships.length > 0 && (
                          <div className="flex flex-col gap-2">
                            <label className="text-white/40 text-[10px] uppercase tracking-widest">Membresías</label>
                            {clientMemberships.map(m => {
                              const info = membershipInfoMap[m.id];
                              const plan = membershipPlansMap[m.plan_id];
                              const isSelected = selectedMembership?.id === m.id;
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedMembership(m);
                                    setMembershipPayError('');
                                    setMembershipPaySuccess('');
                                    if (info && !info.isPaidInFull && info.remainingAmount > 0) {
                                      setMembershipSplits([{ payment_method: 'efectivo', amount: String(info.remainingAmount) }]);
                                    } else {
                                      setMembershipSplits([{ payment_method: 'efectivo', amount: '' }]);
                                    }
                                  }}
                                  className={`text-left rounded-xl p-4 border transition-colors ${isSelected ? 'border-red-700/50 bg-red-950/20' : 'border-white/5 bg-[#111111] hover:border-white/10'}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-white font-semibold text-sm">{plan?.name ?? `Plan #${m.plan_id}`}</p>
                                      <p className="text-white/40 text-xs mt-0.5">
                                        Vence: {m.end_date ? new Date(m.end_date).toLocaleDateString('es-CO') : '—'}
                                      </p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${m.status === 'activa' ? 'bg-green-950/20 text-green-400 border-green-900/30' : 'bg-yellow-950/20 text-yellow-400 border-yellow-900/30'}`}>
                                      {m.status}
                                    </span>
                                  </div>
                                  {info && (
                                    <div className="mt-3 flex flex-col gap-1.5">
                                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                                        <div
                                          className="h-full rounded-full bg-red-600 transition-all"
                                          style={{ width: `${info.planPrice > 0 ? Math.min(100, (info.paidAmount / info.planPrice) * 100) : 0}%` }}
                                        />
                                      </div>
                                      <div className="flex justify-between text-[11px]">
                                        <span className="text-white/40">Pagado: {formatCurrency(info.paidAmount)}</span>
                                        <span className={info.isPaidInFull ? 'text-green-400' : 'text-red-400'}>
                                          {info.isPaidInFull ? '✓ Completo' : `Pendiente: ${formatCurrency(info.remainingAmount)}`}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Formulario de pago */}
                        {selectedMembership && !membershipInfoMap[selectedMembership.id]?.isPaidInFull && (
                          <form onSubmit={handleMembershipPay} className="flex flex-col gap-4 border-t border-white/5 pt-4">
                            <p className="text-white/40 text-[10px] uppercase tracking-widest">Métodos de pago</p>
                            {membershipSplits.map((row, i) => (
                              <div key={i} className="flex gap-2 items-center">
                                <select
                                  value={row.payment_method}
                                  onChange={e => updateSplitRow(i, 'payment_method', e.target.value)}
                                  className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-900/60 transition-colors"
                                >
                                  {PAYMENT_METHODS.map(pm => (
                                    <option key={pm} value={pm}>{pm.charAt(0).toUpperCase() + pm.slice(1)}</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  min="1"
                                  value={row.amount}
                                  onChange={e => updateSplitRow(i, 'amount', e.target.value)}
                                  placeholder="Monto"
                                  className={`${inputCls} flex-1`}
                                />
                                {membershipSplits.length > 1 && (
                                  <button type="button" onClick={() => removeSplitRow(i)} className="text-red-400/60 hover:text-red-400 transition-colors text-lg leading-none px-1">×</button>
                                )}
                              </div>
                            ))}
                            <button type="button" onClick={addSplitRow} className="text-white/40 hover:text-white/70 text-sm transition-colors text-left">+ Agregar método de pago</button>

                            <div className="flex flex-col gap-1">
                              <label className="text-white/40 text-[10px] uppercase tracking-widest">Notas (opcional)</label>
                              <input type="text" value={membershipNotes} onChange={e => setMembershipNotes(e.target.value)} placeholder="Abono enero..." className={inputCls} />
                            </div>

                            {membershipPayError && (
                              <div className="text-red-400 text-sm bg-red-950/20 border border-red-900/30 rounded-lg px-4 py-3">{membershipPayError}</div>
                            )}
                            {membershipPaySuccess && (
                              <div className="text-green-400 text-sm bg-green-950/20 border border-green-900/30 rounded-lg px-4 py-3">{membershipPaySuccess}</div>
                            )}

                            <button type="submit" disabled={membershipPayLoading} className="w-full bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors tracking-widest text-sm uppercase shadow-lg shadow-red-950/30">
                              {membershipPayLoading ? 'Registrando...' : 'Registrar pago'}
                            </button>
                          </form>
                        )}

                        {selectedMembership && membershipInfoMap[selectedMembership.id]?.isPaidInFull && (
                          <div className="text-green-400 text-sm bg-green-950/20 border border-green-900/30 rounded-lg px-4 py-3">✓ Esta membresía ya está pagada en su totalidad.</div>
                        )}
                      </div>
                    )}

                    {/* ── TAB: VENTA PRODUCTO ── */}
                    {activeTab === 'product' && (
                      <div className="flex flex-col gap-5">
                        <h3 className="text-xl font-bold text-white">Venta de producto</h3>

                        {/* Buscar producto */}
                        <div className="flex flex-col gap-1 relative">
                          <label className="text-white/40 text-[10px] uppercase tracking-widest">Buscar producto</label>
                          <input
                            type="text"
                            value={productSearch}
                            onChange={e => handleProductSearchChange(e.target.value)}
                            placeholder="Nombre del producto..."
                            className={inputCls}
                          />
                          {productSearchLoading && (
                            <p className="text-white/30 text-xs mt-1 animate-pulse">Buscando...</p>
                          )}
                          {productResults.length > 0 && !selectedProduct && (
                            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                              {productResults.map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedProduct(p);
                                    setProductSearch(p.name);
                                    setProductResults([]);
                                    setProductSellError('');
                                    setProductSellSuccess('');
                                  }}
                                  className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                >
                                  <div className="flex items-center justify-between">
                                    <p className="text-white text-sm font-medium">{p.name}</p>
                                    <p className="text-white/60 text-sm">{formatCurrency(p.price)}</p>
                                  </div>
                                  <p className="text-white/40 text-xs mt-0.5">Stock: {p.stock}</p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Producto seleccionado */}
                        {selectedProduct && (
                          <div className="rounded-xl border border-white/5 bg-[#111111] p-4 flex items-center justify-between">
                            <div>
                              <p className="text-white font-semibold">{selectedProduct.name}</p>
                              <p className="text-white/40 text-xs mt-0.5">Precio: {formatCurrency(selectedProduct.price)} · Stock: {selectedProduct.stock}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setSelectedProduct(null); setProductSearch(''); setProductSellError(''); setProductSellSuccess(''); }}
                              className="text-white/30 hover:text-white/70 transition-colors text-lg leading-none"
                            >
                              ×
                            </button>
                          </div>
                        )}

                        {selectedProduct && (
                          <form onSubmit={handleProductSell} className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1">
                                <label className="text-white/40 text-[10px] uppercase tracking-widest">Cantidad</label>
                                <input
                                  type="number"
                                  min="1"
                                  max={selectedProduct.stock}
                                  value={productQuantity}
                                  onChange={e => setProductQuantity(e.target.value)}
                                  className={inputCls}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-white/40 text-[10px] uppercase tracking-widest">Método de pago</label>
                                <select
                                  value={productPaymentMethod}
                                  onChange={e => setProductPaymentMethod(e.target.value as PaymentMethod)}
                                  className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-900/60 transition-colors w-full"
                                >
                                  {PAYMENT_METHODS.map(pm => (
                                    <option key={pm} value={pm}>{pm.charAt(0).toUpperCase() + pm.slice(1)}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="rounded-xl border border-white/5 bg-[#101010] px-4 py-3 text-sm text-white/60">
                              Total:{' '}
                              <span className="text-white font-semibold">
                                {formatCurrency(selectedProduct.price * (Number(productQuantity) || 0))}
                              </span>
                            </div>

                            {productSellError && (
                              <div className="text-red-400 text-sm bg-red-950/20 border border-red-900/30 rounded-lg px-4 py-3">{productSellError}</div>
                            )}
                            {productSellSuccess && (
                              <div className="text-green-400 text-sm bg-green-950/20 border border-green-900/30 rounded-lg px-4 py-3">{productSellSuccess}</div>
                            )}

                            <button type="submit" disabled={productSellLoading} className="w-full bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors tracking-widest text-sm uppercase shadow-lg shadow-red-950/30">
                              {productSellLoading ? 'Procesando...' : 'Registrar venta'}
                            </button>
                          </form>
                        )}

                        {!selectedProduct && !productSearch && (
                          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-white/30 text-sm">
                            Busca un producto por nombre para iniciar la venta.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── PANEL DERECHO: MOVIMIENTO MANUAL + CIERRE ── */}
                <div className="flex flex-col gap-6">
                  <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Movimientos manuales</p>
                      <h3 className="text-xl font-bold text-white">Registrar movimiento</h3>
                    </div>
                    <form onSubmit={handleCreateMovement} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-white/40 text-[10px] uppercase tracking-widest">Tipo de movimiento</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button type="button" onClick={() => setMovementForm(prev => ({ ...prev, movementType: 'ingreso' }))}
                            className={`py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-colors border ${movementForm.movementType === 'ingreso' ? 'bg-green-950/40 border-green-700/50 text-green-400' : 'bg-[#111111] border-[#2a2a2a] text-white/40 hover:text-white/70 hover:border-white/20'}`}>
                            Ingreso
                          </button>
                          <button type="button" onClick={() => setMovementForm(prev => ({ ...prev, movementType: 'egreso' }))}
                            className={`py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-colors border ${movementForm.movementType === 'egreso' ? 'bg-red-950/40 border-red-700/50 text-red-400' : 'bg-[#111111] border-[#2a2a2a] text-white/40 hover:text-white/70 hover:border-white/20'}`}>
                            Egreso
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-white/40 text-[10px] uppercase tracking-widest">Monto</label>
                        <input type="number" min="1" value={movementForm.amount} onChange={e => setMovementForm(prev => ({ ...prev, amount: e.target.value }))} placeholder="15000" className={inputCls} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-white/40 text-[10px] uppercase tracking-widest">Descripción</label>
                        <textarea rows={3} value={movementForm.description} onChange={e => setMovementForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder={movementForm.movementType === 'ingreso' ? 'Ingreso adicional de efectivo' : 'Compra implementos de limpieza'}
                          className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors resize-none w-full" />
                      </div>
                      {movementError && <div className="text-red-400 text-sm bg-red-950/20 border border-red-900/30 rounded-lg px-4 py-3">{movementError}</div>}
                      <button type="submit" disabled={movementLoading}
                        className={`w-full disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors tracking-widest text-sm uppercase shadow-lg ${movementForm.movementType === 'ingreso' ? 'bg-green-800 hover:bg-green-700 shadow-green-950/30' : 'bg-[#cc0000] hover:bg-red-700 shadow-red-950/30'}`}>
                        {movementLoading ? 'Guardando...' : movementForm.movementType === 'ingreso' ? 'Registrar ingreso' : 'Registrar egreso'}
                      </button>
                    </form>
                  </div>

                  <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Cierre</p>
                      <h3 className="text-xl font-bold text-white">Cerrar caja</h3>
                    </div>
                    <form onSubmit={handleCloseCash} className="flex flex-col gap-4">
                      <div className="rounded-xl border border-white/5 bg-[#101010] p-4 text-sm text-white/60">
                        Total esperado: <span className="text-white font-semibold">{formatCurrency(totals?.expected ?? 0)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-white/40 text-[10px] uppercase tracking-widest">Total real contado</label>
                        <input type="number" min="0" value={closeForm.closingBalance} onChange={e => setCloseForm(prev => ({ ...prev, closingBalance: e.target.value }))} placeholder="134000" className={inputCls} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-white/40 text-[10px] uppercase tracking-widest">Notas</label>
                        <textarea rows={3} value={closeForm.notes} onChange={e => setCloseForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Cierre turno tarde"
                          className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors resize-none w-full" />
                      </div>
                      {closeError && <div className="text-red-400 text-sm bg-red-950/20 border border-red-900/30 rounded-lg px-4 py-3">{closeError}</div>}
                      <button type="submit" disabled={closeLoading} className="w-full bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors tracking-widest text-sm uppercase shadow-lg shadow-red-950/30">
                        {closeLoading ? 'Cerrando...' : 'Cerrar caja'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}