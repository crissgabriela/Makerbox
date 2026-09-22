'use client';

import React, { useState, useEffect } from 'react';
import { Solicitud3D, EstadoSolicitud, Material3D, CARRERAS_Y_UNIDADES } from '@/types';
import { StatusBadge } from './StatusBadge';
import { ModelViewer3D } from './ModelViewer3D';
import { QuickContactModal } from './QuickContactModal';
import { downloadExcelInBrowser } from '@/lib/excel-export';
import {
  Search,
  Filter,
  Download,
  Eye,
  MessageSquare,
  FileSpreadsheet,
  Lock,
  Unlock,
  Layers,
  Box,
  CheckCircle2,
  Clock,
  Play,
  PackageCheck,
  AlertCircle,
  X,
  Printer,
  Sparkles,
  RefreshCw,
  Info,
  GraduationCap,
  FolderArchive
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [solicitudes, setSolicitudes] = useState<Solicitud3D[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [filterMaterial, setFilterMaterial] = useState<string>('todos');
  const [filterCarrera, setFilterCarrera] = useState<string>('todos');

  // Modales
  const [inspectingItem, setInspectingItem] = useState<Solicitud3D | null>(null);
  const [contactingItem, setContactingItem] = useState<Solicitud3D | null>(null);
  const [editingItem, setEditingItem] = useState<Solicitud3D | null>(null);

  // Cargar solicitudes
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/requests');
      if (res.ok) {
        const data = await res.json();
        setSolicitudes(data.requests || []);
      }
    } catch (err) {
      console.error('Error cargando solicitudes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRequests();
    }
  }, [isAuthenticated]);

  // Manejo de autenticación por PIN
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === '1234' || pinInput.trim() === '2026' || pinInput.trim().toLowerCase() === 'makerbox') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Actualizar estado en servidor
  const handleUpdateStatus = async (id: string, nuevoEstado: EstadoSolicitud) => {
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (res.ok) {
        setSolicitudes((prev) =>
          prev.map((s) => (s.id === id ? { ...s, estado: nuevoEstado, updatedAt: new Date().toISOString() } : s))
        );
      }
    } catch (err) {
      console.error('Error actualizando estado:', err);
    }
  };

  // Guardar asignación de máquina, gramos y horas
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const res = await fetch(`/api/requests/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          impresoraAsignada: editingItem.impresoraAsignada,
          gramosEstimados: editingItem.gramosEstimados,
          tiempoEstimadoHoras: editingItem.tiempoEstimadoHoras,
          notasStaff: editingItem.notasStaff
        })
      });
      if (res.ok) {
        setSolicitudes((prev) =>
          prev.map((s) => (s.id === editingItem.id ? editingItem : s))
        );
        setEditingItem(null);
      }
    } catch (err) {
      console.error('Error guardando detalles técnicos:', err);
    }
  };

  // Filtros combinados
  const filteredSolicitudes = solicitudes.filter((s) => {
    const matchesSearch =
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.archivoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.carrera && s.carrera.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.observaciones && s.observaciones.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesEstado = filterEstado === 'todos' || s.estado === filterEstado;
    const matchesMaterial = filterMaterial === 'todos' || s.material === filterMaterial;
    const matchesCarrera = filterCarrera === 'todos' || s.carrera === filterCarrera;

    return matchesSearch && matchesEstado && matchesMaterial && matchesCarrera;
  });

  // Métricas
  const countPendientes = solicitudes.filter((s) => s.estado === 'pendiente').length;
  const countEvaluacion = solicitudes.filter((s) => s.estado === 'en_evaluacion').length;
  const countImprimiendo = solicitudes.filter((s) => s.estado === 'en_impresion').length;
  const countListas = solicitudes.filter((s) => s.estado === 'lista_retiro').length;
  const totalGramos = solicitudes.reduce((acc, curr) => acc + (curr.gramosEstimados || 0), 0);

  // Pantalla de Bloqueo por PIN
  if (!isAuthenticated) {
    return (
      <div className="max-w-md w-full mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center mb-4 text-purple-700">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-1">Acceso Equipo Makerbox</h2>
        <p className="text-xs text-slate-500 mb-6">
          Ingresa el PIN de seguridad del laboratorio para acceder a la gestión de solicitudes 3D.
        </p>

        <form onSubmit={handleVerifyPin} className="w-full flex flex-col gap-3">
          <input
            type="password"
            maxLength={8}
            placeholder="PIN de acceso (ej: 1234)"
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value);
              setPinError(false);
            }}
            className="w-full text-center tracking-widest text-lg font-mono font-bold px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
            autoFocus
          />

          {pinError && (
            <p className="text-xs font-bold text-rose-600 flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> PIN incorrecto. Intenta con 1234.
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-sm transition shadow-sm active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4" />
            <span>Ingresar al Panel</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Barra superior del Dashboard */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-lg sm:text-xl font-black text-slate-800">
              Panel de Control • Equipo Makerbox
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de solicitudes, colas de máquinas y avisos a usuarios de la Facultad de Ingeniería UTalca.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchRequests}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs"
            title="Recargar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => downloadExcelInBrowser(filteredSolicitudes)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition shadow-sm flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Tarjetas Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold">Pendientes</span>
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-2xl font-black text-slate-800">{countPendientes}</span>
          <span className="text-[11px] text-slate-500">Por evaluar</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-sky-200 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-sky-700">
            <span className="text-xs font-bold">En Evaluación</span>
            <Eye className="w-4 h-4" />
          </div>
          <span className="text-2xl font-black text-slate-800">{countEvaluacion}</span>
          <span className="text-[11px] text-slate-500">En slicer</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-orange-700">
            <span className="text-xs font-bold">En Impresión</span>
            <Play className="w-4 h-4" />
          </div>
          <span className="text-2xl font-black text-slate-800">{countImprimiendo}</span>
          <span className="text-[11px] text-slate-500">En máquina</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold">Listas para Retiro</span>
            <PackageCheck className="w-4 h-4" />
          </div>
          <span className="text-2xl font-black text-slate-800">{countListas}</span>
          <span className="text-[11px] text-slate-500">Esperando retiro</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs flex flex-col gap-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-xs font-bold">Filamento Estimado</span>
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-2xl font-black text-slate-800">{totalGramos} g</span>
          <span className="text-[11px] text-slate-500">Total en solicitudes</span>
        </div>

      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Buscador */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por código, nombre, carrera u observaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50/50"
          />
        </div>

        {/* Filtros Dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          
          {/* Filtro Carrera / Unidad */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
            <span>Carrera:</span>
            <select
              value={filterCarrera}
              onChange={(e) => setFilterCarrera(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 max-w-xs truncate"
            >
              <option value="todos">Todas las Carreras / Unidades</option>
              {CARRERAS_Y_UNIDADES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Filtro Estado */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5" />
            <span>Estado:</span>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="todos">Todos los Estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_evaluacion">En Evaluación</option>
              <option value="aprobada">Aprobada</option>
              <option value="en_impresion">En Impresión</option>
              <option value="lista_retiro">Lista para Retiro</option>
              <option value="entregada">Entregada</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>

          {/* Filtro Material */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Material:</span>
            <select
              value={filterMaterial}
              onChange={(e) => setFilterMaterial(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="todos">Todos</option>
              <option value="PLA">PLA</option>
              <option value="PETG">PETG</option>
              <option value="TPU">TPU</option>
              <option value="Resina UV">Resina UV</option>
            </select>
          </div>

        </div>

      </div>

      {/* Tabla de Solicitudes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3.5">Código / Fecha</th>
                <th className="px-4 py-3.5">Solicitante & Carrera</th>
                <th className="px-4 py-3.5">Archivo 3D & Observaciones</th>
                <th className="px-4 py-3.5">Material & Color</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-4 py-3.5">Máquina / Notas</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSolicitudes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No se encontraron solicitudes que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filteredSolicitudes.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    
                    {/* Código e ID */}
                    <td className="px-4 py-3.5 whitespace-nowrap align-top">
                      <div className="font-mono font-extrabold text-purple-950 text-xs">{s.id}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(s.createdAt).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>

                    {/* Solicitante y Carrera */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-bold text-slate-800">{s.nombre}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{s.correo}</div>
                      <div className="text-[11px] text-slate-500">{s.telefono}</div>
                      <div className="text-[10px] text-purple-800 font-extrabold mt-1 inline-block bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        {s.carrera || s.tipoUsuario}
                      </div>
                    </td>

                    {/* Archivo 3D y OBSERVACIONES DEL SOLICITANTE */}
                    <td className="px-4 py-3.5 align-top max-w-sm">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                        {['zip', 'rar'].includes(s.archivoFormato) ? (
                          <FolderArchive className="w-4 h-4 text-purple-600 shrink-0" />
                        ) : (
                          <Box className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate font-bold">{s.archivoNombre}</span>
                        {['zip', 'rar'].includes(s.archivoFormato) && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 text-[10px] font-black uppercase">
                            {s.archivoFormato}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {s.archivoTamanoMb} MB • {s.dimensionesMm ? `${s.dimensionesMm.x}×${s.dimensionesMm.y}×${s.dimensionesMm.z} mm` : 'Paquete de piezas'}
                      </div>

                      {/* BLOQUE DESTACADO DE OBSERVACIONES DEL SOLICITANTE */}
                      {s.observaciones ? (
                        <div className="mt-2 p-2 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 text-[11px] leading-snug">
                          <span className="font-black text-amber-900 flex items-center gap-1">
                            <Info className="w-3 h-3 text-amber-700 inline shrink-0" />
                            Observaciones del Solicitante:
                          </span>
                          <p className="mt-0.5 whitespace-pre-wrap font-medium text-slate-700">
                            {s.observaciones}
                          </p>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic mt-1">Sin observaciones adicionales</div>
                      )}
                    </td>

                    {/* Material & Color */}
                    <td className="px-4 py-3.5 whitespace-nowrap align-top">
                      <div className="font-bold text-slate-700">{s.material}</div>
                      <div className="text-[11px] text-slate-500">{s.color} • {s.relleno}</div>
                      <div className="text-[10px] text-slate-400">{s.calidad}</div>
                    </td>

                    {/* Selector de Estado */}
                    <td className="px-4 py-3.5 whitespace-nowrap align-top">
                      <div className="flex flex-col gap-1.5">
                        <StatusBadge estado={s.estado} size="sm" />
                        <select
                          value={s.estado}
                          onChange={(e) => handleUpdateStatus(s.id, e.target.value as EstadoSolicitud)}
                          className="text-[10px] font-bold px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:border-purple-400 cursor-pointer focus:outline-none"
                        >
                          <option value="pendiente">🟡 Pendiente</option>
                          <option value="en_evaluacion">🔵 En Evaluación</option>
                          <option value="aprobada">🟣 Aprobada</option>
                          <option value="en_impresion">🟠 En Impresión</option>
                          <option value="lista_retiro">🟢 Lista para Retiro</option>
                          <option value="entregada">✅ Entregada</option>
                          <option value="rechazada">🔴 Rechazada</option>
                        </select>
                      </div>
                    </td>

                    {/* Máquina asignada y Notas Staff */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="text-[11px] font-semibold text-slate-700">
                        {s.impresoraAsignada ? (
                          <span className="inline-flex items-center gap-1 text-slate-800">
                            <Printer className="w-3 h-3 text-purple-600" />
                            {s.impresoraAsignada}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Sin máquina</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {s.gramosEstimados ? `${s.gramosEstimados}g` : '0g'} • {s.tiempoEstimadoHoras ? `${s.tiempoEstimadoHoras}h` : '0h'}
                      </div>
                      {s.notasStaff && (
                        <div className="text-[10px] text-purple-900 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 mt-1 max-w-xs">
                          <strong>Staff:</strong> {s.notasStaff}
                        </div>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap align-top">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Ver 3D */}
                        <button
                          type="button"
                          onClick={() => setInspectingItem(s)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-purple-700 hover:text-purple-900 transition cursor-pointer border border-transparent hover:border-slate-200"
                          title="Inspeccionar en 3D"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Descarga Real del Archivo Binario */}
                        <a
                          href={`/api/files/${s.id}`}
                          download={s.archivoNombre}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-sky-700 hover:text-sky-900 transition cursor-pointer border border-transparent hover:border-slate-200"
                          title="Descargar archivo físico para Slicer"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        {/* Notificar por WhatsApp / Email */}
                        <button
                          type="button"
                          onClick={() => setContactingItem(s)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-emerald-700 hover:text-emerald-900 transition cursor-pointer border border-transparent hover:border-slate-200"
                          title="Responder / Notificar al usuario"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        {/* Editar Parámetros Técnicos */}
                        <button
                          type="button"
                          onClick={() => setEditingItem(s)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer border border-transparent hover:border-slate-200"
                          title="Configurar máquina y consumo"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Visor 3D de Inspección */}
      {inspectingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-bold text-sm">Inspección 3D: {inspectingItem.archivoNombre}</h3>
                  <p className="text-[11px] text-slate-400">Solicitud {inspectingItem.id} • {inspectingItem.nombre} ({inspectingItem.carrera})</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingItem(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {['zip', 'rar'].includes(inspectingItem.archivoFormato) ? (
                <div className="p-8 rounded-3xl bg-purple-50/80 border border-purple-200 flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-purple-200 text-purple-900 flex items-center justify-center shadow-xs">
                    <FolderArchive className="w-8 h-8" />
                  </div>
                  <h4 className="font-black text-base text-purple-950">
                    Paquete de Archivos Comprimido ({inspectingItem.archivoNombre})
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md">
                    Este trabajo contiene múltiples archivos empaquetados en formato {inspectingItem.archivoFormato.toUpperCase()}.
                    Descarga el archivo a continuación para descomprimirlo y evaluar cada pieza en Bambu Studio, PrusaSlicer o Cura.
                  </p>
                </div>
              ) : (
                <ModelViewer3D
                  fileUrl={`/api/files/${inspectingItem.id}`}
                  previewColor={inspectingItem.color}
                  className="h-96"
                />
              )}

              {/* Observaciones en el Modal */}
              {inspectingItem.observaciones && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950">
                  <span className="font-black text-amber-900">Observaciones del solicitante:</span>
                  <p className="mt-1 font-medium">{inspectingItem.observaciones}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  Material pedido: <span className="font-bold text-slate-800">{inspectingItem.material}</span> ({inspectingItem.color}) • Relleno: <span className="font-bold text-slate-800">{inspectingItem.relleno}</span>
                </div>
                <a
                  href={`/api/files/${inspectingItem.id}`}
                  download={inspectingItem.archivoNombre}
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Archivo Real para Slicer</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Notificación WhatsApp / Email */}
      {contactingItem && (
        <QuickContactModal
          solicitud={contactingItem}
          isOpen={Boolean(contactingItem)}
          onClose={() => setContactingItem(null)}
        />
      )}

      {/* Modal Editar Detalles Técnicos de Máquina */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-purple-400" />
                <span>Asignar Máquina y Consumo ({editingItem.id})</span>
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDetails} className="p-6 flex flex-col gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Impresora Asignada:</label>
                <select
                  value={editingItem.impresoraAsignada || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, impresoraAsignada: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                >
                  <option value="">Seleccionar máquina...</option>
                  <option value="Bambu Lab X1-Carbon #1">Bambu Lab X1-Carbon #1</option>
                  <option value="Bambu Lab P1S #2">Bambu Lab P1S #2</option>
                  <option value="Prusa MK4 #1">Prusa MK4 #1</option>
                  <option value="Creality Ender 3 V3">Creality Ender 3 V3</option>
                  <option value="Anycubic Photon Mono (Resina)">Anycubic Photon Mono (Resina)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gramos de Filamento (g):</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editingItem.gramosEstimados || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, gramosEstimados: Number(e.target.value) })}
                    placeholder="Ej: 45"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tiempo Estimado (Horas):</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={editingItem.tiempoEstimadoHoras || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, tiempoEstimadoHoras: Number(e.target.value) })}
                    placeholder="Ej: 2.5"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notas Internas Staff MakerBox:</label>
                <textarea
                  rows={3}
                  value={editingItem.notasStaff || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notasStaff: e.target.value })}
                  placeholder="Notas de soporte, temperatura, incidencias..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold"
                >
                  Guardar Datos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
