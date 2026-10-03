'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Sparkles, Heart, KeyRound, Check, Trash2, Smile, ArrowLeftRight } from 'lucide-react';
import { KeychainShape } from '@/types';
import { CHILEAN_VECTOR_SIGNS } from '@/lib/chileanVectorsData';
import { normalizeText } from '@/lib/signsData';

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

const ALL_SYMBOL_CHARS = ['♥', '♡', '★', '✌', '🐶', '🐱', '😊', '😄', '😘', '😉', '🫰', '🫶', '💖', '❤️', '❤'];

interface SymbolItem {
  id: string;
  char: string;
  name: string;
  type: 'image' | 'svg';
  iconSrc?: string;
  pathD?: string;
}

interface SymbolCategory {
  title: string;
  symbols: SymbolItem[];
}

const SYMBOL_CATEGORIES: SymbolCategory[] = [
  {
    title: 'Manos y Gestos',
    symbols: [
      { id: 'SYM_HEART1', char: '♥', name: 'Corazón dedos', type: 'image', iconSrc: '/signs/letters/SYM_HEART1.png' },
      { id: 'SYM_HEART2', char: '♡', name: 'Manos corazón', type: 'image', iconSrc: '/signs/letters/SYM_HEART2.png' },
      { id: 'SYM_HEART3', char: '★', name: 'Manos y amor', type: 'image', iconSrc: '/signs/letters/SYM_HEART3.png' },
      { id: 'SYM_PEACE', char: '✌', name: 'Signo de Paz', type: 'svg', pathD: CHILEAN_VECTOR_SIGNS['SYM_PEACE']?.pathD }
    ]
  },
  {
    title: 'Mascotas',
    symbols: [
      { id: 'SYM_DOG', char: '🐶', name: 'Silueta Perro', type: 'svg', pathD: CHILEAN_VECTOR_SIGNS['SYM_DOG']?.pathD },
      { id: 'SYM_CAT', char: '🐱', name: 'Silueta Gato', type: 'svg', pathD: CHILEAN_VECTOR_SIGNS['SYM_CAT']?.pathD }
    ]
  },
  {
    title: 'Emoticones',
    symbols: [
      { id: 'SYM_SMILE', char: '😊', name: 'Sonrisa', type: 'svg', pathD: CHILEAN_VECTOR_SIGNS['SYM_SMILE']?.pathD },
      { id: 'SYM_LAUGH', char: '😄', name: 'Risa', type: 'svg', pathD: CHILEAN_VECTOR_SIGNS['SYM_LAUGH']?.pathD },
      { id: 'SYM_KISS', char: '😘', name: 'Beso', type: 'svg', pathD: CHILEAN_VECTOR_SIGNS['SYM_KISS']?.pathD },
      { id: 'SYM_WINK', char: '😉', name: 'Guiño', type: 'svg', pathD: CHILEAN_VECTOR_SIGNS['SYM_WINK']?.pathD }
    ]
  }
];

/**
 * Separa de forma segura las letras del símbolo y detecta si el símbolo está al inicio o al final.
 * Se restringe a un máximo de 9 letras y a lo sumo 1 símbolo (total máx 10 caracteres).
 */
function extractLettersAndSymbol(text: string): { letters: string; symbol: string | null; position: 'before' | 'after' } {
  const cleaned = text.replace(/\uFE0F/g, '');
  const chars = Array.from(cleaned);
  let symbol: string | null = null;
  let symbolIndex = -1;
  const letters: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ALL_SYMBOL_CHARS.includes(ch)) {
      if (!symbol) {
        symbol = ch;
        symbolIndex = i;
      }
    } else {
      letters.push(ch);
    }
  }

  const position: 'before' | 'after' = symbolIndex === 0 ? 'before' : 'after';
  return { letters: letters.join('').slice(0, 9), symbol, position };
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
  const [symbolPosition, setSymbolPosition] = useState<'before' | 'after'>('after');

  const MAX_CHARS = 10;
  const quickWordsCapsule = ['HOLA', 'GRACIAS', 'CIENCIA', 'FESTIVAL'];
  const quickPairsHeart = [
    { name1: 'CAMILA', name2: 'MATEO' },
    { name1: 'VALE', name2: 'CRISS' },
    { name1: 'ANA', name2: 'LUIS' },
    { name1: 'AMOR', name2: 'CIENCIA' }
  ];

  // Determinar el valor del campo actualmente activo
  const currentTargetVal = shape === 'heart' && activeField === 'secondary' ? secondaryValue : value;
  const { symbol: activeSymbol, position: currentSymbolPos } = extractLettersAndSymbol(currentTargetVal);

  const handlePrimaryChange = (raw: string) => {
    const { letters, symbol, position } = extractLettersAndSymbol(raw);
    const maxLetters = letters.slice(0, 9);
    let finalVal = maxLetters;
    if (symbol) {
      finalVal = position === 'before' ? symbol + maxLetters : maxLetters + symbol;
    }
    onChange(finalVal);
  };

  const handleSecondaryInputChange = (raw: string) => {
    if (!onSecondaryChange) return;
    const { letters, symbol, position } = extractLettersAndSymbol(raw);
    const maxLetters = letters.slice(0, 9);
    let finalVal = maxLetters;
    if (symbol) {
      finalVal = position === 'before' ? symbol + maxLetters : maxLetters + symbol;
    }
    onSecondaryChange(finalVal);
  };

  const handleToggleSymbol = (symChar: string) => {
    const targetVal = shape === 'heart' && activeField === 'secondary' ? secondaryValue : value;
    const setter = shape === 'heart' && activeField === 'secondary' ? onSecondaryChange : onChange;
    if (!setter) return;

    const { letters, symbol } = extractLettersAndSymbol(targetVal);

    // Si ya tiene ese mismo símbolo, hacer toggle (quitarlo)
    if (symbol === symChar) {
      setter(letters);
      return;
    }

    // Colocar el nuevo símbolo en la posición seleccionada (sustituyendo cualquier símbolo anterior)
    const effectivePos = symbol ? currentSymbolPos : symbolPosition;
    const finalVal = effectivePos === 'before' ? symChar + letters : letters + symChar;
    setter(finalVal);
  };

  const handleChangePosition = (newPos: 'before' | 'after') => {
    setSymbolPosition(newPos);
    const targetVal = shape === 'heart' && activeField === 'secondary' ? secondaryValue : value;
    const setter = shape === 'heart' && activeField === 'secondary' ? onSecondaryChange : onChange;
    if (!setter) return;

    const { letters, symbol } = extractLettersAndSymbol(targetVal);
    if (symbol) {
      const finalVal = newPos === 'before' ? symbol + letters : letters + symbol;
      setter(finalVal);
    }
  };

  const handleRemoveSymbol = () => {
    const targetVal = shape === 'heart' && activeField === 'secondary' ? secondaryValue : value;
    const setter = shape === 'heart' && activeField === 'secondary' ? onSecondaryChange : onChange;
    if (!setter) return;

    const { letters } = extractLettersAndSymbol(targetVal);
    setter(letters);
  };

  const renderCharCounter = (targetVal: string) => {
    const tokens = normalizeText(targetVal);
    const currentLength = tokens.length;
    const remaining = MAX_CHARS - currentLength;
    const { letters, symbol } = extractLettersAndSymbol(targetVal);
    const letterCount = Array.from(letters).length;

    if (remaining === 0) {
      return (
        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1.5 shadow-2xs">
          <span>⚠️</span>
          <span>¡Largo máximo alcanzado (10/10)!</span>
        </span>
      );
    }

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 inline-flex items-center gap-1.5 shadow-2xs">
          <span>Faltan {remaining} {remaining === 1 ? 'carácter' : 'caracteres'}</span>
          <span className="text-purple-400 font-normal">({currentLength}/10)</span>
        </span>
        {letterCount === 9 && !symbol && (
          <span className="hidden sm:inline-flex text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            +1 símbolo disponible
          </span>
        )}
      </div>
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
              ? 'Llavero en forma de corazón de 60 mm con 2 nombres (máx. 9 letras y 1 símbolo por nombre).'
              : 'Llavero alargado clásico en madera: máximo 9 letras y 1 símbolo decorativo (10 caracteres total).'}
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
              {renderCharCounter(value)}
            </div>

            <div className="relative flex items-center">
              <input
                id="name1-input"
                type="text"
                value={value}
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
              {renderCharCounter(secondaryValue)}
            </div>

            <div className="relative flex items-center">
              <input
                id="name2-input"
                type="text"
                value={secondaryValue}
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
            {renderCharCounter(value)}
          </div>

          <div className="relative flex items-center">
            <input
              id="text-input"
              type="text"
              value={value}
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

      {/* SECCIÓN DE SÍMBOLOS ESPECIALES (MÁXIMO 1 SÍMBOLO, ANTES O DESPUÉS) */}
      <div className="flex flex-col gap-3 pt-3 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-purple-800 uppercase tracking-wide flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-purple-600" />
              <span>Añadir un símbolo (1 máx, antes o después):</span>
            </span>
            {shape === 'heart' && (
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                Para: {activeField === 'primary' ? 'Nombre 1 (Arriba)' : 'Nombre 2 (Abajo)'}
              </span>
            )}
          </div>

          {/* Selector de posición: Al inicio o Al final */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center gap-1">
              <ArrowLeftRight className="w-3 h-3" />
              <span>Ubicación:</span>
            </span>
            <button
              type="button"
              onClick={() => handleChangePosition('before')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition active:scale-95 cursor-pointer ${
                (activeSymbol ? currentSymbolPos === 'before' : symbolPosition === 'before')
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
              title="Colocar el símbolo antes del nombre"
            >
              ⬅ Al inicio
            </button>
            <button
              type="button"
              onClick={() => handleChangePosition('after')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition active:scale-95 cursor-pointer ${
                (activeSymbol ? currentSymbolPos === 'after' : symbolPosition === 'after')
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
              title="Colocar el símbolo después del nombre"
            >
              Al final ➡
            </button>

            {activeSymbol && (
              <button
                type="button"
                onClick={handleRemoveSymbol}
                className="ml-1 px-2 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition cursor-pointer flex items-center gap-1"
                title="Quitar símbolo del texto"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">Quitar</span>
              </button>
            )}
          </div>
        </div>

        {/* Grupos de Símbolos por Categoría */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SYMBOL_CATEGORIES.map((cat) => (
            <div key={cat.title} className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-2.5 flex flex-col gap-2">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider px-1">
                {cat.title}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {cat.symbols.map((sym) => {
                  const isSelected = activeSymbol === sym.char;
                  return (
                    <button
                      key={sym.id}
                      type="button"
                      onClick={() => handleToggleSymbol(sym.char)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer text-left ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-700 shadow-sm ring-2 ring-purple-200'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-900 shadow-2xs'
                      }`}
                      title={`Añadir o cambiar por: ${sym.name} (${sym.char})`}
                    >
                      {/* Icono de vista previa */}
                      <div className={`w-5 h-5 flex items-center justify-center rounded-md overflow-hidden flex-shrink-0 ${
                        isSelected ? 'bg-white/20' : 'bg-slate-100'
                      }`}>
                        {sym.type === 'image' && sym.iconSrc ? (
                          <Image src={sym.iconSrc} alt={sym.name} width={18} height={18} className="w-3.5 h-3.5 object-contain" />
                        ) : (
                          <svg viewBox="0 0 100 100" className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                            <path
                              d={sym.pathD || ''}
                              fill="currentColor"
                              fillRule="evenodd"
                              stroke="none"
                            />
                          </svg>
                        )}
                      </div>

                      <div className="flex flex-col min-w-0 flex-1 leading-tight">
                        <span className="truncate text-[11px] font-extrabold">{sym.name}</span>
                        <span className={`text-[10px] ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                          ({sym.char})
                        </span>
                      </div>

                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-white flex-shrink-0 ml-auto" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Palabras rápidas sugeridas según el formato */}
      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100">
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
