'use client';

import React, { useState, useCallback } from 'react';
import { Delete, Space, ChevronDown, Volume2, VolumeX, Sparkles } from 'lucide-react';

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

  const playClickSound = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(260, audioCtx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    } catch {
      // AudioContext
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

  const quickWords = ['HOLA', 'GRACIAS', 'TALCA', 'MAKERBOX', 'AMIGOS'];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-100/98 border-t-2 border-slate-300 shadow-2xl backdrop-blur-xl p-3 sm:p-5 transition-all duration-300 animate-in slide-in-from-bottom">
      <div className="max-w-4xl mx-auto flex flex-col gap-2.5">
        {/* Barra superior de control */}
        <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-200 text-slate-700 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-purple-800 text-base">
              ⌨️ Teclado en Pantalla Táctil
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              (Pulsa las teclas con tu dedo)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition"
              title={soundEnabled ? 'Silenciar teclado' : 'Activar sonido'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition flex items-center gap-1.5 active:scale-95"
            >
              <ChevronDown className="w-4 h-4" />
              <span>Listo / Ocultar</span>
            </button>
          </div>
        </div>

        {/* Palabras rápidas en botones grandes */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Rápidas:
          </span>
          {quickWords.map((word) => (
            <button
              key={word}
              onClick={() => handleQuick(word)}
              className="px-4 py-1.5 text-sm font-extrabold rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 whitespace-nowrap active:scale-95 transition shadow-sm"
            >
              {word}
            </button>
          ))}
        </div>

        {/* Fila 1 */}
        <div className="flex justify-center gap-1.5 sm:gap-2 w-full">
          {row1.map((letter) => (
            <button
              key={letter}
              onClick={() => handleKey(letter)}
              className="flex-1 max-w-[76px] h-14 sm:h-16 bg-white hover:bg-purple-50 active:bg-purple-100 text-slate-900 font-extrabold text-xl sm:text-2xl rounded-2xl shadow-sm border border-slate-200 hover:border-purple-300 transition-all active:scale-90 flex items-center justify-center select-none"
            >
              {isShift ? letter : letter.toLowerCase()}
            </button>
          ))}
        </div>

        {/* Fila 2 (con Ñ destacada suavemente) */}
        <div className="flex justify-center gap-1.5 sm:gap-2 w-full">
          {row2.map((letter) => (
            <button
              key={letter}
              onClick={() => handleKey(letter)}
              className={`flex-1 max-w-[76px] h-14 sm:h-16 font-extrabold text-xl sm:text-2xl rounded-2xl shadow-sm border transition-all active:scale-90 flex items-center justify-center select-none ${
                letter === 'Ñ'
                  ? 'bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-300'
                  : 'bg-white hover:bg-purple-50 active:bg-purple-100 text-slate-900 border-slate-200 hover:border-purple-300'
              }`}
            >
              {isShift ? letter : letter.toLowerCase()}
            </button>
          ))}
        </div>

        {/* Fila 3: Shift + Letras + Borrar */}
        <div className="flex justify-center gap-1.5 sm:gap-2 w-full">
          {/* Shift */}
          <button
            onClick={() => setIsShift(!isShift)}
            className={`px-4 sm:px-5 h-14 sm:h-16 rounded-2xl font-bold text-sm border transition-all active:scale-95 flex items-center justify-center select-none ${
              isShift
                ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {isShift ? 'MAYÚS' : 'minús'}
          </button>

          {row3.map((letter) => (
            <button
              key={letter}
              onClick={() => handleKey(letter)}
              className="flex-1 max-w-[76px] h-14 sm:h-16 bg-white hover:bg-purple-50 active:bg-purple-100 text-slate-900 font-extrabold text-xl sm:text-2xl rounded-2xl shadow-sm border border-slate-200 hover:border-purple-300 transition-all active:scale-90 flex items-center justify-center select-none"
            >
              {isShift ? letter : letter.toLowerCase()}
            </button>
          ))}

          {/* Botón Borrar */}
          <button
            onClick={handleBackspace}
            className="px-4 sm:px-6 h-14 sm:h-16 bg-rose-100 hover:bg-rose-200 active:bg-rose-300 text-rose-800 font-bold rounded-2xl border border-rose-300 shadow-sm transition-all active:scale-95 flex items-center justify-center select-none gap-1.5"
            title="Borrar una letra"
          >
            <Delete className="w-6 h-6" />
            <span className="hidden sm:inline text-sm">Borrar</span>
          </button>
        </div>

        {/* Fila 4: Acciones inferiores */}
        <div className="flex justify-center gap-2 sm:gap-3 w-full pt-1">
          {/* Limpiar todo */}
          <button
            onClick={handleClear}
            className="px-5 h-12 bg-white hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl border border-slate-200 transition active:scale-95 flex items-center justify-center select-none"
          >
            Limpiar Todo
          </button>

          {/* Barra espaciadora grande y clara */}
          <button
            onClick={() => handleKey(' ')}
            className="flex-1 max-w-xl h-12 bg-white hover:bg-purple-50 active:bg-purple-100 text-slate-700 font-bold text-sm rounded-2xl border border-slate-300 transition active:scale-98 flex items-center justify-center select-none gap-2 shadow-sm"
          >
            <Space className="w-5 h-5 text-purple-600" />
            <span>ESPACIO</span>
          </button>

          {/* Ocultar teclado */}
          <button
            onClick={onClose}
            className="px-5 h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-2xl shadow-sm transition active:scale-95 flex items-center justify-center select-none gap-1.5"
          >
            <ChevronDown className="w-5 h-5" />
            <span>Ocultar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
