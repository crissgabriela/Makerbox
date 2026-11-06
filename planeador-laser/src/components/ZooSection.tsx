'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Download,
  Puzzle,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Eye,
  Layers,
  FileImage,
  RotateCcw,
  Ruler,
} from 'lucide-react';
import {
  PUZZLE_PIECE_OPTIONS,
  PuzzlePieceCount,
} from '@/types/zoo';
import {
  TracedVectorResult,
  thinBinaryMask,
} from '@/lib/potrace-vectorizer';
import { buildPuzzleSvgFromTracedResult } from '@/lib/puzzle-clipper';
import {
  MAKERBOX_LOGO_ASPECT_RATIO,
  drawMakerboxLogoOnCanvas,
} from '@/lib/makerbox-logo-vector';

interface ZooSectionProps {
  onBackToMenu?: () => void;
}

const FIXED_ENGRAVING_LINE_PX = 1.5;

type LogoCornerId = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

const CORNER_LABELS: Record<LogoCornerId, string> = {
  'bottom-right': 'Esquina inferior derecha',
  'bottom-left': 'Esquina inferior izquierda',
  'top-right': 'Esquina superior derecha',
  'top-left': 'Esquina superior izquierda',
};

interface ProcessedDrawingResult {
  previewSvg: string;
  laserSvg: string;
  engravingPngUrl: string;
  widthMm: number;
  heightMm: number;
  cols: number;
  rows: number;
  cutLinesCount: number;
  selectedCorner: LogoCornerId;
}

/**
 * Genera un dibujo grupal de ejemplo a mano alzada en blanco y negro
 * para que la vista previa funcione de inmediato al abrir el Taller 1.
 */
function createSampleGroupSketchDataUrl(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 460;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Sol en esquina superior izquierda
  ctx.beginPath();
  ctx.arc(92, 82, 28, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(92 + Math.cos(ang) * 35, 82 + Math.sin(ang) * 35);
    ctx.lineTo(92 + Math.cos(ang) * 48, 82 + Math.sin(ang) * 48);
    ctx.stroke();
  }

  // Nube suave arriba al centro-derecha
  ctx.beginPath();
  ctx.arc(455, 78, 20, Math.PI * 0.6, Math.PI * 1.55);
  ctx.arc(482, 68, 24, Math.PI * 1.05, Math.PI * 1.95);
  ctx.arc(512, 80, 18, Math.PI * 1.4, Math.PI * 0.45);
  ctx.closePath();
  ctx.stroke();

  // Personaje central: Robot explorador dibujado en grupo
  // Antena
  ctx.beginPath();
  ctx.moveTo(310, 96);
  ctx.lineTo(310, 62);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(310, 54, 8, 0, Math.PI * 2);
  ctx.stroke();

  // Cabeza
  ctx.strokeRect(250, 96, 120, 86);
  // Ojos
  ctx.beginPath();
  ctx.arc(285, 132, 12, 0, Math.PI * 2);
  ctx.moveTo(347, 132);
  ctx.arc(335, 132, 12, 0, Math.PI * 2);
  ctx.stroke();
  // Sonrisa
  ctx.beginPath();
  ctx.arc(310, 148, 22, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // Cuerpo
  ctx.strokeRect(232, 194, 156, 126);
  // Corazón/engrane en el pecho
  ctx.beginPath();
  ctx.arc(310, 252, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(298, 252);
  ctx.lineTo(307, 262);
  ctx.lineTo(325, 242);
  ctx.stroke();

  // Brazos saludando
  ctx.beginPath();
  ctx.moveTo(232, 224);
  ctx.lineTo(175, 182);
  ctx.lineTo(155, 156);
  ctx.moveTo(388, 224);
  ctx.lineTo(446, 190);
  ctx.lineTo(472, 168);
  ctx.stroke();

  // Piernas
  ctx.beginPath();
  ctx.moveTo(272, 320);
  ctx.lineTo(272, 388);
  ctx.lineTo(246, 388);
  ctx.moveTo(348, 320);
  ctx.lineTo(348, 388);
  ctx.lineTo(374, 388);
  ctx.stroke();

  // Árbol a la izquierda
  ctx.beginPath();
  ctx.moveTo(118, 390);
  ctx.lineTo(118, 305);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(118, 272, 42, 0, Math.PI * 2);
  ctx.stroke();

  // Montañas suaves de fondo a la izquierda-centro (dejando esquina inferior derecha limpia)
  ctx.beginPath();
  ctx.moveTo(58, 390);
  ctx.lineTo(410, 390);
  ctx.stroke();

  // Estrellas decorativas
  const drawStar = (cx: number, cy: number, r: number) => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? r : r * 0.45;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const px = cx + Math.cos(a) * rad;
      const py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  };
  drawStar(198, 96, 13);
  drawStar(428, 128, 12);

  return canvas.toDataURL('image/png');
}

/**
 * Procesa el único dibujo a mano alzada subido por el grupo:
 * 1. Extrae los trazos oscuros limpiando el fondo del papel.
 * 2. Esqueletiza y normaliza todas las líneas a un grosor uniforme fijo de 1.5 px.
 * 3. Analiza las 4 esquinas para ubicar el logotipo oficial de MakerBox sin cruzarse con ninguna línea del dibujo.
 * 4. Genera el SVG con grabado + corte recto horizontal/vertical (#FF0000) para contrachapado de 3 mm.
 */
async function processSingleDrawingForLaser(
  imageUrl: string,
  puzzlePieces: PuzzlePieceCount,
  targetHeightMm: number,
  drawingTitle: string,
  includeAnnotations: boolean
): Promise<ProcessedDrawingResult | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => resolve(null);
    img.onload = () => {
      const maxDim = 720;
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      const w = Math.max(200, Math.round(img.width * scale));
      const h = Math.max(200, Math.round(img.height * scale));

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

      const rgba = ctx.getImageData(0, 0, w, h).data;

      // Estimación adaptativa del brillo del papel para tolerar fotos de celular o escaneos
      const lumHist = new Uint32Array(256);
      let opaqueCount = 0;
      for (let i = 0; i < w * h; i++) {
        const a = rgba[i * 4 + 3];
        if (a > 40) {
          const lum = Math.min(
            255,
            Math.max(
              0,
              Math.round(
                0.299 * rgba[i * 4] +
                  0.587 * rgba[i * 4 + 1] +
                  0.114 * rgba[i * 4 + 2]
              )
            )
          );
          lumHist[lum]++;
          opaqueCount++;
        }
      }

      let bgLum = 250;
      if (opaqueCount > 0) {
        const targetRank = Math.floor(opaqueCount * 0.85);
        let acc = 0;
        for (let l = 0; l < 256; l++) {
          acc += lumHist[l];
          if (acc >= targetRank) {
            bgLum = l;
            break;
          }
        }
      }

      const inkThreshold = Math.max(85, Math.min(212, bgLum - 32));
      const rawInkMask = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) {
        const a = rgba[i * 4 + 3];
        if (a <= 40) continue;
        const lum =
          0.299 * rgba[i * 4] +
          0.587 * rgba[i * 4 + 1] +
          0.114 * rgba[i * 4 + 2];
        if (lum < inkThreshold) {
          rawInkMask[i] = 1;
        }
      }

      // Limpieza de motas aisladas de 1 píxel (ruido de cámara)
      const cleanMask = new Uint8Array(rawInkMask);
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          if (rawInkMask[idx] === 0) continue;
          let neighbors = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              if (rawInkMask[(y + dy) * w + (x + dx)] === 1) neighbors++;
            }
          }
          if (neighbors === 0) {
            cleanMask[idx] = 0;
          }
        }
      }

      // Esqueletización a eje medial de 1 px para luego trazar todas las líneas a exactamente 1.5 px
      const skeletonMask = thinBinaryMask(cleanMask, w, h, 'ultra-thin');

      let inkMinX = w;
      let inkMinY = h;
      let inkMaxX = 0;
      let inkMaxY = 0;
      const skelPoints: { x: number; y: number }[] = [];

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (skeletonMask[y * w + x] === 1) {
            if (x < inkMinX) inkMinX = x;
            if (y < inkMinY) inkMinY = y;
            if (x > inkMaxX) inkMaxX = x;
            if (y > inkMaxY) inkMaxY = y;
            skelPoints.push({ x, y });
          }
        }
      }

      if (skelPoints.length < 10 || inkMinX >= inkMaxX || inkMinY >= inkMaxY) {
        resolve(null);
        return;
      }

      const rawInkW = Math.max(24, inkMaxX - inkMinX + 1);
      const rawInkH = Math.max(24, inkMaxY - inkMinY + 1);
      const padPx = Math.max(8, Math.round(Math.max(rawInkW, rawInkH) * 0.03));

      const baseW = rawInkW + padPx * 2;
      const baseH = rawInkH + padPx * 2;

      // Puntos del dibujo en coordenadas locales del recuadro base [0..baseW, 0..baseH]
      const localPts = skelPoints.map((p) => ({
        x: p.x - inkMinX + padPx,
        y: p.y - inkMinY + padPx,
      }));

      // Dimensionado proporcional del logo MakerBox y márgenes de seguridad
      const approxMmPerPx = targetHeightMm / baseH;
      const approxBaseWidthMm = baseW * approxMmPerPx;
      const logoWidthMm = Math.min(
        36,
        approxBaseWidthMm * 0.44,
        Math.max(22, Math.min(approxBaseWidthMm, targetHeightMm) * 0.27)
      );

      const logoW = Math.max(52, Math.round(logoWidthMm / approxMmPerPx));
      const logoH = Math.max(
        14,
        Math.round(logoW * MAKERBOX_LOGO_ASPECT_RATIO)
      );
      const insetPx = Math.max(6, Math.round(3.0 / approxMmPerPx));
      const clearPx = Math.max(6, Math.round(2.5 / approxMmPerPx));

      // Evaluar las 4 esquinas para ubicar el logo MakerBox sin cruzarse con líneas del dibujo
      const cornerOrder: LogoCornerId[] = [
        'bottom-right',
        'bottom-left',
        'top-right',
        'top-left',
      ];

      interface CornerCandidate {
        id: LogoCornerId;
        extPx: number;
        minDistSq: number;
        priority: number;
      }

      const candidates: CornerCandidate[] = cornerOrder.map((id, priority) => {
        const isRight = id === 'bottom-right' || id === 'top-right';
        const isBottom = id === 'bottom-right' || id === 'bottom-left';

        const boxX0 = isRight ? baseW - insetPx - logoW : insetPx;
        const boxY0 = isBottom ? baseH - insetPx - logoH : insetPx;
        const boxCenterX = boxX0 + logoW / 2;
        const boxCenterY = boxY0 + logoH / 2;

        const zoneXMin = isRight ? boxX0 - clearPx : 0;
        const zoneXMax = isRight ? baseW : boxX0 + logoW + clearPx;
        const zoneYMin = isBottom ? boxY0 - clearPx : 0;
        const zoneYMax = isBottom ? baseH : boxY0 + logoH + clearPx;

        let hits = 0;
        let maxYInSpan = -Infinity;
        let minYInSpan = Infinity;
        let minDistSq = Infinity;

        for (let i = 0; i < localPts.length; i++) {
          const pt = localPts[i];
          const dx = pt.x - boxCenterX;
          const dy = pt.y - boxCenterY;
          const dSq = dx * dx + dy * dy;
          if (dSq < minDistSq) minDistSq = dSq;

          if (pt.x >= zoneXMin && pt.x <= zoneXMax) {
            if (pt.y > maxYInSpan) maxYInSpan = pt.y;
            if (pt.y < minYInSpan) minYInSpan = pt.y;
            if (pt.y >= zoneYMin && pt.y <= zoneYMax) {
              hits++;
            }
          }
        }

        let extPx = 0;
        if (hits > 0) {
          if (isBottom) {
            extPx = Math.max(
              0,
              Math.ceil(maxYInSpan + clearPx + logoH + insetPx - baseH)
            );
          } else {
            extPx = Math.max(
              0,
              Math.ceil(insetPx + logoH + clearPx - minYInSpan)
            );
          }
        }

        return { id, extPx, minDistSq, priority };
      });

      candidates.sort((a, b) => {
        if (a.extPx !== b.extPx) return a.extPx - b.extPx;
        // Entre esquinas completamente despejadas (extPx === 0), elegir la más alejada de los trazos
        if (Math.abs(b.minDistSq - a.minDistSq) > 25) {
          return b.minDistSq - a.minDistSq;
        }
        return a.priority - b.priority;
      });

      const bestCorner = candidates[0];
      const isTopWinner =
        bestCorner.id === 'top-right' || bestCorner.id === 'top-left';
      const isRightWinner =
        bestCorner.id === 'bottom-right' || bestCorner.id === 'top-right';

      const shiftDrawingY = isTopWinner ? bestCorner.extPx : 0;
      const finalW = baseW;
      const finalH = baseH + bestCorner.extPx;

      const logoX = isRightWinner ? finalW - insetPx - logoW : insetPx;
      const logoY = isTopWinner ? insetPx : finalH - insetPx - logoH;

      // Renderizar el patrón final de grabado:
      // 1) Dibujo grupal con líneas continuas de exactamente 1.5 px
      // 2) Logotipo oficial MakerBox en la esquina despejada
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = finalW;
      cropCanvas.height = finalH;
      const cropCtx = cropCanvas.getContext('2d');
      if (!cropCtx) {
        resolve(null);
        return;
      }

      cropCtx.clearRect(0, 0, finalW, finalH);
      cropCtx.strokeStyle = '#000000';
      cropCtx.lineWidth = FIXED_ENGRAVING_LINE_PX;
      cropCtx.lineCap = 'round';
      cropCtx.lineJoin = 'round';

      // Trazar conexiones del esqueleto con grosor exacto de 1.5 px
      cropCtx.beginPath();
      for (let sy = inkMinY; sy <= inkMaxY; sy++) {
        for (let sx = inkMinX; sx <= inkMaxX; sx++) {
          if (skeletonMask[sy * w + sx] !== 1) continue;

          const cx = sx - inkMinX + padPx + 0.5;
          const cy = sy - inkMinY + padPx + shiftDrawingY + 0.5;

          const east = sx + 1 < w && skeletonMask[sy * w + (sx + 1)] === 1;
          const south = sy + 1 < h && skeletonMask[(sy + 1) * w + sx] === 1;
          const west = sx - 1 >= 0 && skeletonMask[sy * w + (sx - 1)] === 1;
          const north = sy - 1 >= 0 && skeletonMask[(sy - 1) * w + sx] === 1;
          const se =
            sx + 1 < w &&
            sy + 1 < h &&
            skeletonMask[(sy + 1) * w + (sx + 1)] === 1;
          const sw =
            sx - 1 >= 0 &&
            sy + 1 < h &&
            skeletonMask[(sy + 1) * w + (sx - 1)] === 1;
          const ne =
            sx + 1 < w &&
            sy - 1 >= 0 &&
            skeletonMask[(sy - 1) * w + (sx + 1)] === 1;
          const nw =
            sx - 1 >= 0 &&
            sy - 1 >= 0 &&
            skeletonMask[(sy - 1) * w + (sx - 1)] === 1;

          if (east) {
            cropCtx.moveTo(cx, cy);
            cropCtx.lineTo(cx + 1, cy);
          }
          if (south) {
            cropCtx.moveTo(cx, cy);
            cropCtx.lineTo(cx, cy + 1);
          }
          if (se && !east && !south) {
            cropCtx.moveTo(cx, cy);
            cropCtx.lineTo(cx + 1, cy + 1);
          }
          if (sw && !west && !south) {
            cropCtx.moveTo(cx, cy);
            cropCtx.lineTo(cx - 1, cy + 1);
          }

          if (!east && !south && !west && !north && !se && !sw && !ne && !nw) {
            cropCtx.moveTo(cx, cy);
            cropCtx.lineTo(cx + 0.01, cy);
          }
        }
      }
      cropCtx.stroke();

      // Integrar logo oficial MakerBox en la esquina despejada
      drawMakerboxLogoOnCanvas(cropCtx, logoX, logoY, logoW, '#000000');

      const engravingPngUrl = cropCanvas.toDataURL('image/png');

      // Calcular dimensiones exactas en mm manteniendo relación de aspecto 1:1
      const frameHeightMm = Math.max(60, Number(targetHeightMm.toFixed(1)));
      const frameWidthMm = Math.max(
        45,
        Number(((finalW / finalH) * frameHeightMm).toFixed(1))
      );

      const tracedRect: TracedVectorResult = {
        outerPolygon: [
          { x: 0, y: 0 },
          { x: frameWidthMm, y: 0 },
          { x: frameWidthMm, y: frameHeightMm },
          { x: 0, y: frameHeightMm },
        ],
        outerPathD: `M 0 0 L ${frameWidthMm} 0 L ${frameWidthMm} ${frameHeightMm} L 0 ${frameHeightMm} Z`,
        outerContourNodes: 4,
        widthMm: frameWidthMm,
        heightMm: frameHeightMm,
        cropBoxPx: {
          minX: 0,
          minY: 0,
          widthPx: finalW,
          heightPx: finalH,
        },
        engravingImageDataUrl: engravingPngUrl,
      };

      const built = buildPuzzleSvgFromTracedResult(
        tracedRect,
        puzzlePieces,
        drawingTitle,
        includeAnnotations,
        engravingPngUrl
      );

      resolve({
        previewSvg: built.previewSvg,
        laserSvg: built.laserSvg,
        engravingPngUrl,
        widthMm: built.puzzleResult.frameWidthMm,
        heightMm: built.puzzleResult.frameHeightMm,
        cols: built.puzzleResult.cols,
        rows: built.puzzleResult.rows,
        cutLinesCount: built.puzzleResult.clippedPuzzlePathsD.length + 1,
        selectedCorner: bestCorner.id,
      });
    };

    img.src = imageUrl;
  });
}

export function ZooSection({ onBackToMenu }: ZooSectionProps) {
  const [drawingUrl, setDrawingUrl] = useState<string>('');
  const [drawingName, setDrawingName] = useState<string>('Dibujo Grupal de Ejemplo');
  const [isCustomDrawing, setIsCustomDrawing] = useState<boolean>(false);

  const [puzzlePieces, setPuzzlePieces] = useState<PuzzlePieceCount>(30);
  const [targetHeightMm, setTargetHeightMm] = useState<number>(120);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [activePreviewTab, setActivePreviewTab] = useState<'vector-puzzle' | 'engraving-only'>('vector-puzzle');

  const [processed, setProcessed] = useState<ProcessedDrawingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cargar dibujo de ejemplo inicial
  useEffect(() => {
    const sampleUrl = createSampleGroupSketchDataUrl();
    if (sampleUrl) {
      setDrawingUrl(sampleUrl);
    }
  }, []);

  // Reprocesar automáticamente cada vez que cambia el dibujo, el número de piezas, la altura o las cotas
  const runProcessing = useCallback(
    async (
      srcUrl: string,
      pieces: PuzzlePieceCount,
      heightMm: number,
      title: string,
      annotations: boolean
    ) => {
      if (!srcUrl) return;
      setIsProcessing(true);
      setErrorMsg(null);
      try {
        const res = await processSingleDrawingForLaser(
          srcUrl,
          pieces,
          heightMm,
          title,
          annotations
        );
        if (!res) {
          setErrorMsg(
            'No se detectaron trazos oscuros suficientes en la imagen. Sube un dibujo con trazos claros sobre fondo claro.'
          );
          return;
        }
        setProcessed(res);
      } catch (err) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Ocurrió un error al preparar el dibujo para grabado láser.'
        );
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!drawingUrl) return;
    void runProcessing(
      drawingUrl,
      puzzlePieces,
      targetHeightMm,
      drawingName,
      showAnnotations
    );
  }, [drawingUrl, puzzlePieces, targetHeightMm, drawingName, showAnnotations, runProcessing]);

  const handleUploadSingleFile = (files: FileList | File[]) => {
    const file = Array.from(files).find(
      (f) =>
        f.type === 'image/jpeg' ||
        f.type === 'image/png' ||
        f.type === 'image/webp' ||
        /\.(jpg|jpeg|png|webp)$/i.test(f.name)
    );

    if (!file) {
      setErrorMsg('Por favor sube una imagen en formato JPG o PNG.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setErrorMsg('No se pudo leer el archivo seleccionado.');
    reader.onload = () => {
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').trim() || 'Dibujo Grupal';
      setDrawingName(cleanTitle);
      setDrawingUrl(String(reader.result));
      setIsCustomDrawing(true);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRestoreSample = () => {
    const sampleUrl = createSampleGroupSketchDataUrl();
    if (sampleUrl) {
      setDrawingName('Dibujo Grupal de Ejemplo');
      setDrawingUrl(sampleUrl);
      setIsCustomDrawing(false);
      setErrorMsg(null);
    }
  };

  const handleDownloadLaserSvg = () => {
    if (!processed) return;
    const blob = new Blob([processed.laserSvg], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `puzzle-laser-${puzzlePieces}piezas.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadEngravingPngOnly = () => {
    if (!processed) return;
    const link = document.createElement('a');
    link.href = processed.engravingPngUrl;
    link.download = `patron-grabado-${puzzlePieces}piezas.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {onBackToMenu && (
        <div className="flex items-center">
          <button
            type="button"
            onClick={onBackToMenu}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-amber-700 transition-colors cursor-pointer bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Menú Principal</span>
          </button>
        </div>
      )}

      {/* Banner Compacto del Taller 1 */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white px-5 py-3.5 sm:px-6 sm:py-4 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-extrabold uppercase tracking-wider">
              <span>Contrachapado de 3 mm · Grabado 1.5 px + Corte Recto</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight">
              Dibujo a Mano Alzada + Rompecabezas Láser 🧩
            </h1>
            <p className="text-amber-50 text-xs leading-snug">
              Sube el <strong>dibujo grupal a mano alzada (JPG/PNG)</strong>. La herramienta ajusta el trazo a{' '}
              <strong>1.5 px</strong>, ubica el <strong>logo de MakerBox</strong> en una esquina despejada y genera el puzzle con{' '}
              <strong>líneas rectas horizontales y verticales (#FF0000)</strong> sin encaje.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 bg-black/20 backdrop-blur-xs rounded-xl p-2.5 border border-white/15 shrink-0">
            <div className="px-2.5 py-1.5 rounded-lg bg-white/10">
              <div className="text-[10px] uppercase tracking-wider text-amber-200 font-bold">
                Patrón a Grabar
              </div>
              <div className="text-xs sm:text-sm font-black">Dibujo 1.5 px + Logo</div>
              <div className="text-[10px] text-amber-100">Contrachapado 3 mm</div>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-white/10">
              <div className="text-[10px] uppercase tracking-wider text-amber-200 font-bold">
                Corte Rápido
              </div>
              <div className="text-xs sm:text-sm font-black">{puzzlePieces} Piezas Rectas</div>
              <div className="text-[10px] text-emerald-200 font-semibold">
                ✓ Líneas H/V #FF0000
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Principal en 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA (5 cols): Carga de Dibujo Único + Parámetros */}
        <div className="lg:col-span-5 space-y-5">
          {/* PASO 1: Subir único dibujo grupal a mano alzada */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-black flex items-center justify-center">
                  1
                </span>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Subir Dibujo Grupal (JPG / PNG)
                </h2>
              </div>

              {isCustomDrawing && (
                <button
                  type="button"
                  onClick={handleRestoreSample}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Usar ejemplo</span>
                </button>
              )}
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.length) {
                  handleUploadSingleFile(e.dataTransfer.files);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-slate-300 hover:border-amber-400 hover:bg-amber-50/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    handleUploadSingleFile(e.target.files);
                    e.target.value = '';
                  }
                }}
              />
              <Upload className="w-7 h-7 text-amber-600 mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                Arrastra aquí el dibujo grupal o haz clic para seleccionarlo
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                1 único dibujo a mano alzada en formato JPG o PNG (sin fusión)
              </p>
            </div>

            {/* Vista previa compacta del dibujo cargado */}
            {drawingUrl && (
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={drawingUrl}
                  alt={drawingName}
                  className="w-16 h-16 object-contain rounded-xl bg-white border border-slate-200 p-1 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-extrabold text-slate-900 truncate">
                    {drawingName}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {isCustomDrawing
                      ? 'Dibujo grupal cargado listo para grabar'
                      : 'Dibujo de demostración activo'}
                  </div>
                  {processed && (
                    <div className="text-[11px] font-semibold text-emerald-700 mt-1">
                      ✓ Logo MakerBox en {CORNER_LABELS[processed.selectedCorner].toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* PASO 2: Configuración del Puzzle y Especificación Fija */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-black flex items-center justify-center">
                2
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                <Puzzle className="w-4 h-4 text-amber-600" />
                Cuadrícula de Corte y Material
              </h2>
            </div>

            {/* Parámetros técnicos fijos solicitados */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
                <div className="text-[10px] font-extrabold uppercase text-amber-800">
                  Material a Utilizar
                </div>
                <div className="text-xs sm:text-sm font-black text-amber-950 mt-0.5">
                  Contrachapado de 3 mm
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-extrabold uppercase text-slate-500">
                  Grosor de Grabado
                </div>
                <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                  1.5 px (Fijo)
                </div>
              </div>
            </div>

            {/* Selector de cantidad de piezas */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700">
                Cantidad de piezas (solo cortes horizontales y verticales):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PUZZLE_PIECE_OPTIONS.map((opt) => {
                  const active = puzzlePieces === opt.count;
                  return (
                    <button
                      key={opt.count}
                      type="button"
                      onClick={() => setPuzzlePieces(opt.count)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'border-amber-600 bg-amber-50/90 ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:border-amber-300 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-slate-900">
                          {opt.label}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            active
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {opt.cols}×{opt.rows}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-amber-800 mt-0.5">
                        {opt.difficulty}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Control de tamaño físico en milímetros */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-amber-600" />
                  Altura del Puzzle en Madera:
                </span>
                <span className="font-black text-amber-700">{targetHeightMm} mm</span>
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
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>80 mm (Compacto)</span>
                <span>120 mm (Estándar)</span>
                <span>180 mm (Grande)</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (7 cols): Previsualización + Descarga */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {drawingName}
                </h2>
                <p className="text-xs text-slate-500">
                  <strong>Grabado (1.5 px + Logo MakerBox)</strong> ·{' '}
                  <strong className="text-red-600">Corte Recto (#FF0000)</strong>: Marco y cuadrícula de{' '}
                  {processed ? processed.cols * processed.rows : puzzlePieces} piezas
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
                  🧩 Grabado + Corte {puzzlePieces} Piezas
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('engraving-only')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    activePreviewTab === 'engraving-only'
                      ? 'bg-white text-amber-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🖼️ Solo Patrón a Grabar
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

              {isProcessing && (
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black animate-pulse z-10">
                  ⚡ Generando grabado de 1.5 px + cuadrícula recta...
                </div>
              )}

              {processed ? (
                activePreviewTab === 'vector-puzzle' ? (
                  <div
                    className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[450px] [&>svg]:bg-white [&>svg]:rounded-xl [&>svg]:p-3 [&>svg]:shadow-lg"
                    dangerouslySetInnerHTML={{ __html: processed.previewSvg }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={processed.engravingPngUrl}
                      alt="Patrón de grabado láser con dibujo de 1.5 px y logo MakerBox"
                      className="max-h-[390px] w-auto rounded-xl border-2 border-slate-700 bg-white p-3 shadow-lg"
                    />
                    <span className="text-xs text-slate-300 font-medium text-center">
                      Patrón de grabado limpio (líneas de 1.5 px + logo MakerBox en{' '}
                      {CORNER_LABELS[processed.selectedCorner].toLowerCase()})
                    </span>
                  </div>
                )
              ) : (
                <div className="text-slate-400 text-sm text-center max-w-sm">
                  Sube un dibujo grupal a mano alzada en formato JPG o PNG para generar el puzzle.
                </div>
              )}
            </div>

            {/* Controles inferiores y Botones de Descarga */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAnnotations}
                  onChange={(e) => setShowAnnotations(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-600"
                />
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Mostrar marco de referencia en vista previa</span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!processed || isProcessing}
                  onClick={handleDownloadEngravingPngOnly}
                  className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Descargar únicamente la imagen PNG limpia para grabado"
                >
                  <FileImage className="w-4 h-4 text-slate-700" />
                  <span>Solo Imagen PNG (Grabado)</span>
                </button>

                <button
                  type="button"
                  disabled={!processed || isProcessing}
                  onClick={handleDownloadLaserSvg}
                  className="py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar SVG para Corte Láser</span>
                </button>
              </div>
            </div>

            {/* Resumen Técnico */}
            {processed && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-500" />
                    1. Grabado + Marca
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 mt-1">
                    Línea fija 1.5 px + Logo MakerBox
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {CORNER_LABELS[processed.selectedCorner]} (sin cruzar trazos)
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <div className="text-[10px] font-extrabold text-amber-800 uppercase">
                    2. Material y Marco (#FF0000)
                  </div>
                  <div className="text-xs font-extrabold text-amber-950 mt-1">
                    Contrachapado 3 mm ({processed.widthMm} × {processed.heightMm} mm)
                  </div>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    Recuadro exterior ajustado al dibujo
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div className="text-[10px] font-extrabold text-emerald-700 uppercase">
                    3. Puzzle ({processed.cols}×{processed.rows} = {processed.cols * processed.rows} Piezas)
                  </div>
                  <div className="text-xs font-extrabold text-emerald-900 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Cortes rectos H/V ({processed.cutLinesCount} trazos)
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    Sin piezas de encaje · Corte rápido
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
