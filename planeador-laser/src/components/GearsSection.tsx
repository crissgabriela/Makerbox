'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Clock,
  Cog,
  Compass,
  Download,
  Eye,
  Flame,
  GraduationCap,
  Grid,
  Hand,
  Info,
  Pause,
  Play,
  RotateCcw,
  Scissors,
  Sliders,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  BOARD_HOLE_DIAMETER_MM,
  BOARD_SIZE_PRESETS,
  GEAR_BORE_DIAMETER_MM,
  GEAR_CATALOG,
  GEAR_CATALOG_LIST,
  GEAR_CHALLENGES,
  GEAR_MODULE_MM,
  GearChallengeId,
  GearSizeId,
  MatrixPatternId,
  PlacedGear,
} from '@/types/gears';
import {
  analyzeGearTrain,
  buildBoardSpec,
  buildGearToothPolygon,
  createInitialGearsForChallenge,
  findValidTangentHoles,
  gearPolygonToSvgPath,
  generateGearPinsAndCrankStl,
  generateGearsOnlyLaserSvg,
  generateMatrixPegboardLaserSvg,
  getAllBoardHoles,
  getChallengeObstacles,
  gridToMm,
  snapGearToMatrix,
} from '@/lib/gears-processor';

interface ActiveDragState {
  mode: 'palette' | 'existing';
  sizeId: GearSizeId;
  gearId?: string;
  clientX: number;
  clientY: number;
  overBoard: boolean;
  overTrash: boolean;
  snappedPreview: {
    col: number;
    row: number;
    x: number;
    y: number;
    isExactTangent: boolean;
    tangentCount: number;
  } | null;
}

export function GearsSection() {
  // Configuración del Espacio de Trabajo del Tablero (Ancho × Alto en cm + Tipo de Matriz)
  const [boardWidthCm, setBoardWidthCm] = useState<number>(30);
  const [boardHeightCm, setBoardHeightCm] = useState<number>(30);
  const [matrixPattern, setMatrixPattern] = useState<MatrixPatternId>('triangular');
  const [challengeId, setChallengeId] = useState<GearChallengeId>('libre');
  const [teamName, setTeamName] = useState<string>('Equipo Engranajes');

  const board = useMemo(
    () => buildBoardSpec(boardWidthCm, boardHeightCm, matrixPattern),
    [boardWidthCm, boardHeightCm, matrixPattern]
  );
  const challenge = GEAR_CHALLENGES[challengeId];

  const [gears, setGears] = useState<PlacedGear[]>(() =>
    createInitialGearsForChallenge(GEAR_CHALLENGES.libre, buildBoardSpec(30, 30, 'triangular'))
  );
  const [activeToolSize, setActiveToolSize] = useState<GearSizeId>('m');
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);

  // Visualización y Simulación
  const [viewMode, setViewMode] = useState<'circles' | 'gears' | 'svg'>('circles');
  const [svgPreviewType, setSvgPreviewType] = useState<'gears' | 'board_matrix' | 'board_fast'>(
    'gears'
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showValidHoles, setShowValidHoles] = useState<boolean>(true);
  const [simTimeSec, setSimTimeSec] = useState<number>(0);

  const svgBoardRef = useRef<SVGSVGElement | null>(null);
  const trashZoneRef = useRef<HTMLDivElement | null>(null);

  // Mantener referencias frescas para los listeners globales de pointermove/pointerup
  const gearsRef = useRef(gears);
  gearsRef.current = gears;
  const boardRef = useRef(board);
  boardRef.current = board;

  const obstacles = useMemo(
    () => getChallengeObstacles(challenge, board),
    [challenge, board]
  );
  const obstaclesRef = useRef(obstacles);
  obstaclesRef.current = obstacles;

  // Pre-calcular los contornos dentados para los 3 tamaños (4, 6 y 8 cm)
  const toothPathsBySize = useMemo(() => {
    const map: Record<GearSizeId, string> = {
      m: gearPolygonToSvgPath(buildGearToothPolygon(GEAR_CATALOG.m.teeth, GEAR_MODULE_MM)),
      l: gearPolygonToSvgPath(buildGearToothPolygon(GEAR_CATALOG.l.teeth, GEAR_MODULE_MM)),
      xl: gearPolygonToSvgPath(buildGearToothPolygon(GEAR_CATALOG.xl.teeth, GEAR_MODULE_MM)),
    };
    return map;
  }, []);

  // Análisis cinemático en vivo
  const analysis = useMemo(
    () => analyzeGearTrain(gears, challenge, board),
    [gears, challenge, board]
  );

  // Todos los hoyos de la matriz física
  const matrixHoles = useMemo(() => getAllBoardHoles(board), [board]);

  // Hoyos tangentes válidos (ortogonales y diagonales exactas) para el círculo que se arrastra o está activo
  const validTangentHoles = useMemo(() => {
    const sizeToShow = activeDrag ? activeDrag.sizeId : activeToolSize;
    const refGears =
      activeDrag?.mode === 'existing' && activeDrag.gearId
        ? gears.filter((g) => g.id !== activeDrag.gearId)
        : gears;
    return findValidTangentHoles(sizeToShow, refGears, board, obstacles);
  }, [activeDrag, activeToolSize, gears, board, obstacles]);

  // Animación continua de rotación
  useEffect(() => {
    if (!isPlaying || analysis.isJammed) return;
    let rafId = 0;
    let lastTs = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      setSimTimeSec((prev) => prev + dt);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, analysis.isJammed]);

  // Listeners globales de Arrastre y Soltar (Palette -> Tablero y Tablero -> Basurero)
  useEffect(() => {
    if (!activeDrag) return;

    const evaluatePointer = (clientX: number, clientY: number) => {
      const curBoard = boardRef.current;
      const curGears = gearsRef.current;
      const curObs = obstaclesRef.current;

      // 1. Verificar si está sobre la zona del Basurero (con margen generoso de +16 px)
      let overTrash = false;
      const trashEl = trashZoneRef.current;
      if (trashEl) {
        const tr = trashEl.getBoundingClientRect();
        if (
          clientX >= tr.left - 16 &&
          clientX <= tr.right + 16 &&
          clientY >= tr.top - 16 &&
          clientY <= tr.bottom + 16
        ) {
          overTrash = true;
        }
      }

      // 2. Verificar si está sobre el Tablero SVG y calcular snap exacto a la matriz
      let overBoard = false;
      let snappedPreview: ActiveDragState['snappedPreview'] = null;
      const svgEl = svgBoardRef.current;
      if (svgEl && !overTrash) {
        const br = svgEl.getBoundingClientRect();
        if (
          clientX >= br.left &&
          clientX <= br.right &&
          clientY >= br.top &&
          clientY <= br.bottom
        ) {
          overBoard = true;
          const mmX = ((clientX - br.left) / br.width) * curBoard.widthMm;
          const mmY = ((clientY - br.top) / br.height) * curBoard.heightMm;
          const otherGears =
            activeDrag.mode === 'existing' && activeDrag.gearId
              ? curGears.filter((g) => g.id !== activeDrag.gearId)
              : curGears;
          snappedPreview = snapGearToMatrix(
            mmX,
            mmY,
            activeDrag.sizeId,
            otherGears,
            curBoard,
            curObs
          );
        }
      }

      return { overTrash, overBoard, snappedPreview };
    };

    const handleMove = (e: PointerEvent) => {
      const { overTrash, overBoard, snappedPreview } = evaluatePointer(e.clientX, e.clientY);
      setActiveDrag((prev) =>
        prev
          ? {
              ...prev,
              clientX: e.clientX,
              clientY: e.clientY,
              overTrash,
              overBoard,
              snappedPreview,
            }
          : null
      );
    };

    const handleUp = (e: PointerEvent) => {
      const { overTrash, overBoard, snappedPreview } = evaluatePointer(e.clientX, e.clientY);

      if (activeDrag.mode === 'existing' && activeDrag.gearId) {
        if (overTrash) {
          // Eliminar engranaje arrastrado al basurero
          setGears((prev) =>
            prev.filter((g) => !(g.id === activeDrag.gearId && g.role === 'idler'))
          );
        } else if (overBoard && snappedPreview) {
          // Mover engranaje al nuevo hoyo si no está ocupado por otro eje
          setGears((prev) => {
            const occupied = prev.some(
              (g) =>
                g.id !== activeDrag.gearId &&
                g.col === snappedPreview.col &&
                g.row === snappedPreview.row
            );
            if (occupied) return prev;
            return prev.map((g) =>
              g.id === activeDrag.gearId
                ? {
                    ...g,
                    col: snappedPreview.col,
                    row: snappedPreview.row,
                    x: snappedPreview.x,
                    y: snappedPreview.y,
                  }
                : g
            );
          });
        }
      } else if (activeDrag.mode === 'palette') {
        if (!overTrash && overBoard && snappedPreview) {
          setGears((prev) => {
            const occupied = prev.some(
              (g) => g.col === snappedPreview.col && g.row === snappedPreview.row
            );
            if (occupied) return prev;
            return [
              ...prev,
              {
                id: `gear-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                sizeId: activeDrag.sizeId,
                col: snappedPreview.col,
                row: snappedPreview.row,
                x: snappedPreview.x,
                y: snappedPreview.y,
                role: 'idler',
              },
            ];
          });
        }
      }

      setActiveDrag(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [activeDrag]);

  // Reiniciar tablero al cambiar desafío, dimensiones o patrón de matriz
  const applyBoardAndChallenge = (
    nextChallengeId: GearChallengeId,
    nextW: number,
    nextH: number,
    nextPattern: MatrixPatternId
  ) => {
    const nextBoard = buildBoardSpec(nextW, nextH, nextPattern);
    setChallengeId(nextChallengeId);
    setBoardWidthCm(nextW);
    setBoardHeightCm(nextH);
    setMatrixPattern(nextPattern);
    setGears(createInitialGearsForChallenge(GEAR_CHALLENGES[nextChallengeId], nextBoard));
  };

  const handleResetBoard = () => {
    setGears(createInitialGearsForChallenge(challenge, board));
  };

  // Clic rápido en un hoyo verde (atajo complementario al arrastre)
  const handleQuickPlaceAtHole = (col: number, row: number) => {
    if (gears.some((g) => g.col === col && g.row === row)) return;
    const pos = gridToMm(board, col, row);
    setGears((prev) => [
      ...prev,
      {
        id: `gear-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sizeId: activeToolSize,
        col,
        row,
        x: pos.x,
        y: pos.y,
        role: 'idler',
      },
    ]);
  };

  // Iniciar arrastre desde el catálogo derecho
  const handleStartPaletteDrag = (e: React.PointerEvent, sizeId: GearSizeId) => {
    e.preventDefault();
    setActiveToolSize(sizeId);
    if (viewMode === 'svg') setViewMode('circles');
    setActiveDrag({
      mode: 'palette',
      sizeId,
      clientX: e.clientX,
      clientY: e.clientY,
      overBoard: false,
      overTrash: false,
      snappedPreview: null,
    });
  };

  // Iniciar arrastre de un engranaje ya ubicado en el tablero
  const handleStartExistingGearDrag = (e: React.PointerEvent, gear: PlacedGear) => {
    if (gear.role !== 'idler') return; // Inicio y Meta están fijos en las esquinas
    e.stopPropagation();
    e.preventDefault();
    setActiveToolSize(gear.sizeId);
    setActiveDrag({
      mode: 'existing',
      sizeId: gear.sizeId,
      gearId: gear.id,
      clientX: e.clientX,
      clientY: e.clientY,
      overBoard: true,
      overTrash: false,
      snappedPreview: {
        col: gear.col,
        row: gear.row,
        x: gear.x,
        y: gear.y,
        isExactTangent: true,
        tangentCount: 1,
      },
    });
  };

  // Vista previa SVG de corte láser
  const previewSvgContent = useMemo(() => {
    if (svgPreviewType === 'gears') {
      return generateGearsOnlyLaserSvg(gears, teamName);
    }
    if (svgPreviewType === 'board_matrix') {
      return generateMatrixPegboardLaserSvg(board, gears, 'full_matrix');
    }
    return generateMatrixPegboardLaserSvg(board, gears, 'project_only');
  }, [svgPreviewType, gears, teamName, board]);

  // Descargas
  const triggerDownload = (content: string, mime: string, filename: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const safeTeam = (teamName || 'equipo')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const handleDownloadGearsSvg = () => {
    const svg = generateGearsOnlyLaserSvg(gears, teamName);
    triggerDownload(
      svg,
      'image/svg+xml;charset=utf-8',
      `engranajes-mdf3mm-${safeTeam}-${gears.length}ruedas-4-6-8cm.svg`
    );
  };

  const handleDownloadBoardSvg = (mode: 'full_matrix' | 'project_only') => {
    const svg = generateMatrixPegboardLaserSvg(board, gears, mode);
    const suffix =
      mode === 'full_matrix'
        ? `matriz-${board.matrixPattern}-${boardWidthCm}x${boardHeightCm}cm`
        : `rapido-${boardWidthCm}x${boardHeightCm}cm`;
    triggerDownload(
      svg,
      'image/svg+xml;charset=utf-8',
      `tablero-engranajes-${suffix}-${safeTeam}.svg`
    );
  };

  const handleDownloadPinsStl = () => {
    const stl = generateGearPinsAndCrankStl(gears.length, teamName);
    triggerDownload(
      stl,
      'model/stl;charset=utf-8',
      `ejes-y-manivela-pla-${safeTeam}-${gears.length}ejes.stl`
    );
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal Taller 6 */}
      <div className="bg-gradient-to-r from-cyan-950 via-teal-900 to-emerald-950 rounded-2xl p-6 text-white shadow-xl border border-teal-700/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 border border-teal-300/30 text-teal-200 text-xs font-semibold tracking-wide uppercase">
              <Cog className="w-3.5 h-3.5" />
              Taller 6 · Simulador de Trenes de Engranajes (4, 6 y 8 cm · Diagonales 60°)
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Tablero Matricial de Engranajes & Diámetros Primitivos
            </h2>
            <p className="text-teal-100/90 text-sm max-w-3xl leading-relaxed">
              Arrastra los <strong>3 tamaños de círculos primitivos</strong> (
              <strong>4, 6 y 8 cm</strong>) hacia los hoyos iluminados (horizontales y{' '}
              <strong>diagonales exactas a 60°</strong>) para conectar el <strong>Inicio</strong> con
              la <strong>Meta</strong>. Si te equivocas, arrastra el círculo al{' '}
              <strong>basurero 🗑️</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadGearsSvg}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-lg transition cursor-pointer"
            >
              <Scissors className="w-4 h-4" />
              <span>Engranajes (.SVG)</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadBoardSvg('full_matrix')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-sky-400 hover:bg-sky-300 text-slate-950 shadow-lg transition cursor-pointer"
            >
              <Grid className="w-4 h-4" />
              <span>
                Tablero {boardWidthCm}×{boardHeightCm} (.SVG)
              </span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPinsStl}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg transition cursor-pointer"
            >
              <Box className="w-4 h-4" />
              <span>Ejes + Manivela (.STL)</span>
            </button>
          </div>
        </div>
      </div>

      {/* PANEL 1: CONFIGURACIÓN DEL ESPACIO DE TRABAJO (TABLERO) Y DESAFÍO */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-teal-600" />
            <h3 className="font-black text-slate-900 text-base">
              1. Configura el Tablero de Trabajo y Elige un Desafío
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Nombre del equipo..."
              maxLength={22}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 w-40"
            />
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() =>
                  applyBoardAndChallenge(challengeId, boardWidthCm, boardHeightCm, 'triangular')
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                  matrixPattern === 'triangular'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🔺 Matriz Diagonal (60°)
              </button>
              <button
                type="button"
                onClick={() =>
                  applyBoardAndChallenge(challengeId, boardWidthCm, boardHeightCm, 'square')
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                  matrixPattern === 'square'
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⬜ Matriz Cuadrada (90°)
              </button>
            </div>
          </div>
        </div>

        {/* Controles Configurables del Tamaño del Tablero (Ancho × Alto en cm) */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-4 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1 mr-1">
              <Sliders className="w-3.5 h-3.5 text-teal-600" />
              Espacio:
            </span>
            {BOARD_SIZE_PRESETS.map((pr) => {
              const active = boardWidthCm === pr.widthCm && boardHeightCm === pr.heightCm;
              return (
                <button
                  key={pr.label}
                  type="button"
                  onClick={() =>
                    applyBoardAndChallenge(challengeId, pr.widthCm, pr.heightCm, matrixPattern)
                  }
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                    active
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300'
                  }`}
                >
                  {pr.label}
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-4 flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-700 shrink-0">
              Ancho: <strong className="text-teal-700">{boardWidthCm} cm</strong>
            </span>
            <input
              type="range"
              min={22}
              max={44}
              step={2}
              value={boardWidthCm}
              onChange={(e) =>
                applyBoardAndChallenge(
                  challengeId,
                  Number(e.target.value),
                  boardHeightCm,
                  matrixPattern
                )
              }
              className="flex-1 accent-teal-600 cursor-pointer"
            />
          </div>

          <div className="lg:col-span-4 flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-700 shrink-0">
              Alto: <strong className="text-teal-700">{boardHeightCm} cm</strong>
            </span>
            <input
              type="range"
              min={20}
              max={44}
              step={2}
              value={boardHeightCm}
              onChange={(e) =>
                applyBoardAndChallenge(
                  challengeId,
                  boardWidthCm,
                  Number(e.target.value),
                  matrixPattern
                )
              }
              className="flex-1 accent-teal-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Selector de los 4 Desafíos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {(['libre', 'inversor', 'velocidad', 'obstaculo'] as GearChallengeId[]).map((cid) => {
            const ch = GEAR_CHALLENGES[cid];
            const active = challengeId === cid;
            return (
              <button
                key={cid}
                type="button"
                onClick={() =>
                  applyBoardAndChallenge(cid, boardWidthCm, boardHeightCm, matrixPattern)
                }
                className={`p-3 rounded-xl border-2 text-left transition cursor-pointer space-y-1 ${
                  active
                    ? 'bg-teal-50/90 border-teal-600 shadow-2xs'
                    : 'bg-slate-50/70 border-slate-200 hover:border-teal-300'
                }`}
              >
                <span
                  className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    active ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {ch.levelBadge}
                </span>
                <div className="text-xs font-black text-slate-900 leading-snug">{ch.title}</div>
                <p className="text-[10px] text-slate-600 leading-snug line-clamp-2">
                  {ch.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Barra de Estado Cinemático en Vivo */}
        <div
          className={`rounded-xl p-3.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            analysis.statusType === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : analysis.statusType === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : analysis.statusType === 'warning'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-sky-50 border-sky-200 text-sky-950'
          }`}
        >
          <div className="flex items-start gap-2.5 text-xs">
            {analysis.statusType === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : analysis.statusType === 'error' || analysis.statusType === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <Compass className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <div className="font-extrabold">{analysis.statusMessage}</div>
              <div className="text-[11px] opacity-85">
                🎯 <strong>Objetivo:</strong> {challenge.learningGoal}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-xs font-mono bg-white/85 px-3 py-1.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 block font-sans font-bold">Inicio</span>
              <strong className="text-slate-900">
                {challenge.startRpm} RPM {challenge.startDirection === 1 ? '↻' : '↺'}
              </strong>
            </div>
            <span className="text-slate-300">→</span>
            <div>
              <span className="text-[10px] text-slate-500 block font-sans font-bold">Meta</span>
              <strong className={analysis.endReached ? 'text-emerald-700' : 'text-slate-400'}>
                {analysis.endReached
                  ? `${analysis.endRpm} RPM ${analysis.endDirection === 1 ? '↻' : '↺'}`
                  : 'Detenida'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ÁREA INTERACTIVA PRINCIPAL: TABLERO (IZQ 8 COLS) + CÍRCULOS ARRASTRABLES Y BASURERO (DER 4 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* IZQUIERDA (8 COLS): TABLERO MATRICIAL INTERACTIVO */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setViewMode('circles')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'circles'
                      ? 'bg-teal-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  1. Círculos Primitivos
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('gears')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'gears'
                      ? 'bg-amber-400 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Cog className="w-3.5 h-3.5" />
                  2. Engranajes Girando
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('svg')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'svg'
                      ? 'bg-rose-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  3. Patrón Láser (.SVG)
                </button>
              </div>

              {viewMode !== 'svg' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowValidHoles((v) => !v)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                      showValidHoles
                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {showValidHoles ? '🟢 Guías Tangentes' : 'Guías OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPlaying((p) => !p)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {isPlaying ? 'Pausa' : 'Girar'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetBoard}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/80 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Limpiar
                  </button>
                </div>
              )}
            </div>

            <div className="p-4">
              {viewMode !== 'svg' ? (
                <div className="flex flex-col items-center gap-3">
                  <svg
                    ref={svgBoardRef}
                    viewBox={`0 0 ${board.widthMm} ${board.heightMm}`}
                    className="w-full max-h-[520px] rounded-xl bg-[#f3e3c8] border-4 border-amber-900/60 shadow-inner select-none touch-none"
                    style={{
                      aspectRatio: `${board.widthMm} / ${board.heightMm}`,
                    }}
                  >
                    <rect
                      x="1"
                      y="1"
                      width={board.widthMm - 2}
                      height={board.heightMm - 2}
                      rx="6"
                      fill="#f2dfbf"
                      stroke="#b45309"
                      strokeWidth="1.2"
                    />

                    {/* Coordenadas de borde */}
                    {Array.from({ length: board.cols }).map((_, c) =>
                      c === 0 || (c + 1) % 5 === 0 || c === board.cols - 1 ? (
                        <text
                          key={`col-${c}`}
                          x={board.marginMm + c * board.gridPitchMm}
                          y={board.marginMm - 6}
                          textAnchor="middle"
                          fontSize="5.2"
                          fontWeight="bold"
                          fill="#92400e"
                        >
                          {c + 1}
                        </text>
                      ) : null
                    )}
                    {Array.from({ length: board.rows }).map((_, r) =>
                      r === 0 || (r + 1) % 5 === 0 || r === board.rows - 1 ? (
                        <text
                          key={`row-${r}`}
                          x={board.marginMm - 8}
                          y={gridToMm(board, 0, r).y + 1.8}
                          textAnchor="middle"
                          fontSize="5.2"
                          fontWeight="bold"
                          fill="#92400e"
                        >
                          {r + 1}
                        </text>
                      ) : null
                    )}

                    {/* Matriz de perforaciones físicas Ø 5.0 mm */}
                    <g>
                      {matrixHoles.map((h) => (
                        <circle
                          key={`${h.col}-${h.row}`}
                          cx={h.x}
                          cy={h.y}
                          r="1.3"
                          fill="#a88b67"
                          opacity="0.62"
                        />
                      ))}
                    </g>

                    {/* Obstáculos */}
                    {obstacles.map((obs) => (
                      <g key={obs.id}>
                        <rect
                          x={obs.x}
                          y={obs.y}
                          width={obs.width}
                          height={obs.height}
                          rx="4"
                          fill="rgba(225, 29, 72, 0.18)"
                          stroke="#e11d48"
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                        />
                        <text
                          x={obs.x + obs.width / 2}
                          y={obs.y + obs.height / 2 + 2}
                          textAnchor="middle"
                          fontSize="5.5"
                          fontWeight="900"
                          fill="#be123c"
                        >
                          {obs.label}
                        </text>
                      </g>
                    ))}

                    {/* Hoyos Tangentes Exactos (horizontales y diagonales 60°) */}
                    {showValidHoles &&
                      validTangentHoles.map((vh) => {
                        const isDual = vh.tangentCount >= 2;
                        return (
                          <g
                            key={`vh-${vh.col}-${vh.row}`}
                            onClick={() => handleQuickPlaceAtHole(vh.col, vh.row)}
                            className="cursor-pointer"
                          >
                            <circle
                              cx={vh.x}
                              cy={vh.y}
                              r={isDual ? 4.4 : 3.4}
                              fill={
                                isDual
                                  ? 'rgba(250, 204, 21, 0.48)'
                                  : 'rgba(16, 185, 129, 0.36)'
                              }
                              stroke={isDual ? '#ca8a04' : '#059669'}
                              strokeWidth="1.1"
                            />
                            <circle
                              cx={vh.x}
                              cy={vh.y}
                              r="1.4"
                              fill={isDual ? '#eab308' : '#10b981'}
                            />
                          </g>
                        );
                      })}

                    {/* Líneas y puntos de tangencia activa */}
                    {analysis.meshingEdges.map(([idA, idB]) => {
                      const a = gears.find((g) => g.id === idA);
                      const b = gears.find((g) => g.id === idB);
                      if (!a || !b) return null;
                      const ra = GEAR_CATALOG[a.sizeId].pitchRadiusMm;
                      const rb = GEAR_CATALOG[b.sizeId].pitchRadiusMm;
                      const t = ra / (ra + rb);
                      const tx = a.x + (b.x - a.x) * t;
                      const ty = a.y + (b.y - a.y) * t;
                      return (
                        <g key={`edge-${idA}-${idB}`} pointerEvents="none">
                          <line
                            x1={a.x}
                            y1={a.y}
                            x2={b.x}
                            y2={b.y}
                            stroke="rgba(15, 23, 42, 0.22)"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                          <circle
                            cx={tx}
                            cy={ty}
                            r="2.2"
                            fill="#10b981"
                            stroke="#ffffff"
                            strokeWidth="0.7"
                          />
                        </g>
                      );
                    })}

                    {/* Engranajes / Círculos Primitivos colocados */}
                    {gears.map((g) => {
                      const spec = GEAR_CATALOG[g.sizeId];
                      const node = analysis.nodes[g.id];
                      const isBeingDragged =
                        activeDrag?.mode === 'existing' && activeDrag.gearId === g.id;
                      const isColliding =
                        analysis.collisionPairs.some(([a, b]) => a === g.id || b === g.id) ||
                        analysis.obstacleCollisions.includes(g.id);

                      const angleDeg =
                        ((node?.phaseOffsetRad ?? 0) * 180) / Math.PI +
                        (node?.rpm ?? 0) * 6 * simTimeSec;

                      return (
                        <g
                          key={g.id}
                          transform={`translate(${g.x}, ${g.y})`}
                          opacity={isBeingDragged ? 0.25 : 1}
                          onPointerDown={(e) => handleStartExistingGearDrag(e, g)}
                          className={
                            g.role === 'idler'
                              ? 'cursor-grab active:cursor-grabbing'
                              : 'cursor-default'
                          }
                        >
                          {viewMode === 'gears' ? (
                            <g transform={`rotate(${angleDeg.toFixed(2)})`}>
                              <path
                                d={toothPathsBySize[g.sizeId]}
                                fill={isColliding ? 'rgba(225, 29, 72, 0.35)' : `${spec.color}cc`}
                                stroke={isColliding ? '#be123c' : '#451a03'}
                                strokeWidth="0.9"
                              />
                              <circle
                                cx="0"
                                cy="0"
                                r={spec.pitchRadiusMm}
                                fill="none"
                                stroke="rgba(255,255,255,0.65)"
                                strokeWidth="0.6"
                                strokeDasharray="2.5 2"
                                pointerEvents="none"
                              />
                              <line
                                x1="0"
                                y1="0"
                                x2={spec.pitchRadiusMm * 0.72}
                                y2="0"
                                stroke="#ffffff"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                pointerEvents="none"
                              />
                              {g.role === 'start' && (
                                <circle
                                  cx={spec.pitchRadiusMm * 0.56}
                                  cy="0"
                                  r="2.4"
                                  fill="#0f172a"
                                  stroke="#ffffff"
                                  strokeWidth="0.8"
                                  pointerEvents="none"
                                />
                              )}
                            </g>
                          ) : (
                            <g>
                              <circle
                                cx="0"
                                cy="0"
                                r={spec.pitchRadiusMm}
                                fill={isColliding ? 'rgba(225, 29, 72, 0.25)' : `${spec.color}32`}
                                stroke={isColliding ? '#e11d48' : spec.color}
                                strokeWidth="1.8"
                              />
                              <g transform={`rotate(${angleDeg.toFixed(2)})`} pointerEvents="none">
                                <line
                                  x1="0"
                                  y1="0"
                                  x2={spec.pitchRadiusMm - 2.2}
                                  y2="0"
                                  stroke={spec.color}
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                                <circle
                                  cx={spec.pitchRadiusMm - 3.6}
                                  cy="0"
                                  r="2"
                                  fill={spec.color}
                                />
                              </g>
                            </g>
                          )}

                          {/* Orificio central Ø 5.2 mm */}
                          <circle
                            cx="0"
                            cy="0"
                            r={GEAR_BORE_DIAMETER_MM / 2}
                            fill="#ffffff"
                            stroke="#0f172a"
                            strokeWidth="1"
                            pointerEvents="none"
                          />

                          {g.role !== 'idler' ? (
                            <g
                              transform={`translate(0, ${-spec.pitchRadiusMm - 5.5})`}
                              pointerEvents="none"
                            >
                              <rect
                                x="-18"
                                y="-5.5"
                                width="36"
                                height="10.5"
                                rx="3"
                                fill={g.role === 'start' ? '#0284c7' : '#059669'}
                              />
                              <text
                                x="0"
                                y="1.6"
                                textAnchor="middle"
                                fontSize="5.4"
                                fontWeight="900"
                                fill="#ffffff"
                              >
                                {g.role === 'start' ? 'INICIO' : 'META'}
                              </text>
                            </g>
                          ) : (
                            <text
                              x="0"
                              y={10.5}
                              textAnchor="middle"
                              fontSize="5.2"
                              fontWeight="900"
                              fill="#0f172a"
                              pointerEvents="none"
                            >
                              {spec.pitchDiameterMm / 10} cm
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* Vista previa magnética del círculo mientras se arrastra sobre el tablero */}
                    {activeDrag && activeDrag.overBoard && activeDrag.snappedPreview && (
                      <g
                        transform={`translate(${activeDrag.snappedPreview.x}, ${activeDrag.snappedPreview.y})`}
                        pointerEvents="none"
                      >
                        <circle
                          cx="0"
                          cy="0"
                          r={GEAR_CATALOG[activeDrag.sizeId].pitchRadiusMm}
                          fill={
                            activeDrag.snappedPreview.isExactTangent
                              ? 'rgba(16, 185, 129, 0.28)'
                              : 'rgba(245, 158, 11, 0.22)'
                          }
                          stroke={
                            activeDrag.snappedPreview.isExactTangent ? '#059669' : '#d97706'
                          }
                          strokeWidth="2.2"
                          strokeDasharray="4 2"
                        />
                        <circle
                          cx="0"
                          cy="0"
                          r={GEAR_BORE_DIAMETER_MM / 2}
                          fill="#ffffff"
                          stroke="#059669"
                          strokeWidth="1.2"
                        />
                      </g>
                    )}
                  </svg>

                  <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-300">
                    <span>
                      ✋ <strong>Arrastra</strong> círculos desde la derecha o muévelos en el tablero
                    </span>
                    <span>
                      🟢 <strong>Hoyos Verdes:</strong> Diagonales (60°) y horizontales exactos
                    </span>
                    <span>
                      🗑️ <strong>Eliminar:</strong> Arrastra una rueda al basurero
                    </span>
                  </div>
                </div>
              ) : (
                /* VISTA PATRÓN DE CORTE LÁSER (.SVG) */
                <div className="bg-white rounded-xl p-4 space-y-3 min-h-[420px] flex flex-col justify-between">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSvgPreviewType('gears')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                        svgPreviewType === 'gears'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      1. Solo Engranajes ({gears.length}x · Rápido)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSvgPreviewType('board_matrix')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                        svgPreviewType === 'board_matrix'
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      2. Tablero Matricial ({boardWidthCm}×{boardHeightCm} cm)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSvgPreviewType('board_fast')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                        svgPreviewType === 'board_fast'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      3. Tablero Solo Hoyos del Tren
                    </button>
                  </div>

                  <div
                    className="w-full rounded-xl bg-amber-50/80 border border-amber-200 p-3 overflow-auto flex justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[380px]"
                    dangerouslySetInnerHTML={{
                      __html: previewSvgContent.replace(
                        /stroke-width="0\.1"/g,
                        'stroke-width="0.6"'
                      ),
                    }}
                  />

                  <p className="text-[11px] text-slate-600 text-center font-medium">
                    Listo para <strong>Falcon Design Space</strong>: Corte MDF 3 mm en{' '}
                    <strong className="text-red-600">#FF0000 (0.1 mm)</strong> · Etiquetas de
                    coordenadas y logo MakerBox en <strong className="text-blue-600">#0000FF</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Telemetría de Fabricación */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-rose-600 block">
                  Corte Engranajes
                </span>
                <span className="text-base font-black text-slate-900">
                  ~{analysis.estimatedGearsLaserTimeFormatted}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {gears.length} ruedas · MDF 3 mm
                </span>
              </div>
              <Flame className="w-6 h-6 text-rose-500 shrink-0" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-sky-600 block">
                  Tablero Reutilizable
                </span>
                <span className="text-sm font-black text-slate-900">
                  {boardWidthCm} × {boardHeightCm} cm
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {analysis.estimatedBoardLaserTimeFormatted}
                </span>
              </div>
              <Grid className="w-6 h-6 text-sky-500 shrink-0" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-indigo-600 block">
                  Kit Ejes + Manivela
                </span>
                <span className="text-base font-black text-slate-900">
                  ~{analysis.estimatedPlaPrintMin} min · {analysis.estimatedPlaGrams} g
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {gears.length} ejes Ø4.8 mm + 1 manivela
                </span>
              </div>
              <Clock className="w-6 h-6 text-indigo-500 shrink-0" />
            </div>
          </div>
        </div>

        {/* DERECHA (4 COLS): 3 CÍRCULOS ARRASTRABLES + ZONA BASURERO + DESCARGAS */}
        <div className="lg:col-span-4 space-y-4">
          {/* Paleta Arrastrable de los 3 Círculos (4, 6 y 8 cm) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Hand className="w-4 h-4 text-teal-600" />
                <h3 className="font-black text-slate-900 text-sm">
                  2. Arrastra Círculos al Tablero
                </h3>
              </div>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                4 · 6 · 8 cm
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-snug">
              Toma cualquiera de estos <strong>3 diámetros primitivos</strong> y arrástralo directo
              al tablero (se imantará a los hoyos verdes en diagonal u horizontal).
            </p>

            <div className="space-y-2.5">
              {GEAR_CATALOG_LIST.map((item) => {
                const active = activeToolSize === item.id;
                return (
                  <div
                    key={item.id}
                    onPointerDown={(e) => handleStartPaletteDrag(e, item.id)}
                    onClick={() => setActiveToolSize(item.id)}
                    className={`p-3 rounded-2xl border-2 transition cursor-grab active:cursor-grabbing flex items-center justify-between gap-3 select-none touch-none ${
                      active
                        ? 'bg-slate-900 text-white border-teal-500 shadow-md'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-teal-400 hover:bg-teal-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <svg viewBox="-46 -46 92 92" className="w-14 h-14 shrink-0">
                        <circle
                          cx="0"
                          cy="0"
                          r={item.pitchRadiusMm}
                          fill={`${item.color}38`}
                          stroke={item.color}
                          strokeWidth="3.5"
                        />
                        <circle cx="0" cy="0" r="3.5" fill={active ? '#ffffff' : '#0f172a'} />
                      </svg>
                      <div>
                        <div className="text-sm font-black leading-tight">{item.name}</div>
                        <div
                          className={`text-xs font-extrabold mt-0.5 ${
                            active ? 'text-teal-300' : 'text-teal-700'
                          }`}
                        >
                          Ø {item.pitchDiameterMm / 10} cm · {item.teeth} dientes
                        </div>
                        <div
                          className={`text-[10px] font-mono ${
                            active ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          Radio = {item.gridRadiusUnits} espacios ({item.pitchRadiusMm} mm)
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-xl shrink-0 ${
                        active
                          ? 'bg-teal-500/20 text-teal-200 border border-teal-400/30'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      ✋ Arrastrar
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ZONA BASURERO PARA ELIMINAR POR ARRASTRE */}
            <div
              ref={trashZoneRef}
              className={`rounded-2xl border-2 border-dashed p-4 text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                activeDrag?.overTrash
                  ? 'bg-rose-600 border-rose-700 text-white scale-[1.03] shadow-lg'
                  : activeDrag?.mode === 'existing'
                    ? 'bg-rose-50 border-rose-400 text-rose-800 animate-pulse'
                    : 'bg-slate-50 border-slate-300 text-slate-500'
              }`}
            >
              <Trash2
                className={`w-6 h-6 transition-transform ${
                  activeDrag?.overTrash ? 'scale-125 text-white' : ''
                }`}
              />
              <div className="text-xs font-black">
                {activeDrag?.overTrash
                  ? '¡Suelta aquí para eliminar!'
                  : activeDrag?.mode === 'existing'
                    ? 'Arrastra aquí para botar el engranaje'
                    : 'Basurero (Arrastra aquí cualquier círculo para borrarlo)'}
              </div>
            </div>
          </div>

          {/* Panel de Descargas para Fabricación */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                3. Descargar Patrones ({gears.length} ruedas)
              </h4>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                Relación {analysis.transmissionRatio}×
              </span>
            </div>

            <button
              type="button"
              onClick={handleDownloadGearsSvg}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              1. Descargar Engranajes MDF 3 mm (.SVG)
            </button>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleDownloadBoardSvg('full_matrix')}
                className="py-2 px-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Grid className="w-3.5 h-3.5" />
                Tablero Matriz (.SVG)
              </button>
              <button
                type="button"
                onClick={() => handleDownloadBoardSvg('project_only')}
                className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5" />
                Solo Hoyos (.SVG)
              </button>
            </div>
            <button
              type="button"
              onClick={handleDownloadPinsStl}
              className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Box className="w-4 h-4" />
              3. Descargar {gears.length} Ejes + Manivela PLA (.STL)
            </button>
          </div>

          {/* Nota Matemática */}
          <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-3.5 text-[11px] text-emerald-950 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>¿Por qué 4, 6 y 8 cm en Matriz Triangular 60°?</strong> Sus radios exactos (2,
              3 y 4 espacios de 10 mm) permiten que <strong>todos los pares</strong> engranen tanto
              en horizontal como en <strong>diagonales a 60°</strong> (a diferencia de 5 cm, cuyo
              radio de 2.5 cm quedaría fuera de la retícula de 10 mm).
            </div>
          </div>
        </div>
      </div>

      {/* CÍRCULO FLOTANTE DURANTE EL ARRASTRE (Fuera del tablero o rumbo al basurero) */}
      {activeDrag && (!activeDrag.overBoard || activeDrag.overTrash) && (
        <div
          className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 transition-transform"
          style={{ left: activeDrag.clientX, top: activeDrag.clientY }}
        >
          <div
            className={`rounded-full flex flex-col items-center justify-center font-black shadow-2xl border-4 ${
              activeDrag.overTrash
                ? 'bg-rose-500/80 border-rose-700 text-white scale-75'
                : 'bg-white/90 text-slate-900'
            }`}
            style={{
              width: GEAR_CATALOG[activeDrag.sizeId].pitchDiameterMm * 1.45,
              height: GEAR_CATALOG[activeDrag.sizeId].pitchDiameterMm * 1.45,
              borderColor: activeDrag.overTrash
                ? '#be123c'
                : GEAR_CATALOG[activeDrag.sizeId].color,
            }}
          >
            <span className="text-xs">
              {activeDrag.overTrash
                ? '🗑️'
                : `${GEAR_CATALOG[activeDrag.sizeId].pitchDiameterMm / 10} cm`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default GearsSection;
