'use client';

import React, { useState, useEffect } from 'react';
import { Solicitud3D } from '@/types';
import { StatusBadge } from './StatusBadge';
import { ModelViewer3D } from './ModelViewer3D';
import {
  Search,
  CheckCircle2,
  Clock,
  Layers,
  Box,
  Printer,
  Calendar,
  Sparkles,
  AlertCircle,
  FileBox,
  MapPin
} from 'lucide-react';

interface TrackingViewProps {
  initialCode?: string;
}

export const TrackingView: React.FC<TrackingViewProps> = ({ initialCode = '' }) => {
  const [code, setCode] = useState(initialCode);
  const [searchedCode, setSearchedCode] = useState(initialCode);
  const [solicitud, setSolicitud] = useState<Solicitud3D | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fetchTrackingData = async (searchId: string) => {
    if (!searchId.trim()) return;
    setIsLoading(true);
    setNotFound(false);

    try {
      const res = await fetch(`/api/requests/${searchId.trim()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.solicitud) {
          setSolicitud(data.solicitud);
          setSearchedCode(searchId.trim());
        } else {
          setSolicitud(null);
          setNotFound(true);
        }
      } else {
        setSolicitud(null);
        setNotFound(true);
      }
    } catch (err) {
      console.error('Error al consultar seguimiento:', err);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      fetchTrackingData(initialCode);
    }
  }, [initialCode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrackingData(code);
  };

  // Calcular índice del estado en el stepper
  const steps = [
    { key: 'pendiente', label: '1. Solicitud Recibida', desc: 'En cola de revisión' },
    { key: 'en_evaluacion', label: '2. En Evaluación', desc: 'Revisión en Slicer' },
    { key: 'aprobada', label: '3. Aprobada', desc: 'Lista para mandar a máquina' },
    { key: 'en_impresion', label: '4. Imprimiendo', desc: 'En fabricación' },
    { key: 'lista_retiro', label: '5. Lista para Retiro', desc: 'Disponible en MakerBox' }
  ];

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const order = ['pendiente', 'en_evaluacion', 'aprobada', 'en_impresion', 'lista_retiro', 'entregada'];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(stepKey);

    if (currentStatus === 'rechazada') {
      return stepKey === 'pendiente' ? 'error' : 'upcoming';
    }
    if (currentIndex >= stepIndex) return 'completed';
    return 'upcoming';
  };

  return (
    <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">
      
      {/* Buscador de Código de Seguimiento */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
          <Search className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-800">
          Seguimiento de Solicitud de Impresión 3D
        </h2>
        <p className="text-xs text-slate-500 max-w-md mt-1 mb-6">
          Ingresa el código proporcionado al momento de ingresar tu solicitud (ej: MBX-2026-A101) para ver el estado en tiempo real.
        </p>

        <form onSubmit={handleSearch} className="w-full max-w-md flex items-center gap-2">
          <input
            type="text"
            placeholder="MBX-2026-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="flex-1 font-mono uppercase tracking-wider font-extrabold text-sm px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-600 bg-slate-50/50"
          />
          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs transition cursor-pointer active:scale-98 shadow-sm flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Buscar</span>
            )}
          </button>
        </form>

        {notFound && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>No se encontró ninguna solicitud con el código "{code}". Verifica los caracteres e intenta nuevamente.</span>
          </div>
        )}
      </div>

      {/* Tarjeta de Detalles y Línea de Tiempo */}
      {solicitud && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col gap-6 animate-in fade-in zoom-in-95">
          
          {/* Cabecera del Trabajo */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-black text-purple-950">
                  {solicitud.id}
                </span>
                <StatusBadge estado={solicitud.estado} size="md" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Registrada el {new Date(solicitud.createdAt).toLocaleString('es-CL')} para <span className="font-bold text-slate-700">{solicitud.nombre}</span>
              </p>
            </div>

            {solicitud.estado === 'lista_retiro' && (
              <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>¡Retira en MakerBox con tu código {solicitud.id}!</span>
              </div>
            )}
          </div>

          {/* Stepper / Progreso */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Progreso de Fabricación:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {steps.map((s, idx) => {
                const status = getStepStatus(s.key, solicitud.estado);
                const isCurrent = s.key === solicitud.estado;

                return (
                  <div
                    key={s.key}
                    className={`p-3 rounded-2xl border flex flex-col gap-1 transition ${
                      isCurrent
                        ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-400/20 shadow-xs'
                        : status === 'completed'
                        ? 'bg-emerald-50/50 border-emerald-300'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-800">{s.label}</span>
                      {status === 'completed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">{s.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Datos Técnicos y Visor */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            
            {/* Especificaciones */}
            <div className="flex flex-col gap-4 text-xs">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col gap-2">
                <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-200">
                  <Box className="w-4 h-4 text-purple-600" />
                  <span>Especificaciones de la Pieza</span>
                </h4>
                <div><strong>Archivo:</strong> {solicitud.archivoNombre} ({solicitud.archivoTamanoMb} MB)</div>
                <div><strong>Material:</strong> {solicitud.material} ({solicitud.color})</div>
                <div><strong>Relleno:</strong> {solicitud.relleno}</div>
                <div><strong>Calidad:</strong> {solicitud.calidad}</div>
                {solicitud.observaciones && (
                  <div><strong>Observaciones del solicitante:</strong> {solicitud.observaciones}</div>
                )}
              </div>

              {/* Información del Laboratorio */}
              <div className="bg-purple-50/40 rounded-2xl p-4 border border-purple-100 flex flex-col gap-2">
                <h4 className="font-extrabold text-purple-950 text-xs flex items-center gap-1.5 pb-2 border-b border-purple-100">
                  <Printer className="w-4 h-4 text-purple-700" />
                  <span>Estado en Laboratorio MakerBox</span>
                </h4>
                <div><strong>Máquina asignada:</strong> {solicitud.impresoraAsignada || 'Por asignar'}</div>
                <div><strong>Consumo de material:</strong> {solicitud.gramosEstimados ? `${solicitud.gramosEstimados} gramos` : 'Calculando...'}</div>
                <div><strong>Tiempo de impresión:</strong> {solicitud.tiempoEstimadoHoras ? `~${solicitud.tiempoEstimadoHoras} horas` : 'Calculando...'}</div>
                {solicitud.notasStaff && (
                  <div className="mt-1 p-2.5 bg-white rounded-xl border border-purple-200 text-purple-950 font-medium">
                    <strong>Mensaje del equipo:</strong> {solicitud.notasStaff}
                  </div>
                )}
              </div>
            </div>

            {/* Visor 3D del Modelo */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-700">Modelo 3D Cargado:</span>
              <ModelViewer3D
                fileUrl={solicitud.archivoUrl}
                previewColor={solicitud.color}
                className="h-72"
              />
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
