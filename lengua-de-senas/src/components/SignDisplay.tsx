'use client';

import React from 'react';
import Image from 'next/image';
import { SIGNS_DICTIONARY, normalizeText } from '@/lib/signsData';
import { Sparkles } from 'lucide-react';

interface SignDisplayProps {
  text: string;
  onSelectLetter?: (letter: string) => void;
}

export const SignDisplay: React.FC<SignDisplayProps> = ({ text, onSelectLetter }) => {
  const letters = normalizeText(text);

  if (letters.length === 0) {
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

      {/* Contenedor desplazable con las tarjetas de señas compactas y claras */}
      <div className="w-full overflow-x-auto pb-2 pt-0.5 scrollbar-thin">
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
            const badgeLabel = char === 'SYM_HEART1' ? '♥' : char === 'SYM_HEART2' ? '♡' : char === 'SYM_HEART3' ? '★' : char;

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

                {/* Ilustración chilena oficial en alta resolución y transparente */}
                <div className="w-20 h-20 flex items-center justify-center bg-white rounded-xl border border-slate-100 p-1 shadow-inner overflow-hidden my-0.5">
                  <Image
                    src={`/signs/letters/${imageFileName}`}
                    alt={`Seña oficial para letra ${badgeLabel}`}
                    width={70}
                    height={70}
                    className="object-contain max-h-18 w-auto drop-shadow-xs"
                  />
                </div>

                {/* Explicación en lenguaje sencillo para que cualquiera aprenda */}
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
    </div>
  );
};
