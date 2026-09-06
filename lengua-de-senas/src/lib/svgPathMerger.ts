import { GeneratedLaserSvg, LaserConfig, SignDefinition } from '@/types';
import { SIGNS_DICTIONARY, normalizeText } from './signsData';
import { CHILEAN_LETTER_ASSETS } from './chileanImagesData';

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
 */
export function generateLaserSvg(text: string, config: LaserConfig): GeneratedLaserSvg {
  const letters = normalizeText(text);

  if (letters.length === 0) {
    return {
      svgString: `<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="40mm" viewBox="0 0 100 40">
        <rect width="100" height="40" rx="20" ry="20" fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2"/>
        <circle cx="15" cy="20" r="2.2" fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2"/>
        <text x="55" y="22" font-family="Arial, sans-serif" font-size="5" text-anchor="middle" fill="#666">Escribe una palabra para generar el llavero</text>
      </svg>`,
      widthMm: 100,
      heightMm: 40,
      signCount: 0,
      estimatedCutLengthMm: 280
    };
  }

  const signHeightMm = config.targetHeightMm || 38;
  const signSpacingMm = config.signSpacingMm || 3;

  // Modo exclusivo: Llavero Ranura CAD
  return generateCapsuleMode(letters, config, signHeightMm, signSpacingMm);
}

/**
 * MODO 1: Llavero Ranura / Cápsula (Modelo CAD Oficial del Usuario)
 * Idéntico al modelo CAD mostrado en las imágenes:
 * - Silueta exterior tipo cápsula (stadium) perfectamente redondeada en ambos extremos.
 * - Orificio de corte para argolla a la izquierda.
 * - Grabado de las ilustraciones reales recortadas del Alfabeto Manual Chileno oficial.
 * - Imposible que se traslape con los dedos; corte rápido, limpio y resistente.
 */
function generateCapsuleMode(
  letters: string[],
  config: LaserConfig,
  signHeightMm: number,
  spacingMm: number
): GeneratedLaserSvg {
  // Altura total del llavero
  const totalHeight = Math.max(signHeightMm + 10, 36);
  const endRadius = totalHeight / 2; // radio de las semicircunferencias izquierda y derecha

  // Dimensiones de cada seña ilustrada
  const handHeight = signHeightMm * 0.76;
  const handMarginY = (totalHeight - handHeight) / 2;

  // Ubicación del orificio para la argolla (en el centro del radio izquierdo)
  const holeRadius = (config.holeDiameterMm || 4.5) / 2;
  const holeCenterX = Math.max(endRadius * 0.55, 9);
  const holeCenterY = totalHeight / 2;

  // Inicio de las señas dejando espacio seguro después del orificio
  const startSignsX = holeCenterX + holeRadius + 7;

  // Calculamos la posición y tamaño exacto de cada mano usando los assets oficiales
  const handElements: { x: number; y: number; width: number; height: number; letter: string; dataUrl: string }[] = [];
  let currentX = startSignsX;

  letters.forEach((char) => {
    const asset = CHILEAN_LETTER_ASSETS[char];
    if (!asset) return;

    const handWidth = handHeight * asset.aspectRatio;
    handElements.push({
      x: currentX,
      y: handMarginY,
      width: handWidth,
      height: handHeight,
      letter: char,
      dataUrl: asset.dataUrl
    });

    currentX += handWidth + spacingMm;
  });

  // Ancho total ajustado para que el radio derecho envuelva armoniosamente la última seña
  const lastHand = handElements[handElements.length - 1];
  const lastHandRight = lastHand ? lastHand.x + lastHand.width : startSignsX + 30;
  const totalWidth = lastHandRight + endRadius * 0.65;

  // 1. Capa de CORTE (Rojo #FF0000): Cápsula perfecta (Ranura) y Orificio
  // Curva de la cápsula:
  // - Semicírculo izquierdo centrado en (endRadius, endRadius)
  // - Línea superior recta de endRadius a totalWidth - endRadius
  // - Semicírculo derecho centrado en (totalWidth - endRadius, endRadius)
  // - Línea inferior recta de totalWidth - endRadius a endRadius
  const capLeftX = endRadius;
  const capRightX = Math.max(totalWidth - endRadius, capLeftX + 1);

  const capsulePathD = `
    M ${capLeftX.toFixed(2)} 0
    L ${capRightX.toFixed(2)} 0
    A ${endRadius.toFixed(2)} ${endRadius.toFixed(2)} 0 0 1 ${capRightX.toFixed(2)} ${totalHeight.toFixed(2)}
    L ${capLeftX.toFixed(2)} ${totalHeight.toFixed(2)}
    A ${endRadius.toFixed(2)} ${endRadius.toFixed(2)} 0 0 1 ${capLeftX.toFixed(2)} 0
    Z
  `.trim().replace(/\s+/g, ' ');

  const holeSvg = `
    <!-- Orificio de Corte para Argolla (Izquierda) -->
    <circle cx="${holeCenterX.toFixed(2)}" cy="${holeCenterY.toFixed(2)}" r="${holeRadius.toFixed(2)}" 
            fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2" id="keychain-hole" />
  `;

  // 2. Capa de GRABADO RASTER (Imágenes oficiales de alta definición sin fondo)
  const imageEngraveParts: string[] = handElements.map((h) => {
    return `
      <!-- Seña Oficial Chilena: Letra ${h.letter} -->
      <image href="${h.dataUrl}" 
             x="${h.x.toFixed(2)}" y="${h.y.toFixed(2)}" 
             width="${h.width.toFixed(2)}" height="${h.height.toFixed(2)}" 
             preserveAspectRatio="xMidYMid meet" />
    `;
  });

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${totalWidth.toFixed(2)}mm" 
     height="${totalHeight.toFixed(2)}mm" 
     viewBox="0 0 ${totalWidth.toFixed(2)} ${totalHeight.toFixed(2)}">
  <defs>
    <desc>Llavero Ranura CAD - Alfabeto Manual Chileno - MakerBox UTalca</desc>
  </defs>

  <!-- CAPA 2: GRABADO LÁSER (Únicamente Ilustraciones Oficiales Chilenas) -->
  <g id="capa-grabado-señas">
    ${imageEngraveParts.join('\n    ')}
  </g>

  <!-- CAPA 1: CORTE EXTERIOR (Rojo #FF0000) -->
  <g id="capa-corte-exterior">
    <path d="${capsulePathD}" fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2" id="keychain-capsule-cut" />
    ${holeSvg}
  </g>
</svg>`;

  const cutLength = (capRightX - capLeftX) * 2 + Math.PI * totalHeight + Math.PI * (holeRadius * 2);

  return {
    svgString: svgContent,
    widthMm: Number(totalWidth.toFixed(2)),
    heightMm: Number(totalHeight.toFixed(2)),
    signCount: handElements.length,
    estimatedCutLengthMm: Number(cutLength.toFixed(1))
  };
}

/**
 * MODO 2: Silueta Ondulada Suave (Garantizada sin traslapes)
 * Envolvente convexa suave que se mantiene a una distancia segura de todos los dedos.
 */
function generateSmoothOrganicMode(
  letters: string[],
  config: LaserConfig,
  signHeightMm: number,
  spacingMm: number
): GeneratedLaserSvg {
  const margin = Math.max(config.contourOffsetMm || 6, 6); // mínimo 6mm de margen para evitar traslapes
  const handHeight = signHeightMm * 0.75;
  const tabWidth = 16;
  const startSignsX = tabWidth + margin;

  const handElements: { x: number; y: number; width: number; height: number; letter: string; dataUrl: string }[] = [];
  let currentX = startSignsX;

  letters.forEach((char) => {
    const asset = CHILEAN_LETTER_ASSETS[char];
    if (!asset) return;
    const handWidth = handHeight * asset.aspectRatio;
    handElements.push({
      x: currentX,
      y: margin + 2,
      width: handWidth,
      height: handHeight,
      letter: char,
      dataUrl: asset.dataUrl
    });
    currentX += handWidth + spacingMm;
  });

  const lastHand = handElements[handElements.length - 1];
  const lastHandRight = lastHand ? lastHand.x + lastHand.width : startSignsX + 30;
  const totalWidth = lastHandRight + margin * 1.5;
  const totalHeight = handHeight + margin * 2 + 4;
  const centerY = totalHeight / 2;

  // Orificio de llavero a la izquierda
  const holeRadius = (config.holeDiameterMm || 4.5) / 2;
  const holeCenterX = margin + 4.5;
  const holeCenterY = centerY;

  // Curva ondulada suave superior e inferior envolvente
  const topY = margin * 0.4;
  const bottomY = totalHeight - margin * 0.4;

  const smoothOutlineD = `
    M ${margin.toFixed(2)} ${centerY.toFixed(2)}
    C ${margin.toFixed(2)} ${(centerY - 9).toFixed(2)}, ${(tabWidth * 0.8).toFixed(2)} ${topY.toFixed(2)}, ${(startSignsX).toFixed(2)} ${topY.toFixed(2)}
    L ${(lastHandRight).toFixed(2)} ${topY.toFixed(2)}
    C ${(totalWidth - margin * 0.3).toFixed(2)} ${topY.toFixed(2)}, ${totalWidth.toFixed(2)} ${(centerY - 6).toFixed(2)}, ${totalWidth.toFixed(2)} ${centerY.toFixed(2)}
    C ${totalWidth.toFixed(2)} ${(centerY + 6).toFixed(2)}, ${(totalWidth - margin * 0.3).toFixed(2)} ${bottomY.toFixed(2)}, ${(lastHandRight).toFixed(2)} ${bottomY.toFixed(2)}
    L ${(startSignsX).toFixed(2)} ${bottomY.toFixed(2)}
    C ${(tabWidth * 0.8).toFixed(2)} ${bottomY.toFixed(2)}, ${margin.toFixed(2)} ${(centerY + 9).toFixed(2)}, ${margin.toFixed(2)} ${centerY.toFixed(2)}
    Z
  `.trim().replace(/\s+/g, ' ');

  const imageEngraveParts = handElements.map((h) => {
    return `<image href="${h.dataUrl}" x="${h.x.toFixed(2)}" y="${h.y.toFixed(2)}" width="${h.width.toFixed(2)}" height="${h.height.toFixed(2)}" preserveAspectRatio="xMidYMid meet" />`;
  });

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${totalWidth.toFixed(2)}mm" 
     height="${totalHeight.toFixed(2)}mm" 
     viewBox="0 0 ${totalWidth.toFixed(2)} ${totalHeight.toFixed(2)}">
  <g id="capa-grabado-señas">
    ${imageEngraveParts.join('\n    ')}
  </g>
  <g id="capa-corte-exterior">
    <path d="${smoothOutlineD}" fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2" id="keychain-organic-cut" />
    <circle cx="${holeCenterX.toFixed(2)}" cy="${holeCenterY.toFixed(2)}" r="${holeRadius.toFixed(2)}" fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2" id="keychain-hole" />
  </g>
</svg>`;

  return {
    svgString: svgContent,
    widthMm: Number(totalWidth.toFixed(2)),
    heightMm: Number(totalHeight.toFixed(2)),
    signCount: handElements.length,
    estimatedCutLengthMm: Number((totalWidth * 2 + totalHeight * 2).toFixed(1))
  };
}

/**
 * MODO 3: Llavero Barra Recta
 */
function generateKeychainMode(
  signs: SignDefinition[],
  letters: string[],
  config: LaserConfig,
  signWidth: number,
  signHeight: number,
  spacing: number
): GeneratedLaserSvg {
  const baseBarHeight = config.baseBarHeightMm || 10;
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
    const holeRadius = (config.holeDiameterMm || 4.5) / 2;
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
  <g id="capa-marcado-vectorial">
    ${innerEngraveSvgParts.join('\n    ')}
  </g>
  <g id="capa-corte-exterior">
    ${baseBarCut}
    ${handsOuterCutParts.join('\n    ')}
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

  const outerCut = `<rect x="0" y="0" width="${totalWidth.toFixed(2)}" height="${totalHeight.toFixed(2)}" 
        rx="5" ry="5" fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2" id="plaque-outer-cut" />`;

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${totalWidth.toFixed(2)}mm" 
     height="${totalHeight.toFixed(2)}mm" 
     viewBox="0 0 ${totalWidth.toFixed(2)} ${totalHeight.toFixed(2)}">
  <g id="capa-grabado-raster">
    ${headerBranding}
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
