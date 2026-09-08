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
  RefreshCw
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
  confirmLabel = 'Aplicar Encuadre'
}) => {
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [isApplying, setIsApplying] = useState(false);

  // Dimensiones del visor cuadrado en pantalla (px)
  const [viewportSize, setViewportSize] = useState(280);

  const containerRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const pinchDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1.0);

  // Actualizar tamaño de viewport según el contenedor de la pantalla
  useEffect(() => {
    if (!isOpen) return;

    const updateSize = () => {
      if (containerRef.current) {
        const availableW = containerRef.current.clientWidth - 32;
        const availableH = window.innerHeight * 0.42;
        const size = Math.min(Math.max(260, Math.min(availableW, availableH)), 380);
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

  // Manejo de puntero (Ratón / 1 Dedo)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current) return;
    const deltaX = e.clientX - pointerStartRef.current.x;
    const deltaY = e.clientY - pointerStartRef.current.y;
    setPan({
      x: pointerStartRef.current.panX + deltaX,
      y: pointerStartRef.current.panY + deltaY
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignorar si ya fue liberado
    }
    pointerStartRef.current = null;
  };

  // Soporte para gestos táctiles multi-touch (Pinch to Zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchDistRef.current = dist;
      pinchStartZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / pinchDistRef.current;
      const newZoom = Math.min(Math.max(1.0, pinchStartZoomRef.current * factor), 3.5);
      setZoom(Number(newZoom.toFixed(2)));
    }
  };

  const handleTouchEnd = () => {
    pinchDistRef.current = null;
  };

  // Calcular la escala base para que la imagen cubra completamente el marco cuadrado
  const isSideways = rotation === 90 || rotation === 270;
  const effectiveW = isSideways ? naturalSize.height : naturalSize.width;
  const effectiveH = isSideways ? naturalSize.width : naturalSize.height;

  const baseScale =
    effectiveW && effectiveH ? Math.max(viewportSize / effectiveW, viewportSize / effectiveH) : 1;

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
        // Desplazamiento según el arrastre del usuario
        ctx.translate(pan.x * ratio, pan.y * ratio);
        // Rotación
        ctx.rotate((rotation * Math.PI) / 180);

        // Escala total
        const totalDrawScale = baseScale * zoom * ratio;
        const drawW = img.naturalWidth * totalDrawScale;
        const drawH = img.naturalHeight * totalDrawScale;

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

        const croppedResult = canvas.toDataURL('image/jpeg', 0.88);
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
  }, [imageSrc, viewportSize, pan, rotation, baseScale, zoom, onApply, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        ref={containerRef}
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 flex flex-col gap-4 relative animate-in zoom-in-95 duration-150 max-h-[95vh] overflow-y-auto"
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
              Encuadre de Litofanía 3D
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500">
            Arrastra la imagen para centrar lo que quieres imprimir y usa el zoom para acercar la zona de interés.
          </p>
        </div>

        {/* Viewport de Encuadre Interactivo */}
        <div className="flex flex-col items-center justify-center">
          <div
            style={{ width: viewportSize, height: viewportSize }}
            className="relative rounded-2xl overflow-hidden shadow-inner border-2 border-blue-500 bg-slate-950 cursor-grab active:cursor-grabbing select-none touch-none ring-4 ring-blue-500/20"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Imagen transformada en tiempo real */}
            {imageSrc && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px)`
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt="Previsualización de encuadre"
                  className="max-w-none origin-center pointer-events-none transition-transform duration-75"
                  style={{
                    transform: `rotate(${rotation}deg) scale(${baseScale * zoom})`,
                    transformOrigin: 'center center'
                  }}
                  draggable={false}
                />
              </div>
            )}

            {/* Máscara y Guías visuales del marco de impresión (100x100 mm) */}
            <div className="absolute inset-0 pointer-events-none border border-white/40 rounded-2xl">
              {/* Esquinas visuales */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400"></div>

              {/* Marca central sutil */}
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <div className="w-6 h-0.5 bg-white/60"></div>
                <div className="h-6 w-0.5 bg-white/60 -ml-3"></div>
              </div>
            </div>

            {/* Pill flotante informativo */}
            <div className="absolute bottom-2 inset-x-2 flex items-center justify-between pointer-events-none">
              <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] text-white/90 font-medium flex items-center gap-1">
                <Move className="w-3 h-3" /> Arrastra para encuadrar
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-600/90 text-[10px] text-white font-bold font-mono">
                {zoom.toFixed(1)}x
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Control de Zoom */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col gap-2">
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
              className="w-8 h-8 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition active:scale-95 shrink-0 cursor-pointer"
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
              className="w-8 h-8 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition active:scale-95 shrink-0 cursor-pointer"
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
            className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Rotar 90° ({rotation}°)</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restablecer</span>
          </button>
        </div>

        {/* Botón Principal para Confirmar y Aplicar */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
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
            className="w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            {isApplying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Aplicando encuadre...</span>
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
