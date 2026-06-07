import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  cashRegisterApi,
  type CashMovement,
  type CashSummary,
  type CashSession,
} from '../api/cashRegister.api';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/ui/Navbar';

interface CurrentSessionState {
  session: CashSession;
  movements: CashMovement[];
  summary: CashSummary;
}

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export default function CashRegisterPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { darkMode } = useTheme();

  const [loggingOut, setLoggingOut] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [currentSession, setCurrentSession] = useState<CurrentSessionState | null>(null);
  const [pageError, setPageError] = useState('');

  const [openForm, setOpenForm] = useState({
    openingBalance: '',
    notes: '',
  });
  const [movementForm, setMovementForm] = useState({
    amount: '',
    description: '',
  });
  const [closeForm, setCloseForm] = useState({
    closingBalance: '',
    notes: '',
  });

  const [openLoading, setOpenLoading] = useState(false);
  const [movementLoading, setMovementLoading] = useState(false);
  const [closeLoading, setCloseLoading] = useState(false);

  const [openError, setOpenError] = useState('');
  const [movementError, setMovementError] = useState('');
  const [closeError, setCloseError] = useState('');

  const dark = darkMode;

  const formatCurrency = (value: number | null) =>
    currencyFormatter.format(value ?? 0);

  const formatDateTime = (value?: string | null) => {
    if (!value) return '—';

    return new Date(value).toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const loadCurrentSession = async () => {
    setLoadingCurrent(true);
    setPageError('');

    try {
      const response = await cashRegisterApi.getCurrent();
      const payload = response?.data;

      if (!payload || !payload.session) {
        setCurrentSession(null);
        setCloseForm(prev => ({
          ...prev,
          closingBalance: '',
        }));
        return;
      }

      const movements = Array.isArray(payload.movements) ? payload.movements : [];

      const summary = payload.summary ?? {
        openingBalance: payload.session.opening_balance ?? 0,
        totalIncome: 0,
        totalExpense: 0,
        expectedBalance: payload.session.opening_balance ?? 0,
        closingBalance: payload.session.closing_balance ?? null,
        difference: null,
      };

      setCurrentSession({
        session: payload.session,
        movements,
        summary,
      });

      setCloseForm(prev => ({
        ...prev,
        closingBalance:
          summary.expectedBalance != null
            ? String(summary.expectedBalance)
            : '',
      }));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar la sesión de caja.';

      if (message.toLowerCase().includes('no hay ninguna sesión de caja abierta')) {
        setCurrentSession(null);
        setCloseForm(prev => ({
          ...prev,
          closingBalance: '',
        }));
      } else {
        setPageError(message);
      }
    } finally {
      setLoadingCurrent(false);
    }
  };

  useEffect(() => {
    loadCurrentSession();
  }, []);

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
      const message =
        err instanceof Error ? err.message : 'No se pudo abrir la caja.';

      setOpenError(message);

      if (message.toLowerCase().includes('ya existe una caja abierta')) {
        await loadCurrentSession();
      }
    } finally {
      setOpenLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setMovementError('');

    if (!currentSession?.session?.id) {
      setMovementError('No hay una sesión de caja activa.');
      return;
    }

    if (!movementForm.amount || Number(movementForm.amount) <= 0) {
      setMovementError('El valor del egreso debe ser mayor a cero.');
      return;
    }

    if (!movementForm.description.trim()) {
      setMovementError('La descripción del egreso es obligatoria.');
      return;
    }

    setMovementLoading(true);

    try {
      await cashRegisterApi.createMovement({
        sessionId: currentSession.session.id,
        movementType: 'egreso',
        amount: Number(movementForm.amount),
        description: movementForm.description.trim(),
      });

      setMovementForm({ amount: '', description: '' });
      await loadCurrentSession();
    } catch (err: unknown) {
      setMovementError(
        err instanceof Error ? err.message : 'No se pudo registrar el movimiento.'
      );
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
      counted:
        currentSession.summary.closingBalance ??
        (closeForm.closingBalance ? Number(closeForm.closingBalance) : null),
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
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cash-register-report-session-${currentSession.session.id}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

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
            Finance
          </p>
          <h1 className={`text-2xl font-bold tracking-wide ${dark ? 'text-white' : 'text-[#111]'}`}>
            Cuadre de caja
          </h1>
        </div>

        <div className="relative z-10 flex-1 p-8 flex flex-col gap-6">
          {pageError && (
            <div className="text-red-400 text-sm bg-red-950/20 border border-red-900/30 rounded-xl px-4 py-3">
              {pageError}
            </div>
          )}

          {loadingCurrent ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white/30 text-xs tracking-[0.4em] uppercase animate-pulse">
                Cargando caja...
              </p>
            </div>
          ) : !currentSession ? (
            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
              <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
                    Apertura
                  </p>
                  <h2 className="text-2xl font-bold text-white">Abrir caja</h2>
                  <p className="text-sm text-white/40 mt-1">
                    Registra el monto inicial para comenzar el turno.
                  </p>
                </div>

                <form onSubmit={handleOpenCash} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-white/40 text-[10px] uppercase tracking-widest">
                      Monto inicial
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={openForm.openingBalance}
                      onChange={e =>
                        setOpenForm(prev => ({ ...prev, openingBalance: e.target.value }))
                      }
                      placeholder="100000"
                      className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-white/40 text-[10px] uppercase tracking-widest">
                      Notes
                    </label>
                    <textarea
                      rows={4}
                      value={openForm.notes}
                      onChange={e => setOpenForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Apertura turno mañana"
                      className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors resize-none"
                    />
                  </div>

                  {openError && (
                    <div className="text-red-400 text-sm bg-red-950/20 border border-red-900/30 rounded-lg px-4 py-3">
                      {openError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={openLoading}
                    className="w-full bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors tracking-widest text-sm uppercase shadow-lg shadow-red-950/30"
                  >
                    {openLoading ? 'Abriendo...' : 'Abrir caja'}
                  </button>
                </form>
              </div>

              <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
                <p className="text-[10px] uppercase tracking-widest text-white/30">
                  Estado
                </p>
                <h3 className="text-xl font-bold text-white">No hay caja abierta</h3>
                <p className="text-sm text-white/40">
                  Para comenzar a registrar egresos y visualizar el resumen del día,
                  primero debes abrir una sesión de caja.
                </p>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="rounded-xl border border-white/5 bg-[#101010] p-4">
                    <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
                      Session
                    </p>
                    <p className="text-white font-semibold">Pendiente</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-[#101010] p-4">
                    <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
                      Expected
                    </p>
                    <p className="text-white font-semibold">{formatCurrency(0)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
                    Sesión activa
                  </p>
                  <h2 className="text-2xl font-bold text-white">
                    Caja #{currentSession.session.id}
                  </h2>
                  <p className="text-sm text-white/40 mt-1">
                    Abierta el {formatDateTime(currentSession.session.opened_at)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={loadCurrentSession}
                    className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-red-900/40 hover:bg-white/5 transition-all text-sm"
                  >
                    Recargar
                  </button>

                  <button
                    onClick={exportDayReport}
                    className="px-5 py-2.5 rounded-lg bg-[#1b1b1b] border border-white/10 hover:border-red-900/40 hover:bg-white/5 text-white font-semibold tracking-wide text-sm transition-colors"
                  >
                    Exportar reporte
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                <div className="rounded-xl p-5 border bg-[#141414] border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
                    Apertura
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(totals?.opening ?? 0)}
                  </p>
                </div>

                <div className="rounded-xl p-5 border bg-[#141414] border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
                    Ingresos
                  </p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrency(totals?.income ?? 0)}
                  </p>
                </div>

                <div className="rounded-xl p-5 border bg-[#141414] border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
                    Egresos
                  </p>
                  <p className="text-2xl font-bold text-red-400">
                    {formatCurrency(totals?.expense ?? 0)}
                  </p>
                </div>

                <div className="rounded-xl p-5 border bg-[#141414] border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
                    Esperado
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(totals?.expected ?? 0)}
                  </p>
                </div>

                <div className="rounded-xl p-5 border bg-[#141414] border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
                    Diferencia
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      (totals?.difference ?? 0) > 0
                        ? 'text-green-400'
                        : (totals?.difference ?? 0) < 0
                          ? 'text-red-400'
                          : 'text-white'
                    }`}
                  >
                    {formatCurrency(totals?.difference ?? 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
                        Movimientos
                      </p>
                      <h3 className="text-xl font-bold text-white">
                        Resumen del día
                      </h3>
                    </div>
                    <span className="text-xs uppercase tracking-widest text-white/30">
                      {currentSession.movements.length} registros
                    </span>
                  </div>

                  {currentSession.movements.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-white/30 text-sm">
                      No hay movimientos registrados en esta sesión.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-white/5">
                      <table className="w-full min-w-[700px] text-sm">
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
                            <tr
                              key={movement.id}
                              className="border-t border-white/5 hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="px-4 py-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                                    movement.movement_type === 'ingreso'
                                      ? 'bg-green-950/20 text-green-400 border-green-900/30'
                                      : 'bg-red-950/20 text-red-400 border-red-900/30'
                                  }`}
                                >
                                  {movement.movement_type}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-white font-medium">
                                {formatCurrency(movement.amount)}
                              </td>
                              <td className="px-4 py-4 text-white/70">
                                {movement.description}
                              </td>
                              <td className="px-4 py-4 text-white/50 text-xs">
                                {formatDateTime(movement.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-6">
                  <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
                        Egresos manuales
                      </p>
                      <h3 className="text-xl font-bold text-white">
                        Registrar egreso
                      </h3>
                    </div>

                    <form onSubmit={handleCreateExpense} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-white/40 text-[10px] uppercase tracking-widest">
                          Monto
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={movementForm.amount}
                          onChange={e =>
                            setMovementForm(prev => ({ ...prev, amount: e.target.value }))
                          }
                          placeholder="15000"
                          className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-white/40 text-[10px] uppercase tracking-widest">
                          Descripción
                        </label>
                        <textarea
                          rows={3}
                          value={movementForm.description}
                          onChange={e =>
                            setMovementForm(prev => ({ ...prev, description: e.target.value }))
                          }
                          placeholder="Compra implementos de limpieza"
                          className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors resize-none"
                        />
                      </div>

                      {movementError && (
                        <div className="text-red-400 text-sm bg-red-950/20 border border-red-900/30 rounded-lg px-4 py-3">
                          {movementError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={movementLoading}
                        className="w-full bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors tracking-widest text-sm uppercase shadow-lg shadow-red-950/30"
                      >
                        {movementLoading ? 'Guardando...' : 'Registrar egreso'}
                      </button>
                    </form>
                  </div>

                  <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
                        Cierre
                      </p>
                      <h3 className="text-xl font-bold text-white">
                        Cerrar caja
                      </h3>
                    </div>

                    <form onSubmit={handleCloseCash} className="flex flex-col gap-4">
                      <div className="rounded-xl border border-white/5 bg-[#101010] p-4 text-sm text-white/60">
                        Total esperado: <span className="text-white font-semibold">{formatCurrency(totals?.expected ?? 0)}</span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-white/40 text-[10px] uppercase tracking-widest">
                          Total real contado
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={closeForm.closingBalance}
                          onChange={e =>
                            setCloseForm(prev => ({
                              ...prev,
                              closingBalance: e.target.value,
                            }))
                          }
                          placeholder="134000"
                          className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-white/40 text-[10px] uppercase tracking-widest">
                          Notes
                        </label>
                        <textarea
                          rows={3}
                          value={closeForm.notes}
                          onChange={e =>
                            setCloseForm(prev => ({ ...prev, notes: e.target.value }))
                          }
                          placeholder="Cierre turno mañana"
                          className="bg-[#111111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-900/60 transition-colors resize-none"
                        />
                      </div>

                      {closeError && (
                        <div className="text-red-400 text-sm bg-red-950/20 border border-red-900/30 rounded-lg px-4 py-3">
                          {closeError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={closeLoading}
                        className="w-full bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors tracking-widest text-sm uppercase shadow-lg shadow-red-950/30"
                      >
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