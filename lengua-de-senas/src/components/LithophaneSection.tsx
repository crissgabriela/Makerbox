'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LithophaneConfig,
  DEFAULT_LITHOPHANE_CONFIG,
  LithophaneResult,
  generateLithophane3D,
  downloadStlFile
} from '@/lib/lithophaneGenerator';
import {
  LaserImageConfig,
  DEFAULT_LASER_IMAGE_CONFIG,
  ProcessedLaserResult,
  processImageForLaser,
  downloadLaserSvg,
  downloadLaserPng
} from '@/lib/laserImageProcessor';
import { Lithophane3DViewer } from './Lithophane3DViewer';
import { ImageFramingEditor } from './ImageFramingEditor';
import {
  Upload,
  Download,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Info,
  Check,
  Printer,
  Maximize2,
  RefreshCw,
  Layers,
  QrCode,
  Smartphone,
  X,
  Copy,
  CheckCircle2,
  ExternalLink,
  Scissors,
  Flame,
  Sun,
  Contrast,
  SlidersHorizontal,
  Eye,
  FileCode
} from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';

// Imágenes de muestra predefinidas para pruebas instantáneas en el stand
const PRESET_SAMPLES = [
  {
    name: 'Logo MakerBox',
    url: '/logos/makerbox-color.jpg',
    desc: 'Logotipo oficial de innovación'
  },
  {
    name: 'Escudo UTalca',
    url: '/logos/utalca-ingenieria.png',
    desc: 'Facultad de Ingeniería'
  },
  {
    name: 'Seña Chilena',
    url: '/signs/letters/C.png',
    desc: 'Mano del alfabeto'
  }
];

export const LithophaneSection: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string>(PRESET_SAMPLES[0].url);
  const [rawFullImage, setRawFullImage] = useState<string>(PRESET_SAMPLES[0].url);
  const [config, setConfig] = useState<LithophaneConfig>(DEFAULT_LITHOPHANE_CONFIG);
  const [result, setResult] = useState<LithophaneResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSquare100, setIsSquare100] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateConfig = <K extends keyof LithophaneConfig>(key: K, value: LithophaneConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Modo de fabricación: Grabado Láser MDF o Litofanía 3D
  const [activeMode, setActiveMode] = useState<'laser' | 'lithophane'>('laser');

  // Configuración y resultado para Grabado Láser en MDF 8x8 cm (LightBurn)
  const [laserConfig, setLaserConfig] = useState<LaserImageConfig>(DEFAULT_LASER_IMAGE_CONFIG);
  const [laserResult, setLaserResult] = useState<ProcessedLaserResult | null>(null);
  const [isProcessingLaser, setIsProcessingLaser] = useState(false);
  const [laserPreviewType, setLaserPreviewType] = useState<'wood' | 'vector'>('wood');

  const updateLaserConfig = <K extends keyof LaserImageConfig>(key: K, value: LaserImageConfig[K]) => {
    setLaserConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Procesa la imagen para corte y grabado láser cuando cambia la imagen o la configuración
  useEffect(() => {
    let isCancelled = false;

    async function computeLaser() {
      if (!selectedImage) return;
      setIsProcessingLaser(true);
      try {
        const res = await processImageForLaser(selectedImage, laserConfig);
        if (!isCancelled) {
          setLaserResult(res);
        }
      } catch (err) {
        console.error('Error procesando imagen para láser:', err);
      } finally {
        if (!isCancelled) {
          setIsProcessingLaser(false);
        }
      }
    }

    const timer = setTimeout(computeLaser, 200);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [selectedImage, laserConfig]);

  // Genera el modelo 3D cuando cambia la imagen o la configuración
  useEffect(() => {
    let isCancelled = false;

    async function compute() {
      if (!selectedImage) return;
      setIsGenerating(true);
      try {
        const res = await generateLithophane3D(selectedImage, config);
        if (!isCancelled) {
          setResult(res);
        }
      } catch (err) {
        console.error('Error generando litofanía:', err);
      } finally {
        if (!isCancelled) {
          setIsGenerating(false);
        }
      }
    }

    const timer = setTimeout(compute, 250);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [selectedImage, config]);

  const [isDragging, setIsDragging] = useState(false);

  // Soporte para pegar fotos directamente con Ctrl + V (ej. desde WhatsApp Web o navegador)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              if (typeof ev.target?.result === 'string') {
                setRawFullImage(ev.target.result);
                setSelectedImage(ev.target.result);
                setIsFramingOpen(true);
                try {
                  confetti({
                    particleCount: 50,
                    spread: 70,
                    origin: { y: 0.8 },
                    colors: ['#3b82f6', '#8b5cf6', '#10b981']
                  });
                } catch {
                  // Ignorar
                }
              }
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Estados para sincronización en vivo por Código QR desde celular
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [customHost, setCustomHost] = useState<string>('');
  const [showDomainSettings, setShowDomainSettings] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [receivedSuccess, setReceivedSuccess] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [isVercel, setIsVercel] = useState(false);
  const [newPhotoNotification, setNewPhotoNotification] = useState<string | null>(null);
  const [isFramingOpen, setIsFramingOpen] = useState(false);
  const lastTimestampRef = useRef<number>(0);
  const hasReceivedPhotoRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocal =
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      setIsLocalhost(isLocal);
      const isVer = window.location.hostname.includes('.vercel.app');
      setIsVercel(isVer);

      const storedHost = localStorage.getItem('makerbox_stand_custom_host');
      if (storedHost) {
        setCustomHost(storedHost);
      }

      // Código de sesión persistente para el stand (no cambia al cerrar el modal)
      const stored = localStorage.getItem('makerbox_stand_session');
      if (stored) {
        setSessionId(stored);
      } else {
        const newCode = 'MK-' + Math.floor(1000 + Math.random() * 9000);
        setSessionId(newCode);
        localStorage.setItem('makerbox_stand_session', newCode);
      }
    }
  }, []);

  const handleUpdateCustomHost = (value: string) => {
    setCustomHost(value);
    if (typeof window !== 'undefined') {
      if (value.trim()) {
        localStorage.setItem('makerbox_stand_custom_host', value.trim());
      } else {
        localStorage.removeItem('makerbox_stand_custom_host');
      }
    }
  };

  const openQrModal = () => {
    // Si ya se había recibido una foto en esta sesión o no hay código,
    // generamos un código completamente NUEVO para el nuevo asistente
    if (!sessionId || hasReceivedPhotoRef.current) {
      const newCode = 'MK-' + Math.floor(1000 + Math.random() * 9000);
      setSessionId(newCode);
      lastTimestampRef.current = 0;
      hasReceivedPhotoRef.current = false;
      if (typeof window !== 'undefined') {
        localStorage.setItem('makerbox_stand_session', newCode);
      }
    }
    setReceivedSuccess(false);
    setIsQrModalOpen(true);
  };

  const regenerateSessionCode = () => {
    const newCode = 'MK-' + Math.floor(1000 + Math.random() * 9000);
    setSessionId(newCode);
    lastTimestampRef.current = 0;
    hasReceivedPhotoRef.current = false;
    setReceivedSuccess(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('makerbox_stand_session', newCode);
    }
  };

  const getUploadUrl = () => {
    const origin =
      customHost.trim() || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${origin}/subir-foto?s=${sessionId}`;
  };

  const handleCopyLink = () => {
    const url = getUploadUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Generar código QR dinámicamente
  useEffect(() => {
    if (!sessionId) return;

    let active = true;
    const url = getUploadUrl();

    QRCode.toDataURL(url, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((dataUrl) => {
        if (active) setQrCodeDataUrl(dataUrl);
      })
      .catch((err) => console.error('Error generando código QR:', err));

    return () => {
      active = false;
    };
  }, [sessionId, customHost]);

  // Sondeo continuo (activo en modal y en segundo plano) para recibir cualquier foto nueva
  useEffect(() => {
    if (!sessionId) return;

    // Más rápido (1.2s) si el modal está abierto; cada 2.5s en segundo plano
    const pollDelay = isQrModalOpen ? 1200 : 2500;

    const interval = setInterval(async () => {
      try {
        const url = `/api/live-sync?s=${encodeURIComponent(sessionId)}&since=${lastTimestampRef.current}&_t=${Date.now()}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();

        if (data.success && data.image && data.timestamp) {
          lastTimestampRef.current = data.timestamp;
          hasReceivedPhotoRef.current = true;
          setRawFullImage(data.image);
          setSelectedImage(data.image);

          // Purgar inmediatamente la sesión en el servidor para asegurar que nunca se reentregue
          try {
            fetch(`/api/live-sync?s=${encodeURIComponent(sessionId)}`, {
              method: 'DELETE',
              cache: 'no-store'
            }).catch(() => {});
          } catch {
            // Ignorar
          }

          try {
            confetti({
              particleCount: 100,
              spread: 90,
              origin: { y: 0.6 }
            });
          } catch {
            // Ignorar
          }

          if (isQrModalOpen) {
            setReceivedSuccess(true);
            setTimeout(() => {
              setIsQrModalOpen(false);
              setReceivedSuccess(false);
              // Abrir inmediatamente el editor de encuadre en la laptop
              setIsFramingOpen(true);
            }, 1200);
          } else {
            setNewPhotoNotification('📸 ¡Nueva foto recibida! Ajusta el encuadre para imprimir');
            setIsFramingOpen(true);
            setTimeout(() => setNewPhotoNotification(null), 5000);
          }
        }
      } catch (err) {
        // Silencioso ante pérdidas temporales de red
      }
    }, pollDelay);

    return () => clearInterval(interval);
  }, [sessionId, isQrModalOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setRawFullImage(ev.target.result);
        setSelectedImage(ev.target.result);
        setIsFramingOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setRawFullImage(ev.target.result);
        setSelectedImage(ev.target.result);
        setIsFramingOpen(true);
        try {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.8 },
            colors: ['#3b82f6', '#8b5cf6', '#10b981']
          });
        } catch {
          // Ignorar
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadStl = () => {
    if (!result) return;
    const filename = `litofania-3d-${config.widthMm}x${config.heightMm}mm.stl`;
    downloadStlFile(result.stlBuffer, filename);

    try {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.75 }
      });
    } catch {
      // Ignorar
    }
  };

  const handleDownloadLaserSvg = () => {
    if (!laserResult) return;
    const filename = `grabado-corte-mdf-8x8cm-${sessionId || 'makerbox'}.svg`;
    downloadLaserSvg(laserResult.svgContent, filename);

    try {
      confetti({
        particleCount: 85,
        spread: 90,
        origin: { y: 0.75 },
        colors: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981']
      });
    } catch {
      // Ignorar
    }
  };

  const handleDownloadLaserPng = () => {
    if (!laserResult) return;
    const filename = `imagen-laser-300dpi-8x8cm-${sessionId || 'makerbox'}.png`;
    downloadLaserPng(laserResult.processedDataUrl, filename);

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.75 }
      });
    } catch {
      // Ignorar
    }
  };

  const setFixed100x100 = () => {
    setIsSquare100(true);
    setConfig((prev) => ({
      ...prev,
      widthMm: 100,
      heightMm: 100
    }));
  };

  return (
    <div className="w-full flex flex-col gap-6 sm:gap-8">
      {/* Banner explicativo de la herramienta Imagen */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-100 via-indigo-50 to-rose-50 border border-blue-200/80 px-5 py-3.5 sm:px-6 sm:py-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-200 text-blue-900 text-[11px] font-extrabold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-700" />
              Festival de Ciencia y Tecnología 2026
            </span>
            <span className="text-xs font-semibold text-slate-500 hidden md:inline">
              MakerBox · Fabricación de Imágenes
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Herramienta de Imagen (Grabado Láser y Litofanía 3D)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-snug">
            Sube tu fotografía y prepárala para grabarla y cortarla en madera MDF de 8×8 cm para LightBurn, o transfórmala en un modelo de litofanía 3D para imprimir en filamento blanco.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={openQrModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-xs sm:text-sm shadow-sm shadow-indigo-200 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-white" />
            <QrCode className="w-4 h-4 text-white" />
            <span>Subir desde Celular (QR)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm border border-slate-300 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Desde Laptop</span>
          </button>
        </div>
      </div>

      {/* Selector de Técnica de Fabricación: Grabado Láser MDF vs Litofanía 3D */}
      <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 pl-2">Técnica de Fabricación:</span>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveMode('laser')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black text-xs sm:text-sm transition cursor-pointer active:scale-95 ${
                activeMode === 'laser'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>Grabado Láser MDF (8×8 cm)</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md uppercase font-black tracking-wide ${
                  activeMode === 'laser' ? 'bg-rose-800 text-white' : 'bg-rose-100 text-rose-800'
                }`}
              >
                LightBurn
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('lithophane')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black text-xs sm:text-sm transition cursor-pointer active:scale-95 ${
                activeMode === 'lithophane'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Litofanía 3D (Relieve)</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md uppercase font-black tracking-wide ${
                  activeMode === 'lithophane' ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-800'
                }`}
              >
                STL 3D
              </span>
            </button>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500 pr-2 hidden sm:block">
          {activeMode === 'laser'
            ? 'Corte y grabado sobre madera MDF 3 mm calibrado en 80×80 mm'
            : 'Malla 3D para impresión en filamento blanco PLA'}
        </div>
      </div>

      {/* Grid de 2 columnas: Controles a la izquierda y Visor a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Configuración según modo activo */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Paso 1: Selección de Imagen (Compartido) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-extrabold ${
                    activeMode === 'laser' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  1
                </span>
                <span>{activeMode === 'laser' ? 'Imagen para Láser (8×8 cm):' : 'Imagen de la Litofanía:'}</span>
              </h3>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Zona de subida o foto actual */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-4 transition flex flex-col items-center justify-center gap-2 text-center ${
                isDragging
                  ? activeMode === 'laser'
                    ? 'border-rose-600 bg-rose-100/60 ring-4 ring-rose-300/40 scale-[1.01]'
                    : 'border-blue-600 bg-blue-100/60 ring-4 ring-blue-300/40 scale-[1.01]'
                  : activeMode === 'laser'
                  ? 'border-slate-300 hover:border-rose-500 bg-slate-50/70 hover:bg-rose-50/30'
                  : 'border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/30'
              }`}
            >
              {selectedImage ? (
                <div className="flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImage}
                    alt="Foto seleccionada"
                    className="max-h-36 rounded-xl object-contain shadow-xs border border-slate-200 bg-white"
                  />
                  <span
                    className={`text-xs font-bold group-hover:underline ${
                      activeMode === 'laser' ? 'text-rose-700' : 'text-blue-700'
                    }`}
                  >
                    Toca para cambiar la imagen
                  </span>
                </div>
              ) : (
                <>
                  <Upload className={`w-8 h-8 ${activeMode === 'laser' ? 'text-rose-500' : 'text-blue-500'}`} />
                  <span className="text-sm font-bold text-slate-700">Toca para elegir una foto</span>
                  <span className="text-xs text-slate-400">Formatos JPG, PNG o WebP</span>
                </>
              )}
            </div>

            {/* Botón para ajustar encuadre y zoom en la laptop */}
            {selectedImage && (
              <button
                type="button"
                onClick={() => setIsFramingOpen(true)}
                className={`w-full py-2.5 px-3 rounded-2xl border text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98 ${
                  activeMode === 'laser'
                    ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                    : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
                }`}
              >
                <Maximize2 className={`w-3.5 h-3.5 ${activeMode === 'laser' ? 'text-rose-600' : 'text-blue-600'}`} />
                <span>{activeMode === 'laser' ? '✂️ Encuadrar Cuadrado 1:1 para Láser' : '✂️ Ajustar Encuadre y Zoom'}</span>
              </button>
            )}

            {/* Botón interactivo para escanear QR desde el celular */}
            <button
              type="button"
              onClick={openQrModal}
              className={`w-full py-3 px-4 rounded-2xl text-white font-extrabold text-xs sm:text-sm shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer ${
                activeMode === 'laser'
                  ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 shadow-rose-100'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-indigo-100'
              }`}
            >
              <Smartphone className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
              <QrCode className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
              <span>📱 Escanear QR para subir foto desde tu celular</span>
            </button>

            {/* Tip rápido para el festival / stand */}
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] leading-tight ${
                activeMode === 'laser'
                  ? 'bg-rose-50/80 border-rose-200/60 text-rose-900'
                  : 'bg-blue-50/80 border-blue-200/60 text-blue-900'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 shrink-0 ${activeMode === 'laser' ? 'text-rose-600' : 'text-blue-600'}`} />
              <span>
                <strong>Atajo en el stand:</strong> Arrastra cualquier imagen aquí o presiona <strong>Ctrl + V</strong> para pegarla directo (ej. desde WhatsApp Web).
              </span>
            </div>

            {/* Muestras predeterminadas para pruebas en el stand */}
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-xs font-bold text-slate-500">O prueba con una muestra del stand:</span>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_SAMPLES.map((sample) => (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => {
                      setRawFullImage(sample.url);
                      setSelectedImage(sample.url);
                    }}
                    className={`p-2 rounded-xl border text-left transition flex flex-col items-center gap-1.5 active:scale-95 cursor-pointer ${
                      selectedImage === sample.url
                        ? activeMode === 'laser'
                          ? 'border-rose-600 bg-rose-50/80 ring-2 ring-rose-300/30'
                          : 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-300/30'
                        : 'border-slate-200 bg-slate-50 hover:bg-white'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sample.url}
                      alt={sample.name}
                      className="w-10 h-10 object-contain rounded-md"
                    />
                    <span className="text-[11px] font-bold text-slate-800 text-center truncate w-full">
                      {sample.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Paso 2: Según el Modo Activo */}
          {activeMode === 'laser' ? (
            /* PASO 2 MODO LÁSER: FILTROS DE IMAGEN Y PLACA MDF 8x8 CM */
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-sm font-extrabold">
                    2
                  </span>
                  <span>Ajustes de Grabado en MDF:</span>
                </h3>
                <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                  Placa 80×80 mm (8×8 cm)
                </span>
              </div>

              {/* Modo de Tramado (Dithering) */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Modo de Tramado / Procesamiento:</span>
                  <span className="font-extrabold text-rose-600">
                    {laserConfig.ditherMode === 'atkinson' && 'Atkinson (Recomendado Láser)'}
                    {laserConfig.ditherMode === 'floyd-steinberg' && 'Floyd-Steinberg'}
                    {laserConfig.ditherMode === 'grayscale' && 'Escala de Grises'}
                    {laserConfig.ditherMode === 'threshold' && 'Alto Contraste'}
                    {laserConfig.ditherMode === 'original' && 'Color Original'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => updateLaserConfig('ditherMode', 'atkinson')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                      laserConfig.ditherMode === 'atkinson'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-1">⭐ Atkinson</span>
                    <span
                      className={`text-[10px] ${
                        laserConfig.ditherMode === 'atkinson' ? 'text-rose-100' : 'text-slate-400'
                      }`}
                    >
                      Ideal MDF (Madera)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateLaserConfig('ditherMode', 'floyd-steinberg')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                      laserConfig.ditherMode === 'floyd-steinberg'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>Floyd-Steinberg</span>
                    <span
                      className={`text-[10px] ${
                        laserConfig.ditherMode === 'floyd-steinberg' ? 'text-rose-100' : 'text-slate-400'
                      }`}
                    >
                      Difusión suave
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateLaserConfig('ditherMode', 'grayscale')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                      laserConfig.ditherMode === 'grayscale'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>Escala de Grises</span>
                    <span
                      className={`text-[10px] ${
                        laserConfig.ditherMode === 'grayscale' ? 'text-rose-100' : 'text-slate-400'
                      }`}
                    >
                      Potencia Variable
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateLaserConfig('ditherMode', 'threshold')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                      laserConfig.ditherMode === 'threshold'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>Alto Contraste</span>
                    <span
                      className={`text-[10px] ${
                        laserConfig.ditherMode === 'threshold' ? 'text-rose-100' : 'text-slate-400'
                      }`}
                    >
                      Umbral / Logos
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateLaserConfig('ditherMode', 'original')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer sm:col-span-2 ${
                      laserConfig.ditherMode === 'original'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>Foto Calibrada Original</span>
                    <span
                      className={`text-[10px] ${
                        laserConfig.ditherMode === 'original' ? 'text-rose-100' : 'text-slate-400'
                      }`}
                    >
                      LightBurn aplica su dither
                    </span>
                  </button>
                </div>

                {laserConfig.ditherMode === 'threshold' && (
                  <div className="flex flex-col gap-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 mt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Nivel de Umbral (Corte B/N):</span>
                      <span className="font-extrabold text-rose-600">{laserConfig.thresholdLevel}</span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={225}
                      value={laserConfig.thresholdLevel}
                      onChange={(e) => updateLaserConfig('thresholdLevel', Number(e.target.value))}
                      className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Filtros de Contraste, Brillo y Nitidez */}
              <div className="flex flex-col gap-3">
                {/* Contraste */}
                <div className="flex flex-col gap-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Contraste (Crucial para MDF):</span>
                    <span className="font-extrabold text-rose-600">
                      {laserConfig.contrast > 0 ? `+${laserConfig.contrast}` : laserConfig.contrast}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-50}
                    max={100}
                    step={5}
                    value={laserConfig.contrast}
                    onChange={(e) => updateLaserConfig('contrast', Number(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <span className="text-[11px] text-slate-400">
                    Separa tonos oscuros y claros para que las sombras se quemen nítidas en la madera.
                  </span>
                </div>

                {/* Brillo */}
                <div className="flex flex-col gap-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Brillo:</span>
                    <span className="font-extrabold text-rose-600">
                      {laserConfig.brightness > 0 ? `+${laserConfig.brightness}` : laserConfig.brightness}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-50}
                    max={50}
                    step={5}
                    value={laserConfig.brightness}
                    onChange={(e) => updateLaserConfig('brightness', Number(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <span className="text-[11px] text-slate-400">
                    Aclara u oscurece la imagen para evitar zonas negras empastadas.
                  </span>
                </div>

                {/* Nitidez (Sharpen) */}
                <div className="flex flex-col gap-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Nitidez (Realce de bordes):</span>
                    <span className="font-extrabold text-rose-600">{laserConfig.sharpen}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={laserConfig.sharpen}
                    onChange={(e) => updateLaserConfig('sharpen', Number(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <span className="text-[11px] text-slate-400">
                    Realza rasgos faciales, ojos y texturas finas al quemar con láser.
                  </span>
                </div>

                {/* Invertir colores */}
                <label className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200 cursor-pointer hover:bg-rose-50/30 transition">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">Invertir Colores (Negativo)</span>
                    <span className="text-[11px] text-slate-500">Útil para materiales que aclaran al grabar</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={laserConfig.invert}
                    onChange={(e) => updateLaserConfig('invert', e.target.checked)}
                    className="w-5 h-5 rounded-md accent-rose-600 cursor-pointer"
                  />
                </label>
              </div>

              {/* Opciones de la Placa de Madera MDF 8x8 cm */}
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Corte de la Placa MDF (80×80 mm):
                </span>

                <div className="grid grid-cols-2 gap-3">
                  {/* Esquinas redondeadas */}
                  <div className="flex flex-col gap-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Radio de esquinas:</span>
                      <span className="font-extrabold text-rose-600">{laserConfig.cornerRadiusMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={1}
                      value={laserConfig.cornerRadiusMm}
                      onChange={(e) => updateLaserConfig('cornerRadiusMm', Number(e.target.value))}
                      className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <span className="text-[10px] text-slate-400">Bordes suaves sin astillas</span>
                  </div>

                  {/* Margen de imagen */}
                  <div className="flex flex-col gap-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Margen interior:</span>
                      <span className="font-extrabold text-rose-600">{laserConfig.marginMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={8}
                      step={1}
                      value={laserConfig.marginMm}
                      onChange={(e) => updateLaserConfig('marginMm', Number(e.target.value))}
                      className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <span className="text-[10px] text-slate-400">Espacio antes del corte</span>
                  </div>
                </div>

                {/* Orificio para colgar */}
                <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={laserConfig.hasHole}
                        onChange={(e) => updateLaserConfig('hasHole', e.target.checked)}
                        className="w-4 h-4 rounded accent-rose-600 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800">Orificio para colgar / llavero</span>
                    </label>
                    {laserConfig.hasHole && (
                      <span className="text-xs font-extrabold text-rose-600">Ø {laserConfig.holeDiameterMm} mm</span>
                    )}
                  </div>

                  {laserConfig.hasHole && (
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-semibold">Ubicación:</span>
                        <button
                          type="button"
                          onClick={() => updateLaserConfig('holePosition', 'top-center')}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                            laserConfig.holePosition === 'top-center'
                              ? 'bg-rose-600 text-white'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          Centro Superior
                        </button>
                        <button
                          type="button"
                          onClick={() => updateLaserConfig('holePosition', 'top-left')}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                            laserConfig.holePosition === 'top-left'
                              ? 'bg-rose-600 text-white'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          Esquina
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* PASO 2 MODO LITOFANÍA 3D: DIMENSIONES Y ESPESORES */
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-extrabold">
                    2
                  </span>
                  <span>Dimensiones y Espesores:</span>
                </h3>

                <button
                  type="button"
                  onClick={setFixed100x100}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isSquare100
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Ajustar a cuadrado estándar de 100x100mm"
                >
                  100×100 mm
                </button>
              </div>

              {/* Tamaño general (Ancho y Alto) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Ancho:</span>
                    <span className="font-extrabold text-blue-700">{config.widthMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={150}
                    step={5}
                    value={config.widthMm}
                    onChange={(e) => {
                      setIsSquare100(false);
                      updateConfig('widthMm', Number(e.target.value));
                    }}
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                </div>

                <div className="flex flex-col gap-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Alto:</span>
                    <span className="font-extrabold text-blue-700">{config.heightMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={150}
                    step={5}
                    value={config.heightMm}
                    onChange={(e) => {
                      setIsSquare100(false);
                      updateConfig('heightMm', Number(e.target.value));
                    }}
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Espesores de Luz y Sombra */}
              <div className="flex flex-col gap-3">
                {/* Espesor mínimo (zonas claras) */}
                <div className="flex flex-col gap-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Espesor Zonas Claras (Luz):</span>
                    <span className="font-extrabold text-blue-700">{config.minThicknessMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={0.6}
                    max={1.2}
                    step={0.1}
                    value={config.minThicknessMm}
                    onChange={(e) => updateConfig('minThicknessMm', Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <span className="text-[11px] text-slate-400">
                    Grosor por donde la luz atraviesa con facilidad (0.8 mm recomendado)
                  </span>
                </div>

                {/* Espesor máximo (zonas oscuras) */}
                <div className="flex flex-col gap-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Espesor Zonas Oscuras (Sombra):</span>
                    <span className="font-extrabold text-blue-700">{config.maxThicknessMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={1.8}
                    max={3.0}
                    step={0.1}
                    value={config.maxThicknessMm}
                    onChange={(e) => updateConfig('maxThicknessMm', Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <span className="text-[11px] text-slate-400">
                    Grosor que bloquea la luz creando el contraste (2.0 a 2.4 mm)
                  </span>
                </div>
              </div>

              {/* Marco y Opciones Adicionales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex flex-col gap-1 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Ancho de Marco:</span>
                    <span className="font-extrabold text-blue-700">{config.frameWidthMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={8}
                    step={0.5}
                    value={config.frameWidthMm}
                    onChange={(e) => updateConfig('frameWidthMm', Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                </div>

                {/* Checkbox de Pie de Apoyo */}
                <label className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 cursor-pointer hover:bg-blue-50/40 transition">
                  <input
                    type="checkbox"
                    checked={config.hasStandBase}
                    onChange={(e) => updateConfig('hasStandBase', e.target.checked)}
                    className="w-5 h-5 rounded-md accent-blue-600 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">Pie de apoyo</span>
                    <span className="text-[11px] text-slate-500">Base para pararse en la mesa</span>
                  </div>
                </label>
              </div>

              {/* Selector de Resolución / Calidad 3D (mm/píxel) */}
              <div className="flex flex-col gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Resolución de Detalle 3D:</span>
                  <span className="font-extrabold text-blue-700">
                    {config.resolution >= 450
                      ? '0.2 mm/px (Ultra Detalle)'
                      : config.resolution >= 220
                      ? '0.4 mm/px (Alta Calidad)'
                      : '0.7 mm/px (Rápida Stand)'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '0.7 mm/px', desc: 'Rápida (140)', res: 140 },
                    { label: '0.4 mm/px', desc: 'Alta (250)', res: 250 },
                    { label: '0.2 mm/px', desc: 'Ultra (500)', res: 500 }
                  ].map((item) => (
                    <button
                      key={item.res}
                      type="button"
                      onClick={() => updateConfig('resolution', item.res)}
                      className={`px-2 py-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition cursor-pointer ${
                        config.resolution === item.res
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span
                        className={`text-[10px] ${
                          config.resolution === item.res ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {item.desc}
                      </span>
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-400">
                  0.2 mm/px genera máxima definición fotográfica (~1M de triángulos). 0.7 mm/px es ideal para vista previa rápida en el stand.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Visor y Descargas según el Modo Activo */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {activeMode === 'laser' ? (
            /* VISOR Y DESCARGAS MODO LÁSER (MDF 8x8 CM / LIGHTBURN) */
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-sm font-extrabold">
                      3
                    </span>
                    <span>Vista Previa Láser MDF 8×8 cm:</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Diseño listo para <strong>LightBurn</strong> en placa de madera MDF 3 mm.
                  </p>
                </div>

                {/* Botones de Descarga */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleDownloadLaserSvg}
                    disabled={!laserResult || isProcessingLaser}
                    className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 disabled:bg-slate-300 text-white shadow-md shadow-rose-200 transition-all active:scale-95 flex items-center gap-2 justify-center flex-1 sm:flex-none cursor-pointer"
                    title="Descargar SVG con capa de grabado y línea roja de corte 80x80 mm para LightBurn"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar SVG (LightBurn)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadLaserPng}
                    disabled={!laserResult || isProcessingLaser}
                    className="px-3.5 py-3 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 border border-slate-300 transition-all active:scale-95 flex items-center gap-1.5 justify-center cursor-pointer"
                    title="Descargar imagen PNG a 300 DPI"
                  >
                    <span>PNG 300 DPI</span>
                  </button>
                </div>
              </div>

              {/* Selector de visualización: Madera simulada o Vector LightBurn */}
              <div className="flex items-center justify-between gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 flex-wrap">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setLaserPreviewType('wood')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      laserPreviewType === 'wood'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🪵 Simulación Madera MDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLaserPreviewType('vector')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      laserPreviewType === 'vector'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>📐 Capas LightBurn (Rojo/Negro)</span>
                  </button>
                </div>

                <div className="text-[11px] font-extrabold text-slate-500 pr-2">
                  80 × 80 mm (300 DPI)
                </div>
              </div>

              {/* Contenedor del Visor */}
              <div className="relative w-full aspect-square max-w-[440px] mx-auto rounded-3xl overflow-hidden border-2 border-slate-200 shadow-inner bg-slate-100 flex items-center justify-center p-3">
                {isProcessingLaser ? (
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
                    <span className="text-xs font-bold text-slate-600">Procesando tramado y corte láser...</span>
                  </div>
                ) : laserResult ? (
                  laserPreviewType === 'wood' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={laserResult.woodPreviewDataUrl}
                      alt="Simulación de Grabado Láser en Madera MDF"
                      className="w-full h-full object-contain drop-shadow-md rounded-2xl transition-all"
                    />
                  ) : (
                    /* Vista de vectores LightBurn con marco rojo y foto procesada */
                    <div
                      className="relative bg-white shadow-md border-2 border-dashed border-slate-300 flex items-center justify-center transition-all w-[90%] h-[90%]"
                      style={{
                        borderRadius: `${(laserConfig.cornerRadiusMm / 80) * 100}%`
                      }}
                    >
                      {/* Línea perimetral de corte en rojo */}
                      <div
                        className="absolute inset-0 border-2 border-red-600 pointer-events-none"
                        style={{ borderRadius: `${(laserConfig.cornerRadiusMm / 80) * 100}%` }}
                      />

                      {/* Orificio opcional */}
                      {laserConfig.hasHole && (
                        <div
                          className="absolute w-4 h-4 rounded-full border-2 border-red-600 bg-white"
                          style={{
                            top: laserConfig.holePosition === 'top-center' ? '8px' : '8px',
                            left: laserConfig.holePosition === 'top-center' ? 'calc(50% - 8px)' : '8px'
                          }}
                        />
                      )}

                      {/* Imagen grabada centrada */}
                      <div
                        className="overflow-hidden"
                        style={{
                          width: `${((80 - laserConfig.marginMm * 2) / 80) * 100}%`,
                          height: `${((80 - laserConfig.marginMm * 2) / 80) * 100}%`
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={laserResult.processedDataUrl}
                          alt="Capa de Grabado Láser"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Etiquetas identificadoras de capas */}
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                        Línea Roja: Corte
                      </div>
                      <div className="absolute bottom-2 left-2 bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                        Negro: Grabado
                      </div>
                    </div>
                  )
                ) : null}
              </div>

              {/* Ficha Técnica de Fabricación */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-slate-500">Formato MDF:</span>
                  <span className="text-sm font-extrabold text-slate-800">80 × 80 mm</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-slate-500">Resolución:</span>
                  <span className="text-sm font-extrabold text-rose-600">300 DPI (HD)</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-slate-500">Capa Corte:</span>
                  <span className="text-sm font-extrabold text-red-600">Rojo 0.2mm</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-slate-500">Capa Grabado:</span>
                  <span className="text-sm font-extrabold text-slate-800">Scan / Tramado</span>
                </div>
              </div>

              {/* Guía rápida para el operador con LightBurn */}
              <div className="bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                <Flame className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed flex flex-col gap-1">
                  <span className="font-bold text-rose-950">
                    Cómo cortarlo y grabarlo en LightBurn (Operador del Stand):
                  </span>
                  <p className="text-xs leading-normal">
                    1. Descarga el archivo <strong>.SVG</strong> y arrástralo directamente a la ventana de <strong>LightBurn</strong>.<br />
                    2. LightBurn asignará de inmediato el marco rojo a la <strong>Capa de Corte</strong> y la foto a la <strong>Capa de Grabado (Image/Scan)</strong>.<br />
                    3. Pon una placa de trupán / MDF de 3 mm de espesor y presiona <em>Start</em>. ¡Las medidas 80×80 mm coinciden exactamente!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* VISOR Y DESCARGAS MODO LITOFANÍA 3D */
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-extrabold">
                      3
                    </span>
                    <span>Visor 3D en Tiempo Real:</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Gira la pieza con el dedo y prueba el botón <strong>&quot;Efecto a Contraluz&quot;</strong>.
                  </p>
                </div>

                {/* Botón Principal de Descarga STL */}
                <button
                  type="button"
                  onClick={handleDownloadStl}
                  disabled={!result || isGenerating}
                  className="px-6 py-3.5 rounded-2xl text-base font-extrabold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2 justify-center w-full sm:w-auto cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>Descargar Modelo STL</span>
                </button>
              </div>

              {/* Lienzo WebGL Three.js con simulación de luz y ampolleta trasera */}
              <Lithophane3DViewer
                geometry={result?.geometry ?? null}
                imageSource={selectedImage}
                config={config}
                isLoading={isGenerating}
              />

              {/* Métricas Técnicas para Laminación */}
              {result && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-slate-500">Dimensiones:</span>
                    <span className="text-sm font-extrabold text-slate-800">
                      {result.widthMm} × {result.heightMm} mm
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-slate-500">Malla 3D:</span>
                    <span className="text-sm font-extrabold text-blue-700">
                      {result.triangleCount.toLocaleString()} △
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-slate-500">Filamento PLA:</span>
                    <span className="text-sm font-extrabold text-slate-800">
                      ~{result.estimatedWeightGrams} gramos
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-slate-500">Tiempo aprox:</span>
                    <span className="text-sm font-extrabold text-slate-800">
                      ~{Math.floor(result.estimatedPrintTimeMinutes / 60)}h {result.estimatedPrintTimeMinutes % 60}m
                    </span>
                  </div>
                </div>
              )}

              {/* Tarjeta de Recomendaciones para el Operador del Stand */}
              <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                <Printer className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed flex flex-col gap-1">
                  <span className="font-bold text-blue-950">
                    Instrucciones de Laminación (Cura / PrusaSlicer / Bambu Studio):
                  </span>
                  <p>
                    1. Imprimir en <strong>filamento blanco</strong> (PLA o PETG).<br />
                    2. Configurar <strong>100% de relleno (Infill)</strong> para que la luz se transmita de forma continua sin patrones de rejilla.<br />
                    3. Orientar la litofanía <strong>de pie verticalmente</strong> sobre la base para obtener máxima resolución fotográfica en el eje Z.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Interactivo de Sincronización QR */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-7 flex flex-col gap-5 relative animate-in zoom-in-95 duration-200">
            {/* Botón cerrar */}
            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Cabecera del Modal */}
            <div className="flex flex-col gap-1 pr-8">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Smartphone className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-blue-700">
                  Conexión Móvil en Vivo
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Sube tu foto desde el celular
              </h3>
              <p className="text-xs text-slate-500">
                Apunta con la cámara de tu celular a este código para abrir la página y proyectar tu foto aquí.
              </p>
            </div>

            {/* Estado: Recibido con éxito */}
            {receivedSuccess ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-black text-slate-900">¡Foto recibida del celular!</h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Procesando relieve y generando tu Litofanía 3D en pantalla ahora mismo...
                </p>
              </div>
            ) : (
              <>
                {/* Visualizador del Código QR */}
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="relative p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-md flex items-center justify-center">
                    {qrCodeDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrCodeDataUrl}
                        alt="Código QR para subir foto"
                        className="w-56 h-56 sm:w-60 sm:h-60 rounded-xl"
                      />
                    ) : (
                      <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs font-semibold">
                        Generando QR...
                      </div>
                    )}

                    {/* Logo MakerBox al centro del QR */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-xl bg-white/95 border-2 border-blue-600 shadow-md flex items-center justify-center text-blue-700 font-black text-xs">
                        MB
                      </div>
                    </div>
                  </div>

                  {/* Indicador de estado y código de sesión */}
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      Esperando foto · Sesión{' '}
                      <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200 font-black">
                        {sessionId}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Pasos explicativos rápidos */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col gap-1.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>Abre la cámara de tu teléfono y enfoca el código QR.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>Toca el enlace para abrir MakerBox Móvil en tu celular.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Elige o sácate una foto y presiona <strong>&quot;Enviar a la Pantalla&quot;</strong>.
                    </span>
                  </div>
                </div>

                {/* Copiar enlace directo o probar */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 flex-wrap">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">¡Enlace copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar enlace</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={regenerateSessionCode}
                      className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition cursor-pointer"
                      title="Generar un nuevo código de sesión para el stand"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Cambiar código</span>
                    </button>
                  </div>

                  <a
                    href={getUploadUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>Abrir en otra pestaña</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Configuración de enlace, dominio público y ayuda para Vercel / Localhost */}
                <div className="border-t border-slate-100 pt-2.5 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDomainSettings(!showDomainSettings)}
                    className="text-[11px] font-bold text-slate-500 hover:text-blue-600 flex items-center justify-between py-1 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-slate-400" />
                      <span>Configuración de enlace / Vercel</span>
                      {customHost.trim() && (
                        <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 text-[10px] font-black">
                          Personalizado
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {showDomainSettings ? '▲ Ocultar' : '▼ Configurar enlace'}
                    </span>
                  </button>

                  {showDomainSettings ? (
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 flex flex-col gap-2.5 text-xs text-slate-700 animate-in fade-in duration-150">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700">
                            Dominio del QR (Host público):
                          </label>
                          {customHost.trim() && (
                            <button
                              type="button"
                              onClick={() => handleUpdateCustomHost('')}
                              className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                            >
                              Restablecer a URL actual
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder={
                            typeof window !== 'undefined'
                              ? window.location.origin
                              : 'https://tu-proyecto.vercel.app'
                          }
                          value={customHost}
                          onChange={(e) => handleUpdateCustomHost(e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-800 outline-none focus:border-blue-600 transition"
                        />
                        <p className="text-[10px] text-slate-500 break-all">
                          El QR apunta a:{' '}
                          <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-[10px] text-blue-700">
                            {getUploadUrl()}
                          </code>
                        </p>
                      </div>

                      {/* Guía rápida para Vercel Authentication */}
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 flex flex-col gap-1 text-[11px] text-amber-900">
                        <span className="font-extrabold flex items-center gap-1 text-amber-950">
                          ⚠️ ¿El celular te pide &quot;Iniciar sesión en Vercel&quot;?
                        </span>
                        <p className="leading-relaxed text-amber-800 text-[10.5px]">
                          Vercel activa por defecto protección con login para enlaces de prueba. Para dejarlo 100% público y abierto para cualquier asistente:
                        </p>
                        <ol className="list-decimal list-inside text-[10px] text-amber-900 space-y-0.5 font-medium pl-1">
                          <li>
                            Entra a <strong>vercel.com</strong> &gt; tu proyecto &gt; <strong>Settings</strong>.
                          </li>
                          <li>
                            En el menú lateral entra a <strong>Deployment Protection</strong>.
                          </li>
                          <li>
                            En <strong>Vercel Authentication</strong>, cámbialo a <strong>Disabled</strong> (Desactivado) y haz clic en <strong>Save</strong>.
                          </li>
                        </ol>
                      </div>

                      {isLocalhost && (
                        <div className="rounded-xl bg-blue-50 border border-blue-200 p-2.5 text-[10.5px] text-blue-900">
                          <strong>Nota Localhost:</strong> El celular no puede abrir &quot;localhost&quot;. Conecta tu celular a la misma red Wi-Fi e ingresa la IP local de tu laptop (ej: <code className="bg-blue-100 px-1 rounded">http://192.168.1.50:3000</code>).
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Aviso discreto si está en Vercel pero el panel está cerrado */
                    isVercel && (
                      <p className="text-[10px] text-slate-400 leading-tight">
                        💡 Si al escanear pide login en Vercel, desactiva <em>Deployment Protection</em> en tu panel de Vercel.
                      </p>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Notificación Toast flotante cuando llega una foto nueva con el modal cerrado */}
      {newPhotoNotification && (
        <div className="fixed top-20 right-6 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm px-5 py-3.5 rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center gap-2.5 animate-in slide-in-from-top-4 fade-in duration-300">
          <Sparkles className="w-4 h-4 text-emerald-200 animate-spin" />
          <span>{newPhotoNotification}</span>
        </div>
      )}

      {/* Editor de Encuadre y Zoom para la Laptop */}
      {(rawFullImage || selectedImage) && (
        <ImageFramingEditor
          imageSrc={rawFullImage || selectedImage}
          isOpen={isFramingOpen}
          onClose={() => setIsFramingOpen(false)}
          onApply={(cropped) => setSelectedImage(cropped)}
          title={
            activeMode === 'laser'
              ? 'Ajustar Encuadre Cuadrado para Grabado Láser MDF 8×8 cm'
              : 'Ajustar Encuadre y Zoom de la Litofanía 3D'
          }
          confirmLabel={
            activeMode === 'laser'
              ? 'Aplicar a Grabado Láser MDF'
              : 'Aplicar a la Litofanía 3D'
          }
        />
      )}
    </div>
  );
};
