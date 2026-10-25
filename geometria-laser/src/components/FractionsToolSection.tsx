'use client';

import React, { useMemo, useState } from 'react';
import {
  Check,
  Compass,
  Layers,
  Lightbulb,
  PieChart,
  RefreshCw,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  DEFAULT_FRACTIONS_LASER_CONFIG,
  DISK_SIZE_SPECS,
  DiskSizePreset,
  FractionDenominator,
  FractionEngraveMode,
  FractionsLaserConfig,
  generateFractionsLaser,
  getFractionBrailleCells,
} from '@/lib/fractionsLaserGenerator';
import { LaserSvgPreviewCard } from './LaserSvgPreviewCard';

const DENOMINATOR_PRESETS: {
  den: FractionDenominator;
  name: string;
  color: string;
}[] = [
  { den: 2, name: 'Medios', color: '#0284c7' },
  { den: 3, name: 'Tercios', color: '#10b981' },
  { den: 4, name: 'Cuartos', color: '#f59e0b' },
  { den: 5, name: 'Quintos', color: '#f97316' },
  { den: 6, name: 'Sextos', color: '#ec4899' },
  { den: 8, name: 'Octavos', color: '#8b5cf6' },
  { den: 10, name: 'Décimos', color: '#14b8a6' },
  { den: 12, name: 'Doceavos', color: '#6366f1' },
];

function gcdNum(a: number, b: number): number {
  let x = a;
  let y = b;
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

export function FractionsToolSection() {
  const [config, setConfig] = useState<FractionsLaserConfig>(
    DEFAULT_FRACTIONS_LASER_CONFIG
  );
  // Cantidad de sectores activos en el simulador interactivo
  const [activeSlicesCount, setActiveSlicesCount] = useState<number>(1);
  // Apertura radial (despiece) en el simulador interactivo
  const [explodePx, setExplodePx] = useState<number>(6);

  const update = <K extends keyof FractionsLaserConfig>(
    key: K,
    val: FractionsLaserConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
    if (key === 'denominator') {
      setActiveSlicesCount(1);
    }
  };

  const result = useMemo(() => generateFractionsLaser(config), [config]);
  const currentPreset =
    DENOMINATOR_PRESETS.find((p) => p.den === config.denominator) ||
    DENOMINATOR_PRESETS[1];

  const safeActive = Math.min(config.denominator, Math.max(1, activeSlicesCount));
  const g = gcdNum(safeActive, config.denominator);
  const simpNum = safeActive / g;
  const simpDen = config.denominator / g;
  const sumAngle = Math.round(((360 * safeActive) / config.denominator) * 10) / 10;
  const sumPercent = Math.round(((100 * safeActive) / config.denominator) * 10) / 10;

  const brailleData = useMemo(
    () => getFractionBrailleCells(config.denominator),
    [config.denominator]
  );

  return (
    <div className="space-y-6">
      {/* HERO DE LA HERRAMIENTA 1 */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-800 p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-200 text-xs font-black uppercase tracking-wider">
            <PieChart className="w-3.5 h-3.5" />
            Herramienta 1 · Geometría Circular y Proporciones
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
            Discos de Fracciones y Ángulos Centrales (MDF 3 mm)
          </h1>
          <p className="text-sm sm:text-base text-indigo-100 leading-relaxed">
            Basado en el módulo didáctico de Señas Láser y optimizado para la{' '}
            <strong>CR-Laser Falcon 2 10W</strong>. Corta el plato encajable de doble capa (6 mm total) y las{' '}
            <strong>fichas circulares con holgura mecánica de {config.toleranceMm.toFixed(2)} mm</strong>, grabando la fracción, el ángulo central o lectura Braille inclusiva.
          </p>
        </div>

        <div className="shrink-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 min-w-[180px] text-center">
          <span className="text-[11px] uppercase tracking-wider text-indigo-200 font-bold block">
            Sector Unitario
          </span>
          <span className="text-4xl font-black text-amber-300 block my-0.5">
            1/{config.denominator}
          </span>
          <span className="text-xs font-bold text-white block">
            {result.angleDeg}° · {Math.round((100 / config.denominator) * 10) / 10}%
          </span>
          <span className="text-[11px] font-mono text-indigo-200 mt-1 block">
            Área: {result.sectorAreaCm2} cm² c/u
          </span>
        </div>
      </div>

      {/* GRID INTERACTIVO: CONTROLES + SIMULADOR CIRCULAR EN VIVO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: CONFIGURACIÓN */}
        <div className="lg:col-span-7 space-y-6">
          {/* Paso 1: Denominador */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
                  1
                </span>
                División Geométrica del Disco (360° / n)
              </h2>
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200">
                Arco = {result.arcLengthMm} mm
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {DENOMINATOR_PRESETS.map((p) => {
                const selected = config.denominator === p.den;
                const deg = Math.round((360 / p.den) * 10) / 10;
                return (
                  <button
                    key={p.den}
                    type="button"
                    onClick={() => update('denominator', p.den)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer active:scale-95 flex flex-col justify-between ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/80 shadow-xs ring-2 ring-indigo-200'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xl font-black"
                        style={{ color: selected ? '#312e81' : p.color }}
                      >
                        1/{p.den}
                      </span>
                      {selected && (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <span className="text-xs font-extrabold text-slate-800 block">
                        {p.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {deg}° por pieza
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paso 2: Grabado en las Piezas + Tamaño del Plato */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-xs space-y-5">
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
                2
              </span>
              Grabado Láser en las Piezas y Tamaño del Plato
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(
                [
                  {
                    id: 'fraction_angle',
                    title: 'Fracción + Ángulo Central',
                    desc: `Graba "1/${config.denominator}" y "${result.angleDeg}°" en cada sector`,
                    icon: '📐',
                  },
                  {
                    id: 'fraction',
                    title: 'Solo Fracción Clásica',
                    desc: `Graba "1/${config.denominator}" grande y centrado (estilo Señas Láser)`,
                    icon: '🔢',
                  },
                  {
                    id: 'percent',
                    title: 'Porcentaje + Fracción',
                    desc: `Graba "${Math.round((100 / config.denominator) * 10) / 10}%" y "1/${config.denominator}"`,
                    icon: '📊',
                  },
                  {
                    id: 'braille',
                    title: 'Braille Táctil Inclusivo',
                    desc: 'Puntos circulares grabados para identificación inclusiva',
                    icon: '⠇',
                  },
                ] as {
                  id: FractionEngraveMode;
                  title: string;
                  desc: string;
                  icon: string;
                }[]
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => update('engraveMode', m.id)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    config.engraveMode === m.id
                      ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-200'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{m.icon}</span>
                    {config.engraveMode === m.id && (
                      <Check className="w-4 h-4 text-purple-700" />
                    )}
                  </div>
                  <div className="font-black text-xs sm:text-sm text-slate-900 mt-1">
                    {m.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {m.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Descifrador Braille educativo cuando está seleccionado */}
            {config.engraveMode === 'braille' && (
              <div className="bg-purple-950 text-white rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-amber-300 flex items-center gap-1.5 uppercase">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Celdas Braille Generadas para 1/{config.denominator}
                  </span>
                  <span className="font-mono text-purple-200">
                    {brailleData.cells.length} celdas
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {brailleData.cells.map((dots, idx) => (
                    <div
                      key={idx}
                      className="bg-purple-900/80 border border-purple-700 rounded-xl p-2 flex flex-col items-center gap-1"
                    >
                      <div className="grid grid-cols-2 gap-1 p-1 bg-purple-950/60 rounded-lg">
                        {[1, 4, 2, 5, 3, 6].map((d) => (
                          <span
                            key={d}
                            className={`w-3 h-3 rounded-full text-[8px] flex items-center justify-center font-bold ${
                              dots.includes(d)
                                ? 'bg-amber-300 text-purple-950'
                                : 'bg-purple-800/40 text-purple-500'
                            }`}
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-purple-200">
                        {brailleData.labels[idx]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de Diámetro del Plato */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 block">
                Tamaño Físico del Disco en MDF 3 mm:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(Object.keys(DISK_SIZE_SPECS) as DiskSizePreset[]).map((key) => {
                  const s = DISK_SIZE_SPECS[key];
                  const active = config.sizePreset === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => update('sizePreset', key)}
                      className={`p-3 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                        active
                          ? 'border-amber-600 bg-amber-50/70'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-black text-slate-900 block">
                        {s.label}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5 leading-tight">
                        {s.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Controles de Plato Base, Sello y Tolerancia */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeTray}
                    onChange={(e) => update('includeTray', e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-600"
                  />
                  <span>Incluir Plato Base + Aro Cavidad (6 mm total)</span>
                </label>

                <label className="inline-flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeSchoolStamp}
                    disabled={!config.includeTray}
                    onChange={(e) => update('includeSchoolStamp', e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-600"
                  />
                  <span>Grabar sello Liceo Bicentenario de Niñas de Maipú</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-black uppercase text-slate-500 flex items-center gap-1">
                  <Sliders className="w-3 h-3" /> Holgura Mecánica de Encaje:
                </span>
                <div className="inline-flex rounded-xl bg-slate-100 p-1 gap-1 w-full">
                  {[
                    { v: 0.15, lbl: '0.15 mm' },
                    { v: 0.2, lbl: '0.20 mm (Óptima)' },
                    { v: 0.3, lbl: '0.30 mm' },
                  ].map((t) => (
                    <button
                      key={t.v}
                      type="button"
                      onClick={() => update('toleranceMm', t.v)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-black cursor-pointer transition-all ${
                        config.toleranceMm === t.v
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-white'
                      }`}
                    >
                      {t.lbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: SIMULADOR INTERACTIVO DE FRACCIONES EQUIVALENTES */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Explorador Matemático Interactivo
            </span>
            <h3 className="text-lg font-black text-slate-900">
              Suma de Sectores y Equivalencia Angular
            </h3>
            <p className="text-xs text-slate-500">
              Toca las fichas o mueve el control para comprobar equivalencias de fracciones y grados:
            </p>
          </div>

          {/* Disco interactivo SVG */}
          <div className="flex flex-col items-center justify-center py-2">
            <svg
              viewBox="-135 -135 270 270"
              className="w-full max-w-[275px] h-auto select-none drop-shadow-sm"
            >
              {/* Aro exterior madera MDF */}
              <circle
                cx={0}
                cy={0}
                r={112}
                fill="#d6ad7c"
                stroke="#92400e"
                strokeWidth="2.5"
              />
              {/* Cavidad interior */}
              <circle
                cx={0}
                cy={0}
                r={96}
                fill="#f8fafc"
                stroke="#b45309"
                strokeWidth="2"
              />

              {/* Sectores clicables */}
              {Array.from({ length: config.denominator }).map((_, idx) => {
                const stepRad = (Math.PI * 2) / config.denominator;
                const a1 = -Math.PI / 2 + idx * stepRad;
                const a2 = a1 + stepRad;
                const mid = (a1 + a2) / 2;
                const isSelected = idx < safeActive;
                const r = 92;
                const ox = Math.cos(mid) * (isSelected ? explodePx : 1.5);
                const oy = Math.sin(mid) * (isSelected ? explodePx : 1.5);

                const x1 = ox + r * Math.cos(a1);
                const y1 = oy + r * Math.sin(a1);
                const x2 = ox + r * Math.cos(a2);
                const y2 = oy + r * Math.sin(a2);
                const largeArc = stepRad > Math.PI ? 1 : 0;
                const d = `M ${ox} ${oy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

                const lx = ox + r * 0.6 * Math.cos(mid);
                const ly = oy + r * 0.6 * Math.sin(mid);

                return (
                  <g
                    key={idx}
                    onClick={() => setActiveSlicesCount(idx + 1)}
                    className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  >
                    <path
                      d={d}
                      fill={isSelected ? currentPreset.color : '#edd2ae'}
                      fillOpacity={isSelected ? 0.92 : 0.65}
                      stroke={isSelected ? '#ffffff' : '#9a6b3b'}
                      strokeWidth="1.8"
                    />
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={config.denominator >= 10 ? '10' : '12'}
                      fontWeight="900"
                      fill={isSelected ? '#ffffff' : '#3f220f'}
                    >
                      1/{config.denominator}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Tarjeta de equivalencia matemática */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase block">
                  Fracción Seleccionada
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {safeActive}/{config.denominator}
                  {simpDen !== config.denominator && (
                    <span className="text-indigo-600 ml-2">
                      = {simpNum}/{simpDen}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-sm font-black text-indigo-700 block">
                  {sumAngle}° de 360°
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {sumPercent}% del disco
                </span>
              </div>
            </div>

            {/* Sliders de cantidad de fichas y apertura */}
            <div className="space-y-2 pt-2 border-t border-slate-200/80 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-600">
                  Fichas activas ({safeActive} de {config.denominator}):
                </span>
                <input
                  type="range"
                  min={1}
                  max={config.denominator}
                  value={safeActive}
                  onChange={(e) => setActiveSlicesCount(Number(e.target.value))}
                  className="w-36 accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-600">
                  Separación de despiece visual:
                </span>
                <input
                  type="range"
                  min={0}
                  max={18}
                  value={explodePx}
                  onChange={(e) => setExplodePx(Number(e.target.value))}
                  className="w-36 accent-amber-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ESTACIÓN DE VISTA PREVIA Y EXPORTACIÓN LÁSER */}
      <LaserSvgPreviewCard
        svgContent={result.svgContent}
        widthMm={result.widthMm}
        heightMm={result.heightMm}
        estimatedMinutes={result.estimatedMinutes}
        filename={`Feria_LBN_Maipu_Fracciones_1_${config.denominator}_MDF3mm.svg`}
        title={`Plano de Corte Láser: Disco de Fracciones 1/${config.denominator} (${result.outerDiameterMm} mm)`}
      />
    </div>
  );
}
