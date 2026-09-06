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
import { Sparkles, Maximize, Minimize, Heart, Award } from 'lucide-react';

const DEFAULT_CONFIG: LaserConfig = {
  mode: 'organic_contour',
  targetHeightMm: 40,
  contourOffsetMm: 5,
  baseBarHeightMm: 11,
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
  const [text, setText] = useState('CRISS');
  const [laserConfig, setLaserConfig] = useState<LaserConfig>(DEFAULT_CONFIG);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAlphabetOpen, setIsAlphabetOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Manejo de pantalla completa (Modo Kiosco para pantalla táctil)
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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-purple-200 selection:text-purple-900 pb-32">
      {/* Cabecera institucional con logos claros */}
      <Header
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenCustomSigns={() => setIsAlphabetOpen(true)}
      />

      {/* Contenedor principal con diseño limpio y espacioso */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
        {/* Banner suave y acogedor de bienvenida */}
        <div className="rounded-3xl bg-gradient-to-r from-purple-100 via-pink-50 to-amber-50 border border-purple-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-purple-200 text-purple-900 text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                Stand Demostrativo MakerBox · UTalca
              </span>
              <span className="text-xs font-semibold text-slate-500 hidden md:inline">
                Feria de Conmemoración de la Lengua de Señas
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mt-1">
              Tu nombre en Lengua de Señas Chilena
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
              Escribe cualquier palabra o tu nombre. La plataforma lo transforma en señas de manos y genera un diseño unificado para cortarlo con láser en madera y llevarte un lindo recuerdo del stand.
            </p>
          </div>

          {/* Botón para poner en Pantalla Completa en la pantalla táctil */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-white hover:bg-slate-50 text-purple-800 border border-purple-200 transition active:scale-95 shadow-sm flex-shrink-0"
            title="Pantalla Completa para Kiosco Táctil"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span>{isFullscreen ? 'Salir de Pantalla Completa' : 'Modo Pantalla Completa'}</span>
          </button>
        </div>

        {/* Paso 1: Entrada de texto */}
        <TextInputSection
          value={text}
          onChange={setText}
          isKeyboardOpen={isKeyboardOpen}
          onToggleKeyboard={() => setIsKeyboardOpen(!isKeyboardOpen)}
          onClear={handleClear}
          onQuickWord={handleQuickWord}
        />

        {/* Paso 2: Visualización de las señas con ilustraciones chilenas */}
        <SignDisplay
          text={text}
          onSelectLetter={() => {
            setIsAlphabetOpen(true);
          }}
        />

        {/* Paso 3: Opciones del recuerdo físico */}
        <LaserControls config={laserConfig} onChange={setLaserConfig} />

        {/* Paso 4: Vista previa y descarga para la cortadora láser */}
        <LaserSvgGenerator text={text} config={laserConfig} />
      </main>

      {/* Teclado táctil flotante con teclas blancas grandes */}
      <TouchKeyboard
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        onKeyPress={handleKeyPress}
        onBackspace={handleBackspace}
        onClear={handleClear}
        onQuickWord={handleQuickWord}
      />

      {/* Modales informativos */}
      <StandGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <CustomSignUploader isOpen={isAlphabetOpen} onClose={() => setIsAlphabetOpen(false)} />

      {/* Pie de página suave */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600" />
            <span>
              <strong>MakerBox</strong> — Co Creación e Innovación · Facultad de Ingeniería, Universidad de Talca
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Día de las Personas Sordas y de la Lengua de Señas</span>
            <span>•</span>
            <span className="text-purple-700 font-bold">Stand de Impresión 3D y Corte Láser</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
