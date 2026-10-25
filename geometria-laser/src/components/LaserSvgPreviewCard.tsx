'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  Flame,
  Maximize2,
  Ruler,
  Scissors,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
} from 'lucide-react';
import {
  downloadLaserSvg,
  FALCON_BED_HEIGHT_MM,
  FALCON_BED_WIDTH_MM,
} from '@/lib/falconLaserSpec';

interface LaserSvgPreviewCardProps {
  svgContent: string;
  widthMm: number;
  heightMm: number;
  estimatedMinutes: number;
  filename: string;
  title?: string;
}

export function LaserSvgPreviewCard({
  svgContent,
  widthMm,
  heightMm,
  estimatedMinutes,
  filename,
  title = 'Plano Vectorial de Corte y Grabado (.SVG)',
}: LaserSvgPreviewCardProps) {
  const [viewStyle, setViewStyle] = useState<'mdf' | 'cad'>('mdf');
  const [zoom, setZoom] = useState<number>(1);
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);

  const fitsBed =
    (widthMm <= FALCON_BED_WIDTH_MM && heightMm <= FALCON_BED_HEIGHT_MM) ||
    (heightMm <= FALCON_BED_WIDTH_MM && widthMm <= FALCON_BED_HEIGHT_MM);

  const bedUsagePercent = Math.min(
    100,
    Math.round(((widthMm * heightMm) / (FALCON_BED_WIDTH_MM * FALCON_BED_HEIGHT_MM)) * 1000) / 10
  );

  // Estilizamos visualmente el SVG para el modo madera MDF sin alterar el archivo descargable real
  const previewSvgHtml = React.useMemo(() => {
    const cleaned = svgContent.replace(/<\?xml[^>]*\?>/i, '');
    // Reemplazar dimensiones fijas en mm del tag raíz por 100% responsivo dentro del visor
    const responsiveSvg = cleaned.replace(
      /<svg([^>]*?)width="[^"]+"([^>]*?)height="[^"]+"/,
      '<svg$1width="100%"$2height="100%" style="max-height: 430px; display: block; margin: 0 auto;"'
    );

    if (viewStyle === 'cad') {
      return responsiveSvg;
    }

    // En modo simulación MDF 3mm tostado:
    // - Grabado negro -> café quemado láser (#2c1608)
    // - Marcado azul -> pirograbado fino ámbar oscuro (#78350f)
    // - Corte rojo -> línea láser carmesí nítida (#dc2626) con mayor grosor visual para pantallas
    return responsiveSvg
      .replace(/#000000/gi, '#2b1508')
      .replace(/#0000FF/gi, '#854d0e')
      .replace(/stroke-width="0\.18"/g, 'stroke-width="0.45"');
  }, [svgContent, viewStyle]);

  const handleDownload = () => {
    downloadLaserSvg(svgContent, filename);
    setDownloaded(true);
    try {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.8 },
        colors: ['#4f46e5', '#f59e0b', '#10b981', '#ec4899'],
      });
    } catch {
      // Ignorar en entornos sin canvas
    }
    setTimeout(() => setDownloaded(false), 3200);
  };

  const handleCopySvg = async () => {
    try {
      await navigator.clipboard.writeText(svgContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignorar si no hay permisos de portapapeles
    }
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Cabecera de la estación de previsualización láser */}
      <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[11px] font-black uppercase">
              <Scissors className="w-3 h-3" />
              Salida Lista para CR Falcon 2 · 10W
            </span>
            {fitsBed ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                <CheckCircle2 className="w-3 h-3" />
                Cabe en cama 400×415 mm ({bedUsagePercent}%)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-black">
                <AlertTriangle className="w-3 h-3" />
                Excede cama 400×415 mm — reduce escala
              </span>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900">{title}</h3>
        </div>

        {/* Controles de estilo de vista y zoom */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewStyle('mdf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                viewStyle === 'mdf'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              🪵 Vista MDF 3mm
            </button>
            <button
              type="button"
              onClick={() => setViewStyle('cad')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                viewStyle === 'cad'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              📐 Capas LightBurn
            </button>
          </div>

          <div className="inline-flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.75, Math.round((z - 0.25) * 100) / 100))}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
              title="Alejar"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="px-2 py-1 text-[11px] font-mono font-bold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              title="Restablecer zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.25, Math.round((z + 0.25) * 100) / 100))}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
              title="Acercar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lienzo de vista previa SVG */}
      <div
        className={`relative w-full min-h-[300px] sm:min-h-[370px] overflow-auto p-6 flex items-center justify-center transition-colors ${
          viewStyle === 'mdf'
            ? 'bg-[#e7c79c]'
            : 'bg-slate-50'
        }`}
        style={
          viewStyle === 'mdf'
            ? {
                backgroundImage:
                  'repeating-linear-gradient(12deg, rgba(160,105,50,0.06) 0px, rgba(160,105,50,0.06) 3px, transparent 3px, transparent 9px), radial-gradient(circle at 50% 50%, #edd3ae 0%, #deb887 100%)',
              }
            : {
                backgroundImage:
                  'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }
        }
      >
        <div
          className="w-full transition-transform duration-200 origin-center"
          style={{ transform: `scale(${zoom})` }}
          dangerouslySetInnerHTML={{ __html: previewSvgHtml }}
        />

        {/* Etiqueta flotante con medidas reales */}
        <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-mono font-bold flex items-center gap-2 shadow-md">
          <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
          <span>
            Plancha: {widthMm} × {heightMm} mm (Escala 1:1)
          </span>
        </div>
      </div>

      {/* Barra de métricas + Descarga */}
      <div className="p-5 sm:p-6 bg-white border-t border-slate-200 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-400 font-bold flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5 text-indigo-500" /> Dimensiones SVG
            </span>
            <span className="text-sm sm:text-base font-black text-slate-900 mt-0.5 block">
              {widthMm} × {heightMm} mm
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-400 font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Tiempo Falcon 10W
            </span>
            <span className="text-sm sm:text-base font-black text-slate-900 mt-0.5 block">
              ~{estimatedMinutes} min (MDF 3mm)
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 col-span-2 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 font-bold text-red-600">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Corte (400 mm/m · 100%)
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Marcado (3000 mm/m · 40%)
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-slate-900">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900" /> Grabado (3500 mm/m · 45%)
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 min-h-[54px] py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white shadow-lg shadow-orange-200 transition-all active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer"
          >
            {downloaded ? (
              <>
                <Check className="w-5 h-5" />
                <span>¡Archivo {filename} Descargado!</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Exportar .SVG para CR Falcon 2 10W ({filename})</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopySvg}
            className="py-3.5 px-4 rounded-2xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            title="Copiar código fuente SVG al portapapeles"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">SVG Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar SVG</span>
              </>
            )}
          </button>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <span>
            <strong>Tip LightBurn:</strong> Importa el archivo directamente (`Ctrl+I`). Los textos ya están convertidos a curvas vectoriales exactas y los cortes interiores están ordenados antes que el perímetro exterior.
          </span>
        </div>
      </div>
    </div>
  );
}
