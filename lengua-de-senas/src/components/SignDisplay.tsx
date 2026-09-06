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
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-base font-extrabold">
              2
            </span>
            <span>Así se escribe en Lengua de Señas Chilena:</span>
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Ilustraciones oficiales del Alfabeto Manual Chileno (LSCh).
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
          {letters.length} {letters.length === 1 ? 'letra' : 'letras'}
        </span>
      </div>

      {/* Contenedor desplazable con las tarjetas de señas grandes y claras */}
      <div className="w-full overflow-x-auto pb-4 pt-1 scrollbar-thin">
        <div className="flex items-stretch gap-4 min-w-min">
          {letters.map((char, index) => {
            if (char === ' ') {
              return (
                <div
                  key={`space-${index}`}
                  className="w-16 min-h-[220px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 font-bold text-xs"
                >
                  <span className="rotate-90 tracking-widest uppercase">Espacio</span>
                </div>
              );
            }

            const sign = SIGNS_DICTIONARY[char];
            const imageFileName = char === 'Ñ' ? 'N_TILDE.png' : `${char}.png`;

            return (
              <div
                key={`${char}-${index}`}
                onClick={() => onSelectLetter?.(char)}
                className="group flex flex-col items-center justify-between bg-gradient-to-b from-white to-slate-50 border-2 border-slate-200 hover:border-purple-400 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex-shrink-0 w-36 sm:w-40 text-center active:scale-95"
              >
                {/* Letra badge gigante */}
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md mb-2 group-hover:scale-105 transition">
                  {char}
                </div>

                {/* Ilustración chilena oficial en alta resolución y transparente */}
                <div className="w-24 h-28 flex items-center justify-center bg-white rounded-xl border border-slate-100 p-2 shadow-inner overflow-hidden my-1">
                  <Image
                    src={`/signs/letters/${imageFileName}`}
                    alt={`Seña oficial para letra ${char}`}
                    width={80}
                    height={100}
                    className="object-contain max-h-24 w-auto drop-shadow-sm"
                  />
                </div>

                {/* Explicación en lenguaje sencillo para que cualquiera aprenda */}
                <div className="mt-2 flex flex-col items-center">
                  <span className="text-sm font-bold text-slate-800">
                    {sign ? sign.name : `Letra ${char}`}
                  </span>
                  <p className="text-[11px] text-slate-500 leading-snug mt-1 line-clamp-2">
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
