import { GeneratedLaserSvg, LaserConfig, SignDefinition } from '@/types';
import { SIGNS_DICTIONARY, normalizeText } from './signsData';
import { CHILEAN_VECTOR_SIGNS } from './chileanVectorsData';
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
export function generateLaserSvg(
  text: string,
  config: LaserConfig,
  secondaryText?: string
): GeneratedLaserSvg {
  const letters = normalizeText(text).slice(0, 10);
  const secText = secondaryText !== undefined ? secondaryText : (config.secondaryText || '');
  const letters2 = normalizeText(secText).slice(0, 10);

  // Modo Llavero Corazón Dúo (60 mm de alto, 2 nombres)
  if (config.keychainShape === 'heart' || config.mode === 'heart') {
    return generateHeartMode(letters, letters2, config);
  }

  const signHeightMm = 13.5;
  const signSpacingMm = config.signSpacingMm || 2.5;

  // Modo Llavero Ranura CAD (25 mm ancho fijo, manos vectoriales proporcionales + palabra en 3mm)
  return generateCapsuleMode(letters, config, signHeightMm, signSpacingMm);
}

/**
 * MODO 1: Llavero Ranura / Cápsula (Modelo CAD Oficial del Usuario)
 * Especificaciones de diseño:
 * - Ancho (altura vertical del perfil) fijo en 25 mm.
 * - Manos vectoriales con escala anatómica unificada (máximo 13.5 mm de alto).
 * - Debajo de las señas se graba la palabra que forman (altura de letras: 3 mm, sin símbolos de corazón).
 * - La palabra queda centrada entre la parte inferior de las señas y el borde inferior del llavero,
 *   y centrada en horizontal con el largo total que abordan las señas de manos.
 * - Orificio de argolla centrado verticalmente a 12.5 mm con pared estructural segura de >5 mm.
 */
function generateCapsuleMode(
  letters: string[],
  config: LaserConfig,
  signHeightMm: number,
  spacingMm: number
): GeneratedLaserSvg {
  // Ancho fijo del llavero: 25 mm
  const totalHeight = 25;
  const endRadius = totalHeight / 2; // 12.5 mm (radio de las semicircunferencias)

  // Ubicación del orificio para la argolla (centrado verticalmente a 12.5 mm)
  const holeRadius = (config.holeDiameterMm || 4.5) / 2;
  const holeCenterX = 7.5;
  const holeCenterY = 12.5;

  if (letters.length === 0) {
    const defaultWidth = 60;
    const pad = 1.0;
    return {
      svgString: `<svg xmlns="http://www.w3.org/2000/svg" width="${(defaultWidth + pad * 2).toFixed(2)}mm" height="${(totalHeight + pad * 2).toFixed(2)}mm" viewBox="${(-pad).toFixed(2)} ${(-pad).toFixed(2)} ${(defaultWidth + pad * 2).toFixed(2)} ${(totalHeight + pad * 2).toFixed(2)}">
        <rect width="${defaultWidth}" height="${totalHeight}" rx="${endRadius}" ry="${endRadius}" fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2"/>
        <circle cx="${holeCenterX}" cy="${holeCenterY}" r="${holeRadius}" fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2"/>
        <text x="35" y="14" font-family="'Montserrat', 'Arial', sans-serif" font-size="3.5" text-anchor="middle" dominant-baseline="central" fill="#888">Escribe una palabra</text>
      </svg>`,
      widthMm: defaultWidth,
      heightMm: totalHeight,
      signCount: 0,
      estimatedCutLengthMm: 160,
      shape: 'capsule'
    };
  }

  // Inicio de las señas dejando espacio seguro y estético después del orificio de argolla
  const startSignsX = holeCenterX + holeRadius + 4.5; // ~14.25 mm

  // Altura máxima reservada para las manos: 13.5 mm, posicionadas con margen superior de 2.8 mm
  const maxHandHeight = 13.5;
  const topMargin = 2.8;

  const handElements: {
    x: number;
    y: number;
    width: number;
    height: number;
    letter: string;
    pathD: string;
    scale: number;
  }[] = [];

  let currentX = startSignsX;

  letters.forEach((char) => {
    const sign = CHILEAN_VECTOR_SIGNS[char];
    if (!sign) return;

    // Escala del vector anatómico
    const scaleFactor = sign.widthMm / sign.vectorWidth;

    // Centrado vertical de la mano dentro de la franja superior de 13.5 mm
    const handY = topMargin + (maxHandHeight - sign.heightMm) / 2;

    handElements.push({
      x: currentX,
      y: handY,
      width: sign.widthMm,
      height: sign.heightMm,
      letter: char,
      pathD: sign.pathD,
      scale: scaleFactor
    });

    currentX += sign.widthMm + spacingMm;
  });

  // Largo total ajustado dinámicamente al largo acumulado de la palabra
  const lastHand = handElements[handElements.length - 1];
  const lastHandRight = lastHand ? lastHand.x + lastHand.width : startSignsX + 30;
  const totalWidth = lastHandRight + 7.5;

  // 1. Capa de CORTE (Rojo #FF0000): Cápsula perfecta (Ranura) y Orificio
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

  // 2. Capa de GRABADO LÁSER VECTORIAL (Curvas Bézier oficiales limpias y proporcionales)
  const vectorEngraveParts: string[] = handElements.map((h, idx) => {
    return `
      <!-- Seña Oficial Chilena: Letra ${h.letter} (${h.width.toFixed(2)} × ${h.height.toFixed(2)} mm) -->
      <g id="sign-${h.letter}-${idx}" transform="translate(${h.x.toFixed(3)}, ${h.y.toFixed(3)}) scale(${h.scale.toFixed(6)})">
        <path d="${h.pathD}" fill="${config.engraveFillColor || '#000000'}" fill-rule="evenodd" stroke="none" />
      </g>
    `;
  });

  // Palabra que forman debajo de las señas (excluyendo cualquier símbolo SYM_)
  // Altura de letra: 3 mm, centrada entre la parte inferior de las señas y el borde inferior del llavero,
  // y centrada en horizontal ÚNICAMENTE con el largo que abordan las señas de letras (no todo el llavero ni símbolos).
  const cleanWord = letters.filter(c => !c.startsWith('SYM_')).join('');
  let textEngraveSvg = '';

  const letterHands = handElements.filter(h => !h.letter.startsWith('SYM_'));

  if (cleanWord && letterHands.length > 0) {
    const lettersMinX = letterHands[0].x;
    const lastLetterHand = letterHands[letterHands.length - 1];
    const lettersMaxX = lastLetterHand.x + lastLetterHand.width;
    const wordCenterX = (lettersMinX + lettersMaxX) / 2;

    const maxHandBottom = Math.max(...handElements.map(h => h.y + h.height));
    const textCenterY = (maxHandBottom + totalHeight) / 2;

    textEngraveSvg = `
      <!-- Palabra formada por las señas grabada en láser (Altura de letra: 3 mm, centrada a las señas de letras) -->
      <text x="${wordCenterX.toFixed(2)}" y="${textCenterY.toFixed(2)}" 
            font-family="'Montserrat', 'Arial', sans-serif" 
            font-size="3.8" 
            font-weight="bold" 
            text-anchor="middle" 
            dominant-baseline="central" 
            letter-spacing="0.4" 
            fill="${config.engraveFillColor || '#000000'}">${cleanWord}</text>
    `;
  }

  // Margen de seguridad (1.0 mm) para que el trazo perimetral (stroke-width 0.2mm) nunca sea recortado por el viewBox
  const pad = 1.0;
  const vbMinX = -pad;
  const vbMinY = -pad;
  const vbWidth = totalWidth + pad * 2;
  const vbHeight = totalHeight + pad * 2;

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${vbWidth.toFixed(2)}mm" 
     height="${vbHeight.toFixed(2)}mm" 
     viewBox="${vbMinX.toFixed(2)} ${vbMinY.toFixed(2)} ${vbWidth.toFixed(2)} ${vbHeight.toFixed(2)}"
     style="overflow: visible;">
  <defs>
    <desc>Llavero Ranura CAD Vectorial - Alfabeto Manual Chileno - MakerBox UTalca</desc>
  </defs>

  <!-- CAPA 2: GRABADO LÁSER VECTORIAL (Vectores Puros en Escala Anatómica Proporcional + Palabra en Texto 3mm) -->
  <g id="capa-grabado-señas">
    ${vectorEngraveParts.join('\n    ')}
    ${textEngraveSvg}
  </g>

  <!-- CAPA 1: CORTE EXTERIOR (Rojo #FF0000) -->
  <g id="capa-corte-exterior">
    <path d="${capsulePathD}" fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2" stroke-linecap="round" stroke-linejoin="round" id="keychain-capsule-cut" />
    ${holeSvg}
  </g>
</svg>`;

  return {
    svgString: svgContent,
    widthMm: Number(totalWidth.toFixed(2)),
    heightMm: Number(totalHeight.toFixed(2)),
    signCount: letters.length,
    estimatedCutLengthMm: Number((totalWidth * 2 + totalHeight * 2).toFixed(1)),
    shape: 'capsule'
  };
}

/**
 * MODO CORAZÓN DÚO (60 mm de alto):
 * - Corte exterior: Corazón suave de 60 mm de alto x 67.6 mm de ancho con orificio para argolla en el lóbulo superior izquierdo.
 * - Nombre 1 (Arriba): Señas en Lengua de Señas Chilena + palabra en texto latino de 3 mm debajo.
 * - Centro: Corazón decorativo grabado conectando ambos nombres.
 * - Nombre 2 (Abajo): Señas en Lengua de Señas Chilena + palabra en texto latino de 3 mm debajo.
 */
function generateHeartMode(
  letters1: string[],
  letters2: string[],
  config: LaserConfig
): GeneratedLaserSvg {
  const totalHeight = 60.0;
  const totalWidth = 67.64;
  const cx = 33.82;

  // Curva matemática suave del corazón exterior (60 mm de alto, 67.64 mm de ancho)
  const heartPathD = `M 33.82 60.00 C 18.55 48.00, 0.00 34.91, 0.00 20.73 C 0.00 5.45, 14.18 0.00, 25.09 0.00 C 30.55 0.00, 33.82 5.45, 33.82 13.09 C 33.82 5.45, 37.09 0.00, 42.55 0.00 C 53.45 0.00, 67.64 5.45, 67.64 20.73 C 67.64 34.91, 49.09 48.00, 33.82 60.00 Z`;

  // Orificio de argolla en lóbulo superior izquierdo (23.5, 8.5)
  const holeRadius = (config.holeDiameterMm || 4.5) / 2;
  const holeCenterX = 23.5;
  const holeCenterY = 8.5;
  const holeSvg = `
    <!-- Orificio de Corte para Argolla (Lóbulo Superior) -->
    <circle cx="${holeCenterX.toFixed(2)}" cy="${holeCenterY.toFixed(2)}" r="${holeRadius.toFixed(2)}" 
            fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2" id="keychain-heart-hole" />
  `;

  // Función auxiliar para maquetar una fila de señas ajustada a un ancho máximo
  const layoutSignsRow = (
    rowLetters: string[],
    maxWidth: number,
    baseHeight: number,
    baseY: number
  ) => {
    if (rowLetters.length === 0) return { parts: [], textY: baseY + baseHeight + 3.0, textCenterX: cx };

    const rawSigns = rowLetters.map((char) => {
      const sign = CHILEAN_VECTOR_SIGNS[char];
      if (!sign) return null;
      const initialHeight = baseHeight;
      const initialWidth = sign.widthMm * (initialHeight / sign.heightMm);
      return { char, sign, initialWidth, initialHeight };
    }).filter(Boolean) as { char: string; sign: (typeof CHILEAN_VECTOR_SIGNS)[string]; initialWidth: number; initialHeight: number }[];

    if (rawSigns.length === 0) return { parts: [], textY: baseY + baseHeight + 3.0, textCenterX: cx };

    const initialSpacing = Math.min(config.signSpacingMm || 2.0, 2.5);
    const rawTotalWidth = rawSigns.reduce((sum, s) => sum + s.initialWidth, 0) + (rawSigns.length - 1) * initialSpacing;

    // Si excede el ancho disponible en esa franja del corazón, escalamos uniformemente
    const scaleMultiplier = rawTotalWidth > maxWidth ? maxWidth / rawTotalWidth : 1.0;
    const finalSpacing = initialSpacing * scaleMultiplier;
    const finalTotalWidth = rawTotalWidth * scaleMultiplier;

    let currX = cx - finalTotalWidth / 2;
    const parts: string[] = [];
    const placedSigns: { char: string; x: number; width: number }[] = [];

    rawSigns.forEach((item, idx) => {
      const finalW = item.initialWidth * scaleMultiplier;
      const finalH = item.initialHeight * scaleMultiplier;
      const scaleFactor = (finalH / item.sign.heightMm) * (item.sign.widthMm / item.sign.vectorWidth);
      const signY = baseY + (baseHeight - finalH) / 2;

      parts.push(`
        <g id="heart-sign-${item.char}-${idx}" transform="translate(${currX.toFixed(3)}, ${signY.toFixed(3)}) scale(${scaleFactor.toFixed(6)})">
          <path d="${item.sign.pathD}" fill="${config.engraveFillColor || '#000000'}" fill-rule="evenodd" stroke="none" />
        </g>
      `);
      placedSigns.push({ char: item.char, x: currX, width: finalW });
      currX += finalW + finalSpacing;
    });

    const textY = baseY + baseHeight + 2.5;

    // Centrado de la palabra latina únicamente con respecto a las letras (excluyendo símbolos)
    const letterPlaced = placedSigns.filter(s => !s.char.startsWith('SYM_'));
    let textCenterX = cx;
    if (letterPlaced.length > 0) {
      const minX = letterPlaced[0].x;
      const maxX = letterPlaced[letterPlaced.length - 1].x + letterPlaced[letterPlaced.length - 1].width;
      textCenterX = (minX + maxX) / 2;
    }

    return { parts, textY, textCenterX };
  };

  // Fila 1: Nombre 1 (Arriba, ancho máximo ~46 mm)
  const row1 = layoutSignsRow(letters1, 46, 10.0, 15.0);
  const cleanWord1 = letters1.filter(c => !c.startsWith('SYM_')).join('');

  // Fila 2: Nombre 2 (Abajo, ancho máximo ~35 mm)
  const row2 = layoutSignsRow(letters2, 35, 9.0, 38.0);
  const cleanWord2 = letters2.filter(c => !c.startsWith('SYM_')).join('');

  // Corazón central grabado
  const smH = 7.0;
  const smW = 8.0;
  const smCy = 32.5;
  const smallHeartD = `M ${cx} ${(smCy + smH/2).toFixed(2)}
    C ${(cx - smW*0.25).toFixed(2)} ${(smCy + smH*0.3).toFixed(2)}, ${(cx - smW*0.5).toFixed(2)} ${(smCy + smH*0.1).toFixed(2)}, ${(cx - smW*0.5).toFixed(2)} ${(smCy - smH*0.15).toFixed(2)}
    C ${(cx - smW*0.5).toFixed(2)} ${(smCy - smH*0.45).toFixed(2)}, ${(cx - smW*0.15).toFixed(2)} ${(smCy - smH*0.5).toFixed(2)}, ${cx} ${(smCy - smH*0.2).toFixed(2)}
    C ${(cx + smW*0.15).toFixed(2)} ${(smCy - smH*0.5).toFixed(2)}, ${(cx + smW*0.5).toFixed(2)} ${(smCy - smH*0.45).toFixed(2)}, ${(cx + smW*0.5).toFixed(2)} ${(smCy - smH*0.15).toFixed(2)}
    C ${(cx + smW*0.5).toFixed(2)} ${(smCy + smH*0.1).toFixed(2)}, ${(cx + smW*0.25).toFixed(2)} ${(smCy + smH*0.3).toFixed(2)}, ${cx} ${(smCy + smH/2).toFixed(2)} Z`.replace(/\s+/g, ' ');

  const pad = 1.0;
  const vbMinX = -pad;
  const vbMinY = -pad;
  const vbWidth = totalWidth + pad * 2;
  const vbHeight = totalHeight + pad * 2;

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${vbWidth.toFixed(2)}mm" 
     height="${vbHeight.toFixed(2)}mm" 
     viewBox="${vbMinX.toFixed(2)} ${vbMinY.toFixed(2)} ${vbWidth.toFixed(2)} ${vbHeight.toFixed(2)}"
     style="overflow: visible;">
  <defs>
    <desc>Llavero Corazón Dúo - Alfabeto Manual Chileno - MakerBox UTalca</desc>
  </defs>

  <!-- CAPA 2: GRABADO LÁSER (Señas de Manos, Corazón Central y Nombres en 3mm) -->
  <g id="capa-grabado-corazon">
    <!-- Señas Nombre 1 (Arriba) -->
    ${row1.parts.join('\n    ')}

    <!-- Nombre 1 escrito en texto legible (Altura de letra: 3 mm) -->
    ${cleanWord1 ? `
    <text x="${row1.textCenterX.toFixed(2)}" y="${row1.textY.toFixed(2)}" 
          font-family="'Montserrat', 'Arial', sans-serif" 
          font-size="3.8" 
          font-weight="bold" 
          text-anchor="middle" 
          dominant-baseline="central" 
          letter-spacing="0.4" 
          fill="${config.engraveFillColor || '#000000'}">${cleanWord1}</text>
    ` : (letters1.length === 0 ? `<text x="${cx.toFixed(2)}" y="25" font-family="'Montserrat', 'Arial', sans-serif" font-size="3" text-anchor="middle" fill="#999">Nombre 1</text>` : '')}

    <!-- Corazón decorativo de unión central -->
    <path d="${smallHeartD}" fill="${config.engraveFillColor || '#000000'}" stroke="none" id="heart-connector" />

    <!-- Señas Nombre 2 (Abajo) -->
    ${row2.parts.join('\n    ')}

    <!-- Nombre 2 escrito en texto legible (Altura de letra: 3 mm) -->
    ${cleanWord2 ? `
    <text x="${row2.textCenterX.toFixed(2)}" y="${row2.textY.toFixed(2)}" 
          font-family="'Montserrat', 'Arial', sans-serif" 
          font-size="3.8" 
          font-weight="bold" 
          text-anchor="middle" 
          dominant-baseline="central" 
          letter-spacing="0.4" 
          fill="${config.engraveFillColor || '#000000'}">${cleanWord2}</text>
    ` : (letters2.length === 0 ? `<text x="${cx.toFixed(2)}" y="48" font-family="'Montserrat', 'Arial', sans-serif" font-size="3" text-anchor="middle" fill="#999">Nombre 2</text>` : '')}
  </g>

  <!-- CAPA 1: CORTE EXTERIOR (Rojo #FF0000) -->
  <g id="capa-corte-exterior">
    <path d="${heartPathD}" fill="none" stroke="${config.cutStrokeColor}" stroke-width="0.2" stroke-linecap="round" stroke-linejoin="round" id="keychain-heart-cut" />
    ${holeSvg}
  </g>
</svg>`;

  return {
    svgString: svgContent,
    widthMm: Number(totalWidth.toFixed(2)),
    heightMm: Number(totalHeight.toFixed(2)),
    signCount: letters1.length + letters2.length,
    estimatedCutLengthMm: Number((totalWidth * 2.2 + totalHeight * 1.8).toFixed(1)),
    shape: 'heart'
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
          text-anchor="middle" fill="${config.engraveFillColor}">Festival de Ciencia y Tecnología 2026</text>
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
