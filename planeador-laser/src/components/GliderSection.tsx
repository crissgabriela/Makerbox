'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  Gauge,
  Compass,
  Scale,
  Wind,
  Target,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { GliderMetrics, BASE_GLIDER_PARAMS, BALSA_DESIGN_LIMITS } from '@/types/glider';

interface GliderSectionProps {
  onBackToMenu?: () => void;
}

export const GliderSection: React.FC<GliderSectionProps> = ({ onBackToMenu }) => {
  // Parámetros de entrada para modelo a escala en madera de balsa de 300 x 100 x 3 mm
  const [fuselageLengthMm, setFuselageLengthMm] = useState<number>(BALSA_DESIGN_LIMITS.fuselage.default);
  const [wingspanMm, setWingspanMm] = useState<number>(BALSA_DESIGN_LIMITS.wingspan.default);
  const [wingWidthMm, setWingWidthMm] = useState<number>(BALSA_DESIGN_LIMITS.wingWidth.default);
  const [slotThicknessMm, setSlotThicknessMm] = useState<number>(BALSA_DESIGN_LIMITS.slotThickness.default);
  const [isSlotLocked, setIsSlotLocked] = useState<boolean>(true);

  // Opciones de visualización en navegador
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'sheet2d' | 'assembly'>('sheet2d');

  // Resultados devueltos por el backend vectorial (/api/planeador)
  const [previewSvg, setPreviewSvg] = useState<string>('');
  const [cleanLaserSvg, setCleanLaserSvg] = useState<string>('');
  const [sheet1Svg, setSheet1Svg] = useState<string>('');
  const [sheet2Svg, setSheet2Svg] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<GliderMetrics>(BASE_GLIDER_PARAMS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProcessedSvg = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
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
      setSheet1Svg(cleanData.sheet1Svg);
      setSheet2Svg(cleanData.sheet2Svg);
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
    }, 70);
    return () => clearTimeout(timer);
  }, [fetchProcessedSvg]);

  const handleResetDefault = () => {
    setFuselageLengthMm(BALSA_DESIGN_LIMITS.fuselage.default);
    setWingspanMm(BALSA_DESIGN_LIMITS.wingspan.default);
    setWingWidthMm(BALSA_DESIGN_LIMITS.wingWidth.default);
    setSlotThicknessMm(BALSA_DESIGN_LIMITS.slotThickness.default);
    setIsSlotLocked(true);
  };

  const downloadSvgFile = (svgContent: string, suffix: string) => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `planeador-balsa-${suffix}-F${Math.round(fuselageLengthMm)}-E${Math.round(wingspanMm)}-A${Math.round(wingWidthMm)}-R${slotThicknessMm}mm.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const aero = metrics.aerodynamics;

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Barra Superior de Navegación */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs">
        <div className="flex items-center gap-3">
          {onBackToMenu ? (
            <button
              type="button"
              onClick={onBackToMenu}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-900 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Menú Principal
            </button>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-900 font-bold text-xs sm:text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Menú Principal
            </Link>
          )}
          <span className="hidden sm:inline-block h-5 w-px bg-slate-200" />
          <span className="text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full">
            ✈️ Taller 2 · Ingeniería de Vuelo (Planeadores)
          </span>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Material: <strong className="text-slate-700">Madera de Balsa 300 × 100 × 3 mm</strong>
        </div>
      </div>

      {/* Banner superior explicativo con foco en Madera de Balsa 300x100x3 mm */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-sky-900 text-white p-6 sm:p-7 shadow-lg border border-purple-700/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-2 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              🪵 Madera de Balsa: 300 × 100 × 3 mm
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              {metrics.zeroCrossingsVerified ? '0 Cruces de Líneas Verificados' : 'Verificando geometría'} · {metrics.sheetsRequired} {metrics.sheetsRequired === 1 ? 'Lámina' : 'Láminas'} (300×100 mm)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Laboratorio de Diseño de Planeador a Escala (Corte Láser)
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            Diseña y optimiza la configuración aerodinámica de tu planeador para planchas de <strong>madera de balsa de 300 × 100 × 3 mm</strong> (máximo <strong>260 mm</strong> de fuselaje y envergadura). El motor vectorial garantiza <strong>0 cruces de líneas</strong>, distribuye las piezas automáticamente en <strong>{metrics.sheetsRequired} {metrics.sheetsRequired === 1 ? 'plancha' : 'planchas'} de 300 × 100 mm</strong> y mantiene fijas las ranuras para espesor de <strong>3 mm (tolerancia láser {slotThicknessMm} mm)</strong>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto shrink-0">
          <button
            type="button"
            onClick={() => downloadSvgFile(cleanLaserSvg || previewSvg, 'completo')}
            disabled={!cleanLaserSvg}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Descargar SVG Completo ({metrics.sheetsRequired} {metrics.sheetsRequired === 1 ? 'Lámina' : 'Láminas'})</span>
          </button>

          {metrics.sheetsRequired === 2 && (
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => downloadSvgFile(sheet1Svg, 'lamina1-300x100')}
                className="px-3 py-2 rounded-xl bg-sky-500/30 hover:bg-sky-500/50 text-sky-100 font-bold text-[11px] border border-sky-300/30 transition flex items-center justify-center gap-1 cursor-pointer"
                title="Descargar solo Lámina 1 (300x100 mm): Fuselaje, Estabilizador y Soportes"
              >
                <Download className="w-3 h-3" />
                <span>Lámina 1 (300×100)</span>
              </button>
              <button
                type="button"
                onClick={() => sheet2Svg && downloadSvgFile(sheet2Svg, 'lamina2-300x100')}
                className="px-3 py-2 rounded-xl bg-sky-500/30 hover:bg-sky-500/50 text-sky-100 font-bold text-[11px] border border-sky-300/30 transition flex items-center justify-center gap-1 cursor-pointer"
                title="Descargar solo Lámina 2 (300x100 mm): Alas Izquierda y Derecha"
              >
                <Download className="w-3 h-3" />
                <span>Lámina 2 (300×100)</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleResetDefault}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Diseño Base Equilibrado</span>
          </button>
        </div>
      </div>

      {/* PANEL SUPERIOR DE TELEMETRÍA AERODINÁMICA PARA TOMA DE DECISIONES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Área Alar */}
        <div className="bg-white rounded-2xl p-4 border-2 border-sky-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-sky-700">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Área Alar (Sw)</span>
            <Layers className="w-4 h-4" />
          </div>
          <div className="my-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{aero.wingAreaCm2}</span>
            <span className="text-xs font-bold text-slate-500 ml-1">cm²</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            {aero.wingAreaMm2.toFixed(0)} mm² · Sustentación
          </span>
        </div>

        {/* 2. Alargamiento (Aspect Ratio) */}
        <div className="bg-white rounded-2xl p-4 border-2 border-purple-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Alargamiento (AR)</span>
            <Compass className="w-4 h-4" />
          </div>
          <div className="my-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{aero.aspectRatio}</span>
            <span className="text-xs font-bold text-purple-700 ml-1.5">
              {aero.aspectRatio >= 6.0 && aero.aspectRatio <= 8.2 ? 'Óptimo' : 'Estándar'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Ideal competencia: 6.0 a 8.0
          </span>
        </div>

        {/* 3. Razón de Planeo Estimada (L/D) */}
        <div className="bg-white rounded-2xl p-4 border-2 border-emerald-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Planeo (L/D)</span>
            <Wind className="w-4 h-4" />
          </div>
          <div className="my-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{aero.estimatedGlideRatioLD}</span>
            <span className="text-xs font-bold text-slate-500 ml-1">: 1</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Vel. est.: {aero.estimatedGlideSpeedMs} m/s
          </span>
        </div>

        {/* 4. Peso y Carga Alar en Balsa 3mm */}
        <div className="bg-white rounded-2xl p-4 border-2 border-amber-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Masa Balsa 3mm</span>
            <Scale className="w-4 h-4" />
          </div>
          <div className="my-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{aero.estimatedWeightGrams}</span>
            <span className="text-xs font-bold text-slate-500 ml-1">g</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Carga alar: {aero.wingLoadingGPerDm2} g/dm²
          </span>
        </div>

        {/* 5. Centro de Gravedad (CG) Recomendado */}
        <div className="bg-white rounded-2xl p-4 border-2 border-indigo-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Centro Gravedad</span>
            <Target className="w-4 h-4" />
          </div>
          <div className="my-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{aero.recommendedCgFromNoseMm}</span>
            <span className="text-xs font-bold text-slate-500 ml-1">mm</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Medido desde la nariz (30% cuerda)
          </span>
        </div>

        {/* 6. Índice de Equilibrio General */}
        <div
          className={`rounded-2xl p-4 border-2 shadow-2xs flex flex-col justify-between ${
            aero.balanceStatus === 'optimo'
              ? 'bg-emerald-50/70 border-emerald-300'
              : aero.balanceStatus === 'estable'
              ? 'bg-sky-50/70 border-sky-300'
              : 'bg-amber-50/80 border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
              Equilibrio Vuelo
            </span>
            <Gauge className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="my-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{aero.balanceScore}</span>
            <span className="text-xs font-extrabold text-emerald-800">/ 100</span>
          </div>
          <span className="text-[10px] font-bold text-slate-600">
            Rel. b/Lfus: {aero.spanToFuselageRatio} · VH: {aero.tailVolumeCoefficient}
          </span>
        </div>
      </div>

      {/* Grilla Principal: Controles Numéricos a la izquierda + Previsualización Interactiva a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: Entradas del Usuario (5 columnas) */}
        <div className="lg:col-span-5 flex flex-col gap-4 bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Parámetros del Planeador (mm)
                </h2>
                <p className="text-xs text-slate-500">
                  Acotados para planchas de balsa de 300 × 100 × 3 mm
                </p>
              </div>
            </div>
          </div>

          {/* 1. Largo del Fuselaje (mm) */}
          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="input-fuselage" className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                1. Largo del fuselaje (mm)
              </label>
              <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                Rango: 170 – 260 mm
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <input
                id="input-fuselage"
                type="number"
                min={BALSA_DESIGN_LIMITS.fuselage.min}
                max={BALSA_DESIGN_LIMITS.fuselage.max}
                step={1}
                value={fuselageLengthMm}
                onChange={(e) =>
                  setFuselageLengthMm(
                    Math.max(
                      BALSA_DESIGN_LIMITS.fuselage.min,
                      Math.min(BALSA_DESIGN_LIMITS.fuselage.max, Number(e.target.value) || BALSA_DESIGN_LIMITS.fuselage.min)
                    )
                  )
                }
                className="w-24 px-3 py-2 rounded-xl border-2 border-purple-300 bg-white text-slate-900 font-black text-base text-center focus:outline-none focus:border-purple-600"
              />
              <input
                type="range"
                min={BALSA_DESIGN_LIMITS.fuselage.min}
                max={BALSA_DESIGN_LIMITS.fuselage.max}
                step={1}
                value={fuselageLengthMm}
                onChange={(e) => setFuselageLengthMm(Number(e.target.value))}
                className="flex-1 accent-purple-600 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Máximo <strong>260 mm</strong> para dejar margen seguro dentro de los 300 mm de la tabla de balsa. Si es <strong>≤ 182 mm</strong>, las 6 piezas caben en <strong>1 sola lámina</strong>; sobre 182 mm se distribuyen en <strong>2 láminas</strong>.
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
                Rango: 170 – 260 mm
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <input
                id="input-wingspan"
                type="number"
                min={BALSA_DESIGN_LIMITS.wingspan.min}
                max={BALSA_DESIGN_LIMITS.wingspan.max}
                step={2}
                value={wingspanMm}
                onChange={(e) =>
                  setWingspanMm(
                    Math.max(
                      BALSA_DESIGN_LIMITS.wingspan.min,
                      Math.min(BALSA_DESIGN_LIMITS.wingspan.max, Number(e.target.value) || BALSA_DESIGN_LIMITS.wingspan.min)
                    )
                  )
                }
                className="w-24 px-3 py-2 rounded-xl border-2 border-sky-300 bg-white text-slate-900 font-black text-base text-center focus:outline-none focus:border-sky-600"
              />
              <input
                type="range"
                min={BALSA_DESIGN_LIMITS.wingspan.min}
                max={BALSA_DESIGN_LIMITS.wingspan.max}
                step={2}
                value={wingspanMm}
                onChange={(e) => setWingspanMm(Number(e.target.value))}
                className="flex-1 accent-sky-600 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium pt-0.5">
              <span>Cada semiala: <strong>{(wingspanMm / 2).toFixed(1)} mm</strong> (máx 130 mm)</span>
              <span>Ranura raíz: <strong>12.50 × {slotThicknessMm} mm</strong></span>
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
                Rango: 28 – 45 mm
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <input
                id="input-wingwidth"
                type="number"
                min={BALSA_DESIGN_LIMITS.wingWidth.min}
                max={BALSA_DESIGN_LIMITS.wingWidth.max}
                step={0.5}
                value={wingWidthMm}
                onChange={(e) =>
                  setWingWidthMm(
                    Math.max(
                      BALSA_DESIGN_LIMITS.wingWidth.min,
                      Math.min(BALSA_DESIGN_LIMITS.wingWidth.max, Number(e.target.value) || BALSA_DESIGN_LIMITS.wingWidth.min)
                    )
                  )
                }
                className="w-24 px-3 py-2 rounded-xl border-2 border-teal-300 bg-white text-slate-900 font-black text-base text-center focus:outline-none focus:border-teal-600"
              />
              <input
                type="range"
                min={BALSA_DESIGN_LIMITS.wingWidth.min}
                max={BALSA_DESIGN_LIMITS.wingWidth.max}
                step={0.5}
                value={wingWidthMm}
                onChange={(e) => setWingWidthMm(Number(e.target.value))}
                className="flex-1 accent-teal-600 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Sincroniza automáticamente el ancho de ambas alas y el largo de la <strong>cama superior del fuselaje ({wingWidthMm.toFixed(1)} mm)</strong>.
            </p>
          </div>

          {/* 4. Espesor del Material para las Ranuras (mm) (Fijo con Tolerancia para Balsa 3mm) */}
          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-200">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="input-slot" className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                {isSlotLocked ? (
                  <Lock className="w-4 h-4 text-amber-700" />
                ) : (
                  <Unlock className="w-4 h-4 text-amber-700" />
                )}
                4. Espesor ranuras Balsa 3 mm (Fijo)
              </label>
              <button
                type="button"
                onClick={() => setIsSlotLocked(!isSlotLocked)}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-950 transition cursor-pointer"
              >
                {isSlotLocked ? '🔒 Fijo (Ajustar Kerf)' : '🔓 Bloquear'}
              </button>
            </div>

            <div className="flex items-center gap-2.5 mt-1">
              <input
                id="input-slot"
                type="number"
                min={2.8}
                max={3.2}
                step={0.05}
                value={slotThicknessMm}
                disabled={isSlotLocked}
                onChange={(e) => setSlotThicknessMm(Number(e.target.value))}
                className={`w-24 px-3 py-2 rounded-xl border-2 font-black text-base text-center ${
                  isSlotLocked
                    ? 'border-amber-300 bg-amber-100/60 text-amber-950 cursor-not-allowed'
                    : 'border-amber-500 bg-white text-slate-900'
                }`}
              />
              <div className="grid grid-cols-3 gap-1 flex-1">
                {[
                  { label: 'Firme (2.90)', val: 2.9 },
                  { label: 'Ideal (2.95)', val: 2.95 },
                  { label: 'Exacto (3.00)', val: 3.0 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setSlotThicknessMm(opt.val)}
                    className={`py-1.5 px-1.5 rounded-lg text-[10px] font-extrabold border transition cursor-pointer ${
                      Math.abs(slotThicknessMm - opt.val) < 0.01
                        ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                        : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-amber-900 leading-snug">
              Considera la tolerancia de corte láser (<em>kerf</em> ~0.05 mm) para madera de balsa de <strong>3.0 mm</strong> de espesor: <strong>2.95 mm</strong> logra un encaje a presión suave sin requerir pegamento excesivo.
            </p>
          </div>

          {/* Diagnóstico pedagógico en vivo */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs ${
              aero.balanceStatus === 'optimo'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : aero.balanceStatus === 'estable'
                ? 'bg-sky-50 border-sky-200 text-sky-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            {aero.balanceStatus === 'advertencia' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="flex flex-col gap-0.5">
              <span className="font-black">
                Análisis de Vuelo ({aero.balanceScore}/100 pts):
              </span>
              <span className="text-[11px] leading-snug opacity-90">{aero.flightBehaviorSummary}</span>
            </div>
          </div>

          {/* Perfiles de Competencia entre Grupos */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
              Perfiles de Prueba para Competencia Estudiantil:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFuselageLengthMm(178);
                  setWingspanMm(210);
                  setWingWidthMm(34);
                }}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-purple-400 bg-slate-50 hover:bg-purple-50 text-left transition cursor-pointer"
              >
                <div className="text-xs font-black text-slate-800">1 Sola Lámina</div>
                <div className="text-[10px] text-slate-500">178 × 210 × 34 mm</div>
              </button>
              <button
                type="button"
                onClick={handleResetDefault}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-sky-400 bg-slate-50 hover:bg-sky-50 text-left transition cursor-pointer"
              >
                <div className="text-xs font-black text-slate-800">Equilibrado (2 Lám)</div>
                <div className="text-[10px] text-slate-500">230 × 240 × 36 mm</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFuselageLengthMm(255);
                  setWingspanMm(260);
                  setWingWidthMm(33);
                }}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50 text-left transition cursor-pointer"
              >
                <div className="text-xs font-black text-slate-800">Máximo Alcance</div>
                <div className="text-[10px] text-slate-500">255 × 260 × 33 mm</div>
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Previsualización en Tiempo Real y Guía de Decisión (7 columnas) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Tarjeta del Visor Vectorial en Tiempo Real */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      Distribución en Planchas de Balsa (300 × 100 mm)
                    </h2>
                    {isLoading && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold animate-pulse">
                        Actualizando...
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {metrics.sheetsRequired === 1
                      ? 'Optimizado en 1 lámina de balsa de 300 × 100 × 3 mm (0 cruces)'
                      : 'Distribuido automáticamente en 2 láminas de balsa de 300 × 100 × 3 mm (0 cruces)'}
                  </p>
                </div>
              </div>

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
                  Guías 300×100 y Cotas
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
                  {viewMode === 'sheet2d' ? 'Guía de Ensamble y Vuelo' : 'Ver Planchas 2D'}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            {viewMode === 'sheet2d' ? (
              <div className="relative w-full rounded-2xl bg-slate-900 border-2 border-slate-800 p-4 sm:p-5 overflow-x-auto flex flex-col items-center justify-center min-h-[320px]">
                <div
                  className="w-full rounded-xl bg-amber-50/95 p-3 sm:p-4 shadow-inner border border-amber-200 transition-all"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, rgba(180, 83, 9, 0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(180, 83, 9, 0.10) 1px, transparent 1px)',
                    backgroundSize: '18px 18px',
                  }}
                >
                  {previewSvg ? (
                    <div
                      className="w-full [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[460px] [&>svg]:block"
                      dangerouslySetInnerHTML={{
                        __html: previewSvg.replace(/stroke-width="0\.25"/g, 'stroke-width="0.9"'),
                      }}
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400 text-sm font-bold">
                      Generando geometría vectorial sin cruces...
                    </div>
                  )}
                </div>

                <div className="w-full mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 px-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-red-500 inline-block" />
                      Corte Láser (<code className="text-red-400">#FF0000</code>)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 border-b border-dashed border-sky-400 inline-block" />
                      Borde Plancha Balsa (<code className="text-sky-300">300 × 100 mm</code>)
                    </span>
                  </div>
                  <span className="text-emerald-300 font-bold">
                    ✓ Geometría Monótona: 0 Cruces
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full rounded-2xl bg-slate-50 border-2 border-slate-200 p-5 flex flex-col gap-4">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Plane className="w-4 h-4 text-purple-600" />
                  Guía de Ensamble en Balsa de 3 mm y Ajustes para la Prueba de Vuelo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col gap-1">
                    <span className="font-black text-purple-800">1. Cama del Ala y Fuselaje</span>
                    <p className="text-slate-600 leading-snug">
                      La cama superior del fuselaje mide exactamente <strong>{metrics.wingSaddleLengthMm} mm</strong> (igual al ancho del ala) y su ranura vertical mide <strong>{metrics.slotThicknessMm} × 6.25 mm</strong> para encajar sin juego en balsa de 3 mm.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col gap-1">
                    <span className="font-black text-sky-800">2. Unión Diedro (7.5°) + Alas</span>
                    <p className="text-slate-600 leading-snug">
                      El soporte diedro tiene paredes reforzadas y ranura central de <strong>{metrics.slotThicknessMm} × 3.0 mm</strong>. Sus brazos de <strong>12.50 mm</strong> entran en las ranuras de raíz de cada semiala (<strong>12.50 × {metrics.slotThicknessMm} mm</strong>).
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col gap-1">
                    <span className="font-black text-teal-800">3. Cola y Estabilizador (100 × 25 mm)</span>
                    <p className="text-slate-600 leading-snug">
                      El soporte trasero inserta su pestaña de <strong>18.75 mm</strong> en la ranura central del estabilizador (<strong>18.75 × {metrics.slotThicknessMm} mm</strong>) y traba en la cama trasera del fuselaje.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col gap-1">
                    <span className="font-black text-amber-800">4. Verificación del Centro de Gravedad (CG)</span>
                    <p className="text-slate-600 leading-snug">
                      Una vez armado el avión, apóyalo sobre dos dedos a <strong>{aero.recommendedCgFromNoseMm} mm desde la punta de la nariz</strong>. Si la nariz sube al lanzarlo, agrega un pequeño clip en la punta; si cae en picada, desplaza peso atrás.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botones de Descarga del SVG limpio para Láser */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <FileCode2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  El archivo descargado exporta únicamente los vectores de corte <code className="font-bold text-red-600">#FF0000</code> en escala real 1:1 (<code className="font-bold">mm</code>).
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                {metrics.sheetsRequired === 2 && (
                  <>
                    <button
                      type="button"
                      onClick={() => downloadSvgFile(sheet1Svg, 'lamina1-300x100')}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs border border-slate-300 transition cursor-pointer"
                    >
                      Lámina 1 (300×100)
                    </button>
                    <button
                      type="button"
                      onClick={() => sheet2Svg && downloadSvgFile(sheet2Svg, 'lamina2-300x100')}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs border border-slate-300 transition cursor-pointer"
                    >
                      Lámina 2 (300×100)
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => downloadSvgFile(cleanLaserSvg || previewSvg, 'completo')}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar SVG Completo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tarjeta de Criterios de Diseño para los Estudiantes */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-purple-700" />
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Guía de Toma de Decisiones Aerodinámicas para Equipos
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-500 uppercase text-[10px]">
                    <th className="py-2 pr-3">Indicador de Diseño</th>
                    <th className="py-2 px-3">Valor Actual</th>
                    <th className="py-2 px-3">Rango Recomendado</th>
                    <th className="py-2 pl-3">Efecto en la Competencia de Vuelo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  <tr>
                    <td className="py-2 pr-3 font-bold text-slate-900">Área Alar Efectiva ($S_w$)</td>
                    <td className="py-2 px-3 font-mono font-black text-sky-700">{aero.wingAreaCm2} cm²</td>
                    <td className="py-2 px-3 font-mono">60 – 95 cm²</td>
                    <td className="py-2 pl-3">Mayor área genera más sustentación a baja velocidad, pero aumenta el peso y arrastre de fricción.</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-bold text-slate-900">Alargamiento Alar ($AR$)</td>
                    <td className="py-2 px-3 font-mono font-black text-purple-700">{aero.aspectRatio}</td>
                    <td className="py-2 px-3 font-mono">6.0 – 8.0</td>
                    <td className="py-2 pl-3">Un mayor $AR$ (alas largas y esbeltas) reduce los vórtices de punta y maximiza la distancia de planeo ($L/D$).</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-bold text-slate-900">Equilibrio Envergadura / Fuselaje</td>
                    <td className="py-2 px-3 font-mono font-black text-teal-700">{aero.spanToFuselageRatio}</td>
                    <td className="py-2 px-3 font-mono">0.90 – 1.15</td>
                    <td className="py-2 pl-3">Un fuselaje más largo incrementa el brazo de palanca del estabilizador ($V_H = {aero.tailVolumeCoefficient}$), evitando que el avión cabecee.</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-bold text-slate-900">Carga Alar ($W / S_w$)</td>
                    <td className="py-2 px-3 font-mono font-black text-amber-700">{aero.wingLoadingGPerDm2} g/dm²</td>
                    <td className="py-2 px-3 font-mono">8.0 – 9.8 g/dm²</td>
                    <td className="py-2 pl-3">Determina la velocidad necesaria de lanzamiento ({aero.estimatedGlideSpeedMs} m/s) para sostener el vuelo.</td>
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
