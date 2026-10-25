'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Triangle,
} from 'lucide-react';
import {
  DEFAULT_PYTHAGORAS_CONFIG,
  generatePythagorasLaser,
  PYTHAGORAS_PRESETS,
  PythagorasBoardMode,
  PythagorasLaserConfig,
} from '@/lib/pythagorasLaserGenerator';
import { polygonToSvgPath } from '@/lib/falconLaserSpec';
import { LaserSvgPreviewCard } from './LaserSvgPreviewCard';

export function PythagorasToolSection() {
  const [config, setConfig] = useState<PythagorasLaserConfig>(
    DEFAULT_PYTHAGORAS_CONFIG
  );
  // Parámetro t ∈ [0, 1] de la demostración geométrica de Perigal (t=0 en catetos, t=1 en hipotenusa)
  const [progress, setProgress] = useState<number>(0);
  const [animating, setAnimating] = useState<boolean>(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const update = <K extends keyof PythagorasLaserConfig>(
    key: K,
    val: PythagorasLaserConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  };

  useEffect(() => {
    if (!animating) return;
    const id = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + direction * 0.025;
        if (next >= 1) {
          setAnimating(false);
          setDirection(-1);
          return 1;
        }
        if (next <= 0) {
          setAnimating(false);
          setDirection(1);
          return 0;
        }
        return Math.round(next * 1000) / 1000;
      });
    }, 24);
    return () => window.clearInterval(id);
  }, [animating, direction]);

  const result = useMemo(() => generatePythagorasLaser(config), [config]);
  const geo = result.geometry;

  const aU = Math.min(config.aUnits, config.bUnits);
  const bU = Math.max(config.aUnits, config.bUnits);
  const aSq = Math.round(aU * aU * 100) / 100;
  const bSq = Math.round(bU * bU * 100) / 100;
  const cSq = Math.round((aSq + bSq) * 100) / 100;

  // Función de suavizado easeInOutCubic para la demostración visual
  const eased =
    progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

  const pad = 14;
  const vbX = geo.bounds.minX - pad;
  const vbY = geo.bounds.minY - pad;
  const vbW = geo.bounds.width + pad * 2;
  const vbH = geo.bounds.height + pad * 2;

  const handleTogglePlay = () => {
    if (progress >= 0.99) setDirection(-1);
    else if (progress <= 0.01) setDirection(1);
    setAnimating((a) => !a);
  };

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-200 text-xs font-black uppercase tracking-wider">
            <Triangle className="w-3.5 h-3.5" />
            Herramienta 2 · Demostración por Equidescomposición
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
            Rompecabezas del Teorema de Pitágoras (Disección de Perigal)
          </h1>
          <p className="text-sm sm:text-base text-emerald-50 leading-relaxed">
            ¡Demuestra con tus propias manos en madera MDF de 3 mm que{' '}
            <strong>a² + b² = c²</strong>! Al cortar el cuadrado mayor en los{' '}
            <strong>4 cuadriláteros congruentes de Henry Perigal (1873)</strong>, las 5 piezas encajan tanto sobre los dos catetos como dentro del cuadrado de la hipotenusa por pura traslación.
          </p>
        </div>

        <div className="shrink-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 min-w-[205px] text-center">
          <span className="text-[11px] uppercase tracking-wider text-emerald-200 font-bold block">
            Identidad Pitagórica
          </span>
          <span className="text-2xl sm:text-3xl font-black text-amber-300 block my-1">
            {aSq} + {bSq} = {cSq}
          </span>
          <span className="text-xs font-bold text-white block">
            a={aU} · b={bU} · c={geo.cUnits}
          </span>
          <span className="text-[11px] font-mono text-emerald-100 mt-1 block">
            Ángulos: {geo.alphaDeg}° · {geo.betaDeg}° · 90°
          </span>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CONTROLES */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center">
                1
              </span>
              Elige una Terna Pitagórica o Ajusta los Catetos
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PYTHAGORAS_PRESETS.map((p) => {
                const isSelected =
                  config.aUnits === p.a && config.bUnits === p.b;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setConfig((prev) => ({
                        ...prev,
                        aUnits: p.a,
                        bUnits: p.b,
                        unitScaleMm: p.defaultUnitMm,
                      }));
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md">
                        {p.badge}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-teal-700" />}
                    </div>
                    <div className="text-xs sm:text-sm font-black text-slate-900 mt-1.5">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Hipotenusa c = {p.cLabel}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sliders personalizados */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Cateto a:</span>
                  <span className="font-mono text-teal-700">{config.aUnits} u</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={12}
                  step={1}
                  value={config.aUnits}
                  onChange={(e) => update('aUnits', Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Cateto b:</span>
                  <span className="font-mono text-teal-700">{config.bUnits} u</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={15}
                  step={1}
                  value={config.bUnits}
                  onChange={(e) => update('bUnits', Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Escala física:</span>
                  <span className="font-mono text-amber-700">{config.unitScaleMm} mm/u</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={15}
                  step={0.5}
                  value={config.unitScaleMm}
                  onChange={(e) => update('unitScaleMm', Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Paso 2: Formato de Tablero MDF 3mm */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center">
                2
              </span>
              Tipo de Tablero para Cortar en MDF 3 mm
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  {
                    id: 'engraved_base_plus_pieces',
                    title: 'Tablero Guía + 6 Piezas (Rápido)',
                    desc: '1 placa base con las cuadrículas grabadas + las 6 piezas móviles. Ideal para producir muchos kits en la Feria.',
                  },
                  {
                    id: 'double_tray',
                    title: 'Bandeja Encajable Doble Capa (6 mm)',
                    desc: 'Incluye marco superior calado para pegar sobre la base y encajar físicamente las piezas dentro de las cavidades.',
                  },
                ] as { id: PythagorasBoardMode; title: string; desc: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => update('boardMode', opt.id)}
                  className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                    config.boardMode === opt.id
                      ? 'border-amber-600 bg-amber-50/70'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-black text-slate-900">
                    {opt.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
              <label className="inline-flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.engraveFormulas}
                  onChange={(e) => update('engraveFormulas', e.target.checked)}
                  className="w-4 h-4 rounded accent-teal-600"
                />
                <span>Grabar áreas y ángulos sobre las piezas</span>
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
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tol.toFixed(2)}mm
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* DEMOSTRADOR ANIMADO EN TIEMPO REAL */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-teal-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Simulador Interactivo de Perigal
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Traslación Pura: de a² + b² hacia c²
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-xs cursor-pointer"
              >
                {animating ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>
                      {progress > 0.5 ? 'Volver a Catetos' : 'Demostrar a²+b²=c²'}
                    </span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAnimating(false);
                  setProgress(0);
                  setDirection(1);
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                title="Reiniciar en catetos"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lienzo SVG interactivo */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 flex items-center justify-center min-h-[300px]">
            <svg
              viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
              className="w-full max-h-[320px] select-none"
            >
              {/* Contornos de los 3 cuadrados vacíos */}
              <path
                d={polygonToSvgPath(geo.squareAPoints)}
                fill="#e0f2fe"
                fillOpacity={0.35}
                stroke="#0284c7"
                strokeWidth={vbW * 0.005}
                strokeDasharray={`${vbW * 0.015} ${vbW * 0.01}`}
              />
              <path
                d={polygonToSvgPath(geo.squareBPoints)}
                fill="#ede9fe"
                fillOpacity={0.35}
                stroke="#7c3aed"
                strokeWidth={vbW * 0.005}
                strokeDasharray={`${vbW * 0.015} ${vbW * 0.01}`}
              />
              <path
                d={polygonToSvgPath(geo.squareCPoints)}
                fill="#fef3c7"
                fillOpacity={0.4}
                stroke="#d97706"
                strokeWidth={vbW * 0.006}
              />

              {/* Triángulo Rectángulo Central */}
              <path
                d={polygonToSvgPath(geo.trianglePoints)}
                fill="#1e293b"
                stroke="#0f172a"
                strokeWidth={vbW * 0.005}
              />

              {/* Las 5 piezas móviles interpoladas sin rotación */}
              {geo.pieces.map((piece) => {
                const interpPts: [number, number][] = piece.sourcePoints.map(
                  (sp, idx) => {
                    const tp = piece.targetPoints[idx];
                    return [
                      sp[0] + (tp[0] - sp[0]) * eased,
                      sp[1] + (tp[1] - sp[1]) * eased,
                    ];
                  }
                );
                const cx =
                  piece.sourceCenter[0] +
                  (piece.targetCenter[0] - piece.sourceCenter[0]) * eased;
                const cy =
                  piece.sourceCenter[1] +
                  (piece.targetCenter[1] - piece.sourceCenter[1]) * eased;

                return (
                  <g key={piece.id}>
                    <path
                      d={polygonToSvgPath(interpPts)}
                      fill={piece.color}
                      fillOpacity={0.88}
                      stroke="#ffffff"
                      strokeWidth={vbW * 0.0045}
                    />
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={vbW * 0.036}
                      fontWeight="900"
                      fill="#ffffff"
                    >
                      {piece.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Slider manual de traslación */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold">
              <span className="text-sky-800">0% · En Catetos (a² + b²)</span>
              <span className="font-mono text-slate-600">
                Traslación: {Math.round(progress * 100)}%
              </span>
              <span className="text-amber-800">100% · En Hipotenusa (c²)</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={progress}
              onChange={(e) => {
                setAnimating(false);
                setProgress(Number(e.target.value));
              }}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Cotas reales: <strong>a = {geo.aMm} mm</strong> · <strong>b = {geo.bMm} mm</strong> ·{' '}
              <strong>c = {geo.cMm} mm</strong>. Observa que ninguna pieza gira: solo se trasladan paralelamente.
            </p>
          </div>
        </div>
      </div>

      {/* VISTA PREVIA Y DESCARGA SVG */}
      <LaserSvgPreviewCard
        svgContent={result.svgContent}
        widthMm={result.widthMm}
        heightMm={result.heightMm}
        estimatedMinutes={result.estimatedMinutes}
        filename={`Feria_LBN_Maipu_Pitagoras_${aU}_${bU}_MDF3mm.svg`}
        title={`Plano de Corte Láser: Rompecabezas de Pitágoras (${aU}² + ${bU}² = ${cSq})`}
      />
    </div>
  );
}
