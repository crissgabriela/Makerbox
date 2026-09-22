'use client';

import React, { useState } from 'react';
import { Solicitud3D } from '@/types';
import { MessageSquare, Mail, X, Send, Copy, Check } from 'lucide-react';

interface QuickContactModalProps {
  solicitud: Solicitud3D;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickContactModal: React.FC<QuickContactModalProps> = ({
  solicitud,
  isOpen,
  onClose
}) => {
  const [templateType, setTemplateType] = useState<'aprobada' | 'lista' | 'ajuste' | 'personalizado'>('lista');
  const [customNotes, setCustomNotes] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Limpiar número para WhatsApp (asumiendo Chile +56 si no tiene prefijo)
  let cleanPhone = solicitud.telefono.replace(/[^\d+]/g, '');
  if (!cleanPhone.startsWith('+')) {
    cleanPhone = '56' + cleanPhone.replace(/^0+/, '');
  } else {
    cleanPhone = cleanPhone.replace('+', '');
  }

  // Generar cuerpo del mensaje según la plantilla
  const getMessageText = () => {
    switch (templateType) {
      case 'aprobada':
        return `Hola ${solicitud.nombre}! Te saludamos desde MakerBox (Facultad de Ingeniería UTalca).\n\n` +
          `Tu solicitud de impresión 3D *[${solicitud.id}]* para el archivo _"${solicitud.archivoNombre}"_ ha sido evaluada y está *Aprobada*.\n` +
          `• Material: ${solicitud.material} (${solicitud.color})\n` +
          (solicitud.tiempoEstimadoHoras ? `• Tiempo estimado: ~${solicitud.tiempoEstimadoHoras} hrs\n` : '') +
          (solicitud.impresoraAsignada ? `• Máquina: ${solicitud.impresoraAsignada}\n` : '') +
          (customNotes ? `\nObservaciones: ${customNotes}\n` : '') +
          `\nTe avisaremos apenas tu pieza esté terminada. ¡Saludos!`;

      case 'lista':
        return `¡Hola ${solicitud.nombre}! Buenas noticias desde MakerBox (Facultad de Ingeniería UTalca) 🎉\n\n` +
          `Tu pieza 3D *[${solicitud.id}]* correspondiente a _"${solicitud.archivoNombre}"_ ya está *LISTA PARA RETIRO*.\n\n` +
          `📍 Lugar: Laboratorio MakerBox, Campus Los Niches / Curicó.\n` +
          `⏰ Horario de atención: Lunes a Viernes de 09:00 a 18:00 hrs.\n` +
          (customNotes ? `\nNota: ${customNotes}\n` : '') +
          `\nRecuerda mencionar tu código *${solicitud.id}* al momento de retirar. ¡Te esperamos!`;

      case 'ajuste':
        return `Hola ${solicitud.nombre}, te contactamos desde el laboratorio MakerBox.\n\n` +
          `Revisamos tu archivo 3D *[${solicitud.id}]* _"${solicitud.archivoNombre}"_ y necesitamos realizar algunos ajustes antes de imprimir:\n` +
          (customNotes ? `• Detalle: ${customNotes}\n` : '• Por favor contáctanos o sube una versión corregida con mayor espesor de paredes o escala adecuada.\n') +
          `\nQuedamos atentos a tus comentarios para poder programar tu trabajo.`;

      case 'personalizado':
      default:
        return `Hola ${solicitud.nombre}, te escribimos de MakerBox UTalca respecto a tu solicitud 3D [${solicitud.id}]. ${customNotes}`;
    }
  };

  const message = getMessageText();

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  const handleOpenEmail = () => {
    const subject = encodeURIComponent(`[MakerBox UTalca] Estado Solicitud Impresión 3D #${solicitud.id}`);
    const body = encodeURIComponent(message + `\n\n---\nEquipo Makerbox\nconsultasmakerbox@utalca.cl\nFacultad de Ingeniería • Universidad de Talca`);
    window.open(`mailto:${solicitud.correo}?cc=consultasmakerbox@utalca.cl&subject=${subject}&body=${body}`, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Contactar a {solicitud.nombre}</h3>
              <p className="text-xs text-slate-400">Solicitud {solicitud.id} • {solicitud.archivoNombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          
          {/* Selector de Plantilla */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Selecciona el Tipo de Mensaje:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTemplateType('lista')}
                className={`px-3 py-2 rounded-xl text-xs font-bold text-left border transition cursor-pointer ${
                  templateType === 'lista'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🎉 Lista para Retiro
              </button>

              <button
                type="button"
                onClick={() => setTemplateType('aprobada')}
                className={`px-3 py-2 rounded-xl text-xs font-bold text-left border transition cursor-pointer ${
                  templateType === 'aprobada'
                    ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                ✅ Aprobada / En Cola
              </button>

              <button
                type="button"
                onClick={() => setTemplateType('ajuste')}
                className={`px-3 py-2 rounded-xl text-xs font-bold text-left border transition cursor-pointer ${
                  templateType === 'ajuste'
                    ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                ⚠️ Ajuste Requerido
              </button>
            </div>
          </div>

          {/* Campo de Notas Adicionales */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Nota o Detalle Adicional (opcional):</label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Ej: Impresa en Bambu Lab #1, lista en mesón de entrega"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Vista Previa del Mensaje */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">Vista Previa del Texto:</label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado' : 'Copiar texto'}</span>
              </button>
            </div>
            <textarea
              readOnly
              value={message}
              rows={6}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none resize-none"
            />
          </div>

          {/* Canales de Envío */}
          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Destino: <span className="font-semibold text-slate-800">{solicitud.telefono}</span> | <span className="font-semibold text-slate-800">{solicitud.correo}</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleOpenEmail}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Mail className="w-4 h-4 text-sky-600" />
                <span>Enviar Correo</span>
              </button>

              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Abrir WhatsApp</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
