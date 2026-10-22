'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { GliderSection } from '@/components/GliderSection';
import { Award, ArrowLeft } from 'lucide-react';

export default function PlaneadorPage() {
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

          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-800 hover:text-purple-900 font-bold text-xs sm:text-sm border border-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Menú MakerBox</span>
          </Link>
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
            Módulo de Diseño Paramétrico de Planeador · Corte Láser
          </div>
        </div>
      </footer>
    </div>
  );
}
