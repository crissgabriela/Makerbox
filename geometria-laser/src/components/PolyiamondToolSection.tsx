'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  FlipHorizontal,
  Grid,
  HelpCircle,
  Layers,
  Lightbulb,
  Puzzle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  DEFAULT_POLYIAMOND_CONFIG,
  generatePolyiamondPuzzleLaser,
  gridCellVertices,
  gridUVToCartesian,
  NINE_P_CHALLENGE_META,
  NINE_P_ISLAND_CELL,
  NINE_P_SOLUTIONS,
  NinePointyPChallengeId,
  PolyiamondPuzzleConfig,
  roundedPolygonToSvgPath,
  TEN_HOES_CHALLENGE_META,
  TEN_HOES_NUMBERED_CELLS,
  TEN_HOES_SOLUTIONS,
  TenHoesChallengeId,
} from '@/lib/polyiamondPuzzleGenerator';
import { insetPolygon, polygonToSvgPath } from '@/lib/falconLaserSpec';
import { LaserSvgPreviewCard } from './LaserSvgPreviewCard';

const PIECE_PALETTE = [
  '#4f46e5', // Indigo
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#ef4444', // Red
  '#f97316', // Orange
  '#06b6d4', // Cyan
];

export function PolyiamondToolSection() {
  const [config, setConfig] = useState<PolyiamondPuzzleConfig>(DEFAULT_POLYIAMOND_CONFIG);
  const [ninePChallenge, setNinePChallenge] = useState<NinePointyPChallengeId>('show_9_dots');
  const [tenHoesChallenge, setTenHoesChallenge] = useState<TenHoesChallengeId>('challenge_1');
  const [revealedPiecesCount, setRevealedPiecesCount] = useState<number>(0);
  const [showSimGrid, setShowSimGrid] = useState<boolean>(true);
  const [guessedCells, setGuessedCells] = useState<string[]>([]);

  const isNineP = config.puzzleId === 'nine_pointy_p';
  const maxPieces = isNineP ? 9 : 10;

  const update = <K extends keyof PolyiamondPuzzleConfig>(
    key: K,
    val: PolyiamondPuzzleConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  };

  const handleSwitchPuzzle = (puzzleId: PolyiamondPuzzleConfig['puzzleId']) => {
    setConfig((prev) => ({
      ...prev,
      puzzleId,
      unitSideMm: puzzleId === 'nine_pointy_p' ? 15.5 : 15,
    }));
    setRevealedPiecesCount(0);
    setGuessedCells([]);
  };

  const handleSelectNinePChallenge = (ch: NinePointyPChallengeId) => {
    setNinePChallenge(ch);
    setRevealedPiecesCount(0);
    setGuessedCells([]);
  };

  const handleSelectTenHoesChallenge = (ch: TenHoesChallengeId) => {
    setTenHoesChallenge(ch);
    setRevealedPiecesCount(0);
    setGuessedCells([]);
  };

  const toggleCellHypothesis = (cellKey: string) => {
    setGuessedCells((prev) =>
      prev.includes(cellKey) ? prev.filter((k) => k !== cellKey) : [...prev, cellKey]
    );
  };

  const result = useMemo(() => generatePolyiamondPuzzleLaser(config), [config]);

  const activeSolution = isNineP
    ? NINE_P_SOLUTIONS[ninePChallenge]
    : TEN_HOES_SOLUTIONS[tenHoesChallenge];

  const clampedRevealed = Math.min(revealedPiecesCount, maxPieces);
  const allRevealed = clampedRevealed === maxPieces;

  // Geometría del simulador SVG interactivo (escala cómoda fija en unidades de vista)
  const simN = isNineP ? 7 : 8;
  const simUnit = isNineP ? 36 : 32;
  const simW = 360;
  const simH = 290;
  const simApexX = simW / 2;
  const simApexY = 26;

  const allSimCells = useMemo(() => {
    const list: { a: number; b: number; d: 0 | 1; key: string; verts: [number, number][] }[] = [];
    for (let b = 0; b < simN; b++) {
      for (let a = 0; a <= simN - 1 - b; a++) {
        list.push({
          a,
          b,
          d: 0,
          key: `${a},${b},0`,
          verts: gridCellVertices(a, b, 0, simN, simUnit, simApexX, simApexY),
        });
        if (a <= simN - 2 - b) {
          list.push({
            a,
            b,
            d: 1,
            key: `${a},${b},1`,
            verts: gridCellVertices(a, b, 1, simN, simUnit, simApexX, simApexY),
          });
        }
      }
    }
    return list;
  }, [simN, simUnit, simApexX, simApexY]);

  const activeTargetNum = TEN_HOES_CHALLENGE_META[tenHoesChallenge].num;
  const mysteryEmptySet = useMemo(
    () => new Set(activeSolution.emptyCells.map(([a, b, d]) => `${a},${b},${d}`)),
    [activeSolution]
  );

  const exportFilename = isNineP
    ? `poliamantes-nueve-p-red7-${config.unitSideMm}mm.svg`
    : `poliamantes-diez-azadas-red8-${config.unitSideMm}mm.svg`;

  return (
    <div className="space-y-6">
      {/* BANNER SUPERIOR DE LA HERRAMIENTA */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-800 p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-black uppercase tracking-wider">
            <Puzzle className="w-3.5 h-3.5" />
            Herramienta 6 · Poliamantes, Quiralidad y Lógica Combinatoria
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
            Rompecabezas Lógicos de Poliamantes: «9 P» y «10 Azadas»
          </h1>
          <p className="text-sm sm:text-base text-emerald-50 leading-relaxed">
            Diseña tableros encajables de doble capa en <strong>MDF 3 mm</strong> basados en redes de triángulos equiláteros (<span className="font-mono font-bold">N²</span>). Explora cómo la{' '}
            <strong>quiralidad</strong> (reflexión especular al voltear fichas con punto) y las{' '}
            <strong>restricciones de paridad</strong> reducen múltiples combinaciones a una{' '}
            <strong>única solución matemática exacta</strong>.
          </p>
        </div>

        {/* Selector rápido entre ambos puzzles */}
        <div className="shrink-0 bg-white/15 backdrop-blur-md p-1.5 rounded-2xl border border-white/25 flex flex-col gap-1.5 min-w-[255px]">
          <button
            type="button"
            onClick={() => handleSwitchPuzzle('nine_pointy_p')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer text-left ${
              isNineP
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-white hover:bg-white/10'
            }`}
          >
            🔺 Puzzle A: Nueve P Puntiagudas (N=7)
          </button>
          <button
            type="button"
            onClick={() => handleSwitchPuzzle('ten_hoes')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer text-left ${
              !isNineP
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-white hover:bg-white/10'
            }`}
          >
            ⛏️ Puzzle B: Diez Azadas (N=8)
          </button>
        </div>
      </div>

      {/* PANEL PRINCIPAL: CONFIGURACIÓN + SIMULADOR INTERACTIVO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA (5 cols): REGLAS DEL DESAFÍO Y PARÁMETROS LÁSER */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tarjeta 1: Selector de Desafíos del Puzzle Activo */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center">
                1
              </span>
              {isNineP ? 'Los 3 Desafíos de Quiralidad' : 'Los 4 Retos Numéricos (1 al 4)'}
            </h2>

            {isNineP ? (
              <div className="space-y-2.5">
                {(Object.keys(NINE_P_CHALLENGE_META) as NinePointyPChallengeId[]).map((chId) => {
                  const meta = NINE_P_CHALLENGE_META[chId];
                  const active = ninePChallenge === chId;
                  return (
                    <button
                      key={chId}
                      type="button"
                      onClick={() => handleSelectNinePChallenge(chId)}
                      className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                        active
                          ? 'border-teal-600 bg-teal-50/70 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-black text-slate-900">
                          {meta.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            chId === 'ignore_dots'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {meta.solutionCountLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{meta.rule}</p>
                    </button>
                  );
                })}

                {/* Cápsula didáctica de quiralidad 7 + 2 */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-xs text-indigo-950 space-y-1.5">
                  <div className="font-black flex items-center gap-1.5 text-indigo-900">
                    <FlipHorizontal className="w-4 h-4 text-indigo-600 shrink-0" />
                    ¿Por qué el kit láser incluye 7 «P» derechas + 2 espejadas?
                  </div>
                  <p className="text-indigo-900/90 leading-relaxed">
                    El pentiamante <strong>P</strong> es <em>quiral</em>: no coincide con su imagen en el espejo mediante giros en el plano. Al grabar el punto negro en <strong>7 fichas derechas y 2 izquierdas</strong>, mostrar los 9 puntos exige usar <span className="font-mono font-bold">7D + 2I</span> (1 solución única), y voltearlas todas para ocultar los puntos exige <span className="font-mono font-bold">2D + 7I</span> (¡también 1 solución única!).
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  {(Object.keys(TEN_HOES_CHALLENGE_META) as TenHoesChallengeId[]).map((chId) => {
                    const meta = TEN_HOES_CHALLENGE_META[chId];
                    const active = tenHoesChallenge === chId;
                    return (
                      <button
                        key={chId}
                        type="button"
                        onClick={() => handleSelectTenHoesChallenge(chId)}
                        className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          active
                            ? 'border-teal-600 bg-teal-50/80 shadow-2xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="w-7 h-7 rounded-xl bg-slate-900 text-amber-300 font-black text-sm flex items-center justify-center">
                            {meta.num}
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Única
                          </span>
                        </div>
                        <div className="text-xs font-black text-slate-900 mt-2">
                          Dejar libres «{meta.num}»
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {meta.badge}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-1">
                  <div className="font-black text-amber-900">
                    {TEN_HOES_CHALLENGE_META[tenHoesChallenge].title}
                  </div>
                  <p className="text-amber-900/90 leading-relaxed">
                    {TEN_HOES_CHALLENGE_META[tenHoesChallenge].rule} Los otros números grabados en la base sí pueden cubrirse con las 10 azadas.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tarjeta 2: Parámetros Físicos de Corte Láser MDF 3 mm */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
                2
              </span>
              Dimensiones y Ajuste en MDF 3 mm
            </h2>

            {/* Lado unitario s */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Lado del Triángulo Unitario (s)</span>
                <span className="font-mono font-black text-indigo-700">
                  {config.unitSideMm} mm → Tablero {result.boardWidthMm}×{result.boardHeightMm} mm
                </span>
              </div>
              <input
                type="range"
                min={13}
                max={18}
                step={0.5}
                value={config.unitSideMm}
                onChange={(e) => update('unitSideMm', Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>13 mm (Compacto bolsillo)</span>
                <span>18 mm (Tamaño exposición stand)</span>
              </div>
            </div>

            {/* Tolerancia mecánica */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Holgura Mecánica de Encaje</span>
                <span className="font-mono font-black text-teal-700">
                  {config.toleranceMm.toFixed(2)} mm
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.36}
                step={0.02}
                value={config.toleranceMm}
                onChange={(e) => update('toleranceMm', Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>0.10 mm (Ajustado)</span>
                <span>0.20 mm (Óptimo MDF 3mm)</span>
                <span>0.36 mm (Holgado)</span>
              </div>
            </div>

            {/* Redondeo de esquinas */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Suavizado de Vértices en Fichas</span>
                <span className="font-mono font-black text-indigo-700">
                  r = {config.cornerRadiusMm.toFixed(2)} mm
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1.3}
                step={0.05}
                value={config.cornerRadiusMm}
                onChange={(e) => update('cornerRadiusMm', Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Switches de grabado en base */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showGridOnBase}
                  onChange={(e) => update('showGridOnBase', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-teal-600 cursor-pointer"
                />
                <span className="text-xs text-slate-700 leading-snug">
                  <strong className="text-slate-900">Marcar red triangular guía en la base (#0000FF):</strong>{' '}
                  Desactivado por defecto para conservar el desafío lógico puro (igual al diseño original). Actívalo si deseas una versión escolar guiada.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeSchoolStamp}
                  onChange={(e) => update('includeSchoolStamp', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                />
                <span className="text-xs text-slate-700 leading-snug">
                  <strong className="text-slate-900">Grabar sello Feria Científica LBN Maipú + MakerBox:</strong>{' '}
                  Personaliza el borde inferior del tablero en curvas vectoriales.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (7 cols): SIMULADOR INTERACTIVO DEL TABLERO Y PISTAS */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-teal-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Tablero Triangular Interactivo (N = {result.gridOrderN} → {result.totalGridTriangles} triángulos)
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  {isNineP
                    ? NINE_P_CHALLENGE_META[ninePChallenge].title
                    : TEN_HOES_CHALLENGE_META[tenHoesChallenge].title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowSimGrid((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${
                  showSimGrid
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>{showSimGrid ? 'Ocultar Retícula' : 'Ver Retícula N²'}</span>
              </button>
            </div>

            {/* LIENZO INTERACTIVO DEL TABLERO DE MADERA */}
            <div className="rounded-2xl bg-gradient-to-b from-amber-100/70 to-amber-200/50 border-2 border-amber-300/80 p-3 sm:p-5 flex flex-col items-center">
              <svg
                viewBox={`0 0 ${simW} ${simH}`}
                className="w-full max-w-[520px] h-auto select-none drop-shadow-sm"
              >
                {/* Marco exterior simulado en madera clara */}
                <rect
                  x="14"
                  y="8"
                  width={simW - 28}
                  height={simH - 16}
                  rx="16"
                  fill="#f6e3c5"
                  stroke="#b47b38"
                  strokeWidth="2.5"
                />

                {/* Fondo rebajado de la cavidad triangular */}
                <path
                  d={polygonToSvgPath([
                    gridUVToCartesian(0, simN, simN, simUnit, simApexX, simApexY),
                    gridUVToCartesian(0, 0, simN, simUnit, simApexX, simApexY),
                    gridUVToCartesian(simN, 0, simN, simUnit, simApexX, simApexY),
                  ])}
                  fill="#dfbe8f"
                  stroke="#78350f"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />

                {/* Celdas unitarias clicables (para marcar hipótesis de huecos vacíos) */}
                {allSimCells.map((cell) => {
                  const isIsland =
                    isNineP &&
                    cell.a === NINE_P_ISLAND_CELL.a &&
                    cell.b === NINE_P_ISLAND_CELL.b &&
                    cell.d === NINE_P_ISLAND_CELL.d;

                  const numberedSpec = !isNineP
                    ? TEN_HOES_NUMBERED_CELLS.find(
                        (nc) => nc.a === cell.a && nc.b === cell.b && nc.d === cell.d
                      )
                    : undefined;

                  const isTargetNumber = numberedSpec?.num === activeTargetNum;
                  const isGuessed = guessedCells.includes(cell.key);
                  const isSolvedMysteryHole = allRevealed && mysteryEmptySet.has(cell.key);

                  const cx = (cell.verts[0][0] + cell.verts[1][0] + cell.verts[2][0]) / 3;
                  const cy = (cell.verts[0][1] + cell.verts[1][1] + cell.verts[2][1]) / 3;

                  return (
                    <g
                      key={cell.key}
                      onClick={() => {
                        if (!isIsland && !isTargetNumber) {
                          toggleCellHypothesis(cell.key);
                        }
                      }}
                      className={
                        !isIsland && !isTargetNumber ? 'cursor-pointer hover:opacity-85' : ''
                      }
                    >
                      <path
                        d={polygonToSvgPath(cell.verts)}
                        fill={
                          isIsland
                            ? '#f8fafc'
                            : isTargetNumber
                            ? '#fef08a'
                            : isSolvedMysteryHole
                            ? '#bbf7d0'
                            : isGuessed
                            ? '#fed7aa'
                            : 'transparent'
                        }
                        stroke={
                          isIsland
                            ? '#334155'
                            : isTargetNumber
                            ? '#d97706'
                            : showSimGrid
                            ? 'rgba(120, 53, 15, 0.24)'
                            : 'transparent'
                        }
                        strokeWidth={isIsland || isTargetNumber ? 1.8 : 0.8}
                      />

                      {isIsland && (
                        <text
                          x={cx}
                          y={cy + 2}
                          textAnchor="middle"
                          fontSize="6.5"
                          fontWeight="900"
                          fill="#1e293b"
                        >
                          ISLA
                        </text>
                      )}

                      {numberedSpec && (
                        <text
                          x={cx}
                          y={cy + 4}
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight="900"
                          fill={isTargetNumber ? '#b45309' : '#573014'}
                        >
                          {numberedSpec.num}
                        </text>
                      )}

                      {isGuessed && !allRevealed && !isIsland && !isTargetNumber && (
                        <text
                          x={cx}
                          y={cy + 3}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="900"
                          fill="#c2410c"
                        >
                          ?
                        </text>
                      )}

                      {isSolvedMysteryHole && (
                        <circle cx={cx} cy={cy} r="3.8" fill="#15803d" />
                      )}
                    </g>
                  );
                })}

                {/* Piezas reveladas paso a paso por el asistente docente */}
                {activeSolution.pieces.slice(0, clampedRevealed).map((piece, idx) => {
                  const rawPts = piece.boundaryUV.map(([u, v]) =>
                    gridUVToCartesian(u, v, simN, simUnit, simApexX, simApexY)
                  );
                  const shrunkPts = insetPolygon(rawPts, 1.1);
                  const dPath = roundedPolygonToSvgPath(shrunkPts, 2.6);
                  const color = PIECE_PALETTE[idx % PIECE_PALETTE.length];

                  // ¿Mostrar punto en esta pieza según el reto activo?
                  let showDot = false;
                  if (isNineP && piece.dotUV) {
                    if (ninePChallenge === 'show_9_dots') showDot = true;
                    else if (ninePChallenge === 'hide_all_dots') showDot = false;
                    else showDot = piece.chirality === 'B'; // En modo libre mostramos las que caen cara B arriba
                  }

                  const dotXY =
                    showDot && piece.dotUV
                      ? gridUVToCartesian(
                          piece.dotUV[0],
                          piece.dotUV[1],
                          simN,
                          simUnit,
                          simApexX,
                          simApexY
                        )
                      : null;

                  return (
                    <g key={idx}>
                      <path
                        d={dPath}
                        fill={color}
                        fillOpacity={0.86}
                        stroke="#ffffff"
                        strokeWidth="1.4"
                      />
                      {dotXY && (
                        <circle
                          cx={dotXY[0]}
                          cy={dotXY[1]}
                          r={simUnit * 0.14}
                          fill="#0f172a"
                          stroke="#ffffff"
                          strokeWidth="0.9"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Leyenda rápida bajo el tablero */}
              <div className="mt-2 flex items-center justify-center gap-4 flex-wrap text-[11px] font-bold text-amber-950">
                {isNineP ? (
                  <>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs bg-white border border-slate-700 inline-block" />
                      1 Isla Fija Pegada
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-slate-900 inline-block" />
                      Punto de Quiralidad
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-orange-700" />
                      Haz clic en celdas para hipotetizar los 3 huecos libres
                    </span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs bg-yellow-200 border border-amber-600 inline-block" />
                      2 Triángulos «{activeTargetNum}» (Mantener Libres)
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-orange-700" />
                      Haz clic en celdas para hipotetizar los otros 2 huecos
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* BARRA DE PISTAS DOCENTES (SIN SPOILER POR DEFECTO) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">
                    Asistente Docente de Stand: {clampedRevealed} / {maxPieces} fichas colocadas
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {allRevealed
                      ? isNineP
                        ? '¡Solución completada! Observa en verde los 3 triángulos vacíos.'
                        : `¡Solución completada! Los dos «${activeTargetNum}» y los 2 puntos verdes quedan libres.`
                      : 'Revela una pista paso a paso si un visitante queda bloqueado.'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={allRevealed}
                  onClick={() => setRevealedPiecesCount((c) => Math.min(maxPieces, c + 1))}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-black transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>+1 Pista</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setRevealedPiecesCount(allRevealed ? 0 : maxPieces)
                  }
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  {allRevealed ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Ocultar</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ver Solución</span>
                    </>
                  )}
                </button>

                {(clampedRevealed > 0 || guessedCells.length > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setRevealedPiecesCount(0);
                      setGuessedCells([]);
                    }}
                    className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                    title="Reiniciar tablero"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* ECUACIÓN DE CONSERVACIÓN DE ÁREA EN LA RED TRIANGULAR */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-emerald-800 font-bold block">Conservación Discreta (N²)</span>
                <span className="text-sm sm:text-base font-black text-emerald-950 font-mono mt-0.5 block">
                  {isNineP ? '49 = 1 + 9×5 + 3' : '64 = 10×6 + 2 + 2'}
                </span>
                <span className="text-[11px] text-emerald-800/90 block mt-0.5">
                  {isNineP
                    ? '1 isla + 45 en fichas + 3 huecos'
                    : '60 en azadas + 2 números + 2 huecos'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200">
                <span className="text-indigo-800 font-bold block">Área Geométrica Cavidad</span>
                <span className="text-sm sm:text-base font-black text-indigo-950 font-mono mt-0.5 block">
                  {result.totalTriangleAreaCm2} cm²
                </span>
                <span className="text-[11px] text-indigo-800/90 block mt-0.5">
                  Triángulo unitario = {result.unitAreaCm2} cm²
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                <span className="text-amber-900 font-bold flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-amber-700" /> Armado MDF 3 mm
                </span>
                <span className="text-sm sm:text-base font-black text-amber-950 mt-0.5 block">
                  Doble Capa (6 mm)
                </span>
                <span className="text-[11px] text-amber-900/90 block mt-0.5">
                  {isNineP
                    ? 'Pegar marco + isla (incluye 1 isla extra)'
                    : 'Pegar marco sobre base numerada'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PREVISUALIZACIÓN VECTORIAL 1:1 Y EXPORTACIÓN .SVG PARA CR FALCON 2 10W */}
      <LaserSvgPreviewCard
        svgContent={result.svgContent}
        widthMm={result.widthMm}
        heightMm={result.heightMm}
        estimatedMinutes={result.estimatedMinutes}
        filename={exportFilename}
        title={
          isNineP
            ? `Plano Láser 1:1 · Nueve P Puntiagudas (Base + Marco + 9 Pentiamantes + 2 Islas)`
            : `Plano Láser 1:1 · Diez Azadas (Base Numerada + Marco + 5 Pares Anidados)`
        }
      />
    </div>
  );
}
