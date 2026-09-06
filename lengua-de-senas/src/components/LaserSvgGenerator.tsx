'use client';

import React, { useState, useMemo } from 'react';
import { LaserConfig, GeneratedLaserSvg } from '@/types';
import { generateLaserSvg } from '@/lib/svgPathMerger';
import { Download, Copy, Check, Ruler, Scissors, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LaserSvgGeneratorProps {
  text: string;
  config: LaserConfig;
}

export const LaserSvgGenerator: React.FC<LaserSvgGeneratorProps> = ({ text, config }) => {
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<'laser' | 'mdf' | 'acrylic'>('laser');

  // Generación reactiva del SVG técnico
  const laserResult: GeneratedLaserSvg = useMemo(() => {
    return generateLaserSvg(text, config);
  }, [text, config]);

  // Descarga directa del archivo SVG
  const handleDownloadSvg = () => {
    const cleanWord = text.trim().replace(/[^A-Za-z0-9ñÑ]/g, '') || 'senas';
    const filename = `corte-laser-${cleanWord.toLowerCase()}-${config.mode}.svg`;
    const blob = new Blob([laserResult.svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Efecto de celebración con confetti para el stand
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch {
      // Ignorar si canvas-confetti no está listo
    }
  };

  // Copiar código SVG al portapapeles
  const handleCopySvg = async () => {
    try {
      await navigator.clipboard.writeText(laserResult.svgString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl flex flex-col gap-4">
      {/* Barra de cabecera con dimensiones y botones de acción */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-800/80 text-purple-400">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Archivo Vectorial SVG para Cortadora Láser</span>
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 font-mono text-purple-300">
                <Ruler className="w-3.5 h-3.5 text-purple-400" />
                {laserResult.widthMm} × {laserResult.heightMm} mm
              </span>
              <span>•</span>
              <span>{laserResult.signCount} {laserResult.signCount === 1 ? 'letra' : 'letras'}</span>
            </div>
          </div>
        </div>

        {/* Botones de acción rápida */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleCopySvg}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            title="Copiar código SVG"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado!' : 'Copiar SVG'}</span>
          </button>

          <button
            onClick={handleDownloadSvg}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition active:scale-95 flex-1 sm:flex-none justify-center"
            title="Descargar archivo SVG listo para LightBurn o RDWorks"
          >
            <Download className="w-4 h-4" />
            <span>Descargar SVG Láser</span>
          </button>
        </div>
      </div>

      {/* Selector de modo de previsualización (Técnico / MDF / Acrílico) */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 px-2 font-medium">Visualización:</span>
          <button
            onClick={() => setPreviewMode('laser')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              previewMode === 'laser'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Láser Técnico (Capas)
          </button>
          <button
            onClick={() => setPreviewMode('mdf')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              previewMode === 'mdf'
                ? 'bg-amber-900/60 text-amber-200 shadow-sm border border-amber-700/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Simulación Madera/MDF
          </button>
          <button
            onClick={() => setPreviewMode('acrylic')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              previewMode === 'acrylic'
                ? 'bg-cyan-950/70 text-cyan-200 shadow-sm border border-cyan-700/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Acrílico Translúcido
          </button>
        </div>

        {/* Leyenda de Capas Estándar Láser */}
        {previewMode === 'laser' && (
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/20" />
              Rojo: Corte exterior
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-500/20" />
              Azul: Marcado dedos
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 ring-2 ring-slate-400/20" />
              Negro: Grabado texto
            </span>
          </div>
        )}
      </div>

      {/* Lienzo de Previsualización Interactivo */}
      <div
        className={`w-full min-h-[220px] rounded-xl border p-4 sm:p-6 flex items-center justify-center overflow-x-auto transition-colors ${
          previewMode === 'laser'
            ? 'bg-slate-950 border-slate-800'
            : previewMode === 'mdf'
            ? 'bg-[#d8a873]/20 border-[#d8a873]/40'
            : 'bg-cyan-950/30 border-cyan-800/40 backdrop-blur-sm'
        }`}
      >
        <div
          className="max-w-full flex items-center justify-center drop-shadow-2xl transition-all"
          dangerouslySetInnerHTML={{ __html: laserResult.svgString }}
        />
      </div>

      {/* Nota técnica para operario en stand */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-400 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-purple-300">Compatibilidad directa:</strong> Este archivo SVG
          importa automáticamente las capas en <strong>LightBurn</strong> y <strong>RDWorks</strong>.
          La capa roja está calibrada para el contorno de corte cerrado (la pieza sale completa sin
          desarmarse) y la capa azul para marcado vectorial a mayor velocidad sin cortar el material.
        </div>
      </div>
    </div>
  );
};
