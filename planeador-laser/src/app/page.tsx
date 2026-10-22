'use client';

import React from 'react';
import Image from 'next/image';
import { GliderSection } from '@/components/GliderSection';
import { Award, Plane } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-purple-200 selection:text-purple-900 pb-20">
      <header className="w-full bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-xs backdrop-blur-md bg-white/95">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 sm:gap-6">
            <Image
              src="/logos/makerbox-color.jpg"
              alt="MakerBox - Co Creación e Innovación | Ingeniería UTalca"
              width={712}
              height={259}
              className="object-contain h-11 sm:h-14 w-auto"
              priority
            />
            <div className="h-9 w-px bg-slate-200" />
            <Image
              src="/logos/utalca-ingenieria.png"
              alt="Facultad de Ingeniería - Universidad de Talca"
              width={1024}
              height={368}
              className="object-contain h-9 sm:h-12 w-auto"
              priority
            />
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-extrabold">
            <Plane className="w-4 h-4 text-sky-600" />
            <span>Módulo CAD/CAM · Corte Láser Paramétrico</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <GliderSection />
      </main>

      <footer className="w-full bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600" />
            <span>
              <strong>MakerBox</strong> — Co Creación e Innovación · Facultad de Ingeniería, Universidad de Talca
            </span>
          </div>
          <div className="text-xs text-purple-700 font-bold">
            Configurador Vectorial de Planeador · Ensamble Garantizado
          </div>
        </div>
      </footer>
    </div>
  );
}
