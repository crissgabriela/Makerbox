'use client';

import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { Solicitud3D, Material3D, CARRERAS_Y_UNIDADES, CarreraOUnidad } from '@/types';
import { ModelViewer3D } from './ModelViewer3D';
import {
  UploadCloud,
  FileBox,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Info,
  Calendar,
  Layers,
  Palette,
  User,
  Mail,
  Phone,
  GraduationCap,
  AlertCircle,
  MessageSquare,
  Send,
  FolderArchive
} from 'lucide-react';

interface RequestFormProps {
  onSuccessSubmit?: (code: string) => void;
}

const MAKERBOX_EMAIL = 'consultasmakerbox@utalca.cl';
const MAKERBOX_PHONE = '+56 9 9123 4567';

export const RequestForm: React.FC<RequestFormProps> = ({ onSuccessSubmit }) => {
  // Datos del solicitante
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [carrera, setCarrera] = useState<CarreraOUnidad>('Ingeniería Civil Mecánica');

  // Archivo 3D
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileDimensions, setFileDimensions] = useState<{ x: number; y: number; z: number } | null>(null);

  // Parámetros técnicos
  const [material, setMaterial] = useState<Material3D>('PLA');
  const [color, setColor] = useState('Blanco');
  const [relleno, setRelleno] = useState('20% (Estándar)');
  const [calidad, setCalidad] = useState('Estándar (0.20mm)');
  const [observaciones, setObservaciones] = useState('');

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedRequest, setSubmittedRequest] = useState<Solicitud3D | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manejo de archivo seleccionado
  const handleFileSelect = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['stl', 'obj', '3mf', 'zip', 'rar'].includes(ext || '')) {
      setErrorMessage('Formato no soportado. Por favor sube un archivo .STL, .OBJ, .3MF, .ZIP o .RAR');
      return;
    }

    if (selectedFile.size === 0) {
      setErrorMessage('El archivo seleccionado está vacío (0 bytes). Verifica el archivo en tu equipo.');
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setErrorMessage('El archivo excede el límite máximo permitido de 50 MB.');
      return;
    }

    if (['zip', 'rar'].includes(ext || '')) {
      setFileDimensions(null);
    }

    setErrorMessage(null);
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Envío del Formulario vía FormData nativo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || file.size === 0) {
      setErrorMessage('Por favor selecciona un archivo 3D válido (.stl, .obj, .3mf).');
      return;
    }

    if (!nombre.trim() || !correo.trim() || !telefono.trim()) {
      setErrorMessage('Por favor completa todos los campos de contacto obligatorios.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Generar código amigable: MBX-2026-XXXX
      const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
      const generatedId = `MBX-2026-${randomHex}`;

      const newRequest: Solicitud3D = {
        id: generatedId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nombre: nombre.trim(),
        correo: correo.trim(),
        telefono: telefono.trim(),
        carrera,
        tipoUsuario: carrera, // Sincronizado
        archivoNombre: file.name,
        archivoTamanoMb: Math.round((file.size / (1024 * 1024)) * 100) / 100,
        archivoUrl: `/api/files/${generatedId}`,
        archivoFormato: (file.name.split('.').pop()?.toLowerCase() as any) || 'stl',
        dimensionesMm: fileDimensions || undefined,
        material,
        color,
        relleno,
        calidad,
        observaciones: observaciones.trim(),
        estado: 'pendiente'
      };

      // Envío binario mediante FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('solicitud', JSON.stringify(newRequest));

      const res = await fetch('/api/requests', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al enviar la solicitud al servidor.');
      }

      setSubmittedRequest(newRequest);

      // Generar QR para seguimiento
      const trackingUrl = `${window.location.origin}/?tab=tracking&code=${generatedId}`;
      const qrUrl = await QRCode.toDataURL(trackingUrl, {
        width: 256,
        margin: 2,
        color: { dark: '#46247a', light: '#ffffff' }
      });
      setQrCodeDataUrl(qrUrl);

      // Efecto confeti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      if (onSuccessSubmit) {
        onSuccessSubmit(generatedId);
      }
    } catch (err: unknown) {
      console.error('Error al enviar:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Error al enviar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (submittedRequest) {
      navigator.clipboard.writeText(submittedRequest.id);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Enviar comprobante por WhatsApp
  const handleSendWhatsAppReceipt = () => {
    if (!submittedRequest) return;
    const msg = `¡Hola! Acabo de registrar mi solicitud de impresión 3D en MakerBox UTalca:\n\n` +
      `📌 *Código de Seguimiento:* ${submittedRequest.id}\n` +
      `📁 *Pieza:* ${submittedRequest.archivoNombre}\n` +
      `⚙️ *Material:* ${submittedRequest.material} (${submittedRequest.color})\n` +
      `📐 *Relleno:* ${submittedRequest.relleno}\n` +
      (submittedRequest.dimensionesMm ? `📏 *Cotas:* ${submittedRequest.dimensionesMm.x} × ${submittedRequest.dimensionesMm.y} × ${submittedRequest.dimensionesMm.z} mm\n` : '') +
      `\n*Equipo MakerBox:* ${MAKERBOX_EMAIL} | ${MAKERBOX_PHONE}\n` +
      `Seguimiento en: ${window.location.origin}/?tab=tracking&code=${submittedRequest.id}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Enviar comprobante por Correo
  const handleSendEmailReceipt = () => {
    if (!submittedRequest) return;
    const subject = encodeURIComponent(`[Comprobante MakerBox] Solicitud Impresión 3D #${submittedRequest.id}`);
    const body = encodeURIComponent(
      `Hola ${submittedRequest.nombre},\n\n` +
      `Hemos registrado tu solicitud de impresión 3D en MakerBox (Facultad de Ingeniería, Universidad de Talca).\n\n` +
      `DATOS DE LA SOLICITUD:\n` +
      `• Código de Seguimiento: ${submittedRequest.id}\n` +
      `• Archivo: ${submittedRequest.archivoNombre} (${submittedRequest.archivoTamanoMb} MB)\n` +
      `• Material y Color: ${submittedRequest.material} — ${submittedRequest.color}\n` +
      `• Relleno: ${submittedRequest.relleno}\n` +
      `• Calidad: ${submittedRequest.calidad}\n` +
      (submittedRequest.observaciones ? `• Observaciones: ${submittedRequest.observaciones}\n` : '') +
      `\nPuedes consultar el avance en tiempo real ingresando tu código en:\n` +
      `${window.location.origin}/?tab=tracking&code=${submittedRequest.id}\n\n` +
      `Cualquier consulta puedes responder a este correo o escribir a ${MAKERBOX_EMAIL}.\n\n` +
      `Saludos,\nEquipo MakerBox\nFacultad de Ingeniería • Universidad de Talca`
    );

    window.open(`mailto:${submittedRequest.correo}?cc=${MAKERBOX_EMAIL}&subject=${subject}&body=${body}`, '_blank');
  };

  const handleReset = () => {
    setFile(null);
    setFileDimensions(null);
    setSubmittedRequest(null);
    setQrCodeDataUrl(null);
    setObservaciones('');
  };

  // Pantalla de Comprobante / Ticket
  if (submittedRequest) {
    return (
      <div className="max-w-2xl w-full mx-auto my-6 p-6 sm:p-8 bg-white rounded-3xl border border-purple-200/80 shadow-xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md mb-4">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-wide mb-2">
          ¡Solicitud Ingresada con Éxito!
        </span>

        <h2 className="text-2xl font-black text-slate-800">
          Tu trabajo de impresión está en cola
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
          El <strong>Equipo Makerbox</strong> evaluará tu modelo 3D y te notificará por correo y WhatsApp cuando comience la impresión o esté lista para retiro.
        </p>

        {/* Tarjeta con Código de Seguimiento */}
        <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 my-6 flex flex-col items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Código Único de Seguimiento
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-purple-950 tracking-wider">
              {submittedRequest.id}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-2 rounded-xl bg-white border border-slate-300 hover:bg-purple-50 text-purple-700 transition cursor-pointer shadow-xs"
              title="Copiar código"
            >
              {copiedCode ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Menciona este código al consultar o al momento de retirar en el laboratorio.
          </p>

          {/* Código QR para móvil */}
          {qrCodeDataUrl && (
            <div className="mt-2 p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col items-center gap-1.5">
              <img src={qrCodeDataUrl} alt="QR Seguimiento Makerbox" className="w-36 h-36" />
              <span className="text-[10px] font-bold text-slate-500">Escanea para seguir en tu celular</span>
            </div>
          )}
        </div>

        {/* Botones de Notificación y Comprobante Automático */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={handleSendWhatsAppReceipt}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-98"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Guardar en mi WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleSendEmailReceipt}
            className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
          >
            <Mail className="w-4 h-4 text-sky-600" />
            <span>Enviar Comprobante por Correo</span>
          </button>
        </div>

        {/* Canales Oficiales de Contacto MakerBox */}
        <div className="w-full bg-purple-50/70 border border-purple-200 rounded-2xl p-4 text-xs text-left text-slate-700 space-y-1.5 mb-6">
          <div className="font-extrabold text-purple-950 flex items-center gap-1.5 pb-1 border-b border-purple-200">
            <Info className="w-4 h-4 text-purple-700" />
            <span>Contacto Oficial del Equipo Makerbox:</span>
          </div>
          <div>✉️ Correo: <a href={`mailto:${MAKERBOX_EMAIL}`} className="font-bold text-purple-900 hover:underline">{MAKERBOX_EMAIL}</a></div>
          <div>📞 WhatsApp / Teléfono: <span className="font-bold text-purple-900">{MAKERBOX_PHONE}</span></div>
          <div>📍 Ubicación: Laboratorio MakerBox, Campus Los Niches / Curicó</div>
        </div>

        {/* Botón para nueva solicitud */}
        <button
          type="button"
          onClick={handleReset}
          className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition cursor-pointer active:scale-98 shadow-sm flex items-center gap-2"
        >
          <span>Hacer Otra Solicitud</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl w-full mx-auto flex flex-col gap-6">
      
      {/* Banner de Bienvenida */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-100 via-pink-50 to-amber-50 border border-purple-200/80 px-5 py-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-200 text-purple-950 text-[11px] font-black flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-700" />
              Equipo Makerbox • Fabricación Digital
            </span>
            <span className="text-xs font-bold text-slate-600 hidden sm:inline">
              Facultad de Ingeniería UTalca
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-800">
            Formulario de Solicitud de Impresión 3D
          </h2>
          <p className="text-xs text-slate-600">
            Sube tu modelo digital (.STL, .OBJ, .3MF) y el Equipo Makerbox gestionará la preparación e impresión en el laboratorio.
          </p>
        </div>
      </div>

      {/* Alerta de Error */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* SECCIÓN 1: DATOS DEL SOLICITANTE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-black text-xs">
            1
          </div>
          <h3 className="font-extrabold text-sm text-slate-800">
            Datos del Solicitante
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
              <User className="w-3.5 h-3.5 text-purple-600" />
              <span>Nombre y Apellido *</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Camila Morales"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
              <Mail className="w-3.5 h-3.5 text-sky-600" />
              <span>Correo Electrónico *</span>
            </label>
            <input
              type="email"
              required
              placeholder="Ej: camila.morales@alumnos.utalca.cl"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Teléfono / WhatsApp *</span>
            </label>
            <input
              type="tel"
              required
              placeholder="Ej: +56 9 8765 4321"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50/50"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Para avisarte por WhatsApp cuando esté lista.</span>
          </div>

          {/* Carrera o Unidad Académica Unificada */}
          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1 mb-1">
              <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
              <span>Carrera o Unidad Académica *</span>
            </label>
            <select
              value={carrera}
              onChange={(e) => setCarrera(e.target.value as CarreraOUnidad)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50/50 text-xs font-semibold"
            >
              <optgroup label="Facultad de Ingeniería UTalca">
                {CARRERAS_Y_UNIDADES.slice(0, 8).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </optgroup>
              <optgroup label="Otras Unidades y Estamentos">
                {CARRERAS_Y_UNIDADES.slice(8).map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </optgroup>
            </select>
          </div>

        </div>
      </div>

      {/* SECCIÓN 2: ARCHIVO 3D Y VISUALIZADOR INTERACTIVO */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-black text-xs">
            2
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-800">
              Carga y Previsualización del Modelo 3D
            </h3>
            <p className="text-[11px] text-slate-400">
              Formatos compatibles: .STL, .OBJ, .3MF, .ZIP, .RAR (hasta 50 MB)
            </p>
          </div>
        </div>

        {/* Zona Drag & Drop */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition ${
            dragOver
              ? 'border-purple-600 bg-purple-50/70 scale-[1.01]'
              : file
              ? 'border-emerald-400 bg-emerald-50/30'
              : 'border-slate-300 hover:border-purple-400 bg-slate-50/50 hover:bg-purple-50/20'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            accept=".stl,.obj,.3mf,.zip,.rar"
            className="hidden"
          />

          {file ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                {['zip', 'rar'].includes(file.name.split('.').pop()?.toLowerCase() || '') ? (
                  <FolderArchive className="w-6 h-6 text-emerald-700" />
                ) : (
                  <FileBox className="w-6 h-6" />
                )}
              </div>
              <div className="text-left">
                <p className="font-extrabold text-sm text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Clic o arrastra para cambiar archivo
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="font-extrabold text-sm text-slate-800">
                Haz clic para subir o arrastra tu archivo 3D aquí
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Modelos individuales (.STL, .OBJ, .3MF) o paquetes comprimidos (.ZIP, .RAR) para múltiples piezas.
              </p>
            </>
          )}
        </div>

        {/* Visor 3D o Tarjeta de Paquete Comprimido */}
        {file && (
          ['zip', 'rar'].includes(file.name.split('.').pop()?.toLowerCase() || '') ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border border-purple-200 flex items-start gap-3.5 shadow-2xs">
              <div className="w-11 h-11 rounded-xl bg-purple-200 text-purple-900 flex items-center justify-center shrink-0 shadow-2xs">
                <FolderArchive className="w-6 h-6" />
              </div>
              <div className="text-xs">
                <h4 className="font-extrabold text-sm text-purple-950 mb-1 flex items-center gap-2">
                  <span>Paquete Comprimido ({file.name.split('.').pop()?.toUpperCase()})</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 text-[10px] font-black">
                    Múltiples Piezas
                  </span>
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  Has subido un archivo comprimido con varias piezas. La previsualización 3D individual se omite para paquetes comprimidos; el <strong>Equipo Makerbox</strong> descomprimirá el paquete y revisará cada modelo en el laboratorio.
                </p>
                <p className="text-[11px] text-purple-900 font-bold mt-1.5">
                  💡 Recuerda detallar la cantidad de piezas o colores requeridos en el campo de "Observaciones".
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Inspección 3D en Tiempo Real:</span>
              </span>
              <ModelViewer3D
                file={file}
                previewColor={color}
                onDimensionsCalculated={setFileDimensions}
              />
            </div>
          )
        )}
      </div>

      {/* SECCIÓN 3: ESPECIFICACIONES DE IMPRESIÓN */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-800 flex items-center justify-center font-black text-xs">
            3
          </div>
          <h3 className="font-extrabold text-sm text-slate-800">
            Parámetros y Especificaciones de Fabricación
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          {/* Material */}
          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1 mb-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Material Preferido *</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'PLA', desc: 'Estándar, prototipado rápido' },
                { name: 'PETG', desc: 'Mayor tenacidad y temp.' },
                { name: 'TPU', desc: 'Flexible, tipo goma' },
                { name: 'Resina UV', desc: 'Alta definición y detalle' }
              ].map((m) => (
                <button
                  type="button"
                  key={m.name}
                  onClick={() => setMaterial(m.name as Material3D)}
                  className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                    material === m.name
                      ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-xs">{m.name}</div>
                  <div className="text-[10px] text-slate-500 leading-tight">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1 mb-1.5">
              <Palette className="w-3.5 h-3.5 text-pink-600" />
              <span>Color del Filamento</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                'Blanco',
                'Negro',
                'Gris',
                'Rojo',
                'Azul',
                'Naranja',
                'Amarillo',
                'Verde',
                'Indiferente'
              ].map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`px-3 py-2 rounded-xl text-center font-bold text-xs border transition cursor-pointer ${
                    color === c
                      ? 'bg-pink-50 border-pink-500 text-pink-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Relleno (Infill) */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Densidad de Relleno (Infill)
            </label>
            <select
              value={relleno}
              onChange={(e) => setRelleno(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50/50"
            >
              <option value="15% (Prototipo Ligero / Visual)">15% (Prototipo Ligero / Visual)</option>
              <option value="20% (Estándar)">20% (Estándar recomendado)</option>
              <option value="35% (Resistencia Media)">35% (Resistencia Media)</option>
              <option value="60%+ (Funcional Mecánico)">60%+ (Funcional / Soporta Cargas)</option>
              <option value="A criterio del equipo Makerbox">A criterio del equipo Makerbox</option>
            </select>
          </div>

          {/* Calidad de Capa */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Calidad de Capa
            </label>
            <select
              value={calidad}
              onChange={(e) => setCalidad(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50/50"
            >
              <option value="Rápido / Borrador (0.28mm)">Rápido / Borrador (0.28 mm)</option>
              <option value="Estándar (0.20mm)">Estándar balanceado (0.20 mm)</option>
              <option value="Detalle Fino (0.12mm)">Detalle Fino (0.12 mm)</option>
            </select>
          </div>

          {/* Observaciones */}
          <div className="sm:col-span-2">
            <label className="font-bold text-slate-700 block mb-1">
              Observaciones, Fecha Límite o Requerimientos Especiales:
            </label>
            <textarea
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Es un prototipo para presentación del viernes; requiere soporte tipo árbol; tolerancia de ensamble de 0.2mm..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50/50"
            />
          </div>

        </div>
      </div>

      {/* Botón de Envío */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <Info className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            Al enviar, se generará tu <strong>Código de Seguimiento</strong> para verificar el avance y recibir avisos.
          </span>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !file}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-extrabold text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer ${
            isSubmitting || !file
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-purple-700 hover:bg-purple-800 text-white active:scale-98'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Procesando Solicitud...</span>
            </>
          ) : (
            <>
              <span>Enviar Solicitud al Equipo Makerbox</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

    </form>
  );
};
