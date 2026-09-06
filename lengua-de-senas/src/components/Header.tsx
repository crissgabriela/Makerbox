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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Logos e Identidad Institucional (Duplicados de tamaño) */}
          <div className="flex items-center gap-5 sm:gap-7 justify-center lg:justify-start">
            {/* Logo MakerBox (Doble tamaño: h-20) */}
            <div className="flex items-center">
              <Image
                src="/logos/makerbox-color.jpg"
                alt="MakerBox - Co Creación e Innovación | Ingeniería UTalca"
                width={340}
                height={84}
                className="object-contain h-16 sm:h-20 w-auto drop-shadow-xs"
                priority
              />
            </div>

            {/* Separador vertical suave */}
            <div className="h-14 sm:h-16 w-px bg-slate-200" />

            {/* Logo UTalca Facultad de Ingeniería (Doble tamaño: h-18) */}
            <div className="flex items-center">
              <Image
                src="/logos/utalca-ingenieria.png"
                alt="Facultad de Ingeniería - Universidad de Talca"
                width={300}
                height={76}
                className="object-contain h-14 sm:h-18 w-auto drop-shadow-xs"
                priority
              />
            </div>
          </div>

          {/* Navegación entre las 2 herramientas de Fabricación Digital */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <button
              type="button"
              onClick={() => onSelectTool('laser')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 ${
                activeTool === 'laser'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>✂️ Llavero Láser</span>
              <span className="hidden sm:inline text-xs font-normal opacity-90">(Lengua de Señas)</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTool('lithophane')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 ${
                activeTool === 'lithophane'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>🖨️ Litofanía 3D</span>
              <span className="hidden sm:inline text-xs font-normal opacity-90">(Impresión 3D)</span>
            </button>
          </div>

          {/* Botones secundarios (Alfabeto y Guía) */}
          <div className="flex items-center gap-2">
            {activeTool === 'laser' && (
              <button
                onClick={onOpenCustomSigns}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition flex items-center gap-1.5 shadow-xs active:scale-95"
                title="Ver lámina de señas"
              >
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span className="hidden md:inline">Alfabeto Chileno</span>
              </button>
            )}

            <button
              onClick={onOpenGuide}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition flex items-center gap-1.5 shadow-xs active:scale-95"
              title="Guía operativa del stand"
            >
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Ayuda Stand</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
