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
  ENGRAVING_STROKE_OPTIONS,
  EngravingStrokeWeight,
  PUZZLE_PIECE_OPTIONS,
  PuzzlePieceCount,
  SketchFeatureAnalysis,
  UploadedSketchInput,
  ZooFusionResponse,
} from '@/types/zoo';
import {
  extractOuterContourFromRgba,
  thinBinaryMask,
} from '@/lib/potrace-vectorizer';
import { buildPuzzleSvgFromTracedResult } from '@/lib/puzzle-clipper';

interface ZooSectionProps {
  onBackToMenu?: () => void;
}

/**
 * Procesa la imagen generada por Gemini para la Creality Falcon 10W:
 * 1. Limpia el fondo y adelgaza los trazos (Zhang-Suen thinning) dejando una IMAGEN RASTER PNG de alta velocidad (SIN vectorizar) para Grabado Láser.
 * 2. Detecta y vectoriza ÚNICAMENTE el contorno exterior cerrado (#FF0000) y las líneas del rompecabezas (#FF0000) para Corte Láser.
 */
async function buildFalconEngravingAndVectorCutClient(
  rasterUrl: string,
  puzzlePieces: PuzzlePieceCount,
  targetHeightMm: number,
  hybridTitle: string,
  includeAnnotations: boolean,
  strokeWeight: EngravingStrokeWeight = 'thin'
): Promise<{
  previewSvg: string;
  laserSvg: string;
  cleanedEngravingPngUrl: string;
  outerNodes: number;
  clippedSegmentsCount: number;
  widthMm: number;
  heightMm: number;
  cols: number;
  rows: number;
} | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => resolve(null);
    img.onload = () => {
      const maxDim = 480;
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      const w = Math.max(160, Math.round(img.width * scale));
      const h = Math.max(160, Math.round(img.height * scale));

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
      const { traced, inkMask } = extractOuterContourFromRgba(
        imgData.data,
        w,
        h,
        targetHeightMm,
        {
          alphaMax: 0.88,
          optTolerance: 0.55,
        }
      );

      if (traced.outerPolygon.length < 6) {
        resolve(null);
        return;
      }

      // Adelgazamiento morfológico (Zhang-Suen) de las líneas para grabado ultra veloz en Falcon 10W
      const finalEngraveMask = thinBinaryMask(inkMask, w, h, strokeWeight);

      // Crear el PNG recortado exactamente al bounding box del contorno (alineación 1:1 milimétrica)
      // con trazos negros finos (#000000) y fondo transparente para grabar en Creality Falcon 10W
      const { minX, minY, widthPx, heightPx } = traced.cropBoxPx;
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = widthPx;
      cropCanvas.height = heightPx;
      const cropCtx = cropCanvas.getContext('2d');

      if (cropCtx) {
        const outData = cropCtx.createImageData(widthPx, heightPx);
        for (let y = 0; y < heightPx; y++) {
          for (let x = 0; x < widthPx; x++) {
            const srcX = minX + x;
            const srcY = minY + y;
            const isInk =
              srcX >= 0 &&
              srcX < w &&
              srcY >= 0 &&
              srcY < h &&
              finalEngraveMask[srcY * w + srcX] === 1;
            const dstIdx = (y * widthPx + x) * 4;
            if (isInk) {
              outData.data[dstIdx + 0] = 0;
              outData.data[dstIdx + 1] = 0;
              outData.data[dstIdx + 2] = 0;
              outData.data[dstIdx + 3] = 255;
            } else {
              outData.data[dstIdx + 0] = 255;
              outData.data[dstIdx + 1] = 255;
              outData.data[dstIdx + 2] = 255;
              outData.data[dstIdx + 3] = 0;
            }
          }
        }
        cropCtx.putImageData(outData, 0, 0);
      }

      const cleanedEngravingPngUrl = cropCanvas.toDataURL('image/png');

      const built = buildPuzzleSvgFromTracedResult(
        traced,
        puzzlePieces,
        hybridTitle,
        includeAnnotations,
        cleanedEngravingPngUrl
      );

      resolve({
        previewSvg: built.previewSvg,
        laserSvg: built.laserSvg,
        cleanedEngravingPngUrl,
        outerNodes: traced.outerPolygon.length,
        clippedSegmentsCount: built.puzzleResult.clippedPuzzlePathsD.length,
        widthMm: built.puzzleResult.frameWidthMm,
        heightMm: built.puzzleResult.frameHeightMm,
        cols: built.puzzleResult.cols,
        rows: built.puzzleResult.rows,
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
 * Fusiona de forma dinámica los 3 a 4 dibujos a mano alzada subidos por el usuario:
 * - Extrae la caja delimitadora de trazos negros de cada boceto (eliminando márgenes de papel en blanco).
 * - Clasifica y ensambla armónicamente los elementos morfológicamente (cabeza/superior, alas/laterales, base/patas).
 * - Genera una sola imagen raster combinada donde los trazos de los estudiantes se integran armónicamente
 *   para grabado veloz en Creality Falcon 10W y corte láser exterior + puzzle.
 */
async function createHybridSketchCompositeClient(
  images: UploadedSketchInput[]
): Promise<string> {
  if (images.length > 0 && images.every((img) => img.id.startsWith('sample-'))) {
    return '/samples/gemini-fusion-demo.jpg';
  }

  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return images[0]?.dataUrl || '';

  // Fondo blanco puro
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // Cargar cada imagen y obtener sus píxeles de tinta
  const loadedImgs = await Promise.all(
    images.slice(0, 4).map(
      (sketch) =>
        new Promise<{ img: HTMLImageElement; sketch: UploadedSketchInput }>((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve({ img, sketch });
          img.onerror = () => reject(new Error('Error cargando imagen'));
          img.src = sketch.dataUrl;
        })
    )
  );

  // Extraer el bounding box de tinta de cada imagen (ignorando fondo blanco/grisáceo)
  const elements = loadedImgs.map(({ img, sketch }, index) => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tCtx = tempCanvas.getContext('2d');
    if (!tCtx) {
      return { img, sketch, index, minX: 0, minY: 0, width: img.width, height: img.height };
    }
    tCtx.drawImage(img, 0, 0);
    const data = tCtx.getImageData(0, 0, img.width, img.height).data;
    let minX = img.width;
    let minY = img.height;
    let maxX = 0;
    let maxY = 0;
    let inkCount = 0;

    for (let y = 0; y < img.height; y += 2) {
      for (let x = 0; x < img.width; x += 2) {
        const i = (y * img.width + x) * 4;
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const alpha = data[i + 3];
        if (alpha > 40 && lum < 210) {
          inkCount++;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (minX >= maxX || minY >= maxY || inkCount < 20) {
      minX = 0;
      minY = 0;
      maxX = img.width;
      maxY = img.height;
    }

    return {
      img,
      sketch,
      index,
      minX,
      minY,
      width: Math.max(10, maxX - minX),
      height: Math.max(10, maxY - minY),
      analysis: sketch.analysis,
    };
  });

  // Clasificar roles morfológicos según densidades espaciales o posición de carga:
  // 1) Lateral / Alas / Brazos (mayor sideDensity o index 1)
  // 2) Base / Patas / Tentáculos (mayor bottomDensity o index 2)
  // 3) Cabeza / Rostro / Superior (mayor topDensity o index 0)
  // 4) Cuerpo / Centro (si hay 4ª imagen)
  let headElem = elements[0];
  let wingsElem = elements[1] || elements[0];
  let baseElem = elements[2] || elements[0];
  let centerElem = elements[3];

  if (elements.length >= 3) {
    const sortedByTop = [...elements].sort(
      (a, b) => (b.analysis?.topDensity ?? 0) - (a.analysis?.topDensity ?? 0)
    );
    headElem = sortedByTop[0];

    const remaining1 = elements.filter((e) => e !== headElem);
    const sortedByBottom = [...remaining1].sort(
      (a, b) => (b.analysis?.bottomDensity ?? 0) - (a.analysis?.bottomDensity ?? 0)
    );
    baseElem = sortedByBottom[0];

    const remaining2 = remaining1.filter((e) => e !== baseElem);
    const sortedBySide = [...remaining2].sort(
      (a, b) => (b.analysis?.sideDensity ?? 0) - (a.analysis?.sideDensity ?? 0)
    );
    wingsElem = sortedBySide[0] || remaining2[0] || headElem;

    const remaining3 = remaining2.filter((e) => e !== wingsElem);
    centerElem = remaining3[0];
  }

  // Dibujar capa a capa usando 'darken' para que todos los trazos de los niños se sumen limpiamente
  ctx.globalCompositeOperation = 'darken';

  const drawCropped = (
    elem: typeof elements[0],
    destX: number,
    destY: number,
    destW: number,
    destH: number
  ) => {
    ctx.drawImage(
      elem.img,
      elem.minX,
      elem.minY,
      elem.width,
      elem.height,
      destX,
      destY,
      destW,
      destH
    );
  };

  // 1. Alas / Laterales (fondo intermedio, amplia envergadura)
  if (wingsElem) {
    const w = size * 0.76;
    const h = size * 0.44;
    const x = (size - w) / 2;
    const y = size * 0.22;
    drawCropped(wingsElem, x, y, w, h);
  }

  // 2. Base / Patas / Tentáculos (abajo, sostiene la figura)
  if (baseElem) {
    const w = size * 0.62;
    const h = size * 0.46;
    const x = (size - w) / 2;
    const y = size * 0.48;
    drawCropped(baseElem, x, y, w, h);
  }

  // 3. Si hay 4ª imagen: cuerpo / pecho / centro
  if (centerElem) {
    const w = size * 0.44;
    const h = size * 0.36;
    const x = (size - w) / 2;
    const y = size * 0.34;
    drawCropped(centerElem, x, y, w, h);
  }

  // 4. Cabeza / Rostro / Cuernos (arriba al frente)
  if (headElem) {
    const w = size * 0.54;
    const h = size * 0.42;
    const x = (size - w) / 2;
    const y = size * 0.08;
    drawCropped(headElem, x, y, w, h);
  }

  ctx.globalCompositeOperation = 'source-over';
  return canvas.toDataURL('image/png');
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
      ctx.lineWidth = 1.5;
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
  const [puzzlePieces, setPuzzlePieces] = useState<PuzzlePieceCount>(30);
  const [engravingStroke, setEngravingStroke] = useState<EngravingStrokeWeight>('thin');
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
      text: '¡Hola creador! 👋 Sube de 3 a 4 dibujos a mano alzada (JPG/PNG) y presiona "Fusionar Dibujos". Ahora los trazos de la imagen son mucho más delgados para que la Creality Falcon 10W grabe a toda velocidad, y el contorno exterior con las piezas del rompecabezas se vectorizan para el corte láser.',
      timestamp: 'Ahora',
    },
  ]);

  // Estado de procesamiento y resultados
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isFusing, setIsFusing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fusionResult, setFusionResult] = useState<ZooFusionResponse | null>(null);
  const [cleanEngravingPngUrl, setCleanEngravingPngUrl] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const directFusedInputRef = useRef<HTMLInputElement | null>(null);

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
      strokeWeight: EngravingStrokeWeight,
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

      const isCustomUpload = imgsToFuse.some((img) => !img.id.startsWith('sample-'));

      try {
        // 1. Si son dibujos personalizados del estudiante, componer dinámicamente sus trazos reales
        let dynamicCompositeUrl = '';
        if (isCustomUpload) {
          dynamicCompositeUrl = await createHybridSketchCompositeClient(imgsToFuse);
        }

        // 2. Llamar a la API para análisis multimodal de visión con Gemini (y generación nativa si hay cuota)
        let data: (ZooFusionResponse & { error?: string }) | null = null;
        try {
          const res = await fetch('/api/zoologico', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              images: imgsToFuse,
              puzzlePieces: piecesCount,
              strokeWeight,
              studentPrompt: promptText,
              targetHeightMm: heightMm,
              includeAnnotations: annotations,
              customApiKey,
            }),
          });

          if (res.ok) {
            data = await res.json();
          }
        } catch (apiErr) {
          console.warn('API de Gemini no disponible en este momento, usando motor morfológico local...', apiErr);
        }

        // Determinar qué imagen raster usar:
        // - Si Gemini generó una imagen nativa (y no es el demo), usarla
        // - Si son dibujos subidos por el estudiante, usar la composición dinámica de sus dibujos
        // - Si es el ejemplo inicial demostrativo, usar el demo
        let targetRaster = '';
        if (
          data?.hasNativeGeminiRaster &&
          data.rasterDataUrl &&
          !data.rasterDataUrl.includes('gemini-fusion-demo.jpg')
        ) {
          targetRaster = data.rasterDataUrl;
        } else if (isCustomUpload) {
          targetRaster =
            dynamicCompositeUrl || (await createHybridSketchCompositeClient(imgsToFuse));
        } else {
          targetRaster = data?.rasterDataUrl || '/samples/gemini-fusion-demo.jpg';
        }

        const title =
          data?.hybridTitle ||
          (isCustomUpload
            ? `Criatura Híbrida (${imgsToFuse.length} Dibujos Fusionados)`
            : 'Gato-Dragón-Medusa (Fusión Híbrida Gemini)');

        const assistantMsg =
          data?.assistantMessage ||
          (isCustomUpload
            ? `¡He fusionado tus ${imgsToFuse.length} dibujos a mano alzada! Cada elemento se integró en el lienzo respetando tus trazos para grabado y corte en Creality Falcon 10W.`
            : '¡He cargado el ejemplo de Gemini (Gato + Alas + Medusa)!');

        const falconBuilt = await buildFalconEngravingAndVectorCutClient(
          targetRaster,
          piecesCount,
          heightMm,
          title,
          annotations,
          strokeWeight
        );

        if (!falconBuilt) {
          throw new Error('No se pudo extraer el contorno exterior de los dibujos combinados.');
        }

        setCleanEngravingPngUrl(falconBuilt.cleanedEngravingPngUrl);

        const updatedResult: ZooFusionResponse = {
          previewSvg: falconBuilt.previewSvg,
          laserSvg: falconBuilt.laserSvg,
          rasterDataUrl: targetRaster,
          hasNativeGeminiRaster: Boolean(data?.hasNativeGeminiRaster && !isCustomUpload),
          assistantMessage: assistantMsg,
          hybridTitle: title,
          internalPromptUsed: data?.internalPromptUsed || AI_FUSION_INTERNAL_PROMPT,
          metrics: {
            imagesCount: imgsToFuse.length,
            puzzlePieces: piecesCount,
            gridCols: falconBuilt.cols,
            gridRows: falconBuilt.rows,
            widthMm: falconBuilt.widthMm,
            heightMm: falconBuilt.heightMm,
            strokeWeight,
            outerContourNodes: falconBuilt.outerNodes,
            innerVectorPathsCount: 1,
            clippedPuzzleSegmentsCount: falconBuilt.clippedSegmentsCount,
            vectorizerEngine: 'Imagen PNG (Grabado Falcon 10W) + Contorno y Puzzle Vectorizados (#FF0000)',
            aiModelUsed: data?.metrics?.aiModelUsed || 'Google Gemini Vision + Motor Morfológico Falcon 10W',
          },
        };

        setFusionResult(updatedResult);

        if (announceInChat) {
          setChatMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              text: assistantMsg,
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

  const handleStrokeWeightChange = async (newWeight: EngravingStrokeWeight) => {
    setEngravingStroke(newWeight);
    if (fusionResult?.rasterDataUrl) {
      const falconBuilt = await buildFalconEngravingAndVectorCutClient(
        fusionResult.rasterDataUrl,
        puzzlePieces,
        targetHeightMm,
        fusionResult.hybridTitle,
        showAnnotations,
        newWeight
      );
      if (falconBuilt) {
        setCleanEngravingPngUrl(falconBuilt.cleanedEngravingPngUrl);
        setFusionResult((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            previewSvg: falconBuilt.previewSvg,
            laserSvg: falconBuilt.laserSvg,
            metrics: {
              ...prev.metrics,
              strokeWeight: newWeight,
              outerContourNodes: falconBuilt.outerNodes,
              clippedPuzzleSegmentsCount: falconBuilt.clippedSegmentsCount,
              widthMm: falconBuilt.widthMm,
              heightMm: falconBuilt.heightMm,
              gridCols: falconBuilt.cols,
              gridRows: falconBuilt.rows,
            },
          };
        });
      }
    }
  };

  const handlePuzzlePiecesChange = async (newPieces: PuzzlePieceCount) => {
    setPuzzlePieces(newPieces);
    if (fusionResult?.rasterDataUrl) {
      const falconBuilt = await buildFalconEngravingAndVectorCutClient(
        fusionResult.rasterDataUrl,
        newPieces,
        targetHeightMm,
        fusionResult.hybridTitle,
        showAnnotations,
        engravingStroke
      );
      if (falconBuilt) {
        setCleanEngravingPngUrl(falconBuilt.cleanedEngravingPngUrl);
        setFusionResult((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            previewSvg: falconBuilt.previewSvg,
            laserSvg: falconBuilt.laserSvg,
            metrics: {
              ...prev.metrics,
              puzzlePieces: newPieces,
              gridCols: falconBuilt.cols,
              gridRows: falconBuilt.rows,
              outerContourNodes: falconBuilt.outerNodes,
              clippedPuzzleSegmentsCount: falconBuilt.clippedSegmentsCount,
              widthMm: falconBuilt.widthMm,
              heightMm: falconBuilt.heightMm,
            },
          };
        });
      }
    }
  };

  const handleTargetHeightChange = async (newHeight: number) => {
    setTargetHeightMm(newHeight);
    if (fusionResult?.rasterDataUrl) {
      const falconBuilt = await buildFalconEngravingAndVectorCutClient(
        fusionResult.rasterDataUrl,
        puzzlePieces,
        newHeight,
        fusionResult.hybridTitle,
        showAnnotations,
        engravingStroke
      );
      if (falconBuilt) {
        setCleanEngravingPngUrl(falconBuilt.cleanedEngravingPngUrl);
        setFusionResult((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            previewSvg: falconBuilt.previewSvg,
            laserSvg: falconBuilt.laserSvg,
            metrics: {
              ...prev.metrics,
              widthMm: falconBuilt.widthMm,
              heightMm: falconBuilt.heightMm,
              gridCols: falconBuilt.cols,
              gridRows: falconBuilt.rows,
            },
          };
        });
      }
    }
  };

  const handleShowAnnotationsChange = async (checked: boolean) => {
    setShowAnnotations(checked);
    if (fusionResult?.rasterDataUrl) {
      const falconBuilt = await buildFalconEngravingAndVectorCutClient(
        fusionResult.rasterDataUrl,
        puzzlePieces,
        targetHeightMm,
        fusionResult.hybridTitle,
        checked,
        engravingStroke
      );
      if (falconBuilt) {
        setFusionResult((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            previewSvg: falconBuilt.previewSvg,
            laserSvg: falconBuilt.laserSvg,
          };
        });
      }
    }
  };

  useEffect(() => {
    if (images.length >= 3 && images.length <= 4) {
      const timer = setTimeout(() => {
        executeFusion(
          images,
          puzzlePieces,
          engravingStroke,
          studentPrompt,
          targetHeightMm,
          showAnnotations,
          false
        );
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [images, puzzlePieces, engravingStroke, targetHeightMm, showAnnotations, studentPrompt, executeFusion]);

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
   * Permite subir directamente una imagen ya fusionada por Gemini:
   * Conserva el dibujo como imagen PNG para grabar en la Creality Falcon 10W
   * y vectoriza únicamente el contorno exterior y las líneas del rompecabezas.
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
      const falconBuilt = await buildFalconEngravingAndVectorCutClient(
        dataUrl,
        puzzlePieces,
        targetHeightMm,
        title,
        showAnnotations,
        engravingStroke
      );

      if (falconBuilt) {
        setCleanEngravingPngUrl(falconBuilt.cleanedEngravingPngUrl);
        setFusionResult({
          previewSvg: falconBuilt.previewSvg,
          laserSvg: falconBuilt.laserSvg,
          rasterDataUrl: dataUrl,
          hasNativeGeminiRaster: true,
          assistantMessage: `¡Listo para la Creality Falcon 10W! Tu imagen "${file.name}" se enmarcó dentro de un recuadro rectangular ajustado al dibujo para el grabado láser con trazos optimizados para alta velocidad, garantizando que el 100% de las piezas tengan grabado y encastres reforzados antideslizantes (${puzzlePieces} piezas · ${falconBuilt.cols}×${falconBuilt.rows}) con corte perimetral en rojo #FF0000.`,
          hybridTitle: title,
          internalPromptUsed: AI_FUSION_INTERNAL_PROMPT,
          metrics: {
            imagesCount: images.length,
            puzzlePieces,
            gridCols: falconBuilt.cols,
            gridRows: falconBuilt.rows,
            widthMm: falconBuilt.widthMm,
            heightMm: falconBuilt.heightMm,
            strokeWeight: engravingStroke,
            outerContourNodes: falconBuilt.outerNodes,
            innerVectorPathsCount: 1,
            clippedPuzzleSegmentsCount: falconBuilt.clippedSegmentsCount,
            vectorizerEngine: 'Imagen PNG (Grabado Falcon 10W) + Recuadro y Puzzle Vectorizados (#FF0000)',
            aiModelUsed: 'Gemini 3 Pro / Imagen 3 + Creality Falcon 10W Processor',
          },
        });
      } else {
        setErrorMsg('No se pudo extraer el contorno exterior de la imagen subida.');
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
        text: '¡He cargado el ejemplo de Gemini (Gato + Alas + Medusa)! La ilustración se mantiene como imagen para grabar en la Creality Falcon 10W y solo el contorno y el rompecabezas están vectorizados.',
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
      executeFusion(images, puzzlePieces, engravingStroke, text, targetHeightMm, showAnnotations, true);
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
    a.download = `falcon10w-grabado-y-corte-puzzle-${puzzlePieces}piezas.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadEngravingPngOnly = () => {
    const targetUrl = cleanEngravingPngUrl || fusionResult?.rasterDataUrl;
    if (!targetUrl) return;
    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = `falcon10w-imagen-grabado-${puzzlePieces}piezas.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
            🧩 Taller 1 · Falcon 10W (Recuadro Rectangular · Grabado PNG + Corte Puzzle de lado a lado #FF0000)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowApiConfig((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-extrabold transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-700" />
            <span>Configurar Modelos Gemini 3 Pro / Imagen 3</span>
          </button>
        </div>
      </div>

      {/* Configuración de API Key de Google Gemini */}
      {showApiConfig && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1 max-w-2xl">
            <div className="font-extrabold text-amber-950 flex items-center gap-2">
              <span>Agente Avanzado Google Gemini 3 Pro / 3.1 & Imagen 3</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-black">
                Modelos Pro & Imagen 3
              </span>
            </div>
            <p className="text-amber-900 leading-relaxed">
              Compatible con los motores más elaborados de Google: <strong>Gemini 3 Pro Image</strong>, <strong>Gemini 3.1 Pro</strong>, <strong>Gemini 3.1 Flash Image</strong> e <strong>Imagen 3</strong>. Si tu API Key cuenta con facturación activa en Google Cloud, la app generará las imágenes con estos motores de máxima elaboración artística. Si usas el plan gratuito (Free Tier), el motor morfológico y de visión multimodal ensamblará y afinará tus dibujos automáticamente.
            </p>
          </div>
          <input
            type="password"
            value={customApiKey}
            onChange={(e) => setCustomApiKey(e.target.value)}
            placeholder="Pega aquí tu Clave de API (AQ... o AIzaSy...)"
            className="w-full sm:w-72 px-3 py-2 rounded-xl bg-white border border-amber-300 text-slate-800 font-mono text-xs"
          />
        </div>
      )}

      {/* Banner Compacto del Taller 1 */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 rounded-2xl py-3 px-4 sm:px-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-amber-100 text-[10px] font-black uppercase tracking-wide">
                <Sparkles className="w-3 h-3" /> Creality Falcon 10W
              </span>
              <h1 className="text-base sm:text-lg font-black tracking-tight">
                Fusión IA para Grabado + Rompecabezas en Recuadro (20–60 Piezas) 🧩
              </h1>
            </div>
            <p className="text-amber-100 text-xs leading-normal">
              Sube de 3 a 4 dibujos a mano alzada. Grabado en imagen PNG enmarcada + corte del recuadro y líneas del puzzle de lado a lado (#FF0000).
            </p>
          </div>

          {fusionResult && (
            <div className="flex items-center gap-2 shrink-0 bg-slate-950/25 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/15 text-xs">
              <span className="text-[11px] font-bold text-amber-200">
                Grabado: <span className="text-white font-black">PNG Falcon 10W</span>
              </span>
              <span className="text-white/30">|</span>
              <span className="text-[11px] font-bold text-amber-200">
                Corte: <span className="text-emerald-300 font-black">{fusionResult.metrics.puzzlePieces} Piezas Vector</span>
              </span>
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
                Ej: 1) Gato · 2) Alas · 3) Medusa (se fusionarán en una imagen para grabar)
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
                  engravingStroke,
                  studentPrompt,
                  targetHeightMm,
                  showAnnotations,
                  true
                )
              }
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:via-orange-700 hover:to-rose-700 text-white font-black text-sm sm:text-base shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <Wand2 className={`w-5 h-5 ${isFusing ? 'animate-spin' : ''}`} />
              <span>{isFusing ? 'Generando Imagen y Contorno...' : 'Fusionar Dibujos'}</span>
            </button>

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

          {/* Tarjeta 2: Selector de Patrón de Rompecabezas (20, 30, 40, 50 o 60 Piezas) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Puzzle className="w-4 h-4 text-amber-600" />
                2. Cantidad de Piezas (20 a 60 Piezas en Recuadro)
              </label>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                Corte Vectorial #FF0000
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PUZZLE_PIECE_OPTIONS.map((opt) => {
                const isSelected = puzzlePieces === opt.count;
                return (
                  <button
                    key={opt.count}
                    type="button"
                    onClick={() => handlePuzzlePiecesChange(opt.count)}
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
                <span>Altura Final para Creality Falcon 10W:</span>
                <span className="text-amber-800 font-black">{targetHeightMm} mm</span>
              </div>
              <input
                type="range"
                min={80}
                max={180}
                step={5}
                value={targetHeightMm}
                onChange={(e) => handleTargetHeightChange(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>80 mm</span>
                <span className="text-emerald-700 font-semibold">
                  120 mm (Recomendado 20–60 piezas)
                </span>
                <span>180 mm</span>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Grosor de Línea para Grabado Láser (Creality Falcon 10W) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                3. Grosor de Línea para Grabado (Velocidad Falcon 10W)
              </label>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Grabado Rápido
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              Las líneas más delgadas reducen la cantidad de pasadas del cabezal láser, acelerando significativamente el tiempo de grabado en madera. El corte exterior y del rompecabezas se mantiene intacto.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ENGRAVING_STROKE_OPTIONS.map((opt) => {
                const isSelected = engravingStroke === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleStrokeWeightChange(opt.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-500/20 shadow-2xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">{opt.label}</span>
                      </div>
                      <span className="inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-white/90 border border-slate-200 text-amber-700 mt-1">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tarjeta 4: Asistente IA Creativo */}
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
                  {fusionResult?.hybridTitle || 'Previsualización para Creality Falcon 10W'}
                </h2>
                <p className="text-xs text-slate-500">
                  <strong>Imagen Interior (PNG sin vectorizar)</strong>: Grabado láser ·{' '}
                  <strong className="text-red-600">Vectores Rojos (#FF0000)</strong>: Corte de contorno exterior y {puzzlePieces} piezas
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
                  🧩 Imagen + Corte {puzzlePieces} Piezas
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
                  🖼️ Solo Imagen de Grabado
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
                  ⚡ Preparando Imagen de Grabado + Vectores de Corte ({puzzlePieces} piezas)...
                </div>
              )}

              {fusionResult ? (
                activePreviewTab === 'vector-puzzle' ? (
                  <div
                    className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[450px] [&>svg]:bg-white [&>svg]:rounded-xl [&>svg]:p-3 [&>svg]:shadow-lg"
                    dangerouslySetInnerHTML={{ __html: fusionResult.previewSvg }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cleanEngravingPngUrl || fusionResult.rasterDataUrl}
                      alt="Imagen para grabar en Creality Falcon 10W (sin vectorizar)"
                      className="max-h-[390px] w-auto rounded-xl border-2 border-slate-700 bg-white p-3 shadow-lg"
                    />
                    <span className="text-xs text-slate-300 font-medium text-center">
                      Imagen raster limpia (sin vectorizar) lista para modo Grabado de Imagen en Creality Falcon 10W
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

            {/* Controles inferiores y Botones de Descarga */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAnnotations}
                  onChange={(e) => handleShowAnnotationsChange(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-600"
                />
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Mostrar marco de referencia en vista previa</span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!fusionResult || isFusing}
                  onClick={handleDownloadEngravingPngOnly}
                  className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Descargar únicamente la imagen PNG limpia para grabado"
                >
                  <FileImage className="w-4 h-4 text-slate-700" />
                  <span>Solo Imagen PNG (Grabado)</span>
                </button>

                <button
                  type="button"
                  disabled={!fusionResult || isFusing}
                  onClick={handleDownloadLaserSvg}
                  className="py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar SVG para Corte Láser (Falcon 10W)</span>
                </button>
              </div>
            </div>

            {/* Resumen Técnico del Pipeline para Creality Falcon 10W */}
            {fusionResult && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[10px] font-extrabold text-slate-500 uppercase">
                    1. Dibujo Híbrido (Grabado)
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 mt-1">
                    Línea {engravingStroke === 'ultra-thin' ? 'Ultra Fina (1 px)' : engravingStroke === 'thin' ? 'Fina (Recomendada)' : 'Original'} (100% Cobertura)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {engravingStroke === 'ultra-thin' ? 'Máxima velocidad Falcon 10W' : engravingStroke === 'thin' ? 'Grabado rápido en madera' : 'Grosor estándar'} · Sin piezas en blanco
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <div className="text-[10px] font-extrabold text-amber-800 uppercase">
                    2. Marco Rectangular (Corte #FF0000)
                  </div>
                  <div className="text-xs font-extrabold text-amber-950 mt-1">
                    Ajustado al dibujo ({fusionResult.metrics.widthMm} × {fusionResult.metrics.heightMm} mm)
                  </div>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    Trazo exterior cerrado para recorte perimetral
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div className="text-[10px] font-extrabold text-emerald-700 uppercase">
                    3. Rompecabezas ({fusionResult.metrics.gridCols}×{fusionResult.metrics.gridRows} = {puzzlePieces} Piezas)
                  </div>
                  <div className="text-xs font-extrabold text-emerald-900 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Encastre reforzado antideslizante ({fusionResult.metrics.clippedPuzzleSegmentsCount} líneas)
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    Bloqueo mecánico firme de lado a lado
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
