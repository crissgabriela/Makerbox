'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { TextInputSection } from '@/components/TextInputSection';
import { SignDisplay } from '@/components/SignDisplay';
import { LaserControls } from '@/components/LaserControls';
import { LaserSvgGenerator } from '@/components/LaserSvgGenerator';
import { TouchKeyboard } from '@/components/TouchKeyboard';
import { StandGuideModal } from '@/components/StandGuideModal';
import { CustomSignUploader } from '@/components/CustomSignUploader';
import { LaserConfig } from '@/types';
import { Sparkles, Maximize, Minimize, Award } from 'lucide-react';

const DEFAULT_CONFIG: LaserConfig = {
  mode: 'keychain',
  targetHeightMm: 40,
  baseBarHeightMm: 10,
  addKeychainHole: true,
  holeDiameterMm: 4.5,
  includeTextEngraving: true,
  includeBranding: true,
  signSpacingMm: 3,
  materialThicknessMm: 3,
  cutStrokeColor: '#FF0000',
  engraveStrokeColor: '#0000FF',
  engraveFillColor: '#000000'
};

export default function Home() {
  const [text, setText] = useState('MAKERBOX');
  const [laserConfig, setLaserConfig] = useState<LaserConfig>(DEFAULT_CONFIG);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAlphabetOpen, setIsAlphabetOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Manejo de pantalla completa (Kiosk Mode) para la feria
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Manejo de teclado táctil
  const handleKeyPress = (char: string) => {
    setText((prev) => prev + char);
  };

  const handleBackspace = () => {
    setText((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setText('');
  };

  const handleQuickWord = (word: string) => {
    setText(word);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white pb-32">
      {/* Cabecera con logos institucionales */}
      <Header
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenCustomSigns={() => setIsAlphabetOpen(true)}
      />

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Banner Informativo y Conmemorativo */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/70 via-indigo-950/50 to-slate-900 border border-purple-500/30 p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1 z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Stand MakerBox UTalca
              </span>
              <span className="text-xs text-slate-400 hidden md:inline">
                Feria de Inclusión y Accesibilidad
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Generador de Lengua de Señas para Corte Láser
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Escribe cualquier palabra o nombre para convertirlo en dactilología vectorial. La plataforma une automáticamente las señas en una sola pieza continua lista para cortar en MDF o acrílico en nuestra máquina láser.
            </p>
          </div>

          {/* Botón Modo Kiosco Pantalla Completa */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900/80 hover:bg-slate-800 text-purple-300 border border-purple-500/40 transition active:scale-95 shadow-md flex-shrink-0"
            title="Pantalla Completa para Pantalla Táctil del Stand"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span>{isFullscreen ? 'Salir de Pantalla Completa' : 'Modo Kiosco Táctil'}</span>
          </button>
        </div>

        {/* Sección de Entrada de Texto */}
        <TextInputSection
          value={text}
          onChange={setText}
          isKeyboardOpen={isKeyboardOpen}
          onToggleKeyboard={() => setIsKeyboardOpen(!isKeyboardOpen)}
          onClear={handleClear}
        />

        {/* Previsualización visual de las señas */}
        <SignDisplay
          text={text}
          onSelectLetter={() => {
            setIsAlphabetOpen(true);
          }}
        />

        {/* Generador y Previsualizador de Archivo Láser SVG */}
        <LaserSvgGenerator text={text} config={laserConfig} />

        {/* Controles de Configuración Física del Láser */}
        <LaserControls config={laserConfig} onChange={setLaserConfig} />
      </main>

      {/* Teclado Virtual Flotante Táctil */}
      <TouchKeyboard
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        onKeyPress={handleKeyPress}
        onBackspace={handleBackspace}
        onClear={handleClear}
        onQuickWord={handleQuickWord}
      />

      {/* Modales de Ayuda y Alfabeto */}
      <StandGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <CustomSignUploader isOpen={isAlphabetOpen} onClose={() => setIsAlphabetOpen(false)} />

      {/* Pie de página institucional */}
      <footer className="w-full bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400" />
            <span>
              <strong>MakerBox</strong> — Co Creación e Innovación · Facultad de Ingeniería, Universidad de Talca
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>Día de las Personas Sordas y de la Lengua de Señas</span>
            <span>•</span>
            <span className="text-purple-400 font-semibold">Listo para Vercel & LightBurn</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
