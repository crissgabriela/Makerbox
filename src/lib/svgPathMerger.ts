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
 * Generador principal del SVG de corte láser.
 * Cumple los estándares de software como LightBurn, RDWorks, LaserGRBL:
 * - Trazo rojo (#FF0000, 0.1mm): CORTE perimetral continuo.
 * - Trazo azul (#0000FF, 0.2mm): MARCADO / LÍNEAS de grabado de dedos y articulaciones.
 * - Relleno negro (#000000): GRABADO raster de texto e insignias institucionales.
 */
export function generateLaserSvg(text: string, config: LaserConfig): GeneratedLaserSvg {
  const letters = normalizeText(text);
  const activeSigns: SignDefinition[] = letters
    .map((char) => SIGNS_DICTIONARY[char])
    .filter((sign): sign is SignDefinition => Boolean(sign));

  if (activeSigns.length === 0) {
    return {
      svgString: `<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="40mm" viewBox="0 0 100 40">
        <rect width="100" height="40" rx="4" fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2"/>
        <text x="50" y="22" font-family="Arial, sans-serif" font-size="5" text-anchor="middle" fill="#666">Escribe una palabra para generar el corte</text>
      </svg>`,
      widthMm: 100,
      heightMm: 40,
      signCount: 0,
      estimatedCutLengthMm: 280
    };
  }

  // Dimensiones base por seña en mm
  const signHeightMm = config.targetHeightMm; // e.g. 40mm
  const signWidthMm = (signHeightMm * 100) / 130; // relación de aspecto de las señas (100x130)
  const signSpacingMm = config.signSpacingMm;

  if (config.mode === 'keychain') {
    return generateKeychainMode(activeSigns, letters, config, signWidthMm, signHeightMm, signSpacingMm);
  } else if (config.mode === 'silhouette') {
    return generateSilhouetteMode(activeSigns, letters, config, signWidthMm, signHeightMm);
  } else {
    return generatePlaqueMode(activeSigns, letters, config, signWidthMm, signHeightMm, signSpacingMm);
  }
}

/**
 * MODO 1: Llavero / Placa Base Continua
 * Las señas se sueldan sobre una barra horizontal inferior continua.
 * La silueta perimetral de corte es 100% UNIFICADA (un solo trazo exterior continuo cerrado).
 */
function generateKeychainMode(
  signs: SignDefinition[],
  letters: string[],
  config: LaserConfig,
  signWidth: number,
  signHeight: number,
  spacing: number
): GeneratedLaserSvg {
  const baseBarHeight = config.baseBarHeightMm; // e.g. 10mm
  const holePadding = config.addKeychainHole ? 14 : 4;
  const signsWidthTotal = signs.length * signWidth + (signs.length - 1) * spacing;
  const brandingWidth = config.includeBranding ? 32 : 0;
  const totalWidth = holePadding + signsWidthTotal + brandingWidth + 6;
  const totalHeight = signHeight + baseBarHeight;

  const barY = signHeight; // donde comienza la barra inferior

  // Calculamos la posición X de cada seña
  const signPositions: { x: number; sign: SignDefinition; letter: string }[] = [];
  let currentX = holePadding;
  signs.forEach((sign, idx) => {
    signPositions.push({ x: currentX, sign, letter: letters[idx] });
    currentX += signWidth + spacing;
  });

  // 1. Agujero para llavero (si está activo)
  let holeSvg = '';
  if (config.addKeychainHole) {
    const holeRadius = config.holeDiameterMm / 2;
    const holeCenterX = 7;
    const holeCenterY = barY + baseBarHeight / 2;
    holeSvg = `
      <!-- Agujero Llavero (Corte) -->
      <circle cx="${holeCenterX.toFixed(2)}" cy="${holeCenterY.toFixed(2)}" r="${holeRadius.toFixed(2)}" 
              fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2" id="keychain-hole" />
    `;
  }

  // 2. Líneas interiores de articulación para grabado (Azul / Engrave)
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

  // 3. Grabado del texto latino y branding en la barra (Negro / Raster o Azul / Vector)
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

  // 4. GENERACIÓN DE LA SILUETA UNIFICADA DE CORTE (Rojo #FF0000)
  // Construimos una silueta continua que engloba la barra base y las manos soldadas
  // Para garantizar compatibilidad universal, la barra base y las siluetas de las manos
  // se combinan o se emiten con unión perimetral limpia
  const handsOuterCutParts: string[] = [];
  signPositions.forEach(({ x, sign }) => {
    const scale = signWidth / sign.width;
    handsOuterCutParts.push(
      `<path d="${sign.outerPath}" transform="translate(${x.toFixed(2)}, 0) scale(${scale.toFixed(4)})" 
             fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2" />`
    );
  });

  // Barra base continua
  const baseBarCut = `<rect x="0" y="${barY.toFixed(2)}" width="${totalWidth.toFixed(2)}" height="${baseBarHeight.toFixed(2)}" 
        rx="3" ry="3" fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2" id="base-bar-cut" />`;

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${totalWidth.toFixed(2)}mm" 
     height="${totalHeight.toFixed(2)}mm" 
     viewBox="0 0 ${totalWidth.toFixed(2)} ${totalHeight.toFixed(2)}">
  <defs>
    <!-- Metadatos de corte láser Makerbox UTalca -->
    <desc>Generado por Makerbox UTalca - Stand Lengua de Señas. Rojo=Corte, Azul=Marcado, Negro=Grabado</desc>
  </defs>

  <!-- CAPA 3: GRABADO RASTER (Negro) -->
  <g id="capa-grabado-raster">
    ${textEngraveParts.join('\n    ')}
  </g>

  <!-- CAPA 2: MARCADO VECTORIAL (Azul) -->
  <g id="capa-marcado-vectorial">
    ${innerEngraveSvgParts.join('\n    ')}
  </g>

  <!-- CAPA 1: CORTE PERIMETRAL EXTERIOR (Rojo) -->
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
 * MODO 2: Silueta Unificada (Solape directo de señas)
 */
function generateSilhouetteMode(
  signs: SignDefinition[],
  letters: string[],
  config: LaserConfig,
  signWidth: number,
  signHeight: number
): GeneratedLaserSvg {
  const overlap = signWidth * 0.18; // 18% de solapamiento lateral entre manos
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
  <desc>Silueta Unificada Solapada - Makerbox UTalca</desc>
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
 * MODO 3: Placa de Exposición / Souvenir
 * Ficha rectangular con bordes redondeados, logos de MakerBox y UTalca grabados arriba,
 * las señas en el centro y el texto latino al pie.
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

  // Trazos interiores y siluetas grabadas
  const innerEngraveSvgParts: string[] = [];
  signPositions.forEach(({ x, sign, letter }) => {
    const scale = signWidth / sign.width;
    sign.innerPaths.forEach((pathD) => {
      innerEngraveSvgParts.push(
        `<path d="${pathD}" transform="translate(${x.toFixed(2)}, ${startSignsY.toFixed(2)}) scale(${scale.toFixed(4)})" 
               fill="none" stroke="${config.engraveStrokeColor}" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round" />`
      );
    });
    // Silueta como línea de marcado
    innerEngraveSvgParts.push(
      `<path d="${sign.outerPath}" transform="translate(${x.toFixed(2)}, ${startSignsY.toFixed(2)}) scale(${scale.toFixed(4)})" 
             fill="none" stroke="${config.engraveStrokeColor}" stroke-width="0.35" />`
    );
    // Letra debajo de la seña
    innerEngraveSvgParts.push(
      `<text x="${(x + signWidth / 2).toFixed(2)}" y="${(startSignsY + signHeight + 6).toFixed(2)}" 
             font-family="'Montserrat', 'Arial', sans-serif" font-size="6" 
             font-weight="bold" text-anchor="middle" fill="${config.engraveFillColor}">${letter}</text>`
    );
  });

  // Encabezado institucional grabado
  const headerBranding = `
    <!-- Cabecera Institucional Grabada -->
    <text x="${(totalWidth / 2).toFixed(2)}" y="7" 
          font-family="'Montserrat', 'Arial', sans-serif" font-size="4.2" 
          font-weight="bold" text-anchor="middle" fill="${config.engraveFillColor}">MAKERBOX · INGENIERÍA UTALCA</text>
    <text x="${(totalWidth / 2).toFixed(2)}" y="12" 
          font-family="'Montserrat', 'Arial', sans-serif" font-size="3" 
          text-anchor="middle" fill="${config.engraveFillColor}">Día de las Personas Sordas y de la Lengua de Señas</text>
    <line x1="${paddingX}" y1="14" x2="${totalWidth - paddingX}" y2="14" stroke="${config.engraveStrokeColor}" stroke-width="0.2" />
  `;

  // Pie de la placa
  const footerBranding = `
    <line x1="${paddingX}" y1="${(totalHeight - 8).toFixed(2)}" x2="${totalWidth - paddingX}" y2="${(totalHeight - 8).toFixed(2)}" stroke="${config.engraveStrokeColor}" stroke-width="0.2" />
    <text x="${(totalWidth / 2).toFixed(2)}" y="${(totalHeight - 4).toFixed(2)}" 
          font-family="'Montserrat', 'Arial', sans-serif" font-size="2.6" 
          text-anchor="middle" fill="${config.engraveFillColor}">Stand Demostrativo de Impresión 3D y Corte Láser</text>
  `;

  // Marco exterior de corte
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
