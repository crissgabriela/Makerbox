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
          {/* Logos e Identidad Institucional (Gran tamaño destacado para Stand y Kiosco) */}
          <div className="flex items-center gap-6 sm:gap-10 justify-center lg:justify-start py-1">
            {/* Logo MakerBox (Doble tamaño aumentado: h-28 a h-36) */}
            <div className="flex items-center">
              <Image
                src="/logos/makerbox-color.jpg"
                alt="MakerBox - Co Creación e Innovación | Ingeniería UTalca"
                width={600}
                height={160}
                className="object-contain h-24 sm:h-32 lg:h-36 w-auto drop-shadow-sm"
                priority
              />
            </div>

            {/* Separador vertical elegante */}
            <div className="h-20 sm:h-28 w-px bg-slate-300" />

            {/* Logo UTalca Facultad de Ingeniería (Doble tamaño aumentado: h-22 a h-30) */}
            <div className="flex items-center">
              <Image
                src="/logos/utalca-ingenieria.png"
                alt="Facultad de Ingeniería - Universidad de Talca"
                width={550}
                height={150}
                className="object-contain h-20 sm:h-28 lg:h-32 w-auto drop-shadow-sm"
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
