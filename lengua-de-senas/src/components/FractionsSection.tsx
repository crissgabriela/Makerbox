'use client';

import React, { useState, useMemo } from 'react';
import {
  FractionsConfig,
  DEFAULT_FRACTIONS_CONFIG,
  FractionDenominator,
  MarkingMode,
  generateFractions,
  downloadFractionsStl,
  downloadFractionsSvg,
  downloadFractionsZip
} from '@/lib/fractionsGenerator';
import { Fractions3DViewer } from './Fractions3DViewer';
import {
  Sparkles,
  Download,
  Printer,
  Scissors,
  Flame,
  Info,
  Check,
  Layers,
  Sliders,
  CheckCircle2,
  Box,
  CircleDot,
  FileCode,
  FolderArchive,
  Eye,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';

const FRACTION_PRESETS: { den: FractionDenominator; label: string; desc: string; icon: string }[] = [
  { den: 2, label: '1/2', desc: '2 Mitades (180°)', icon: '🌓' },
  { den: 3, label: '1/3', desc: '3 Tercios (120°)', icon: '🥧' },
  { den: 4, label: '1/4', desc: '4 Cuartos (90°)', icon: '🍕' },
  { den: 5, label: '1/5', desc: '5 Quintos (72°)', icon: '⭐' },
  { den: 6, label: '1/6', desc: '6 Sextos (60°)', icon: '❄️' }
];

export const FractionsSection: React.FC = () => {
  const [config, setConfig] = useState<FractionsConfig>(DEFAULT_FRACTIONS_CONFIG);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const updateConfig = <K extends keyof FractionsConfig>(key: K, value: FractionsConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Cálculo del modelo 3D y archivos de descarga con memoization
  const modelResult = useMemo(() => {
    try {
      return generateFractions(config);
    } catch (err) {
      console.error('Error generando modelo de fracciones:', err);
      return null;
    }
  }, [config]);

  // Manejadores de descarga
  const handleDownloadFullSetStl = () => {
    if (!modelResult) return;
    const filename = `Fracciones_Set_Completo_1_${config.denominator}_${config.mode}.stl`;
    downloadFractionsStl(modelResult.fullSetStlBuffer, filename);
    triggerCelebration();
    setDownloadSuccess('FULL_STL');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleDownloadTrayStl = () => {
    if (!modelResult) return;
    const filename = `Plato_Base_D70mm_Cavidad60mm.stl`;
    downloadFractionsStl(modelResult.trayStlBuffer, filename);
    triggerCelebration();
    setDownloadSuccess('TRAY_STL');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadPiecesStl = () => {
    if (!modelResult) return;
    const filename = `Piezas_Fraccion_1_${config.denominator}_x${config.denominator}_${config.mode}.stl`;
    downloadFractionsStl(modelResult.piecesStlBuffer, filename);
    triggerCelebration();
    setDownloadSuccess('PIECES_STL');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadSinglePieceStl = () => {
    if (!modelResult) return;
    const filename = `Pieza_Individual_1_${config.denominator}_${config.mode}.stl`;
    downloadFractionsStl(modelResult.singlePieceStlBuffer, filename);
    triggerCelebration();
    setDownloadSuccess('SINGLE_STL');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadSvg = () => {
    if (!modelResult) return;
    const filename = `Corte_Laser_Plato_y_Fracciones_1_${config.denominator}.svg`;
    downloadFractionsSvg(modelResult.laserSvgContent, filename);
    triggerCelebration();
    setDownloadSuccess('LASER_SVG');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleDownloadZip = () => {
    if (!modelResult) return;
    const filename = `MakerBox_Fracciones_1_${config.denominator}_Completo_STL_SVG.zip`;
    downloadFractionsZip(modelResult.zipBuffer, filename);
    triggerCelebration();
    setDownloadSuccess('ZIP');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 65,
        origin: { y: 0.8 },
        colors: ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981']
      });
    } catch {
      // Ignorar
    }
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 w-full animate-in fade-in duration-300">
      {/* Banner de Bienvenida e Introducción */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-100 via-pink-50 to-amber-50 border border-purple-200/80 px-5 py-3.5 sm:px-6 sm:py-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-200 text-purple-900 text-[11px] font-extrabold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-700" />
              Material Didáctico STEM Inclusivo
            </span>
            <span className="text-xs font-semibold text-slate-500 hidden md:inline">
              MakerBox · Festival de Ciencia y Tecnología 2026
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Generador de Discos de Fracciones (3D y Corte Láser)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-snug">
            Crea discos de fracciones didácticas con tolerancia mecánica de <strong>0,2 mm</strong> para encaje perfecto en el plato central. Disponibles con <strong>números en bajo relieve</strong> o <strong>Braille táctil en sobre relieve</strong> (puntos de 2 mm × 1 mm).
          </p>
        </div>
      </div>

      {/* Grid Superior: Paso 1 (Fracción) y Paso 2 (Modo de Marcado) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Paso 1: Selección de Fracción (1/2 a 1/6) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-black">
                1
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Selecciona la Fracción:
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200">
              {modelResult?.anglePerPieceDeg}° por sector
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Escoge la división circular que deseas fabricar para el plato de 60 mm:
          </p>

          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {FRACTION_PRESETS.map((p) => {
              const isSelected = config.denominator === p.den;
              return (
                <button
                  key={p.den}
                  type="button"
                  onClick={() => updateConfig('denominator', p.den)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/70 shadow-sm shadow-purple-100 text-purple-950 font-black'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-bold'
                  }`}
                >
                  <span className="text-xl sm:text-2xl mb-1">{p.icon}</span>
                  <span className="text-base sm:text-lg tracking-tight">{p.label}</span>
                  <span className="text-[10px] text-slate-500 text-center leading-tight mt-0.5 hidden sm:block">
                    {p.den} piezas
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Paso 2: Modo de Marcado (Números vs Braille) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col gap-4 justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-black">
                2
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Tipo de Marcado:
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Elige cómo se identificará la fracción en la superficie de cada pieza:
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Opción Números */}
            <button
              type="button"
              onClick={() => updateConfig('mode', 'numbers')}
              className={`p-3.5 rounded-2xl border-2 flex flex-col items-start gap-1.5 transition-all cursor-pointer active:scale-95 ${
                config.mode === 'numbers'
                  ? 'border-purple-600 bg-purple-50/80 shadow-xs text-purple-950'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-lg">🔢</span>
                {config.mode === 'numbers' && (
                  <Check className="w-4 h-4 text-purple-600" />
                )}
              </div>
              <span className="text-sm font-extrabold">Números</span>
              <span className="text-[11px] text-slate-500 leading-tight">
                Bajo relieve tallado (hendidura 0,8 mm)
              </span>
            </button>

            {/* Opción Braille */}
            <button
              type="button"
              onClick={() => updateConfig('mode', 'braille')}
              className={`p-3.5 rounded-2xl border-2 flex flex-col items-start gap-1.5 transition-all cursor-pointer active:scale-95 ${
                config.mode === 'braille'
                  ? 'border-purple-600 bg-purple-50/80 shadow-xs text-purple-950'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-lg">⠇</span>
                {config.mode === 'braille' && (
                  <Check className="w-4 h-4 text-purple-600" />
                )}
              </div>
              <span className="text-sm font-extrabold">Braille</span>
              <span className="text-[11px] text-slate-500 leading-tight">
                Sobre relieve táctil (Ø 2 mm × 1 mm alt)
              </span>
            </button>
          </div>

          {/* Resumen del relieve configurado */}
          <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            {config.mode === 'numbers' ? (
              <span>
                Texto <strong>1/{config.denominator}</strong> tallado a -0,8 mm para fácil lectura visual y táctil.
              </span>
            ) : (
              <span>
                Puntos semiesféricos suaves que sobresalen +1,0 mm para lectura táctil inclusiva.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Parámetros Dimensionales y Tolerancia Calibrada */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-black">
              3
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Dimensiones Calibradas y Ajuste de Tolerancia:
            </h2>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Tolerancia de 0,2 mm activa
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200 text-center">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-500">Plato Exterior:</span>
            <span className="text-sm font-black text-slate-900">
              Ø {config.trayOuterDiameterMm} mm
            </span>
            <span className="text-[10px] text-slate-400">Altura total 5 mm</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-500">Alojamiento Interior:</span>
            <span className="text-sm font-black text-purple-700">
              Ø {config.trayInnerDiameterMm} mm
            </span>
            <span className="text-[10px] text-slate-400">Profundidad 3 mm</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-500">Base del Plato:</span>
            <span className="text-sm font-black text-slate-900">
              {config.trayFloorThicknessMm} mm espesor
            </span>
            <span className="text-[10px] text-slate-400">Pared sólida</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-500">Espesor Piezas:</span>
            <span className="text-sm font-black text-slate-900">
              {config.pieceThicknessMm} mm
            </span>
            <span className="text-[10px] text-slate-400">Al ras con el borde</span>
          </div>
        </div>

        {/* Control fino de tolerancia para calibración entre impresoras */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-600" />
              <span>Holgura entre piezas y paredes del plato (Tolerancia):</span>
            </span>
            <p className="text-[11px] text-slate-500">
              Garantiza que las piezas encajen en el centro del plato sin apretarse ni chocar.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="range"
              min="0.1"
              max="0.4"
              step="0.05"
              value={config.toleranceMm}
              onChange={(e) => updateConfig('toleranceMm', parseFloat(e.target.value))}
              className="w-full sm:w-36 accent-purple-600 cursor-pointer"
            />
            <span className="text-xs font-mono font-black text-purple-700 bg-purple-50 px-2 py-1 rounded-lg border border-purple-200 min-w-[55px] text-center">
              {config.toleranceMm.toFixed(2)} mm
            </span>
          </div>
        </div>
      </div>

      {/* Visor 3D Interactivo Three.js */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-black">
              4
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Visor 3D en Tiempo Real:
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Arrastra para rotar la pieza y usa la barra inferior para verla <strong>ensamblada</strong> o <strong>desarmada</strong>.
          </p>
        </div>

        <Fractions3DViewer
          modelResult={modelResult}
          config={config}
          onExplodeChange={(val) => updateConfig('explodeDistanceMm', val)}
        />
      </div>

      {/* Panel de Descargas: Impresión 3D (.STL) y Corte Láser (.SVG) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-black">
            5
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Descargar Archivos de Fabricación:
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna A: Impresión 3D (.STL) */}
          <div className="flex flex-col gap-3.5 p-5 rounded-2xl bg-gradient-to-br from-purple-50/50 to-indigo-50/30 border border-purple-200/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Archivos STL para Impresión 3D
                </h3>
                <p className="text-[11px] text-slate-500">
                  Compatible con Cura, PrusaSlicer, Bambu Studio, OrcaSlicer
                </p>
              </div>
            </div>

            {/* Botón Principal: Set Completo Listo para Imprimir */}
            <button
              type="button"
              onClick={handleDownloadFullSetStl}
              className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Set Completo en Bandeja (.STL)</span>
            </button>

            {/* Botones Secundarios STL */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleDownloadTrayStl}
                className="py-2.5 px-2 rounded-xl text-xs font-extrabold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 transition active:scale-95 flex flex-col items-center gap-1 cursor-pointer"
                title="Solo el plato base circular de 70 mm"
              >
                <Box className="w-3.5 h-3.5 text-purple-600" />
                <span>Solo Plato</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPiecesStl}
                className="py-2.5 px-2 rounded-xl text-xs font-extrabold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 transition active:scale-95 flex flex-col items-center gap-1 cursor-pointer"
                title={`Las ${config.denominator} piezas de la fracción juntas`}
              >
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>{config.denominator} Piezas</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSinglePieceStl}
                className="py-2.5 px-2 rounded-xl text-xs font-extrabold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 transition active:scale-95 flex flex-col items-center gap-1 cursor-pointer"
                title="1 sola pieza de repuesto"
              >
                <CircleDot className="w-3.5 h-3.5 text-purple-600" />
                <span>1 Pieza</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadZip}
              className="py-2 px-3 rounded-xl text-xs font-bold text-purple-700 hover:text-purple-900 hover:bg-purple-100/50 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Descargar Paquete ZIP con todos los STL y SVG</span>
            </button>
          </div>

          {/* Columna B: Corte Láser (.SVG para LightBurn) */}
          <div className="flex flex-col gap-3.5 p-5 rounded-2xl bg-gradient-to-br from-rose-50/50 to-amber-50/30 border border-rose-200/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Corte y Grabado Láser (.SVG)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Listo para LightBurn, RDWorks o cortadoras CNC
                </p>
              </div>
            </div>

            {/* Botón Principal: Archivo SVG para LightBurn */}
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Archivo Láser .SVG (LightBurn)</span>
            </button>

            {/* Explicación de capas láser */}
            <div className="bg-white/80 rounded-xl p-3 border border-rose-100 flex flex-col gap-1.5 text-xs text-slate-700">
              <span className="font-bold text-rose-950 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                Capas preconfiguradas para MDF o Acrílico:
              </span>
              <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                <li>
                  <strong className="text-rose-600">🔴 Línea Roja (#FF0000, 0.2mm):</strong> Corte exterior del plato y contorno de piezas.
                </li>
                <li>
                  <strong className="text-slate-900">⚫ Relleno Negro (#000000):</strong> Grabado de números o círculos de puntos Braille.
                </li>
                <li>
                  <strong>Plato en 2 capas:</strong> Corta 1 base sólida de 70 mm y 1 aro exterior (70 mm ext / 60 mm int) y pégalos.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Ficha técnica de impresión */}
        {modelResult && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500">Tiempo estimado:</span>
              <span className="text-sm font-black text-slate-800">
                ~{modelResult.estimatedPrintTimeMinutes} min (Ender 3)
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500">Peso en Filamento PLA:</span>
              <span className="text-sm font-black text-purple-700">
                ~{modelResult.estimatedWeightGrams} gramos
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500">Complejidad Malla:</span>
              <span className="text-sm font-black text-slate-800">
                {modelResult.triangleCount.toLocaleString()} triángulos
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500">Relleno recomendado:</span>
              <span className="text-sm font-black text-emerald-700">
                15% a 20% Infill
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Notificación Toast flotante de descarga exitosa */}
      {downloadSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-black text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-3 fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>¡Archivo descargado exitosamente para fabricación!</span>
        </div>
      )}
    </div>
  );
};
