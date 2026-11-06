'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Box,
  CheckCircle2,
  Clock,
  Compass,
  Dices,
  Download,
  FlipHorizontal2,
  GraduationCap,
  Lock,
  Play,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Ruler,
  Scissors,
  Sparkles,
  Trophy,
  Undo2,
  Unlock,
} from 'lucide-react';
import {
  CAD_NODE_MAP,
  CAD_SNAP_NODES,
  CANONICAL_PIECE_MAP,
  TANGRAM_SILHOUETTES,
  computeSilhouetteBoundaryLoops,
  createInitialLoosePieces,
  evaluateSilhouetteCompletion,
  getCadSubdivisionPolygons,
  getCompletedCadSegments,
  getSilhouetteById,
  getTransformedPieceVertices,
  pointInPolygonInclusive,
  snapVirtualPiece,
  solvePieceTransformForTarget,
  validateCadStroke,
} from '@/lib/tangram-geometry';
import {
  formatStopwatch,
  generateTangramFrameStl,
  generateTangramLaserSvg,
  getStlFrameMetrics,
} from '@/lib/tangram-exporters';
import {
  CadSubdivisionVariant,
  TangramParams,
  TangramPhase,
  TangramPieceId,
  TangramSilhouetteId,
  VirtualPieceState,
} from '@/types/tangram';

const DEFAULT_PARAMS: TangramParams = {
  sideMm: 100,
  baseMarginMm: 5,
  thicknessMm: 3,
};

interface StrokeHistoryItem {
  addedKeys: string[];
  prevVariant: CadSubdivisionVariant | null;
}

/**
 * Posiciones específicas (libres de cruce con los 5 segmentos internos y con los bordes)
 * para las etiquetas de coordenadas de los 10 nodos magnéticos en el plano CAD.
 */
const NODE_LABEL_OFFSETS: Record<
  string,
  { dx: number; dy: number; align: CanvasTextAlign }
> = {
  n_0_0: { dx: -10, dy: 18, align: 'right' },
  n_1_0: { dx: 10, dy: 18, align: 'left' },
  n_1_1: { dx: 10, dy: -10, align: 'left' },
  n_0_1: { dx: -10, dy: -10, align: 'right' },
  n_0_05: { dx: -12, dy: 4, align: 'right' },
  n_05_1: { dx: 0, dy: -12, align: 'center' },
  // Nodos internos ubicados en sectores angulares donde jamás cruza ningún segmento válido:
  n_025_025: { dx: 12, dy: 15, align: 'left' }, // Interior libre de Triángulo Grande 1
  n_05_05: { dx: 16, dy: 4, align: 'left' }, // Interior libre derecho (Triángulo Grande 2)
  n_025_075: { dx: 6, dy: -18, align: 'right' }, // Interior libre superior-izq (Triángulo Mediano)
  n_075_075: { dx: -8, dy: 24, align: 'left' }, // Interior libre inferior-der (Triángulo Grande 2)
};

function pickRandomSilhouetteId(excludeId?: TangramSilhouetteId): TangramSilhouetteId {
  const pool = excludeId
    ? TANGRAM_SILHOUETTES.filter((s) => s.id !== excludeId)
    : TANGRAM_SILHOUETTES;
  const chosen = pool[Math.floor(Math.random() * pool.length)] ?? TANGRAM_SILHOUETTES[0];
  return chosen.id;
}

export function TangramSection() {
  // 1. Registro del Equipo, Desafío Aleatorio y Parámetros
  const [teamName, setTeamName] = useState<string>('Equipo Alfa');
  const [selectedSilhouetteId, setSelectedSilhouetteId] =
    useState<TangramSilhouetteId>('swan');
  const [challengeAssigned, setChallengeAssigned] = useState<boolean>(false);
  const [params, setParams] = useState<TangramParams>(DEFAULT_PARAMS);

  // Estado general de fases y cronómetro
  const [phase, setPhase] = useState<TangramPhase>('phase1-cad');
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [teacherBypassed, setTeacherBypassed] = useState<boolean>(false);

  // 2. Estado de Fase 1: Trazado CAD
  const [activeAtomicKeys, setActiveAtomicKeys] = useState<Set<string>>(() => new Set());
  const [cadHistory, setCadHistory] = useState<StrokeHistoryItem[]>([]);
  const [cadVariant, setCadVariant] = useState<CadSubdivisionVariant | null>(null);
  const [selectedStartNodeId, setSelectedStartNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [cadCursorNorm, setCadCursorNorm] = useState<[number, number] | null>(null);
  const [cadFeedback, setCadFeedback] = useState<{
    type: 'info' | 'ok' | 'error';
    text: string;
  }>({
    type: 'info',
    text: 'Inicia el cronómetro para sortear tu desafío aleatorio o haz clic en un nodo magnético para comenzar.',
  });
  const [cadCelebrating, setCadCelebrating] = useState<boolean>(false);

  // 3. Estado de Fase 2: Ensamble Virtual de Silueta
  const [pieces, setPieces] = useState<VirtualPieceState[]>(() =>
    createInitialLoosePieces()
  );
  const [selectedPieceId, setSelectedPieceId] = useState<TangramPieceId>('parallelogram');
  const [draggingState, setDraggingState] = useState<{
    pieceId: TangramPieceId;
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const cadCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const puzzleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const downloadsRef = useRef<HTMLDivElement | null>(null);

  const activeSilhouette = useMemo(
    () => getSilhouetteById(selectedSilhouetteId),
    [selectedSilhouetteId]
  );

  const silhouetteLoops = useMemo(
    () => computeSilhouetteBoundaryLoops(activeSilhouette),
    [activeSilhouette]
  );

  const cadProgress = useMemo(
    () => getCompletedCadSegments(activeAtomicKeys, cadVariant),
    [activeAtomicKeys, cadVariant]
  );

  const puzzleEvaluation = useMemo(
    () => evaluateSilhouetteCompletion(pieces, activeSilhouette),
    [pieces, activeSilhouette]
  );

  const stlMetrics = useMemo(() => getStlFrameMetrics(params), [params]);
  const baseTotalMm = params.sideMm + 2 * params.baseMarginMm;
  const downloadsUnlocked = phase === 'completed' || teacherBypassed;

  // Cronómetro en vivo (1 segundo)
  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  // Iniciar cronómetro y asignar silueta aleatoria si aún no se había sorteado
  const startTimerAndAssignChallenge = useCallback(() => {
    if (!challengeAssigned) {
      const randomId = pickRandomSilhouetteId(selectedSilhouetteId);
      setSelectedSilhouetteId(randomId);
      setChallengeAssigned(true);
    }
    if (!timerRunning && phase !== 'completed') {
      setTimerRunning(true);
    }
  }, [challengeAssigned, selectedSilhouetteId, timerRunning, phase]);

  // Reiniciar desafío completo (deja listo un nuevo sorteo aleatorio)
  const handleResetChallenge = useCallback(() => {
    setPhase('phase1-cad');
    setTimerRunning(false);
    setElapsedSeconds(0);
    setChallengeAssigned(false);
    setTeacherBypassed(false);
    setActiveAtomicKeys(new Set());
    setCadHistory([]);
    setCadVariant(null);
    setSelectedStartNodeId(null);
    setCadCelebrating(false);
    setCadFeedback({
      type: 'info',
      text: 'Cronómetro reiniciado: haz clic en "Iniciar" para sortear aleatoriamente una nueva silueta desafío.',
    });
    setPieces(createInitialLoosePieces());
    setSelectedPieceId('parallelogram');
    setDraggingState(null);
  }, []);

  // Modo Profesora / Saltar Reto
  const handleTeacherSkip = useCallback(() => {
    let targetSil = activeSilhouette;
    if (!challengeAssigned) {
      const randomId = pickRandomSilhouetteId();
      setSelectedSilhouetteId(randomId);
      setChallengeAssigned(true);
      targetSil = getSilhouetteById(randomId);
    }
    setTimerRunning(false);
    setTeacherBypassed(true);
    setPhase('completed');

    const solvedPieces: VirtualPieceState[] = (
      Object.entries(targetSil.pieces) as [TangramPieceId, [number, number][]][]
    ).map(([pid, targetVerts]) => {
      const meta = CANONICAL_PIECE_MAP[pid];
      const solved = solvePieceTransformForTarget(pid, targetVerts);
      return {
        id: pid,
        kind: meta.kind,
        name: meta.name,
        color: meta.color,
        strokeColor: meta.strokeColor,
        x: solved.x,
        y: solved.y,
        rotationDeg: solved.rotationDeg,
        flipped: solved.flipped,
        snappedSlotId: pid,
      };
    });
    setPieces(solvedPieces);

    window.setTimeout(() => {
      downloadsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }, [activeSilhouette, challengeAssigned]);

  // ============================================================================
  // LÓGICA E INTERACCIÓN DE FASE 1: TRAZADO CAD (CANVAS 2D)
  // ============================================================================

  const getCadCanvasTransform = (canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const isCompact = rect.width < 500;
    // Márgenes amplios a izquierda y derecha para que la leyenda del Eje Y jamás toque (0, 0.5)
    const padLeft = isCompact ? 74 : Math.max(94, rect.width * 0.14);
    const padRight = isCompact ? 58 : Math.max(82, rect.width * 0.12);
    const padTop = 42;
    const padBottom = 50;

    const availW = Math.max(140, rect.width - padLeft - padRight);
    const availH = Math.max(140, rect.height - padTop - padBottom);
    const size = Math.min(availW, availH);

    const ox = padLeft + (availW - size) / 2;
    const oy = padTop + (availH - size) / 2;

    const toScreen = (nx: number, ny: number): [number, number] => [
      ox + nx * size,
      oy + (1 - ny) * size,
    ];
    const toNorm = (sx: number, sy: number): [number, number] => [
      (sx - ox) / size,
      1 - (sy - oy) / size,
    ];

    return { rect, size, ox, oy, toScreen, toNorm };
  };

  const findNearestCadNode = (
    nx: number,
    ny: number,
    maxDistNorm = 0.065
  ): string | null => {
    let bestId: string | null = null;
    let bestDist = Infinity;
    for (const node of CAD_SNAP_NODES) {
      const d = Math.hypot(node.x - nx, node.y - ny);
      if (d <= maxDistNorm && d < bestDist) {
        bestDist = d;
        bestId = node.id;
      }
    }
    return bestId;
  };

  const commitCadSegment = useCallback(
    (fromId: string, toId: string) => {
      startTimerAndAssignChallenge();
      const res = validateCadStroke(fromId, toId, activeAtomicKeys, cadVariant);
      if (!res.valid) {
        setCadFeedback({
          type: res.alreadyDrawn ? 'info' : 'error',
          text: res.message,
        });
        setSelectedStartNodeId(null);
        return;
      }

      const nextKeys = new Set(activeAtomicKeys);
      for (const k of res.newAtomicKeys) nextKeys.add(k);

      setCadHistory((prev) => [
        ...prev,
        { addedKeys: res.newAtomicKeys, prevVariant: cadVariant },
      ]);
      setActiveAtomicKeys(nextKeys);
      if (res.lockedVariant !== cadVariant) {
        setCadVariant(res.lockedVariant);
      }
      setSelectedStartNodeId(null);

      const progressAfter = getCompletedCadSegments(nextKeys, res.lockedVariant);
      if (progressAfter.completedCount === 5) {
        setCadCelebrating(true);
        setCadFeedback({
          type: 'ok',
          text: '¡Subdivisión CAD 5/5 Perfecta! Generando las 7 piezas para el Ensamble Virtual...',
        });
        window.setTimeout(() => {
          setCadCelebrating(false);
          setPieces(createInitialLoosePieces());
          setPhase('phase2-puzzle');
        }, 1500);
      } else {
        setCadFeedback({
          type: 'ok',
          text: `${res.message} (${progressAfter.completedCount}/5 segmentos completos)`,
        });
      }
    },
    [activeAtomicKeys, cadVariant, startTimerAndAssignChallenge]
  );

  const handleUndoCad = () => {
    if (cadHistory.length === 0 || cadCelebrating) return;
    const last = cadHistory[cadHistory.length - 1];
    const nextKeys = new Set(activeAtomicKeys);
    for (const k of last.addedKeys) nextKeys.delete(k);
    setActiveAtomicKeys(nextKeys);
    setCadVariant(last.prevVariant);
    setCadHistory((prev) => prev.slice(0, -1));
    setSelectedStartNodeId(null);
    setCadFeedback({
      type: 'info',
      text: 'Último trazo deshecho.',
    });
  };

  const handleCadPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = cadCanvasRef.current;
    if (!canvas) return;
    const { rect, toNorm } = getCadCanvasTransform(canvas);
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const [nx, ny] = toNorm(sx, sy);
    setCadCursorNorm([nx, ny]);
    setHoveredNodeId(findNearestCadNode(nx, ny));
  };

  const handleCadPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (cadCelebrating) return;
    if (e.button === 2) {
      setSelectedStartNodeId(null);
      return;
    }
    const canvas = cadCanvasRef.current;
    if (!canvas) return;
    const { rect, toNorm } = getCadCanvasTransform(canvas);
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const [nx, ny] = toNorm(sx, sy);
    const hitNodeId = findNearestCadNode(nx, ny, 0.075);

    if (!hitNodeId) {
      setSelectedStartNodeId(null);
      return;
    }

    startTimerAndAssignChallenge();

    if (!selectedStartNodeId) {
      setSelectedStartNodeId(hitNodeId);
      const node = CAD_NODE_MAP[hitNodeId];
      setCadFeedback({
        type: 'info',
        text: `Nodo origen ${node.label} anclado. Haz clic sobre el nodo destino para trazar el segmento.`,
      });
    } else if (selectedStartNodeId === hitNodeId) {
      setSelectedStartNodeId(null);
    } else {
      commitCadSegment(selectedStartNodeId, hitNodeId);
    }
  };

  // Renderizado Canvas 2D Fase 1 (Trazado CAD)
  useEffect(() => {
    if (phase !== 'phase1-cad') return;
    const canvas = cadCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { size, ox, oy, toScreen } = getCadCanvasTransform(canvas);

    // Fondo azul técnico CAD
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Grilla milimétrica proporcional
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const [gx] = toScreen(t, 0);
      const [, gy] = toScreen(0, t);
      ctx.beginPath();
      ctx.moveTo(gx, oy);
      ctx.lineTo(gx, oy + size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ox, gy);
      ctx.lineTo(ox + size, gy);
      ctx.stroke();
    }

    // Sub-grilla destacada de 0.25 (25 mm)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.setLineDash([4, 4]);
    for (let i = 1; i < 4; i++) {
      const t = i * 0.25;
      const [gx] = toScreen(t, 0);
      const [, gy] = toScreen(0, t);
      ctx.beginPath();
      ctx.moveTo(gx, oy);
      ctx.lineTo(gx, oy + size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ox, gy);
      ctx.lineTo(ox + size, gy);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Si acaba de completar los 5 segmentos, colorear las 7 piezas con animación
    if (cadCelebrating) {
      const polys = getCadSubdivisionPolygons(cadVariant ?? 'A');
      for (const poly of polys) {
        ctx.beginPath();
        poly.points.forEach(([px, py], idx) => {
          const [sx, sy] = toScreen(px, py);
          if (idx === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.closePath();
        ctx.fillStyle = `${poly.color}cc`;
        ctx.fill();
      }
    }

    // Cuadrado exterior 100 x 100 unidades
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.strokeRect(ox, oy, size, size);

    // Leyendas exteriores de Eje X y Eje Y separadas holgadamente de las coordenadas
    const isCompact = rect.width < 500;
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${isCompact ? 'bold 9.5px' : 'bold 11px'} ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(
      `L = ${params.sideMm} mm (Eje X: 0 → 1)`,
      ox + size / 2,
      oy + size + 38
    );
    ctx.save();
    // Desplazado completamente a la izquierda de "(0, 0.5)" sin tocarla
    ctx.translate(Math.max(14, ox - (isCompact ? 62 : 78)), oy + size / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`L = ${params.sideMm} mm (Eje Y: 0 → 1)`, 0, 0);
    ctx.restore();

    // Dibujar todos los tramos atómicos activos validados
    ctx.strokeStyle = cadCelebrating ? '#ffffff' : '#34d399';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    for (const key of activeAtomicKeys) {
      const [idA, idB] = key.split('__');
      const nA = CAD_NODE_MAP[idA];
      const nB = CAD_NODE_MAP[idB];
      if (!nA || !nB) continue;
      const [x1, y1] = toScreen(nA.x, nA.y);
      const [x2, y2] = toScreen(nB.x, nB.y);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Línea elástica (rubber-band) desde el nodo seleccionado hacia el cursor o nodo imantado
    if (selectedStartNodeId && cadCursorNorm && !cadCelebrating) {
      const startNode = CAD_NODE_MAP[selectedStartNodeId];
      const [x1, y1] = toScreen(startNode.x, startNode.y);
      let [x2, y2] = toScreen(cadCursorNorm[0], cadCursorNorm[1]);
      if (hoveredNodeId && CAD_NODE_MAP[hoveredNodeId]) {
        const hn = CAD_NODE_MAP[hoveredNodeId];
        [x2, y2] = toScreen(hn.x, hn.y);
      }

      ctx.save();
      ctx.strokeStyle = hoveredNodeId ? '#fbbf24' : '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    }

    // 1. Dibujar los círculos de los 10 Nodos Magnéticos
    for (const node of CAD_SNAP_NODES) {
      const [sx, sy] = toScreen(node.x, node.y);
      const isSelected = node.id === selectedStartNodeId;
      const isHovered = node.id === hoveredNodeId;

      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(sx, sy, 14, 0, Math.PI * 2);
        ctx.fillStyle = isSelected
          ? 'rgba(251, 191, 36, 0.28)'
          : 'rgba(56, 189, 248, 0.25)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(sx, sy, isSelected || isHovered ? 7.5 : 6, 0, Math.PI * 2);
      if (isSelected) {
        ctx.fillStyle = '#fbbf24';
      } else if (node.category === 'corner') {
        ctx.fillStyle = '#38bdf8';
      } else if (node.category === 'midpoint') {
        ctx.fillStyle = '#a78bfa';
      } else {
        ctx.fillStyle = '#34d399';
      }
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();
    }

    // 2. Dibujar todas las etiquetas de coordenadas al final (con fondo sutil y en sectores libres de líneas)
    for (const node of CAD_SNAP_NODES) {
      const [sx, sy] = toScreen(node.x, node.y);
      const isSelected = node.id === selectedStartNodeId;
      const isHovered = node.id === hoveredNodeId;
      const pos = NODE_LABEL_OFFSETS[node.id] ?? {
        dx: 0,
        dy: -12,
        align: 'center' as CanvasTextAlign,
      };

      ctx.font = isCompact
        ? 'bold 9px ui-monospace, SFMono-Regular, monospace'
        : isSelected || isHovered
        ? 'bold 11.5px ui-monospace, SFMono-Regular, monospace'
        : '600 10.5px ui-monospace, SFMono-Regular, monospace';
      ctx.textAlign = pos.align;

      const lx = sx + pos.dx;
      const ly = sy + pos.dy;
      const metrics = ctx.measureText(node.label);
      const w = metrics.width + 8;
      const h = 15;
      let bgX = lx - 4;
      if (pos.align === 'center') bgX = lx - w / 2;
      else if (pos.align === 'right') bgX = lx - w + 4;
      const bgY = ly - 11.5;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.beginPath();
      ctx.roundRect(bgX, bgY, w, h, 4);
      ctx.fill();

      ctx.fillStyle = isSelected
        ? '#fde68a'
        : isHovered
        ? '#bae6fd'
        : 'rgba(241, 245, 249, 0.95)';
      ctx.fillText(node.label, lx, ly);
    }
  }, [
    phase,
    activeAtomicKeys,
    selectedStartNodeId,
    hoveredNodeId,
    cadCursorNorm,
    cadCelebrating,
    cadVariant,
    params.sideMm,
  ]);

  // ============================================================================
  // LÓGICA E INTERACCIÓN DE FASE 2: ENSAMBLE VIRTUAL DE SILUETA
  // ============================================================================

  const getPuzzleCanvasTransform = (canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / 3.7, rect.height / 2.35);
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const toScreen = (wx: number, wy: number): [number, number] => [
      cx + wx * scale,
      cy + wy * scale,
    ];
    const toWorld = (sx: number, sy: number): [number, number] => [
      (sx - cx) / scale,
      (sy - cy) / scale,
    ];

    return { rect, scale, cx, cy, toScreen, toWorld };
  };

  // Verificar automáticamente si se completó la Fase 2 tras actualizar las piezas
  useEffect(() => {
    if (phase !== 'phase2-puzzle') return;
    if (draggingState) return;
    if (puzzleEvaluation.solved) {
      setTimerRunning(false);
      setPhase('completed');
      window.setTimeout(() => {
        downloadsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
    }
  }, [phase, draggingState, puzzleEvaluation.solved]);

  const rotatePieceBy = useCallback(
    (pieceId: TangramPieceId, deltaDeg: number) => {
      if (phase === 'completed' && !teacherBypassed) return;
      startTimerAndAssignChallenge();
      setPieces((prev) => {
        const updated = prev.map((p) => {
          if (p.id !== pieceId) return p;
          const nextRot = (((p.rotationDeg + deltaDeg) % 360) + 360) % 360;
          return { ...p, rotationDeg: nextRot, snappedSlotId: null };
        });
        const targetPiece = updated.find((p) => p.id === pieceId);
        if (!targetPiece) return updated;
        const snapped = snapVirtualPiece(targetPiece, updated, activeSilhouette);
        return updated.map((p) =>
          p.id === pieceId
            ? {
                ...p,
                x: snapped.x,
                y: snapped.y,
                snappedSlotId: snapped.snappedSlotId,
              }
            : p
        );
      });
    },
    [activeSilhouette, startTimerAndAssignChallenge, phase, teacherBypassed]
  );

  const flipPiece = useCallback(
    (pieceId: TangramPieceId) => {
      if (phase === 'completed' && !teacherBypassed) return;
      startTimerAndAssignChallenge();
      setPieces((prev) => {
        const updated = prev.map((p) =>
          p.id === pieceId
            ? { ...p, flipped: !p.flipped, snappedSlotId: null }
            : p
        );
        const targetPiece = updated.find((p) => p.id === pieceId);
        if (!targetPiece) return updated;
        const snapped = snapVirtualPiece(targetPiece, updated, activeSilhouette);
        return updated.map((p) =>
          p.id === pieceId
            ? {
                ...p,
                x: snapped.x,
                y: snapped.y,
                snappedSlotId: snapped.snappedSlotId,
              }
            : p
        );
      });
    },
    [activeSilhouette, startTimerAndAssignChallenge, phase, teacherBypassed]
  );

  // Atajos de teclado (R = rotar +45°, Q = rotar -45°, F = voltear) en Fase 2
  useEffect(() => {
    if (phase !== 'phase2-puzzle') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'r' || e.key === 'R' || e.key === 'ArrowRight') {
        e.preventDefault();
        rotatePieceBy(selectedPieceId, 45);
      } else if (e.key === 'q' || e.key === 'Q' || e.key === 'ArrowLeft') {
        e.preventDefault();
        rotatePieceBy(selectedPieceId, -45);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        flipPiece(selectedPieceId);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, selectedPieceId, rotatePieceBy, flipPiece]);

  const findHitPieceAt = (wx: number, wy: number): VirtualPieceState | null => {
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      const verts = getTransformedPieceVertices(
        p.id,
        p.x,
        p.y,
        p.rotationDeg,
        p.flipped
      );
      if (pointInPolygonInclusive(wx, wy, verts, 0.015)) {
        return p;
      }
    }
    return null;
  };

  const handlePuzzlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = puzzleCanvasRef.current;
    if (!canvas) return;
    const { rect, toWorld } = getPuzzleCanvasTransform(canvas);
    const [wx, wy] = toWorld(e.clientX - rect.left, e.clientY - rect.top);
    const hit = findHitPieceAt(wx, wy);
    if (!hit) return;

    startTimerAndAssignChallenge();
    setSelectedPieceId(hit.id);

    if (e.button === 2) {
      e.preventDefault();
      rotatePieceBy(hit.id, 45);
      return;
    }

    canvas.setPointerCapture(e.pointerId);
    setPieces((prev) => {
      const others = prev.filter((item) => item.id !== hit.id);
      return [...others, { ...hit, snappedSlotId: null }];
    });
    setDraggingState({
      pieceId: hit.id,
      pointerId: e.pointerId,
      offsetX: wx - hit.x,
      offsetY: wy - hit.y,
    });
  };

  const handlePuzzlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingState || e.pointerId !== draggingState.pointerId) return;
    const canvas = puzzleCanvasRef.current;
    if (!canvas) return;
    const { rect, toWorld } = getPuzzleCanvasTransform(canvas);
    const [wx, wy] = toWorld(e.clientX - rect.left, e.clientY - rect.top);

    const clampedX = Math.max(-1.75, Math.min(1.75, wx - draggingState.offsetX));
    const clampedY = Math.max(-1.05, Math.min(1.05, wy - draggingState.offsetY));

    setPieces((prev) =>
      prev.map((p) =>
        p.id === draggingState.pieceId
          ? { ...p, x: clampedX, y: clampedY, snappedSlotId: null }
          : p
      )
    );
  };

  const handlePuzzlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingState || e.pointerId !== draggingState.pointerId) return;
    const canvas = puzzleCanvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    const movedId = draggingState.pieceId;
    setDraggingState(null);

    setPieces((prev) => {
      const moving = prev.find((p) => p.id === movedId);
      if (!moving) return prev;
      const snapped = snapVirtualPiece(moving, prev, activeSilhouette);
      return prev.map((p) =>
        p.id === movedId
          ? {
              ...p,
              x: snapped.x,
              y: snapped.y,
              snappedSlotId: snapped.snappedSlotId,
            }
          : p
      );
    });
  };

  // Renderizado Canvas 2D Fase 2 (Ensamble de Silueta)
  useEffect(() => {
    if (phase !== 'phase2-puzzle' && phase !== 'completed') return;
    const canvas = puzzleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { toScreen } = getPuzzleCanvasTransform(canvas);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    const stepPx = 28;
    for (let x = 0; x < rect.width; x += stepPx) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    for (let y = 0; y < rect.height; y += stepPx) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    // Silueta "Fantasma" (Sombra Gris) en el centro
    ctx.save();
    for (const loop of silhouetteLoops) {
      ctx.beginPath();
      loop.forEach(([lx, ly], idx) => {
        const [sx, sy] = toScreen(lx, ly);
        if (idx === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.closePath();
      ctx.fillStyle = phase === 'completed' ? '#d1fae5' : '#cbd5e1';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = phase === 'completed' ? '#059669' : '#64748b';
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `SILUETA ASIGNADA: ${activeSilhouette.name.toUpperCase()}`,
      rect.width / 2,
      22
    );

    for (const piece of pieces) {
      const verts = getTransformedPieceVertices(
        piece.id,
        piece.x,
        piece.y,
        piece.rotationDeg,
        piece.flipped
      );
      const isSelected = piece.id === selectedPieceId;
      const isDragging = draggingState?.pieceId === piece.id;
      const isSnapped = Boolean(piece.snappedSlotId);

      ctx.save();
      if (isDragging) {
        ctx.shadowColor = 'rgba(15, 23, 42, 0.28)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 6;
      } else if (!isSnapped) {
        ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;
      }

      ctx.beginPath();
      verts.forEach(([vx, vy], idx) => {
        const [sx, sy] = toScreen(vx, vy);
        if (idx === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.closePath();

      ctx.fillStyle = piece.color;
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.lineJoin = 'round';
      if (isSelected && phase !== 'completed') {
        ctx.lineWidth = 3.2;
        ctx.strokeStyle = '#0f172a';
      } else if (isSnapped) {
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#ffffff';
      } else {
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = piece.strokeColor;
      }
      ctx.stroke();

      if (isSnapped && phase !== 'completed') {
        const [cx, cy] = toScreen(piece.x, piece.y);
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
      }
      ctx.restore();
    }
  }, [
    phase,
    pieces,
    selectedPieceId,
    draggingState,
    silhouetteLoops,
    activeSilhouette.name,
  ]);

  // ============================================================================
  // GENERACIÓN Y DESCARGA DE ARCHIVOS (.SVG y .STL)
  // ============================================================================

  const svgPreviewContent = useMemo(() => {
    return generateTangramLaserSvg({
      teamName,
      silhouette: activeSilhouette,
      elapsedSeconds,
      params,
      cadVariant: cadVariant ?? 'A',
    });
  }, [teamName, activeSilhouette, elapsedSeconds, params, cadVariant]);

  const slugifyTeam = (raw: string) =>
    (raw.trim() || 'equipo-alfa')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'equipo-alfa';

  const handleDownloadSvg = () => {
    if (!downloadsUnlocked) return;
    const blob = new Blob([svgPreviewContent], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tangrama-laser-${slugifyTeam(teamName)}-${activeSilhouette.id}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadStl = () => {
    if (!downloadsUnlocked) return;
    const stlString = generateTangramFrameStl(params);
    const blob = new Blob([stlString], { type: 'model/stl;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kit-4-bordes-3d-${stlMetrics.outerLengthMm}mm-${slugifyTeam(
      teamName
    )}.stl`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedPieceObj = pieces.find((p) => p.id === selectedPieceId) ?? pieces[0];

  // Datos SVG miniatura para mostrar la silueta asignada
  const assignedSilhouettePreview = useMemo(() => {
    const previewLoops = computeSilhouetteBoundaryLoops(activeSilhouette);
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const lp of previewLoops) {
      for (const [x, y] of lp) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    const pad = 0.14;
    const vb = `${(minX - pad).toFixed(3)} ${(minY - pad).toFixed(3)} ${(
      maxX -
      minX +
      pad * 2
    ).toFixed(3)} ${(maxY - minY + pad * 2).toFixed(3)}`;
    const dPath = previewLoops
      .map(
        (lp) =>
          lp
            .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(3)},${y.toFixed(3)}`)
            .join(' ') + ' Z'
      )
      .join(' ');
    return { vb, dPath };
  }, [activeSilhouette]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HERO COMPACTO DEL TALLER 3 + CRONÓMETRO EN VIVO */}
      <section className="rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white px-5 py-4 sm:px-7 sm:py-5 shadow-lg relative overflow-hidden border border-emerald-600/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-emerald-200 text-[11px] font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Taller 3 · Ingeniería Geométrica + Manufactura Híbrida (Láser + Impresión 3D)
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
              Desafío Tangrama CAD & Manufactura Híbrida 📐
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
              Inicia el cronómetro para recibir una <strong>silueta desafío aleatoria</strong> y supera las 2 fases en equipo para desbloquear tu placa de <strong>corte y grabado láser (.SVG)</strong> y el <strong>kit de 4 bordes 3D (.STL)</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Cronómetro en Vivo */}
            <div className="bg-slate-950/65 border border-emerald-400/40 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-inner">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  timerRunning
                    ? 'bg-emerald-500/25 text-emerald-300 animate-pulse'
                    : phase === 'completed'
                    ? 'bg-amber-400/25 text-amber-300'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                  {phase === 'completed'
                    ? 'Tiempo Récord'
                    : timerRunning
                    ? 'Cronómetro en Vivo'
                    : 'Cronómetro Listo'}
                </div>
                <div className="text-2xl font-black font-mono tracking-wider text-white">
                  {formatStopwatch(elapsedSeconds)}
                </div>
              </div>
              {!timerRunning && phase !== 'completed' && (
                <button
                  type="button"
                  onClick={startTimerAndAssignChallenge}
                  className="ml-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer"
                  title="Iniciar Cronómetro y Asignar Desafío Aleatorio"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Iniciar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 1. PANEL DE REGISTRO DEL EQUIPO Y PARÁMETROS FÍSICOS */}
      <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
              1
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Registro del Equipo y Parámetros de Manufactura
              </h2>
              <p className="text-xs text-slate-500">
                Ingresa el nombre de tu equipo, verifica los parámetros físicos e inicia el cronómetro para revelar tu silueta aleatoria.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetChallenge}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reiniciar Partida</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Nombre del Equipo + Parámetros Físicos */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label
                htmlFor="team-name-input"
                className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Nombre del Equipo (Se grabará con láser en la base)
              </label>
              <input
                id="team-name-input"
                type="text"
                maxLength={28}
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Ej. Equipo Alfa"
                className="w-full rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:outline-none px-3.5 py-2.5 text-sm font-bold text-slate-900 bg-slate-50/60"
              />
            </div>

            {/* Parámetros Físicos */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                  <Ruler className="w-3.5 h-3.5 text-emerald-600" />
                  Parámetros Físicos (mm)
                </span>
                {(params.sideMm !== 100 ||
                  params.baseMarginMm !== 5 ||
                  params.thicknessMm !== 3) && (
                  <button
                    type="button"
                    onClick={() => setParams(DEFAULT_PARAMS)}
                    className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Restaurar (100 / 5 / 3 mm)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Lado L (mm)
                  </label>
                  <input
                    type="number"
                    min={60}
                    max={180}
                    step={5}
                    value={params.sideMm}
                    onChange={(e) =>
                      setParams((p) => ({
                        ...p,
                        sideMm: Math.max(60, Math.min(180, Number(e.target.value) || 100)),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-extrabold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Margen 3D (mm)
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={12}
                    step={0.5}
                    value={params.baseMarginMm}
                    onChange={(e) =>
                      setParams((p) => ({
                        ...p,
                        baseMarginMm: Math.max(
                          3,
                          Math.min(12, Number(e.target.value) || 5)
                        ),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-extrabold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Espesor (mm)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={6}
                    step={0.5}
                    value={params.thicknessMm}
                    onChange={(e) =>
                      setParams((p) => ({
                        ...p,
                        thicknessMm: Math.max(
                          2,
                          Math.min(6, Number(e.target.value) || 3)
                        ),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-extrabold text-slate-900"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-semibold text-slate-600 border-t border-slate-200/80">
                <span>
                  Placa Base:{' '}
                  <strong className="text-slate-900">
                    {baseTotalMm} × {baseTotalMm} mm
                  </strong>
                </span>
                <span>
                  Ranura 3D:{' '}
                  <strong className="text-emerald-700">
                    {stlMetrics.slotWidthMm} × {stlMetrics.slotDepthMm} mm
                  </strong>
                </span>
                <span>
                  Perfil 45°:{' '}
                  <strong className="text-indigo-700">
                    {stlMetrics.outerLengthMm} mm
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Panel de Silueta Objetivo (Asignación Aleatoria al Iniciar el Cronómetro) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Desafío de Silueta Objetivo (Asignación Aleatoria al Iniciar)
            </label>

            {!challengeAssigned ? (
              <div className="flex-1 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-2 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-extrabold uppercase tracking-wider">
                    <Dices className="w-3.5 h-3.5 text-emerald-700" />
                    Sorteo Automático entre las 5 Siluetas Clásicas
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    ¿Qué silueta le tocará a {teamName.trim() || 'tu equipo'}?
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Al presionar <strong>Iniciar Cronómetro</strong>, el sistema asignará al azar una de las 5 siluetas de ingeniería: <strong>Cisne, Cohete/Avión, Gato, Casa o Barco</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={startTimerAndAssignChallenge}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
                >
                  <Dices className="w-4 h-4" />
                  <span>Iniciar Cronómetro y Sortear</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 rounded-2xl border-2 border-emerald-500 bg-emerald-50/70 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5 shadow-xs">
                <div className="w-24 h-24 rounded-2xl bg-white border border-emerald-200 flex items-center justify-center p-2.5 shadow-2xs shrink-0">
                  <svg
                    viewBox={assignedSilhouettePreview.vb}
                    className="w-full h-full overflow-visible"
                    aria-hidden="true"
                  >
                    <path
                      d={assignedSilhouettePreview.dPath}
                      fill="#059669"
                      stroke="#064e3b"
                      strokeWidth={0.04}
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    Desafío Aleatorio Asignado · #{activeSilhouette.number}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    {activeSilhouette.emoji} {activeSilhouette.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700">
                    {activeSilhouette.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* STEPPER DE FASES INTERACTIVAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            if (phase !== 'phase1-cad') setPhase('phase1-cad');
          }}
          className={`rounded-2xl border-2 px-4 py-3 flex items-center justify-between transition-all cursor-pointer text-left ${
            phase === 'phase1-cad'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
              : cadProgress.completedCount === 5 || teacherBypassed
              ? 'border-emerald-200 bg-white text-slate-800'
              : 'border-slate-200 bg-white text-slate-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                cadProgress.completedCount === 5 || teacherBypassed
                  ? 'bg-emerald-600 text-white'
                  : phase === 'phase1-cad'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {cadProgress.completedCount === 5 || teacherBypassed ? '✓' : 'F1'}
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                Fase 1 · Trazado CAD
              </div>
              <div className="text-sm font-black text-slate-900">
                Subdivisión Geométrica (5 Segmentos)
              </div>
            </div>
          </div>
          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700">
            {teacherBypassed ? '5/5' : `${cadProgress.completedCount}/5`}
          </span>
        </button>

        <button
          type="button"
          disabled={cadProgress.completedCount < 5 && !teacherBypassed && phase === 'phase1-cad'}
          onClick={() => {
            if (cadProgress.completedCount === 5 || teacherBypassed || phase !== 'phase1-cad') {
              setPhase(phase === 'completed' ? 'completed' : 'phase2-puzzle');
            }
          }}
          className={`rounded-2xl border-2 px-4 py-3 flex items-center justify-between transition-all text-left ${
            phase === 'phase2-puzzle' || phase === 'completed'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs cursor-pointer'
              : cadProgress.completedCount === 5
              ? 'border-slate-300 bg-white text-slate-800 cursor-pointer hover:border-emerald-400'
              : 'border-slate-200 bg-slate-100/70 text-slate-400 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                phase === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : phase === 'phase2-puzzle'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {phase === 'completed' ? '✓' : 'F2'}
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                Fase 2 · Rompecabezas Virtual
              </div>
              <div className="text-sm font-black text-slate-900">
                Ensamble de Silueta ({challengeAssigned ? activeSilhouette.name : 'Sorteo al iniciar'})
              </div>
            </div>
          </div>
          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700">
            {phase === 'completed' ? '100%' : `${puzzleEvaluation.coveragePercent}%`}
          </span>
        </button>
      </div>

      {/* BANNER DE ÉXITO AL COMPLETAR LAS DOS FASES */}
      {phase === 'completed' && (
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 sm:p-6 shadow-xl border border-emerald-400/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Trophy className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-100">
                {teacherBypassed
                  ? 'Modo Profesora Activado · Archivos Desbloqueados'
                  : `¡Excelente Ingeniería, ${teamName || 'Equipo'}!`}
              </div>
              <h3 className="text-xl sm:text-2xl font-black">
                ¡Desafío Superado en {formatStopwatch(elapsedSeconds)}!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-50">
                Los archivos parametrizados de manufactura híbrida (<strong>.SVG Láser</strong> con logo MakerBox y{' '}
                <strong>.STL 3D</strong>) están listos para descargar abajo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setTeacherBypassed(false);
              setPieces(createInitialLoosePieces());
              setPhase('phase2-puzzle');
              setTimerRunning(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-extrabold transition-colors cursor-pointer shrink-0"
          >
            Volver a Armar Silueta
          </button>
        </div>
      )}

      {/* 2. FASE 1 INTERACTIVA: MODO "TRAZADO CAD" */}
      {phase === 'phase1-cad' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                <Compass className="w-4 h-4" />
                Fase 1 Interactiva · Modo &ldquo;Trazado CAD&rdquo;
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Traza los 5 Segmentos Internos del Tangrama ({params.sideMm} × {params.sideMm} unidades)
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={cadHistory.length === 0 || cadCelebrating}
                onClick={handleUndoCad}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-extrabold transition-colors cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Deshacer</span>
              </button>

              <button
                type="button"
                disabled={activeAtomicKeys.size === 0 || cadCelebrating}
                onClick={() => {
                  setActiveAtomicKeys(new Set());
                  setCadHistory([]);
                  setCadVariant(null);
                  setSelectedStartNodeId(null);
                  setCadFeedback({
                    type: 'info',
                    text: 'Plano CAD limpio. Haz clic de nodo a nodo para trazar los 5 segmentos.',
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-extrabold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Limpiar Trazos</span>
              </button>
            </div>
          </div>

          {/* Barra de retroalimentación CAD en tiempo real */}
          <div
            className={`rounded-2xl px-4 py-2.5 text-xs font-bold flex items-center justify-between gap-3 border ${
              cadFeedback.type === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : cadFeedback.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-sky-50 border-sky-200 text-sky-900'
            }`}
          >
            <span>{cadFeedback.text}</span>
            {selectedStartNodeId && (
              <button
                type="button"
                onClick={() => setSelectedStartNodeId(null)}
                className="px-2.5 py-1 rounded-lg bg-white/80 border border-slate-300 text-slate-700 text-[11px] font-extrabold shrink-0 cursor-pointer"
              >
                Cancelar Nodo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Lienzo 2D CAD */}
            <div className="lg:col-span-8">
              <div className="rounded-2xl overflow-hidden border-2 border-slate-800 shadow-md bg-slate-900">
                <canvas
                  ref={cadCanvasRef}
                  onPointerMove={handleCadPointerMove}
                  onPointerDown={handleCadPointerDown}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setSelectedStartNodeId(null);
                  }}
                  className="w-full h-[390px] sm:h-[460px] block touch-none cursor-crosshair"
                />
              </div>
            </div>

            {/* Lista de Verificación de los 5 Segmentos Clásicos */}
            <div className="lg:col-span-4 space-y-3 bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Verificación Geométrica
                </h4>
                <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  {cadProgress.completedCount} / 5 Segmentos
                </span>
              </div>

              <ul className="space-y-2">
                {cadProgress.allSegmentsForVariant.map((seg, index) => {
                  const done = cadProgress.completedIds.includes(seg.id);
                  return (
                    <li
                      key={seg.id}
                      className={`rounded-xl p-2.5 border text-xs transition-all ${
                        done
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 font-extrabold">
                        <span>
                          {index + 1}. {seg.title}
                        </span>
                        {done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                        {seg.hint}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="rounded-xl bg-slate-900 text-slate-200 p-3 text-[11px] space-y-1">
                <div className="font-extrabold text-sky-300">
                  Leyenda de Nodos Magnéticos:
                </div>
                <div>🔵 Esquinas: (0,0), (1,0), (1,1), (0,1)</div>
                <div>🟣 Puntos medios: (0, 0.5), (0.5, 1)</div>
                <div>🟢 Diagonal: (0.25, 0.25), (0.5, 0.5), (0.25, 0.75), (0.75, 0.75)</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. FASE 2 INTERACTIVA: MODO "ENSAMBLE DE SILUETA" */}
      {(phase === 'phase2-puzzle' || phase === 'completed') && (
        <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                <Award className="w-4 h-4" />
                Fase 2 Interactiva · Modo &ldquo;Ensamble de Silueta&rdquo;
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Arma la Silueta Asignada: {activeSilhouette.emoji} {activeSilhouette.name}
              </h3>
              <p className="text-xs text-slate-500">
                Arrastra las 7 piezas hacia la sombra central. Usa <strong>clic derecho</strong> (o los botones en pantalla / tecla <strong>R</strong>) para rotar 45°, y <strong>Voltear</strong> (tecla <strong>F</strong>) para el paralelogramo.
              </p>
            </div>

            {/* Controles en Pantalla para la Pieza Seleccionada */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2">
              <div className="px-2.5 py-1 flex items-center gap-2 border-r border-slate-200">
                <span
                  className="w-3.5 h-3.5 rounded-sm inline-block border border-black/20"
                  style={{ backgroundColor: selectedPieceObj?.color }}
                />
                <span className="text-xs font-extrabold text-slate-800">
                  {selectedPieceObj?.name}
                </span>
              </div>

              <button
                type="button"
                onClick={() => rotatePieceBy(selectedPieceId, -45)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-extrabold text-slate-800 cursor-pointer"
                title="Rotar -45° (Tecla Q)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>-45°</span>
              </button>

              <button
                type="button"
                onClick={() => rotatePieceBy(selectedPieceId, 45)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-extrabold text-slate-800 cursor-pointer"
                title="Rotar +45° (Clic derecho o Tecla R)"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>+45°</span>
              </button>

              <button
                type="button"
                onClick={() => flipPiece(selectedPieceId)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-extrabold cursor-pointer transition-colors ${
                  selectedPieceId === 'parallelogram'
                    ? 'bg-pink-600 hover:bg-pink-700 border-pink-700 text-white shadow-2xs'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
                title="Voltear pieza horizontalmente (Tecla F)"
              >
                <FlipHorizontal2 className="w-3.5 h-3.5" />
                <span>Voltear</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPieces(createInitialLoosePieces());
                  if (phase === 'completed') {
                    setPhase('phase2-puzzle');
                    setTimerRunning(true);
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                title="Esparcir las 7 piezas alrededor"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Soltar Piezas</span>
              </button>
            </div>
          </div>

          {/* Barra de progreso de cobertura de la silueta */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-slate-600">
                Precisión de Cobertura sobre la Silueta Fantasma
              </span>
              <span className="text-emerald-700">
                {phase === 'completed' ? 100 : puzzleEvaluation.coveragePercent}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                style={{
                  width: `${
                    phase === 'completed' ? 100 : puzzleEvaluation.coveragePercent
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Canvas 2D del Rompecabezas Virtual */}
          <div className="rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner bg-slate-50">
            <canvas
              ref={puzzleCanvasRef}
              onPointerDown={handlePuzzlePointerDown}
              onPointerMove={handlePuzzlePointerMove}
              onPointerUp={handlePuzzlePointerUp}
              onPointerCancel={handlePuzzlePointerUp}
              onContextMenu={(e) => e.preventDefault()}
              className="w-full h-[400px] sm:h-[470px] block touch-none cursor-grab active:cursor-grabbing"
            />
          </div>
        </section>
      )}

      {/* 4. PANEL DE ARCHIVOS DESBLOQUEADOS (OUTPUTS DE MANUFACTURA HÍBRIDA) */}
      <section
        ref={downloadsRef}
        className={`rounded-3xl border-2 p-5 sm:p-7 transition-all ${
          downloadsUnlocked
            ? 'bg-white border-emerald-500 shadow-xl'
            : 'bg-slate-100/80 border-slate-300 opacity-85'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                downloadsUnlocked
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-300 text-slate-600'
              }`}
            >
              {downloadsUnlocked ? (
                <Unlock className="w-6 h-6" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                Outputs de Manufactura Híbrida (Corte Láser + Impresión 3D)
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900">
                {downloadsUnlocked
                  ? '¡Archivos Parametrizados Desbloqueados!'
                  : 'Completa las Fases 1 y 2 para Desbloquear la Manufactura'}
              </h2>
            </div>
          </div>

          {!downloadsUnlocked && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-200 text-slate-700 text-xs font-extrabold">
              <Lock className="w-3.5 h-3.5" />
              Bloqueado hasta superar el desafío
            </span>
          )}
        </div>

        {/* Vista Previa Técnica Dual + Botones de Descarga */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* TARJETA 1: CORTE Y GRABADO LÁSER (.SVG) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                  <Scissors className="w-3.5 h-3.5" />
                  Corte #FF0000 + Grabado #0000FF
                </span>
                <span className="text-xs font-bold text-slate-500">LightBurn (.SVG)</span>
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-900">
                1. Placa Base Personalizada ({baseTotalMm} × {baseTotalMm} mm) + 7 Piezas ({params.sideMm} × {params.sideMm} mm)
              </h3>

              {/* Vista Previa Real del SVG */}
              <div className="rounded-xl bg-white border border-slate-200 p-3 flex items-center justify-center overflow-hidden min-h-[190px]">
                <div
                  className={`w-full max-w-md transition-all ${
                    downloadsUnlocked ? '' : 'blur-[3px] select-none pointer-events-none'
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: svgPreviewContent
                      .replace(/width="[^"]*"/, 'width="100%"')
                      .replace(/height="[^"]*"/, 'height="auto"')
                      .replace(/stroke-width="0\.1"/g, 'stroke-width="0.6"')
                      .replace(/stroke-width="0\.12"/g, 'stroke-width="0.22"')
                      .replace(/stroke-width="0\.15"/g, 'stroke-width="0.5"'),
                  }}
                />
              </div>

              <ul className="text-xs text-slate-600 space-y-1">
                <li>
                  <strong className="text-red-600">Rojo (#FF0000, 0.1 mm):</strong>{' '}
                  Corte exterior de Placa Base ({baseTotalMm} × {baseTotalMm} mm) + Tangrama ({params.sideMm} × {params.sideMm} mm) con sus 5 líneas de subdivisión.
                </li>
                <li>
                  <strong className="text-blue-600">Azul (#0000FF):</strong> Recuadro guía centrado ({params.sideMm} × {params.sideMm} mm), <strong>logo oficial MakerBox</strong> centrado arriba, silueta <strong>{activeSilhouette.name}</strong>, equipo <strong>{teamName || 'Equipo Alfa'}</strong> y récord <strong>{formatStopwatch(elapsedSeconds)}</strong>.
                </li>
              </ul>
            </div>

            <button
              type="button"
              disabled={!downloadsUnlocked}
              onClick={handleDownloadSvg}
              className={`w-full py-3.5 px-5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                downloadsUnlocked
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-md hover:shadow-lg cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Descargar Corte Láser Personalizado (.SVG)</span>
            </button>
          </div>

          {/* TARJETA 2: KIT 4 BORDES PERIMETRALES 3D (.STL) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                  <Box className="w-3.5 h-3.5" />
                  Impresión 3D · 4 Perfiles a 45°
                </span>
                <span className="text-xs font-bold text-slate-500">Malla Sólida (.STL)</span>
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-900">
                2. Kit 4 Bordes Perimetrales con Inglete a 45° (Largo Exterior {stlMetrics.outerLengthMm} mm)
              </h3>

              {/* Diagrama Técnico de Sección C + Inglete 45° */}
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 flex items-center justify-center min-h-[190px]">
                <svg
                  viewBox="0 0 360 165"
                  className={`w-full max-w-md h-auto ${
                    downloadsUnlocked ? '' : 'blur-[2px]'
                  }`}
                >
                  <text
                    x="95"
                    y="18"
                    fill="#94a3b8"
                    fontSize="9.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    SECCIÓN PERFIL C (COTA EN MM)
                  </text>
                  <path
                    d="M 40 32 L 72 32 L 132 32 L 132 64 L 72 64 L 72 104 L 132 104 L 132 130 L 40 130 Z"
                    fill="#38bdf8"
                    fillOpacity="0.22"
                    stroke="#38bdf8"
                    strokeWidth="2.2"
                  />
                  <rect
                    x="74"
                    y="67"
                    width="82"
                    height="34"
                    fill="#f59e0b"
                    fillOpacity="0.45"
                    stroke="#fbbf24"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="134"
                    y="33"
                    width="34"
                    height="32"
                    fill="#10b981"
                    fillOpacity="0.45"
                    stroke="#34d399"
                    strokeWidth="1.5"
                  />
                  <text
                    x="114"
                    y="88"
                    fill="#fef3c7"
                    fontSize="8.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Base ({stlMetrics.slotWidthMm}×{stlMetrics.slotDepthMm}mm)
                  </text>
                  <text
                    x="102"
                    y="51"
                    fill="#bae6fd"
                    fontSize="8.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Tope {stlMetrics.topStopperHeightMm} mm
                  </text>
                  <text x="95" y="149" fill="#cbd5e1" fontSize="8.5" textAnchor="middle">
                    Abraza margen libre de {params.baseMarginMm} mm
                  </text>

                  <text
                    x="268"
                    y="18"
                    fill="#94a3b8"
                    fontSize="9.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    KIT 4 BARRAS INGLETE 45°
                  </text>
                  {[0, 1, 2, 3].map((idx) => {
                    const y = 34 + idx * 24;
                    return (
                      <polygon
                        key={idx}
                        points={`192,${y + 16} 206,${y} 330,${y} 344,${y + 16}`}
                        fill="#818cf8"
                        fillOpacity="0.28"
                        stroke="#a5b4fc"
                        strokeWidth="1.6"
                      />
                    );
                  })}
                  <text
                    x="268"
                    y="145"
                    fill="#e0e7ff"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Largo ext: {stlMetrics.outerLengthMm} mm · Int: {stlMetrics.innerOpeningMm} mm
                  </text>
                </svg>
              </div>

              <ul className="text-xs text-slate-600 space-y-1">
                <li>
                  <strong className="text-indigo-700">Geometría exacta:</strong> 4 barras con esquinas a <strong>45°</strong> (largo exterior <strong>{stlMetrics.outerLengthMm} mm</strong>, fondo de ranura <strong>{stlMetrics.slotBackLengthMm} mm</strong>, ventana interior <strong>{stlMetrics.innerOpeningMm} mm</strong>).
                </li>
                <li>
                  <strong className="text-slate-800">Impresión sin soportes:</strong> Ranura interna de <strong>{stlMetrics.slotWidthMm} mm × {stlMetrics.slotDepthMm} mm</strong> y tope superior de <strong>{stlMetrics.topStopperHeightMm} mm</strong> orientados planos sobre cama Z=0.
                </li>
              </ul>
            </div>

            <button
              type="button"
              disabled={!downloadsUnlocked}
              onClick={handleDownloadStl}
              className={`w-full py-3.5 px-5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                downloadsUnlocked
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md hover:shadow-lg cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Descargar Kit 4 Bordes 3D (.STL)</span>
            </button>
          </div>
        </div>
      </section>

      {/* BOTÓN DISCRETO AL FINAL DE TODA LA PÁGINA: MODO PROFESORA / SALTAR RETO */}
      <div className="pt-2 flex items-center justify-end">
        <button
          type="button"
          onClick={handleTeacherSkip}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-200/70 hover:bg-slate-200 border border-slate-300 text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
          title="Desbloquear archivos inmediatamente para pruebas técnicas"
        >
          <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
          <span>Modo Profesora / Saltar Reto</span>
        </button>
      </div>
    </div>
  );
}
