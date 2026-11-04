'use client';

import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  Check,
  ChevronDown,
  CircleDot,
  Download,
  Flame,
  FolderArchive,
  Hand,
  KeyRound,
  Layers,
  Printer,
  RotateCcw,
  Scissors,
  Sliders,
  Sparkles,
  Type,
} from 'lucide-react';
import {
  BrailleConfig,
  DEFAULT_BRAILLE_CONFIG,
  downloadObj,
  downloadMtl,
  downloadStl,
  downloadZip,
  generateBraille3D,
} from '@/lib/brailleGenerator';
import {
  BrailleLaserConfig,
  DEFAULT_BRAILLE_LASER_CONFIG,
  generateBrailleLaserSvg,
} from '@/lib/brailleLaserGenerator';
import {
  DEFAULT_SIGN_KEYCHAIN_3D_CONFIG,
  generateSignKeychain3D,
  SignKeychain3DConfig,
  SignKeychain3DResult,
} from '@/lib/signKeychain3DGenerator';
import { BrailleCell } from '@/lib/brailleData';
import { KeychainShape, LaserConfig } from '@/types';
import { Braille3DViewer } from './Braille3DViewer';
import { LaserSvgPreviewCard } from './LaserSvgPreviewCard';
import { TextInputSection } from './TextInputSection';
import { SignDisplay } from './SignDisplay';
import { LaserControls } from './LaserControls';
import { LaserSvgGenerator } from './LaserSvgGenerator';
import { CustomSignUploader } from './CustomSignUploader';

type KeychainDesignMode = 'braille' | 'signs';
type FabricationMethod = 'laser' | '3d';

const QUICK_SAMPLE_WORDS = ['MAIPÚ', 'LICEO', 'CIENCIA', 'MAKERBOX', 'UTALCA', 'HOLA'];

export function KeychainsToolSection() {
  const [designMode, setDesignMode] = useState<KeychainDesignMode>('braille');
  const [fabricationMethod, setFabricationMethod] = useState<FabricationMethod>('laser');

  // Palabra compartida inicial para comparar fácilmente entre Braille / Señas y Láser / 3D
  const [sharedWord, setSharedWord] = useState<string>('MAIPÚ');
  const [secondaryWord, setSecondaryWord] = useState<string>('CIENCIA');

  // Configuraciones de los 4 motores
  const [brailleLaserCfg, setBrailleLaserCfg] = useState<BrailleLaserConfig>({
    ...DEFAULT_BRAILLE_LASER_CONFIG,
    text: 'MAIPÚ',
  });

  const [braille3DCfg, setBraille3DCfg] = useState<BrailleConfig>({
    ...DEFAULT_BRAILLE_CONFIG,
    text: 'MAIPÚ',
  });

  const [signsLaserCfg, setSignsLaserCfg] = useState<LaserConfig>({
    mode: 'capsule',
    keychainShape: 'capsule',
    secondaryText: 'CIENCIA',
    targetHeightMm: 25,
    signSpacingMm: 2.5,
    contourOffsetMm: 6,
    addKeychainHole: true,
    holeDiameterMm: 4.5,
    baseBarHeightMm: 10,
    includeTextEngraving: true,
    includeBranding: false,
    materialThicknessMm: 3,
    cutStrokeColor: '#FF0000',
    engraveStrokeColor: '#0000FF',
    engraveFillColor: '#000000',
  });

  const [signs3DCfg, setSigns3DCfg] = useState<SignKeychain3DConfig>({
    ...DEFAULT_SIGN_KEYCHAIN_3D_CONFIG,
    text: 'MAIPÚ',
    secondaryText: 'CIENCIA',
  });

  // Estado UI auxiliar
  const [isSignDictionaryOpen, setIsSignDictionaryOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [showAdvanced3DFiles, setShowAdvanced3DFiles] = useState(false);
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  // Sincronizador central de texto principal
  const handlePrimaryWordChange = (nextText: string) => {
    setSharedWord(nextText);
    setBrailleLaserCfg((prev) => ({ ...prev, text: nextText }));
    setBraille3DCfg((prev) => ({ ...prev, text: nextText }));
    setSigns3DCfg((prev) => ({ ...prev, text: nextText }));
  };

  const handleSecondaryWordChange = (nextSec: string) => {
    setSecondaryWord(nextSec);
    setSignsLaserCfg((prev) => ({ ...prev, secondaryText: nextSec }));
    setSigns3DCfg((prev) => ({ ...prev, secondaryText: nextSec }));
  };

  const handleSignShapeChange = (nextShape: KeychainShape) => {
    setSignsLaserCfg((prev) => ({
      ...prev,
      keychainShape: nextShape,
      mode: nextShape === 'heart' ? 'heart' : 'capsule',
    }));
    setSigns3DCfg((prev) => ({ ...prev, shape: nextShape }));
  };

  // 1. Resultado Braille + Láser (.SVG MDF 3 mm)
  const brailleLaserResult = useMemo(() => {
    return generateBrailleLaserSvg(brailleLaserCfg);
  }, [brailleLaserCfg]);

  // 2. Resultado Braille + Impresión 3D (.STL / .ZIP)
  const braille3DResult = useMemo(() => {
    if (designMode !== 'braille' || fabricationMethod !== '3d') return null;
    try {
      return generateBraille3D(braille3DCfg);
    } catch (err) {
      console.error('Error generando Llavero Braille 3D:', err);
      return null;
    }
  }, [braille3DCfg, designMode, fabricationMethod]);

  // 3. Resultado Lengua de Señas + Impresión 3D (.STL / .ZIP)
  const signs3DResult: SignKeychain3DResult | null = useMemo(() => {
    if (!isClientMounted || designMode !== 'signs' || fabricationMethod !== '3d') return null;
    try {
      return generateSignKeychain3D(signs3DCfg);
    } catch (err) {
      console.error('Error generando Llavero Lengua de Señas 3D:', err);
      return null;
    }
  }, [isClientMounted, designMode, fabricationMethod, signs3DCfg]);

  const triggerCelebration = (tag: string) => {
    setDownloadSuccess(tag);
    try {
      confetti({
        particleCount: 65,
        spread: 65,
        origin: { y: 0.8 },
        colors: ['#7c3aed', '#f59e0b', '#10b981', '#ec4899'],
      });
    } catch {
      // Ignorar en entornos sin canvas
    }
    setTimeout(() => setDownloadSuccess(null), 3200);
  };

  // Renderizador didáctico reutilizable de celdas Braille 2D (usado en Láser y 3D)
  const renderBrailleCellsPreview = (cells: BrailleCell[], activeDots: number) => {
    if (cells.length === 0) return null;
    return (
      <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
          <span className="font-bold text-slate-700">
            Traducción a Celdas Braille Español (Matriz de 6 puntos):
          </span>
          <span className="font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            {cells.length} celdas · {activeDots} puntos activos
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 overflow-x-auto py-1.5">
          {cells.map((cell, idx) => {
            if (cell.char === ' ') {
              return (
                <div
                  key={idx}
                  className="w-8 h-16 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 font-mono"
                  title="Espacio"
                >
                  ␣
                </div>
              );
            }

            return (
              <div
                key={idx}
                className="flex flex-col items-center bg-slate-50 border border-slate-200 hover:border-amber-400 rounded-2xl p-2.5 transition shadow-xs"
              >
                <span className="font-black text-xs text-slate-800 font-mono">{cell.char}</span>
                <div className="grid grid-cols-2 gap-1.5 my-1.5 p-1 bg-white rounded-lg border border-slate-200">
                  {[1, 4, 2, 5, 3, 6].map((dotNum) => {
                    const isActive = cell.dots.includes(dotNum);
                    return (
                      <div
                        key={dotNum}
                        className={`w-2.5 h-2.5 rounded-full transition ${
                          isActive
                            ? 'bg-amber-500 ring-1 ring-amber-400 scale-105'
                            : 'bg-slate-200'
                        }`}
                        title={`Punto ${dotNum} ${isActive ? '(Activo)' : '(Inactivo)'}`}
                      />
                    );
                  })}
                </div>
                <span className="text-base text-amber-700 font-serif leading-none">
                  {cell.unicodeGlyph}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 w-full">
      {/* Banner Institucional de la Herramienta 5 */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-amber-950 text-white px-5 py-5 sm:px-8 sm:py-6 shadow-md border border-purple-800/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs font-black flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-300" />
              Herramienta 5 · Fabricación Digital Inclusiva
            </span>
            <span className="text-xs font-semibold text-purple-200/90">
              Feria Científica · Liceo Bicentenario de Niñas de Maipú · MakerBox UTalca
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Generador de Llaveros en Corte Láser y 3D
          </h1>
          <p className="text-xs sm:text-sm text-purple-100/90 max-w-3xl leading-relaxed">
            Diseña llaveros personalizados eligiendo entre{' '}
            <strong className="text-amber-300">Nombre + Braille Táctil</strong> o{' '}
            <strong className="text-pink-300">Lengua de Señas Chilena (LSCh)</strong>, y expórtalos
            en <strong className="text-white">Corte Láser (.SVG MDF 3 mm · CR Falcon 2 10W)</strong>{' '}
            o <strong className="text-white">Impresión 3D (.STL / .ZIP PLA)</strong>.
          </p>
        </div>

        {designMode === 'signs' && (
          <button
            type="button"
            onClick={() => setIsSignDictionaryOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 transition active:scale-95 shrink-0 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-amber-300" />
            <span>Ver Abecedario LSCh</span>
          </button>
        )}
      </div>

      {/* Doble Selector Principal: 1) Estilo Inclusivo  ×  2) Método de Fabricación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Selector 1: Estilo de Llavero */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-slate-200 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Paso A · Elige el Estilo del Llavero
            </span>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
              Inclusión & Comunicación
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDesignMode('braille')}
              className={`p-3.5 rounded-2xl border-2 text-left transition flex items-start gap-3 cursor-pointer ${
                designMode === 'braille'
                  ? 'bg-amber-50/90 border-amber-500 shadow-xs ring-2 ring-amber-200/60'
                  : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black ${
                  designMode === 'braille'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Type className="w-5 h-5" />
              </div>
              <div>
                <div className="font-black text-sm text-slate-900">Nombre + Braille</div>
                <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                  Palabra legible + celdas táctiles de 6 puntos en español.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDesignMode('signs')}
              className={`p-3.5 rounded-2xl border-2 text-left transition flex items-start gap-3 cursor-pointer ${
                designMode === 'signs'
                  ? 'bg-purple-50/90 border-purple-600 shadow-xs ring-2 ring-purple-200/60'
                  : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black ${
                  designMode === 'signs'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Hand className="w-5 h-5" />
              </div>
              <div>
                <div className="font-black text-sm text-slate-900">Lengua de Señas Chilena</div>
                <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                  Manos anatómicas LSCh + Cápsula (25 mm) o Corazón Dúo (60 mm).
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Selector 2: Técnica de Fabricación */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-slate-200 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Paso B · Elige la Máquina de Fabricación
            </span>
            <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full">
              MDF 3 mm o PLA 3D
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setFabricationMethod('laser')}
              className={`p-3.5 rounded-2xl border-2 text-left transition flex items-start gap-3 cursor-pointer ${
                fabricationMethod === 'laser'
                  ? 'bg-orange-50/90 border-orange-500 shadow-xs ring-2 ring-orange-200/60'
                  : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  fabricationMethod === 'laser'
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="font-black text-sm text-slate-900">Corte Láser (.SVG)</div>
                <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                  Madera MDF 3 mm · CR-Laser Falcon 2 10W (~1–2 min por llavero).
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFabricationMethod('3d')}
              className={`p-3.5 rounded-2xl border-2 text-left transition flex items-start gap-3 cursor-pointer ${
                fabricationMethod === '3d'
                  ? 'bg-indigo-50/90 border-indigo-600 shadow-xs ring-2 ring-indigo-200/60'
                  : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  fabricationMethod === '3d'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="font-black text-sm text-slate-900">Impresión 3D (.STL)</div>
                <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                  Filamento PLA con relieve táctil real · Monocolor o Multicolor AMS.
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          RAMA 1: NOMBRE + BRAILLE ESPAÑOL (TANTO LÁSER .SVG COMO IMPRESIÓN 3D .STL)
         ===================================================================== */}
      {designMode === 'braille' && (
        <>
          {/* Tarjeta de entrada de texto + vista previa de celdas Braille */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>🔤</span>
                  <span>Escribe el nombre o palabra para traducir a Braille</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Soporta letras (A–Z), Ñ, tildes (Á, É, Í, Ó, Ú), números con prefijo # y signos.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium mr-1">Ejemplos rápidos:</span>
                {QUICK_SAMPLE_WORDS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => handlePrimaryWordChange(w)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition active:scale-95 cursor-pointer ${
                      sharedWord.toUpperCase() === w
                        ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                value={sharedWord}
                onChange={(e) => handlePrimaryWordChange(e.target.value.toUpperCase())}
                placeholder="EJ: MAIPÚ O TU NOMBRE..."
                maxLength={16}
                className="w-full text-xl sm:text-2xl font-black tracking-wider text-slate-900 bg-slate-50 border-2 border-slate-300 focus:border-amber-500 focus:bg-white rounded-2xl px-5 py-4 outline-hidden transition shadow-inner"
              />
              {sharedWord && (
                <button
                  type="button"
                  onClick={() => handlePrimaryWordChange('')}
                  className="absolute right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
                  title="Limpiar texto"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
            </div>

            {fabricationMethod === 'laser'
              ? renderBrailleCellsPreview(
                  brailleLaserResult.cells,
                  brailleLaserResult.activeDotCount
                )
              : braille3DResult
              ? renderBrailleCellsPreview(braille3DResult.cells, braille3DResult.dotCount)
              : null}
          </div>

          {/* SUBRAMA 1A: NOMBRE + BRAILLE -> CORTE LÁSER (.SVG MDF 3 mm) */}
          {fabricationMethod === 'laser' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Controles Láser (4 columnas) */}
              <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-orange-600" />
                    <span>Parámetros Láser (MDF 3 mm)</span>
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                    Falcon 2 · 10W
                  </span>
                </div>

                {/* Silueta exterior */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-700">Silueta de Corte Exterior:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setBrailleLaserCfg((p) => ({ ...p, shape: 'capsule' }))
                      }
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                        brailleLaserCfg.shape === 'capsule'
                          ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Cápsula Redonda
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setBrailleLaserCfg((p) => ({ ...p, shape: 'rounded_rect' }))
                      }
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                        brailleLaserCfg.shape === 'rounded_rect'
                          ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Placa Rectangular
                    </button>
                  </div>
                </div>

                {/* Alto de la placa */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Alto del Llavero:</span>
                    <span className="font-mono font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                      {brailleLaserCfg.plateHeightMm.toFixed(0)} mm
                    </span>
                  </div>
                  <input
                    type="range"
                    min={18}
                    max={30}
                    step={1}
                    value={brailleLaserCfg.plateHeightMm}
                    onChange={(e) =>
                      setBrailleLaserCfg((p) => ({
                        ...p,
                        plateHeightMm: Number(e.target.value),
                      }))
                    }
                    className="accent-orange-600 w-full cursor-pointer"
                  />
                </div>

                {/* Diámetro de puntos Braille grabados */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Diámetro Punto Braille:</span>
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                      {brailleLaserCfg.dotDiameterMm.toFixed(1)} mm
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1.2}
                    max={2.0}
                    step={0.1}
                    value={brailleLaserCfg.dotDiameterMm}
                    onChange={(e) =>
                      setBrailleLaserCfg((p) => ({
                        ...p,
                        dotDiameterMm: Number(e.target.value),
                      }))
                    }
                    className="accent-orange-600 w-full cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-400">
                    1.5 mm permite lectura por bajorrelieve láser o inserción de mostacillas/perlas táctiles.
                  </span>
                </div>

                {/* Diámetro agujero argolla */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Orificio para Argolla:</span>
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                      {brailleLaserCfg.holeDiameterMm.toFixed(1)} mm
                    </span>
                  </div>
                  <input
                    type="range"
                    min={3.5}
                    max={6.0}
                    step={0.5}
                    value={brailleLaserCfg.holeDiameterMm}
                    onChange={(e) =>
                      setBrailleLaserCfg((p) => ({
                        ...p,
                        holeDiameterMm: Number(e.target.value),
                      }))
                    }
                    className="accent-orange-600 w-full cursor-pointer"
                  />
                </div>

                {/* Opciones booleanas */}
                <div className="space-y-2.5 pt-1 border-t border-slate-100">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="text-xs font-bold text-slate-700">
                      Grabar palabra arriba (#000000)
                    </span>
                    <input
                      type="checkbox"
                      checked={brailleLaserCfg.includeText}
                      onChange={(e) =>
                        setBrailleLaserCfg((p) => ({ ...p, includeText: e.target.checked }))
                      }
                      className="w-4 h-4 accent-orange-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="text-xs font-bold text-slate-700">
                      Guías didácticas de celda (#0000FF)
                    </span>
                    <input
                      type="checkbox"
                      checked={brailleLaserCfg.showCellGuides}
                      onChange={(e) =>
                        setBrailleLaserCfg((p) => ({ ...p, showCellGuides: e.target.checked }))
                      }
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="text-xs font-bold text-slate-700">
                      Incluir corte de argolla (#FF0000)
                    </span>
                    <input
                      type="checkbox"
                      checked={brailleLaserCfg.addKeychainHole}
                      onChange={(e) =>
                        setBrailleLaserCfg((p) => ({
                          ...p,
                          addKeychainHole: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-red-600 rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Tarjeta de Vista Previa MDF / CAD y Descarga SVG (8 columnas) */}
              <div className="lg:col-span-8">
                <LaserSvgPreviewCard
                  svgContent={brailleLaserResult.svgContent}
                  widthMm={brailleLaserResult.bodyWidthMm}
                  heightMm={brailleLaserResult.bodyHeightMm}
                  estimatedMinutes={brailleLaserResult.estimatedMinutes}
                  filename={brailleLaserResult.filename}
                  title={`Llavero Braille en MDF 3 mm · "${(sharedWord || 'MAIPÚ').toUpperCase()}"`}
                />
              </div>
            </div>
          )}

          {/* SUBRAMA 1B: NOMBRE + BRAILLE -> IMPRESIÓN 3D (.STL / .ZIP) */}
          {fabricationMethod === '3d' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Visor 3D (7 columnas) */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Printer className="w-5 h-5 text-amber-500" />
                    <span>Simulador 3D Táctil en Tiempo Real</span>
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    Three.js WebGL
                  </span>
                </div>

                <Braille3DViewer
                  modelResult={braille3DResult}
                  baseColor={braille3DCfg.baseColor}
                  dotColor={braille3DCfg.dotColor}
                  textMode={braille3DCfg.textMode}
                  hudMode="braille"
                  baseThicknessMm={braille3DCfg.plateThicknessMm}
                  reliefHeightMm={braille3DCfg.dotHeightMm}
                  onColorChange={(b, d) => {
                    setBraille3DCfg((prev) => ({ ...prev, baseColor: b, dotColor: d }));
                  }}
                />
              </div>

              {/* Controles y Descarga 3D (5 columnas) */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-5">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Sliders className="w-4 h-4 text-amber-500" />
                    <span>Parámetros Físicos de Impresión 3D</span>
                  </h3>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">Espesor de la Placa Base:</span>
                      <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {braille3DCfg.plateThicknessMm.toFixed(2)} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.6}
                      max={2.0}
                      step={0.1}
                      value={braille3DCfg.plateThicknessMm}
                      onChange={(e) =>
                        setBraille3DCfg((p) => ({
                          ...p,
                          plateThicknessMm: parseFloat(e.target.value),
                        }))
                      }
                      className="accent-amber-500 w-full cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-400">
                      0.8 mm imprime ultrarrápido (~4 min en stand); 1.6 mm brinda mayor rigidez.
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">Altura Puntos Braille:</span>
                      <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        +{braille3DCfg.dotHeightMm.toFixed(2)} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.25}
                      max={0.65}
                      step={0.02}
                      value={braille3DCfg.dotHeightMm}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setBraille3DCfg((p) => ({
                          ...p,
                          dotHeightMm: val,
                          textHeightReliefMm: val,
                        }));
                      }}
                      className="accent-amber-500 w-full cursor-pointer"
                    />
                  </div>

                  {/* Palabra en relieve o tallada */}
                  <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-cyan-50/70 border border-cyan-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        ✍️ Incluir Palabra Escrita sobre el Braille
                      </span>
                      <input
                        type="checkbox"
                        checked={braille3DCfg.includeText}
                        onChange={(e) =>
                          setBraille3DCfg((p) => ({ ...p, includeText: e.target.checked }))
                        }
                        className="w-4 h-4 accent-cyan-600 rounded cursor-pointer"
                      />
                    </div>

                    {braille3DCfg.includeText && (
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-cyan-200/60">
                        <span className="text-[11px] text-slate-600 font-semibold">Modo:</span>
                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-cyan-200">
                          <button
                            type="button"
                            onClick={() =>
                              setBraille3DCfg((p) => ({ ...p, textMode: 'emboss' }))
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              braille3DCfg.textMode === 'emboss'
                                ? 'bg-cyan-600 text-white'
                                : 'text-slate-600'
                            }`}
                          >
                            Sobre Relieve
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setBraille3DCfg((p) => ({ ...p, textMode: 'deboss' }))
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              braille3DCfg.textMode === 'deboss'
                                ? 'bg-cyan-600 text-white'
                                : 'text-slate-600'
                            }`}
                          >
                            Bajo Relieve
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <CircleDot className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Orificio para Argolla de Llavero
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={braille3DCfg.addKeychainHole}
                      onChange={(e) =>
                        setBraille3DCfg((p) => ({ ...p, addKeychainHole: e.target.checked }))
                      }
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                  </label>
                </div>

                {/* Descargas 3D Braille */}
                <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white rounded-3xl p-6 shadow-md flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Printer className="w-5 h-5 text-amber-100" />
                      <h3 className="font-black text-lg">Exportar Llavero 3D</h3>
                    </div>
                    {braille3DResult && (
                      <span className="text-xs bg-black/20 px-2.5 py-1 rounded-full font-mono">
                        ~{braille3DResult.estimatedWeightGrams}g · ~
                        {braille3DResult.estimatedPrintTimeMinutes} min
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!braille3DResult) return;
                      downloadStl(
                        braille3DResult.stlBuffer,
                        `${braille3DResult.baseFilename}.stl`
                      );
                      triggerCelebration('BRAILLE_STL');
                    }}
                    className="w-full bg-white text-slate-900 hover:bg-amber-50 font-black text-base py-3.5 px-4 rounded-2xl transition active:scale-95 shadow-md flex items-center justify-between gap-2 border-2 border-amber-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {downloadSuccess === 'BRAILLE_STL' ? (
                        <Check className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Download className="w-5 h-5 text-amber-600" />
                      )}
                      <div className="flex flex-col text-left">
                        <span>
                          {downloadSuccess === 'BRAILLE_STL'
                            ? '¡Archivo .STL Descargado!'
                            : 'Descargar .STL para Impresora 3D'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {braille3DResult?.widthMm || 38} × {braille3DResult?.heightMm || 16} mm ·
                          Cura / OrcaSlicer / Creality Print
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black bg-amber-500 text-white px-3 py-1 rounded-xl">
                      .STL
                    </span>
                  </button>

                  {/* Opciones multicolor AMS */}
                  <div className="pt-1 border-t border-white/15">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced3DFiles(!showAdvanced3DFiles)}
                      className="w-full py-1.5 text-xs text-amber-100 hover:text-white flex items-center justify-between font-semibold transition cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <FolderArchive className="w-3.5 h-3.5" />
                        Opciones Multicolor (Bambu Lab AMS / OBJ+MTL)
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          showAdvanced3DFiles ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showAdvanced3DFiles && braille3DResult && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 p-3 bg-black/20 rounded-2xl border border-white/10 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            downloadZip(
                              braille3DResult.multiPartZipBuffer,
                              `${braille3DResult.baseFilename}_Multipieza_AMS.zip`
                            );
                            triggerCelebration('BRAILLE_ZIP');
                          }}
                          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-left text-white flex flex-col gap-0.5 transition cursor-pointer"
                        >
                          <span className="font-bold flex items-center gap-1">
                            <Layers className="w-3 h-3 text-emerald-300" />
                            STL Multipieza (.ZIP)
                          </span>
                          <span className="text-[10px] text-amber-100/80">
                            Placa, puntos y letras separados
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            downloadObj(
                              braille3DResult.objContent,
                              `${braille3DResult.baseFilename}.obj`
                            );
                            downloadMtl(
                              braille3DResult.mtlContent,
                              `${braille3DResult.baseFilename}.mtl`
                            );
                            triggerCelebration('BRAILLE_OBJ');
                          }}
                          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-left text-white flex flex-col gap-0.5 transition cursor-pointer"
                        >
                          <span className="font-bold">OBJ + MTL con Color</span>
                          <span className="text-[10px] text-amber-100/80">
                            Malla 3D con materiales asignados
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* =====================================================================
          RAMA 2: LENGUA DE SEÑAS CHILENA (TANTO LÁSER .SVG COMO IMPRESIÓN 3D .STL)
         ===================================================================== */}
      {designMode === 'signs' && (
        <>
          {/* Entrada interactiva de palabras + símbolos + selector Cápsula / Corazón Dúo */}
          <TextInputSection
            value={sharedWord}
            onChange={handlePrimaryWordChange}
            secondaryValue={secondaryWord}
            onSecondaryChange={handleSecondaryWordChange}
            shape={signsLaserCfg.keychainShape || 'capsule'}
            onShapeChange={handleSignShapeChange}
            onClear={() => handlePrimaryWordChange('')}
            onQuickWord={(w) => handlePrimaryWordChange(w)}
          />

          {/* Visualización pedagógica letra por letra del Alfabeto Manual Chileno */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-black">
                    2
                  </span>
                  <span>Traducción letra por letra en Lengua de Señas Chilena (LSCh)</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Haz clic sobre cualquier mano para abrir el afiche completo del Alfabeto Manual Chileno.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSignDictionaryOpen(true)}
                className="text-xs font-extrabold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explorar Diccionario LSCh</span>
              </button>
            </div>

            <SignDisplay
              text={sharedWord}
              secondaryText={secondaryWord}
              shape={signsLaserCfg.keychainShape || 'capsule'}
              onSelectLetter={() => setIsSignDictionaryOpen(true)}
            />
          </div>

          {/* SUBRAMA 2A: LENGUA DE SEÑAS -> CORTE LÁSER (.SVG MDF 3 mm) */}
          {fabricationMethod === 'laser' && (
            <>
              <LaserControls
                config={signsLaserCfg}
                onChange={(next) => {
                  setSignsLaserCfg(next);
                  if (next.keychainShape) {
                    setSigns3DCfg((p) => ({
                      ...p,
                      shape: next.keychainShape || 'capsule',
                      holeDiameterMm: next.holeDiameterMm,
                      signSpacingMm: next.signSpacingMm,
                    }));
                  }
                }}
              />

              <LaserSvgGenerator
                text={sharedWord}
                secondaryText={secondaryWord}
                config={signsLaserCfg}
              />
            </>
          )}

          {/* SUBRAMA 2B: LENGUA DE SEÑAS -> IMPRESIÓN 3D (.STL / .ZIP EN RELIEVE) */}
          {fabricationMethod === '3d' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Visor 3D en Tiempo Real (7 columnas) */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Printer className="w-5 h-5 text-purple-600" />
                    <span>Simulador 3D de Señas en Sobre-Relieve</span>
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    {signs3DCfg.shape === 'heart'
                      ? '💖 Corazón Dúo 3D (60 mm)'
                      : '🔑 Cápsula 3D (25 mm)'}
                  </span>
                </div>

                <Braille3DViewer
                  modelResult={signs3DResult}
                  baseColor={signs3DCfg.baseColor}
                  dotColor={signs3DCfg.reliefColor}
                  hudMode="signs"
                  baseThicknessMm={signs3DCfg.baseThicknessMm}
                  reliefHeightMm={signs3DCfg.reliefHeightMm}
                  isLoading={!isClientMounted}
                  onColorChange={(b, d) =>
                    setSigns3DCfg((prev) => ({ ...prev, baseColor: b, reliefColor: d }))
                  }
                />
              </div>

              {/* Controles y Exportación STL/ZIP para Lengua de Señas 3D (5 columnas) */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-5">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Sliders className="w-4 h-4 text-purple-600" />
                    <span>Parámetros 3D (Lengua de Señas)</span>
                  </h3>

                  {/* Selector rápido de formato Cápsula vs Corazón Dúo */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSignShapeChange('capsule')}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                        signs3DCfg.shape === 'capsule'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🔑 Cápsula (25 mm)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSignShapeChange('heart')}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                        signs3DCfg.shape === 'heart'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      💖 Corazón Dúo (60 mm)
                    </button>
                  </div>

                  {/* Espesor de la base PLA */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">Espesor Placa Base (PLA):</span>
                      <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        {signs3DCfg.baseThicknessMm.toFixed(1)} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1.2}
                      max={3.2}
                      step={0.2}
                      value={signs3DCfg.baseThicknessMm}
                      onChange={(e) =>
                        setSigns3DCfg((p) => ({
                          ...p,
                          baseThicknessMm: parseFloat(e.target.value),
                        }))
                      }
                      className="accent-purple-600 w-full cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-400">
                      2.0 mm ofrece excelente firmeza estructural en el bolsillo o mochila.
                    </span>
                  </div>

                  {/* Altura del sobre-relieve de manos y letras */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">Altura Relieve de Señas:</span>
                      <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        +{signs3DCfg.reliefHeightMm.toFixed(2)} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.3}
                      max={1.2}
                      step={0.1}
                      value={signs3DCfg.reliefHeightMm}
                      onChange={(e) =>
                        setSigns3DCfg((p) => ({
                          ...p,
                          reliefHeightMm: parseFloat(e.target.value),
                        }))
                      }
                      className="accent-purple-600 w-full cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-400">
                      +0.60 mm equivale a 3 capas de 0.20 mm: ideal para cambio de filamento por altura (M600).
                    </span>
                  </div>

                  {/* Diámetro argolla y espaciado */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-700">Argolla:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {signs3DCfg.holeDiameterMm.toFixed(1)} mm
                        </span>
                      </div>
                      <input
                        type="range"
                        min={3.0}
                        max={6.0}
                        step={0.5}
                        value={signs3DCfg.holeDiameterMm}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setSigns3DCfg((p) => ({ ...p, holeDiameterMm: v }));
                          setSignsLaserCfg((p) => ({ ...p, holeDiameterMm: v }));
                        }}
                        className="accent-purple-600 w-full cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-700">Espaciado:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {signs3DCfg.signSpacingMm.toFixed(1)} mm
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1.0}
                        max={5.0}
                        step={0.5}
                        value={signs3DCfg.signSpacingMm}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setSigns3DCfg((p) => ({ ...p, signSpacingMm: v }));
                          setSignsLaserCfg((p) => ({ ...p, signSpacingMm: v }));
                        }}
                        className="accent-purple-600 w-full cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Tarjeta de Descarga 3D Lengua de Señas */}
                <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 text-white rounded-3xl p-6 shadow-md flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Printer className="w-5 h-5 text-purple-200" />
                      <h3 className="font-black text-lg">Exportar Llavero LSCh 3D</h3>
                    </div>
                    {signs3DResult && (
                      <span className="text-xs bg-black/25 px-2.5 py-1 rounded-full font-mono">
                        ~{signs3DResult.estimatedWeightGrams}g · ~
                        {signs3DResult.estimatedPrintTimeMinutes} min
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!signs3DResult}
                    onClick={() => {
                      if (!signs3DResult) return;
                      downloadStl(
                        signs3DResult.stlBuffer,
                        `${signs3DResult.baseFilename}.stl`
                      );
                      triggerCelebration('SIGNS_STL');
                    }}
                    className="w-full bg-white text-slate-900 hover:bg-purple-50 disabled:opacity-60 font-black text-base py-3.5 px-4 rounded-2xl transition active:scale-95 shadow-md flex items-center justify-between gap-2 border-2 border-purple-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {downloadSuccess === 'SIGNS_STL' ? (
                        <Check className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Download className="w-5 h-5 text-purple-700" />
                      )}
                      <div className="flex flex-col text-left">
                        <span>
                          {downloadSuccess === 'SIGNS_STL'
                            ? '¡Archivo .STL Descargado!'
                            : 'Descargar .STL Monocolor'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {signs3DResult?.widthMm || 60} × {signs3DResult?.heightMm || 25} ×{' '}
                          {signs3DResult?.totalThicknessMm || 2.6} mm
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black bg-purple-600 text-white px-3 py-1 rounded-xl">
                      .STL
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={!signs3DResult}
                    onClick={() => {
                      if (!signs3DResult) return;
                      downloadZip(
                        signs3DResult.multiPartZipBuffer,
                        `${signs3DResult.baseFilename}_2Colores_AMS.zip`
                      );
                      triggerCelebration('SIGNS_ZIP');
                    }}
                    className="w-full bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold text-xs py-2.5 px-4 rounded-2xl transition flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-300" />
                      <span>
                        {downloadSuccess === 'SIGNS_ZIP'
                          ? '¡ZIP Multicolor Descargado!'
                          : 'Descargar .ZIP Bicolor (Placa + Señas separadas para AMS)'}
                      </span>
                    </span>
                    <span className="font-mono text-[11px] bg-black/25 px-2 py-0.5 rounded-lg">
                      .ZIP
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Diccionario del Alfabeto Manual Chileno */}
      <CustomSignUploader
        isOpen={isSignDictionaryOpen}
        onClose={() => setIsSignDictionaryOpen(false)}
      />
    </div>
  );
}
