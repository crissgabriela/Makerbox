'use client';

import React, { useState } from 'react';
import { SIGNS_DICTIONARY } from '@/lib/signsData';
import { X, Layers, Upload, Check, FolderOpen, Sparkles } from 'lucide-react';

interface CustomSignUploaderProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomSignUploader: React.FC<CustomSignUploaderProps> = ({ isOpen, onClose }) => {
  const [selectedLetter, setSelectedLetter] = useState<string>('A');
  const [customNotice, setCustomNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const letters = Object.keys(SIGNS_DICTIONARY).sort();
  const currentSign = SIGNS_DICTIONARY[selectedLetter];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomNotice(`Archivo "${file.name}" recibido para la seña ${selectedLetter}. Puedes colocarlo en la carpeta /public/signs/${selectedLetter.toLowerCase()}.svg para persistirlo.`);
    setTimeout(() => setCustomNotice(null), 6000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-950 text-purple-400 border border-purple-800">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Catálogo del Alfabeto de Lengua de Señas
              </h2>
              <p className="text-xs text-slate-400">
                27 señas vectoriales integradas (A-Z y Ñ) optimizadas para corte y grabado láser
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificación de carga */}
        {customNotice && (
          <div className="p-3 bg-purple-950/80 border border-purple-600/50 rounded-xl text-xs text-purple-200 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{customNotice}</span>
          </div>
        )}

        {/* Selector de letras (A-Z y Ñ) */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-300">Selecciona una letra para inspeccionar o personalizar:</span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
            {letters.map((char) => (
              <button
                key={char}
                onClick={() => setSelectedLetter(char)}
                className={`w-8 h-8 rounded-lg font-bold text-xs transition active:scale-90 flex items-center justify-center ${
                  selectedLetter === char
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {char}
              </button>
            ))}
          </div>
        </div>

        {/* Detalle de la Seña Seleccionada */}
        {currentSign && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            {/* Visualizador vectorial */}
            <div className="flex flex-col items-center justify-center bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="w-32 h-40 flex items-center justify-center p-2">
                <svg viewBox={currentSign.viewBox} className="w-full h-full object-contain">
                  <path
                    d={currentSign.outerPath}
                    fill="#8b5cf6"
                    fillOpacity="0.15"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                  />
                  {currentSign.innerPaths.map((innerD, i) => (
                    <path
                      key={i}
                      d={innerD}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                </svg>
              </div>
              <span className="text-xs font-bold text-purple-300 mt-2">
                {currentSign.name}
              </span>
              <span className="text-[11px] text-slate-400 text-center mt-1">
                {currentSign.description}
              </span>
            </div>

            {/* Opciones para sustitución o añadido institucional */}
            <div className="flex flex-col justify-between gap-3 text-xs text-slate-300">
              <div className="space-y-2">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  ¿Deseas reemplazar esta seña?
                </h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  El sistema incluye de fábrica este vector optimizado con trazo exterior rojo de corte y marcado azul de articulaciones. Si la UTalca o tu asociación tiene un SVG oficial, puedes cargarlo aquí:
                </p>

                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-purple-500/40 bg-purple-950/30 hover:bg-purple-950/60 cursor-pointer transition text-purple-300 hover:text-purple-200">
                  <Upload className="w-4 h-4" />
                  <span className="font-semibold text-xs">Cargar SVG para la letra {selectedLetter}</span>
                  <input
                    type="file"
                    accept=".svg,.png,.jpg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <FolderOpen className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Carga masiva:</strong> También puedes colocar tus archivos directamente en la carpeta{' '}
                  <code className="text-purple-300">/public/signs/</code> de este proyecto para usarlos permanentemente.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Botón de cierre */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition active:scale-95"
          >
            Listo, volver al generador
          </button>
        </div>
      </div>
    </div>
  );
};
