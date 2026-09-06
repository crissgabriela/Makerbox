'use client';

import React, { useState, useCallback } from 'react';
import { Delete, Space, X, Sparkles, ChevronDown, Volume2, VolumeX } from 'lucide-react';

interface TouchKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyPress: (char: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onQuickWord: (word: string) => void;
}

export const TouchKeyboard: React.FC<TouchKeyboardProps> = ({
  isOpen,
  onClose,
  onKeyPress,
  onBackspace,
  onClear,
  onQuickWord
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isShift, setIsShift] = useState(true);

  // Reproducir un suave 'click' con Web Audio API al presionar teclas en pantalla táctil
  const playClickSound = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch {
      // AudioContext no disponible o bloqueado por política
    }
  }, [soundEnabled]);

  const handleKey = (char: string) => {
    playClickSound();
    onKeyPress(isShift ? char.toUpperCase() : char.toLowerCase());
  };

  const handleBackspace = () => {
    playClickSound();
    onBackspace();
  };

  const handleClear = () => {
    playClickSound();
    onClear();
  };

  const handleQuick = (word: string) => {
    playClickSound();
    onQuickWord(word);
  };

  if (!isOpen) return null;

  const row1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  const row2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'];
  const row3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

  const quickWords = ['MAKERBOX', 'UTALCA', 'HOLA', 'SEÑAS', 'INCLUSIÓN', 'GRACIAS'];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 border-t-2 border-purple-500/40 shadow-2xl backdrop-blur-xl p-2 sm:p-4 transition-all duration-300 animate-in slide-in-from-bottom">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        {/* Barra superior de control del teclado */}
        <div className="flex items-center justify-between px-2 pb-1 border-b border-slate-800 text-slate-300 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-purple-400 flex items-center gap-1">
              ⌨️ Teclado Táctil en Pantalla
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              (Especial para pantallas táctiles en stand)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle sonido */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title={soundEnabled ? 'Silenciar teclado' : 'Activar sonido de teclas'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            </button>

            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-300 border border-slate-700 transition flex items-center gap-1 font-medium"
            >
              <X className="w-3.5 h-3.5" />
              <span>Ocultar</span>
            </button>
          </div>
        </div>

        {/* Palabras rápidas para la feria */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold whitespace-nowrap flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Rápidas:
          </span>
          {quickWords.map((word) => (
            <button
              key={word}
              onClick={() => handleQuick(word)}
              className="px-2.5 py-1 text-xs font-bold rounded-md bg-purple-950/60 hover:bg-purple-800 text-purple-200 border border-purple-700/50 whitespace-nowrap active:scale-95 transition"
            >
              {word}
            </button>
          ))}
        </div>

        {/* Fila 1 */}
        <div className="flex justify-center gap-1 sm:gap-1.5 w-full">
          {row1.map((letter) => (
            <button
              key={letter}
              onClick={() => handleKey(letter)}
              className="flex-1 max-w-[76px] h-12 sm:h-14 bg-slate-800 hover:bg-purple-600/80 active:bg-purple-500 text-white font-bold text-lg sm:text-xl rounded-lg shadow-md border border-slate-700 hover:border-purple-400 transition-all active:scale-90 flex items-center justify-center select-none"
            >
              {isShift ? letter : letter.toLowerCase()}
            </button>
          ))}
        </div>

        {/* Fila 2 (con Ñ incluida) */}
        <div className="flex justify-center gap-1 sm:gap-1.5 w-full px-1">
          {row2.map((letter) => (
            <button
              key={letter}
              onClick={() => handleKey(letter)}
              className={`flex-1 max-w-[76px] h-12 sm:h-14 font-bold text-lg sm:text-xl rounded-lg shadow-md border transition-all active:scale-90 flex items-center justify-center select-none ${
                letter === 'Ñ'
                  ? 'bg-purple-900/80 hover:bg-purple-600 text-pink-200 border-pink-500/50'
                  : 'bg-slate-800 hover:bg-purple-600/80 active:bg-purple-500 text-white border-slate-700 hover:border-purple-400'
              }`}
            >
              {isShift ? letter : letter.toLowerCase()}
            </button>
          ))}
        </div>

        {/* Fila 3: Shift + Letras + Borrar */}
        <div className="flex justify-center gap-1 sm:gap-1.5 w-full">
          {/* Shift */}
          <button
            onClick={() => setIsShift(!isShift)}
            className={`px-3 sm:px-4 h-12 sm:h-14 rounded-lg font-bold text-xs sm:text-sm border transition-all active:scale-95 flex items-center justify-center select-none ${
              isShift
                ? 'bg-purple-600 text-white border-purple-400 shadow-purple-500/30 shadow-md'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isShift ? 'MAYÚS' : 'minús'}
          </button>

          {row3.map((letter) => (
            <button
              key={letter}
              onClick={() => handleKey(letter)}
              className="flex-1 max-w-[76px] h-12 sm:h-14 bg-slate-800 hover:bg-purple-600/80 active:bg-purple-500 text-white font-bold text-lg sm:text-xl rounded-lg shadow-md border border-slate-700 hover:border-purple-400 transition-all active:scale-90 flex items-center justify-center select-none"
            >
              {isShift ? letter : letter.toLowerCase()}
            </button>
          ))}

          {/* Borrar */}
          <button
            onClick={handleBackspace}
            className="px-3 sm:px-5 h-12 sm:h-14 bg-rose-950/70 hover:bg-rose-800 active:bg-rose-600 text-rose-200 font-bold rounded-lg border border-rose-700/60 shadow-md transition-all active:scale-95 flex items-center justify-center select-none gap-1"
            title="Borrar una letra"
          >
            <Delete className="w-5 h-5" />
            <span className="hidden sm:inline text-xs">Borrar</span>
          </button>
        </div>

        {/* Fila 4: Acciones inferiores */}
        <div className="flex justify-center gap-2 w-full pt-1">
          {/* Limpiar todo */}
          <button
            onClick={handleClear}
            className="px-4 h-11 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 font-semibold text-xs sm:text-sm rounded-lg border border-slate-700 transition active:scale-95 flex items-center justify-center select-none"
          >
            Limpiar Todo
          </button>

          {/* Barra espaciadora grande */}
          <button
            onClick={() => handleKey(' ')}
            className="flex-1 max-w-lg h-11 bg-slate-800 hover:bg-purple-700/60 active:bg-purple-600 text-white font-semibold text-xs sm:text-sm rounded-lg border border-slate-700 hover:border-purple-400 transition active:scale-98 flex items-center justify-center select-none gap-2 shadow-inner"
          >
            <Space className="w-4 h-4 text-purple-400" />
            <span>ESPACIO</span>
          </button>

          {/* Ocultar teclado */}
          <button
            onClick={onClose}
            className="px-4 h-11 bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-semibold text-xs sm:text-sm rounded-lg border border-purple-700/50 transition active:scale-95 flex items-center justify-center select-none gap-1"
          >
            <ChevronDown className="w-4 h-4" />
            <span className="hidden sm:inline">Ocultar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
