'use client';

import React, { useMemo, useState } from 'react';
import { Ruler, Sparkles, UserCheck } from 'lucide-react';
import {
  DEFAULT_GOLDEN_TEMPLATE_CONFIG,
  generateGoldenTemplateLaser,
  GOLDEN_RATIO_PHI,
  GoldenTemplateConfig,
} from '@/lib/goldenTemplateGenerator';
import { LaserSvgPreviewCard } from './LaserSvgPreviewCard';

export function GoldenTemplateSection() {
  const [config, setConfig] = useState<GoldenTemplateConfig>(
    DEFAULT_GOLDEN_TEMPLATE_CONFIG
  );
  // Ángulo de apertura del compás áureo en el simulador cinemático (grados)
  const [caliperAngleDeg, setCaliperAngleDeg] = useState<number>(58);

  const update = <K extends keyof GoldenTemplateConfig>(
    key: K,
    val: GoldenTemplateConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  };

  const result = useMemo(() => generateGoldenTemplateLaser(config), [config]);

  // Cinemática exacta del paralelogramo áureo O - A - T2 - B para el simulador interactivo
  const kinematic = useMemo(() => {
    const L = config.caliperTotalLegMm;
    const dB = L / GOLDEN_RATIO_PHI;
    const dA = L / (GOLDEN_RATIO_PHI * GOLDEN_RATIO_PHI);

    const halfRad = ((caliperAngleDeg / 2) * Math.PI) / 180;
    // Origen O arriba en (0, 0), piernas abriendo simétricamente hacia abajo (+Y)
    const eLx = -Math.sin(halfRad);
    const eLy = Math.cos(halfRad);
    const eRx = Math.sin(halfRad);
    const eRy = Math.cos(halfRad);

    const O: [number, number] = [0, 0];
    const A: [number, number] = [dA * eLx, dA * eLy];
    const B: [number, number] = [dB * eRx, dB * eRy];
    const T1: [number, number] = [L * eLx, L * eLy];
    const T3: [number, number] = [L * eRx, L * eRy];
    const T2: [number, number] = [A[0] + B[0], A[1] + B[1]];

    const segLeftMm = Math.hypot(T2[0] - T1[0], T2[1] - T1[1]);
    const segRightMm = Math.hypot(T3[0] - T2[0], T3[1] - T2[1]);
    const totalSpanMm = segLeftMm + segRightMm;

    return {
      O,
      A,
      B,
      T1,
      T2,
      T3,
      segLeftMm: Math.round(segLeftMm * 10) / 10,
      segRightMm: Math.round(segRightMm * 10) / 10,
      totalSpanMm: Math.round(totalSpanMm * 10) / 10,
      ratio: (segLeftMm / (segRightMm || 1)).toFixed(4),
      L,
    };
  }, [config.caliperTotalLegMm, caliperAngleDeg]);

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div className="rounded-3xl bg-gradient-to-r from-fuchsia-800 via-purple-800 to-indigo-900 p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-200 text-xs font-black uppercase tracking-wider">
            <Ruler className="w-3.5 h-3.5" />
            Herramienta 5 · Instrumentos Personalizables y Sucesión de Fibonacci
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
            Plantilla de Dibujo Matemático y Compás Áureo (Φ = 1,618)
          </h1>
          <p className="text-sm sm:text-base text-purple-100 leading-relaxed">
            ¡El recuerdo favorito para las estudiantes del{' '}
            <strong>Liceo Bicentenario de Niñas de Maipú</strong>! Personaliza con tu nombre una{' '}
            <strong>Regla-Transportador con esténcil de Parábola y Espiral de Fibonacci</strong>, o fabrica un{' '}
            <strong>Compás Articulado de Proporción Áurea</strong> en MDF 3 mm.
          </p>
        </div>

        <div className="shrink-0 bg-white/15 backdrop-blur-md p-1.5 rounded-2xl border border-white/25 flex flex-col gap-1.5 min-w-[245px]">
          <button
            type="button"
            onClick={() => update('instrumentType', 'math_stencil_ruler')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              config.instrumentType === 'math_stencil_ruler'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-white hover:bg-white/10'
            }`}
          >
            📐 Regla + Transportador + Parábola
          </button>
          <button
            type="button"
            onClick={() => update('instrumentType', 'golden_caliper')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              config.instrumentType === 'golden_caliper'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-white hover:bg-white/10'
            }`}
          >
            ✨ Compás Articulado Áureo (Φ)
          </button>
        </div>
      </div>

      {/* CONTROLES Y SIMULADOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-xs space-y-5">
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-purple-700 text-white text-xs font-black flex items-center justify-center">
              1
            </span>
            Personalización del Instrumento Matemático
          </h2>

          {/* Campo de Nombre Personalizado */}
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-purple-700" />
              Nombre o Curso para Grabar con Láser en la Madera:
            </label>
            <input
              type="text"
              maxLength={30}
              value={config.studentName}
              onChange={(e) => update('studentName', e.target.value)}
              placeholder="Ej: VALENTINA SOTO · 2° MEDIO A"
              className="w-full px-4 py-3 rounded-xl bg-white border-2 border-purple-200 focus:border-purple-600 outline-none font-black text-sm text-slate-900 uppercase"
            />
            <p className="text-[11px] text-purple-800/80">
              Admite tildes y letra Ñ: se convierte automáticamente en curvas vectoriales cerradas listas para LightBurn.
            </p>
          </div>

          {config.instrumentType === 'math_stencil_ruler' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-slate-600 block">
                  Largo de la Escala Milimetrada:
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  {([12, 15, 18] as const).map((cm) => (
                    <button
                      key={cm}
                      type="button"
                      onClick={() => update('rulerLengthCm', cm)}
                      className={`py-3 px-4 rounded-2xl border-2 font-black text-sm cursor-pointer transition-all ${
                        config.rulerLengthCm === cm
                          ? 'border-purple-600 bg-purple-50 text-purple-950'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      0 a {cm} cm ({cm * 10} mm)
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                <label className="flex items-center gap-2.5 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeParabolaAndPolygons}
                    onChange={(e) =>
                      update('includeParabolaAndPolygons', e.target.checked)
                    }
                    className="w-4 h-4 rounded accent-purple-600"
                  />
                  <span>
                    Calar esténcil de Parábola (y = x²), Triángulo Equilátero, Hexágono y Círculo
                  </span>
                </label>

                <label className="flex items-center gap-2.5 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeGoldenSpiralScore}
                    onChange={(e) =>
                      update('includeGoldenSpiralScore', e.target.checked)
                    }
                    className="w-4 h-4 rounded accent-purple-600"
                  />
                  <span>
                    Marcar en azul (#0000FF) la subdivisión de Cuadrados de Fibonacci y Espiral Áurea
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Longitud de los Brazos Principales (L):</span>
                  <span className="font-mono text-purple-700">
                    {config.caliperTotalLegMm} mm (Pivotes a{' '}
                    {result.caliperDimensions.mediumPivotMm} y{' '}
                    {result.caliperDimensions.shortPivotMm} mm)
                  </span>
                </div>
                <input
                  type="range"
                  min={110}
                  max={180}
                  step={2}
                  value={config.caliperTotalLegMm}
                  onChange={(e) =>
                    update('caliperTotalLegMm', Number(e.target.value))
                  }
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Con L = 144 mm obtienes la tripleta de Fibonacci clásica:{' '}
                  <strong>144 mm, 89 mm y 55 mm</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Diámetro de perforaciones de articulación:</span>
                  <span className="font-mono text-amber-700">
                    Ø {config.pivotHoleDiameterMm.toFixed(1)} mm
                  </span>
                </div>
                <input
                  type="range"
                  min={2.6}
                  max={4.2}
                  step={0.2}
                  value={config.pivotHoleDiameterMm}
                  onChange={(e) =>
                    update('pivotHoleDiameterMm', Number(e.target.value))
                  }
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <span className="text-[11px] text-slate-400 block">
                  Usa 4 tornillos M3 × 10 mm con tuerca o remaches rápidos para armar el compás en el stand.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: DEMOSTRADOR INTERACTIVO DE LA PROPORCIÓN ÁUREA Φ */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Simulador Cinemático Φ = (1 + √5) / 2
            </span>
            <h3 className="text-lg font-black text-slate-900">
              Invariancia del Compás de Proporción Áurea
            </h3>
            <p className="text-xs text-slate-500">
              Abre o cierra el compás: la punta central siempre divide la abertura total en razón <strong>Φ = 1,6180</strong>:
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 flex items-center justify-center">
            <svg
              viewBox={`${-kinematic.L * 0.92} -14 ${kinematic.L * 1.84} ${
                kinematic.L + 30
              }`}
              className="w-full max-h-[245px] select-none"
            >
              {/* Eslabones interiores del paralelogramo */}
              <line
                x1={kinematic.A[0]}
                y1={kinematic.A[1]}
                x2={kinematic.T2[0]}
                y2={kinematic.T2[1]}
                stroke="#a855f7"
                strokeWidth="5.5"
                strokeLinecap="round"
              />
              <line
                x1={kinematic.B[0]}
                y1={kinematic.B[1]}
                x2={kinematic.T2[0]}
                y2={kinematic.T2[1]}
                stroke="#c084fc"
                strokeWidth="5.5"
                strokeLinecap="round"
              />

              {/* Brazos exteriores */}
              <line
                x1={kinematic.O[0]}
                y1={kinematic.O[1]}
                x2={kinematic.T1[0]}
                y2={kinematic.T1[1]}
                stroke="#b45309"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <line
                x1={kinematic.O[0]}
                y1={kinematic.O[1]}
                x2={kinematic.T3[0]}
                y2={kinematic.T3[1]}
                stroke="#d97706"
                strokeWidth="7"
                strokeLinecap="round"
              />

              {/* Segmento colineal entre las 3 puntas T1 - T2 - T3 */}
              <line
                x1={kinematic.T1[0]}
                y1={kinematic.T1[1]}
                x2={kinematic.T2[0]}
                y2={kinematic.T2[1]}
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeDasharray="4 3"
              />
              <line
                x1={kinematic.T2[0]}
                y1={kinematic.T2[1]}
                x2={kinematic.T3[0]}
                y2={kinematic.T3[1]}
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="4 3"
              />

              {/* Pernos de articulación */}
              {[
                kinematic.O,
                kinematic.A,
                kinematic.B,
                kinematic.T1,
                kinematic.T2,
                kinematic.T3,
              ].map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt[0]}
                  cy={pt[1]}
                  r={idx >= 3 ? 3.5 : 4}
                  fill={idx >= 3 ? '#ef4444' : '#ffffff'}
                  stroke="#0f172a"
                  strokeWidth="1.8"
                />
              ))}
            </svg>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex justify-between font-bold text-slate-700">
              <span>Ángulo de abertura ({caliperAngleDeg}°):</span>
              <span className="font-mono text-purple-700 font-black">
                Razón A/B = {kinematic.ratio}
              </span>
            </div>
            <input
              type="range"
              min={22}
              max={125}
              value={caliperAngleDeg}
              onChange={(e) => setCaliperAngleDeg(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="bg-sky-50 border border-sky-200 p-2 rounded-xl text-sky-900">
                Tramo Mayor A: <strong>{kinematic.segLeftMm} mm</strong>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-emerald-900">
                Tramo Menor B: <strong>{kinematic.segRightMm} mm</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PREVISUALIZACIÓN Y DESCARGA SVG */}
      <LaserSvgPreviewCard
        svgContent={result.svgContent}
        widthMm={result.widthMm}
        heightMm={result.heightMm}
        estimatedMinutes={result.estimatedMinutes}
        filename={
          config.instrumentType === 'math_stencil_ruler'
            ? `Feria_LBN_Maipu_Plantilla_Matematica_${config.rulerLengthCm}cm_MDF3mm.svg`
            : `Feria_LBN_Maipu_Compas_Aureo_${config.caliperTotalLegMm}mm_MDF3mm.svg`
        }
        title={
          config.instrumentType === 'math_stencil_ruler'
            ? `Plano de Corte Láser: Regla-Transportador y Esténcil Matemático (${config.rulerLengthCm} cm)`
            : `Plano de Corte Láser: Compás Articulado de Proporción Áurea Φ = 1,618`
        }
      />
    </div>
  );
}
