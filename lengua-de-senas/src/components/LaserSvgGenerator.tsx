'use client';

import React, { useState, useMemo } from 'react';
import { LaserConfig, GeneratedLaserSvg } from '@/types';
import { generateLaserSvg } from '@/lib/svgPathMerger';
import { Download, Copy, Check, Sparkles, Scissors, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LaserSvgGeneratorProps {
  text: string;
  config: LaserConfig;
}

export const LaserSvgGenerator: React.FC<LaserSvgGeneratorProps> = ({ text, config }) => {
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<'mdf' | 'laser'>('mdf');

  const laserResult: GeneratedLaserSvg = useMemo(() => {
    return generateLaserSvg(text, config);
  }, [text, config]);

  const handleDownloadSvg = () => {
    const cleanWord = text.trim().replace(/[^A-Za-z0-9ñÑ]/g, '') || 'recuerdo';
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

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.75 }
      });
    } catch {
      // Ignorar
    }
  };

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
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-base font-extrabold">
              4
            </span>
            <span>Vista previa de tu recuerdo:</span>
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Así quedará tu pieza física cortada en una sola unidad continua ({laserResult.widthMm} mm de ancho × {laserResult.heightMm} mm de alto).
          </p>
        </div>

        {/* Botones de acción principales */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={handleCopySvg}
            className="px-4 py-3 rounded-2xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95 flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
          </button>

          <button
            onClick={handleDownloadSvg}
            className="px-6 py-3.5 rounded-2xl text-base font-extrabold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200 flex items-center gap-2.5 transition-all active:scale-95 flex-1 sm:flex-none justify-center"
          >
            <Download className="w-5 h-5" />
            <span>Descargar para Cortar</span>
          </button>
        </div>
      </div>

      {/* Selector de visualización */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl">
          <span className="text-slate-500 font-medium px-2">Ver como:</span>
          <button
            type="button"
            onClick={() => setPreviewMode('mdf')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              previewMode === 'mdf'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Madera Real (MDF)
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('laser')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              previewMode === 'laser'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Líneas Técnicas de Corte Láser
          </button>
        </div>

        {previewMode === 'laser' && (
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              Línea de Corte (Rojo)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              Líneas de Dedos (Azul)
            </span>
          </div>
        )}
      </div>

      {/* Lienzo del recuerdo */}
      <div
        className={`w-full min-h-[220px] rounded-2xl border-2 p-6 flex items-center justify-center overflow-x-auto transition-colors ${
          previewMode === 'mdf'
            ? 'bg-[#f7eedf] border-[#e8d5bf]'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div
          className="max-w-full flex items-center justify-center drop-shadow-sm"
          dangerouslySetInnerHTML={{ __html: laserResult.svgString }}
        />
      </div>

      <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 text-sm text-purple-900 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Listo para la cortadora del stand:</strong> Al presionar <strong>"Descargar para Cortar"</strong> obtendrás el archivo listo para enviar a la máquina láser en el stand de MakerBox. La cortadora cortará el borde exterior como una sola pieza continua y marcará los detalles de los dedos en la superficie de la madera.
        </p>
      </div>
    </div>
  );
};
