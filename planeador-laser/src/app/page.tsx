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
} from 'lucide-react';

export default function HomePage() {
  return (
    <WorkshopShell
      activeBadgeText="Menú Principal · Talleres de Fabricación Digital"
      showHomeButton={false}
    >
      <div className="space-y-8 animate-fade-in">
        {/* Hero de Bienvenida al Menú Multi-Taller */}
        <section className="rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-10 shadow-xl relative overflow-hidden border border-purple-700/40">
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-sky-400/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-amber-200 text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Plataforma Educativa MakerBox · Corte Láser en Madera de Balsa (300 × 100 × 3 mm)
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              ¡Elige tu Taller de Diseño y Fabricación Láser!
            </h1>

            <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
              Bienvenido a la estación de diseño paramétrico. Selecciona el taller en el que estás trabajando hoy para personalizar tus piezas, verificar el calce de las ranuras de <strong>3 mm</strong> y descargar tu archivo <strong>.SVG listo para cortar en LightBurn</strong>.
            </p>
          </div>
        </section>

        {/* Tarjetas de Selección Visual de los 2 Talleres */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* TALLER 1: Zoológico Low-Poly */}
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
                  Madera Balsa 3 mm
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-3xl shadow-md group-hover:scale-105 transition-transform shrink-0">
                  🦊
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                    Zoológico Low-Poly
                  </h2>
                  <p className="text-xs sm:text-sm font-bold text-amber-700">
                    Escalado Geométrico y Ranuras de Soporte
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                Sube la silueta vectorial <strong>.SVG</strong> de tu animal poligonal, elige la <strong>altura deseada en milímetros</strong> y genera automáticamente las <strong>2 ranuras inferiores de 3 × 15 mm</strong> para pararlo sobre su base.
              </p>

              <ul className="space-y-2 text-xs font-semibold text-slate-700 bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4">
                <li className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Zona de carga (Dropzone) para subir tu animal SVG + ejemplos Low-Poly</span>
                </li>
                <li className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Escalado automático proporcional según la altura deseada (mm)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Sustracción automática de 2 ranuras verticales (3 mm × 15 mm) en la base</span>
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
                  Madera Balsa 3 mm
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
                    Diseño Paramétrico de Planeadores a Escala
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                Modifica el <strong>largo del fuselaje</strong>, la <strong>envergadura de alas</strong> y el <strong>ancho alar</strong> manteniendo intacto el calce de las ranuras de <strong>3 mm</strong> y analizando el área alar en tiempo real.
              </p>

              <ul className="space-y-2 text-xs font-semibold text-slate-700 bg-sky-50/60 border border-sky-200/80 rounded-2xl p-4">
                <li className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Control de Fuselaje y Envergadura (170–260 mm) con 0 cruces de líneas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Telemetría aerodinámica: Área Alar (cm²), Alargamiento (AR) y Estabilidad</span>
                </li>
                <li className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Distribución automática en 1 o 2 láminas de balsa de 300 × 100 × 3 mm</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                Exportación directa para LightBurn (.SVG)
              </span>
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-extrabold text-xs sm:text-sm shadow-sm group-hover:shadow-md group-hover:translate-x-0.5 transition-all">
                <span>Abrir Taller 2</span>
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
              <strong className="text-slate-900">Estándar de Fabricación MakerBox:</strong> Ambos talleres generan archivos vectoriales con unidades exactas en <strong>milímetros (mm)</strong>, trazos de corte cerrados en color <strong className="text-red-600">#FF0000</strong> y tolerancia para planchas de madera de balsa de <strong>300 × 100 × 3 mm</strong>.
            </div>
          </div>
        </section>
      </div>
    </WorkshopShell>
  );
}
