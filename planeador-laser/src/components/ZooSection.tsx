'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Upload,
  Sparkles,
  Download,
  Trash2,
  Puzzle,
  Wand2,
  Bot,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Eye,
  Image as ImageIcon,
  Layers,
  Send,
  KeyRound,
} from 'lucide-react';
import {
  AI_FUSION_INTERNAL_PROMPT,
  AssistantChatMessage,
  PUZZLE_PIECE_OPTIONS,
  PuzzlePieceCount,
  SketchFeatureAnalysis,
  UploadedSketchInput,
  ZooFusionResponse,
} from '@/types/zoo';

interface ZooSectionProps {
  onBackToMenu?: () => void;
}

/**
 * Analiza en el cliente (Canvas 2D) un archivo JPG/PNG de un dibujo a mano alzada:
 * normaliza su tamaño y extrae densidades morfológicas y trazos principales
 * para alimentar el motor multimodal y el vectorizador Potrace.
 */
async function analyzeAndNormalizeSketchFile(
  file: File
): Promise<UploadedSketchInput> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Formato de imagen no válido.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 180;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            mimeType: file.type || 'image/png',
            dataUrl: String(reader.result),
          });
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        let topInk = 0;
        let sideInk = 0;
        let centerInk = 0;
        let bottomInk = 0;

        const strokePts: { x: number; y: number }[] = [];

        for (let y = 0; y < size; y += 3) {
          for (let x = 0; x < size; x += 3) {
            const idx = (y * size + x) * 4;
            const lum =
              0.299 * imgData[idx] +
              0.587 * imgData[idx + 1] +
              0.114 * imgData[idx + 2];
            if (lum < 195) {
              if (y < size * 0.35) topInk++;
              else if (y > size * 0.68) bottomInk++;
              else if (x < size * 0.28 || x > size * 0.72) sideInk++;
              else centerInk++;

              if (strokePts.length < 24 && (x + y) % 9 === 0) {
                strokePts.push({
                  x: Number((x / size).toFixed(2)),
                  y: Number((y / size).toFixed(2)),
                });
              }
            }
          }
        }

        const totalSampled = Math.max(1, topInk + sideInk + centerInk + bottomInk);
        const analysis: SketchFeatureAnalysis = {
          topDensity: Number((topInk / totalSampled).toFixed(2)),
          sideDensity: Number((sideInk / totalSampled).toFixed(2)),
          centerDensity: Number((centerInk / totalSampled).toFixed(2)),
          bottomDensity: Number((bottomInk / totalSampled).toFixed(2)),
          innerStrokes: strokePts.length >= 4 ? [strokePts.slice(0, 8)] : [],
        };

        const normalizedDataUrl = canvas.toDataURL('image/png');
        resolve({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          mimeType: 'image/png',
          dataUrl: normalizedDataUrl,
          analysis,
        });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Genera 4 dibujos a mano alzada en formato PNG (en Canvas) para que los niños o docentes
 * puedan probar inmediatamente la fusión de 4 bocetos sin necesidad de tener archivos externos.
 */
function createSampleHandDrawnSketches(): UploadedSketchInput[] {
  if (typeof document === 'undefined') return [];

  const presets: {
    name: string;
    title: string;
    draw: (ctx: CanvasRenderingContext2D) => void;
    analysis: SketchFeatureAnalysis;
  }[] = [
    {
      name: 'dibujo1-cabeza-felino.png',
      title: 'Cabeza y Corona',
      analysis: {
        topDensity: 0.75,
        sideDensity: 0.35,
        centerDensity: 0.5,
        bottomDensity: 0.2,
        innerStrokes: [
          [
            { x: 0.35, y: 0.35 },
            { x: 0.5, y: 0.25 },
            { x: 0.65, y: 0.35 },
          ],
        ],
      },
      draw: (ctx) => {
        ctx.beginPath();
        ctx.moveTo(45, 120);
        ctx.lineTo(35, 65);
        ctx.lineTo(50, 28);
        ctx.lineTo(75, 52);
        ctx.lineTo(90, 24);
        ctx.lineTo(105, 52);
        ctx.lineTo(130, 28);
        ctx.lineTo(145, 65);
        ctx.lineTo(135, 120);
        ctx.closePath();
        ctx.stroke();
        // Ojos y hocico a mano alzada
        ctx.beginPath();
        ctx.arc(68, 78, 8, 0, Math.PI * 2);
        ctx.moveTo(120, 78);
        ctx.arc(112, 78, 8, 0, Math.PI * 2);
        ctx.moveTo(75, 102);
        ctx.quadraticCurveTo(90, 115, 105, 102);
        ctx.stroke();
      },
    },
    {
      name: 'dibujo2-alas-dragon.png',
      title: 'Alas Desplegadas',
      analysis: {
        topDensity: 0.3,
        sideDensity: 0.85,
        centerDensity: 0.4,
        bottomDensity: 0.25,
        innerStrokes: [
          [
            { x: 0.2, y: 0.4 },
            { x: 0.5, y: 0.5 },
            { x: 0.8, y: 0.4 },
          ],
        ],
      },
      draw: (ctx) => {
        ctx.beginPath();
        ctx.moveTo(85, 85);
        ctx.lineTo(22, 32);
        ctx.lineTo(16, 78);
        ctx.lineTo(34, 118);
        ctx.lineTo(85, 108);
        ctx.moveTo(95, 85);
        ctx.lineTo(158, 32);
        ctx.lineTo(164, 78);
        ctx.lineTo(146, 118);
        ctx.lineTo(95, 108);
        ctx.stroke();
      },
    },
    {
      name: 'dibujo3-escudo-caparazon.png',
      title: 'Torso y Escudo',
      analysis: {
        topDensity: 0.25,
        sideDensity: 0.4,
        centerDensity: 0.85,
        bottomDensity: 0.35,
        innerStrokes: [
          [
            { x: 0.4, y: 0.4 },
            { x: 0.6, y: 0.4 },
            { x: 0.5, y: 0.65 },
            { x: 0.4, y: 0.4 },
          ],
        ],
      },
      draw: (ctx) => {
        ctx.beginPath();
        ctx.moveTo(90, 28);
        ctx.lineTo(142, 65);
        ctx.lineTo(126, 142);
        ctx.lineTo(54, 142);
        ctx.lineTo(38, 65);
        ctx.closePath();
        ctx.moveTo(90, 48);
        ctx.lineTo(118, 82);
        ctx.lineTo(90, 122);
        ctx.lineTo(62, 82);
        ctx.closePath();
        ctx.stroke();
      },
    },
    {
      name: 'dibujo4-patas-y-cola.png',
      title: 'Garras y Cola',
      analysis: {
        topDensity: 0.15,
        sideDensity: 0.45,
        centerDensity: 0.35,
        bottomDensity: 0.88,
        innerStrokes: [
          [
            { x: 0.3, y: 0.75 },
            { x: 0.5, y: 0.88 },
            { x: 0.7, y: 0.75 },
          ],
        ],
      },
      draw: (ctx) => {
        ctx.beginPath();
        ctx.moveTo(55, 55);
        ctx.lineTo(42, 148);
        ctx.lineTo(75, 148);
        ctx.lineTo(82, 95);
        ctx.lineTo(98, 95);
        ctx.lineTo(105, 148);
        ctx.lineTo(138, 148);
        ctx.lineTo(125, 55);
        // Cola lateral
        ctx.moveTo(128, 92);
        ctx.quadraticCurveTo(168, 70, 162, 128);
        ctx.lineTo(132, 118);
        ctx.stroke();
      },
    },
  ];

  return presets.map((p, idx) => {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 180, 180);
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      p.draw(ctx);
    }
    return {
      id: `sample-${idx + 1}`,
      name: p.name,
      mimeType: 'image/png',
      dataUrl: canvas.toDataURL('image/png'),
      analysis: p.analysis,
    };
  });
}

export function ZooSection({ onBackToMenu }: ZooSectionProps) {
  const [images, setImages] = useState<UploadedSketchInput[]>([]);
  const [puzzlePieces, setPuzzlePieces] = useState<PuzzlePieceCount>(6);
  const [targetHeightMm, setTargetHeightMm] = useState<number>(92);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [activePreviewTab, setActivePreviewTab] = useState<'vector-puzzle' | 'ai-raster'>('vector-puzzle');

  // Estado del Asistente IA para niños y jóvenes
  const [studentPrompt, setStudentPrompt] = useState<string>('');
  const [chatInput, setChatInput] = useState<string>('');
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [showApiConfig, setShowApiConfig] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<AssistantChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: '¡Hola creador! 👋 Soy RoboMaker IA. Sube de 3 a 4 dibujos hechos a mano (en JPG o PNG) y presiona "Fusionar Dibujos". También puedes decirme aquí qué partes quieres combinar y luego elegir cuántas piezas tendrá tu rompecabezas láser.',
      timestamp: 'Ahora',
    },
  ]);

  // Estado de procesamiento y resultados
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isFusing, setIsFusing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fusionResult, setFusionResult] = useState<ZooFusionResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cargar los 4 bocetos de demostración al inicio para que la previsualización esté activa de inmediato
  useEffect(() => {
    const samples = createSampleHandDrawnSketches();
    if (samples.length === 4) {
      setImages(samples);
    }
  }, []);

  const executeFusion = useCallback(
    async (
      imgsToFuse: UploadedSketchInput[],
      piecesCount: PuzzlePieceCount,
      promptText: string,
      heightMm: number,
      annotations: boolean,
      announceInChat = false
    ) => {
      if (imgsToFuse.length < 3 || imgsToFuse.length > 4) {
        setErrorMsg(
          `Debes tener entre 3 y 4 imágenes cargadas (actualmente tienes ${imgsToFuse.length}).`
        );
        return;
      }

      setIsFusing(true);
      setErrorMsg(null);

      try {
        const res = await fetch('/api/zoologico', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: imgsToFuse,
            puzzlePieces: piecesCount,
            studentPrompt: promptText,
            targetHeightMm: heightMm,
            includeAnnotations: annotations,
            customApiKey,
          }),
        });

        const data: ZooFusionResponse & { error?: string } = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Error al fusionar y vectorizar los dibujos.');
        }

        setFusionResult(data);

        if (announceInChat) {
          setChatMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              text: data.assistantMessage,
              timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
          ]);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Hubo un error al ejecutar la fusión con IA Generativa.'
        );
      } finally {
        setIsFusing(false);
      }
    },
    [customApiKey]
  );

  // Ejecutar automáticamente cuando ya hay entre 3 y 4 imágenes y cambia el patrón de puzzle o altura
  useEffect(() => {
    if (images.length >= 3 && images.length <= 4) {
      const timer = setTimeout(() => {
        executeFusion(
          images,
          puzzlePieces,
          studentPrompt,
          targetHeightMm,
          showAnnotations,
          false
        );
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [images, puzzlePieces, targetHeightMm, showAnnotations, studentPrompt, executeFusion]);

  const handleFilesSelected = async (fileList: FileList | File[]) => {
    const incomingFiles = Array.from(fileList).filter(
      (f) =>
        f.type === 'image/jpeg' ||
        f.type === 'image/png' ||
        /\.(jpe?g|png)$/i.test(f.name)
    );

    if (incomingFiles.length === 0) {
      setErrorMsg('Por favor sube archivos de imagen en formato JPG o PNG.');
      return;
    }

    try {
      setErrorMsg(null);
      const analyzed = await Promise.all(
        incomingFiles.slice(0, 4).map((file) => analyzeAndNormalizeSketchFile(file))
      );

      setImages((prev) => {
        // Si los actuales son todos de ejemplo ('sample-*'), reemplazarlos por los del usuario
        const areAllSamples = prev.every((img) => img.id.startsWith('sample-'));
        const base = areAllSamples ? [] : prev;
        const merged = [...base, ...analyzed].slice(0, 4);
        return merged;
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudieron procesar algunas de las imágenes seleccionadas.');
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleLoadSampleDrawings = () => {
    const samples = createSampleHandDrawnSketches();
    setImages(samples);
    setErrorMsg(null);
    setChatMessages((prev) => [
      ...prev,
      {
        id: `sample-msg-${Date.now()}`,
        role: 'assistant',
        text: '¡He cargado 4 dibujos a mano alzada de prueba (Cabeza, Alas, Escudo y Patas/Cola)! Presiona "Fusionar Dibujos" para crear un nuevo híbrido.',
        timestamp: 'Ahora',
      },
    ]);
  };

  const handleSendStudentInstruction = (customText?: string) => {
    const text = (customText ?? chatInput).trim();
    if (!text) return;

    setChatMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
    setStudentPrompt(text);
    setChatInput('');

    if (images.length >= 3 && images.length <= 4) {
      executeFusion(images, puzzlePieces, text, targetHeightMm, showAnnotations, true);
    } else {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `warn-${Date.now()}`,
          role: 'assistant',
          text: `¡Guardé tu idea "${text}"! Ahora asegúrate de subir entre 3 y 4 dibujos en JPG/PNG para poder fusionarlos.`,
          timestamp: 'Ahora',
        },
      ]);
    }
  };

  const handleDownloadLaserSvg = () => {
    if (!fusionResult?.laserSvg) return;
    const blob = new Blob([fusionResult.laserSvg], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rompecabezas-hibrido-ia-${puzzlePieces}piezas-corte-laser.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const hasValidImageCount = images.length >= 3 && images.length <= 4;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Barra Superior de Navegación */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs">
        <div className="flex items-center gap-3">
          {onBackToMenu ? (
            <button
              type="button"
              onClick={onBackToMenu}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Menú Principal
            </button>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 font-bold text-xs sm:text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Menú Principal
            </Link>
          )}
          <span className="hidden sm:inline-block h-5 w-px bg-slate-200" />
          <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            🧩 Taller 1 · Fusión IA + Vectorización Potrace + Rompecabezas Láser
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowApiConfig((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            title="Configurar API Key Multimodal opcional (Google Gemini)"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>Motor IA Multimodal</span>
          </button>
        </div>
      </div>

      {/* Configuración opcional de API Key de Gemini para el Docente */}
      {showApiConfig && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="font-extrabold text-amber-950">
              Conexión API de Visión y Generación Multimodal (Opcional)
            </div>
            <p className="text-amber-800">
              El taller incluye un motor multimodal autónomo listo para usar sin claves. Si cuentas con una clave de{' '}
              <strong>Google Gemini API</strong>, puedes ingresarla aquí o en <code className="font-mono">GEMINI_API_KEY</code>.
            </p>
          </div>
          <input
            type="password"
            value={customApiKey}
            onChange={(e) => setCustomApiKey(e.target.value)}
            placeholder="AIzaSy... (Gemini API Key opcional)"
            className="w-full sm:w-72 px-3 py-2 rounded-xl bg-white border border-amber-300 text-slate-800 font-mono text-xs"
          />
        </div>
      )}

      {/* Banner Hero del Taller 1 */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-100 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Taller 1 · Creación Colectiva con IA Generativa y Corte Láser
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Fusión de Dibujos a Mano Alzada + Rompecabezas Láser 🧩
            </h1>
            <p className="text-amber-50 text-sm sm:text-base leading-relaxed">
              Sube de <strong>3 a 4 dibujos a mano alzada (JPG/PNG)</strong> hechos por tu equipo. Nuestra{' '}
              <strong>IA Generativa</strong> creará un diseño híbrido en trazo simple blanco y negro, lo vectorizará automáticamente con{' '}
              <strong>Potrace</strong> y recortará un patrón de <strong>rompecabezas clásico</strong> sobre su silueta exterior.
            </p>
          </div>

          {fusionResult && (
            <div className="grid grid-cols-2 gap-2.5 bg-slate-950/30 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 shrink-0">
              <div className="px-3 py-2 rounded-xl bg-white/10">
                <div className="text-[10px] uppercase tracking-wider text-amber-200 font-bold">
                  Dibujos Fusionados
                </div>
                <div className="text-lg font-black text-white">
                  {fusionResult.metrics.imagesCount} Bocetos
                </div>
                <div className="text-[10px] text-amber-100">
                  {fusionResult.metrics.innerVectorPathsCount} trazos Potrace
                </div>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white/10">
                <div className="text-[10px] uppercase tracking-wider text-amber-200 font-bold">
                  Rompecabezas Recortado
                </div>
                <div className="text-lg font-black text-white">
                  {fusionResult.metrics.puzzlePieces} Piezas ({fusionResult.metrics.gridCols}×{fusionResult.metrics.gridRows})
                </div>
                <div className="text-[10px] text-emerald-200 font-semibold">
                  ✓ Clipping booleano exacto
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grilla Principal: Columna Izquierda (Inputs + Asistente IA) y Columna Derecha (Previsualización + Descarga) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Tarjeta 1: Zona de Carga Múltiple (3 a 4 dibujos JPG/PNG) + Botón "Fusionar Dibujos" */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-600" />
                1. Sube de 3 a 4 Dibujos a Mano Alzada (JPG/PNG)
              </label>
              <span
                className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                  hasValidImageCount
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {images.length} / 4 imágenes
              </span>
            </div>

            {/* Zona Drag & Drop Múltiple */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/70 scale-[1.01]'
                  : 'border-slate-300 bg-slate-50/70 hover:border-amber-400 hover:bg-amber-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFilesSelected(e.target.files);
                  }
                }}
              />
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2">
                <ImageIcon className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                Arrastra aquí <span className="text-amber-600 underline">3 o 4 imágenes JPG/PNG</span> o haz clic para seleccionarlas
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Fotografías o escaneos de dibujos hechos a mano por los integrantes del equipo
              </p>
            </div>

            {/* Cuadrícula de las 3 a 4 imágenes cargadas */}
            <div className="grid grid-cols-4 gap-2.5">
              {[0, 1, 2, 3].map((slotIdx) => {
                const img = images[slotIdx];
                return (
                  <div
                    key={img ? img.id : `empty-slot-${slotIdx}`}
                    className={`relative aspect-square rounded-2xl border overflow-hidden flex flex-col items-center justify-center ${
                      img
                        ? 'border-amber-300 bg-white shadow-2xs'
                        : 'border-dashed border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {img ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.dataUrl}
                          alt={img.name}
                          className="w-full h-full object-contain p-1"
                        />
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-900/75 text-white text-[9px] font-bold">
                          #{slotIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(img.id);
                          }}
                          className="absolute top-1 right-1 p-1 rounded-lg bg-red-600/90 hover:bg-red-700 text-white cursor-pointer"
                          title="Quitar imagen"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-1">
                        <div className="text-xs font-extrabold">#{slotIdx + 1}</div>
                        <div className="text-[9px]">
                          {slotIdx < 3 ? 'Requerido' : 'Opcional'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleLoadSampleDrawings}
                className="text-xs font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
              >
                🎨 Cargar 4 dibujos a mano alzada de ejemplo
              </button>
              {images.length > 0 && (
                <button
                  type="button"
                  onClick={() => setImages([])}
                  className="text-xs font-semibold text-slate-400 hover:text-red-600 cursor-pointer"
                >
                  Limpiar todos
                </button>
              )}
            </div>

            {/* Botón Principal de Ejecución: "Fusionar Dibujos" */}
            <button
              type="button"
              disabled={!hasValidImageCount || isFusing}
              onClick={() =>
                executeFusion(
                  images,
                  puzzlePieces,
                  studentPrompt,
                  targetHeightMm,
                  showAnnotations,
                  true
                )
              }
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:via-orange-700 hover:to-rose-700 text-white font-black text-sm sm:text-base shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <Wand2 className={`w-5 h-5 ${isFusing ? 'animate-spin' : ''}`} />
              <span>{isFusing ? 'Fusionando y Vectorizando...' : 'Fusionar Dibujos'}</span>
            </button>
          </div>

          {/* Tarjeta 2: Selector de Patrón de Rompecabezas (4 Cantidades Distintas de Piezas) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Puzzle className="w-4 h-4 text-amber-600" />
                2. Cantidad de Piezas del Rompecabezas
              </label>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                Recorte Booleano Activo
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {PUZZLE_PIECE_OPTIONS.map((opt) => {
                const isSelected = puzzlePieces === opt.count;
                return (
                  <button
                    key={opt.count}
                    type="button"
                    onClick={() => setPuzzlePieces(opt.count)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-500/20 shadow-2xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black">{opt.label}</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-amber-700">
                        {opt.difficulty}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Control de Tamaño Final para Plancha Láser */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Altura del Rompecabezas en Plancha Láser:</span>
                <span className="text-amber-800 font-black">{targetHeightMm} mm</span>
              </div>
              <input
                type="range"
                min={60}
                max={140}
                step={2}
                value={targetHeightMm}
                onChange={(e) => setTargetHeightMm(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>60 mm (Compacto)</span>
                <span className="text-emerald-700 font-semibold">
                  92 mm (Ideal Balsa 300×100 mm)
                </span>
                <span>140 mm</span>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Asistente IA Creativo para Niños y Jóvenes */}
          <div className="bg-white rounded-3xl border border-purple-200 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Asistente IA para Niños y Jóvenes
                  </h3>
                  <p className="text-[11px] text-purple-700 font-semibold">
                    ¡Cuéntale cómo quieres que fusione tus dibujos!
                  </p>
                </div>
              </div>
            </div>

            {/* Historial del Asistente */}
            <div className="max-h-44 overflow-y-auto space-y-2 pr-1 bg-slate-50 rounded-2xl p-3 border border-slate-200/80">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                    msg.role === 'assistant'
                      ? 'bg-white border border-purple-100 text-slate-800 shadow-2xs'
                      : 'bg-purple-600 text-white ml-6 font-medium'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-75 mb-0.5 font-bold">
                    <span>{msg.role === 'assistant' ? '🤖 RoboMaker IA' : '🎨 Tu Equipo'}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Chips rápidos de ideas para niños */}
            <div className="flex flex-wrap gap-1.5">
              {[
                '¡Que tenga alas gigantes y corona!',
                '¡Con estilo robot guardián!',
                '¡Que sea una criatura marina alada!',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSendStudentInstruction(suggestion)}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition-colors cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Input de chat */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendStudentInstruction();
                }}
                placeholder="Ej: Usa las orejas del dibujo 1 y las alas del 2..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => handleSendStudentInstruction()}
                className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer"
                title="Enviar instrucción al Asistente IA"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (7 cols): Previsualización del Diseño Híbrido + Rompecabezas + Descarga Láser */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {fusionResult?.hybridTitle || 'Previsualización del Diseño Híbrido y Rompecabezas'}
                </h2>
                <p className="text-xs text-slate-500">
                  Líneas <strong className="text-red-600">rojas (#FF0000)</strong>: corte láser exterior y rompecabezas recortado al contorno ·{' '}
                  <strong className="text-blue-600">Azul/Negro (#0000FF)</strong>: dibujo híbrido vectorizado
                </p>
              </div>

              {/* Selector de vista: Vectorizado + Puzzle vs Raster B/N de la IA */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('vector-puzzle')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    activePreviewTab === 'vector-puzzle'
                      ? 'bg-white text-amber-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🧩 Vector SVG + Puzzle
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('ai-raster')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    activePreviewTab === 'ai-raster'
                      ? 'bg-white text-amber-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🖼️ Trazo IA (B/N Raster)
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Lienzo de Previsualización */}
            <div className="relative w-full min-h-[380px] sm:min-h-[430px] rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center p-4 overflow-hidden shadow-inner">
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />

              {isFusing && (
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black animate-pulse z-10">
                  ⚡ Ejecutando IA + Potrace + Clipping Booleano...
                </div>
              )}

              {fusionResult ? (
                activePreviewTab === 'vector-puzzle' ? (
                  <div
                    className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[430px] [&>svg]:bg-amber-50/95 [&>svg]:rounded-xl [&>svg]:p-3 [&>svg]:shadow-lg"
                    dangerouslySetInnerHTML={{ __html: fusionResult.previewSvg }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fusionResult.rasterDataUrl}
                      alt="Dibujo lineal en blanco y negro generado por la IA antes de vectorizar"
                      className="max-h-[360px] w-auto rounded-xl border-2 border-slate-700 bg-white p-2 shadow-lg"
                    />
                    <span className="text-xs text-slate-300 font-medium">
                      Imagen rasterizada en blanco y negro generada por la IA antes de pasar por Potrace
                    </span>
                  </div>
                )
              ) : (
                <div className="text-slate-400 text-sm text-center max-w-sm">
                  Sube de 3 a 4 dibujos en formato JPG/PNG y presiona{' '}
                  <strong className="text-white">&ldquo;Fusionar Dibujos&rdquo;</strong> para generar tu rompecabezas láser.
                </div>
              )}
            </div>

            {/* Controles inferiores del visor y Botón Descargar SVG para Corte Láser */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAnnotations}
                  onChange={(e) => setShowAnnotations(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-600"
                />
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Mostrar marco de referencia y leyenda en vista previa</span>
              </label>

              <button
                type="button"
                disabled={!fusionResult || isFusing}
                onClick={handleDownloadLaserSvg}
                className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Descargar SVG para Corte Láser</span>
              </button>
            </div>

            {/* Resumen Técnico del Pipeline: IA Generativa -> Potrace -> Clipping Booleano */}
            {fusionResult && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase">
                    1. IA Generativa Multimodal
                  </div>
                  <div className="text-xs font-extrabold text-slate-800 mt-1">
                    Trazo B/N Continuo Sin Sombreado
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate" title={fusionResult.metrics.aiModelUsed}>
                    {fusionResult.metrics.aiModelUsed}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <div className="text-[10px] font-extrabold text-amber-800 uppercase">
                    2. Vectorización Potrace
                  </div>
                  <div className="text-xs font-extrabold text-amber-950 mt-1">
                    {fusionResult.metrics.outerContourNodes} nodos de contorno + {fusionResult.metrics.innerVectorPathsCount} trazos
                  </div>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    Curvas Bézier cerradas y limpias
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div className="text-[10px] font-extrabold text-emerald-700 uppercase">
                    3. Intersección Booleana (Puzzle)
                  </div>
                  <div className="text-xs font-extrabold text-emerald-900 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {fusionResult.metrics.clippedPuzzleSegmentsCount} cortes recortados al borde
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    Dimensiones: {fusionResult.metrics.widthMm} × {fusionResult.metrics.heightMm} mm
                  </div>
                </div>
              </div>
            )}

            {/* Caja con el Prompt Interno Multimodal documentado */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                Prompt Interno de la API de Imagen Multimodal:
              </div>
              <p className="italic text-[11px] text-slate-600 bg-white px-3 py-2 rounded-xl border border-slate-200/80">
                &ldquo;{AI_FUSION_INTERNAL_PROMPT}&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
