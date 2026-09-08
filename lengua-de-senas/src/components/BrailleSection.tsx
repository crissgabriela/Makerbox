'use client';

import React, { useState, useMemo } from 'react';
import {
  BrailleConfig,
  DEFAULT_BRAILLE_CONFIG,
  generateBraille3D,
  downloadStl,
  downloadObj,
  downloadMtl,
  downloadZip
} from '@/lib/brailleGenerator';
import { Braille3DViewer } from './Braille3DViewer';
import {
  Sparkles,
  Download,
  Printer,
  Sliders,
  Info,
  Check,
  Layers,
  RotateCcw,
  Palette,
  Hash,
  CircleDot,
  FolderArchive,
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';

const QUICK_WORDS = ['CRISS', 'MAKERBOX', 'UTALCA', 'TALCA', 'HOLA', 'INCLUSIÓN'];

export const BrailleSection: React.FC = () => {
  const [config, setConfig] = useState<BrailleConfig>(DEFAULT_BRAILLE_CONFIG);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [showIndividualFiles, setShowIndividualFiles] = useState(false);

  const updateConfig = <K extends keyof BrailleConfig>(key: K, value: BrailleConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Generar modelo 3D con memoization
  const modelResult = useMemo(() => {
    try {
      return generateBraille3D(config);
    } catch (err) {
      console.error('Error generando modelo Braille 3D:', err);
      return null;
    }
  }, [config]);

  // 1. Descarga STL Monocolor
  const handleDownloadStl = () => {
    if (!modelResult) return;
    downloadStl(modelResult.stlBuffer, `${modelResult.baseFilename}.stl`);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#f59e0b', '#1d4ed8', '#10b981']
    });

    setDownloadSuccess('STL');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  // 2. Descarga STL Multi-Parte ZIP (Recomendado Bambu AMS)
  const handleDownloadMultiPartZip = () => {
    if (!modelResult) return;
    downloadZip(modelResult.multiPartZipBuffer, `${modelResult.baseFilename}_Multipieza_Bambu_AMS.zip`);

    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#10b981', '#06b6d4', '#3b82f6', '#f59e0b']
    });

    setDownloadSuccess('MULTI_STL');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  // 3. Descarga OBJ + MTL en ZIP (Evita error de archivo MTL inexistente)
  const handleDownloadObjZip = () => {
    if (!modelResult) return;
    downloadZip(modelResult.objZipBuffer, `${modelResult.baseFilename}_Multicolor_OBJ.zip`);

    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#ec4899', '#8b5cf6', '#3b82f6', '#f59e0b']
    });

    setDownloadSuccess('OBJ_ZIP');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  // Descargas individuales si el usuario las requiere
  const handleDownloadObjSingle = () => {
    if (!modelResult) return;
    downloadObj(modelResult.objContent, `${modelResult.baseFilename}.obj`);
    setDownloadSuccess('OBJ_SINGLE');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadMtlSingle = () => {
    if (!modelResult) return;
    downloadMtl(modelResult.mtlContent, `${modelResult.baseFilename}.mtl`);
    setDownloadSuccess('MTL_SINGLE');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 w-full">
      {/* Banner de Bienvenida e Introducción */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-100 via-orange-50 to-purple-50 border border-amber-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              Herramienta 3 · Fabricación Digital Accesible
            </span>
            <span className="text-xs font-semibold text-slate-500 hidden md:inline">
              MakerBox · Facultad de Ingeniería UTalca
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mt-1">
            Llavero Braille en Impresión 3D
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Escribe cualquier palabra o tu nombre y la plataforma lo traduce a Braille táctil con su significado escrito en tipografía Arial. Genera una plaquita compacta de <strong>0.8 mm de espesor</strong> y <strong>18 mm de alto</strong> (tiempo de impresión reducido a solo <strong>~4 a 5 minutos</strong>) lista para laminar e imprimir en 3D en <strong>STL</strong> o en <strong>OBJ multicolor</strong>.
          </p>
        </div>
      </div>

      {/* Entrada de Texto y Palabras Rápidas */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>🔤</span>
              <span>Escribe el texto para el llavero</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Soporta letras (A-Z), Ñ, acentos (Á, É, Í, Ó, Ú), números y signos.
            </p>
          </div>

          {/* Botones de palabras rápidas para el stand */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium mr-1">Muestras:</span>
            {QUICK_WORDS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => updateConfig('text', w)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition active:scale-95 ${
                  config.text.toUpperCase() === w
                    ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Input principal */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={config.text}
            onChange={(e) => updateConfig('text', e.target.value.toUpperCase())}
            placeholder="EJ: CRISS O TU NOMBRE..."
            maxLength={18}
            className="w-full text-xl sm:text-2xl font-black tracking-wider text-slate-900 bg-slate-50 border-2 border-slate-300 focus:border-amber-500 focus:bg-white rounded-2xl px-5 py-4 outline-hidden transition shadow-inner"
          />
          {config.text && (
            <button
              type="button"
              onClick={() => updateConfig('text', '')}
              className="absolute right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
              title="Borrar texto"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Celdas Braille 2D Interactivas de Vista Previa */}
        {modelResult && modelResult.cells.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold text-slate-700">Traducción a Celdas Braille (6 Puntos):</span>
              <span>{modelResult.cells.length} celdas · {modelResult.dotCount} puntos activos</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 overflow-x-auto py-2">
              {modelResult.cells.map((cell, idx) => {
                if (cell.char === ' ') {
                  return (
                    <div
                      key={idx}
                      className="w-8 h-16 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 font-mono"
                      title="Espacio"
                    >
                      ␣
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center bg-slate-50 border border-slate-200 hover:border-amber-400 rounded-2xl p-2.5 transition shadow-xs"
                  >
                    {/* Carácter original */}
                    <span className="font-bold text-sm text-slate-800 font-mono">{cell.char}</span>

                    {/* Matriz táctil de 6 puntos */}
                    <div className="grid grid-cols-2 gap-1.5 my-1.5 p-1 bg-white rounded-lg border border-slate-200">
                      {[1, 4, 2, 5, 3, 6].map((dotNum) => {
                        const isActive = cell.dots.includes(dotNum);
                        return (
                          <div
                            key={dotNum}
                            className={`w-2.5 h-2.5 rounded-full flex items-center justify-center transition ${
                              isActive
                                ? 'bg-amber-500 shadow-xs ring-1 ring-amber-400 scale-105'
                                : 'bg-slate-200'
                            }`}
                            title={`Punto ${dotNum} ${isActive ? '(Activo)' : '(Inactivo)'}`}
                          />
                        );
                      })}
                    </div>

                    {/* Glifo Braille oficial */}
                    <span className="text-base text-amber-700 font-serif leading-none">
                      {cell.unicodeGlyph}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sección Central: Visor 3D y Parámetros */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Visor 3D (7 columnas) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-500" />
              <span>Simulador 3D en Tiempo Real</span>
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              Three.js WebGL
            </span>
          </div>

          <Braille3DViewer
            modelResult={modelResult}
            baseColor={config.baseColor}
            dotColor={config.dotColor}
            onColorChange={(b, d) => {
              updateConfig('baseColor', b);
              updateConfig('dotColor', d);
            }}
          />
        </div>

        {/* Panel de Controles y Descargas (5 columnas) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Ajustes Físicos del Llavero */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>Parámetros Físicos de Fabricación</span>
            </h2>

            {/* Espesor de la Placa (0.8 mm exacto) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Espesor de la Placa Base:</span>
                <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {config.plateThicknessMm.toFixed(2)} mm
                </span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.5"
                step="0.1"
                value={config.plateThicknessMm}
                onChange={(e) => updateConfig('plateThicknessMm', parseFloat(e.target.value))}
                className="accent-amber-500 w-full cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">
                ⭐ Valor óptimo solicitado: 0.8 mm (tiempo de impresión ultrarrápido ~4 a 5 min).
              </span>
            </div>

            {/* Altura del Relieve Braille (0.36 mm exacto) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Altura de Puntos Braille:</span>
                <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  +{config.dotHeightMm.toFixed(2)} mm
                </span>
              </div>
              <input
                type="range"
                min="0.25"
                max="0.60"
                step="0.02"
                value={config.dotHeightMm}
                onChange={(e) => updateConfig('dotHeightMm', parseFloat(e.target.value))}
                className="accent-amber-500 w-full cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">
                ⭐ Valor solicitado: 0.36 mm (semiesferas suaves al tacto).
              </span>
            </div>

            {/* Diámetro del Punto Braille */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Diámetro del Punto Braille:</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                  {(config.dotRadiusMm * 2).toFixed(2)} mm
                </span>
              </div>
              <input
                type="range"
                min="0.4"
                max="0.9"
                step="0.05"
                value={config.dotRadiusMm}
                onChange={(e) => updateConfig('dotRadiusMm', parseFloat(e.target.value))}
                className="accent-amber-500 w-full cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">
                ⭐ Valor solicitado: 1.2 mm de diámetro (semiesferas pegadas a la placa).
              </span>
            </div>

            {/* Configuración de Palabra Escrita (Arial / Helvetiker) */}
            <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-cyan-50/70 border border-cyan-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">✍️</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">Palabra Escrita (Arial)</span>
                    <span className="text-[11px] text-cyan-800">Tipografía vectorial limpia sin errores</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.includeText}
                  onChange={(e) => updateConfig('includeText', e.target.checked)}
                  className="w-5 h-5 accent-cyan-600 rounded-md cursor-pointer"
                />
              </div>

              {config.includeText && (
                <div className="flex flex-col gap-2 pt-2 border-t border-cyan-200/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-600 font-semibold">Forma de la Letra:</span>
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-cyan-200">
                      <button
                        type="button"
                        onClick={() => updateConfig('textMode', 'emboss')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          config.textMode === 'emboss'
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        En Relieve (+0.36 mm)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateConfig('textMode', 'deboss')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          config.textMode === 'deboss'
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Bajo Relieve (-0.40 mm tallado)
                      </button>
                    </div>
                  </div>
                  <span className="text-[10.5px] text-cyan-900 leading-tight">
                    {config.textMode === 'emboss'
                      ? '⭐ Modo Sobre Relieve: Las letras sobresalen +0.36 mm del plano superior para impresión directa o cambio de color en altura.'
                      : '✂️ Modo Bajo Relieve: Letras talladas -0.40 mm con plano superior 100% abierto y piso sólido (el laminador no tapa las letras).'}
                  </span>
                </div>
              )}
            </div>

            {/* Orificio para Argolla de Llavero */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5">
                <CircleDot className="w-4 h-4 text-amber-600" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">Orificio de Llavero</span>
                  <span className="text-[11px] text-slate-500">Diámetro 4.0 mm (extremo izquierdo)</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.addKeychainHole}
                onChange={(e) => updateConfig('addKeychainHole', e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded-md cursor-pointer"
              />
            </div>
          </div>

          {/* Tarjeta de Descarga de Archivos 3D */}
          <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white rounded-3xl p-6 shadow-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                <h3 className="font-black text-lg">Descargas para Impresión 3D</h3>
              </div>
              {modelResult && (
                <span className="text-xs bg-black/20 px-2.5 py-1 rounded-full font-mono">
                  ~{modelResult.estimatedWeightGrams}g · ~{modelResult.estimatedPrintTimeMinutes} min
                </span>
              )}
            </div>

            <p className="text-xs text-amber-100 leading-relaxed">
              Elige el formato de descarga ideal para tu impresora y laminador:
            </p>

            <div className="flex flex-col gap-2.5">
              {/* Opción 1: STL Monocolor Universal */}
              <button
                type="button"
                onClick={handleDownloadStl}
                className="w-full bg-white text-slate-900 hover:bg-amber-50 font-black text-sm py-3 px-4 rounded-2xl transition active:scale-95 shadow-sm flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5">
                  {downloadSuccess === 'STL' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Download className="w-4 h-4 text-amber-600" />
                  )}
                  <div className="flex flex-col text-left">
                    <span>{downloadSuccess === 'STL' ? '¡STL Descargado!' : 'Descargar STL (Monocolor)'}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {config.textMode === 'deboss' ? 'Bajo relieve tallado (-0.40 mm)' : 'Sobre relieve (+0.36 mm)'}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                  Universal
                </span>
              </button>

              {/* Opción 2: STL Multi-Parte ZIP (Favorito para Bambu Lab AMS y OrcaSlicer) */}
              <button
                type="button"
                onClick={handleDownloadMultiPartZip}
                className="w-full bg-amber-950/40 hover:bg-amber-950/55 text-white border border-white/20 font-bold text-sm py-3 px-4 rounded-2xl transition active:scale-95 flex items-center justify-between gap-2 shadow-xs"
                title="Descarga un ZIP con los STLs de Base, Puntos y Letras independientes listos para Bambu AMS"
              >
                <div className="flex items-center gap-2.5">
                  {downloadSuccess === 'MULTI_STL' ? (
                    <Check className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <Layers className="w-4 h-4 text-amber-200" />
                  )}
                  <div className="flex flex-col text-left">
                    <span>{downloadSuccess === 'MULTI_STL' ? '¡ZIP Multipieza Descargado!' : 'Descargar STL Multipieza (.zip)'}</span>
                    <span className="text-[10px] text-amber-200/80 font-normal">
                      3 partes separadas · Asignación directa en Bambu AMS
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold bg-emerald-500/30 text-emerald-100 border border-emerald-300/40 px-2 py-0.5 rounded-md">
                  Recomendado AMS
                </span>
              </button>

              {/* Opción 3: OBJ + MTL en ZIP */}
              <button
                type="button"
                onClick={handleDownloadObjZip}
                className="w-full bg-black/25 hover:bg-black/35 text-white border border-white/15 font-bold text-sm py-2.5 px-4 rounded-2xl transition active:scale-95 flex items-center justify-between gap-2"
                title="Empaqueta OBJ y MTL con nombres coincidentes para que el laminador cargue los colores sin errores"
              >
                <div className="flex items-center gap-2.5">
                  {downloadSuccess === 'OBJ_ZIP' ? (
                    <Check className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <Palette className="w-4 h-4 text-amber-200" />
                  )}
                  <div className="flex flex-col text-left">
                    <span>{downloadSuccess === 'OBJ_ZIP' ? '¡OBJ Multicolor Descargado!' : 'Descargar OBJ Multicolor (.zip)'}</span>
                    <span className="text-[10px] text-amber-100/70 font-normal">
                      Incluye archivo .obj + .mtl vinculados
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-200/90">
                  .obj + .mtl
                </span>
              </button>
            </div>

            {/* Acordeón para descargas individuales sueltas */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowIndividualFiles(!showIndividualFiles)}
                className="text-[11px] text-amber-200 hover:text-white flex items-center gap-1 font-semibold transition"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>{showIndividualFiles ? 'Ocultar archivos sueltos' : '¿Necesitas los archivos .obj o .mtl individuales?'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showIndividualFiles ? 'rotate-180' : ''}`} />
              </button>

              {showIndividualFiles && (
                <div className="grid grid-cols-2 gap-2 mt-2 p-2.5 bg-black/20 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={handleDownloadObjSingle}
                    className="py-1.5 px-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium text-amber-100 text-center transition"
                  >
                    {downloadSuccess === 'OBJ_SINGLE' ? '¡Descargado!' : 'Descargar solo .OBJ'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadMtlSingle}
                    className="py-1.5 px-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium text-amber-100 text-center transition"
                  >
                    {downloadSuccess === 'MTL_SINGLE' ? '¡Descargado!' : 'Descargar solo .MTL'}
                  </button>
                </div>
              )}
            </div>

            {/* Consejos de Laminación */}
            <div className="text-[11px] text-amber-100/90 bg-black/20 p-3.5 rounded-2xl flex flex-col gap-1.5 leading-tight border border-white/10">
              <span className="font-bold flex items-center gap-1 text-white">
                💡 Consejos para Laminar en Bambu Studio / OrcaSlicer:
              </span>
              <span>
                • <strong>Bajo Relieve (Tallado):</strong> El plano superior está 100% abierto en Z = 0.8 mm y baja 0.40 mm hasta el piso sólido. En el laminador se apreciará el corte nítido y la última capa no tapará las letras.
              </span>
              <span>
                • <strong>Multicolor con AMS:</strong> Usa la opción <em>STL Multipieza (.zip)</em>. Arrastra los 3 archivos a Bambu Studio, pulsa <strong>Sí</strong> en <em>¿Cargar estos archivos como un solo objeto con varias partes?</em> y asigna un color a cada ranura.
              </span>
              <span>
                • <strong>Error de archivo MTL:</strong> Si usas OBJ, descomprime el archivo ZIP en una carpeta antes de abrir el .obj; así el laminador encontrará el archivo .mtl gemelo en el mismo directorio.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
