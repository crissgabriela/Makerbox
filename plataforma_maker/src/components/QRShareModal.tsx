'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';
import { QrCode, Download, Printer, Copy, Check, X, ExternalLink, Sparkles } from 'lucide-react';

interface QRShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRShareModal: React.FC<QRShareModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'solicitud' | 'seguimiento'>('solicitud');
  const [targetUrl, setTargetUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Inicializar URL basada en el origen actual
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const url = activeTab === 'solicitud' ? origin : `${origin}/?tab=tracking`;
      setTargetUrl(url);
    }
  }, [activeTab, isOpen]);

  // Regenerar QR cuando cambie la URL
  useEffect(() => {
    if (!targetUrl) return;

    QRCode.toDataURL(targetUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: activeTab === 'solicitud' ? '#46247a' : '#00aeef',
        light: '#ffffff'
      }
    })
      .then(setQrDataUrl)
      .catch((err) => console.error('Error generando QR:', err));
  }, [targetUrl, activeTab]);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPNG = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = activeTab === 'solicitud' ? 'qr-solicitud-makerbox.png' : 'qr-seguimiento-makerbox.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintPoster = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const title = activeTab === 'solicitud'
      ? 'Solicitud de Impresión 3D'
      : 'Seguimiento de Trabajos 3D';
    const subtitle = activeTab === 'solicitud'
      ? 'Escanea con tu teléfono para ingresar tu proyecto de fabricación'
      : 'Escanea para consultar el estado de tu pieza en el laboratorio';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Lámina QR MakerBox - ${title}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center;
            color: #1e293b;
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 90vh;
            box-sizing: border-box;
          }
          .card {
            border: 4px solid #46247a;
            border-radius: 28px;
            padding: 40px 30px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
          }
          .header-logos {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            margin-bottom: 25px;
          }
          .badge {
            display: inline-block;
            background-color: #f3e8ff;
            color: #46247a;
            font-weight: 800;
            font-size: 13px;
            padding: 6px 16px;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
          }
          h1 {
            font-size: 32px;
            font-weight: 900;
            color: #1e293b;
            margin: 0 0 10px 0;
          }
          p {
            font-size: 16px;
            color: #64748b;
            margin: 0 0 30px 0;
          }
          .qr-container {
            padding: 15px;
            background: white;
            border: 2px dashed #cbd5e1;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 25px;
          }
          .qr-container img {
            width: 280px;
            height: 280px;
            display: block;
          }
          .url-text {
            font-family: monospace;
            font-size: 14px;
            font-weight: bold;
            color: #46247a;
            word-break: break-all;
            margin-bottom: 20px;
          }
          .instructions {
            background-color: #f8fafc;
            border-radius: 14px;
            padding: 15px 20px;
            text-align: left;
            font-size: 13px;
            color: #475569;
            line-height: 1.5;
          }
          .footer {
            margin-top: 25px;
            font-size: 12px;
            color: #94a3b8;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">MakerBox • Co Creación e Innovación</div>
          <h1>${title}</h1>
          <p>${subtitle}</p>

          <div class="qr-container">
            <img src="${qrDataUrl}" alt="QR MakerBox" />
          </div>

          <div class="url-text">${targetUrl}</div>

          <div class="instructions">
            <strong>Instrucciones:</strong>
            <ol style="margin: 6px 0 0 0; padding-left: 20px;">
              <li>Abre la cámara de tu smartphone y enfoca el código QR.</li>
              <li>Ingresa tus datos y sube tu archivo 3D (.STL, .OBJ o .3MF).</li>
              <li>Recibe confirmación y avisos por WhatsApp cuando tu pieza esté lista.</li>
            </ol>
          </div>

          <div class="footer">
            Facultad de Ingeniería • Universidad de Talca
          </div>
        </div>
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95">
        
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">Códigos QR para Stand y Usuarios</h3>
              <p className="text-xs text-slate-400">Genera, descarga o imprime láminas de acceso rápido</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center text-center gap-4">
          
          {/* Selector de Destino del QR */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full">
            <button
              type="button"
              onClick={() => setActiveTab('solicitud')}
              className={`flex-1 py-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                activeTab === 'solicitud'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📥 Nueva Solicitud
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('seguimiento')}
              className={`flex-1 py-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                activeTab === 'seguimiento'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔍 Seguimiento
            </button>
          </div>

          {/* Render del QR en alta resolución */}
          <div className="p-4 bg-white border-2 border-dashed border-purple-200 rounded-3xl shadow-xs flex flex-col items-center gap-2">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Código QR MakerBox" className="w-56 h-56 rounded-xl" />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <span className="text-[11px] font-bold text-slate-500">
              {activeTab === 'solicitud' ? 'Escanea para hacer una solicitud' : 'Escanea para consultar estado'}
            </span>
          </div>

          {/* Enlace editable para personalizar si se despliega en Vercel */}
          <div className="w-full text-left">
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Enlace de destino (puedes ajustarlo a tu dominio en Vercel):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50 font-mono"
              />
              <button
                type="button"
                onClick={handleCopyUrl}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200"
                title="Copiar enlace"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="w-full pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPNG}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-purple-600" />
              <span>Descargar PNG</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPoster}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Cartel Stand</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
