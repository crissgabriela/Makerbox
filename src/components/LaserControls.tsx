'use client';

import React from 'react';
import { LaserConfig } from '@/types';
import { Sliders, KeyRound, Layers, Bookmark, Check } from 'lucide-react';

interface LaserControlsProps {
  config: LaserConfig;
  onChange: (newConfig: LaserConfig) => void;
}

export const LaserControls: React.FC<LaserControlsProps> = ({ config, onChange }) => {
  const updateConfig = <K extends keyof LaserConfig>(key: K, value: LaserConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>Configuración de Corte y Grabado Láser</span>
        </h3>
        <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
          Estándar LightBurn / RDWorks
        </span>
      </div>

      {/* Selector de Modo de Unión */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-300">
          Modo de Estructura Física (Pieza Completa):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Modo Llavero */}
          <button
            type="button"
            onClick={() => updateConfig('mode', 'keychain')}
            className={`flex flex-col p-3 rounded-xl border text-left transition-all active:scale-95 ${
              config.mode === 'keychain'
                ? 'bg-purple-950/60 border-purple-500 shadow-purple-500/20 shadow-md ring-1 ring-purple-500'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="flex items-center gap-1.5 font-bold text-xs text-purple-200">
                <KeyRound className="w-3.5 h-3.5 text-pink-400" />
                Barra / Llavero
              </span>
              {config.mode === 'keychain' && <Check className="w-3.5 h-3.5 text-purple-400" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Señas unidas a una barra continua inferior con orificio opcional para argolla.
            </p>
          </button>

          {/* Modo Silueta */}
          <button
            type="button"
            onClick={() => updateConfig('mode', 'silhouette')}
            className={`flex flex-col p-3 rounded-xl border text-left transition-all active:scale-95 ${
              config.mode === 'silhouette'
                ? 'bg-purple-950/60 border-purple-500 shadow-purple-500/20 shadow-md ring-1 ring-purple-500'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="flex items-center gap-1.5 font-bold text-xs text-purple-200">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Silueta Unificada
              </span>
              {config.mode === 'silhouette' && <Check className="w-3.5 h-3.5 text-purple-400" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Manos solapadas lateralmente creando una sola silueta continua cortada.
            </p>
          </button>

          {/* Modo Placa */}
          <button
            type="button"
            onClick={() => updateConfig('mode', 'plaque')}
            className={`flex flex-col p-3 rounded-xl border text-left transition-all active:scale-95 ${
              config.mode === 'plaque'
                ? 'bg-purple-950/60 border-purple-500 shadow-purple-500/20 shadow-md ring-1 ring-purple-500'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="flex items-center gap-1.5 font-bold text-xs text-purple-200">
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                Placa Conmemorativa
              </span>
              {config.mode === 'plaque' && <Check className="w-3.5 h-3.5 text-purple-400" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Ficha conmemorativa rectangular con logos y señas grabadas en la superficie.
            </p>
          </button>
        </div>
      </div>

      {/* Controles numéricos y dimensiones físicas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
        {/* Altura de Señas en mm */}
        <div className="flex flex-col gap-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Altura de señas:</span>
            <span className="font-bold text-purple-300">{config.targetHeightMm} mm</span>
          </div>
          <input
            type="range"
            min={25}
            max={75}
            step={1}
            value={config.targetHeightMm}
            onChange={(e) => updateConfig('targetHeightMm', Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <span className="text-[10px] text-slate-500">Recomendado stand: 35-45 mm</span>
        </div>

        {/* Altura de Barra Base en mm (en modo keychain) */}
        {config.mode === 'keychain' && (
          <div className="flex flex-col gap-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Grosor de barra base:</span>
              <span className="font-bold text-purple-300">{config.baseBarHeightMm} mm</span>
            </div>
            <input
              type="range"
              min={7}
              max={18}
              step={1}
              value={config.baseBarHeightMm}
              onChange={(e) => updateConfig('baseBarHeightMm', Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="text-[10px] text-slate-500">Para resistencia al corte</span>
          </div>
        )}

        {/* Separación entre señas */}
        <div className="flex flex-col gap-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Espaciado entre letras:</span>
            <span className="font-bold text-purple-300">{config.signSpacingMm} mm</span>
          </div>
          <input
            type="range"
            min={1}
            max={8}
            step={0.5}
            value={config.signSpacingMm}
            onChange={(e) => updateConfig('signSpacingMm', Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <span className="text-[10px] text-slate-500">Distancia horizontal entre manos</span>
        </div>
      </div>

      {/* Opciones booleanas / Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-800">
        {/* Orificio Llavero */}
        {config.mode === 'keychain' && (
          <label className="flex items-center gap-2.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 cursor-pointer hover:border-purple-500/40 transition">
            <input
              type="checkbox"
              checked={config.addKeychainHole}
              onChange={(e) => updateConfig('addKeychainHole', e.target.checked)}
              className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
            />
            <div className="flex flex-col text-xs">
              <span className="font-medium text-slate-200">Orificio de llavero</span>
              <span className="text-[10px] text-slate-400">Diámetro {config.holeDiameterMm}mm</span>
            </div>
          </label>
        )}

        {/* Texto Latino Grabado */}
        <label className="flex items-center gap-2.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 cursor-pointer hover:border-purple-500/40 transition">
          <input
            type="checkbox"
            checked={config.includeTextEngraving}
            onChange={(e) => updateConfig('includeTextEngraving', e.target.checked)}
            className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
          />
          <div className="flex flex-col text-xs">
            <span className="font-medium text-slate-200">Grabar letras latinas</span>
            <span className="text-[10px] text-slate-400">Texto legible bajo las señas</span>
          </div>
        </label>

        {/* Sello MakerBox · UTalca */}
        <label className="flex items-center gap-2.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 cursor-pointer hover:border-purple-500/40 transition">
          <input
            type="checkbox"
            checked={config.includeBranding}
            onChange={(e) => updateConfig('includeBranding', e.target.checked)}
            className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
          />
          <div className="flex flex-col text-xs">
            <span className="font-medium text-slate-200">Sello MakerBox · UTalca</span>
            <span className="text-[10px] text-slate-400">Branding grabado en la pieza</span>
          </div>
        </label>
      </div>
    </div>
  );
};
