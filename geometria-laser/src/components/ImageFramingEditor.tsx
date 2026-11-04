'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Check,
  X,
  Sparkles,
  Maximize2,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

interface ImageFramingEditorProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
  onApply: (croppedDataUrl: string) => void;
  title?: string;
  confirmLabel?: string;
}

export const ImageFramingEditor: React.FC<ImageFramingEditorProps> = ({
  imageSrc,
  isOpen,
  onClose,
  onApply,
  title = 'Ajustar Encuadre y Zoom para Litofanía 3D',
  confirmLabel = 'Aplicar al Modelo 3D'
}) => {
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [isApplying, setIsApplying] = useState(false);

  // Dimensiones del visor cuadrado en pantalla (px)
  const [viewportSize, setViewportSize] = useState(360);

  const containerRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // Actualizar tamaño de viewport según el contenedor de la pantalla
  useEffect(() => {
    if (!isOpen) return;

    const updateSize = () => {
      if (containerRef.current) {
        const availableW = containerRef.current.clientWidth - 40;
        const availableH = window.innerHeight * 0.5;
        const size = Math.min(Math.max(280, Math.min(availableW, availableH)), 420);
        setViewportSize(size);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isOpen]);

  // Cargar imagen y obtener dimensiones reales
  useEffect(() => {
    if (!imageSrc || !isOpen) return;

    const img = new Image();
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      // Resetear transformaciones para la nueva imagen
      setZoom(1.0);
      setPan({ x: 0, y: 0 });
      setRotation(0);
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  // Dimensiones efectivas considerando rotación (90° o 270° intercambian ancho y alto)
  const isSideways = rotation === 90 || rotation === 270;
  const rotW = isSideways ? naturalSize.height : naturalSize.width;
  const rotH = isSideways ? naturalSize.width : naturalSize.height;

  // Escala base para que la imagen cubra completamente el marco cuadrado sin dejar bordes vacíos
  const baseScale =
    rotW > 0 && rotH > 0 ? Math.max(viewportSize / rotW, viewportSize / rotH) : 1;

  // Dimensiones dibujadas en pantalla
  const drawW = rotW * baseScale * zoom;
  const drawH = rotH * baseScale * zoom;

  // Límites máximos de desplazamiento desde el centro para NO salirse de los bordes de la imagen
  const maxPanX = Math.max(0, (drawW - viewportSize) / 2);
  const maxPanY = Math.max(0, (drawH - viewportSize) / 2);

  // Desplazamiento clampeado estrictamente dentro de la imagen
  const clampedX = Math.min(Math.max(pan.x, -maxPanX), maxPanX);
  const clampedY = Math.min(Math.max(pan.y, -maxPanY), maxPanY);

  // Si cambia el zoom o la rotación, re-clampear inmediatamente el pan
  useEffect(() => {
    setPan((prev) => ({
      x: Math.min(Math.max(prev.x, -maxPanX), maxPanX),
      y: Math.min(Math.max(prev.y, -maxPanY), maxPanY)
    }));
  }, [maxPanX, maxPanY]);

  // Manejo de puntero (Ratón / Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: clampedX,
      panY: clampedY
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current) return;
    const deltaX = e.clientX - pointerStartRef.current.x;
    const deltaY = e.clientY - pointerStartRef.current.y;
    const rawX = pointerStartRef.current.panX + deltaX;
    const rawY = pointerStartRef.current.panY + deltaY;

    // Clamping estricto en tiempo real mientras se arrastra
    setPan({
      x: Math.min(Math.max(rawX, -maxPanX), maxPanX),
      y: Math.min(Math.max(rawY, -maxPanY), maxPanY)
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignorar
    }
    pointerStartRef.current = null;
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  // Generar la imagen recortada en alta definición (1024x1024)
  const handleConfirmCrop = useCallback(() => {
    if (!imageSrc) return;
    setIsApplying(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const outSize = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = outSize;
        canvas.height = outSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('No se pudo inicializar canvas 2D');
        }

        // Fondo blanco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, outSize, outSize);

        const ratio = outSize / viewportSize;

        // Traslación al centro del canvas
        ctx.translate(outSize / 2, outSize / 2);
        // Desplazamiento clampeado escalado al canvas
        ctx.translate(clampedX * ratio, clampedY * ratio);
        // Rotación
        ctx.rotate((rotation * Math.PI) / 180);

        // Escala total del dibujo
        const totalDrawScale = baseScale * zoom * ratio;
        const finalW = img.naturalWidth * totalDrawScale;
        const finalH = img.naturalHeight * totalDrawScale;

        ctx.drawImage(img, -finalW / 2, -finalH / 2, finalW, finalH);

        const croppedResult = canvas.toDataURL('image/jpeg', 0.9);
        onApply(croppedResult);
        onClose();
      } catch (err) {
        console.error('Error recortando imagen:', err);
      } finally {
        setIsApplying(false);
      }
    };
    img.onerror = () => {
      setIsApplying(false);
    };
    img.src = imageSrc;
  }, [imageSrc, viewportSize, clampedX, clampedY, rotation, baseScale, zoom, onApply, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        ref={containerRef}
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 sm:p-7 flex flex-col gap-4 relative animate-in zoom-in-95 duration-150 max-h-[95vh] overflow-y-auto"
      >
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado */}
        <div className="flex flex-col gap-1 pr-8">
          <div className="flex items-center gap-1.5 text-blue-600">
            <Maximize2 className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-wider">
              Encuadre y Zoom en Plataforma
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500">
            Mueve la foto para centrar la zona de interés (el visor se mantiene siempre dentro de los límites de la fotografía sin dejar bordes vacíos).
          </p>
        </div>

        {/* Viewport de Encuadre Interactivo */}
        <div className="flex flex-col items-center justify-center">
          <div
            style={{ width: viewportSize, height: viewportSize }}
            className="relative rounded-2xl overflow-hidden shadow-md border-2 border-blue-600 bg-slate-950 cursor-grab active:cursor-grabbing select-none touch-none ring-4 ring-blue-500/20"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Imagen transformada en tiempo real */}
            {imageSrc && naturalSize.width > 0 && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  transform: `translate(${clampedX}px, ${clampedY}px)`
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt="Previsualización de encuadre"
                  className="max-w-none origin-center pointer-events-none select-none"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    width: `${naturalSize.width * baseScale * zoom}px`,
                    height: `${naturalSize.height * baseScale * zoom}px`,
                    transformOrigin: 'center center'
                  }}
                  draggable={false}
                />
              </div>
            )}

            {/* Máscara y Guías visuales del marco de impresión (100x100 mm) */}
            <div className="absolute inset-0 pointer-events-none border border-white/40 rounded-2xl">
              {/* Esquinas visuales del marco de litofanía */}
              <div className="absolute top-2.5 left-2.5 w-5 h-5 border-t-2 border-l-2 border-blue-400"></div>
              <div className="absolute top-2.5 right-2.5 w-5 h-5 border-t-2 border-r-2 border-blue-400"></div>
              <div className="absolute bottom-2.5 left-2.5 w-5 h-5 border-b-2 border-l-2 border-blue-400"></div>
              <div className="absolute bottom-2.5 right-2.5 w-5 h-5 border-b-2 border-r-2 border-blue-400"></div>

              {/* Guías de regla en cruz */}
              <div className="absolute inset-0 flex items-center justify-center opacity-25">
                <div className="w-8 h-0.5 bg-white"></div>
                <div className="h-8 w-0.5 bg-white -ml-4"></div>
              </div>
            </div>

            {/* Indicador de límite activo */}
            <div className="absolute bottom-2 inset-x-2 flex items-center justify-between pointer-events-none">
              <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-[10px] text-white/90 font-bold flex items-center gap-1.5 shadow-sm">
                <Move className="w-3 h-3 text-blue-300" />
                <span>Arrastra para centrar</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-[10px] text-white font-black font-mono shadow-sm">
                Zoom {zoom.toFixed(1)}x
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Control de Zoom */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Nivel de Zoom:</span>
            </span>
            <span className="font-mono text-blue-700 font-black">{zoom.toFixed(1)}x</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(1.0, Number((prev - 0.2).toFixed(1))))}
              className="w-9 h-9 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition active:scale-95 shrink-0 cursor-pointer shadow-xs"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <input
              type="range"
              min="1.0"
              max="3.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3.5, Number((prev + 0.2).toFixed(1))))}
              className="w-9 h-9 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition active:scale-95 shrink-0 cursor-pointer shadow-xs"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Acciones de Rotación y Centrado */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleRotate}
            className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
          >
            <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Rotar 90° ({rotation}°)</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restablecer</span>
          </button>
        </div>

        {/* Botón Principal para Confirmar y Aplicar */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmCrop}
            disabled={isApplying}
            className="w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/20 transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            {isApplying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Aplicando al modelo 3D...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
