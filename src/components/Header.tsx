'use client';

import React from 'react';
import Image from 'next/image';
import { Sparkles, Layers, Cpu } from 'lucide-react';

interface HeaderProps {
  onOpenGuide: () => void;
  onOpenCustomSigns: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenGuide, onOpenCustomSigns }) => {
  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-lg backdrop-blur-md bg-slate-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logos e Identidad */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center md:justify-start">
            {/* Logo MakerBox */}
            <div className="flex items-center bg-black/40 px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-inner">
              <div className="h-9 w-auto flex items-center">
                <Image
                  src="/logos/makerbox-dark.png"
                  alt="MakerBox - Co Creación e Innovación | Ingeniería UTalca"
                  width={150}
                  height={36}
                  className="object-contain h-8 w-auto"
                  priority
                />
              </div>
            </div>

            {/* Separador vertical */}
            <div className="hidden sm:block h-8 w-px bg-slate-700" />

            {/* Logo UTalca Facultad de Ingeniería */}
            <div className="flex items-center bg-white px-3 py-1.5 rounded-lg shadow-sm">
              <div className="h-9 w-auto flex items-center">
                <Image
                  src="/logos/utalca-ingenieria.png"
                  alt="Facultad de Ingeniería - Universidad de Talca"
                  width={150}
                  height={36}
                  className="object-contain h-8 w-auto"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Badge del Evento y Acciones Rápidas */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center justify-end gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Día de las Personas Sordas y Lengua de Señas
              </span>
              <span className="text-[11px] text-slate-400">
                Stand Demostrativo · Impresión 3D & Corte Láser
              </span>
            </div>

            {/* Botón Catálogo de Señas */}
            <button
              onClick={onOpenCustomSigns}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 active:scale-95 shadow-sm"
              title="Ver o editar el abecedario de señas"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Alfabeto Señas</span>
            </button>

            {/* Botón Guía Operador */}
            <button
              onClick={onOpenGuide}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-900/50 hover:bg-purple-800/60 text-purple-200 border border-purple-700/50 transition flex items-center gap-1.5 active:scale-95 shadow-sm"
              title="Guía de parámetros para cortadora láser (LightBurn / RDWorks)"
            >
              <Cpu className="w-3.5 h-3.5 text-pink-400" />
              <span>Guía Corte Láser</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
