'use client';

import React from 'react';
import Link from 'next/link';
import { WorkshopShell } from '@/components/WorkshopShell';
import {
  Plane,
  Sparkles,
  ArrowRight,
  Scissors,
  Ruler,
  Layers,
  CheckCircle2,
  Upload,
  Compass,
  Box,
  Clock,
} from 'lucide-react';

export default function HomePage() {
  return (
    <WorkshopShell
      activeBadgeText="Menú Principal · Talleres de Fabricación Digital"
      showHomeButton={false}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Hero Compacto de Bienvenida al Menú Multi-Taller */}
        <section className="rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white px-5 py-4 sm:px-8 sm:py-5 shadow-xl relative overflow-hidden border border-purple-700/40">
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-sky-400/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-5xl space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-amber-200 text-[11px] font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Plataforma Educativa MakerBox · Diseño y Manufactura Digital
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-snug">
              ¡Elige tu Taller de Diseño y Fabricación Digital!
            </h1>

            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed max-w-4xl">
              Bienvenido a la estación de diseño paramétrico. Selecciona el taller en el que estás trabajando hoy para personalizar tus piezas, verificar tolerancias de calce y descargar tus archivos listos para fabricar.
            </p>
          </div>
        </section>

        {/* Tarjetas de Selección Visual de los 3 Talleres */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TALLER 1: Dibujo Grupal + Rompecabezas Láser */}
          <Link
            href="/zoologico"
            className="group relative bg-white rounded-3xl border-2 border-amber-200 hover:border-amber-500 p-6 sm:p-8 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-amber-100/80 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

            <div className="space-y-5 relative z-10">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs uppercase tracking-wider border border-amber-300">
                  Taller 1
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  Contrachapado 3 mm
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-3xl shadow-md group-hover:scale-105 transition-transform shrink-0">
                  🧩
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                    Dibujo Grupal + Puzzle
                  </h2>
                  <p className="text-xs sm:text-sm font-bold text-amber-700">
                    Dibujo a Mano Alzada · Grabado 1.5 px · Corte Recto
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                Sube un <strong>único dibujo a mano alzada realizado en grupo (JPG/PNG)</strong>. La herramienta normaliza los trazos a <strong>1.5 px</strong>, incorpora el <strong>logo de MakerBox</strong> en una esquina despejada y genera un <strong>puzzle de 20 a 60 piezas</strong> con cortes rectos horizontales y verticales.
              </p>

              <ul className="space-y-2 text-xs font-semibold text-slate-700 bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4">
                <li className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Carga directa de 1 dibujo grupal a mano alzada (JPG/PNG)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Líneas de grabado fijas a 1.5 px + logo MakerBox sin cruzar trazos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Puzzle rectangular (20–60 piezas) con cortes rectos H/V sin encaje</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                Exportación directa para LightBurn (.SVG)
              </span>
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-xs sm:text-sm shadow-sm group-hover:shadow-md group-hover:translate-x-0.5 transition-all">
                <span>Abrir Taller 1</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* TALLER 2: Ingeniería de Vuelo (Planeadores) */}
          <Link
            href="/planeador"
            className="group relative bg-white rounded-3xl border-2 border-sky-200 hover:border-sky-500 p-6 sm:p-8 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-sky-100/80 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

            <div className="space-y-5 relative z-10">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-sky-100 text-sky-900 font-extrabold text-xs uppercase tracking-wider border border-sky-300">
                  Taller 2
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  Balsa 3 mm .SVG + Pesos PLA .STL
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center text-3xl shadow-md group-hover:scale-105 transition-transform shrink-0">
                  ✈️
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-sky-700 transition-colors">
                    Ingeniería de Vuelo
                  </h2>
                  <p className="text-xs sm:text-sm font-bold text-sky-700">
                    Planeador en Balsa · Contrapesos de Nariz 3D
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                Modifica el <strong>largo del fuselaje</strong>, la <strong>envergadura de alas</strong> y el <strong>ancho alar</strong> manteniendo el calce de <strong>3 mm</strong> y descargando los <strong>discos de contrapeso en PLA (.STL)</strong> para equilibrar el Centro de Gravedad.
              </p>

              <ul className="space-y-2 text-xs font-semibold text-slate-700 bg-sky-50/60 border border-sky-200/80 rounded-2xl p-4">
                <li className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Control de Fuselaje y Envergadura (170–260 mm) con gancho de elástico +2 mm</span>
                </li>
                <li className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Cálculo de Centro de Gravedad (CG) y kit de 3 discos ranurados PLA (.STL)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Distribución automática en 1 o 2 láminas de balsa de 300 × 100 × 3 mm</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                Corte Láser (.SVG) + Pesos Nariz (.STL)
              </span>
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-extrabold text-xs sm:text-sm shadow-sm group-hover:shadow-md group-hover:translate-x-0.5 transition-all">
                <span>Abrir Taller 2</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* TALLER 3: Desafío Tangrama CAD & Manufactura Híbrida */}
          <Link
            href="/tangrama"
            className="group relative bg-white rounded-3xl border-2 border-emerald-200 hover:border-emerald-500 p-6 sm:p-8 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-emerald-100/80 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

            <div className="space-y-5 relative z-10">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-xs uppercase tracking-wider border border-emerald-300">
                  Taller 3
                </span>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                  Láser .SVG + 3D .STL
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-3xl shadow-md group-hover:scale-105 transition-transform shrink-0">
                  📐
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Tangrama CAD Híbrido
                  </h2>
                  <p className="text-xs sm:text-sm font-bold text-emerald-700">
                    Trazado CAD · Reto por Equipos · Láser + Borde 3D
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                Supera en equipo un juego de ingeniería en dos fases: subdivide el cuadrado de <strong>100 × 100 mm</strong> mediante nodos magnéticos CAD y ensambla una de las <strong>5 siluetas clásicas</strong> contra reloj para desbloquear la manufactura híbrida.
              </p>

              <ul className="space-y-2 text-xs font-semibold text-slate-700 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4">
                <li className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Fase 1 Trazado CAD con snap magnético y validación en vivo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Fase 2 Rompecabezas Virtual (Cisne, Cohete, Gato, Casa, Barco)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Descarga .SVG personalizado (#FF0000/#0000FF) + Kit 4 Bordes .STL</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                Corte Láser (.SVG) + Impresión 3D (.STL)
              </span>
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs sm:text-sm shadow-sm group-hover:shadow-md group-hover:translate-x-0.5 transition-all">
                <span>Abrir Taller 3</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        </section>

        {/* Barra Informativa Inferior para Docentes y Estudiantes */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
            <div className="text-xs text-slate-600">
              <strong className="text-slate-900">Estándar de Fabricación MakerBox:</strong> Los tres talleres generan archivos parametrizados con unidades exactas en <strong>milímetros (mm)</strong>, trazos de corte láser en <strong className="text-red-600">#FF0000</strong>, grabado vectorial en <strong className="text-blue-600">#0000FF</strong> y mallas 3D listas para laminar en <strong>.STL</strong>.
            </div>
          </div>
        </section>
      </div>
    </WorkshopShell>
  );
}
