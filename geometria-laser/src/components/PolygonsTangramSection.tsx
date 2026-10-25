'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Grid,
  Plus,
  Puzzle,
  RotateCcw,
  Shapes,
  Sparkles,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  DEFAULT_POLYGONS_TANGRAM_CONFIG,
  generatePolygonsTangramLaser,
  POLYGON_PRESET_INFO,
  PolygonPresetId,
  PolygonsTangramConfig,
  TangramLabelMode,
} from '@/lib/polygonsTangramGenerator';
import { polygonToSvgPath } from '@/lib/falconLaserSpec';
import { LaserSvgPreviewCard } from './LaserSvgPreviewCard';

const VERTEX_TEST_OPTIONS = [
  { sides: 3, name: 'Triángulo', deg: 60, color: '#ef4444' },
  { sides: 4, name: 'Cuadrado', deg: 90, color: '#0ea5e9' },
  { sides: 5, name: 'Pentágono', deg: 108, color: '#f59e0b' },
  { sides: 6, name: 'Hexágono', deg: 120, color: '#10b981' },
  { sides: 8, name: 'Octágono', deg: 135, color: '#8b5cf6' },
  { sides: 12, name: 'Dodecágono', deg: 150, color: '#14b8a6' },
];

export function PolygonsTangramSection() {
  const [config, setConfig] = useState<PolygonsTangramConfig>(
    DEFAULT_POLYGONS_TANGRAM_CONFIG
  );
  const [selectedTangramId, setSelectedTangramId] = useState<string>('tg1');
  // Laboratorio interactivo de suma de ángulos en un vértice (ej: [8, 8, 4] -> 135 + 135 + 90 = 360°)
  const [vertexPolys, setVertexPolys] = useState<number[]>([6, 3, 6, 3]);

  const update = <K extends keyof PolygonsTangramConfig>(
    key: K,
    val: PolygonsTangramConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  };

  const result = useMemo(() => generatePolygonsTangramLaser(config), [config]);

  const activeTangramPiece =
    result.tangramPieces.find((p) => p.id === selectedTangramId) ||
    result.tangramPieces[0];

  const vertexSumDeg = vertexPolys.reduce((acc, n) => {
    const deg = ((n - 2) * 180) / n;
    return acc + deg;
  }, 0);

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-100 text-xs font-black uppercase tracking-wider">
            <Shapes className="w-3.5 h-3.5" />
            Herramienta 3 · Áreas Proporcionales, Ángulos y Mosaicos
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
            Tangram Geométrico + Polígonos y Teselaciones
          </h1>
          <p className="text-sm sm:text-base text-amber-50 leading-relaxed">
            Alterna entre el <strong>Tangram Matemático de 7 piezas</strong> (con fracciones de área{' '}
            <strong>1/4, 1/8 y 1/16</strong> y ángulos interiores grabados) y el{' '}
            <strong>Laboratorio de Polígonos Regulares</strong> de arista común para explorar qué figuras cubren el plano sumando exactamente <strong>360° en cada vértice</strong>.
          </p>
        </div>

        {/* Selector rápido de modo */}
        <div className="shrink-0 bg-white/15 backdrop-blur-md p-1.5 rounded-2xl border border-white/25 flex flex-col gap-1.5 min-w-[230px]">
          <button
            type="button"
            onClick={() => update('mode', 'tangram')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              config.mode === 'tangram'
                ? 'bg-white text-orange-800 shadow-xs'
                : 'text-white hover:bg-white/10'
            }`}
          >
            🧩 Modo A: Tangram Fraccionario
          </button>
          <button
            type="button"
            onClick={() => update('mode', 'regular_polygons')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              config.mode === 'regular_polygons'
                ? 'bg-white text-orange-800 shadow-xs'
                : 'text-white hover:bg-white/10'
            }`}
          >
            🔷 Modo B: Polígonos y Teselaciones
          </button>
        </div>
      </div>

      {/* ENLACE RELACIONADO A HERRAMIENTA 6: ROMPECABEZAS DE POLIAMANTES */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-teal-200/80 rounded-2xl p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700">
          <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
            <Puzzle className="w-4 h-4" />
          </span>
          <span>
            <strong className="text-slate-900">¿Buscas retos avanzados en red triangular?</strong>{' '}
            Explora también los rompecabezas de poliamantes{' '}
            <strong>«Nueve P Puntiagudas» (N=7)</strong> y <strong>«Diez Azadas» (N=8)</strong>.
          </span>
        </div>
        <Link
          href="/poliamantes"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black shrink-0 transition-colors"
        >
          <span>Ir a Poliamantes</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ===================================================================== */}
      {/* VISTA MODO A: TANGRAM                                                 */}
      {/* ===================================================================== */}
      {config.mode === 'tangram' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-xs space-y-5">
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-orange-600 text-white text-xs font-black flex items-center justify-center">
                1
              </span>
              Configuración del Tangram en MDF 3 mm
            </h2>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Lado interior del cuadrado del Tangram (L):</span>
                <span className="font-mono text-orange-700">
                  {config.tangramSizeMm} × {config.tangramSizeMm} mm ({result.totalAreaCm2} cm²)
                </span>
              </div>
              <input
                type="range"
                min={80}
                max={150}
                step={5}
                value={config.tangramSizeMm}
                onChange={(e) => update('tangramSizeMm', Number(e.target.value))}
                className="w-full accent-orange-600 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-slate-600 block">
                Información Matemática Grabada en cada Pieza:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(
                  [
                    {
                      id: 'angles_and_fractions',
                      title: 'Fracción de Área + Ángulos',
                      desc: 'Ej: "1/4" y "90° · 45° · 45°" o "45° · 135°"',
                    },
                    {
                      id: 'fractions',
                      title: 'Solo Fracción del Total',
                      desc: 'Graba "1/4", "1/8" y "1/16" en tipografía grande',
                    },
                    {
                      id: 'areas_cm2',
                      title: 'Área Exacta en cm²',
                      desc: `Calcula y graba el área real de cada pieza sobre ${result.totalAreaCm2} cm²`,
                    },
                    {
                      id: 'clean',
                      title: 'Piezas Limpias (Desafío Libre)',
                      desc: 'Sin texto en las fichas para retos de siluetas a ciegas',
                    },
                  ] as { id: TangramLabelMode; title: string; desc: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => update('tangramLabelMode', opt.id)}
                    className={`p-3 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                      config.tangramLabelMode === opt.id
                        ? 'border-orange-600 bg-orange-50/70'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-black text-slate-900">
                      {opt.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
              <label className="inline-flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.tangramIncludeTray}
                  onChange={(e) => update('tangramIncludeTray', e.target.checked)}
                  className="w-4 h-4 rounded accent-orange-600"
                />
                <span>Incluir Bandeja Encajable Doble Capa (Base + Marco)</span>
              </label>

              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-500">Holgura:</span>
                {[0.15, 0.2, 0.3].map((tol) => (
                  <button
                    key={tol}
                    type="button"
                    onClick={() => update('toleranceMm', tol)}
                    className={`px-2.5 py-1 rounded-lg font-mono font-black cursor-pointer ${
                      config.toleranceMm === tol
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tol.toFixed(2)}mm
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* INSPECTOR INTERACTIVO DE LAS 7 PIEZAS */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-xs flex flex-col justify-between gap-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Inspector Geométrico Interactivo
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Toca cualquiera de las 7 piezas:
              </h3>
            </div>

            <div className="flex items-center justify-center">
              <svg
                viewBox={`-6 -6 ${config.tangramSizeMm + 12} ${
                  config.tangramSizeMm + 12
                }`}
                className="w-full max-w-[250px] h-auto select-none drop-shadow-xs"
              >
                {result.tangramPieces.map((p) => {
                  const isSel = p.id === activeTangramPiece.id;
                  return (
                    <g
                      key={p.id}
                      onClick={() => setSelectedTangramId(p.id)}
                      className="cursor-pointer transition-opacity hover:opacity-90"
                    >
                      <path
                        d={polygonToSvgPath(p.points)}
                        fill={p.color}
                        fillOpacity={isSel ? 0.96 : 0.68}
                        stroke={isSel ? '#0f172a' : '#ffffff'}
                        strokeWidth={isSel ? 2.4 : 1.4}
                      />
                      <text
                        x={p.labelCenter[0]}
                        y={p.labelCenter[1]}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={config.tangramSizeMm * 0.065}
                        fontWeight="900"
                        fill="#ffffff"
                      >
                        {p.fractionStr}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-slate-900">
                  {activeTangramPiece.name}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-black">
                  Fracción {activeTangramPiece.fractionStr}
                </span>
              </div>
              <div className="text-slate-600 font-medium">
                • Ángulos interiores: <strong>{activeTangramPiece.anglesStr}</strong>
              </div>
              <div className="text-slate-600 font-medium">
                • Área real:{' '}
                <strong>
                  {Math.round(result.totalAreaCm2 * activeTangramPiece.fractionVal * 100) / 100} cm²
                </strong>{' '}
                ({activeTangramPiece.fractionVal * 100}% del cuadrado total)
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* =================================================================== */
        /* VISTA MODO B: POLÍGONOS REGULARES Y TESELACIONES                    */
        /* =================================================================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-xs space-y-5">
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-orange-600 text-white text-xs font-black flex items-center justify-center">
                1
              </span>
              Selecciona el Kit de Polígonos y Teselaciones
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(POLYGON_PRESET_INFO) as PolygonPresetId[]).map(
                (pid) => {
                  const info = POLYGON_PRESET_INFO[pid];
                  const active = config.polygonPreset === pid;
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => update('polygonPreset', pid)}
                      className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                        active
                          ? 'border-orange-600 bg-orange-50/70 ring-2 ring-orange-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-black text-slate-900">
                          {info.title}
                        </span>
                        {active && <Check className="w-4 h-4 text-orange-700 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {info.subtitle}
                      </p>
                      <span className="inline-block mt-2 text-[10px] font-mono font-bold text-orange-800 bg-orange-100/80 px-2 py-0.5 rounded-md">
                        {info.mathRule}
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Longitud de arista común compartida (s):</span>
                <span className="font-mono text-orange-700">
                  {config.polygonSideMm} mm en todos los polígonos
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={38}
                step={2}
                value={config.polygonSideMm}
                onChange={(e) => update('polygonSideMm', Number(e.target.value))}
                className="w-full accent-orange-600 cursor-pointer"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showApothemAndDiagonals}
                onChange={(e) =>
                  update('showApothemAndDiagonals', e.target.checked)
                }
                className="w-4 h-4 rounded accent-orange-600"
              />
              <span>
                Marcar en azul (#0000FF) la apotema y las diagonales de triangulación (n − 2 triángulos)
              </span>
            </label>

            {/* Tabla resumen de polígonos generados */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                    <th className="py-1.5">Polígono</th>
                    <th className="py-1.5">Cant.</th>
                    <th className="py-1.5">Áng. Interior</th>
                    <th className="py-1.5">Apotema</th>
                    <th className="py-1.5">Tesela solo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {result.polygonSpecs.map((sp) => (
                    <tr key={sp.sides}>
                      <td className="py-2 font-black text-slate-800">
                        {sp.name} (n={sp.sides})
                      </td>
                      <td className="py-2 font-mono">×{sp.count}</td>
                      <td className="py-2 font-mono text-indigo-700">
                        {sp.interiorAngleDeg}°
                      </td>
                      <td className="py-2 font-mono">{sp.apothemMm} mm</td>
                      <td className="py-2">
                        {sp.canTessellateAlone ? (
                          <span className="text-emerald-700 font-black">Sí (divisor de 360°)</span>
                        ) : (
                          <span className="text-amber-700">Mixta / Hueco</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIMULADOR DE VÉRTICE DE TESELACIÓN (360°) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-xs flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 flex items-center gap-1">
                <Grid className="w-3.5 h-3.5" />
                Comprobador de Vértice de Teselación
              </span>
              <h3 className="text-lg font-black text-slate-900">
                ¿Suman exactamente 360° alrededor de un punto?
              </h3>
              <p className="text-xs text-slate-500">
                Agrega polígonos alrededor del vértice central para verificar si encajan sin dejar huecos ni superponerse:
              </p>
            </div>

            {/* Rueda angular de 360° */}
            <div className="flex items-center justify-center">
              <svg
                viewBox="-115 -115 230 230"
                className="w-full max-w-[235px] h-auto select-none"
              >
                <circle
                  cx={0}
                  cy={0}
                  r={96}
                  fill="#f8fafc"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                {(() => {
                  let accumDeg = -90;
                  return vertexPolys.map((sides, idx) => {
                    const deg = ((sides - 2) * 180) / sides;
                    const opt =
                      VERTEX_TEST_OPTIONS.find((o) => o.sides === sides) ||
                      VERTEX_TEST_OPTIONS[0];
                    const a1 = (accumDeg * Math.PI) / 180;
                    const a2 = ((accumDeg + Math.min(deg, 360)) * Math.PI) / 180;
                    const mid = (a1 + a2) / 2;
                    accumDeg += deg;
                    const r = 90;
                    const x1 = r * Math.cos(a1);
                    const y1 = r * Math.sin(a1);
                    const x2 = r * Math.cos(a2);
                    const y2 = r * Math.sin(a2);
                    const d = `M 0 0 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;

                    return (
                      <g key={idx}>
                        <path
                          d={d}
                          fill={opt.color}
                          fillOpacity={0.82}
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        <text
                          x={54 * Math.cos(mid)}
                          y={54 * Math.sin(mid)}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="11"
                          fontWeight="900"
                          fill="#ffffff"
                        >
                          {deg}°
                        </text>
                      </g>
                    );
                  });
                })()}
                <circle cx={0} cy={0} r={5} fill="#0f172a" />
              </svg>
            </div>

            {/* Botones para agregar polígonos al vértice */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-slate-800">
                  Suma actual: {Math.round(vertexSumDeg * 10) / 10}° / 360°
                </span>
                {Math.abs(vertexSumDeg - 360) < 0.01 ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-black">
                    <CheckCircle2 className="w-4 h-4" /> ¡Tesela Perfecto!
                  </span>
                ) : vertexSumDeg > 360 ? (
                  <span className="inline-flex items-center gap-1 text-red-600 font-black">
                    <XCircle className="w-4 h-4" /> Se superponen (&gt;360°)
                  </span>
                ) : (
                  <span className="text-amber-700 font-bold">
                    Faltan {Math.round((360 - vertexSumDeg) * 10) / 10}°
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {VERTEX_TEST_OPTIONS.map((opt) => (
                  <button
                    key={opt.sides}
                    type="button"
                    disabled={vertexPolys.length >= 6}
                    onClick={() => setVertexPolys((prev) => [...prev, opt.sides])}
                    className="px-2 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-black text-slate-800 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    <Plus className="w-3 h-3 text-orange-600" />
                    <span>
                      n={opt.sides} ({opt.deg}°)
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] font-mono text-slate-500">
                  Vértice: [{vertexPolys.join(' · ') || 'vacío'}]
                </span>
                <button
                  type="button"
                  onClick={() => setVertexPolys([])}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Vaciar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREVISUALIZACIÓN Y DESCARGA SVG */}
      <LaserSvgPreviewCard
        svgContent={result.svgContent}
        widthMm={result.widthMm}
        heightMm={result.heightMm}
        estimatedMinutes={result.estimatedMinutes}
        filename={
          config.mode === 'tangram'
            ? `Feria_LBN_Maipu_Tangram_${config.tangramSizeMm}mm_MDF3mm.svg`
            : `Feria_LBN_Maipu_Poligonos_${config.polygonPreset}_MDF3mm.svg`
        }
        title={
          config.mode === 'tangram'
            ? `Plano de Corte Láser: Tangram Geométrico (${config.tangramSizeMm}×${config.tangramSizeMm} mm)`
            : `Plano de Corte Láser: ${POLYGON_PRESET_INFO[config.polygonPreset].title}`
        }
      />
    </div>
  );
}
