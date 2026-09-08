'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LithophaneConfig,
  DEFAULT_LITHOPHANE_CONFIG,
  LithophaneResult,
  generateLithophane3D,
  downloadStlFile
} from '@/lib/lithophaneGenerator';
import { Lithophane3DViewer } from './Lithophane3DViewer';
import {
  Upload,
  Download,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Info,
  Check,
  Printer,
  Maximize2,
  RefreshCw,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Imágenes de muestra predefinidas para pruebas instantáneas en el stand
const PRESET_SAMPLES = [
  {
    name: 'Logo MakerBox',
    url: '/logos/makerbox-color.jpg',
    desc: 'Logotipo oficial de innovación'
  },
  {
    name: 'Escudo UTalca',
    url: '/logos/utalca-ingenieria.png',
    desc: 'Facultad de Ingeniería'
  },
  {
    name: 'Seña Chilena',
    url: '/signs/letters/C.png',
    desc: 'Mano del alfabeto'
  }
];

export const LithophaneSection: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string>(PRESET_SAMPLES[0].url);
  const [config, setConfig] = useState<LithophaneConfig>(DEFAULT_LITHOPHANE_CONFIG);
  const [result, setResult] = useState<LithophaneResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSquare100, setIsSquare100] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateConfig = <K extends keyof LithophaneConfig>(key: K, value: LithophaneConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Genera el modelo 3D cuando cambia la imagen o la configuración
  useEffect(() => {
    let isCancelled = false;

    async function compute() {
      if (!selectedImage) return;
      setIsGenerating(true);
      try {
        const res = await generateLithophane3D(selectedImage, config);
        if (!isCancelled) {
          setResult(res);
        }
      } catch (err) {
        console.error('Error generando litofanía:', err);
      } finally {
        if (!isCancelled) {
          setIsGenerating(false);
        }
      }
    }

    const timer = setTimeout(compute, 250);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [selectedImage, config]);

  const [isDragging, setIsDragging] = useState(false);

  // Soporte para pegar fotos directamente con Ctrl + V (ej. desde WhatsApp Web o navegador)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              if (typeof ev.target?.result === 'string') {
                setSelectedImage(ev.target.result);
                try {
                  confetti({
                    particleCount: 50,
                    spread: 70,
                    origin: { y: 0.8 },
                    colors: ['#3b82f6', '#8b5cf6', '#10b981']
                  });
                } catch {
                  // Ignorar
                }
              }
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setSelectedImage(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setSelectedImage(ev.target.result);
        try {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.8 },
            colors: ['#3b82f6', '#8b5cf6', '#10b981']
          });
        } catch {
          // Ignorar
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadStl = () => {
    if (!result) return;
    const filename = `litofania-3d-${config.widthMm}x${config.heightMm}mm.stl`;
    downloadStlFile(result.stlBuffer, filename);

    try {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.75 }
      });
    } catch {
      // Ignorar
    }
  };

  const setFixed100x100 = () => {
    setIsSquare100(true);
    setConfig((prev) => ({
      ...prev,
      widthMm: 100,
      heightMm: 100
    }));
  };

  return (
    <div className="w-full flex flex-col gap-6 sm:gap-8">
      {/* Banner explicativo de la herramienta */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-100 via-indigo-50 to-purple-50 border border-blue-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-200 text-blue-900 text-xs font-bold flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 text-blue-700" />
              MakerBox · Impresión 3D
            </span>
            <span className="text-xs font-semibold text-slate-500 hidden md:inline">
              Transformador de Fotos a Modelos STL
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Generador de Litofanías 3D
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Sube una fotografía. La plataforma la convertirá en un modelo 3D con relieve según la luminosidad (zonas claras más delgadas y zonas oscuras más gruesas) para imprimir en filamento blanco y verla a contraluz.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-200 transition active:scale-95 flex items-center gap-2 flex-shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Subir Mi Foto</span>
        </button>
      </div>

      {/* Grid de 2 columnas: Controles a la izquierda y Visor 3D a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Configuración de la Litofanía */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Paso 1: Selección de Imagen */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-extrabold">
                  1
                </span>
                <span>Imagen de la litofanía:</span>
              </h3>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Zona de subida o foto actual */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-4 transition flex flex-col items-center justify-center gap-2 text-center ${
                isDragging
                  ? 'border-blue-600 bg-blue-100/60 ring-4 ring-blue-300/40 scale-[1.01]'
                  : 'border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/30'
              }`}
            >
              {selectedImage ? (
                <div className="flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImage}
                    alt="Foto para litofanía"
                    className="max-h-36 rounded-xl object-contain shadow-xs border border-slate-200 bg-white"
                  />
                  <span className="text-xs font-bold text-blue-700 group-hover:underline">
                    Toca para cambiar la imagen
                  </span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-blue-500" />
                  <span className="text-sm font-bold text-slate-700">Toca para elegir una foto</span>
                  <span className="text-xs text-slate-400">Formatos JPG, PNG o WebP</span>
                </>
              )}
            </div>

            {/* Tip rápido para ferias */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50/80 border border-blue-200/60 text-[11px] text-blue-900 leading-tight">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                <strong>Atajo en el stand:</strong> Arrastra cualquier imagen aquí o presiona <strong>Ctrl + V</strong> para pegarla directo (ej. copiada desde WhatsApp Web).
              </span>
            </div>

            {/* Muestras predeterminadas para pruebas en el stand */}
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-xs font-bold text-slate-500">O prueba con una muestra del stand:</span>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_SAMPLES.map((sample) => (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => setSelectedImage(sample.url)}
                    className={`p-2 rounded-xl border text-left transition flex flex-col items-center gap-1.5 active:scale-95 ${
                      selectedImage === sample.url
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-300/30'
                        : 'border-slate-200 bg-slate-50 hover:bg-white'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sample.url}
                      alt={sample.name}
                      className="w-10 h-10 object-contain rounded-md"
                    />
                    <span className="text-[11px] font-bold text-slate-800 text-center truncate w-full">
                      {sample.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Paso 2: Ajustes de Medidas (100x100mm y Espesores) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-extrabold">
                  2
                </span>
                <span>Dimensiones y Espesores:</span>
              </h3>

              <button
                type="button"
                onClick={setFixed100x100}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  isSquare100
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Ajustar a cuadrado estándar de 100x100mm"
              >
                100×100 mm
              </button>
            </div>

            {/* Tamaño general (Ancho y Alto) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Ancho:</span>
                  <span className="font-extrabold text-blue-700">{config.widthMm} mm</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={150}
                  step={5}
                  value={config.widthMm}
                  onChange={(e) => {
                    setIsSquare100(false);
                    updateConfig('widthMm', Number(e.target.value));
                  }}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
              </div>

              <div className="flex flex-col gap-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Alto:</span>
                  <span className="font-extrabold text-blue-700">{config.heightMm} mm</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={150}
                  step={5}
                  value={config.heightMm}
                  onChange={(e) => {
                    setIsSquare100(false);
                    updateConfig('heightMm', Number(e.target.value));
                  }}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* Espesores de Luz y Sombra */}
            <div className="flex flex-col gap-3">
              {/* Espesor mínimo (zonas claras) */}
              <div className="flex flex-col gap-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Espesor Zonas Claras (Luz):</span>
                  <span className="font-extrabold text-blue-700">{config.minThicknessMm} mm</span>
                </div>
                <input
                  type="range"
                  min={0.6}
                  max={1.2}
                  step={0.1}
                  value={config.minThicknessMm}
                  onChange={(e) => updateConfig('minThicknessMm', Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <span className="text-[11px] text-slate-400">
                  Grosor por donde la luz atraviesa con facilidad (0.8 mm recomendado)
                </span>
              </div>

              {/* Espesor máximo (zonas oscuras) */}
              <div className="flex flex-col gap-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Espesor Zonas Oscuras (Sombra):</span>
                  <span className="font-extrabold text-blue-700">{config.maxThicknessMm} mm</span>
                </div>
                <input
                  type="range"
                  min={1.8}
                  max={3.0}
                  step={0.1}
                  value={config.maxThicknessMm}
                  onChange={(e) => updateConfig('maxThicknessMm', Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <span className="text-[11px] text-slate-400">
                  Grosor que bloquea la luz creando el contraste (2.0 a 2.4 mm)
                </span>
              </div>
            </div>

            {/* Marco y Opciones Adicionales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex flex-col gap-1 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Ancho de Marco:</span>
                  <span className="font-extrabold text-blue-700">{config.frameWidthMm} mm</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={8}
                  step={0.5}
                  value={config.frameWidthMm}
                  onChange={(e) => updateConfig('frameWidthMm', Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
              </div>

              {/* Checkbox de Pie de Apoyo */}
              <label className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 cursor-pointer hover:bg-blue-50/40 transition">
                <input
                  type="checkbox"
                  checked={config.hasStandBase}
                  onChange={(e) => updateConfig('hasStandBase', e.target.checked)}
                  className="w-5 h-5 rounded-md accent-blue-600 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">Pie de apoyo</span>
                  <span className="text-[11px] text-slate-500">Base para pararse en la mesa</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Visor 3D Interactivo y Descarga STL */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-extrabold">
                    3
                  </span>
                  <span>Visor 3D en Tiempo Real:</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Gira la pieza con el dedo y prueba el botón <strong>"Efecto a Contraluz"</strong>.
                </p>
              </div>

              {/* Botón Principal de Descarga STL */}
              <button
                type="button"
                onClick={handleDownloadStl}
                disabled={!result || isGenerating}
                className="px-6 py-3.5 rounded-2xl text-base font-extrabold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2 justify-center w-full sm:w-auto"
              >
                <Download className="w-5 h-5" />
                <span>Descargar Modelo STL</span>
              </button>
            </div>

            {/* Lienzo WebGL Three.js con simulación de luz y ampolleta trasera */}
            <Lithophane3DViewer
              geometry={result?.geometry ?? null}
              imageSource={selectedImage}
              config={config}
              isLoading={isGenerating}
            />

            {/* Métricas Técnicas para Laminación */}
            {result && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-slate-500">Dimensiones:</span>
                  <span className="text-sm font-extrabold text-slate-800">
                    {result.widthMm} × {result.heightMm} mm
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-slate-500">Malla 3D:</span>
                  <span className="text-sm font-extrabold text-blue-700">
                    {result.triangleCount.toLocaleString()} △
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-slate-500">Filamento PLA:</span>
                  <span className="text-sm font-extrabold text-slate-800">
                    ~{result.estimatedWeightGrams} gramos
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-slate-500">Tiempo aprox:</span>
                  <span className="text-sm font-extrabold text-slate-800">
                    ~{Math.floor(result.estimatedPrintTimeMinutes / 60)}h {result.estimatedPrintTimeMinutes % 60}m
                  </span>
                </div>
              </div>
            )}

            {/* Tarjeta de Recomendaciones para el Operador del Stand */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
              <Printer className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed flex flex-col gap-1">
                <span className="font-bold text-blue-950">
                  Instrucciones de Laminación (Cura / PrusaSlicer / Bambu Studio):
                </span>
                <p>
                  1. Imprimir en <strong>filamento blanco</strong> (PLA o PETG).<br />
                  2. Configurar <strong>100% de relleno (Infill)</strong> para que la luz se transmita de forma continua sin patrones de rejilla.<br />
                  3. Orientar la litofanía <strong>de pie verticalmente</strong> sobre la base para obtener máxima resolución fotográfica en el eje Z.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
