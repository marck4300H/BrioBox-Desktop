import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { userApi } from '../api/user.api';
import { http } from '../api/client';
import Navbar from '../components/ui/Navbar';
import type { Employee } from '../types';

const ALL_PERMISSIONS = [
  { key: 'cash_register.open', label: 'Caja — Abrir' },
  { key: 'cash_register.close', label: 'Caja — Cerrar' },
  { key: 'cash_register.movements', label: 'Caja — Movimientos' },
  { key: 'cash_register.view', label: 'Caja — Ver' },
  { key: 'memberships.create', label: 'Membresías — Crear' },
  { key: 'memberships.manage', label: 'Membresías — Gestionar' },
  { key: 'payments.register', label: 'Pagos — Registrar' },
  { key: 'users.create', label: 'Usuarios — Crear' },
  { key: 'users.manage', label: 'Usuarios — Gestionar' },
  { key: 'clients.manage', label: 'Clientes — Gestionar' },
  { key: 'products.manage', label: 'Productos — Gestionar' },
  { key: 'suppliers.manage', label: 'Proveedores — Gestionar' },
];

interface UserPermission {
  id: number;
  user_id: number;
  permission: string;
  granted_by: number;
  created_at: string;
}

export default function EmployeesPage() {
  const { darkMode } = useTheme();
  const dark = darkMode;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [empPermissions, setEmpPermissions] = useState<string[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [savingPerm, setSavingPerm] = useState<string | null>(null);
  const [permError, setPermError] = useState<string | null>(null);

  useEffect(() => {
    userApi.getEmployees()
      .then(res => setEmployees(res.users))
      .catch(() => setError('No se pudieron cargar los empleados.'))
      .finally(() => setIsLoading(false));
  }, []);

  const fetchPermissions = (emp: Employee) => {
    setSelectedEmployee(emp);
    setPermError(null);
    setLoadingPerms(true);
    http.get<{ success: boolean; data: UserPermission[] }>(`/permissions/${emp.id}`)
      .then(res => setEmpPermissions(res.data.map(p => p.permission)))
      .catch(() => setPermError('No se pudieron cargar los permisos.'))
      .finally(() => setLoadingPerms(false));
  };

  const togglePermission = async (permKey: string) => {
    if (!selectedEmployee) return;
    setSavingPerm(permKey);
    setPermError(null);

    const hasPermission = empPermissions.includes(permKey);

    try {
      if (hasPermission) {
        await http.delete(`/permissions/${selectedEmployee.id}/${permKey}`);
        setEmpPermissions(prev => prev.filter(p => p !== permKey));
      } else {
        await http.post(`/permissions/${selectedEmployee.id}`, { permission: permKey });
        setEmpPermissions(prev => [...prev, permKey]);
      }
    } catch (err: unknown) {
      setPermError(err instanceof Error ? err.message : 'Error al actualizar el permiso.');
    } finally {
      setSavingPerm(null);
    }
  };

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`min-h-screen flex flex-col ${dark ? 'bg-[#0a0a0a] text-white' : 'bg-[#f5f5f5] text-[#111]'}`}>
      <Navbar />

      <main className="flex-1 p-8 w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-[#111]'}`}>
              Empleados
            </h1>
            <p className={`text-sm mt-0.5 ${dark ? 'text-white/40' : 'text-black/45'}`}>
              Selecciona un empleado para gestionar sus permisos
            </p>
          </div>

          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`px-4 py-2 rounded-lg text-sm border outline-none transition-colors w-64
              ${dark
                ? 'bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-red-900/50'
                : 'bg-white border-black/10 text-[#111] placeholder:text-black/30 focus:border-red-300'
              }`}
          />
        </div>

        <div className="flex gap-6 items-start">

          {/* ── TABLA DE EMPLEADOS ── */}
          <div className={`flex-1 rounded-xl border overflow-hidden ${dark ? 'border-white/8' : 'border-black/8'}`}>
            {isLoading && (
              <div className={`text-center py-16 text-sm ${dark ? 'text-white/30' : 'text-black/35'}`}>
                Cargando empleados...
              </div>
            )}

            {error && (
              <div className={`text-center py-16 text-sm ${dark ? 'text-red-400' : 'text-red-600'}`}>
                {error}
              </div>
            )}

            {!isLoading && !error && filtered.length === 0 && (
              <div className={`text-center py-16 text-sm ${dark ? 'text-white/30' : 'text-black/35'}`}>
                No se encontraron empleados.
              </div>
            )}

            {!isLoading && !error && filtered.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b text-xs tracking-widest uppercase ${dark ? 'bg-white/3 border-white/8 text-white/35' : 'bg-black/3 border-black/8 text-black/40'}`}>
                    <th className="text-left px-5 py-3 font-medium">Nombre</th>
                    <th className="text-left px-5 py-3 font-medium">Email</th>
                    <th className="text-left px-5 py-3 font-medium">Registrado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp, i) => {
                    const isSelected = selectedEmployee?.id === emp.id;
                    return (
                      <tr
                        key={emp.id}
                        onClick={() => fetchPermissions(emp)}
                        className={`border-b transition-colors cursor-pointer ${
                          isSelected
                            ? dark
                              ? 'bg-red-950/20 border-red-900/30'
                              : 'bg-red-50 border-red-200'
                            : dark
                              ? `border-white/5 ${i % 2 === 0 ? '' : 'bg-white/2'} hover:bg-white/4`
                              : `border-black/5 ${i % 2 === 0 ? '' : 'bg-black/2'} hover:bg-black/3`
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              dark ? 'bg-red-950/50 text-red-400' : 'bg-red-50 text-red-600'
                            }`}>
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{emp.name}</span>
                          </div>
                        </td>
                        <td className={`px-5 py-3.5 ${dark ? 'text-white/55' : 'text-black/55'}`}>{emp.email}</td>
                        <td className={`px-5 py-3.5 ${dark ? 'text-white/35' : 'text-black/35'}`}>
                          {new Date(emp.created_at).toLocaleDateString('es-MX', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ── PANEL DE PERMISOS ── */}
          <div className={`w-80 flex-shrink-0 rounded-xl border transition-all ${dark ? 'border-white/8 bg-white/2' : 'border-black/8 bg-white'}`}>
            {!selectedEmployee ? (
              <div className={`flex flex-col items-center justify-center py-16 px-6 text-center gap-3 ${dark ? 'text-white/25' : 'text-black/30'}`}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <p className="text-sm">Selecciona un empleado para ver y editar sus permisos</p>
              </div>
            ) : (
              <div className="p-5">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/8">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    dark ? 'bg-red-950/50 text-red-400' : 'bg-red-50 text-red-600'
                  }`}>
                    {selectedEmployee.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-semibold text-sm truncate ${dark ? 'text-white' : 'text-[#111]'}`}>
                      {selectedEmployee.name}
                    </p>
                    <p className={`text-xs truncate ${dark ? 'text-white/40' : 'text-black/40'}`}>
                      {selectedEmployee.email}
                    </p>
                  </div>
                </div>

                <p className={`text-xs font-medium tracking-widest uppercase mb-3 ${dark ? 'text-white/30' : 'text-black/35'}`}>
                  Permisos
                </p>

                {permError && (
                  <p className={`text-xs mb-3 ${dark ? 'text-red-400' : 'text-red-600'}`}>{permError}</p>
                )}

                {loadingPerms ? (
                  <div className={`text-center py-8 text-sm ${dark ? 'text-white/30' : 'text-black/35'}`}>
                    Cargando...
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {ALL_PERMISSIONS.map(perm => {
                      const active = empPermissions.includes(perm.key);
                      const loading = savingPerm === perm.key;
                      return (
                        <button
                          key={perm.key}
                          onClick={() => togglePermission(perm.key)}
                          disabled={loading}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                            active
                              ? dark
                                ? 'bg-red-950/30 border border-red-900/40 text-red-300'
                                : 'bg-red-50 border border-red-200 text-red-700'
                              : dark
                                ? 'bg-white/3 border border-white/6 text-white/50 hover:bg-white/6 hover:text-white/75'
                                : 'bg-black/3 border border-black/6 text-black/45 hover:bg-black/6 hover:text-black/70'
                          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span className="text-xs">{perm.label}</span>
                          {loading ? (
                            <svg className="animate-spin w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : active ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 opacity-30">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}