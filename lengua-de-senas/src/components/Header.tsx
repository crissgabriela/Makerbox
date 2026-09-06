'use client';

import React from 'react';
import Image from 'next/image';
import { Sparkles, BookOpen, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onOpenGuide: () => void;
  onOpenCustomSigns: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenGuide, onOpenCustomSigns }) => {
  return (
    <header className="w-full bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/95">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logos e Identidad Institucional */}
          <div className="flex items-center gap-4 sm:gap-6 justify-center sm:justify-start">
            {/* Logo MakerBox */}
            <div className="flex items-center">
              <Image
                src="/logos/makerbox-color.jpg"
                alt="MakerBox - Co Creación e Innovación | Ingeniería UTalca"
                width={170}
                height={42}
                className="object-contain h-10 w-auto"
                priority
              />
            </div>

            {/* Separador vertical suave */}
            <div className="h-8 w-px bg-slate-200" />

            {/* Logo UTalca Facultad de Ingeniería */}
            <div className="flex items-center">
              <Image
                src="/logos/utalca-ingenieria.png"
                alt="Facultad de Ingeniería - Universidad de Talca"
                width={150}
                height={38}
                className="object-contain h-9 w-auto"
                priority
              />
            </div>
          </div>

          {/* Botones de navegación amigables y accesibles */}
          <div className="flex items-center gap-3">
            {/* Ver Alfabeto Completo */}
            <button
              onClick={onOpenCustomSigns}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition flex items-center gap-2 shadow-sm active:scale-95"
            >
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>Ver Alfabeto Chileno</span>
            </button>

            {/* Guía de Ayuda para el Stand */}
            <button
              onClick={onOpenGuide}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition flex items-center gap-2 shadow-sm active:scale-95"
            >
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Guía para el Stand</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
