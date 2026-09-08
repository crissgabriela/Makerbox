'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Camera,
  Image as ImageIcon,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Printer,
  ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';

// Función para comprimir y redimensionar la imagen en el navegador del celular
async function compressImage(file: File, maxDim = 1024, quality = 0.82): Promise<{ dataUrl: string; originalSizeKb: number; compressedSizeKb: number }> {
  const originalSizeKb = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Error al decodificar la imagen'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular escala proporcional
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el lienzo canvas'));
          return;
        }

        // Fondo blanco por si hay transparencias PNG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        // Estimar peso base64 en KB
        const compressedSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        resolve({ dataUrl, originalSizeKb, compressedSizeKb });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function SubirFotoContent() {
  const searchParams = useSearchParams();
  const urlSession = searchParams.get('s') || searchParams.get('sesion') || '';

  const [sessionCode, setSessionCode] = useState(urlSession.toUpperCase());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<{ originalKb: number; compressedKb: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (urlSession) {
      setSessionCode(urlSession.toUpperCase());
    }
  }, [urlSession]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const result = await compressImage(file, 1024, 0.82);
      setPreviewUrl(result.dataUrl);
      setStats({
        originalKb: result.originalSizeKb,
        compressedKb: result.compressedSizeKb
      });
    } catch (err) {
      console.error('Error procesando imagen:', err);
      setErrorMessage('No se pudo procesar la foto seleccionada. Prueba con otra imagen.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendToScreen = async () => {
    if (!sessionCode.trim()) {
      setErrorMessage('Por favor escribe el código que aparece en la pantalla del stand.');
      return;
    }

    if (!previewUrl) {
      setErrorMessage('Primero toma o selecciona una foto.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/live-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionCode.trim().toUpperCase(),
          image: previewUrl
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al conectar con la pantalla.');
      }

      setIsSuccess(true);
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // Ignorar
      }
    } catch (err: unknown) {
      console.error('Error enviando foto:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'No se pudo enviar la foto. Verifica que el código de la pantalla sea el correcto.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setStats(null);
    setIsSuccess(false);
    setErrorMessage(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Encabezado con marca */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-200">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight leading-none">
              MakerBox · Litofanía 3D
            </h1>
            <p className="text-xs font-semibold text-blue-600 mt-1">
              Universidad de Talca · Stand de Demostración
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Inicio</span>
        </Link>
      </div>

      {/* Pantalla de Éxito cuando se envió */}
      {isSuccess ? (
        <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-8 shadow-lg shadow-emerald-500/5 flex flex-col items-center text-center gap-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>

          <div className="flex flex-col gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black tracking-wide uppercase inline-block mx-auto">
              ¡Foto Proyectada!
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              ¡Tu foto ya está en la pantalla!
            </h2>
            <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
              Mira hacia la proyección del stand. Tu litofanía 3D se está modelando en vivo en capas translúcidas para impresión 3D.
            </p>
          </div>

          {previewUrl && (
            <div className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Foto enviada"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="w-full pt-2 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm transition shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Enviar otra foto</span>
            </button>
          </div>
        </div>
      ) : (
        /* Formulario de selección y envío */
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs flex flex-col gap-5">
          {/* Código de pantalla */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Código de la Pantalla del Stand:</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                placeholder="Ej. MK-4821"
                className="w-full uppercase font-mono font-black tracking-wider text-base sm:text-lg px-4 py-3 rounded-2xl border-2 border-blue-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 bg-blue-50/40 text-slate-900 transition outline-none"
              />
              {sessionCode && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-extrabold uppercase">
                  Conectando
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Este código identifica la laptop del stand donde se proyectará la foto.
            </p>
          </div>

          {/* Inputs invisibles para archivo */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Selector de Foto o Vista previa */}
          {previewUrl ? (
            <div className="flex flex-col gap-3">
              <div className="relative rounded-2xl overflow-hidden border-2 border-blue-500 shadow-md bg-slate-950 flex items-center justify-center group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="max-h-72 w-full object-contain"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 flex items-center justify-between text-white text-xs">
                  <span className="font-semibold">Foto lista para enviar</span>
                  {stats && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/80 font-mono font-bold">
                      ⚡ {stats.compressedKb} KB
                    </span>
                  )}
                </div>
              </div>

              {/* Botones para cambiar foto */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  <span>Repetir foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Elegir otra</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="text-center py-2">
                <span className="text-xs font-bold text-slate-700">Elige cómo quieres subir tu foto:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Botón Tomar Foto con Cámara */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessing}
                  className="p-5 rounded-2xl border-2 border-blue-600/30 bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-extrabold flex flex-col items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition hover:brightness-105"
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-black">Tomar Foto Ahora</span>
                  <span className="text-[11px] font-normal text-blue-100">Usa la cámara del celu</span>
                </button>

                {/* Botón Elegir de Galería */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isProcessing}
                  className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50 hover:bg-white text-slate-800 font-extrabold flex flex-col items-center justify-center gap-2 shadow-xs active:scale-95 transition"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-black">De mi Galería</span>
                  <span className="text-[11px] font-normal text-slate-500">Selfies, mascotas, logos...</span>
                </button>
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-blue-600 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Optimizando foto en el celular...</span>
                </div>
              )}
            </div>
          )}

          {/* Mensajes de error */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-tight">{errorMessage}</div>
            </div>
          )}

          {/* Botón Principal de Envío a la Pantalla */}
          <button
            type="button"
            onClick={handleSendToScreen}
            disabled={!previewUrl || isSending || isProcessing || !sessionCode.trim()}
            className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition shadow-lg ${
              !previewUrl || isSending || isProcessing || !sessionCode.trim()
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-blue-500/25 active:scale-[0.98]'
            }`}
          >
            {isSending ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Enviando a la Pantalla del Stand...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>🚀 Enviar a la Pantalla del Stand</span>
              </>
            )}
          </button>

          {/* Consejos para el asistente */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-[11px] text-slate-600 flex flex-col gap-1">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              💡 Tip para una mejor Litofanía 3D:
            </span>
            <span>
              Las fotos con buen contraste entre luces y sombras (rostros bien iluminados, fondos claros o dibujos) se ven mucho más detalladas al verlas a contraluz.
            </span>
          </div>
        </div>
      )}

      {/* Pie de página con créditos */}
      <div className="text-center text-[11px] text-slate-400 pb-6">
        MakerBox · Facultad de Ingeniería · Universidad de Talca
      </div>
    </div>
  );
}

export default function SubirFotoPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-blue-50 py-6 px-4">
      <Suspense fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-sm text-slate-500 font-bold">
          Cargando MakerBox Móvil...
        </div>
      }>
        <SubirFotoContent />
      </Suspense>
    </main>
  );
}
