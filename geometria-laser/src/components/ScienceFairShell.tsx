'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Award,
  Compass,
  Cpu,
  Flame,
  Home,
  Info,
  PieChart,
  Ruler,
  Shapes,
  Sparkles,
  Triangle,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  FALCON_10W_MDF3MM_PARAMS,
  FALCON_BED_HEIGHT_MM,
  FALCON_BED_WIDTH_MM,
} from '@/lib/falconLaserSpec';

const NAV_ITEMS = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/fracciones', label: '1. Fracciones', icon: PieChart },
  { href: '/pitagoras', label: '2. Pitágoras', icon: Triangle },
  { href: '/poligonos', label: '3. Tangram y Polígonos', icon: Shapes },
  { href: '/espirografo', label: '4. Espirógrafo', icon: Compass },
  { href: '/instrumentos', label: '5. Plantilla Áurea', icon: Ruler },
];

interface ScienceFairShellProps {
  children: React.ReactNode;
}

export function ScienceFairShell({ children }: ScienceFairShellProps) {
  const pathname = usePathname();
  const [showFalconGuide, setShowFalconGuide] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-200 selection:text-indigo-950">
      {/* BARRA SUPERIOR INSTITUCIONAL */}
      <header className="w-full bg-white/95 border-b border-slate-200 sticky top-0 z-40 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          {/* Logos Institucionales + Liceo */}
          <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
            <Link href="/" className="flex items-center gap-3 sm:gap-4 group">
              <Image
                src="/logos/makerbox-color.jpg"
                alt="MakerBox - Co Creación e Innovación"
                width={712}
                height={259}
                className="object-contain h-9 sm:h-11 w-auto"
                priority
              />
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <Image
                src="/logos/utalca-ingenieria.png"
                alt="Facultad de Ingeniería - Universidad de Talca"
                width={1024}
                height={368}
                className="object-contain h-8 sm:h-10 w-auto hidden sm:block"
                priority
              />
            </Link>

            <div className="hidden lg:flex flex-col border-l border-slate-200 pl-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Feria Científica Escolar
              </span>
              <span className="text-xs font-extrabold text-slate-900">
                Liceo Bicentenario de Niñas de Maipú
              </span>
            </div>
          </div>

          {/* Botón de Parámetros CR Falcon 2 10W */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 text-orange-600" />
              <span>CR Falcon 2 · 10W · MDF 3 mm</span>
            </div>

            <button
              type="button"
              onClick={() => setShowFalconGuide(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-300" />
              <span>Parámetros Láser 10W</span>
            </button>
          </div>
        </div>

        {/* SUB-BARRA DE NAVEGACIÓN RÁPIDA ENTRE LAS 5 HERRAMIENTAS */}
        <div className="border-t border-slate-100 bg-slate-50/90">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white hover:text-indigo-700 border border-transparent hover:border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      {/* PIE DE PÁGINA */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Feria Científica · Liceo Bicentenario de Niñas de Maipú</strong> — Desarrollado junto a{' '}
              <strong>MakerBox · Ingeniería UTalca</strong>
            </span>
          </div>
          <div className="text-xs text-indigo-700 font-bold">
            Generador Vectorial SVG 1:1 · Creality CR-Laser Falcon 2 10W ({FALCON_BED_WIDTH_MM} × {FALCON_BED_HEIGHT_MM} mm · MDF 3 mm)
          </div>
        </div>
      </footer>

      {/* MODAL TÉCNICO: PARÁMETROS CR FALCON 2 10W EN LIGHTBURN */}
      {showFalconGuide && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowFalconGuide(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-[11px] font-black uppercase">
                  <Flame className="w-3.5 h-3.5" />
                  Ficha Operativa de Stand
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">
                  Configuración Creality CR-Laser Falcon 2 (10W)
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Parámetros calibrados para <strong>MDF de 3 mm</strong> en LightBurn / Creality Falcon Design Space
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFalconGuide(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 font-bold block">Área de Trabajo</span>
                <span className="text-base font-black text-slate-900">400 × 415 mm</span>
                <span className="text-[11px] text-emerald-700 font-semibold block">Escala SVG 1:1 en mm</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 font-bold block">Potencia Óptica</span>
                <span className="text-base font-black text-orange-600">10W Diodo (455 nm)</span>
                <span className="text-[11px] text-slate-500 block">Punto comprimido 0.06 mm</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 font-bold block">Material Feria</span>
                <span className="text-base font-black text-amber-800">MDF 3.0 mm</span>
                <span className="text-[11px] text-slate-500 block">Tolerancia encaje 0.20 mm</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-600" />
                Tabla de Capas Automáticas en LightBurn
              </h3>
              <div className="space-y-2.5">
                {FALCON_10W_MDF3MM_PARAMS.map((p) => (
                  <div
                    key={p.hex}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="w-5 h-5 rounded-full shrink-0 mt-0.5 border border-white shadow-xs"
                        style={{ backgroundColor: p.hex }}
                      />
                      <div>
                        <div className="font-black text-xs sm:text-sm text-slate-900">
                          {p.layerName} — <span className="text-indigo-700">{p.mode}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{p.notes}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono text-xs font-black">
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800">
                        {p.speedMmMin}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-orange-100 border border-orange-200 text-orange-900">
                        {p.powerPercent}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5 text-xs text-amber-950">
              <div className="font-black flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Checklist de Seguridad antes de presionar Start en la Feria:
              </div>
              <ul className="list-disc list-inside space-y-1 text-amber-900/90">
                <li>
                  Verifica en LightBurn que las unidades de velocidad estén en <strong>mm/min</strong> (¡nunca en mm/s!).
                </li>
                <li>
                  Ajusta la altura focal sobre la superficie del MDF de 3 mm usando el <strong>bloque metálico escalonado Creality</strong>.
                </li>
                <li>
                  Enciende la bomba de <strong>Air Assist</strong>, usa <strong>cama panal de abeja</strong> y gafas protectoras OD6+ (455 nm).
                </li>
                <li>
                  Todos los textos y fórmulas se exportan convertidos a <strong>curvas vectoriales puras (&lt;path&gt;)</strong>: no requieren instalar fuentes.
                </li>
              </ul>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowFalconGuide(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Entendido, volver al diseñador</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
