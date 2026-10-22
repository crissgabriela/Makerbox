'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plane,
  Download,
  RotateCcw,
  Lock,
  Unlock,
  Ruler,
  CheckCircle2,
  Eye,
  Layers,
  Info,
  Sparkles,
  FileCode2,
  Sliders,
} from 'lucide-react';
import { GliderMetrics, BASE_GLIDER_PARAMS } from '@/lib/glider-svg-processor';

export const GliderSection: React.FC = () => {
  // Parámetros de entrada del usuario (inicializados con los valores exactos identificados en el PDF)
  const [fuselageLengthMm, setFuselageLengthMm] = useState<number>(546.1);
  const [wingspanMm, setWingspanMm] = useState<number>(508.0);
  const [wingWidthMm, setWingWidthMm] = useState<number>(76.2);
  const [slotThicknessMm, setSlotThicknessMm] = useState<number>(3.175);
  const [isSlotLocked, setIsSlotLocked] = useState<boolean>(true);

  // Opciones de visualización en navegador
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [highlightSlots, setHighlightSlots] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'sheet2d' | 'assembly'>('sheet2d');

  // Resultado devuelto por el backend vectorial (/api/planeador)
  const [previewSvg, setPreviewSvg] = useState<string>('');
  const [cleanLaserSvg, setCleanLaserSvg] = useState<string>('');
  const [metrics, setMetrics] = useState<GliderMetrics>(BASE_GLIDER_PARAMS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProcessedSvg = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // Solicitar al backend el SVG con cotas (para previsualización) y el SVG limpio (para corte láser)
      const [previewRes, cleanRes] = await Promise.all([
        fetch('/api/planeador', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fuselageLengthMm,
            wingspanMm,
            wingWidthMm,
            slotThicknessMm,
            includeAnnotations: showAnnotations,
            cutStrokeColor: '#FF0000',
          }),
        }),
        fetch('/api/planeador', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fuselageLengthMm,
            wingspanMm,
            wingWidthMm,
            slotThicknessMm,
            includeAnnotations: false,
            cutStrokeColor: '#FF0000',
          }),
        }),
      ]);

      if (!previewRes.ok || !cleanRes.ok) {
        throw new Error('Error al procesar el archivo SVG en el backend.');
      }

      const previewData = await previewRes.json();
      const cleanData = await cleanRes.json();

      setPreviewSvg(previewData.svg);
      setCleanLaserSvg(cleanData.svg);
      setMetrics(previewData.metrics);
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudo actualizar la vista previa vectorial.');
    } finally {
      setIsLoading(false);
    }
  }, [fuselageLengthMm, wingspanMm, wingWidthMm, slotThicknessMm, showAnnotations]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProcessedSvg();
    }, 90);
    return () => clearTimeout(timer);
  }, [fetchProcessedSvg]);

  const handleResetToPdf = () => {
    setFuselageLengthMm(546.1);
    setWingspanMm(508.0);
    setWingWidthMm(76.2);
    setSlotThicknessMm(3.175);
    setIsSlotLocked(true);
  };

  const handleDownloadLaserSvg = () => {
    const svgToSave = cleanLaserSvg || previewSvg;
    if (!svgToSave) return;
    const blob = new Blob([svgToSave], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `planeador-laser-F${Math.round(fuselageLengthMm)}-E${Math.round(wingspanMm)}-A${Math.round(wingWidthMm)}-R${slotThicknessMm}mm.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Razón de aspecto alar (AR = Envergadura^2 / Área alar ≈ Envergadura / Cuerda)
  const aspectRatio = +(wingspanMm / wingWidthMm).toFixed(2);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Banner superior explicativo */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-sky-900 text-white p-6 sm:p-7 shadow-lg border border-purple-700/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-2 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-sky-400/20 border border-sky-300/40 text-sky-200 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5 text-sky-300" />
              Diseño Paramétrico de Planeador · Corte Láser
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              Ensamble Garantizado (Ranuras Bloqueadas)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Configurador Vectorial de Planeador en Madera / MDF
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            Modifica el <strong>largo del fuselaje</strong>, la <strong>envergadura de las alas</strong> y el <strong>ancho del ala</strong>. El motor vectorial del servidor transforma los nodos de la plantilla original del PDF manteniendo <strong>intactas las ranuras y camas de ensamble ({slotThicknessMm} mm)</strong> para que todas las piezas encajen con precisión tras el corte láser.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
          <button
            type="button"
            onClick={handleDownloadLaserSvg}
            disabled={!cleanLaserSvg}
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm shadow-md hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Descargar SVG para Corte Láser</span>
          </button>
          <button
            type="button"
            onClick={handleResetToPdf}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Medidas del PDF Original</span>
          </button>
        </div>
      </div>

      {/* Grilla Principal: Controles Numéricos a la izquierda + Previsualización Interactiva a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: Entradas del Usuario (4 columnas) */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Parámetros Geométricos
                </h2>
                <p className="text-xs text-slate-500">
                  Entradas numéricas en milímetros (mm)
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-bold">
              AR: {aspectRatio}
            </span>
          </div>

          {/* 1. Largo del Fuselaje (mm) */}
          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="input-fuselage" className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                1. Largo del fuselaje (mm)
              </label>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                PDF Base: 546.1 mm
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <input
                id="input-fuselage"
                type="number"
                min={280}
                max={950}
                step={1}
                value={fuselageLengthMm}
                onChange={(e) => setFuselageLengthMm(Number(e.target.value))}
                className="w-28 px-3 py-2 rounded-xl border-2 border-purple-300 bg-white text-slate-900 font-black text-base text-center focus:outline-none focus:border-purple-600"
              />
              <input
                type="range"
                min={300}
                max={850}
                step={1}
                value={fuselageLengthMm}
                onChange={(e) => setFuselageLengthMm(Number(e.target.value))}
                className="flex-1 accent-purple-600 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Escala longitudinalmente la nariz y el botalón central preservando intactas la cama del ala ({wingWidthMm.toFixed(1)} mm) y la cama de cola (44.45 mm).
            </p>
          </div>

          {/* 2. Envergadura de Alas (mm) */}
          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="input-wingspan" className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block" />
                2. Envergadura de alas (mm)
              </label>
              <span className="text-[11px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">
                PDF Base: 508.0 mm
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <input
                id="input-wingspan"
                type="number"
                min={220}
                max={1100}
                step={1}
                value={wingspanMm}
                onChange={(e) => setWingspanMm(Number(e.target.value))}
                className="w-28 px-3 py-2 rounded-xl border-2 border-sky-300 bg-white text-slate-900 font-black text-base text-center focus:outline-none focus:border-sky-600"
              />
              <input
                type="range"
                min={260}
                max={900}
                step={2}
                value={wingspanMm}
                onChange={(e) => setWingspanMm(Number(e.target.value))}
                className="flex-1 accent-sky-600 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium pt-0.5">
              <span>Cada ala (semienvergadura): <strong>{(wingspanMm / 2).toFixed(1)} mm</strong></span>
              <span>Prof. ranura raíz: <strong>25.40 mm (fija)</strong></span>
            </div>
          </div>

          {/* 3. Ancho del Ala (mm) */}
          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="input-wingwidth" className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
                3. Ancho del ala / Cuerda (mm)
              </label>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                PDF Base: 76.2 mm
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <input
                id="input-wingwidth"
                type="number"
                min={40}
                max={150}
                step={0.5}
                value={wingWidthMm}
                onChange={(e) => setWingWidthMm(Number(e.target.value))}
                className="w-28 px-3 py-2 rounded-xl border-2 border-teal-300 bg-white text-slate-900 font-black text-base text-center focus:outline-none focus:border-teal-600"
              />
              <input
                type="range"
                min={45}
                max={135}
                step={0.5}
                value={wingWidthMm}
                onChange={(e) => setWingWidthMm(Number(e.target.value))}
                className="flex-1 accent-teal-600 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Sincroniza automáticamente el ancho de ambas alas y la longitud de la <strong>cama superior del fuselaje ({wingWidthMm.toFixed(1)} mm)</strong> para un encaje perfecto.
            </p>
          </div>

          {/* 4. Espesor del Material para las Ranuras (mm) (Fijo) */}
          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-200">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="input-slot" className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                {isSlotLocked ? (
                  <Lock className="w-4 h-4 text-amber-700" />
                ) : (
                  <Unlock className="w-4 h-4 text-amber-700" />
                )}
                4. Espesor del material / Ranuras (mm)
              </label>
              <button
                type="button"
                onClick={() => setIsSlotLocked(!isSlotLocked)}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-950 transition cursor-pointer"
                title="Por requerimiento el espesor es fijo, pero puedes desbloquearlo si cambias de plancha MDF"
              >
                {isSlotLocked ? '🔒 Fijo (Desbloquear)' : '🔓 Editable (Bloquear)'}
              </button>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <input
                id="input-slot"
                type="number"
                min={2.0}
                max={6.5}
                step={0.025}
                value={slotThicknessMm}
                disabled={isSlotLocked}
                onChange={(e) => setSlotThicknessMm(Number(e.target.value))}
                className={`w-28 px-3 py-2 rounded-xl border-2 font-black text-base text-center ${
                  isSlotLocked
                    ? 'border-amber-300 bg-amber-100/60 text-amber-950 cursor-not-allowed'
                    : 'border-amber-500 bg-white text-slate-900'
                }`}
              />
              <div className="flex flex-wrap gap-1.5 flex-1">
                <span className="text-[11px] text-amber-900 font-semibold leading-tight">
                  En el PDF original todas las ranuras miden exactamente <strong>9.00 pt = 1/8&quot; = 3.175 mm</strong> (MDF de 3 mm).
                </span>
              </div>
            </div>
          </div>

          {/* Perfiles rápidos pedagógicos */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
              Configuraciones de Prueba Rápida:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleResetToPdf}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-purple-400 bg-slate-50 hover:bg-purple-50 text-left transition cursor-pointer"
              >
                <div className="text-xs font-black text-slate-800">Original PDF</div>
                <div className="text-[10px] text-slate-500">546 × 508 × 76.2 mm</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFuselageLengthMm(460);
                  setWingspanMm(420);
                  setWingWidthMm(68);
                }}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-sky-400 bg-slate-50 hover:bg-sky-50 text-left transition cursor-pointer"
              >
                <div className="text-xs font-black text-slate-800">Compacto Ágil</div>
                <div className="text-[10px] text-slate-500">460 × 420 × 68 mm</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFuselageLengthMm(620);
                  setWingspanMm(680);
                  setWingWidthMm(86);
                }}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50 text-left transition cursor-pointer"
              >
                <div className="text-xs font-black text-slate-800">Vuelo Térmico</div>
                <div className="text-[10px] text-slate-500">620 × 680 × 86 mm</div>
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Previsualización en Tiempo Real y Análisis del PDF (7 columnas) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Tarjeta del Visor Vectorial en Tiempo Real */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      Previsualización Vectorial en Tiempo Real
                    </h2>
                    {isLoading && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold animate-pulse">
                        Recalculando nodos...
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Lámina de corte: <strong>{metrics.sheetWidthMm.toFixed(1)} × {metrics.sheetHeightMm.toFixed(1)} mm</strong> · Trazo láser <code className="text-red-600 font-bold">#FF0000</code>
                  </p>
                </div>
              </div>

              {/* Botones de modo de vista */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowAnnotations(!showAnnotations)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    showAnnotations
                      ? 'bg-purple-100 text-purple-900 border-purple-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <Ruler className="w-3.5 h-3.5 inline mr-1" />
                  Cotas
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'sheet2d' ? 'assembly' : 'sheet2d')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    viewMode === 'assembly'
                      ? 'bg-sky-600 text-white border-sky-700'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 inline mr-1" />
                  {viewMode === 'sheet2d' ? 'Ver Esquema de Ensamble' : 'Ver Plantilla Láser 2D'}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            {viewMode === 'sheet2d' ? (
              /* LIENZO VECTORIAL SVG EN TIEMPO REAL */
              <div className="relative w-full rounded-2xl bg-slate-900 border-2 border-slate-800 p-4 sm:p-6 overflow-x-auto flex flex-col items-center justify-center min-h-[300px]">
                {/* Cuadrícula técnica de fondo estilo cama de corte láser */}
                <div
                  className="w-full rounded-xl bg-white p-3 sm:p-4 shadow-inner border border-slate-300 transition-all"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, rgba(148, 163, 184, 0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.16) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                >
                  {previewSvg ? (
                    <div
                      className="w-full [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[420px] [&>svg]:block"
                      dangerouslySetInnerHTML={{
                        __html: previewSvg.replace(/stroke-width="0\.25"/g, 'stroke-width="1.35"'),
                      }}
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400 text-sm font-bold">
                      Cargando plantilla vectorial del planeador...
                    </div>
                  )}
                </div>

                {/* Leyenda de piezas y ranuras */}
                <div className="w-full mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 px-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-red-500 inline-block" />
                      Corte Exterior y Ranuras (<code className="text-red-400">#FF0000</code>)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                      6 Piezas Cerradas Herméticas (1 solo trazo continuo por pieza)
                    </span>
                  </div>
                  <span className="text-sky-300 font-mono">
                    Escala Real 1:1 en mm
                  </span>
                </div>
              </div>
            ) : (
              /* ESQUEMA INTERACTIVO DE ENSAMBLE MECÁNICO DE LAS 6 PIEZAS */
              <div className="w-full rounded-2xl bg-slate-50 border-2 border-slate-200 p-5 flex flex-col gap-4">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Mapa de Ensamble Mecánico (Cómo encajan las 6 piezas del PDF)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col gap-1">
                    <span className="font-black text-purple-800">1. Fuselaje + Alas (Cama Superior)</span>
                    <p className="text-slate-600 leading-snug">
                      La cama superior del fuselaje mide exactamente <strong>{metrics.wingSaddleLengthMm} mm</strong> (igual al ancho del ala). Su ranura vertical (<strong>{metrics.slotThicknessMm} × 12.70 mm</strong>) está ubicada al <strong>55.25%</strong> de la cuerda, alineada con las ranuras de ambas alas.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col gap-1">
                    <span className="font-black text-sky-800">2. Soporte Diedro (7.5°) + 2 Alas</span>
                    <p className="text-slate-600 leading-snug">
                      El soporte diedro frontal encastra su ranura central (<strong>{metrics.slotThicknessMm} × 3.18 mm</strong>) en la ranura vertical del fuselaje, y sus dos brazos inclinados de <strong>25.40 mm</strong> entran en las ranuras de raíz del Ala Izquierda y Ala Derecha.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col gap-1">
                    <span className="font-black text-teal-800">3. Estabilizador Horizontal (Óvalo)</span>
                    <p className="text-slate-600 leading-snug">
                      Pieza elíptica de <strong>203.26 × 50.80 mm</strong> con ranura rectangular central de <strong>38.10 × {metrics.slotThicknessMm} mm</strong> y muesca guía inferior de <strong>{metrics.slotThicknessMm} × 6.35 mm</strong>.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col gap-1">
                    <span className="font-black text-amber-800">4. Soporte Trasero + Cola del Fuselaje</span>
                    <p className="text-slate-600 leading-snug">
                      Su base de <strong>38.10 mm</strong> entra en la ranura central del estabilizador horizontal y su ranura de <strong>{metrics.slotThicknessMm} mm</strong> traba perpendicularmente en la cama trasera del fuselaje (<strong>44.45 mm</strong>).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Barra de acción inferior con botón grande de descarga y enlace API */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <FileCode2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  Archivo listo para <strong>LightBurn, RDWorks o Illustrator</strong> (unidades en <code className="font-bold">mm</code>).
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownloadLaserSvg}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar SVG ({metrics.fuselageLengthMm} × {metrics.wingspanTotalMm} mm)</span>
              </button>
            </div>
          </div>

          {/* Tarjeta de Parámetros Identificados dentro del PDF Original */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-purple-700" />
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Parámetros Geométricos Identificados en el PDF Original (CAD 72 pt/in)
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Al descomprimir e inspeccionar el flujo vectorial del PDF (<code className="font-bold">MediaBox 1728 × 576 pt</code> = <code className="font-bold">24 × 8 in</code> = <code className="font-bold">609.60 × 203.20 mm</code>, capa <code className="font-bold">Visible (ANSI)</code>), se identificaron las <strong>6 piezas</strong> y sus cotas exactas de fábrica:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-500 uppercase text-[10px]">
                    <th className="py-2 pr-3">Parámetro / Pieza en el PDF</th>
                    <th className="py-2 px-3">Medida Original (PDF)</th>
                    <th className="py-2 px-3">Equivalencia Imperial</th>
                    <th className="py-2 pl-3 text-purple-800">Valor Actual en Pantalla</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  <tr>
                    <td className="py-2 pr-3 font-bold text-slate-900">Largo total del fuselaje</td>
                    <td className="py-2 px-3 font-mono">546.10 mm (1548.00 pt)</td>
                    <td className="py-2 px-3 font-mono">21.500 in</td>
                    <td className="py-2 pl-3 font-mono font-black text-purple-700">{metrics.fuselageLengthMm.toFixed(2)} mm</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-bold text-slate-900">Alto máximo del fuselaje</td>
                    <td className="py-2 px-3 font-mono">91.31 mm (258.84 pt)</td>
                    <td className="py-2 px-3 font-mono">3.595 in</td>
                    <td className="py-2 pl-3 font-mono">{metrics.fuselageHeightMm.toFixed(2)} mm (fijo)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-bold text-slate-900">Envergadura total (2 alas)</td>
                    <td className="py-2 px-3 font-mono">508.00 mm (1440.00 pt)</td>
                    <td className="py-2 px-3 font-mono">20.000 in (2 × 10 in)</td>
                    <td className="py-2 pl-3 font-black font-mono text-sky-700">
                      {metrics.wingspanTotalMm.toFixed(2)} mm ({metrics.singleWingLengthMm.toFixed(1)} mm c/u)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-bold text-slate-900">Ancho del ala (Cuerda y Cama)</td>
                    <td className="py-2 px-3 font-mono">76.20 mm (216.00 pt)</td>
                    <td className="py-2 px-3 font-mono">3.000 in</td>
                    <td className="py-2 pl-3 font-black font-mono text-teal-700">{metrics.wingWidthMm.toFixed(2)} mm</td>
                  </tr>
                  <tr className="bg-amber-50/60">
                    <td className="py-2 pr-3 font-bold text-amber-950">Espesor de ranuras de ensamble</td>
                    <td className="py-2 px-3 font-mono font-bold text-amber-900">3.175 mm (9.00 pt)</td>
                    <td className="py-2 px-3 font-mono text-amber-900">0.125 in (1/8&quot;)</td>
                    <td className="py-2 pl-3 font-black font-mono text-amber-900">{metrics.slotThicknessMm.toFixed(3)} mm (bloqueado)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">Profundidad ranura en cada ala</td>
                    <td className="py-2 px-3 font-mono">25.40 mm (72.00 pt)</td>
                    <td className="py-2 px-3 font-mono">1.000 in</td>
                    <td className="py-2 pl-3 font-mono text-emerald-700 font-bold">25.40 mm (invariante)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">Ranura vertical de ala en fuselaje</td>
                    <td className="py-2 px-3 font-mono">3.175 × 12.70 mm (9 × 36 pt)</td>
                    <td className="py-2 px-3 font-mono">1/8&quot; × 1/2&quot;</td>
                    <td className="py-2 pl-3 font-mono text-emerald-700 font-bold">{metrics.slotThicknessMm.toFixed(2)} × 12.70 mm</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">Estabilizador horizontal (óvalo)</td>
                    <td className="py-2 px-3 font-mono">203.26 × 50.80 mm (576.2 × 144 pt)</td>
                    <td className="py-2 px-3 font-mono">8.000 × 2.000 in</td>
                    <td className="py-2 pl-3 font-mono">Ranura central 38.10 × {metrics.slotThicknessMm.toFixed(2)} mm</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">Soportes de unión (Diedro 7.5° y Cola)</td>
                    <td className="py-2 px-3 font-mono">62.17 × 19.11 mm / 44.45 × 11.11 mm</td>
                    <td className="py-2 px-3 font-mono">Ranuras 9 × 9 pt</td>
                    <td className="py-2 pl-3 font-mono text-emerald-700 font-bold">Ranuras {metrics.slotThicknessMm.toFixed(2)} × 3.18 mm</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
