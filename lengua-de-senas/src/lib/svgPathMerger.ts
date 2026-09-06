import { GeneratedLaserSvg, LaserConfig, SignDefinition } from '@/types';
import { SIGNS_DICTIONARY, normalizeText } from './signsData';

/**
 * Escala coordenadas de un path simple o aplica un offset en X e Y.
 */
export function transformPath(pathD: string, scale = 1, offsetX = 0, offsetY = 0): string {
  if (scale === 1 && offsetX === 0 && offsetY === 0) return pathD;
  let isY = false;
  return pathD.replace(/([MLHVCSQTAZmlhvcsqtaz])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/g, (match, cmd, num) => {
    if (cmd) {
      isY = false;
      return cmd + ' ';
    }
    if (num !== undefined) {
      const val = parseFloat(num);
      const res = isY ? val * scale + offsetY : val * scale + offsetX;
      isY = !isY;
      return Math.round(res * 100) / 100 + ' ';
    }
    return match;
  });
}

/**
 * Convierte un conjunto de puntos ordenados en una curva Bezier cúbica suave (Catmull-Rom cerrado).
 * Genera el contorno orgánico continuo idéntico al boceto del llavero.
 */
function pointsToSmoothClosedPath(points: { x: number; y: number }[]): string {
  const n = points.length;
  if (n < 3) return '';

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let i = 0; i < n; i++) {
    const pPrev = points[(i - 1 + n) % n];
    const pCurr = points[i];
    const pNext = points[(i + 1) % n];
    const pAfter = points[(i + 2) % n];

    // Factor de tensión de suavizado (0.5 = Catmull-Rom estándar)
    const tension = 0.5;

    const cp1x = pCurr.x + (pNext.x - pPrev.x) * (tension / 3);
    const cp1y = pCurr.y + (pNext.y - pPrev.y) * (tension / 3);

    const cp2x = pNext.x - (pAfter.x - pCurr.x) * (tension / 3);
    const cp2y = pNext.y - (pAfter.y - pCurr.y) * (tension / 3);

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${pNext.x.toFixed(2)} ${pNext.y.toFixed(2)}`;
  }

  path += ' Z';
  return path;
}

/**
 * Perfiles de altura relativa superior de cada seña chilena (fracción de altura de 0 a 1)
 * para calcular con precisión la ondulación del contorno desfasado.
 */
const SIGN_TOP_PROFILES: Record<string, { left: number; peak: number; right: number; peakX: number }> = {
  A: { left: 0.40, peak: 0.32, right: 0.38, peakX: 0.65 },
  B: { left: 0.18, peak: 0.10, right: 0.18, peakX: 0.50 },
  C: { left: 0.38, peak: 0.26, right: 0.38, peakX: 0.50 },
  D: { left: 0.42, peak: 0.10, right: 0.45, peakX: 0.57 },
  E: { left: 0.38, peak: 0.28, right: 0.38, peakX: 0.50 },
  F: { left: 0.45, peak: 0.12, right: 0.25, peakX: 0.60 },
  G: { left: 0.45, peak: 0.35, right: 0.45, peakX: 0.50 },
  H: { left: 0.42, peak: 0.35, right: 0.42, peakX: 0.60 },
  I: { left: 0.45, peak: 0.12, right: 0.18, peakX: 0.77 },
  J: { left: 0.45, peak: 0.14, right: 0.22, peakX: 0.75 },
  K: { left: 0.42, peak: 0.20, right: 0.35, peakX: 0.65 },
  L: { left: 0.45, peak: 0.10, right: 0.48, peakX: 0.57 },
  M: { left: 0.38, peak: 0.28, right: 0.38, peakX: 0.50 },
  N: { left: 0.38, peak: 0.28, right: 0.42, peakX: 0.50 },
  Ñ: { left: 0.35, peak: 0.16, right: 0.40, peakX: 0.50 },
  O: { left: 0.38, peak: 0.25, right: 0.38, peakX: 0.50 },
  P: { left: 0.45, peak: 0.40, right: 0.45, peakX: 0.60 },
  Q: { left: 0.40, peak: 0.22, right: 0.45, peakX: 0.56 },
  R: { left: 0.42, peak: 0.10, right: 0.35, peakX: 0.60 },
  S: { left: 0.45, peak: 0.10, right: 0.45, peakX: 0.55 },
  T: { left: 0.45, peak: 0.10, right: 0.45, peakX: 0.55 },
  U: { left: 0.12, peak: 0.38, right: 0.14, peakX: 0.50 }, // cuernos (dos picos altos y centro más bajo)
  V: { left: 0.14, peak: 0.30, right: 0.14, peakX: 0.50 }, // V abierta
  W: { left: 0.12, peak: 0.10, right: 0.14, peakX: 0.50 },
  X: { left: 0.40, peak: 0.20, right: 0.40, peakX: 0.55 },
  Y: { left: 0.26, peak: 0.32, right: 0.22, peakX: 0.50 },
  Z: { left: 0.45, peak: 0.10, right: 0.45, peakX: 0.55 }
};

/**
 * Generador principal del SVG de corte láser.
 */
export function generateLaserSvg(text: string, config: LaserConfig): GeneratedLaserSvg {
  const letters = normalizeText(text);
  const activeSigns: SignDefinition[] = letters
    .map((char) => SIGNS_DICTIONARY[char])
    .filter((sign): sign is SignDefinition => Boolean(sign));

  if (activeSigns.length === 0) {
    return {
      svgString: `<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="40mm" viewBox="0 0 100 40">
        <rect width="100" height="40" rx="6" fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2"/>
        <text x="50" y="22" font-family="Arial, sans-serif" font-size="5" text-anchor="middle" fill="#666">Escribe una palabra para generar el llavero</text>
      </svg>`,
      widthMm: 100,
      heightMm: 40,
      signCount: 0,
      estimatedCutLengthMm: 280
    };
  }

  const signHeightMm = config.targetHeightMm; // e.g. 40mm
  const signWidthMm = (signHeightMm * 100) / 130;
  const signSpacingMm = config.signSpacingMm;

  if (config.mode === 'organic_contour') {
    return generateOrganicContourMode(activeSigns, letters, config, signWidthMm, signHeightMm, signSpacingMm);
  } else if (config.mode === 'keychain') {
    return generateKeychainMode(activeSigns, letters, config, signWidthMm, signHeightMm, signSpacingMm);
  } else if (config.mode === 'silhouette') {
    return generateSilhouetteMode(activeSigns, letters, config, signWidthMm, signHeightMm);
  } else {
    return generatePlaqueMode(activeSigns, letters, config, signWidthMm, signHeightMm, signSpacingMm);
  }
}

/**
 * MODO PRINCIPAL: Llavero de Silueta Orgánica (Contorno Desfasado con Agujero a la Izquierda)
 * Idéntico al boceto del usuario:
 * - Contorno exterior continuo suavizado que sigue la ondulación de los dedos con margen uniforme.
 * - Orejeta izquierda redondeada con orificio de corte circular para el aro de llavero.
 * - Interior con los detalles de grabado de cada seña del Alfabeto Manual Chileno.
 */
function generateOrganicContourMode(
  signs: SignDefinition[],
  letters: string[],
  config: LaserConfig,
  signWidth: number,
  signHeight: number,
  spacing: number
): GeneratedLaserSvg {
  const offset = config.contourOffsetMm || 5; // e.g. 5mm de desfase exterior
  const tabWidth = 14; // ancho de la orejeta izquierda para el orificio
  const startSignsX = tabWidth + offset;

  // Calculamos la posición X de cada seña
  const signPositions: { x: number; sign: SignDefinition; letter: string }[] = [];
  let currentX = startSignsX;
  signs.forEach((sign, idx) => {
    signPositions.push({ x: currentX, sign, letter: letters[idx] });
    currentX += signWidth + spacing;
  });

  const lastSign = signPositions[signPositions.length - 1];
  const totalWidth = lastSign.x + signWidth + offset * 1.4;
  const totalHeight = signHeight + offset * 2.2;
  const wristBaseY = signHeight + offset * 0.8;
  const centerY = totalHeight / 2;

  // 1. Orificio del llavero en la orejeta izquierda
  const holeRadius = config.holeDiameterMm / 2;
  const holeCenterX = offset + 5.5;
  const holeCenterY = centerY;

  const holeSvg = `
    <!-- Orificio de Corte para Argolla de Llavero (Izquierda) -->
    <circle cx="${holeCenterX.toFixed(2)}" cy="${holeCenterY.toFixed(2)}" r="${holeRadius.toFixed(2)}" 
            fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2" id="keychain-hole" />
  `;

  // 2. Construcción de los puntos del contorno exterior desfasado (Spline orgánico)
  const contourPoints: { x: number; y: number }[] = [];

  // Extremo izquierdo (arco alrededor del orificio)
  contourPoints.push({ x: offset + 0.5, y: centerY });
  contourPoints.push({ x: offset + 2.5, y: centerY - 7 });
  contourPoints.push({ x: tabWidth * 0.7, y: centerY - 10 });

  // Parte superior: sigue las alturas de cada seña con el desfase
  signPositions.forEach(({ x, letter }, idx) => {
    const profile = SIGN_TOP_PROFILES[letter] || { left: 0.35, peak: 0.15, right: 0.35, peakX: 0.5 };

    const topPeakY = profile.peak * signHeight;
    const topLeftY = profile.left * signHeight;
    const topRightY = profile.right * signHeight;

    // Punto hombro izquierdo
    contourPoints.push({
      x: x + signWidth * 0.15,
      y: Math.max(topLeftY - offset, 2)
    });

    // Punto pico de los dedos
    contourPoints.push({
      x: x + signWidth * profile.peakX,
      y: Math.max(topPeakY - offset, 2)
    });

    // Punto hombro derecho
    contourPoints.push({
      x: x + signWidth * 0.85,
      y: Math.max(topRightY - offset, 2)
    });

    // Valle entre señas (si no es la última)
    if (idx < signPositions.length - 1) {
      const nextLetter = signPositions[idx + 1].letter;
      const nextProfile = SIGN_TOP_PROFILES[nextLetter] || { left: 0.35, peak: 0.15, right: 0.35, peakX: 0.5 };
      const valleyY = Math.max(topRightY, nextProfile.left * signHeight) - offset * 0.6;
      contourPoints.push({
        x: x + signWidth + spacing / 2,
        y: Math.max(valleyY, 6)
      });
    }
  });

  // Extremo derecho (redondeo de la última seña)
  const rightEndX = lastSign.x + signWidth + offset;
  contourPoints.push({ x: rightEndX, y: centerY - 6 });
  contourPoints.push({ x: rightEndX + offset * 0.3, y: centerY });
  contourPoints.push({ x: rightEndX, y: centerY + 6 });

  // Parte inferior: base suave y corrida bajo las muñecas
  const bottomY = wristBaseY + offset * 0.5;

  // Recorremos de derecha a izquierda por abajo
  for (let i = signPositions.length - 1; i >= 0; i--) {
    const sp = signPositions[i];
    contourPoints.push({
      x: sp.x + signWidth * 0.5,
      y: bottomY
    });
  }

  // Cierre hacia la orejeta izquierda inferior
  contourPoints.push({ x: tabWidth * 0.7, y: centerY + 10 });
  contourPoints.push({ x: offset + 2.5, y: centerY + 7 });

  // Generamos el path suavizado continuo
  const outerCutPathD = pointsToSmoothClosedPath(contourPoints);

  // 3. Capa de Grabado: Líneas interiores de articulaciones y siluetas
  const innerEngraveSvgParts: string[] = [];
  signPositions.forEach(({ x, sign }) => {
    const scale = signWidth / sign.width;

    // Silueta de la mano marcada suavemente en azul
    innerEngraveSvgParts.push(
      `<path d="${sign.outerPath}" transform="translate(${x.toFixed(2)}, ${offset}) scale(${scale.toFixed(4)})" 
             fill="none" stroke="${config.engraveStrokeColor}" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round" />`
    );

    // Trazos interiores de los dedos y pliegues
    sign.innerPaths.forEach((pathD) => {
      innerEngraveSvgParts.push(
        `<path d="${pathD}" transform="translate(${x.toFixed(2)}, ${offset}) scale(${scale.toFixed(4)})" 
               fill="none" stroke="${config.engraveStrokeColor}" stroke-width="0.25" stroke-linecap="round" stroke-linejoin="round" />`
      );
    });
  });

  // 4. Texto latino opcional grabado bajo las señas
  const textEngraveParts: string[] = [];
  if (config.includeTextEngraving) {
    signPositions.forEach(({ x, letter }) => {
      const centerX = x + signWidth / 2;
      const textY = wristBaseY + offset * 0.1;
      textEngraveParts.push(
        `<text x="${centerX.toFixed(2)}" y="${textY.toFixed(2)}" 
               font-family="'Montserrat', 'Arial', sans-serif" font-size="4.2" 
               font-weight="bold" text-anchor="middle" fill="${config.engraveFillColor}">${letter}</text>`
      );
    });
  }

  if (config.includeBranding) {
    const brandX = totalWidth - offset;
    const brandY = wristBaseY + offset * 0.1;
    textEngraveParts.push(
      `<text x="${brandX.toFixed(2)}" y="${brandY.toFixed(2)}" 
             font-family="'Montserrat', 'Arial', sans-serif" font-size="2.8" 
             font-weight="bold" text-anchor="end" fill="${config.engraveFillColor}">UTALCA</text>`
    );
  }

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${totalWidth.toFixed(2)}mm" 
     height="${totalHeight.toFixed(2)}mm" 
     viewBox="0 0 ${totalWidth.toFixed(2)} ${totalHeight.toFixed(2)}">
  <defs>
    <desc>Llavero Contorno Desfasado - Alfabeto Manual Chileno - MakerBox UTalca</desc>
  </defs>

  <!-- CAPA 3: GRABADO RASTER (Negro) -->
  <g id="capa-grabado-raster">
    ${textEngraveParts.join('\n    ')}
  </g>

  <!-- CAPA 2: MARCADO VECTORIAL (Azul) -->
  <g id="capa-marcado-vectorial">
    ${innerEngraveSvgParts.join('\n    ')}
  </g>

  <!-- CAPA 1: CORTE EXTERIOR ORGÁNICO Y ORIFICIO (Rojo) -->
  <g id="capa-corte-exterior">
    <path d="${outerCutPathD}" fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2" id="keychain-organic-contour" />
    ${holeSvg}
  </g>
</svg>`;

  return {
    svgString: svgContent,
    widthMm: Number(totalWidth.toFixed(2)),
    heightMm: Number(totalHeight.toFixed(2)),
    signCount: signs.length,
    estimatedCutLengthMm: Number((totalWidth * 2 + totalHeight * 2).toFixed(1))
  };
}

/**
 * MODO 2: Llavero / Placa Base Continua
 */
function generateKeychainMode(
  signs: SignDefinition[],
  letters: string[],
  config: LaserConfig,
  signWidth: number,
  signHeight: number,
  spacing: number
): GeneratedLaserSvg {
  const baseBarHeight = config.baseBarHeightMm;
  const holePadding = config.addKeychainHole ? 14 : 4;
  const signsWidthTotal = signs.length * signWidth + (signs.length - 1) * spacing;
  const brandingWidth = config.includeBranding ? 32 : 0;
  const totalWidth = holePadding + signsWidthTotal + brandingWidth + 6;
  const totalHeight = signHeight + baseBarHeight;
  const barY = signHeight;

  const signPositions: { x: number; sign: SignDefinition; letter: string }[] = [];
  let currentX = holePadding;
  signs.forEach((sign, idx) => {
    signPositions.push({ x: currentX, sign, letter: letters[idx] });
    currentX += signWidth + spacing;
  });

  let holeSvg = '';
  if (config.addKeychainHole) {
    const holeRadius = config.holeDiameterMm / 2;
    const holeCenterX = 7;
    const holeCenterY = barY + baseBarHeight / 2;
    holeSvg = `
      <circle cx="${holeCenterX.toFixed(2)}" cy="${holeCenterY.toFixed(2)}" r="${holeRadius.toFixed(2)}" 
              fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2" id="keychain-hole" />
    `;
  }

  const innerEngraveSvgParts: string[] = [];
  signPositions.forEach(({ x, sign }) => {
    const scale = signWidth / sign.width;
    sign.innerPaths.forEach((pathD) => {
      innerEngraveSvgParts.push(
        `<path d="${pathD}" transform="translate(${x.toFixed(2)}, 0) scale(${scale.toFixed(4)})" 
               fill="none" stroke="${config.engraveStrokeColor}" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round" />`
      );
    });
  });

  const textEngraveParts: string[] = [];
  if (config.includeTextEngraving) {
    signPositions.forEach(({ x, letter }) => {
      const centerX = x + signWidth / 2;
      const textY = barY + baseBarHeight * 0.72;
      textEngraveParts.push(
        `<text x="${centerX.toFixed(2)}" y="${textY.toFixed(2)}" 
               font-family="'Montserrat', 'Arial', sans-serif" font-size="${(baseBarHeight * 0.55).toFixed(1)}" 
               font-weight="bold" text-anchor="middle" fill="${config.engraveFillColor}">${letter}</text>`
      );
    });
  }

  if (config.includeBranding) {
    const brandX = totalWidth - 4;
    const brandY = barY + baseBarHeight * 0.68;
    textEngraveParts.push(
      `<text x="${brandX.toFixed(2)}" y="${brandY.toFixed(2)}" 
             font-family="'Montserrat', 'Arial', sans-serif" font-size="${(baseBarHeight * 0.38).toFixed(1)}" 
             font-weight="bold" text-anchor="end" fill="${config.engraveFillColor}">MAKERBOX · UTALCA</text>`
    );
  }

  const handsOuterCutParts: string[] = [];
  signPositions.forEach(({ x, sign }) => {
    const scale = signWidth / sign.width;
    handsOuterCutParts.push(
      `<path d="${sign.outerPath}" transform="translate(${x.toFixed(2)}, 0) scale(${scale.toFixed(4)})" 
             fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2" />`
    );
  });

  const baseBarCut = `<rect x="0" y="${barY.toFixed(2)}" width="${totalWidth.toFixed(2)}" height="${baseBarHeight.toFixed(2)}" 
        rx="3" ry="3" fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2" id="base-bar-cut" />`;

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${totalWidth.toFixed(2)}mm" 
     height="${totalHeight.toFixed(2)}mm" 
     viewBox="0 0 ${totalWidth.toFixed(2)} ${totalHeight.toFixed(2)}">
  <desc>Llavero Barra - MakerBox UTalca</desc>
  <g id="capa-grabado-raster">
    ${textEngraveParts.join('\n    ')}
  </g>
  <g id="capa-marcado-vectorial">
    ${innerEngraveSvgParts.join('\n    ')}
  </g>
  <g id="capa-corte-exterior">
    ${baseBarCut}
    ${handsOuterCutParts.join('\n    ')}
    ${holeSvg}
  </g>
</svg>`;

  const estimatedCutLength = totalWidth * 2 + totalHeight * 2 + signs.length * (signWidth * 2 + signHeight * 2);

  return {
    svgString: svgContent,
    widthMm: Number(totalWidth.toFixed(2)),
    heightMm: Number(totalHeight.toFixed(2)),
    signCount: signs.length,
    estimatedCutLengthMm: Number(estimatedCutLength.toFixed(1))
  };
}

/**
 * MODO 3: Silueta Unificada
 */
function generateSilhouetteMode(
  signs: SignDefinition[],
  letters: string[],
  config: LaserConfig,
  signWidth: number,
  signHeight: number
): GeneratedLaserSvg {
  const overlap = signWidth * 0.18;
  const step = signWidth - overlap;
  const padding = 4;
  const totalWidth = padding * 2 + signWidth + (signs.length - 1) * step;
  const totalHeight = signHeight + padding * 2;

  const signPositions: { x: number; sign: SignDefinition; letter: string }[] = [];
  let currentX = padding;
  signs.forEach((sign, idx) => {
    signPositions.push({ x: currentX, sign, letter: letters[idx] });
    currentX += step;
  });

  const innerEngraveSvgParts: string[] = [];
  const handsOuterCutParts: string[] = [];

  signPositions.forEach(({ x, sign }) => {
    const scale = signWidth / sign.width;
    sign.innerPaths.forEach((pathD) => {
      innerEngraveSvgParts.push(
        `<path d="${pathD}" transform="translate(${x.toFixed(2)}, ${padding}) scale(${scale.toFixed(4)})" 
               fill="none" stroke="${config.engraveStrokeColor}" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round" />`
      );
    });
    handsOuterCutParts.push(
      `<path d="${sign.outerPath}" transform="translate(${x.toFixed(2)}, ${padding}) scale(${scale.toFixed(4)})" 
             fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2" />`
    );
  });

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${totalWidth.toFixed(2)}mm" 
     height="${totalHeight.toFixed(2)}mm" 
     viewBox="0 0 ${totalWidth.toFixed(2)} ${totalHeight.toFixed(2)}">
  <desc>Silueta Unificada - MakerBox UTalca</desc>
  <g id="capa-marcado-vectorial">
    ${innerEngraveSvgParts.join('\n    ')}
  </g>
  <g id="capa-corte-exterior">
    ${handsOuterCutParts.join('\n    ')}
  </g>
</svg>`;

  return {
    svgString: svgContent,
    widthMm: Number(totalWidth.toFixed(2)),
    heightMm: Number(totalHeight.toFixed(2)),
    signCount: signs.length,
    estimatedCutLengthMm: Number((totalWidth * 2 + totalHeight * 2).toFixed(1))
  };
}

/**
 * MODO 4: Placa de Exposición / Souvenir
 */
function generatePlaqueMode(
  signs: SignDefinition[],
  letters: string[],
  config: LaserConfig,
  signWidth: number,
  signHeight: number,
  spacing: number
): GeneratedLaserSvg {
  const signsWidthTotal = signs.length * signWidth + (signs.length - 1) * spacing;
  const paddingX = 10;
  const headerHeight = 16;
  const footerHeight = 12;
  const totalWidth = Math.max(signsWidthTotal + paddingX * 2, 90);
  const totalHeight = headerHeight + signHeight + footerHeight + 10;

  const startSignsX = (totalWidth - signsWidthTotal) / 2;
  const startSignsY = headerHeight + 4;

  const signPositions: { x: number; sign: SignDefinition; letter: string }[] = [];
  let currentX = startSignsX;
  signs.forEach((sign, idx) => {
    signPositions.push({ x: currentX, sign, letter: letters[idx] });
    currentX += signWidth + spacing;
  });

  const innerEngraveSvgParts: string[] = [];
  signPositions.forEach(({ x, sign, letter }) => {
    const scale = signWidth / sign.width;
    sign.innerPaths.forEach((pathD) => {
      innerEngraveSvgParts.push(
        `<path d="${pathD}" transform="translate(${x.toFixed(2)}, ${startSignsY.toFixed(2)}) scale(${scale.toFixed(4)})" 
               fill="none" stroke="${config.engraveStrokeColor}" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round" />`
      );
    });
    innerEngraveSvgParts.push(
      `<path d="${sign.outerPath}" transform="translate(${x.toFixed(2)}, ${startSignsY.toFixed(2)}) scale(${scale.toFixed(4)})" 
             fill="none" stroke="${config.engraveStrokeColor}" stroke-width="0.35" />`
    );
    innerEngraveSvgParts.push(
      `<text x="${(x + signWidth / 2).toFixed(2)}" y="${(startSignsY + signHeight + 6).toFixed(2)}" 
             font-family="'Montserrat', 'Arial', sans-serif" font-size="6" 
             font-weight="bold" text-anchor="middle" fill="${config.engraveFillColor}">${letter}</text>`
    );
  });

  const headerBranding = `
    <text x="${(totalWidth / 2).toFixed(2)}" y="7" 
          font-family="'Montserrat', 'Arial', sans-serif" font-size="4.2" 
          font-weight="bold" text-anchor="middle" fill="${config.engraveFillColor}">MAKERBOX · INGENIERÍA UTALCA</text>
    <text x="${(totalWidth / 2).toFixed(2)}" y="12" 
          font-family="'Montserrat', 'Arial', sans-serif" font-size="3" 
          text-anchor="middle" fill="${config.engraveFillColor}">Día de las Personas Sordas y de la Lengua de Señas</text>
    <line x1="${paddingX}" y1="14" x2="${totalWidth - paddingX}" y2="14" stroke="${config.engraveStrokeColor}" stroke-width="0.2" />
  `;

  const footerBranding = `
    <line x1="${paddingX}" y1="${(totalHeight - 8).toFixed(2)}" x2="${totalWidth - paddingX}" y2="${(totalHeight - 8).toFixed(2)}" stroke="${config.engraveStrokeColor}" stroke-width="0.2" />
    <text x="${(totalWidth / 2).toFixed(2)}" y="${(totalHeight - 4).toFixed(2)}" 
          font-family="'Montserrat', 'Arial', sans-serif" font-size="2.6" 
          text-anchor="middle" fill="${config.engraveFillColor}">Stand Demostrativo de Impresión 3D y Corte Láser</text>
  `;

  const outerCut = `<rect x="0" y="0" width="${totalWidth.toFixed(2)}" height="${totalHeight.toFixed(2)}" 
        rx="5" ry="5" fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2" id="plaque-outer-cut" />`;

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${totalWidth.toFixed(2)}mm" 
     height="${totalHeight.toFixed(2)}mm" 
     viewBox="0 0 ${totalWidth.toFixed(2)} ${totalHeight.toFixed(2)}">
  <desc>Placa Conmemorativa - Makerbox UTalca</desc>
  <g id="capa-grabado-raster">
    ${headerBranding}
    ${footerBranding}
  </g>
  <g id="capa-marcado-vectorial">
    ${innerEngraveSvgParts.join('\n    ')}
  </g>
  <g id="capa-corte-exterior">
    ${outerCut}
  </g>
</svg>`;

  return {
    svgString: svgContent,
    widthMm: Number(totalWidth.toFixed(2)),
    heightMm: Number(totalHeight.toFixed(2)),
    signCount: signs.length,
    estimatedCutLengthMm: Number((totalWidth * 2 + totalHeight * 2).toFixed(1))
  };
}
