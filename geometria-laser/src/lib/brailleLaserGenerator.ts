import { translateTextToBraille, BrailleCell } from './brailleData';
import { renderVectorText } from './vectorFont';
import {
  buildLaserSvgDocument,
  estimateFalconJobMinutes,
  LASER_COLORS,
} from './falconLaserSpec';

export type BrailleLaserShape = 'capsule' | 'rounded_rect';

export interface BrailleLaserConfig {
  text: string;
  shape: BrailleLaserShape;
  plateHeightMm: number;      // Alto del llavero (por defecto 22 mm, rango 18..32 mm)
  dotDiameterMm: number;      // Diámetro de grabado de cada punto Braille (por defecto 1.5 mm)
  dotSpacingMm: number;       // Paso interno entre puntos (estándar Marburg: 2.5 mm)
  cellSpacingMm: number;      // Paso centro a centro entre celdas (estándar Marburg: 6.0 mm)
  addKeychainHole: boolean;
  holeDiameterMm: number;     // Por defecto 4.5 mm
  includeText: boolean;       // Grabar palabra en letras vectoriales sobre el Braille
  includeNumberPrefix: boolean;
  showCellGuides: boolean;    // Marcar en azul (#0000FF) puntos inactivos y línea divisoria didáctica
}

export const DEFAULT_BRAILLE_LASER_CONFIG: BrailleLaserConfig = {
  text: 'MAIPÚ',
  shape: 'capsule',
  plateHeightMm: 22.0,
  dotDiameterMm: 1.5,
  dotSpacingMm: 2.5,
  cellSpacingMm: 6.0,
  addKeychainHole: true,
  holeDiameterMm: 4.5,
  includeText: true,
  includeNumberPrefix: true,
  showCellGuides: true,
};

export interface BrailleLaserResult {
  svgContent: string;
  widthMm: number;
  heightMm: number;
  bodyWidthMm: number;
  bodyHeightMm: number;
  estimatedMinutes: number;
  cells: BrailleCell[];
  activeDotCount: number;
  filename: string;
}

/**
 * Genera el plano vectorial .SVG 1:1 en milímetros para cortar en MDF 3 mm
 * y grabar en alto contraste táctil un llavero de Nombre + Braille Español
 * optimizado para Creality CR-Laser Falcon 2 10W.
 */
export function generateBrailleLaserSvg(config: BrailleLaserConfig): BrailleLaserResult {
  const rawText = (config.text || '').trim().slice(0, 16);
  const effectiveText = rawText || 'MAIPÚ';
  const cells = translateTextToBraille(effectiveText, config.includeNumberPrefix);

  const bodyH = Math.max(18, Math.min(34, config.plateHeightMm));
  const dotRadius = Math.max(0.5, Math.min(1.1, config.dotDiameterMm / 2));
  const dotPitch = Math.max(2.0, Math.min(3.2, config.dotSpacingMm));
  const cellPitch = Math.max(dotPitch * 2.1, config.cellSpacingMm);

  const holeRadius = Math.max(1.5, Math.min(3.2, config.holeDiameterMm / 2));
  const leftMargin = config.addKeychainHole
    ? Math.max(bodyH * 0.52, 4.5 + holeRadius * 2 + 4.0)
    : Math.max(6.0, bodyH * 0.32);
  const rightMargin = config.shape === 'capsule' ? Math.max(7.5, bodyH * 0.42) : 6.5;

  const cellCount = Math.max(1, cells.length);
  // Ancho ocupado por las celdas (desde columna izq de celda 0 hasta columna der de última celda)
  const cellsSpanWidth = (cellCount - 1) * cellPitch + dotPitch;
  const bodyW = Math.max(bodyH + 14, leftMargin + cellsSpanWidth + rightMargin);

  // Margen exterior de seguridad de 0.6 mm para que el trazo de corte nunca se recorte en el viewBox
  const pad = 0.6;
  const totalW = Number((bodyW + pad * 2).toFixed(2));
  const totalH = Number((bodyH + pad * 2).toFixed(2));

  const x0 = pad;
  const y0 = pad;

  const engraveParts: string[] = [];
  const scoreParts: string[] = [];
  const innerCutParts: string[] = [];
  const outerCutParts: string[] = [];

  let engraveAreaMm2 = 0;
  let scoreLengthMm = 0;
  let cutLengthMm = 0;
  let activeDotCount = 0;

  // 1. Corte exterior: Cápsula redondeada o Rectángulo con esquinas suaves
  if (config.shape === 'capsule') {
    const r = bodyH / 2;
    const lx = x0 + r;
    const rx = Math.max(lx + 1, x0 + bodyW - r);
    const outerD = [
      `M ${lx.toFixed(2)} ${y0.toFixed(2)}`,
      `L ${rx.toFixed(2)} ${y0.toFixed(2)}`,
      `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${rx.toFixed(2)} ${(y0 + bodyH).toFixed(2)}`,
      `L ${lx.toFixed(2)} ${(y0 + bodyH).toFixed(2)}`,
      `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${lx.toFixed(2)} ${y0.toFixed(2)}`,
      'Z',
    ].join(' ');
    outerCutParts.push(`    <path d="${outerD}" />`);
    cutLengthMm += 2 * (rx - lx) + 2 * Math.PI * r;
  } else {
    const rxCorner = Math.min(4.0, bodyH * 0.22);
    outerCutParts.push(
      `    <rect x="${x0.toFixed(2)}" y="${y0.toFixed(2)}" width="${bodyW.toFixed(2)}" height="${bodyH.toFixed(2)}" rx="${rxCorner.toFixed(2)}" ry="${rxCorner.toFixed(2)}" />`
    );
    cutLengthMm += 2 * (bodyW + bodyH);
  }

  // 2. Corte interior: Orificio para argolla de llavero
  if (config.addKeychainHole) {
    const holeCx = x0 + (config.shape === 'capsule' ? Math.max(7.0, bodyH * 0.34) : 6.5);
    const holeCy = y0 + bodyH / 2;
    innerCutParts.push(
      `    <circle cx="${holeCx.toFixed(2)}" cy="${holeCy.toFixed(2)}" r="${holeRadius.toFixed(2)}" />`
    );
    cutLengthMm += 2 * Math.PI * holeRadius;
  }

  // 3. Distribución vertical: Palabra en tinta vectorial arriba + Celdas Braille abajo (o centrado si sin texto)
  const contentStartX = x0 + leftMargin;
  const contentCenterX = contentStartX + cellsSpanWidth / 2;

  const brailleBlockHeight = dotPitch * 2; // 3 filas -> 2 intervalos verticales
  let brailleTopRowY = y0 + (bodyH - brailleBlockHeight) / 2;

  if (config.includeText) {
    const fontSizeMm = Math.min(3.6, Math.max(2.6, bodyH * 0.16));
    const textCenterY = y0 + bodyH * 0.25;
    brailleTopRowY = y0 + bodyH * 0.56 - brailleBlockHeight * 0.22;

    const textPathSvg = renderVectorText(effectiveText.toUpperCase(), {
      x: contentCenterX,
      y: textCenterY,
      fontSizeMm,
      align: 'center',
      baseline: 'middle',
      fill: LASER_COLORS.ENGRAVE,
      letterSpacingMm: 0.42,
    });

    if (textPathSvg) {
      engraveParts.push(`    ${textPathSvg}`);
      engraveAreaMm2 += effectiveText.length * fontSizeMm * fontSizeMm * 0.55;
    }

    if (config.showCellGuides) {
      const sepY = y0 + bodyH * 0.42;
      const lineX1 = contentStartX - 1.5;
      const lineX2 = contentStartX + cellsSpanWidth + 1.5;
      scoreParts.push(
        `    <line x1="${lineX1.toFixed(2)}" y1="${sepY.toFixed(2)}" x2="${lineX2.toFixed(2)}" y2="${sepY.toFixed(2)}" />`
      );
      scoreLengthMm += Math.max(0, lineX2 - lineX1);
    }
  }

  // 4. Celdas Braille de 6 puntos:
  //    1 (col 0, fila 0)   4 (col 1, fila 0)
  //    2 (col 0, fila 1)   5 (col 1, fila 1)
  //    3 (col 0, fila 2)   6 (col 1, fila 2)
  const dotOffsets: Record<number, [number, number]> = {
    1: [0, 0],
    2: [0, dotPitch],
    3: [0, dotPitch * 2],
    4: [dotPitch, 0],
    5: [dotPitch, dotPitch],
    6: [dotPitch, dotPitch * 2],
  };

  cells.forEach((cell, cellIdx) => {
    const cellOriginX = contentStartX + cellIdx * cellPitch;
    if (cell.char === ' ') return;

    for (let dotNum = 1; dotNum <= 6; dotNum++) {
      const [dx, dy] = dotOffsets[dotNum];
      const cx = cellOriginX + dx;
      const cy = brailleTopRowY + dy;
      const isActive = cell.dots.includes(dotNum);

      if (isActive) {
        activeDotCount++;
        engraveParts.push(
          `    <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${dotRadius.toFixed(2)}" fill="${LASER_COLORS.ENGRAVE}" stroke="none" />`
        );
        engraveAreaMm2 += Math.PI * dotRadius * dotRadius;
      } else if (config.showCellGuides) {
        const guideR = Math.max(0.28, dotRadius * 0.38);
        scoreParts.push(
          `    <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${guideR.toFixed(2)}" />`
        );
        scoreLengthMm += 2 * Math.PI * guideR;
      }
    }
  });

  const cleanSlug =
    effectiveText
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'braille';

  const filename = `llavero-braille-laser-${cleanSlug}.svg`;

  const svgContent = buildLaserSvgDocument({
    widthMm: totalW,
    heightMm: totalH,
    title: `Feria Científica LBN Maipú · Llavero Braille "${effectiveText.toUpperCase()}" (MDF 3mm)`,
    description: `Llavero inclusivo Nombre + Braille (${cells.length} celdas, ${activeDotCount} puntos activos) ${bodyW.toFixed(1)}×${bodyH.toFixed(1)}mm`,
    engravePathsSvg: engraveParts.join('\n'),
    scorePathsSvg: scoreParts.join('\n'),
    innerCutPathsSvg: innerCutParts.join('\n'),
    outerCutPathsSvg: outerCutParts.join('\n'),
  });

  const estimatedMinutes = estimateFalconJobMinutes({
    cutLengthMm,
    scoreLengthMm,
    engraveAreaMm2,
  });

  return {
    svgContent,
    widthMm: totalW,
    heightMm: totalH,
    bodyWidthMm: Number(bodyW.toFixed(1)),
    bodyHeightMm: Number(bodyH.toFixed(1)),
    estimatedMinutes,
    cells,
    activeDotCount,
    filename,
  };
}
