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
  Info,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Scissors,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  BOARD_HOLE_DIAMETER_MM,
  GEAR_BOARD_PRESETS,
  GEAR_BORE_DIAMETER_MM,
  GEAR_CATALOG,
  GEAR_CATALOG_LIST,
  GEAR_CHALLENGES,
  GEAR_MODULE_MM,
  GearBoardPresetId,
  GearChallengeId,
  GearSizeId,
  PlacedGear,
} from '@/types/gears';
import {
  analyzeGearTrain,
  buildGearToothPolygon,
  createInitialGearsForChallenge,
  findValidTangentHoles,
  gearPolygonToSvgPath,
  generateGearPinsAndCrankStl,
  generateGearsOnlyLaserSvg,
  generateMatrixPegboardLaserSvg,
  getChallengeObstacles,
  gridToMm,
  snapGearToMatrix,
} from '@/lib/gears-processor';

export function GearsSection() {
  const [boardPresetId, setBoardPresetId] = useState<GearBoardPresetId>('30x30');
  const [challengeId, setChallengeId] = useState<GearChallengeId>('libre');
  const [teamName, setTeamName] = useState<string>('Equipo Engranajes');

  const board = GEAR_BOARD_PRESETS[boardPresetId];
  const challenge = GEAR_CHALLENGES[challengeId];

  const [gears, setGears] = useState<PlacedGear[]>(() =>
    createInitialGearsForChallenge(GEAR_CHALLENGES.libre, GEAR_BOARD_PRESETS['30x30'])
  );
  const [activeToolSize, setActiveToolSize] = useState<GearSizeId>('m');
  const [selectedGearId, setSelectedGearId] = useState<string | null>(null);
  const [draggingGearId, setDraggingGearId] = useState<string | null>(null);

  // Modos de visualización y simulación
  const [viewMode, setViewMode] = useState<'circles' | 'gears' | 'svg'>('circles');
  const [svgPreviewType, setSvgPreviewType] = useState<'gears' | 'board_matrix' | 'board_fast'>(
    'gears'
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showValidHoles, setShowValidHoles] = useState<boolean>(true);
  const [simTimeSec, setSimTimeSec] = useState<number>(0);

  const svgBoardRef = useRef<SVGSVGElement | null>(null);

  // Pre-calcular los caminos SVG dentados para los 4 tamaños (rápido para animación 60fps)
  const toothPathsBySize = useMemo(() => {
    const map: Record<GearSizeId, string> = {
      s: gearPolygonToSvgPath(buildGearToothPolygon(GEAR_CATALOG.s.teeth, GEAR_MODULE_MM)),
      m: gearPolygonToSvgPath(buildGearToothPolygon(GEAR_CATALOG.m.teeth, GEAR_MODULE_MM)),
      l: gearPolygonToSvgPath(buildGearToothPolygon(GEAR_CATALOG.l.teeth, GEAR_MODULE_MM)),
      xl: gearPolygonToSvgPath(buildGearToothPolygon(GEAR_CATALOG.xl.teeth, GEAR_MODULE_MM)),
    };
    return map;
  }, []);

  const obstacles = useMemo(
    () => getChallengeObstacles(challenge, board),
    [challenge, board]
  );

  // Análisis cinemático en vivo
  const analysis = useMemo(
    () => analyzeGearTrain(gears, challenge, board),
    [gears, challenge, board]
  );

  // Hoyos tangentes válidos para el tamaño de círculo seleccionado (o el engranaje en arrastre)
  const validTangentHoles = useMemo(() => {
    const sizeToShow = draggingGearId
      ? gears.find((g) => g.id === draggingGearId)?.sizeId ?? activeToolSize
      : activeToolSize;
    const referenceGears = draggingGearId
      ? gears.filter((g) => g.id !== draggingGearId)
      : gears;
    return findValidTangentHoles(sizeToShow, referenceGears, board, obstacles);
  }, [activeToolSize, draggingGearId, gears, board, obstacles]);

  // Bucle de animación suave (requestAnimationFrame)
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

  // Cambiar de desafío o tamaño de tablero
  const handleSelectChallenge = (newId: GearChallengeId) => {
    setChallengeId(newId);
    setGears(createInitialGearsForChallenge(GEAR_CHALLENGES[newId], board));
    setSelectedGearId(null);
  };

  const handleSelectBoardPreset = (newBoardId: GearBoardPresetId) => {
    const nextBoard = GEAR_BOARD_PRESETS[newBoardId];
    setBoardPresetId(newBoardId);
    setGears(createInitialGearsForChallenge(challenge, nextBoard));
    setSelectedGearId(null);
  };

  const handleResetBoard = () => {
    setGears(createInitialGearsForChallenge(challenge, board));
    setSelectedGearId(null);
  };

  // Convertir coordenadas de puntero del navegador a mm del tablero SVG
  const pointerToBoardMm = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const svgEl = svgBoardRef.current;
    if (!svgEl) return null;
    const rect = svgEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const x = ((clientX - rect.left) / rect.width) * board.widthMm;
    const y = ((clientY - rect.top) / rect.height) * board.heightMm;
    return { x, y };
  };

  // Colocar un círculo primitivo directamente en un hoyo de la matriz
  const handlePlaceAtHole = (col: number, row: number, sizeId = activeToolSize) => {
    // Evitar duplicar exactamente sobre el mismo hoyo
    if (gears.some((g) => g.col === col && g.row === row)) return;
    const pos = gridToMm(board, col, row);
    const newId = `gear-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setGears((prev) => [
      ...prev,
      {
        id: newId,
        sizeId,
        col,
        row,
        x: pos.x,
        y: pos.y,
        role: 'idler',
      },
    ]);
    setSelectedGearId(newId);
  };

  const handleBoardBackgroundClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingGearId) return;
    const target = e.target as SVGElement;
    if (target.dataset.role === 'gear-hit') return;
    const pt = pointerToBoardMm(e.clientX, e.clientY);
    if (!pt) return;
    const snapped = snapGearToMatrix(pt.x, pt.y, activeToolSize, gears, board, obstacles);
    handlePlaceAtHole(snapped.col, snapped.row, activeToolSize);
  };

  const handleGearPointerDown = (e: React.PointerEvent, gear: PlacedGear) => {
    e.stopPropagation();
    setSelectedGearId(gear.id);
    if (gear.role !== 'idler') return; // Inicio y Meta están anclados en las esquinas
    setDraggingGearId(gear.id);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const handleBoardPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingGearId) return;
    const pt = pointerToBoardMm(e.clientX, e.clientY);
    if (!pt) return;
    const moving = gears.find((g) => g.id === draggingGearId);
    if (!moving) return;
    const others = gears.filter((g) => g.id !== draggingGearId);
    const snapped = snapGearToMatrix(pt.x, pt.y, moving.sizeId, others, board, obstacles);
    if (snapped.col !== moving.col || snapped.row !== moving.row) {
      setGears((prev) =>
        prev.map((g) =>
          g.id === draggingGearId
            ? { ...g, col: snapped.col, row: snapped.row, x: snapped.x, y: snapped.y }
            : g
        )
      );
    }
  };

  const handleBoardPointerUp = () => {
    if (draggingGearId) setDraggingGearId(null);
  };

  const handleDeleteSelected = () => {
    if (!selectedGearId) return;
    setGears((prev) =>
      prev.filter((g) => !(g.id === selectedGearId && g.role === 'idler'))
    );
    setSelectedGearId(null);
  };

  const handleChangeSelectedSize = (newSize: GearSizeId) => {
    if (!selectedGearId) return;
    setGears((prev) =>
      prev.map((g) =>
        g.id === selectedGearId && g.role === 'idler' ? { ...g, sizeId: newSize } : g
      )
    );
  };

  const selectedGear = gears.find((g) => g.id === selectedGearId) ?? null;

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
      `engranajes-mdf3mm-${safeTeam}-${gears.length}ruedas-m2.svg`
    );
  };

  const handleDownloadBoardSvg = (mode: 'full_matrix' | 'project_only') => {
    const svg = generateMatrixPegboardLaserSvg(board, gears, mode);
    const suffix = mode === 'full_matrix' ? `matriz-${board.id}` : `rapido-${board.id}`;
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

  // Puntos de la matriz de perforaciones (para renderizar en el tablero virtual)
  const matrixHoles = useMemo(() => {
    const pts: { col: number; row: number; x: number; y: number }[] = [];
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        pts.push({ col: c, row: r, ...gridToMm(board, c, r) });
      }
    }
    return pts;
  }, [board]);

  return (
    <div className="space-y-6">
      {/* Encabezado Principal Taller 6 */}
      <div className="bg-gradient-to-r from-cyan-950 via-teal-900 to-emerald-950 rounded-2xl p-6 text-white shadow-xl border border-teal-700/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 border border-teal-300/30 text-teal-200 text-xs font-semibold tracking-wide uppercase">
              <Cog className="w-3.5 h-3.5" />
              Taller 6 · Simulador de Trenes de Engranajes (MDF 3 mm + Ejes 3D PLA)
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Tablero Matricial de Engranajes & Diámetros Primitivos
            </h2>
            <p className="text-teal-100/90 text-sm max-w-3xl leading-relaxed">
              Conecta la esquina inferior izquierda (<strong>Inicio</strong>) con la esquina
              superior derecha (<strong>Meta</strong>) usando <strong>4 tamaños de círculos primitivos</strong>{' '}
              (<strong>2, 4, 6 y 8 cm</strong>) sobre una matriz física de paso <strong>10 mm</strong>.
              Luego corta tus engranajes con orificio central en <strong>MDF 3 mm (.SVG)</strong> y
              móntalos con <strong>ejes impresos en 3D (.STL)</strong> sobre el tablero perforado.
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
              <span>Tablero {board.id} (.SVG)</span>
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

      {/* BARRA DE SELECCIÓN DE DESAFÍO Y TABLERO FÍSICO */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-teal-600" />
            <h3 className="font-black text-slate-900 text-base">
              1. Elige el Desafío Mecánico y el Tamaño del Tablero Real
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Nombre del equipo..."
              maxLength={22}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 w-44"
            />
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {(['30x30', '40x40'] as GearBoardPresetId[]).map((bid) => (
                <button
                  key={bid}
                  type="button"
                  onClick={() => handleSelectBoardPreset(bid)}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    boardPresetId === bid
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tablero {bid} cm
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {(['libre', 'inversor', 'velocidad', 'obstaculo'] as GearChallengeId[]).map((cid) => {
            const ch = GEAR_CHALLENGES[cid];
            const active = challengeId === cid;
            return (
              <button
                key={cid}
                type="button"
                onClick={() => handleSelectChallenge(cid)}
                className={`p-3 rounded-xl border-2 text-left transition cursor-pointer space-y-1 ${
                  active
                    ? 'bg-teal-50/90 border-teal-600 shadow-2xs'
                    : 'bg-slate-50/70 border-slate-200 hover:border-teal-300'
                }`}
              >
                <span
                  className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    active
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-200 text-slate-700'
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

        {/* Estado en vivo del Desafío */}
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
                🎯 <strong>Objetivo Pedagógico:</strong> {challenge.learningGoal}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-xs font-mono bg-white/80 px-3 py-1.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 block font-sans font-bold">Inicio</span>
              <strong className="text-slate-900">
                {challenge.startRpm} RPM {challenge.startDirection === 1 ? '↻' : '↺'}
              </strong>
            </div>
            <span className="text-slate-300">→</span>
            <div>
              <span className="text-[10px] text-slate-500 block font-sans font-bold">Meta</span>
              <strong
                className={
                  analysis.endReached ? 'text-emerald-700' : 'text-slate-400'
                }
              >
                {analysis.endReached
                  ? `${analysis.endRpm} RPM ${analysis.endDirection === 1 ? '↻' : '↺'}`
                  : 'Detenida'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ÁREA DE TRABAJO PRINCIPAL: TABLERO VIRTUAL (IZQUIERDA 8 COLS) + PALETA DE CÍRCULOS PRIMITIVOS (DERECHA 4 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* IZQUIERDA (8 COLS): TABLERO MATRICIAL INTERACTIVO + PLANO SVG */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            {/* Barra de herramientas del tablero */}
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

              <div className="flex items-center gap-2">
                {viewMode !== 'svg' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowValidHoles((v) => !v)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                        showValidHoles
                          ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {showValidHoles ? '🟢 Hoyos Tangentes: ON' : 'Hoyos Tangentes: OFF'}
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
                      title="Limpiar engranajes intermedios"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/80 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Limpiar
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Contenido del Tablero Virtual o Vista SVG */}
            <div className="p-4">
              {viewMode !== 'svg' ? (
                <div className="flex flex-col items-center gap-3">
                  <svg
                    ref={svgBoardRef}
                    viewBox={`0 0 ${board.widthMm} ${board.heightMm}`}
                    onClick={handleBoardBackgroundClick}
                    onPointerMove={handleBoardPointerMove}
                    onPointerUp={handleBoardPointerUp}
                    onPointerCancel={handleBoardPointerUp}
                    className="w-full max-w-[540px] aspect-square rounded-xl bg-[#f3e3c8] border-4 border-amber-900/60 shadow-inner select-none touch-none cursor-crosshair"
                  >
                    {/* Marco exterior y textura sutil de MDF */}
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

                    {/* Coordenadas de la matriz en los bordes (cada 5 columnas/filas) */}
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
                          y={board.marginMm + r * board.gridPitchMm + 1.8}
                          textAnchor="middle"
                          fontSize="5.2"
                          fontWeight="bold"
                          fill="#92400e"
                        >
                          {r + 1}
                        </text>
                      ) : null
                    )}

                    {/* Matriz de perforaciones físicas Ø 5.0 mm (paso 10 mm) */}
                    <g>
                      {matrixHoles.map((h) => (
                        <circle
                          key={`${h.col}-${h.row}`}
                          cx={h.x}
                          cy={h.y}
                          r="1.35"
                          fill="#a88b67"
                          opacity="0.65"
                        />
                      ))}
                    </g>

                    {/* Obstáculos del desafío */}
                    {obstacles.map((obs) => {
                      const rx = board.marginMm + obs.colStart * board.gridPitchMm;
                      const ry = board.marginMm + obs.rowStart * board.gridPitchMm;
                      const rw = obs.colSpan * board.gridPitchMm;
                      const rh = obs.rowSpan * board.gridPitchMm;
                      return (
                        <g key={obs.id}>
                          <rect
                            x={rx}
                            y={ry}
                            width={rw}
                            height={rh}
                            rx="4"
                            fill="rgba(225, 29, 72, 0.18)"
                            stroke="#e11d48"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                          />
                          <text
                            x={rx + rw / 2}
                            y={ry + rh / 2 + 2}
                            textAnchor="middle"
                            fontSize="5.5"
                            fontWeight="900"
                            fill="#be123c"
                          >
                            {obs.label}
                          </text>
                        </g>
                      );
                    })}

                    {/* Hoyos Tangentes Exactos (verdes si conectan 1 rueda, dorados si cierran 2 ruedas!) */}
                    {showValidHoles &&
                      validTangentHoles.map((vh) => {
                        const isDual = vh.tangentCount >= 2;
                        return (
                          <g
                            key={`vh-${vh.col}-${vh.row}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlaceAtHole(vh.col, vh.row);
                            }}
                            className="cursor-pointer"
                          >
                            <circle
                              cx={vh.x}
                              cy={vh.y}
                              r={isDual ? 4.2 : 3.2}
                              fill={isDual ? 'rgba(250, 204, 21, 0.45)' : 'rgba(16, 185, 129, 0.35)'}
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

                    {/* Líneas y puntos de tangencia activa entre engranajes engranados */}
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
                            stroke="rgba(15, 23, 42, 0.25)"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                          <circle cx={tx} cy={ty} r="2.1" fill="#10b981" stroke="#ffffff" strokeWidth="0.7" />
                        </g>
                      );
                    })}

                    {/* Renderizado de cada Engranaje / Círculo Primitivo */}
                    {gears.map((g) => {
                      const spec = GEAR_CATALOG[g.sizeId];
                      const node = analysis.nodes[g.id];
                      const isSelected = g.id === selectedGearId;
                      const isColliding =
                        analysis.collisionPairs.some(([a, b]) => a === g.id || b === g.id) ||
                        analysis.obstacleCollisions.includes(g.id);

                      // Ángulo animado en grados (1 RPM = 6 deg/s)
                      const angleDeg =
                        ((node?.phaseOffsetRad ?? 0) * 180) / Math.PI +
                        (node?.rpm ?? 0) * 6 * simTimeSec;

                      const strokeCol = isColliding
                        ? '#e11d48'
                        : isSelected
                          ? '#0f172a'
                          : spec.color;

                      return (
                        <g
                          key={g.id}
                          transform={`translate(${g.x}, ${g.y})`}
                          onPointerDown={(e) => handleGearPointerDown(e, g)}
                          className={g.role === 'idler' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                        >
                          {viewMode === 'gears' ? (
                            /* VISTA ENGRANAJE DENTADO REAL GIRANDO */
                            <g transform={`rotate(${angleDeg.toFixed(2)})`}>
                              <path
                                data-role="gear-hit"
                                d={toothPathsBySize[g.sizeId]}
                                fill={isColliding ? 'rgba(225, 29, 72, 0.35)' : `${spec.color}cc`}
                                stroke={isColliding ? '#be123c' : '#451a03'}
                                strokeWidth={isSelected ? 1.5 : 0.9}
                              />
                              {/* Círculo primitivo punteado de referencia */}
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
                              {/* Radio indicador de giro */}
                              <line
                                x1="0"
                                y1="0"
                                x2={spec.pitchRadiusMm * 0.72}
                                y2="0"
                                stroke="#ffffff"
                                strokeWidth="1.5"
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
                            /* VISTA CÍRCULOS DE DIÁMETRO PRIMITIVO */
                            <g>
                              <circle
                                data-role="gear-hit"
                                cx="0"
                                cy="0"
                                r={spec.pitchRadiusMm}
                                fill={isColliding ? 'rgba(225, 29, 72, 0.25)' : `${spec.color}30`}
                                stroke={strokeCol}
                                strokeWidth={isSelected ? 2.2 : 1.6}
                              />
                              {/* Línea giratoria interna para visualizar sentido y velocidad de giro */}
                              <g transform={`rotate(${angleDeg.toFixed(2)})`} pointerEvents="none">
                                <line
                                  x1="0"
                                  y1="0"
                                  x2={spec.pitchRadiusMm - 2}
                                  y2="0"
                                  stroke={spec.color}
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                />
                                <circle
                                  cx={spec.pitchRadiusMm - 3.5}
                                  cy="0"
                                  r="1.8"
                                  fill={spec.color}
                                />
                              </g>
                            </g>
                          )}

                          {/* Orificio central Ø 5.2 mm / Eje PLA */}
                          <circle
                            cx="0"
                            cy="0"
                            r={GEAR_BORE_DIAMETER_MM / 2}
                            fill="#ffffff"
                            stroke="#0f172a"
                            strokeWidth="1"
                            pointerEvents="none"
                          />

                          {/* Insignia de Rol (INICIO / META) o Dientes */}
                          {g.role !== 'idler' ? (
                            <g transform={`translate(0, ${-spec.pitchRadiusMm - 5.5})`} pointerEvents="none">
                              <rect
                                x="-17"
                                y="-5.5"
                                width="34"
                                height="10"
                                rx="3"
                                fill={g.role === 'start' ? '#0284c7' : '#059669'}
                              />
                              <text
                                x="0"
                                y="1.4"
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
                              y={spec.pitchRadiusMm > 14 ? 9.5 : 8}
                              textAnchor="middle"
                              fontSize="4.8"
                              fontWeight="900"
                              fill="#0f172a"
                              pointerEvents="none"
                            >
                              {spec.teeth}T
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-300">
                    <span>
                      🟢 <strong>Hoyo Verde:</strong> Tangencia exacta (1 contacto)
                    </span>
                    <span>
                      🟡 <strong>Hoyo Dorado:</strong> Cierre doble (2 contactos simultáneos)
                    </span>
                    <span>
                      📐 <strong>Matriz:</strong> Paso 10 mm · Orificio tablero Ø{BOARD_HOLE_DIAMETER_MM} mm
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
                      2. Tablero Matricial Completo ({board.id} cm)
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

          {/* TELEMETRÍA DE FABRICACIÓN Y COORDENADAS FÍSICAS PARA EL TABLERO REAL */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-rose-600 block">
                  Corte Láser Engranajes
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
                  {board.widthMm / 10} × {board.heightMm / 10} cm
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
                  Kit Ejes + Manivela PLA
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

        {/* DERECHA (4 COLS): CATÁLOGO DE 4 CÍRCULOS PRIMITIVOS + INSPECTOR + GUÍA DE MONTAJE */}
        <div className="lg:col-span-4 space-y-4">
          {/* Catálogo de los 4 Círculos de Diámetro Primitivo */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <h3 className="font-black text-slate-900 text-sm">
                  2. Círculos Primitivos (Módulo {GEAR_MODULE_MM} mm)
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500">4 tamaños</span>
            </div>

            <p className="text-[11px] text-slate-600 leading-snug">
              Selecciona un diámetro primitivo y haz clic sobre cualquier{' '}
              <strong className="text-emerald-700">hoyo verde</strong> del tablero (o arrastra una
              rueda ya puesta para moverla).
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {GEAR_CATALOG_LIST.map((item) => {
                const active = activeToolSize === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveToolSize(item.id)}
                    className={`p-3 rounded-2xl border-2 text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                      active
                        ? 'bg-slate-900 text-white border-teal-500 shadow-md scale-[1.02]'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    <svg viewBox="-46 -46 92 92" className="w-16 h-16">
                      <circle
                        cx="0"
                        cy="0"
                        r={item.pitchRadiusMm}
                        fill={`${item.color}38`}
                        stroke={item.color}
                        strokeWidth="3"
                        strokeDasharray={active ? 'none' : '4 2'}
                      />
                      <circle cx="0" cy="0" r="3" fill={active ? '#ffffff' : '#0f172a'} />
                    </svg>
                    <div className="text-xs font-black leading-tight">{item.name}</div>
                    <div
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                        active
                          ? 'bg-teal-500/20 text-teal-300'
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      Ø {item.pitchDiameterMm / 10} cm · {item.teeth}T
                    </div>
                    <div
                      className={`text-[9px] font-mono ${
                        active ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      Radio = {item.gridRadiusUnits} {item.gridRadiusUnits === 1 ? 'hoyo' : 'hoyos'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Panel de Edición del Engranaje Seleccionado */}
            {selectedGear && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">
                    {selectedGear.role === 'start'
                      ? '🟢 Engranaje INICIO (Fijo)'
                      : selectedGear.role === 'end'
                        ? '🏁 Engranaje META (Fijo)'
                        : `⚙️ Engranaje Intermedio (${GEAR_CATALOG[selectedGear.sizeId].teeth}T)`}
                  </span>
                  {selectedGear.role === 'idler' && (
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Quitar
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <span>
                    Hoyo: <strong>(Col {selectedGear.col + 1}, Fila {selectedGear.row + 1})</strong>
                  </span>
                  <span>
                    {analysis.nodes[selectedGear.id]?.connectedToStart && !analysis.isJammed
                      ? `${Math.abs(analysis.nodes[selectedGear.id].rpm).toFixed(1)} RPM ${
                          analysis.nodes[selectedGear.id].direction === 1 ? '↻' : '↺'
                        }`
                      : 'Sin giro'}
                  </span>
                </div>

                {selectedGear.role === 'idler' && (
                  <div className="grid grid-cols-4 gap-1">
                    {GEAR_CATALOG_LIST.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleChangeSelectedSize(opt.id)}
                        className={`py-1 rounded-lg text-[10px] font-extrabold border cursor-pointer ${
                          selectedGear.sizeId === opt.id
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        {opt.pitchDiameterMm / 10} cm
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabla de Posiciones Físicas para Armar en el Tablero Real */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-teal-600" />
                Mapa de Montaje Físico ({gears.length} ejes)
              </h4>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                Relación {analysis.transmissionRatio}×
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              {gears.map((g, idx) => {
                const spec = GEAR_CATALOG[g.sizeId];
                const node = analysis.nodes[g.id];
                const tag =
                  g.role === 'start' ? 'INICIO' : g.role === 'end' ? 'META' : `Rueda #${idx}`;
                return (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGearId(g.id)}
                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center justify-between cursor-pointer ${
                      g.id === selectedGearId
                        ? 'bg-teal-50 border-teal-400 font-bold'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: spec.color }}
                      />
                      <strong className="text-slate-900">{tag}</strong>
                      <span className="text-slate-500">
                        ({spec.pitchDiameterMm / 10} cm · {spec.teeth}T)
                      </span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-700">
                      ({g.col + 1},{g.row + 1}){' '}
                      {node?.connectedToStart && !analysis.isJammed
                        ? node.direction === 1
                          ? '↻'
                          : '↺'
                        : '·'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Botones de Descarga Completos */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
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
          </div>

          {/* Nota Matemática sobre la Matriz 10 mm */}
          <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-3.5 text-[11px] text-emerald-950 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>¿Por qué encajan en la matriz de 10 mm?</strong> Con módulo{' '}
              <strong>m = 2.0 mm</strong> y <strong>10, 20, 30 y 40 dientes</strong>, los radios
              primitivos son exactos (<strong>1, 2, 3 y 4 hoyos</strong>): cualquier par engrana en
              horizontal/vertical, y las parejas <strong>4+6 cm</strong> o <strong>2+8 cm</strong>{' '}
              (suma 5 cm) además engranan en <strong>diagonal pitagórica 3-4-5</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GearsSection;
