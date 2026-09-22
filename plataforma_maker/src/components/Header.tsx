'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Search, ShieldCheck, PlusCircle, QrCode, ExternalLink } from 'lucide-react';
import { QRShareModal } from './QRShareModal';

interface HeaderProps {
  variant?: 'public' | 'management';
  activeView?: 'form' | 'tracking';
  onChangeView?: (view: 'form' | 'tracking') => void;
}

export const Header: React.FC<HeaderProps> = ({
  variant = 'public',
  activeView = 'form',
  onChangeView
}) => {
  const [isQROpen, setIsQROpen] = useState(false);

  return (
    <>
      <header className="w-full bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-xs backdrop-blur-md bg-white/95">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-3 sm:py-3.5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            
            {/* Logos e Identidad Institucional */}
            <div className="flex items-center gap-4 sm:gap-6 justify-center md:justify-start">
              {/* Logo MakerBox */}
              <Link 
                href={variant === 'management' ? '/gestion' : '/'}
                className="flex items-center transition hover:opacity-90"
              >
                <Image
                  src="/logos/makerbox-color.jpg"
                  alt="MakerBox - Co Creación e Innovación | Ingeniería UTalca"
                  width={712}
                  height={259}
                  className="object-contain h-11 sm:h-13 md:h-14 w-auto drop-shadow-xs"
                  priority
                />
              </Link>

              {/* Separador vertical elegante */}
              <div className="h-8 sm:h-10 w-px bg-slate-200" />

              {/* Logo UTalca Facultad de Ingeniería */}
              <div className="flex items-center">
                <Image
                  src="/logos/utalca-ingenieria.png"
                  alt="Facultad de Ingeniería - Universidad de Talca"
                  width={1024}
                  height={368}
                  className="object-contain h-9 sm:h-11 md:h-12 w-auto drop-shadow-xs"
                  priority
                />
              </div>
            </div>

            {/* Navegación según Variante: Pública vs Gestión */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              {variant === 'public' ? (
                <>
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                    <button
                      type="button"
                      onClick={() => onChangeView && onChangeView('form')}
                      className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer ${
                        activeView === 'form'
                          ? 'bg-purple-700 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Nueva Solicitud 3D</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onChangeView && onChangeView('tracking')}
                      className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer ${
                        activeView === 'tracking'
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <Search className="w-4 h-4" />
                      <span>Seguimiento</span>
                    </button>
                  </div>

                  {/* Botón para ver y descargar QR del Stand */}
                  <button
                    type="button"
                    onClick={() => setIsQROpen(true)}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                    title="Ver Códigos QR para el Stand / Imprimir Cartel"
                  >
                    <QrCode className="w-4 h-4 text-purple-700" />
                    <span className="hidden sm:inline">QR Stand</span>
                  </button>
                </>
              ) : (
                /* Variante Gestión Equipo Makerbox */
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="px-3 py-1.5 rounded-xl bg-purple-100 text-purple-950 font-black text-xs flex items-center gap-1.5 border border-purple-200">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span>Portal de Gestión • Equipo Makerbox</span>
                  </div>

                  <Link
                    href="/"
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 border border-slate-200 shadow-2xs"
                    title="Ver Portal Público de Solicitudes"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Ver Portal Público</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setIsQROpen(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    title="Ver Códigos QR del Stand"
                  >
                    <QrCode className="w-3.5 h-3.5 text-purple-700" />
                    <span className="hidden sm:inline">QR Stand</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Modal QR */}
      <QRShareModal isOpen={isQROpen} onClose={() => setIsQROpen(false)} />
    </>
  );
};
