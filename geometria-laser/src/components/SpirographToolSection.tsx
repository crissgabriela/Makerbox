'use client';

import React, { useMemo, useState } from 'react';
import { Compass, Sparkles } from 'lucide-react';
import {
  DEFAULT_SPIROGRAPH_CONFIG,
  generateSpirographLaser,
  SpirographConfig,
} from '@/lib/spirographLaserGenerator';
import { LaserSvgPreviewCard } from './LaserSvgPreviewCard';

const RING_TEETH_OPTIONS = [48, 60, 72, 84];
const GEAR_TEETH_OPTIONS = [15, 16, 18, 20, 21, 24, 28, 30, 32, 36, 40, 45];

export function SpirographToolSection() {
  const [config, setConfig] = useState<SpirographConfig>(
    DEFAULT_SPIROGRAPH_CONFIG
  );
  const [previewGearSlot, setPreviewGearSlot] = useState<1 | 2>(1);

  const update = <K extends keyof SpirographConfig>(
    key: K,
    val: SpirographConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  };

  const result = useMemo(() => generateSpirographLaser(config), [config]);

  const activeAnalysis =
    previewGearSlot === 2 && result.secondaryAnalysis
      ? result.secondaryAnalysis
      : result.primaryAnalysis;

  const curvePathD = useMemo(() => {
    if (activeAnalysis.curvePoints.length === 0) return '';
    return activeAnalysis.curvePoints
      .map(
        ([x, y], idx) =>
          `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
      )
      .join(' ');
  }, [activeAnalysis]);

  const viewExtent = activeAnalysis.ringPitchRadiusMm + 8;

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-900 p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-sky-200 text-xs font-black uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            Herramienta 4 · Curvas Paramétricas, MCD y MCM
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
            Espirógrafo Matemático de Engranajes (MDF 3 mm)
          </h1>
          <p className="text-sm sm:text-base text-sky-100 leading-relaxed">
            Genera un <strong>anillo estator dentado interior</strong> y{' '}
            <strong>piñones planetarios reales</strong> con perfil cicloidal redondeado resistente para MDF 3 mm. Descubre cómo el{' '}
            <strong>Máximo Común Divisor MCD(Z_anillo, Z_piñón)</strong> predice exactamente el número de pétalos y vueltas de la curva hipotrocoide.
          </p>
        </div>

        <div className="shrink-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 min-w-[195px] text-center">
          <span className="text-[11px] uppercase tracking-wider text-sky-200 font-bold block">
            Pétalos de la Curva
          </span>
          <span className="text-4xl font-black text-amber-300 block my-0.5">
            {activeAnalysis.petalsCount}
          </span>
          <span className="text-xs font-bold text-white block">
            Se cierra en {activeAnalysis.revolutionsToClose} vueltas
          </span>
          <span className="text-[11px] font-mono text-sky-200 mt-1 block">
            MCD({activeAnalysis.ringTeeth}, {activeAnalysis.gearTeeth}) ={' '}
            {activeAnalysis.divisorGcd}
          </span>
        </div>
      </div>

      {/* CONTROLES + SIMULADOR HIPOTROCOIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-xs space-y-5">
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-sky-600 text-white text-xs font-black flex items-center justify-center">
              1
            </span>
            Relación de Dientes (Z_anillo y Z_piñón)
          </h2>

          {/* Dientes del Anillo */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-slate-600 block">
              Dientes del Anillo Estator Interior (Z_R):
            </span>
            <div className="grid grid-cols-4 gap-2">
              {RING_TEETH_OPTIONS.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => {
                    setConfig((prev) => ({
                      ...prev,
                      ringTeeth: z,
                      gear1Teeth: Math.min(z - 8, prev.gear1Teeth),
                      gear2Teeth: Math.min(z - 8, prev.gear2Teeth),
                    }));
                  }}
                  className={`py-2.5 px-3 rounded-2xl border-2 font-black text-sm cursor-pointer transition-all ${
                    config.ringTeeth === z
                      ? 'border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-200'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  Z = {z}
                </button>
              ))}
            </div>
          </div>

          {/* Dientes del Piñón 1 */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-slate-600 block">
              Dientes del Piñón Planetario Principal (Z_1):
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {GEAR_TEETH_OPTIONS.filter((g) => g <= config.ringTeeth - 8).map(
                (g) => {
                  const pCount = config.ringTeeth / (
                    (() => {
                      let a = config.ringTeeth,
                        b = g;
                      while (b) [a, b] = [b, a % b];
                      return a;
                    })()
                  );
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        update('gear1Teeth', g);
                        setPreviewGearSlot(1);
                      }}
                      className={`p-2 rounded-xl border-2 text-center cursor-pointer transition-all ${
                        config.gear1Teeth === g
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-950'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-black block">Z={g}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {pCount} pét.
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Segundo Piñón Opcional */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="inline-flex items-center gap-2.5 text-xs font-black text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeSecondGear}
                onChange={(e) => {
                  update('includeSecondGear', e.target.checked);
                  if (!e.target.checked) setPreviewGearSlot(1);
                }}
                className="w-4 h-4 rounded accent-sky-600"
              />
              <span>Incluir un 2° Piñón Extra en la misma plancha MDF 3 mm</span>
            </label>

            {config.includeSecondGear && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-600">
                  Dientes Piñón 2:
                </span>
                {[15, 16, 18, 20, 24, 30, 32, 36]
                  .filter((g) => g <= config.ringTeeth - 8)
                  .map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        update('gear2Teeth', g);
                        setPreviewGearSlot(2);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer ${
                        config.gear2Teeth === g
                          ? 'bg-sky-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      Z={g}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Módulo mecánico y diámetro punta de lápiz */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Módulo del diente (m):</span>
                <span className="font-mono text-sky-700">{config.moduleMm.toFixed(1)} mm</span>
              </div>
              <input
                type="range"
                min={1.6}
                max={2.4}
                step={0.1}
                value={config.moduleMm}
                onChange={(e) => update('moduleMm', Number(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">
                Paso circular p = {(Math.PI * config.moduleMm).toFixed(2)} mm
              </span>
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Orificios para lápiz:</span>
                <span className="font-mono text-amber-700">Ø {config.penHoleDiameterMm.toFixed(1)} mm</span>
              </div>
              <input
                type="range"
                min={2.4}
                max={4.2}
                step={0.2}
                value={config.penHoleDiameterMm}
                onChange={(e) =>
                  update('penHoleDiameterMm', Number(e.target.value))
                }
                className="w-full accent-amber-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">
                3.2 mm ideal para bolígrafo / tiralíneas escolar
              </span>
            </div>
          </div>
        </div>

        {/* SIMULADOR MATEMÁTICO DE LA CURVA HIPOTROCOIDE */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Trazador Paramétrico en Vivo
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Curva Hipotrocoide Resultante
              </h3>
            </div>

            {config.includeSecondGear && (
              <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setPreviewGearSlot(1)}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    previewGearSlot === 1
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-600'
                  }`}
                >
                  Z1={config.gear1Teeth}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewGearSlot(2)}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    previewGearSlot === 2
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-600'
                  }`}
                >
                  Z2={config.gear2Teeth}
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-950 rounded-2xl p-4 flex items-center justify-center">
            <svg
              viewBox={`${-viewExtent} ${-viewExtent} ${viewExtent * 2} ${
                viewExtent * 2
              }`}
              className="w-full max-w-[255px] h-auto"
            >
              <circle
                cx={0}
                cy={0}
                r={activeAnalysis.ringPitchRadiusMm}
                fill="none"
                stroke="#334155"
                strokeWidth={viewExtent * 0.015}
                strokeDasharray="3 3"
              />
              <path
                d={curvePathD}
                fill="none"
                stroke="#38bdf8"
                strokeWidth={viewExtent * 0.018}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Selector de orificio del lápiz 1..4 */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">
                Agujero del lápiz (distancia d/r):
              </span>
              <div className="inline-flex gap-1">
                {[0, 1, 2, 3].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => update('activePenHoleIndex', idx)}
                    className={`w-7 h-7 rounded-lg font-black cursor-pointer ${
                      config.activePenHoleIndex === idx
                        ? 'bg-sky-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    #{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block">MCD({activeAnalysis.ringTeeth}, {activeAnalysis.gearTeeth})</span>
                <span className="font-black text-slate-900 text-sm">
                  {activeAnalysis.divisorGcd}
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block">MCM({activeAnalysis.ringTeeth}, {activeAnalysis.gearTeeth})</span>
                <span className="font-black text-indigo-700 text-sm">
                  {activeAnalysis.multipleLcm} dientes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EXPORTACIÓN LÁSER */}
      <LaserSvgPreviewCard
        svgContent={result.svgContent}
        widthMm={result.widthMm}
        heightMm={result.heightMm}
        estimatedMinutes={result.estimatedMinutes}
        filename={`Feria_LBN_Maipu_Espirografo_Z${config.ringTeeth}_Z${config.gear1Teeth}_MDF3mm.svg`}
        title={`Plano de Corte Láser: Espirógrafo Z=${config.ringTeeth} + Piñones Planetarios`}
      />
    </div>
  );
}
