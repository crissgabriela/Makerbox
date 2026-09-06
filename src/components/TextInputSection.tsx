'use client';

import React from 'react';
import { Keyboard, X, Sparkles, Type } from 'lucide-react';

interface TextInputSectionProps {
  value: string;
  onChange: (val: string) => void;
  isKeyboardOpen: boolean;
  onToggleKeyboard: () => void;
  onClear: () => void;
}

export const TextInputSection: React.FC<TextInputSectionProps> = ({
  value,
  onChange,
  isKeyboardOpen,
  onToggleKeyboard,
  onClear
}) => {
  return (
    <div className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col gap-3">
        {/* Etiqueta y Controles Rápidos */}
        <div className="flex items-center justify-between">
          <label
            htmlFor="text-input"
            className="text-sm font-semibold text-purple-300 flex items-center gap-2"
          >
            <Type className="w-4 h-4 text-purple-400" />
            <span>Ingresa una palabra o tu nombre:</span>
          </label>

          <button
            type="button"
            onClick={onToggleKeyboard}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
              isKeyboardOpen
                ? 'bg-purple-600 text-white shadow-purple-500/30'
                : 'bg-slate-800 text-purple-300 hover:bg-slate-700 border border-purple-500/30'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>{isKeyboardOpen ? 'Ocultar Teclado' : 'Abrir Teclado Táctil'}</span>
          </button>
        </div>

        {/* Campo de Entrada de Texto con Botón de Limpiar */}
        <div className="relative flex items-center">
          <input
            id="text-input"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Escribe aquí (ej. MAKERBOX, TALCA, TU NOMBRE)..."
            className="w-full bg-slate-950 border-2 border-slate-700 focus:border-purple-500 rounded-xl px-4 py-3 sm:py-4 text-xl sm:text-2xl font-bold tracking-widest text-white placeholder-slate-500 uppercase outline-none transition shadow-inner pr-12"
            autoComplete="off"
            spellCheck="false"
          />

          {value && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Borrar texto"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Información interactiva */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Letras detectadas:{' '}
            <strong className="text-purple-300">
              {value.replace(/[^A-Za-zñÑ]/g, '').length}
            </strong>
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Acepta letras de la A a la Z y la letra Ñ
          </span>
        </div>
      </div>
    </div>
  );
};
