'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { SIGNS_DICTIONARY, getChileanSpriteStyle } from '@/lib/signsData';
import { X, BookOpen, Sparkles, Check, Upload, Layers } from 'lucide-react';

interface CustomSignUploaderProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomSignUploader: React.FC<CustomSignUploaderProps> = ({ isOpen, onClose }) => {
  const [selectedLetter, setSelectedLetter] = useState<string>('A');
  const [customNotice, setCustomNotice] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'individual' | 'poster'>('individual');

  if (!isOpen) return null;

  const letters = Object.keys(SIGNS_DICTIONARY).sort();
  const currentSign = SIGNS_DICTIONARY[selectedLetter];
  const spriteStyle = getChileanSpriteStyle(selectedLetter, 1.4);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomNotice(`Archivo "${file.name}" cargado para la letra ${selectedLetter}.`);
    setTimeout(() => setCustomNotice(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Cabecera amigable */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                Alfabeto Manual Chileno
              </h2>
              <p className="text-sm text-slate-500">
                Lengua de Señas Chilena (LSCh) — Stand Demostrativo MakerBox UTalca
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Notificación de carga */}
        {customNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-800 flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{customNotice}</span>
          </div>
        )}

        {/* Selector de vista: Letra por letra vs Afiche completo */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setViewMode('individual')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              viewMode === 'individual'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Explorar Letra por Letra
          </button>
          <button
            type="button"
            onClick={() => setViewMode('poster')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              viewMode === 'poster'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Ver Afiche Completo
          </button>
        </div>

        {viewMode === 'poster' ? (
          /* Vista del afiche completo oficial */
          <div className="flex flex-col items-center justify-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <Image
              src="/signs/senas-chile.jpg"
              alt="Afiche oficial del Alfabeto Manual Chileno"
              width={452}
              height={678}
              className="rounded-xl shadow-md max-h-[60vh] w-auto object-contain"
            />
            <span className="text-xs text-slate-400 mt-3">
              Guía gráfica oficial de dactilología chilena (LSCh)
            </span>
          </div>
        ) : (
          /* Vista individual interactiva */
          <div className="flex flex-col gap-5">
            {/* Fila de letras táctiles A-Z y Ñ */}
            <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-200 max-h-32 overflow-y-auto">
              {letters.map((char) => (
                <button
                  key={char}
                  onClick={() => setSelectedLetter(char)}
                  className={`w-10 h-10 rounded-xl font-extrabold text-sm transition active:scale-95 flex items-center justify-center ${
                    selectedLetter === char
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-purple-50 border border-slate-200'
                  }`}
                >
                  {char}
                </button>
              ))}
            </div>

            {/* Ficha de la letra seleccionada */}
            {currentSign && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-200 items-center">
                {/* Imagen recortada */}
                <div className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-sm mb-3">
                    {selectedLetter}
                  </div>
                  <div className="w-32 h-36 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 p-2 overflow-hidden shadow-inner">
                    <div style={spriteStyle} />
                  </div>
                  <span className="text-base font-bold text-slate-800 mt-3">
                    {currentSign.name}
                  </span>
                </div>

                {/* Explicación y personalización */}
                <div className="flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      ¿Cómo se hace esta seña?
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed bg-white p-4 rounded-2xl border border-slate-200">
                      {currentSign.description}
                    </p>
                  </div>

                  {/* Carga de reemplazo opcional */}
                  <div className="pt-2 border-t border-slate-200">
                    <label className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/50 hover:bg-purple-100/60 cursor-pointer transition text-purple-900 font-bold text-sm">
                      <Upload className="w-4 h-4" />
                      <span>Cargar otra imagen o vector para la letra {selectedLetter}</span>
                      <input
                        type="file"
                        accept=".svg,.png,.jpg"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botón de cierre */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition active:scale-95"
          >
            Volver a la plataforma
          </button>
        </div>
      </div>
    </div>
  );
};
