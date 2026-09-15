'use client';

import React, { useState, useMemo } from 'react';
import { LaserConfig, GeneratedLaserSvg } from '@/types';
import { generateLaserSvg } from '@/lib/svgPathMerger';
import { Laser3DViewer } from './Laser3DViewer';
import { Download, Sparkles, Box, Eye, LayoutGrid } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LaserSvgGeneratorProps {
  text: string;
  config: LaserConfig;
}

export const LaserSvgGenerator: React.FC<LaserSvgGeneratorProps> = ({ text, config }) => {
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'split'>('split');
  const [previewMode2D, setPreviewMode2D] = useState<'mdf' | 'laser'>('mdf');

  const laserResult: GeneratedLaserSvg = useMemo(() => {
    return generateLaserSvg(text, config);
  }, [text, config]);

  const handleDownloadSvg = () => {
    const cleanWord = text.trim().replace(/[^A-Za-z0-9ñÑ]/g, '') || 'llavero';
    const filename = `llavero-senas-${cleanWord.toLowerCase()}.svg`;
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

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 flex flex-col gap-6">
      {/* Encabezado con título y único botón de Descarga */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-base font-extrabold">
              4
            </span>
            <span>Vista previa de tu llavero:</span>
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Llavero cortado en una sola pieza continua (<strong className="text-purple-700">{laserResult.widthMm} mm de largo</strong> × <strong className="text-purple-700">{laserResult.heightMm} mm de ancho fijo</strong>).
          </p>
        </div>

        {/* Único botón de acción: Descargar para Cortar */}
        <button
          onClick={handleDownloadSvg}
          className="px-6 py-3.5 rounded-2xl text-base font-extrabold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200 flex items-center gap-2.5 transition-all active:scale-95 flex-1 sm:flex-none justify-center cursor-pointer"
        >
          <Download className="w-5 h-5" />
          <span>Descargar para Cortar</span>
        </button>
      </div>

      {/* Selector de modo de visualización: 2D, 3D o Ambas Vistas */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setViewMode('2d')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === '2d' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-purple-600" />
            <span>Vista en 2D</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('3d')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === '3d' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-purple-600" />
            <span>Vista 3D</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer hidden sm:flex ${
              viewMode === 'split' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-purple-600" />
            <span>Ambas Vistas (2D y 3D)</span>
          </button>
        </div>

        {/* Sub-selector para 2D si está en modo 2D o split */}
        {(viewMode === '2d' || viewMode === 'split') && (
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setPreviewMode2D('mdf')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                previewMode2D === 'mdf' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Madera Real (MDF)
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode2D('laser')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                previewMode2D === 'laser' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Líneas Láser (Rojo / Negro)
            </button>
          </div>
        )}
      </div>

      {/* Contenedor de visualizadores */}
      <div className={`w-full ${viewMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-2 gap-5 items-start' : 'flex flex-col'}`}>
        {/* Visualizador 2D (Corte Láser Plano) */}
        {(viewMode === '2d' || viewMode === 'split') && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-purple-600" />
                <span>Vista Técnica 2D (Corte y Grabado Láser)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Escala Vectorial SVG</span>
            </div>

            <div
              className={`w-full min-h-[320px] sm:min-h-[380px] rounded-3xl border-2 p-6 flex items-center justify-center overflow-x-auto transition-colors shadow-inner ${
                previewMode2D === 'mdf' ? 'bg-[#f7eedf] border-[#e8d5bf]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                className="max-w-full flex items-center justify-center drop-shadow-sm"
                dangerouslySetInnerHTML={{ __html: laserResult.svgString }}
              />
            </div>
          </div>
        )}

        {/* Visualizador 3D Interactivo (Three.js WebGL) */}
        {(viewMode === '3d' || viewMode === 'split') && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
              <span className="flex items-center gap-1.5">
                <Box className="w-4 h-4 text-purple-600" />
                <span>Vista 3D Interactiva (Simulador en Madera)</span>
              </span>
              <span className="text-[11px] text-purple-600 font-semibold">Arrastra con el dedo o mouse</span>
            </div>

            <Laser3DViewer laserResult={laserResult} />
          </div>
        )}
      </div>

      {/* Nota informativa para el stand */}
      <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 text-sm text-purple-900 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Listo para la cortadora del stand:</strong> Al presionar <strong>"Descargar para Cortar"</strong> obtendrás el archivo listo para enviar a la máquina láser en el stand de MakerBox. La cortadora cortará el borde exterior como una sola pieza continua y marcará los detalles de los dedos en la superficie de la madera.
        </p>
      </div>
    </div>
  );
};
