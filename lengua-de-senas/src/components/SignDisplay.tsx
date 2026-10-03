'use client';

import React from 'react';
import Image from 'next/image';
import { SIGNS_DICTIONARY, normalizeText } from '@/lib/signsData';
import { CHILEAN_VECTOR_SIGNS } from '@/lib/chileanVectorsData';
import { Sparkles, Heart } from 'lucide-react';
import { KeychainShape } from '@/types';

interface SignDisplayProps {
  text: string;
  secondaryText?: string;
  shape?: KeychainShape;
  onSelectLetter?: (letter: string) => void;
}

export const SignDisplay: React.FC<SignDisplayProps> = ({
  text,
  secondaryText = '',
  shape = 'capsule',
  onSelectLetter
}) => {
  const letters1 = normalizeText(text).slice(0, 10);
  const letters2 = normalizeText(secondaryText).slice(0, 10);

  const hasAnyLetters = letters1.length > 0 || (shape === 'heart' && letters2.length > 0);

  if (!hasAnyLetters) {
    return (
      <div className="w-full bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">
          ¿Cómo se dice en Lengua de Señas?
        </h3>
        <p className="text-base text-slate-500 max-w-lg leading-relaxed">
          Escribe tu nombre o cualquier palabra arriba para ver cómo se hace cada letra con las manos en el <strong>Alfabeto Manual Chileno</strong>.
        </p>
      </div>
    );
  }

  const renderLetterRow = (letters: string[], titleLabel?: string) => {
    if (letters.length === 0) {
      return (
        <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400 font-semibold">
          Escribe en el campo superior para ver las señas.
        </div>
      );
    }

    return (
      <div className="w-full overflow-x-auto pb-2 pt-0.5 scrollbar-thin">
        {titleLabel && (
          <span className="text-xs font-bold text-purple-700 block mb-2">{titleLabel}</span>
        )}
        <div className="flex items-stretch gap-3 min-w-min">
          {letters.map((char, index) => {
            if (char === ' ') {
              return (
                <div
                  key={`space-${index}`}
                  className="w-12 min-h-[140px] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 font-bold text-[10px]"
                >
                  <span className="rotate-90 tracking-widest uppercase">Espacio</span>
                </div>
              );
            }

            const sign = SIGNS_DICTIONARY[char];
            const imageFileName = char === 'Ñ' ? 'N_TILDE.png' : `${char}.png`;
            const SYMBOL_LABELS: Record<string, string> = {
              SYM_HEART1: '♥',
              SYM_HEART2: '♡',
              SYM_HEART3: '★',
              SYM_PEACE: '✌',
              SYM_DOG: '🐶',
              SYM_CAT: '🐱',
              SYM_SMILE: '😊',
              SYM_LAUGH: '😄',
              SYM_KISS: '😘',
              SYM_WINK: '😉'
            };
            const badgeLabel = SYMBOL_LABELS[char] || char;
            const isCustomVectorSymbol = char.startsWith('SYM_') && !['SYM_HEART1', 'SYM_HEART2', 'SYM_HEART3'].includes(char);

            return (
              <div
                key={`${char}-${index}`}
                onClick={() => onSelectLetter?.(char)}
                className="group flex flex-col items-center justify-between bg-gradient-to-b from-white to-slate-50 border-2 border-slate-200 hover:border-purple-400 rounded-2xl p-2.5 sm:p-3 shadow-xs hover:shadow-md transition-all cursor-pointer flex-shrink-0 w-28 sm:w-32 text-center active:scale-95"
              >
                {/* Letra badge estilizado */}
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shadow-xs mb-1.5 group-hover:scale-105 transition">
                  {badgeLabel}
                </div>

                {/* Ilustración chilena oficial o vector icon en alta resolución */}
                <div className="w-20 h-20 flex items-center justify-center bg-white rounded-xl border border-slate-100 p-1 shadow-inner overflow-hidden my-0.5">
                  {isCustomVectorSymbol ? (
                    <svg viewBox="0 0 100 100" className="w-14 h-14 text-slate-800">
                      <path
                        d={CHILEAN_VECTOR_SIGNS[char]?.pathD || ''}
                        fill="currentColor"
                        fillRule="evenodd"
                        stroke="none"
                      />
                    </svg>
                  ) : (
                    <Image
                      src={`/signs/letters/${imageFileName}`}
                      alt={`Seña oficial para letra ${badgeLabel}`}
                      width={70}
                      height={70}
                      className="object-contain max-h-18 w-auto drop-shadow-xs"
                    />
                  )}
                </div>

                {/* Explicación en lenguaje sencillo */}
                <div className="mt-1 flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">
                    {sign ? sign.name : `Letra ${badgeLabel}`}
                  </span>
                  <p className="text-[10px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                    {sign ? sign.description : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-extrabold">
              2
            </span>
            <span>Así se escribe en Lengua de Señas Chilena:</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ilustraciones oficiales del Alfabeto Manual Chileno (LSCh).
          </p>
        </div>
      </div>

      {shape === 'heart' ? (
        <div className="flex flex-col gap-4">
          {renderLetterRow(letters1, '🔹 Nombre 1 (Arriba):')}
          <div className="flex items-center gap-2 my-1">
            <div className="flex-1 h-px bg-rose-200" />
            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-black flex items-center gap-1 border border-rose-200">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>Corazón de Unión</span>
            </span>
            <div className="flex-1 h-px bg-rose-200" />
          </div>
          {renderLetterRow(letters2, '🔹 Nombre 2 (Abajo):')}
        </div>
      ) : (
        renderLetterRow(letters1)
      )}
    </div>
  );
};
