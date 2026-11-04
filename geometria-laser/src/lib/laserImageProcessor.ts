// Procesador de imágenes de alta resolución para Grabado y Corte Láser en Madera MDF 8x8 cm (LightBurn)

export type LaserDitherMode = 'atkinson' | 'floyd-steinberg' | 'grayscale' | 'threshold' | 'original';

export interface LaserImageConfig {
  brightness: number; // -100 to 100 (defecto: 5)
  contrast: number; // -100 to 100 (defecto: 20)
  sharpen: number; // 0 to 100 (defecto: 30)
  invert: boolean; // false
  ditherMode: LaserDitherMode;
  thresholdLevel: number; // 0 to 255 (defecto: 128)
  boardWidthMm: number; // 80 mm (8 cm)
  boardHeightMm: number; // 80 mm (8 cm)
  cornerRadiusMm: number; // 0 a 10 mm (defecto: 4 mm)
  marginMm: number; // 0 a 10 mm (defecto: 3 mm)
  hasHole: boolean; // agujero para colgar / llavero
  holeDiameterMm: number; // 3.5 mm
  holePosition: 'top-center' | 'top-left'; // posición del agujero
}

export const DEFAULT_LASER_IMAGE_CONFIG: LaserImageConfig = {
  brightness: 5,
  contrast: 20,
  sharpen: 30,
  invert: false,
  ditherMode: 'atkinson',
  thresholdLevel: 128,
  boardWidthMm: 80,
  boardHeightMm: 80,
  cornerRadiusMm: 4,
  marginMm: 3,
  hasHole: false,
  holeDiameterMm: 4,
  holePosition: 'top-center'
};

export interface ProcessedLaserResult {
  processedDataUrl: string; // PNG en alta resolución del área de la imagen
  svgContent: string; // Archivo SVG listo para LightBurn con capa de grabado y capa de corte rojo
  woodPreviewDataUrl: string; // Vista previa simulada en madera MDF quemada
  widthPx: number;
  heightPx: number;
  dpi: number;
}

/**
 * Carga una imagen como HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Aplica un filtro de nitidez (Unsharp mask convolución 3x3)
 */
function applySharpen(imageData: ImageData, amount: number) {
  if (amount <= 0) return;

  const w = imageData.width;
  const h = imageData.height;
  const data = imageData.data;
  const copy = new Uint8ClampedArray(data);

  // Cantidad de realce de bordes (0 a 1.5)
  const k = (amount / 100) * 1.5;
  const centerWeight = 1 + 4 * (k / 4);
  const edgeWeight = -k / 4;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;

      for (let c = 0; c < 3; c++) {
        const val =
          copy[idx + c] * centerWeight +
          (copy[((y - 1) * w + x) * 4 + c] +
            copy[((y + 1) * w + x) * 4 + c] +
            copy[(y * w + (x - 1)) * 4 + c] +
            copy[(y * w + (x + 1)) * 4 + c]) *
            edgeWeight;

        data[idx + c] = Math.min(255, Math.max(0, val));
      }
    }
  }
}

/**
 * Procesa una imagen ajustando brillo, contraste, nitidez y tramado para corte/grabado láser
 */
export async function processImageForLaser(
  imageSource: string,
  config: LaserImageConfig,
  targetDpi: number = 300
): Promise<ProcessedLaserResult> {
  const img = await loadImage(imageSource);

  // Calcular dimensiones en píxeles según DPI
  // 1 pulgada = 25.4 mm
  const mmToPx = (mm: number) => Math.round((mm / 25.4) * targetDpi);

  // Tamaño de la placa completa (ej. 80x80 mm a 300 DPI ≈ 945x945 px)
  const boardWPx = mmToPx(config.boardWidthMm);
  const boardHPx = mmToPx(config.boardHeightMm);

  // Tamaño del área de la imagen (restando márgenes)
  const innerWidthMm = Math.max(10, config.boardWidthMm - config.marginMm * 2);
  const innerHeightMm = Math.max(10, config.boardHeightMm - config.marginMm * 2);
  const imgWPx = mmToPx(innerWidthMm);
  const imgHPx = mmToPx(innerHeightMm);

  // Canvas para procesar la imagen grabada
  const canvas = document.createElement('canvas');
  canvas.width = imgWPx;
  canvas.height = imgHPx;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No se pudo inicializar el contexto 2D de canvas');

  // Rellenar fondo blanco
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, imgWPx, imgHPx);

  // Calcular encuadre centrado cubriendo el área (object-fit: cover)
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = imgWPx / imgHPx;
  let sWidth = img.naturalWidth;
  let sHeight = img.naturalHeight;
  let sx = 0;
  let sy = 0;

  if (imgRatio > targetRatio) {
    // La imagen es más ancha: recortar lados
    sWidth = img.naturalHeight * targetRatio;
    sx = (img.naturalWidth - sWidth) / 2;
  } else {
    // La imagen es más alta: recortar arriba/abajo
    sHeight = img.naturalWidth / targetRatio;
    sy = (img.naturalHeight - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, imgWPx, imgHPx);

  // Obtener píxeles crudos
  const imgData = ctx.getImageData(0, 0, imgWPx, imgHPx);
  const pixels = imgData.data;

  // 1. Aplicar Sharpen si está activo
  if (config.sharpen > 0) {
    applySharpen(imgData, config.sharpen);
  }

  // 2. Factores de Brillo y Contraste
  // Factor de contraste estándar de 259
  const contrastFactor =
    (259 * (config.contrast + 255)) / (255 * Math.max(1, 259 - config.contrast));
  const brightnessOffset = config.brightness * 2.55;

  // Convertir a escala de grises con corrección tonal
  const grayBuffer = new Float32Array(imgWPx * imgHPx);

  for (let i = 0; i < grayBuffer.length; i++) {
    const p = i * 4;
    // Luminancia estándar sRGB (Rec. 709)
    let lum = 0.299 * pixels[p] + 0.587 * pixels[p + 1] + 0.114 * pixels[p + 2];

    // Aplicar contraste
    lum = contrastFactor * (lum - 128) + 128;
    // Aplicar brillo
    lum += brightnessOffset;

    // Invertir si está habilitado
    if (config.invert) {
      lum = 255 - lum;
    }

    // Clampeado a rango [0, 255]
    grayBuffer[i] = Math.min(255, Math.max(0, lum));
  }

  // 3. Aplicar modo de tramado
  const outData = ctx.createImageData(imgWPx, imgHPx);
  const outPixels = outData.data;

  if (config.ditherMode === 'original') {
    // Mantener color original ajustando brillo/contraste
    for (let i = 0; i < grayBuffer.length; i++) {
      const p = i * 4;
      for (let c = 0; c < 3; c++) {
        let val = pixels[p + c];
        val = contrastFactor * (val - 128) + 128 + brightnessOffset;
        if (config.invert) val = 255 - val;
        outPixels[p + c] = Math.min(255, Math.max(0, val));
      }
      outPixels[p + 3] = 255;
    }
  } else if (config.ditherMode === 'grayscale') {
    // Escala de grises continua (para grabado 3D o potencias variables en LightBurn)
    for (let i = 0; i < grayBuffer.length; i++) {
      const p = i * 4;
      const g = Math.round(grayBuffer[i]);
      outPixels[p] = g;
      outPixels[p + 1] = g;
      outPixels[p + 2] = g;
      outPixels[p + 3] = 255;
    }
  } else if (config.ditherMode === 'threshold') {
    // Blanco y negro puro directo por umbral
    const thresh = config.thresholdLevel;
    for (let i = 0; i < grayBuffer.length; i++) {
      const p = i * 4;
      const val = grayBuffer[i] >= thresh ? 255 : 0;
      outPixels[p] = val;
      outPixels[p + 1] = val;
      outPixels[p + 2] = val;
      outPixels[p + 3] = 255;
    }
  } else if (config.ditherMode === 'atkinson') {
    // Tramado Atkinson (El estándar de oro para grabado láser en madera MDF)
    // Difunde 1/8 del error a 6 vecinos seleccionados (75% error retenido para contraste nítido)
    const buf = new Float32Array(grayBuffer);

    for (let y = 0; y < imgHPx; y++) {
      for (let x = 0; x < imgWPx; x++) {
        const idx = y * imgWPx + x;
        const oldVal = buf[idx];
        const newVal = oldVal >= 128 ? 255 : 0;
        const err = (oldVal - newVal) / 8;

        const p = idx * 4;
        outPixels[p] = newVal;
        outPixels[p + 1] = newVal;
        outPixels[p + 2] = newVal;
        outPixels[p + 3] = 255;

        // Difusión Atkinson:
        // (x+1, y)
        if (x + 1 < imgWPx) buf[idx + 1] += err;
        // (x+2, y)
        if (x + 2 < imgWPx) buf[idx + 2] += err;
        // (x-1, y+1)
        if (x - 1 >= 0 && y + 1 < imgHPx) buf[idx + imgWPx - 1] += err;
        // (x, y+1)
        if (y + 1 < imgHPx) buf[idx + imgWPx] += err;
        // (x+1, y+1)
        if (x + 1 < imgWPx && y + 1 < imgHPx) buf[idx + imgWPx + 1] += err;
        // (x, y+2)
        if (y + 2 < imgHPx) buf[idx + imgWPx * 2] += err;
      }
    }
  } else if (config.ditherMode === 'floyd-steinberg') {
    // Tramado Floyd-Steinberg clásico (difusión completa de error)
    const buf = new Float32Array(grayBuffer);

    for (let y = 0; y < imgHPx; y++) {
      for (let x = 0; x < imgWPx; x++) {
        const idx = y * imgWPx + x;
        const oldVal = buf[idx];
        const newVal = oldVal >= 128 ? 255 : 0;
        const err = oldVal - newVal;

        const p = idx * 4;
        outPixels[p] = newVal;
        outPixels[p + 1] = newVal;
        outPixels[p + 2] = newVal;
        outPixels[p + 3] = 255;

        // Difusión Floyd-Steinberg:
        // (x+1, y): 7/16
        if (x + 1 < imgWPx) buf[idx + 1] += err * (7 / 16);
        // (x-1, y+1): 3/16
        if (x - 1 >= 0 && y + 1 < imgHPx) buf[idx + imgWPx - 1] += err * (3 / 16);
        // (x, y+1): 5/16
        if (y + 1 < imgHPx) buf[idx + imgWPx] += err * (5 / 16);
        // (x+1, y+1): 1/16
        if (x + 1 < imgWPx && y + 1 < imgHPx) buf[idx + imgWPx + 1] += err * (1 / 16);
      }
    }
  }

  // Poner píxeles procesados en el canvas
  ctx.putImageData(outData, 0, 0);
  const processedDataUrl = canvas.toDataURL('image/png');

  // 4. Crear simulación visual de madera MDF tostada/quemada
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = boardWPx;
  previewCanvas.height = boardHPx;
  const pCtx = previewCanvas.getContext('2d');
  if (!pCtx) throw new Error('No se pudo crear el canvas de vista previa');

  // Textura base de madera MDF (Tono beige natural característico del trupán / MDF)
  pCtx.fillStyle = '#d6b88d';
  pCtx.fillRect(0, 0, boardWPx, boardHPx);

  // Dibujar sutil veta / degradado de madera
  const woodGrad = pCtx.createLinearGradient(0, 0, boardWPx, boardHPx);
  woodGrad.addColorStop(0, 'rgba(230, 204, 166, 0.4)');
  woodGrad.addColorStop(0.5, 'rgba(196, 160, 115, 0.2)');
  woodGrad.addColorStop(1, 'rgba(215, 185, 145, 0.4)');
  pCtx.fillStyle = woodGrad;
  pCtx.fillRect(0, 0, boardWPx, boardHPx);

  // Dibujar la imagen grabada con efecto quemado láser (modo multiply con tono carbón)
  const marginPx = mmToPx(config.marginMm);

  // Creamos un canvas temporal con el color del quemado láser (#2b1809 - marrón carbón profundo)
  const burnCanvas = document.createElement('canvas');
  burnCanvas.width = imgWPx;
  burnCanvas.height = imgHPx;
  const bCtx = burnCanvas.getContext('2d');
  if (bCtx) {
    bCtx.drawImage(canvas, 0, 0);
    // Convertir zonas negras a color carbón y zonas blancas a transparentes para la vista de madera
    const bImgData = bCtx.getImageData(0, 0, imgWPx, imgHPx);
    const bPix = bImgData.data;
    for (let i = 0; i < bPix.length; i += 4) {
      // 0 es negro (quemado máximo), 255 es blanco (sin quemar)
      const lum = bPix[i]; // como es b/n o escala de grises
      const burnOpacity = (255 - lum) / 255; // 1 = quemado, 0 = madera limpia
      // Color carbón MDF quemado: RGB(45, 25, 12)
      bPix[i] = 42;
      bPix[i + 1] = 23;
      bPix[i + 2] = 10;
      bPix[i + 3] = Math.round(burnOpacity * 240);
    }
    bCtx.putImageData(bImgData, 0, 0);
    pCtx.drawImage(burnCanvas, marginPx, marginPx);
  }

  // Dibujar contorno de corte rojo (simulado con radio de esquinas)
  const cornerRadiusPx = mmToPx(config.cornerRadiusMm);
  pCtx.lineWidth = Math.max(2, mmToPx(0.5));
  pCtx.strokeStyle = '#e11d48'; // Línea roja visible

  drawRoundedRect(
    pCtx,
    pCtx.lineWidth / 2,
    pCtx.lineWidth / 2,
    boardWPx - pCtx.lineWidth,
    boardHPx - pCtx.lineWidth,
    cornerRadiusPx
  );
  pCtx.stroke();

  // Si tiene orificio para colgar, dibujarlo en la vista previa
  if (config.hasHole) {
    const holeRadiusPx = mmToPx(config.holeDiameterMm / 2);
    let holeX = boardWPx / 2;
    let holeY = mmToPx(config.holeDiameterMm * 1.5);
    if (config.holePosition === 'top-left') {
      holeX = mmToPx(config.holeDiameterMm * 1.8);
      holeY = mmToPx(config.holeDiameterMm * 1.8);
    }

    pCtx.fillStyle = '#ffffff';
    pCtx.beginPath();
    pCtx.arc(holeX, holeY, holeRadiusPx, 0, Math.PI * 2);
    pCtx.fill();
    pCtx.stroke();
  }

  const woodPreviewDataUrl = previewCanvas.toDataURL('image/png');

  // 5. Generar archivo SVG optimizado para LightBurn
  const svgContent = generateLaserMdfSvg(processedDataUrl, config);

  return {
    processedDataUrl,
    svgContent,
    woodPreviewDataUrl,
    widthPx: imgWPx,
    heightPx: imgHPx,
    dpi: targetDpi
  };
}

/**
 * Traza un rectángulo con esquinas redondeadas en Canvas 2D
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, Math.min(w, h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Genera el archivo SVG exacto de 80x80 mm con:
 * - Capa de Grabado: Imagen tramada en base64 en coordenadas milimétricas exactas
 * - Capa de Corte: Perímetro exterior con stroke="#FF0000" y espesor 0.2 mm (formato nativo LightBurn)
 */
export function generateLaserMdfSvg(
  processedPngDataUrl: string,
  config: LaserImageConfig
): string {
  const w = config.boardWidthMm;
  const h = config.boardHeightMm;
  const m = config.marginMm;
  const imgW = Math.max(10, w - m * 2);
  const imgH = Math.max(10, h - m * 2);
  const r = Math.min(config.cornerRadiusMm, Math.min(w, h) / 2);

  // Orificio opcional
  let holeSvg = '';
  if (config.hasHole) {
    const holeR = (config.holeDiameterMm / 2).toFixed(2);
    let hX = (w / 2).toFixed(2);
    let hY = (config.holeDiameterMm * 1.5).toFixed(2);
    if (config.holePosition === 'top-left') {
      hX = (config.holeDiameterMm * 1.8).toFixed(2);
      hY = (config.holeDiameterMm * 1.8).toFixed(2);
    }
    holeSvg = `\n    <!-- Orificio para colgar (Corte Láser Rojo) -->\n    <circle cx="${hX}" cy="${hY}" r="${holeR}" fill="none" stroke="#FF0000" stroke-width="0.2" />`;
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${w}mm"
  height="${h}mm"
  viewBox="0 0 ${w} ${h}"
  version="1.1">
  <title>MakerBox - Placa MDF ${w}x${h}mm para LightBurn</title>
  <desc>Capa Negra = Grabado Raster (Image Scan). Capa Roja = Corte Perimetral (Cut 0.2mm). Festival de Ciencia y Tecnología 2026.</desc>

  <!-- CAPA 1: GRABADO LÁSER (LightBurn asigna a Capa de Imagen / Grabado) -->
  <g id="GRABADO_MDF" inkscape:label="Grabado">
    <image
      x="${m.toFixed(2)}"
      y="${m.toFixed(2)}"
      width="${imgW.toFixed(2)}"
      height="${imgH.toFixed(2)}"
      xlink:href="${processedPngDataUrl}"
      preserveAspectRatio="none"
    />
  </g>

  <!-- CAPA 2: CORTE PERIMETRAL (Línea roja 0.2 mm reconocida automáticamente por LightBurn como CORTE) -->
  <g id="CORTE_PERIMETRAL" inkscape:label="Corte">
    <rect
      x="0"
      y="0"
      width="${w.toFixed(2)}"
      height="${h.toFixed(2)}"
      rx="${r.toFixed(2)}"
      ry="${r.toFixed(2)}"
      fill="none"
      stroke="#FF0000"
      stroke-width="0.2"
    />${holeSvg}
  </g>
</svg>`;
}

/**
 * Descarga el archivo SVG generado para LightBurn
 */
export function downloadLaserSvg(svgContent: string, filename: string = 'grabado-corte-mdf-8x8cm.svg') {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Descarga la imagen PNG procesada a 300 DPI
 */
export function downloadLaserPng(pngDataUrl: string, filename: string = 'imagen-laser-300dpi.png') {
  const a = document.createElement('a');
  a.href = pngDataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
