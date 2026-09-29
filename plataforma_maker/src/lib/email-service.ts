import { Solicitud3D, EstadoSolicitud } from '@/types';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').trim();
const SMTP_HOST = (process.env.SMTP_HOST || '').trim();
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = (process.env.SMTP_USER || '').trim();
const SMTP_PASS = (process.env.SMTP_PASS || '').trim();
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465;

const EMAIL_FROM = process.env.EMAIL_FROM || 'MakerBox UTalca <consultasmakerbox@utalca.cl>';
const MAKERBOX_EMAIL = 'consultasmakerbox@utalca.cl';
const MAKERBOX_PHONE = '+56 9 9123 4567';

function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  return 'http://localhost:3000';
}

/**
 * Retorna true si hay algún proveedor de correo configurado
 */
export function isEmailConfigured(): boolean {
  if (RESEND_API_KEY.length > 5) return true;
  if (SMTP_HOST.length > 0 && SMTP_USER.length > 0 && SMTP_PASS.length > 0) return true;
  return false;
}

/**
 * Genera la plantilla HTML responsive oficial de MakerBox
 */
function buildConfirmationHtml(solicitud: Solicitud3D): string {
  const trackingUrl = `${getAppBaseUrl()}/?tab=tracking&id=${encodeURIComponent(solicitud.id)}`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Solicitud 3D - MakerBox UTalca</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal -->
        <table role="presentation" width="100%" max-width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          
          <!-- Cabecera Institucional MakerBox -->
          <tr>
            <td style="background: linear-gradient(135deg, #46247a 0%, #c72979 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">
                MAKERBOX • UTALCA
              </h1>
              <p style="margin: 6px 0 0 0; color: rgba(255, 255, 255, 0.85); font-size: 13px; font-weight: 500;">
                Facultad de Ingeniería • Universidad de Talca
              </p>
            </td>
          </tr>

          <!-- Cuerpo del Mensaje -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px; font-weight: 800;">
                ¡Hola, ${solicitud.nombre}! 👋
              </h2>
              <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                Hemos recibido exitosamente tu solicitud de impresión 3D en el laboratorio <strong>MakerBox</strong>. Nuestro equipo técnico evaluará la geometría y el archivo para iniciar la fabricación.
              </p>

              <!-- Tarjeta de Código de Seguimiento -->
              <table role="presentation" width="100%" style="background-color: #f1f5f9; border-radius: 14px; border: 1px dashed #cbd5e1; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
                      Tu Código de Seguimiento
                    </div>
                    <div style="font-family: monospace; font-size: 26px; font-weight: 900; color: #46247a; letter-spacing: 2px;">
                      ${solicitud.id}
                    </div>
                    <div style="margin-top: 14px;">
                      <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #46247a; color: #ffffff; text-decoration: none; padding: 10px 22px; border-radius: 10px; font-size: 13px; font-weight: 700;">
                        🔍 Ver Estado en Vivo
                      </a>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Resumen de Parámetros Técnicos -->
              <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                Detalles del Trabajo Registrado
              </h3>
              <table role="presentation" width="100%" style="border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Archivo:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${solicitud.archivoNombre} (${solicitud.archivoTamanoMb} MB)</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Carrera / Unidad:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${solicitud.carrera || 'No especificada'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Material y Color:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${solicitud.material} • ${solicitud.color}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Relleno y Calidad:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${solicitud.relleno} • ${solicitud.calidad}</td>
                </tr>
                ${solicitud.observaciones ? `
                <tr>
                  <td colspan="2" style="padding: 12px 0 4px 0;">
                    <span style="color: #64748b; font-weight: 600; display: block; margin-bottom: 4px;">Tus Observaciones:</span>
                    <span style="color: #334155; font-style: italic; background-color: #f8fafc; display: block; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">"${solicitud.observaciones}"</span>
                  </td>
                </tr>` : ''}
              </table>

              <!-- Información de Contacto del Laboratorio -->
              <div style="background-color: #eff6ff; border-radius: 12px; padding: 16px; border: 1px solid #bfdbfe; font-size: 12px; line-height: 1.5; color: #1e40af;">
                <strong>Canales Oficiales del Equipo Makerbox:</strong><br>
                ✉️ Correo: <a href="mailto:${MAKERBOX_EMAIL}" style="color: #1d4ed8; font-weight: bold;">${MAKERBOX_EMAIL}</a><br>
                📞 WhatsApp / Teléfono: <strong>${MAKERBOX_PHONE}</strong><br>
                📍 Laboratorio MakerBox • Edificio de Co-Creación e Innovación, Facultad de Ingeniería UTalca.
              </div>

            </td>
          </tr>

          <!-- Pie de Página -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
              Este es un correo automático generado por la Plataforma de Impresión 3D de MakerBox UTalca.<br>
              Si tienes dudas o necesitas modificar tu archivo, responde a este correo o contáctanos directamente.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Envía el correo automático de confirmación al solicitante
 */
export async function sendConfirmationEmail(solicitud: Solicitud3D): Promise<{ success: boolean; message?: string }> {
  if (!isEmailConfigured()) {
    console.log('[EmailService] Proveedor de correo no configurado. Omitiendo envío automático.');
    return { success: false, message: 'Proveedor de correo no configurado' };
  }

  const subject = `[MakerBox UTalca] Solicitud de Impresión 3D Recibida - ${solicitud.id}`;
  const html = buildConfirmationHtml(solicitud);

  // 1. Envío vía Resend (si está configurado RESEND_API_KEY)
  if (RESEND_API_KEY.length > 5) {
    try {
      const resend = new Resend(RESEND_API_KEY);
      const res = await resend.emails.send({
        from: EMAIL_FROM,
        to: [solicitud.correo],
        replyTo: MAKERBOX_EMAIL,
        subject,
        html
      });

      if (res.error) {
        console.error('[EmailService - Resend] Error:', res.error);
        return { success: false, message: res.error.message };
      }

      console.log(`[EmailService - Resend] Correo enviado exitosamente a ${solicitud.correo} (${solicitud.id})`);
      return { success: true };
    } catch (err) {
      console.error('[EmailService - Resend] Excepción:', err);
      return { success: false, message: (err as any)?.message };
    }
  }

  // 2. Envío vía SMTP (Brevo, Office 365, etc.)
  if (SMTP_HOST.length > 0 && SMTP_USER.length > 0 && SMTP_PASS.length > 0) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: EMAIL_FROM,
        to: solicitud.correo,
        replyTo: MAKERBOX_EMAIL,
        subject,
        html
      });

      console.log(`[EmailService - SMTP] Correo enviado exitosamente a ${solicitud.correo} (${solicitud.id})`);
      return { success: true };
    } catch (err) {
      console.error('[EmailService - SMTP] Excepción:', err);
      return { success: false, message: (err as any)?.message };
    }
  }

  return { success: false, message: 'No hay proveedor de correo configurado' };
}
