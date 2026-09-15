'use client';

import React from 'react';
import Image from 'next/image';
import { X, Sparkles, Heart } from 'lucide-react';

interface TextInputSectionProps {
  value: string;
  onChange: (val: string) => void;
  isKeyboardOpen?: boolean;
  onToggleKeyboard?: () => void;
  onClear: () => void;
  onQuickWord: (word: string) => void;
}

export const TextInputSection: React.FC<TextInputSectionProps> = ({
  value,
  onChange,
  onClear,
  onQuickWord
}) => {
  const quickWords = ['HOLA', 'GRACIAS', 'AMOR', 'INCLUSIÓN'];

  const handleAddSymbol = (symChar: string) => {
    onChange(value + symChar);
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 flex flex-col gap-4">
      {/* Título de la sección */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-base font-extrabold">
            1
          </span>
          <span>Escribe tu nombre o una palabra:</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Toca la barra para escribir directamente en pantalla o pulsa los símbolos con manos para agregarlos a tu llavero.
        </p>
      </div>

      {/* Recuadro de entrada de texto gigante y cómodo para pantalla táctil */}
      <div className="relative flex items-center mt-1">
        <input
          id="text-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe aquí tu nombre o palabra..."
          className="w-full bg-slate-50 border-2 border-slate-300 focus:border-purple-600 focus:bg-white rounded-2xl px-6 py-4 sm:py-5 text-2xl sm:text-3xl font-extrabold tracking-wider text-slate-900 placeholder-slate-400 uppercase outline-none transition-all shadow-inner pr-16"
          autoComplete="off"
          spellCheck="false"
        />

        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-4 p-2 rounded-full bg-slate-200 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition cursor-pointer"
            title="Borrar texto"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Símbolos especiales de señas / amor para agregar como si fueran una letra */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 pt-2 border-t border-slate-100">
        <span className="text-xs font-extrabold text-purple-700 uppercase tracking-wide flex items-center gap-1.5 flex-shrink-0">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          Añadir símbolos con manos:
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleAddSymbol('♥')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 hover:border-purple-300 transition active:scale-95 text-xs font-bold shadow-xs cursor-pointer"
            title="Añadir seña: Corazón con dedos"
          >
            <div className="w-5 h-5 flex items-center justify-center bg-white rounded-md overflow-hidden border border-purple-100">
              <Image src="/signs/letters/SYM_HEART1.png" alt="Corazón con dedos" width={20} height={20} className="w-4 h-4 object-contain" />
            </div>
            <span>Corazón dedos (♥)</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddSymbol('♡')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 hover:border-purple-300 transition active:scale-95 text-xs font-bold shadow-xs cursor-pointer"
            title="Añadir seña: Manos en corazón"
          >
            <div className="w-5 h-5 flex items-center justify-center bg-white rounded-md overflow-hidden border border-purple-100">
              <Image src="/signs/letters/SYM_HEART2.png" alt="Manos en corazón" width={20} height={20} className="w-4 h-4 object-contain" />
            </div>
            <span>Manos corazón (♡)</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddSymbol('★')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 hover:border-purple-300 transition active:scale-95 text-xs font-bold shadow-xs cursor-pointer"
            title="Añadir seña: Manos y amor"
          >
            <div className="w-5 h-5 flex items-center justify-center bg-white rounded-md overflow-hidden border border-purple-100">
              <Image src="/signs/letters/SYM_HEART3.png" alt="Manos y corazón" width={20} height={20} className="w-4 h-4 object-contain" />
            </div>
            <span>Manos y amor (★)</span>
          </button>
        </div>
      </div>

      {/* Palabras rápidas sugeridas */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Prueba con:
        </span>
        {quickWords.map((word) => (
          <button
            key={word}
            type="button"
            onClick={() => onQuickWord(word)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-900 border border-slate-200 hover:border-purple-300 transition active:scale-95 cursor-pointer"
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
};
