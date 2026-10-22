'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Award, Home, Sparkles } from 'lucide-react';

interface WorkshopShellProps {
  children: React.ReactNode;
  activeBadgeText?: string;
  showHomeButton?: boolean;
  onHomeClick?: () => void;
}

export function WorkshopShell({
  children,
  activeBadgeText = 'Plataforma Multi-Taller · Corte Láser Educativo',
  showHomeButton = false,
  onHomeClick,
}: WorkshopShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-purple-200 selection:text-purple-900 pb-20">
      <header className="w-full bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-xs backdrop-blur-md bg-white/95">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" onClick={onHomeClick} className="flex items-center gap-4 sm:gap-6">
              <Image
                src="/logos/makerbox-color.jpg"
                alt="MakerBox - Co Creación e Innovación | Ingeniería UTalca"
                width={712}
                height={259}
                className="object-contain h-10 sm:h-13 w-auto"
                priority
              />
              <div className="h-9 w-px bg-slate-200" />
              <Image
                src="/logos/utalca-ingenieria.png"
                alt="Facultad de Ingeniería - Universidad de Talca"
                width={1024}
                height={368}
                className="object-contain h-9 sm:h-11 w-auto"
                priority
              />
            </Link>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {showHomeButton &&
              (onHomeClick ? (
                <button
                  type="button"
                  onClick={onHomeClick}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Volver al Menú Principal</span>
                </button>
              ) : (
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-xs transition-colors"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Volver al Menú Principal</span>
                </Link>
              ))}

            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-extrabold">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>{activeBadgeText}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
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
            Talleres de Fabricación Digital · Madera de Balsa 300 × 100 × 3 mm
          </div>
        </div>
      </footer>
    </div>
  );
}
