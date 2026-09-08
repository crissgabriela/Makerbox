'use client';

import React from 'react';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';

interface HeaderProps {
  activeTool: 'laser' | 'lithophane' | 'braille';
  onSelectTool: (tool: 'laser' | 'lithophane' | 'braille') => void;
  onOpenGuide?: () => void;
  onOpenCustomSigns: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTool,
  onSelectTool,
  onOpenCustomSigns
}) => {
  return (
    <header className="w-full bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-xs backdrop-blur-md bg-white/95">
      {/* Contenedor principal con 1cm (~12-14px) de margen por encima y por debajo */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-3 sm:py-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Logos e Identidad Institucional */}
          <div className="flex items-center gap-4 sm:gap-6 justify-center md:justify-start">
            {/* Logo MakerBox */}
            <div className="flex items-center">
              <Image
                src="/logos/makerbox-color.jpg"
                alt="MakerBox - Co Creación e Innovación | Ingeniería UTalca"
                width={712}
                height={259}
                className="object-contain h-12 sm:h-14 md:h-16 w-auto drop-shadow-xs"
                priority
              />
            </div>

            {/* Separador vertical elegante */}
            <div className="h-9 sm:h-11 w-px bg-slate-200" />

            {/* Logo UTalca Facultad de Ingeniería */}
            <div className="flex items-center">
              <Image
                src="/logos/utalca-ingenieria.png"
                alt="Facultad de Ingeniería - Universidad de Talca"
                width={1024}
                height={368}
                className="object-contain h-10 sm:h-12 md:h-14 w-auto drop-shadow-xs"
                priority
              />
            </div>
          </div>

          {/* Navegación entre las 3 herramientas de Fabricación Digital */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => onSelectTool('laser')}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg font-extrabold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer ${
                  activeTool === 'laser'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>✂️ Llavero Láser</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTool('lithophane')}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg font-extrabold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer ${
                  activeTool === 'lithophane'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>🖨️ Litofanía 3D</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTool('braille')}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg font-extrabold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer ${
                  activeTool === 'braille'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>⠇ Braille 3D</span>
              </button>
            </div>

            {/* Botón secundario para ver el alfabeto de señas chileno */}
            {activeTool === 'laser' && (
              <button
                type="button"
                onClick={onOpenCustomSigns}
                className="px-3 py-2 rounded-lg text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                title="Ver lámina de señas"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Alfabeto Chileno</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
