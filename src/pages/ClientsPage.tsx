import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi, type Client } from '../api/user.api';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useFingerprint } from '../hooks/useFingerprint';
import { searchIcon } from '../assets/icons';
import Navbar from '../components/ui/Navbar';

export default function ClientsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const {
    isScanning,
    error: fpError,
    scanStep,
    captureOne,
    finishRegistration,
    resetRegistration,
    imageBase64,
    capturedTemplates,
  } = useFingerprint();

  const [loggingOut, setLoggingOut] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [enrollingClient, setEnrollingClient] = useState<Client | null>(null);
  const [fpSaved, setFpSaved] = useState(false);
  const [fpApiError, setFpApiError] = useState('');

  const handleOpenFpEnroll = (client: Client) => {
    setEnrollingClient(client);
    setFpSaved(false);
    setFpApiError('');
    resetRegistration();
  };

  const handleFpCaptureStep = async () => {
    const template = await captureOne();
    if (!template) return;

    const newTemplates = [...capturedTemplates, template];
    if (newTemplates.length >= 3) {
      const merged = await finishRegistration(newTemplates);
      if (!merged || !enrollingClient) return;

      try {
        await userApi.saveClientFingerprint(enrollingClient.id, merged);
        setFpSaved(true);
      } catch (err: unknown) {
        setFpApiError(err instanceof Error ? err.message : 'Error al guardar la huella.');
      }
    }
  };
  const [editForm, setEditForm] = useState({
    first_name: '',
    middle_name: '',
    paternal_last_name: '',
    maternal_last_name: '',
    age: '',
    email: '',
    phone: '',
    address: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const dark = darkMode;

  useEffect(() => {
    fetchClients();
  }, [page]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await userApi.getAllClients(page, 10);
      setClients(res.users);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    await new Promise(resolve => setTimeout(resolve, 2000));
    navigate('/login');
  };

  const filteredClients = clients.filter(c =>
    `${c.first_name} ${c.middle_name} ${c.paternal_last_name} ${c.maternal_last_name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setEditForm({
      first_name: client.first_name,
      middle_name: client.middle_name,
      paternal_last_name: client.paternal_last_name,
      maternal_last_name: client.maternal_last_name,
      age: String(client.age),
      email: client.email,
      phone: client.phone,
      address: client.address,
    });
    setEditError('');
  };

  const handleEditSave = async () => {
    if (!editingClient) return;
    setEditLoading(true);
    try {
      await userApi.updateClient(editingClient.id, {
        first_name: editForm.first_name,
        middle_name: editForm.middle_name,
        paternal_last_name: editForm.paternal_last_name,
        maternal_last_name: editForm.maternal_last_name,
        age: Number(editForm.age),
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address,
      });
      setEditingClient(null);
      fetchClients();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Error al actualizar.');
    } finally {
      setEditLoading(false);
    }
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
      <div className="px-8 pt-8 pb-4">
        <p className={`text-[10px] tracking-widest uppercase mb-0.5 ${dark ? 'text-white/30' : 'text-black/40'}`}>Gestión</p>
        <h1 className={`text-2xl font-bold tracking-wide ${dark ? 'text-white' : 'text-[#111]'}`}>Clientes</h1>
      </div>

      <main className="flex-1 flex flex-col">
        {/* Contenido */}
        <div className="flex-1 px-8 pb-8 flex flex-col gap-6">

          {/* Buscador + botón */}
          <div className="flex items-center justify-between gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border flex-1 max-w-sm transition-colors ${dark ? 'bg-[#111] border-white/5 focus-within:border-red-900/40' : 'bg-white border-black/10'}`}>
              <img src={searchIcon} alt="Search" className="w-5 h-5 text-white/30" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre..."
                className={`bg-transparent outline-none text-sm flex-1 ${dark ? 'text-white placeholder-white/20' : 'text-black placeholder-black/30'}`}
              />
            </div>
            <button
              onClick={() => navigate('/register-client')}
              className="bg-[#cc0000] hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg tracking-widest uppercase transition-colors shadow-lg shadow-red-950/30"
            >
              + Nuevo Cliente
            </button>
          </div>

          {/* Tabla */}
          <div className={`rounded-xl border overflow-hidden transition-colors duration-500 ${dark ? 'border-white/5' : 'border-black/10'}`}>

            {/* Header tabla */}
            <div className={`grid grid-cols-5 px-4 py-3 text-[10px] uppercase tracking-widest border-b ${dark ? 'bg-[#111] border-white/5 text-white/30' : 'bg-gray-50 border-black/10 text-black/40'}`}>
              <span>Nombre completo</span>
              <span>Email</span>
              <span>Teléfono</span>
              <span>Dirección</span>
              <span className="text-right">Acciones</span>
            </div>

            {loading ? (
              <div className={`px-4 py-8 text-center text-xs tracking-widest uppercase animate-pulse ${dark ? 'text-white/20' : 'text-black/20'}`}>
                Cargando clientes...
              </div>
            ) : filteredClients.length === 0 ? (
              <div className={`px-4 py-8 text-center text-xs tracking-widest uppercase ${dark ? 'text-white/15' : 'text-black/20'}`}>
                No se encontraron clientes
              </div>
            ) : (
              filteredClients.map((client, i) => (
                <div
                  key={client.id}
                  className={`grid grid-cols-5 px-4 py-3 items-center text-sm border-b transition-colors ${dark
                      ? `border-white/5 ${i % 2 === 0 ? 'bg-[#0f0f0f]' : 'bg-[#111]'} hover:bg-white/[0.03]`
                      : `border-black/5 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`
                    }`}
                >
                  <span className={`font-medium truncate ${dark ? 'text-white/80' : 'text-black/80'}`}>
                    {client.first_name} {client.middle_name} {client.paternal_last_name} {client.maternal_last_name}
                  </span>
                  <span className={`truncate text-xs ${dark ? 'text-white/40' : 'text-black/40'}`}>{client.email}</span>
                  <span className={`truncate text-xs ${dark ? 'text-white/40' : 'text-black/40'}`}>{client.phone}</span>
                  <span className={`truncate text-xs ${dark ? 'text-white/40' : 'text-black/40'}`}>{client.address}</span>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(client)}
                      className={`text-[10px] px-3 py-1 rounded-lg border tracking-wide transition-colors cursor-pointer ${dark ? 'border-white/10 text-white/40 hover:border-red-900/50 hover:text-red-400 hover:bg-red-950/10' : 'border-black/10 text-black/40 hover:border-red-300 hover:text-red-600'}`}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleOpenFpEnroll(client)}
                      className={`text-[10px] px-3 py-1 rounded-lg border tracking-wide transition-colors cursor-pointer ${dark ? 'border-white/10 text-white/40 hover:border-red-900/50 hover:text-red-400 hover:bg-red-950/10' : 'border-black/10 text-black/40 hover:border-red-300 hover:text-red-600'}`}
                    >
                      Huella
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`text-xs px-3 py-1 rounded-lg border transition-colors disabled:opacity-30 ${dark ? 'border-white/10 text-white/40 hover:border-red-900/40 hover:text-red-400' : 'border-black/10 text-black/40'}`}
              >
                ← Anterior
              </button>
              <span className={`text-xs ${dark ? 'text-white/30' : 'text-black/30'}`}>{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`text-xs px-3 py-1 rounded-lg border transition-colors disabled:opacity-30 ${dark ? 'border-white/10 text-white/40 hover:border-red-900/40 hover:text-red-400' : 'border-black/10 text-black/40'}`}
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal editar */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditingClient(null)} />
          <div className={`relative z-10 rounded-2xl p-6 w-full max-w-md border shadow-2xl flex flex-col gap-4 ${dark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-black/10'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`font-bold tracking-wide ${dark ? 'text-white' : 'text-black'}`}>Editar Cliente</h2>
              <button onClick={() => setEditingClient(null)} className={`text-xs ${dark ? 'text-white/30 hover:text-white/60' : 'text-black/30 hover:text-black/60'}`}>✕</button>
            </div>

            <div className={`w-full h-px ${dark ? 'bg-red-900/30' : 'bg-black/10'}`} />

            {/* Nombres en grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'first_name', label: 'Primer nombre', placeholder: 'Juan' },
                { name: 'middle_name', label: 'Segundo nombre', placeholder: 'Carlos' },
                { name: 'paternal_last_name', label: 'Apellido paterno', placeholder: 'Pérez' },
                { name: 'maternal_last_name', label: 'Apellido materno', placeholder: 'García' },
              ].map(field => (
                <div key={field.name} className="flex flex-col gap-1">
                  <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/40'}`}>{field.label}</label>
                  <input
                    type="text"
                    value={editForm[field.name as keyof typeof editForm]}
                    onChange={e => setEditForm(prev => ({ ...prev, [field.name]: e.target.value }))}
                    placeholder={field.placeholder}
                    className={`rounded-lg px-3 py-2 text-sm outline-none border transition-colors ${dark ? 'bg-[#111] border-[#2a2a2a] text-white placeholder-white/20 focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black focus:border-red-300'}`}
                  />
                </div>
              ))}
            </div>

            {/* Resto de campos */}
            {[
              { name: 'age', label: 'Edad', placeholder: '25', type: 'number' },
              { name: 'email', label: 'Email', placeholder: 'cliente@email.com', type: 'email' },
              { name: 'phone', label: 'Teléfono', placeholder: '3001234567' },
              { name: 'address', label: 'Dirección', placeholder: 'Calle 123...' },
            ].map(field => (
              <div key={field.name} className="flex flex-col gap-1">
                <label className={`text-[10px] uppercase tracking-widest ${dark ? 'text-white/40' : 'text-black/40'}`}>{field.label}</label>
                <input
                  type={field.type ?? 'text'}
                  value={editForm[field.name as keyof typeof editForm]}
                  onChange={e => setEditForm(prev => ({ ...prev, [field.name]: e.target.value }))}
                  placeholder={field.placeholder}
                  className={`rounded-lg px-4 py-2.5 text-sm outline-none border transition-colors ${dark ? 'bg-[#111] border-[#2a2a2a] text-white placeholder-white/20 focus:border-red-900/60' : 'bg-gray-50 border-black/10 text-black focus:border-red-300'}`}
                />
              </div>
            ))}

            {editError && <p className="text-red-500 text-xs text-center bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">{editError}</p>}

            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setEditingClient(null)}
                className={`flex-1 py-2 rounded-lg text-xs border tracking-wide transition-colors ${dark ? 'border-white/10 text-white/40 hover:bg-white/5' : 'border-black/10 text-black/40 hover:bg-gray-50'}`}
              >
                Cancelar
              </button>
              <button
                onClick={handleEditSave}
                disabled={editLoading}
                className="flex-1 py-2 rounded-lg text-xs bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold tracking-widest uppercase transition-colors"
              >
                {editLoading ? 'Guardando...' : 'Guardar →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Huella */}
      {enrollingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !isScanning && setEnrollingClient(null)} />
          <div className={`relative z-10 rounded-2xl p-8 w-full max-w-md shadow-2xl flex flex-col items-center gap-6 border transition-colors ${dark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-black/10'}`}>
            
            <div className="flex items-center justify-between w-full">
              <h2 className={`font-bold tracking-wide ${dark ? 'text-white' : 'text-black'}`}>Registrar Huella</h2>
              <button 
                disabled={isScanning}
                onClick={() => setEnrollingClient(null)} 
                className={`text-xs cursor-pointer disabled:opacity-40 ${dark ? 'text-white/30 hover:text-white/60' : 'text-black/30 hover:text-black/60'}`}
              >
                ✕
              </button>
            </div>

            <div className={`w-full h-px ${dark ? 'bg-red-900/30' : 'bg-red-200'}`} />

            {fpSaved ? (
              <div className="flex flex-col items-center gap-4 py-4 w-full">
                <div className="w-16 h-16 rounded-full border border-red-900/40 flex items-center justify-center drop-shadow-[0_0_15px_rgba(180,0,0,0.3)]">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className={`text-xl font-bold tracking-wide ${dark ? 'text-white' : 'text-black'}`}>¡Huella guardada!</h1>
                <p className={`text-xs text-center tracking-wider ${dark ? 'text-white/30' : 'text-black/45'}`}>
                  La huella de {enrollingClient.first_name} {enrollingClient.paternal_last_name} fue guardada correctamente.
                </p>
                <button
                  onClick={() => setEnrollingClient(null)}
                  className="w-full bg-[#cc0000] hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition-colors tracking-widest text-sm uppercase shadow-lg shadow-red-950/30 cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                {/* Icono huella */}
                <div className={`w-20 h-20 rounded-full border flex items-center justify-center transition-all duration-300 ${
                  isScanning
                    ? 'border-red-500/60 drop-shadow-[0_0_20px_rgba(200,0,0,0.4)] animate-pulse'
                    : dark ? 'border-[#2a2a2a]' : 'border-black/15'
                }`}>
                  <svg className={`w-10 h-10 ${dark ? 'text-white/60' : 'text-black/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                      d="M12 11c0-1.657-1.343-3-3-3S6 9.343 6 11c0 3.866 2.686 7 6 7s6-3.134 6-7c0-3.314-2.686-6-6-6-1.86 0-3.527.848-4.647 2.183" />
                  </svg>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <p className={`text-xs text-center tracking-wider ${dark ? 'text-white/30' : 'text-black/45'}`}>
                    Se necesitan 3 capturas del mismo dedo para el cliente:
                  </p>
                  <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-black'}`}>
                    {enrollingClient.first_name} {enrollingClient.paternal_last_name}
                  </p>
                </div>

                {/* Debug Visual de Huella */}
                {imageBase64 ? (
                  <div className={`w-28 h-36 border rounded-xl p-1.5 flex items-center justify-center shadow-lg overflow-hidden ${dark ? 'border-red-900/30 bg-black/60 shadow-red-950/20 filter invert' : 'border-red-200 bg-gray-50 shadow-black/5'}`}>
                    <img
                      src={`data:image/png;base64,${imageBase64}`}
                      alt="Huella capturada"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className={`w-28 h-36 border rounded-xl flex items-center justify-center ${dark ? 'border-[#2a2a2a] bg-black/20' : 'border-black/10 bg-gray-50'}`}>
                    <span className={`text-[10px] uppercase tracking-widest text-center px-4 ${dark ? 'text-white/20' : 'text-black/40'}`}>
                      Esperando captura...
                    </span>
                  </div>
                )}

                {/* Indicador de progreso */}
                <div className="flex gap-3 items-center">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      scanStep >= i
                        ? 'border-red-500 bg-red-950/40 text-red-400'
                        : dark
                          ? 'border-[#2a2a2a] text-white/20'
                          : 'border-black/10 text-black/30'
                    }`}>
                      {scanStep > i ? '✓' : i}
                    </div>
                  ))}
                </div>

                {/* Estado del escaneo */}
                <p className={`text-sm text-center min-h-[20px] ${dark ? 'text-white/50' : 'text-black/60'}`}>
                  {isScanning
                    ? 'Capturando... mantén el dedo firme en el lector'
                    : scanStep === 0
                      ? 'Pon el dedo en el lector y presiona el botón'
                      : scanStep < 3
                        ? 'Levanta el dedo, vuelve a ponerlo y presiona de nuevo'
                        : 'Guardando huella...'}
                </p>

                {fpError && (
                  <div className="flex flex-col gap-2 w-full">
                    <p className="text-red-500 text-xs text-center bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">
                      {fpError}
                    </p>
                    {scanStep > 0 && (
                      <button
                        onClick={resetRegistration}
                        className={`text-xs transition-colors cursor-pointer ${dark ? 'text-white/40 hover:text-white/60' : 'text-black/50 hover:text-black/70'}`}
                      >
                        Empezar de nuevo
                      </button>
                    )}
                  </div>
                )}

                {fpApiError && (
                  <p className="text-red-500 text-xs text-center bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2 w-full">
                    {fpApiError}
                  </p>
                )}

                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={handleFpCaptureStep}
                    disabled={isScanning || scanStep >= 3}
                    className="w-full bg-[#cc0000] hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors tracking-widest text-sm uppercase shadow-lg shadow-red-950/30 cursor-pointer"
                  >
                    {isScanning
                      ? 'Capturando...'
                      : scanStep >= 3
                        ? 'Procesando...'
                        : `Capturar (${scanStep + 1} de 3) →`}
                  </button>

                  <button
                    onClick={() => setEnrollingClient(null)}
                    disabled={isScanning}
                    className={`w-full text-xs transition-colors tracking-wider py-1 cursor-pointer ${dark ? 'text-white/25 hover:text-white/50' : 'text-black/45 hover:text-black/75'}`}
                  >
                    Cancelar
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