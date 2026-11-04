'use client';

import React from 'react';
import { LaserConfig } from '@/types';
import { Sparkles, KeyRound, Bookmark, Check, Shield } from 'lucide-react';

interface LaserControlsProps {
  config: LaserConfig;
  onChange: (newConfig: LaserConfig) => void;
}

export const LaserControls: React.FC<LaserControlsProps> = ({ config, onChange }) => {
  const updateConfig = <K extends keyof LaserConfig>(key: K, value: LaserConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 flex flex-col gap-6">
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-base font-extrabold">
              3
            </span>
            <span>Ajustes de tu llavero:</span>
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Personaliza el formato y las medidas antes de enviarlo a la cortadora láser.
          </p>
        </div>

        {/* Selector de formato / modelo */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => updateConfig('keychainShape', 'capsule')}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 ${
              (config.keychainShape || 'capsule') === 'capsule'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Cápsula (25 mm)</span>
          </button>

          <button
            type="button"
            onClick={() => updateConfig('keychainShape', 'heart')}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 ${
              config.keychainShape === 'heart'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>💖 Corazón Dúo (60 mm)</span>
          </button>
        </div>
      </div>

      {/* Controles de medida esenciales: orificio y separación */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Diámetro del orificio de argolla */}
        <div className="flex flex-col justify-between gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">Agujero para argolla:</span>
              <span className="text-sm font-extrabold text-purple-700">{config.holeDiameterMm || 4.5} mm</span>
            </div>
            <input
              type="range"
              min={3}
              max={6}
              step={0.5}
              value={config.holeDiameterMm || 4.5}
              onChange={(e) => updateConfig('holeDiameterMm', Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg mt-2"
            />
          </div>
          <span className="text-xs text-slate-400">
            {config.keychainShape === 'heart'
              ? 'Ubicado en el lóbulo superior izquierdo con pared segura'
              : 'Centrado a 12.5 mm con pared estructural segura'}
          </span>
        </div>

        {/* Espaciado entre señas */}
        <div className="flex flex-col justify-between gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">Espaciado entre letras:</span>
              <span className="text-sm font-extrabold text-purple-700">{config.signSpacingMm || 2.5} mm</span>
            </div>
            <input
              type="range"
              min={1}
              max={6}
              step={0.5}
              value={config.signSpacingMm || 2.5}
              onChange={(e) => updateConfig('signSpacingMm', Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg mt-2"
            />
          </div>
          <span className="text-xs text-slate-400">Separación horizontal entre manos</span>
        </div>
      </div>
    </div>
  );
};
