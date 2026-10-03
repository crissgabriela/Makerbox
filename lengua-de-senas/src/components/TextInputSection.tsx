'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Sparkles, Heart, KeyRound } from 'lucide-react';
import { KeychainShape } from '@/types';

interface TextInputSectionProps {
  value: string;
  onChange: (val: string) => void;
  secondaryValue?: string;
  onSecondaryChange?: (val: string) => void;
  shape?: KeychainShape;
  onShapeChange?: (shape: KeychainShape) => void;
  isKeyboardOpen?: boolean;
  onToggleKeyboard?: () => void;
  onClear: () => void;
  onQuickWord: (word: string) => void;
}

export const TextInputSection: React.FC<TextInputSectionProps> = ({
  value,
  onChange,
  secondaryValue = '',
  onSecondaryChange,
  shape = 'capsule',
  onShapeChange,
  onClear,
  onQuickWord
}) => {
  const [activeField, setActiveField] = useState<'primary' | 'secondary'>('primary');

  const MAX_CHARS = 10;
  const quickWordsCapsule = ['HOLA', 'GRACIAS', 'CIENCIA', 'FESTIVAL'];
  const quickPairsHeart = [
    { name1: 'CAMILA', name2: 'MATEO' },
    { name1: 'VALE', name2: 'CRISS' },
    { name1: 'ANA', name2: 'LUIS' },
    { name1: 'AMOR', name2: 'CIENCIA' }
  ];

  const handleAddSymbol = (symChar: string) => {
    if (shape === 'heart' && activeField === 'secondary') {
      if (secondaryValue.length < MAX_CHARS && onSecondaryChange) {
        onSecondaryChange(secondaryValue + symChar);
      }
    } else {
      if (value.length < MAX_CHARS) {
        onChange(value + symChar);
      }
    }
  };

  const handlePrimaryChange = (val: string) => {
    if (val.length <= MAX_CHARS) {
      onChange(val);
    }
  };

  const handleSecondaryInputChange = (val: string) => {
    if (val.length <= MAX_CHARS && onSecondaryChange) {
      onSecondaryChange(val);
    }
  };

  const renderCharCounter = (currentLength: number) => {
    const remaining = MAX_CHARS - currentLength;
    if (remaining === 0) {
      return (
        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 inline-flex items-center gap-1 shadow-2xs">
          <span>⚠️</span>
          <span>¡Largo máximo alcanzado (10/10)!</span>
        </span>
      );
    }
    return (
      <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 inline-flex items-center gap-1 shadow-2xs">
        <span>Faltan {remaining} {remaining === 1 ? 'carácter' : 'caracteres'}</span>
        <span className="text-purple-400 font-normal">({currentLength}/10)</span>
      </span>
    );
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 flex flex-col gap-5">
      {/* Título de la sección y selector de modelo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-base font-extrabold">
              1
            </span>
            <span>
              {shape === 'heart' ? 'Escribe los 2 nombres para el corazón:' : 'Escribe tu nombre o una palabra:'}
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {shape === 'heart'
              ? 'Llavero en forma de corazón de 60 mm con 2 nombres (uno arriba, corazón en el centro y el otro abajo).'
              : 'Llavero alargado clásico cortado en madera con señas y nombre grabado en la parte inferior.'}
          </p>
        </div>

        {/* Selector rápido de formato */}
        {onShapeChange && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 flex-shrink-0">
            <button
              type="button"
              onClick={() => onShapeChange('capsule')}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                shape === 'capsule'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Cápsula (25 mm)</span>
            </button>

            <button
              type="button"
              onClick={() => onShapeChange('heart')}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                shape === 'heart'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>💖 Corazón Dúo (60 mm)</span>
            </button>
          </div>
        )}
      </div>

      {/* Inputs según el formato seleccionado */}
      {shape === 'heart' ? (
        /* Modo Corazón: 2 nombres (uno arriba y otro abajo) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre 1 (Arriba) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-black">1</span>
                <span>Nombre 1 (Arriba):</span>
              </label>
              {renderCharCounter(value.length)}
            </div>

            <div className="relative flex items-center">
              <input
                id="name1-input"
                type="text"
                value={value}
                maxLength={MAX_CHARS}
                onFocus={() => setActiveField('primary')}
                onChange={(e) => handlePrimaryChange(e.target.value)}
                placeholder="EJ. CAMILA..."
                className={`w-full bg-slate-50 border-2 rounded-2xl px-5 py-3.5 text-xl sm:text-2xl font-extrabold tracking-wider text-slate-900 placeholder-slate-400 uppercase outline-none transition-all shadow-inner pr-12 ${
                  activeField === 'primary' ? 'border-rose-500 bg-white ring-2 ring-rose-100' : 'border-slate-300'
                }`}
                autoComplete="off"
                spellCheck="false"
              />
              {value && (
                <button
                  type="button"
                  onClick={onClear}
                  className="absolute right-3 p-1.5 rounded-full bg-slate-200 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition cursor-pointer"
                  title="Borrar nombre 1"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Nombre 2 (Abajo) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-black">2</span>
                <span>Nombre 2 (Abajo):</span>
              </label>
              {renderCharCounter(secondaryValue.length)}
            </div>

            <div className="relative flex items-center">
              <input
                id="name2-input"
                type="text"
                value={secondaryValue}
                maxLength={MAX_CHARS}
                onFocus={() => setActiveField('secondary')}
                onChange={(e) => handleSecondaryInputChange(e.target.value)}
                placeholder="EJ. MATEO..."
                className={`w-full bg-slate-50 border-2 rounded-2xl px-5 py-3.5 text-xl sm:text-2xl font-extrabold tracking-wider text-slate-900 placeholder-slate-400 uppercase outline-none transition-all shadow-inner pr-12 ${
                  activeField === 'secondary' ? 'border-rose-500 bg-white ring-2 ring-rose-100' : 'border-slate-300'
                }`}
                autoComplete="off"
                spellCheck="false"
              />
              {secondaryValue && (
                <button
                  type="button"
                  onClick={() => onSecondaryChange?.('')}
                  className="absolute right-3 p-1.5 rounded-full bg-slate-200 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition cursor-pointer"
                  title="Borrar nombre 2"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Modo Cápsula Estándar: 1 nombre o palabra */
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Escribe con tu teclado físico o toca la barra para usar la pantalla táctil:
            </span>
            {renderCharCounter(value.length)}
          </div>

          <div className="relative flex items-center">
            <input
              id="text-input"
              type="text"
              value={value}
              maxLength={MAX_CHARS}
              onChange={(e) => handlePrimaryChange(e.target.value)}
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
        </div>
      )}

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

      {/* Palabras rápidas sugeridas según el formato */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Prueba con:
        </span>
        {shape === 'heart' ? (
          quickPairsHeart.map((pair) => (
            <button
              key={`${pair.name1}-${pair.name2}`}
              type="button"
              onClick={() => {
                onChange(pair.name1);
                onSecondaryChange?.(pair.name2);
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 hover:border-rose-300 transition active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <span>{pair.name1}</span>
              <span className="text-rose-400">♥</span>
              <span>{pair.name2}</span>
            </button>
          ))
        ) : (
          quickWordsCapsule.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => onQuickWord(word)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-900 border border-slate-200 hover:border-purple-300 transition active:scale-95 cursor-pointer"
            >
              {word}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
