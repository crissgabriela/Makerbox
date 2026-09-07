'use client';

import React from 'react';
import Image from 'next/image';
import { Sparkles, BookOpen, HelpCircle } from 'lucide-react';

interface HeaderProps {
  activeTool: 'laser' | 'lithophane';
  onSelectTool: (tool: 'laser' | 'lithophane') => void;
  onOpenGuide: () => void;
  onOpenCustomSigns: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTool,
  onSelectTool,
  onOpenGuide,
  onOpenCustomSigns
}) => {
  return (
    <header className="w-full bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
          {/* Logos e Identidad Institucional (Doble de tamaño) */}
          <div className="flex items-center gap-6 sm:gap-10 justify-center xl:justify-start py-1">
            {/* Logo MakerBox (Doble tamaño: h-48 sm:h-60 lg:h-64) */}
            <div className="flex items-center">
              <Image
                src="/logos/makerbox-color.jpg"
                alt="MakerBox - Co Creación e Innovación | Ingeniería UTalca"
                width={712}
                height={259}
                className="object-contain h-44 sm:h-56 lg:h-64 w-auto drop-shadow-sm"
                priority
              />
            </div>

            {/* Separador vertical elegante */}
            <div className="h-36 sm:h-48 lg:h-56 w-px bg-slate-300" />

            {/* Logo UTalca Facultad de Ingeniería (Doble tamaño: h-40 sm:h-52 lg:h-60) */}
            <div className="flex items-center">
              <Image
                src="/logos/utalca-ingenieria.png"
                alt="Facultad de Ingeniería - Universidad de Talca"
                width={1024}
                height={368}
                className="object-contain h-36 sm:h-48 lg:h-56 w-auto drop-shadow-sm"
                priority
              />
            </div>
          </div>

          {/* Navegación entre las 2 herramientas de Fabricación Digital */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => onSelectTool('laser')}
                className={`flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl font-bold text-sm sm:text-base transition-all active:scale-95 ${
                  activeTool === 'laser'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>✂️ Llavero Láser</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTool('lithophane')}
                className={`flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl font-bold text-sm sm:text-base transition-all active:scale-95 ${
                  activeTool === 'lithophane'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>🖨️ Litofanía 3D</span>
              </button>
            </div>

            {/* Botones secundarios (Alfabeto y Guía) */}
            <div className="flex items-center gap-2">
              {activeTool === 'laser' && (
                <button
                  onClick={onOpenCustomSigns}
                  className="px-4 py-3 rounded-xl text-sm font-semibold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition flex items-center gap-1.5 shadow-xs active:scale-95"
                  title="Ver lámina de señas"
                >
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span className="hidden md:inline">Alfabeto Chileno</span>
                </button>
              )}

              <button
                onClick={onOpenGuide}
                className="px-4 py-3 rounded-xl text-sm font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition flex items-center gap-1.5 shadow-xs active:scale-95"
                title="Guía operativa del stand"
              >
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>Ayuda Stand</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
