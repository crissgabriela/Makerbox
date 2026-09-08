'use client';

import React, { useState, useMemo } from 'react';
import {
  BrailleConfig,
  DEFAULT_BRAILLE_CONFIG,
  generateBraille3D,
  downloadStl,
  downloadObj,
  downloadMtl
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
  CircleDot
} from 'lucide-react';
import confetti from 'canvas-confetti';

const QUICK_WORDS = ['CRISS', 'MAKERBOX', 'UTALCA', 'TALCA', 'HOLA', 'INCLUSIÓN'];

export const BrailleSection: React.FC = () => {
  const [config, setConfig] = useState<BrailleConfig>(DEFAULT_BRAILLE_CONFIG);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

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

  const handleDownloadStl = () => {
    if (!modelResult) return;
    const cleanName = (config.text.trim() || 'Llavero').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '_');
    downloadStl(modelResult.stlBuffer, `Llavero_Braille_${cleanName}.stl`);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#f59e0b', '#1d4ed8', '#10b981']
    });

    setDownloadSuccess('STL');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleDownloadObj = () => {
    if (!modelResult) return;
    const cleanName = (config.text.trim() || 'Llavero').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '_');
    // Descargar OBJ
    downloadObj(modelResult.objContent, `Llavero_Braille_${cleanName}.obj`);
    // Descargar MTL acompañante
    downloadMtl(modelResult.mtlContent, `material.mtl`);

    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#ec4899', '#8b5cf6', '#3b82f6', '#f59e0b']
    });

    setDownloadSuccess('OBJ');
    setTimeout(() => setDownloadSuccess(null), 3500);
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
            Escribe cualquier palabra o tu nombre y la plataforma lo traduce al alfabeto Braille táctil. Genera una plaquita ergonómica de <strong>1.0 mm de espesor</strong> con puntos en relieve de <strong>0.36 mm</strong> lista para laminar e imprimir en 3D en <strong>STL</strong> o en <strong>OBJ multicolor</strong>.
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

            {/* Espesor de la Placa (1.0 mm exacto) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Espesor de la Placa:</span>
                <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {config.plateThicknessMm.toFixed(2)} mm
                </span>
              </div>
              <input
                type="range"
                min="0.6"
                max="2.5"
                step="0.1"
                value={config.plateThicknessMm}
                onChange={(e) => updateConfig('plateThicknessMm', parseFloat(e.target.value))}
                className="accent-amber-500 w-full cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">
                ⭐ Valor óptimo solicitado: 1.0 mm (liviano, rápido y resistente).
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
                max="0.80"
                step="0.02"
                value={config.dotHeightMm}
                onChange={(e) => updateConfig('dotHeightMm', parseFloat(e.target.value))}
                className="accent-amber-500 w-full cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">
                ⭐ Valor solicitado: 0.36 mm (sensibilidad táctil ideal sin raspar).
              </span>
            </div>

            {/* Diámetro del Punto Braille */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Diámetro del Punto:</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                  {(config.dotRadiusMm * 2).toFixed(2)} mm
                </span>
              </div>
              <input
                type="range"
                min="0.4"
                max="1.0"
                step="0.05"
                value={config.dotRadiusMm}
                onChange={(e) => {
                  const r = parseFloat(e.target.value);
                  updateConfig('dotRadiusMm', r);
                  updateConfig('debossStrokeMm', Math.round(r * 2 * 100) / 100);
                }}
                className="accent-amber-500 w-full cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">
                ⭐ Valor solicitado: 1.2 mm de diámetro (semiesferas pegadas a la placa).
              </span>
            </div>

            {/* Palabra Escrita en Bajorrelieve estilo Arial (0.4 mm prof, 1.2 mm trazo) */}
            <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-cyan-50/70 border border-cyan-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">✍️</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">Texto en Bajo Relieve (Arial)</span>
                    <span className="text-[11px] text-cyan-800">Sobre el Braille · Fuente redonda y trazo coherente</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.includeDebossedText}
                  onChange={(e) => updateConfig('includeDebossedText', e.target.checked)}
                  className="w-5 h-5 accent-cyan-600 rounded-md cursor-pointer"
                />
              </div>

              {config.includeDebossedText && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-cyan-200/60 text-xs">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-500">Profundidad de grabado:</span>
                    <span className="font-mono font-bold text-cyan-700 bg-white px-2 py-0.5 rounded-md border border-cyan-300">
                      -{config.debossDepthMm.toFixed(2)} mm
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-500">Espesor del trazo:</span>
                    <span className="font-mono font-bold text-cyan-700 bg-white px-2 py-0.5 rounded-md border border-cyan-300">
                      {config.debossStrokeMm.toFixed(2)} mm
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Orificio para Argolla de Llavero */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5">
                <CircleDot className="w-4 h-4 text-amber-600" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">Orificio de Llavero</span>
                  <span className="text-[11px] text-slate-500">Diámetro 4.5 mm (extremo izquierdo)</span>
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
              Descarga el modelo en el formato que mejor se adapte a tu impresora:
            </p>

            <div className="flex flex-col gap-2.5">
              {/* Opción 1: STL Universal */}
              <button
                type="button"
                onClick={handleDownloadStl}
                className="w-full bg-white text-slate-900 hover:bg-amber-50 font-black text-sm py-3.5 px-4 rounded-2xl transition active:scale-95 shadow-sm flex items-center justify-center gap-2"
              >
                {downloadSuccess === 'STL' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">¡Archivo STL Descargado!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-amber-600" />
                    <span>Descargar STL (Universal 3D)</span>
                  </>
                )}
              </button>

              {/* Opción 2: OBJ con Color / Multicolor */}
              <button
                type="button"
                onClick={handleDownloadObj}
                className="w-full bg-slate-900/30 hover:bg-slate-900/40 text-white border border-white/25 font-bold text-sm py-3 px-4 rounded-2xl transition active:scale-95 flex items-center justify-center gap-2"
                title="Incluye Vertex Colors y grupos Base_Placa y Puntos_Braille con archivo MTL"
              >
                {downloadSuccess === 'OBJ' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>¡OBJ Multicolor Descargado!</span>
                  </>
                ) : (
                  <>
                    <Palette className="w-4 h-4 text-amber-200" />
                    <span>Descargar OBJ con Color (Bambu/Prusa)</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-[11px] text-amber-100/90 bg-black/15 p-3 rounded-xl flex flex-col gap-1 leading-tight">
              <span className="font-bold flex items-center gap-1">
                💡 Consejo de Laminación en el Stand:
              </span>
              <span>
                • <strong>Altura de capa:</strong> 0.12 mm o 0.16 mm para que los domos de 0.36 mm queden suaves y táctiles.
              </span>
              <span>
                • <strong>Relleno (Infill):</strong> 100% (al tener 1 mm de espesor, se imprime sólido en solo 6 a 8 capas).
              </span>
              <span>
                • <strong>Multicolor (AMS / MMU):</strong> Al abrir el archivo OBJ en Bambu Studio o PrusaSlicer, selecciona el grupo de puntos y asígnale el segundo filamento para un contraste visual y táctil perfecto.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
