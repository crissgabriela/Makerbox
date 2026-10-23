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
  FileImage,
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
import { vectorizeRgbaImageWithPotrace } from '@/lib/potrace-vectorizer';
import { buildPuzzleSvgFromTracedResult } from '@/lib/puzzle-clipper';

interface ZooSectionProps {
  onBackToMenu?: () => void;
}

/**
 * Vectoriza en alta resolución cualquier imagen rasterizada (devuelta por Gemini Image Generation
 * o subida directamente) aplicando umbralizado adaptativo, flood-fill exterior, Potrace y clipping booleano del puzzle.
 */
async function traceRasterUrlToPuzzleSvgClient(
  rasterUrl: string,
  puzzlePieces: PuzzlePieceCount,
  targetHeightMm: number,
  hybridTitle: string,
  includeAnnotations: boolean
): Promise<{
  previewSvg: string;
  laserSvg: string;
  cleanedRasterDataUrl: string;
  outerNodes: number;
  innerPathsCount: number;
  clippedSegmentsCount: number;
  widthMm: number;
  heightMm: number;
} | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => resolve(null);
    img.onload = () => {
      const maxDim = 380;
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      const w = Math.max(120, Math.round(img.width * scale));
      const h = Math.max(120, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const traced = vectorizeRgbaImageWithPotrace(
        imgData.data,
        w,
        h,
        targetHeightMm,
        {
          turdSize: 4,
          alphaMax: 0.88,
          optTolerance: 0.55,
        }
      );

      if (traced.outerPolygon.length < 6) {
        resolve(null);
        return;
      }

      const built = buildPuzzleSvgFromTracedResult(
        traced,
        puzzlePieces,
        hybridTitle,
        includeAnnotations
      );

      resolve({
        previewSvg: built.previewSvg,
        laserSvg: built.laserSvg,
        cleanedRasterDataUrl: canvas.toDataURL('image/png'),
        outerNodes: traced.outerPolygon.length,
        innerPathsCount: traced.innerPathsD.length,
        clippedSegmentsCount: built.puzzleResult.clippedPuzzlePathsD.length,
        widthMm: traced.widthMm,
        heightMm: traced.heightMm,
      });
    };
    img.src = rasterUrl;
  });
}

/**
 * Analiza en el cliente (Canvas 2D) un archivo JPG/PNG de un dibujo a mano alzada
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
        const size = 240;
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
            }
          }
        }

        const totalSampled = Math.max(1, topInk + sideInk + centerInk + bottomInk);
        const analysis: SketchFeatureAnalysis = {
          topDensity: Number((topInk / totalSampled).toFixed(2)),
          sideDensity: Number((sideInk / totalSampled).toFixed(2)),
          centerDensity: Number((centerInk / totalSampled).toFixed(2)),
          bottomDensity: Number((bottomInk / totalSampled).toFixed(2)),
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
 * Genera los 3 dibujos a mano alzada en formato PNG que dan origen a la fusión de ejemplo de Gemini:
 * 1. Gato sentado con bigotes
 * 2. Alas puntiagudas de murciélago/dragón
 * 3. Medusa con tentáculos ondulados
 */
function createSampleHandDrawnSketches(): UploadedSketchInput[] {
  if (typeof document === 'undefined') return [];

  const presets: {
    name: string;
    draw: (ctx: CanvasRenderingContext2D) => void;
    analysis: SketchFeatureAnalysis;
  }[] = [
    {
      name: 'boceto1-gato-sentado.png',
      analysis: {
        topDensity: 0.75,
        sideDensity: 0.35,
        centerDensity: 0.6,
        bottomDensity: 0.2,
      },
      draw: (ctx) => {
        // Cabeza y orejas de gato
        ctx.beginPath();
        ctx.moveTo(60, 72);
        ctx.lineTo(56, 36);
        ctx.lineTo(78, 52);
        ctx.quadraticCurveTo(90, 48, 102, 52);
        ctx.lineTo(124, 36);
        ctx.lineTo(120, 72);
        ctx.quadraticCurveTo(132, 95, 110, 105);
        ctx.quadraticCurveTo(90, 110, 70, 105);
        ctx.quadraticCurveTo(48, 95, 60, 72);
        ctx.stroke();
        // Ojos, nariz y bigotes
        ctx.beginPath();
        ctx.arc(76, 76, 5, 0, Math.PI * 2);
        ctx.moveTo(109, 76);
        ctx.arc(104, 76, 5, 0, Math.PI * 2);
        ctx.moveTo(85, 88);
        ctx.lineTo(95, 88);
        ctx.lineTo(90, 94);
        ctx.closePath();
        ctx.moveTo(42, 82);
        ctx.lineTo(68, 86);
        ctx.moveTo(40, 92);
        ctx.lineTo(68, 92);
        ctx.moveTo(112, 86);
        ctx.lineTo(138, 82);
        ctx.moveTo(112, 92);
        ctx.lineTo(140, 92);
        // Cuerpo regordete
        ctx.moveTo(68, 105);
        ctx.quadraticCurveTo(46, 138, 66, 162);
        ctx.quadraticCurveTo(90, 170, 114, 162);
        ctx.quadraticCurveTo(134, 138, 112, 105);
        ctx.stroke();
      },
    },
    {
      name: 'boceto2-alas-dragon.png',
      analysis: {
        topDensity: 0.4,
        sideDensity: 0.88,
        centerDensity: 0.35,
        bottomDensity: 0.2,
      },
      draw: (ctx) => {
        ctx.beginPath();
        ctx.moveTo(35, 115);
        ctx.lineTo(115, 25);
        ctx.lineTo(108, 52);
        ctx.lineTo(122, 52);
        ctx.lineTo(114, 72);
        ctx.lineTo(165, 42);
        ctx.lineTo(142, 82);
        ctx.lineTo(155, 96);
        ctx.lineTo(130, 108);
        ctx.lineTo(142, 128);
        ctx.lineTo(118, 130);
        ctx.lineTo(122, 152);
        ctx.lineTo(98, 140);
        ctx.lineTo(90, 156);
        ctx.lineTo(52, 138);
        ctx.closePath();
        ctx.stroke();
      },
    },
    {
      name: 'boceto3-medusa-tentaculos.png',
      analysis: {
        topDensity: 0.2,
        sideDensity: 0.35,
        centerDensity: 0.4,
        bottomDensity: 0.92,
      },
      draw: (ctx) => {
        // Cúpula superior y tentáculos ondulados
        ctx.beginPath();
        ctx.arc(90, 58, 38, Math.PI, 0, false);
        ctx.closePath();
        ctx.stroke();
        const xs = [60, 72, 84, 96, 108, 120];
        for (const x of xs) {
          ctx.beginPath();
          ctx.moveTo(x, 60);
          ctx.bezierCurveTo(x - 14, 92, x + 14, 124, x - 6, 164);
          ctx.stroke();
        }
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
      ctx.lineWidth = 3.5;
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
  const [puzzlePieces, setPuzzlePieces] = useState<PuzzlePieceCount>(25);
  const [targetHeightMm, setTargetHeightMm] = useState<number>(120);
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
      text: '¡Hola creador! 👋 Soy el Agente Gemini de Fusión Creativa. Sube de 3 a 4 dibujos a mano alzada (JPG/PNG) y presiona "Fusionar Dibujos". También he precargado el ejemplo del Gato + Alas + Medusa (con 20 a 40 piezas de rompecabezas) para que veas el resultado al instante.',
      timestamp: 'Ahora',
    },
  ]);

  // Estado de procesamiento y resultados
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isFusing, setIsFusing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fusionResult, setFusionResult] = useState<ZooFusionResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const directFusedInputRef = useRef<HTMLInputElement | null>(null);

  // Cargar los 3 bocetos de demostración (Gato + Alas + Medusa) al inicio
  useEffect(() => {
    const samples = createSampleHandDrawnSketches();
    if (samples.length >= 3) {
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
          `Debes tener entre 3 y 4 imágenes cargadas para fusionar (actualmente tienes ${imgsToFuse.length}).`
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

        // Si tenemos una imagen raster nativa de Gemini (o la imagen de demostración de Gemini),
        // la vectorizamos en alta resolución con umbral adaptativo + flood-fill exterior + Potrace
        if (data.hasNativeGeminiRaster && data.rasterDataUrl) {
          const hiRes = await traceRasterUrlToPuzzleSvgClient(
            data.rasterDataUrl,
            piecesCount,
            heightMm,
            data.hybridTitle,
            annotations
          );
          if (hiRes) {
            data.previewSvg = hiRes.previewSvg;
            data.laserSvg = hiRes.laserSvg;
            data.metrics.outerContourNodes = hiRes.outerNodes;
            data.metrics.innerVectorPathsCount = hiRes.innerPathsCount;
            data.metrics.clippedPuzzleSegmentsCount = hiRes.clippedSegmentsCount;
            data.metrics.widthMm = hiRes.widthMm;
            data.metrics.heightMm = hiRes.heightMm;
          }
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
        const areAllSamples = prev.every((img) => img.id.startsWith('sample-'));
        const base = areAllSamples ? [] : prev;
        return [...base, ...analyzed].slice(0, 4);
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudieron procesar algunas de las imágenes seleccionadas.');
    }
  };

  /**
   * Permite subir directamente una imagen ya fusionada por Gemini (por ejemplo desde un celular o tablet)
   * para vectorizarla inmediatamente con Potrace y aplicarle el rompecabezas de 20 a 40 piezas.
   */
  const handleDirectFusedImageUpload = async (file: File) => {
    setIsFusing(true);
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      const option =
        PUZZLE_PIECE_OPTIONS.find((o) => o.count === puzzlePieces) ||
        PUZZLE_PIECE_OPTIONS[1];
      const title = `Fusión Gemini (${file.name.replace(/\.[^.]+$/, '')})`;
      const hiRes = await traceRasterUrlToPuzzleSvgClient(
        dataUrl,
        puzzlePieces,
        targetHeightMm,
        title,
        showAnnotations
      );

      if (hiRes) {
        setFusionResult({
          previewSvg: hiRes.previewSvg,
          laserSvg: hiRes.laserSvg,
          rasterDataUrl: dataUrl,
          hasNativeGeminiRaster: true,
          assistantMessage: `¡Excelente dibujo fusionado! Vectoricé tu imagen "${file.name}" eliminando el fondo con umbral adaptativo, tracé sus líneas con Potrace y recorté el rompecabezas de ${puzzlePieces} piezas (${option.cols}×${option.rows}) exactamente a su silueta exterior.`,
          hybridTitle: title,
          internalPromptUsed: AI_FUSION_INTERNAL_PROMPT,
          metrics: {
            imagesCount: images.length,
            puzzlePieces,
            gridCols: option.cols,
            gridRows: option.rows,
            widthMm: hiRes.widthMm,
            heightMm: hiRes.heightMm,
            outerContourNodes: hiRes.outerNodes,
            innerVectorPathsCount: hiRes.innerPathsCount,
            clippedPuzzleSegmentsCount: hiRes.clippedSegmentsCount,
            vectorizerEngine: 'Potrace High-Res Adaptive Threshold + Moore-Neighbor',
            aiModelUsed: 'Gemini Image Direct Vectorizer',
          },
        });
      } else {
        setErrorMsg('No se pudo extraer el contorno de la imagen subida.');
      }
      setIsFusing(false);
    };
    reader.readAsDataURL(file);
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
        text: '¡He cargado los 3 bocetos de demostración (Gato sentado + Alas de dragón + Medusa con tentáculos) junto con su fusión de Gemini Image! Prueba cambiar entre 20, 25, 30 y 40 piezas.',
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
    a.download = `rompecabezas-gemini-${puzzlePieces}piezas-corte-laser.svg`;
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
            🧩 Taller 1 · Agente Gemini Image Fusion + Potrace + Rompecabezas (20–40 Piezas)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowApiConfig((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-extrabold transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-700" />
            <span>Configurar API Key Gemini Image</span>
          </button>
        </div>
      </div>

      {/* Configuración de API Key de Google Gemini (habilita gemini-2.5-flash-image en vivo) */}
      {showApiConfig && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1 max-w-2xl">
            <div className="font-extrabold text-amber-950">
              Agente Nativo Google Gemini Image Generation (`gemini-2.5-flash-image` / `gemini-2.0-flash-preview-image-generation`)
            </div>
            <p className="text-amber-900 leading-relaxed">
              Ingresa tu <strong>Google Gemini API Key</strong> (o configúrala como variable <code className="font-mono bg-white px-1 rounded">GEMINI_API_KEY</code> en Vercel) para que el botón <strong>&ldquo;Fusionar Dibujos&rdquo;</strong> invoque en vivo el mismo generador de imágenes de Gemini que usaste en tu prueba.
            </p>
          </div>
          <input
            type="password"
            value={customApiKey}
            onChange={(e) => setCustomApiKey(e.target.value)}
            placeholder="AIzaSy... (Google Gemini API Key)"
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
              Taller 1 · Fusión Multimodal Estilo Gemini + Rompecabezas de 20 a 40 Piezas
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Fusión de Dibujos a Mano Alzada + Rompecabezas Láser 🧩
            </h1>
            <p className="text-amber-50 text-sm sm:text-base leading-relaxed">
              Sube de <strong>3 a 4 dibujos a mano alzada (JPG/PNG)</strong>. El motor{' '}
              <strong>Gemini Image Generation</strong> crea el dibujo lineal híbrido en blanco y negro, el algoritmo{' '}
              <strong>Potrace</strong> vectoriza sus trazos y aplica una intersección booleana con un patrón de{' '}
              <strong>20, 25, 30 o 40 piezas</strong>.
            </p>
          </div>

          {fusionResult && (
            <div className="grid grid-cols-2 gap-2.5 bg-slate-950/30 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 shrink-0">
              <div className="px-3 py-2 rounded-xl bg-white/10">
                <div className="text-[10px] uppercase tracking-wider text-amber-200 font-bold">
                  Vectorizado Potrace
                </div>
                <div className="text-lg font-black text-white">
                  {fusionResult.metrics.innerVectorPathsCount} Trazos
                </div>
                <div className="text-[10px] text-amber-100">
                  Silueta: {fusionResult.metrics.outerContourNodes} nodos
                </div>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white/10">
                <div className="text-[10px] uppercase tracking-wider text-amber-200 font-bold">
                  Rompecabezas Láser
                </div>
                <div className="text-lg font-black text-white">
                  {fusionResult.metrics.puzzlePieces} Piezas ({fusionResult.metrics.gridCols}×{fusionResult.metrics.gridRows})
                </div>
                <div className="text-[10px] text-emerald-200 font-semibold">
                  ✓ Recortado al contorno
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grilla Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Tarjeta 1: Zona de Carga Múltiple (3 a 4 dibujos JPG/PNG) + Botón "Fusionar Dibujos" */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
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
                Arrastra aquí <span className="text-amber-600 underline">3 o 4 dibujos JPG/PNG</span> o haz clic para buscarlos
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ej: 1) Gato · 2) Alas · 3) Medusa (se fusionarán en un solo personaje lineal)
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

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={handleLoadSampleDrawings}
                className="font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
              >
                🐱🦇🪼 Cargar ejemplo Gemini (Gato + Alas + Medusa)
              </button>
              {images.length > 0 && (
                <button
                  type="button"
                  onClick={() => setImages([])}
                  className="font-semibold text-slate-400 hover:text-red-600 cursor-pointer"
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

            {/* Opción adicional: subir directamente una imagen ya fusionada */}
            <div className="pt-2 border-t border-slate-100">
              <input
                ref={directFusedInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDirectFusedImageUpload(file);
                }}
              />
              <button
                type="button"
                onClick={() => directFusedInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <FileImage className="w-4 h-4 text-amber-600" />
                <span>¿Ya tienes una imagen fusionada por Gemini? Súbela directo aquí</span>
              </button>
            </div>
          </div>

          {/* Tarjeta 2: Selector de Patrón de Rompecabezas (20, 25, 30 o 40 Piezas) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Puzzle className="w-4 h-4 text-amber-600" />
                2. Cantidad de Piezas (20 a 40 Piezas)
              </label>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                4 Niveles
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

            {/* Control de Altura Final del Rompecabezas */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Altura del Rompecabezas para Corte Láser:</span>
                <span className="text-amber-800 font-black">{targetHeightMm} mm</span>
              </div>
              <input
                type="range"
                min={80}
                max={180}
                step={5}
                value={targetHeightMm}
                onChange={(e) => setTargetHeightMm(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>80 mm</span>
                <span className="text-emerald-700 font-semibold">
                  120 mm (Tamaño recomendado para 20–40 piezas)
                </span>
                <span>180 mm</span>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Asistente IA Creativo */}
          <div className="bg-white rounded-3xl border border-purple-200 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Asistente IA para Niños y Jóvenes
                </h3>
                <p className="text-[11px] text-purple-700 font-semibold">
                  Pídele cómo combinar los rasgos de tus dibujos
                </p>
              </div>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 bg-slate-50 rounded-2xl p-3 border border-slate-200/80">
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
                    <span>{msg.role === 'assistant' ? '🤖 Agente Gemini IA' : '🎨 Tu Equipo'}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendStudentInstruction();
                }}
                placeholder="Ej: Ponle cuerpo de gato, alas de dragón y tentáculos..."
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
                  Líneas <strong className="text-red-600">rojas (#FF0000)</strong>: corte láser exterior y rompecabezas de{' '}
                  <strong>{puzzlePieces} piezas</strong> recortado al contorno ·{' '}
                  <strong className="text-blue-600">Azul/Negro (#0000FF)</strong>: dibujo híbrido vectorizado
                </p>
              </div>

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
                  🧩 Vector SVG + {puzzlePieces} Piezas
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
                  🖼️ Resultado Gemini (Imagen Base)
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
            <div className="relative w-full min-h-[400px] sm:min-h-[460px] rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center p-4 overflow-hidden shadow-inner">
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
                  ⚡ Vectorizando con Potrace y recortando {puzzlePieces} piezas...
                </div>
              )}

              {fusionResult ? (
                activePreviewTab === 'vector-puzzle' ? (
                  <div
                    className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[450px] [&>svg]:bg-amber-50/95 [&>svg]:rounded-xl [&>svg]:p-3 [&>svg]:shadow-lg"
                    dangerouslySetInnerHTML={{ __html: fusionResult.previewSvg }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fusionResult.rasterDataUrl}
                      alt="Dibujo lineal en blanco y negro generado por Gemini antes de vectorizar"
                      className="max-h-[390px] w-auto rounded-xl border-2 border-slate-700 bg-white p-2 shadow-lg"
                    />
                    <span className="text-xs text-slate-300 font-medium text-center">
                      Imagen lineal generada por Gemini antes de la extracción de silueta y trazado vectorial Potrace
                    </span>
                  </div>
                )
              ) : (
                <div className="text-slate-400 text-sm text-center max-w-sm">
                  Sube de 3 a 4 dibujos en formato JPG/PNG y presiona{' '}
                  <strong className="text-white">&ldquo;Fusionar Dibujos&rdquo;</strong>.
                </div>
              )}
            </div>

            {/* Controles inferiores y Botón Descargar SVG para Corte Láser */}
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
                <span>Descargar SVG para Corte Láser ({puzzlePieces} Piezas)</span>
              </button>
            </div>

            {/* Resumen Técnico del Pipeline */}
            {fusionResult && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase">
                    1. Motor IA Multimodal
                  </div>
                  <div className="text-xs font-extrabold text-slate-800 mt-1">
                    Gemini Image Generation
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
                    {fusionResult.metrics.outerContourNodes} nodos + {fusionResult.metrics.innerVectorPathsCount} trazos
                  </div>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    Umbral adaptativo + Flood-Fill exterior
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div className="text-[10px] font-extrabold text-emerald-700 uppercase">
                    3. Rompecabezas ({puzzlePieces} Piezas)
                  </div>
                  <div className="text-xs font-extrabold text-emerald-900 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {fusionResult.metrics.clippedPuzzleSegmentsCount} cortes recortados al borde
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    Tamaño final: {fusionResult.metrics.widthMm} × {fusionResult.metrics.heightMm} mm
                  </div>
                </div>
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                Prompt Interno Enviado al Agente Gemini Multimodal:
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
