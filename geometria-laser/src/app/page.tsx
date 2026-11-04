'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Flame,
  Image as ImageIcon,
  KeyRound,
  Layers,
  PieChart,
  Printer,
  Scissors,
  Shapes,
  Sparkles,
} from 'lucide-react';

const TOOLS_CATALOG = [
  {
    number: 'Herramienta 1',
    href: '/fracciones',
    title: 'Discos de Fracciones y Ángulos',
    subtitle: 'Sectores circulares 1/2 a 1/12 · Plato encajable MDF 3 mm + Braille',
    description:
      'Genera platos didácticos de doble capa (6 mm total) y fichas de fracciones calibradas con 0,20 mm de holgura mecánica. Graba la fracción, el ángulo central (360°/n), porcentaje o lectura táctil Braille.',
    mathPills: ['Fracciones 1/n', 'Ángulo 360°/n', 'Área πr²/n', 'Braille'],
    timeBadge: 'Corte ~2.5 min',
    exportBadge: 'Exportación .SVG 1:1',
    gradient: 'from-indigo-600 to-violet-700',
    borderHover: 'hover:border-indigo-500',
    bgSoft: 'bg-indigo-50/70 border-indigo-200/80',
    icon: PieChart,
  },
  {
    number: 'Herramienta 2',
    href: '/poligonos',
    title: 'Tangram + Polígonos y Teselaciones',
    subtitle: 'Áreas proporcionales (1/4, 1/8, 1/16) y mosaicos de 360°',
    description:
      'Incluye el Tangram clásico con bandeja de encaje y fracciones de área grabadas, más un generador de Polígonos Regulares de arista común para comprobar teselaciones puras {3,4,6} y arquimedianas.',
    mathPills: ['Ángulo (n−2)·180°/n', 'Suma Vértice 360°', 'Apotema y Área'],
    timeBadge: 'Corte ~3.0 min',
    exportBadge: 'Exportación .SVG 1:1',
    gradient: 'from-amber-500 to-orange-600',
    borderHover: 'hover:border-orange-500',
    bgSoft: 'bg-amber-50/70 border-amber-200/80',
    icon: Shapes,
  },
  {
    number: 'Herramienta 3',
    href: '/espirografo',
    title: 'Espirógrafo Matemático (MCD/MCM)',
    subtitle: 'Anillo dentado interior + piñones planetarios cicloidales',
    description:
      'Fabrica engranajes reales en MDF 3 mm con perforaciones para lápiz y predice matemáticamente el número de pétalos y vueltas de la curva hipotrocoide usando el Máximo Común Divisor.',
    mathPills: ['Curvas Hipotrocoides', 'Pétalos = R / MCD(R,r)', 'Engranajes'],
    timeBadge: 'Corte ~4.0 min',
    exportBadge: 'Exportación .SVG 1:1',
    gradient: 'from-sky-600 to-blue-700',
    borderHover: 'hover:border-sky-500',
    bgSoft: 'bg-sky-50/70 border-sky-200/80',
    icon: Compass,
  },
  {
    number: 'Herramienta 4',
    href: '/imagen-laser',
    title: 'Imágenes Grabadas y Litofanías 3D',
    subtitle: 'Fotograbado láser en madera MDF 3 mm + Litofanía translúcida + QR Celular',
    description:
      'Envía una fotografía desde el celular escaneando un código QR en vivo y transfórmala en un fotograbado tramado con marco de corte láser (.SVG / .PNG) para CR Falcon 2 10W o en una Litofanía 3D (.STL) revelada a contraluz.',
    mathPills: [' Fotograbado MDF', 'Litofanía 3D (.STL)', 'Trama Jarvis / Atkinson', 'QR en Vivo'],
    timeBadge: 'Láser / 3D',
    exportBadge: '.SVG + .PNG + .STL',
    gradient: 'from-cyan-600 to-teal-700',
    borderHover: 'hover:border-cyan-500',
    bgSoft: 'bg-cyan-50/70 border-cyan-200/80',
    icon: ImageIcon,
  },
  {
    number: 'Herramienta 5',
    href: '/llaveros',
    title: 'Llaveros Inclusivos: Corte Láser y 3D',
    subtitle: 'Nombre + Braille Español o Lengua de Señas Chilena (LSCh)',
    description:
      'Generador unificado de llaveros personalizados: elige entre Nombre + Braille táctil de 6 puntos o señas anatómicas en Lengua de Señas Chilena (Cápsula 25 mm y Corazón Dúo 60 mm), listos para cortar en MDF 3 mm (.SVG) o imprimir en 3D (.STL / .ZIP).',
    mathPills: ['Nombre + Braille', 'Lengua de Señas Chilena', 'Corte Láser .SVG', 'Relieve 3D .STL'],
    timeBadge: '~1.5 – 6 min',
    exportBadge: '.SVG 1:1 + .STL / .ZIP',
    gradient: 'from-purple-600 to-pink-600',
    borderHover: 'hover:border-purple-500',
    bgSoft: 'bg-purple-50/70 border-purple-200/80',
    icon: KeyRound,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* BANNER PRINCIPAL FERIA CIENTÍFICA */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white p-6 sm:p-10 shadow-xl relative overflow-hidden border border-indigo-700/40">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Feria Científica Escolar · Maipú
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-indigo-100 text-xs font-bold">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                CR-Laser Falcon 2 · 10W (MDF 3 mm)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-cyan-100 text-xs font-bold">
                <Printer className="w-3.5 h-3.5 text-cyan-300" />
                Impresión 3D (.STL PLA)
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Geometría, Arte e Inclusión en Fabricación Digital
            </h1>

            <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
              Bienvenidas a la estación interactiva de diseño matemático y fabricación inclusiva del{' '}
              <strong className="text-amber-200">
                Liceo Bicentenario de Niñas de Maipú
              </strong>{' '}
              junto a <strong>MakerBox · Ingeniería UTalca</strong>. Explora 3 herramientas de{' '}
              <strong>Geometría en MDF 3 mm (.SVG 1:1)</strong>, <strong>Fotograbado y Litofanías 3D</strong>{' '}
              con conexión QR desde celular, y el <strong>Generador de Llaveros Inclusivos</strong> en Braille y Lengua de Señas Chilena.
            </p>
          </div>

          {/* Tarjeta resumen técnico del láser */}
          <div className="shrink-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 space-y-2.5 lg:w-72">
            <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Scissors className="w-4 h-4" />
              Estándar Vectorial 10W
            </span>
            <ul className="space-y-1.5 text-xs text-slate-100">
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                <span>
                  <strong>#FF0000:</strong> Corte MDF 3mm (400 mm/m · 100%)
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
                <span>
                  <strong>#0000FF:</strong> Marcado rápido (3000 mm/m · 40%)
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0" />
                <span>
                  <strong>#000000:</strong> Grabado relleno (3500 mm/m · 45%)
                </span>
              </li>
            </ul>
            <div className="pt-2 border-t border-white/15 text-[11px] font-mono text-indigo-200">
              Cama láser: 400 × 415 mm · Salida .SVG y .STL
            </div>
          </div>
        </div>
      </section>

      {/* CATÁLOGO DE LAS 5 HERRAMIENTAS */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TOOLS_CATALOG.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className={`group bg-white rounded-3xl border-2 border-slate-200 ${tool.borderHover} p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-black uppercase tracking-wider">
                    {tool.number}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {tool.timeBadge}
                  </span>
                </div>

                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${tool.gradient} text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 group-hover:text-indigo-700 transition-colors leading-snug">
                      {tool.title}
                    </h2>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                      {tool.subtitle}
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {tool.description}
                </p>

                <div className={`p-3 rounded-2xl border ${tool.bgSoft} flex flex-wrap gap-1.5`}>
                  {tool.mathPills.map((pill) => (
                    <span
                      key={pill}
                      className="px-2 py-0.5 rounded-lg bg-white/90 text-slate-800 text-[11px] font-bold border border-slate-200/70"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> {tool.exportBadge}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r ${tool.gradient} text-white text-xs font-black shadow-xs group-hover:translate-x-0.5 transition-transform`}
                >
                  <span>Abrir Herramienta</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      {/* NOTA INFORMATIVA INFERIOR */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong className="text-slate-900">
              Ingeniería Lista para el Stand de Feria Científica:
            </strong>{' '}
            Los planos láser exportan textos, tildes, señas y celdas Braille en geometría vectorial{' '}
            <code>&lt;path&gt;</code> a escala 1:1 en milímetros para <strong>CR-Laser Falcon 2 10W (MDF 3 mm)</strong>, mientras que los módulos 3D generan mallas binarias <code>.STL</code> y paquetes multicolor <code>.ZIP</code> listos para cualquier laminador FDM.
          </p>
        </div>
      </section>
    </div>
  );
}
