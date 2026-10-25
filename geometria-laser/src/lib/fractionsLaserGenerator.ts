import {
  buildLaserSvgDocument,
  estimateFalconJobMinutes,
} from './falconLaserSpec';
import { renderVectorText } from './vectorFont';

export type FractionDenominator = 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
export type FractionEngraveMode = 'fraction' | 'fraction_angle' | 'percent' | 'braille';
export type DiskSizePreset = 'standard_70' | 'medium_90' | 'large_115';

export interface FractionsLaserConfig {
  denominator: FractionDenominator;
  engraveMode: FractionEngraveMode;
  sizePreset: DiskSizePreset;
  toleranceMm: number; // 0.15, 0.20, 0.30 mm
  includeTray: boolean; // Plato Base + Aro Cavidad (MDF 3mm + 3mm = 6mm)
  includeSchoolStamp: boolean; // Grabado institucional en el plato base
}

export const DEFAULT_FRACTIONS_LASER_CONFIG: FractionsLaserConfig = {
  denominator: 3,
  engraveMode: 'fraction_angle',
  sizePreset: 'standard_70',
  toleranceMm: 0.2,
  includeTray: true,
  includeSchoolStamp: true,
};

export const DISK_SIZE_SPECS: Record<
  DiskSizePreset,
  { label: string; outerDiameterMm: number; innerDiameterMm: number; desc: string }
> = {
  standard_70: {
    label: 'Estándar MakerBox (Ø 70 / 60 mm)',
    outerDiameterMm: 70,
    innerDiameterMm: 60,
    desc: 'Idéntico al formato de Señas Láser · Corte ultrarrápido',
  },
  medium_90: {
    label: 'Mediano Escolar (Ø 90 / 78 mm)',
    outerDiameterMm: 90,
    innerDiameterMm: 78,
    desc: 'Excelente legibilidad para trabajo grupal en banco',
  },
  large_115: {
    label: 'Demostración Feria XL (Ø 115 / 100 mm)',
    outerDiameterMm: 115,
    innerDiameterMm: 100,
    desc: 'Ideal para exposición docente frente al stand',
  },
};

// Mapeo Braille (Signo numérico # + 1 + barra / + denominador)
const DIGIT_BRAILLE: Record<string, number[]> = {
  '0': [2, 4, 5],
  '1': [1],
  '2': [1, 2],
  '3': [1, 4],
  '4': [1, 4, 5],
  '5': [1, 5],
  '6': [1, 2, 4],
  '8': [1, 2, 5],
};

export function getFractionBrailleCells(den: FractionDenominator): {
  cells: number[][];
  labels: string[];
} {
  const denDigits = String(den).split('');
  const cells: number[][] = [
    [3, 4, 5, 6], // Signo #
    [1],          // 1
    [3, 4],       // Barra /
    ...denDigits.map((d) => DIGIT_BRAILLE[d] || [1]),
  ];
  const labels = [
    'Signo #',
    'Num 1',
    'Barra /',
    ...denDigits.map((d) => `Dígito ${d}`),
  ];
  return { cells, labels };
}

export interface FractionsLaserResult {
  svgContent: string;
  widthMm: number;
  heightMm: number;
  outerDiameterMm: number;
  innerDiameterMm: number;
  angleDeg: number;
  sectorAreaCm2: number;
  arcLengthMm: number;
  estimatedMinutes: number;
  piecePathLocalD: string;
  rEffectiveMm: number;
  rApexMm: number;
}

/**
 * Calcula los vértices exactos de un sector circular con retracción normal de tolerancia `tol`
 * centrado con bisectriz apuntando hacia -Y (arriba en coordenadas SVG).
 */
export function computeSectorGeometry(
  denominator: number,
  rPocket: number,
  toleranceMm: number
) {
  const angleStep = (Math.PI * 2) / denominator;
  const halfTheta = angleStep / 2;
  const rEff = Math.max(8, rPocket - toleranceMm);
  const normalOffset = toleranceMm / 2;
  const rApex = normalOffset / Math.sin(halfTheta);

  const alpha1 = Math.PI / 2 - halfTheta;
  const u1x = Math.cos(alpha1);
  const u1y = Math.sin(alpha1);
  const b1 = 2 * rApex * u1y;
  const c1 = rApex * rApex - rEff * rEff;
  const t1 = (-b1 + Math.sqrt(Math.max(0, b1 * b1 - 4 * c1))) / 2;

  const p1x = t1 * u1x;
  const p1y = rApex + t1 * u1y;
  const p2x = -p1x;
  const p2y = p1y;

  const largeArcFlag = angleStep > Math.PI ? 1 : 0;
  // Bisectriz hacia arriba (-Y en SVG)
  const localPathD = `M 0 ${(-rApex).toFixed(2)} L ${p1x.toFixed(2)} ${(-p1y).toFixed(2)} A ${rEff.toFixed(2)} ${rEff.toFixed(2)} 0 ${largeArcFlag} 0 ${p2x.toFixed(2)} ${(-p2y).toFixed(2)} Z`;

  return {
    angleStep,
    rEff,
    rApex,
    p1x,
    p1y,
    p2x,
    p2y,
    largeArcFlag,
    localPathD,
  };
}

export function generateFractionsLaser(
  config: FractionsLaserConfig = DEFAULT_FRACTIONS_LASER_CONFIG
): FractionsLaserResult {
  const den = config.denominator;
  const spec = DISK_SIZE_SPECS[config.sizePreset];
  const rOuter = spec.outerDiameterMm / 2;
  const rPocket = spec.innerDiameterMm / 2;
  const tol = config.toleranceMm;

  const sector = computeSectorGeometry(den, rPocket, tol);
  const angleDeg = Math.round((360 / den) * 10) / 10;
  const percentStr = `${Math.round((100 / den) * 10) / 10}%`;

  const margin = 8;
  const gap = 8;

  const engraveParts: string[] = [];
  const scoreParts: string[] = [];
  const innerCutParts: string[] = [];
  const outerCutParts: string[] = [];

  let currentY = margin;
  let maxRowWidth = 0;

  let cutLengthMm = 0;
  let scoreLengthMm = 0;
  let engraveAreaMm2 = 0;

  // 1. PLATO BASE + ARO CAVIDAD (si está activo)
  if (config.includeTray) {
    const cx1 = margin + rOuter;
    const cy1 = currentY + rOuter;
    const cx2 = cx1 + spec.outerDiameterMm + gap;
    const cy2 = cy1;

    // Plato Base (Capa inferior sólida 3mm)
    outerCutParts.push(
      `    <circle cx="${cx1.toFixed(2)}" cy="${cy1.toFixed(2)}" r="${rOuter.toFixed(2)}" />`
    );
    cutLengthMm += 2 * Math.PI * rOuter;

    // Líneas guía divisorias suaves en azul en el fondo del plato para visualizar equivalencias
    for (let k = 0; k < den; k++) {
      const ang = -Math.PI / 2 + k * sector.angleStep;
      const xEnd = cx1 + (rPocket - 1.5) * Math.cos(ang);
      const yEnd = cy1 + (rPocket - 1.5) * Math.sin(ang);
      scoreParts.push(
        `    <line x1="${cx1.toFixed(2)}" y1="${cy1.toFixed(2)}" x2="${xEnd.toFixed(2)}" y2="${yEnd.toFixed(2)}" stroke-dasharray="1.8 1.4" />`
      );
      scoreLengthMm += rPocket;
    }

    if (config.includeSchoolStamp) {
      engraveParts.push(
        `    ${renderVectorText('LICEO BICENTENARIO DE NIÑAS DE MAIPÚ', {
          x: cx1,
          y: cy1 - rPocket * 0.34,
          fontSizeMm: Math.max(2.1, rPocket * 0.075),
        })}`
      );
      engraveParts.push(
        `    ${renderVectorText(`FERIA CIENTÍFICA · DISCO 1/${den} (${angleDeg}°)`, {
          x: cx1,
          y: cy1 + rPocket * 0.34,
          fontSizeMm: Math.max(2.0, rPocket * 0.072),
        })}`
      );
      engraveParts.push(
        `    ${renderVectorText('MAKERBOX · INGENIERÍA UTALCA', {
          x: cx1,
          y: cy1 + rPocket * 0.50,
          fontSizeMm: Math.max(1.8, rPocket * 0.062),
        })}`
      );
      engraveAreaMm2 += 120;
    }

    // Aro Cavidad (Capa superior 3mm: corte interior Ø cavidad primero, luego exterior Ø plato)
    innerCutParts.push(
      `    <circle cx="${cx2.toFixed(2)}" cy="${cy2.toFixed(2)}" r="${rPocket.toFixed(2)}" />`
    );
    outerCutParts.push(
      `    <circle cx="${cx2.toFixed(2)}" cy="${cy2.toFixed(2)}" r="${rOuter.toFixed(2)}" />`
    );
    cutLengthMm += 2 * Math.PI * (rPocket + rOuter);

    // Grabado sutil en el borde del aro superior (ancho del anillo = rOuter - rPocket)
    const ringMidR = (rOuter + rPocket) / 2;
    const ringThick = rOuter - rPocket;
    if (ringThick >= 4.5) {
      engraveParts.push(
        `    ${renderVectorText(`FRACCIONES 1/${den}`, {
          x: cx2,
          y: cy2 - ringMidR,
          fontSizeMm: Math.min(2.6, ringThick * 0.46),
        })}`
      );
      engraveParts.push(
        `    ${renderVectorText('MDF 3MM · 360°', {
          x: cx2,
          y: cy2 + ringMidR,
          fontSizeMm: Math.min(2.4, ringThick * 0.42),
        })}`
      );
      engraveAreaMm2 += 45;
    }

    maxRowWidth = Math.max(maxRowWidth, cx2 + rOuter + margin);
    currentY += spec.outerDiameterMm + gap + 4;
  }

  // 2. FICHAS DE FRACCIONES (organizadas en cuadrícula compacta)
  // Ancho de la caja delimitadora de una pieza orientada hacia arriba (-Y):
  const pieceHalfW =
    den === 2
      ? sector.rEff
      : den === 3
      ? sector.rEff * Math.sin(Math.PI / 3)
      : Math.max(10, Math.abs(sector.p1x));
  const pieceW = pieceHalfW * 2;
  const pieceH = sector.rEff - sector.rApex;

  const cols = den <= 4 ? den : den <= 6 ? 3 : 4;
  const rows = Math.ceil(den / cols);
  const cellW = pieceW + 6;
  const cellH = pieceH + 7;

  const gridTotalW = cols * cellW - 6 + margin * 2;
  maxRowWidth = Math.max(maxRowWidth, gridTotalW);

  const gridStartX = (maxRowWidth - (cols * cellW - 6)) / 2 + pieceHalfW;

  for (let i = 0; i < den; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const apexX = gridStartX + col * cellW;
    // El ápice está en y = -rApex y el arco llega hasta y = -rEff
    const originY = currentY + row * cellH + sector.rEff;

    const pathD = `M ${apexX.toFixed(2)} ${(originY - sector.rApex).toFixed(2)} L ${(
      apexX + sector.p1x
    ).toFixed(2)} ${(originY - sector.p1y).toFixed(2)} A ${sector.rEff.toFixed(
      2
    )} ${sector.rEff.toFixed(2)} 0 ${sector.largeArcFlag} 0 ${(
      apexX + sector.p2x
    ).toFixed(2)} ${(originY - sector.p2y).toFixed(2)} Z`;

    outerCutParts.push(`    <path d="${pathD}" />`);
    cutLengthMm += 2 * sector.rEff + sector.angleStep * sector.rEff;

    // Posición óptima del centroide visual del sector para el grabado
    const labelRadius =
      den === 2
        ? rPocket * 0.50
        : den <= 4
        ? rPocket * 0.58
        : den <= 8
        ? rPocket * 0.65
        : rPocket * 0.70;
    const markY = originY - labelRadius;

    // Escala de fuente adaptada al ancho angular disponible en labelRadius
    const chordAtLabel = 2 * labelRadius * Math.sin(sector.angleStep / 2);
    const baseFont = Math.min(
      rPocket * 0.21,
      Math.max(2.6, chordAtLabel * (den >= 10 ? 0.34 : 0.38))
    );

    // Rotar texto 90° en sectores muy angostos (1/10, 1/12) para que quede radial y grande
    const radialRotate = den >= 10 ? -90 : 0;

    if (config.engraveMode === 'fraction') {
      engraveParts.push(
        `    ${renderVectorText(`1/${den}`, {
          x: apexX,
          y: markY,
          fontSizeMm: radialRotate ? baseFont * 1.25 : baseFont,
          rotateDeg: radialRotate,
        })}`
      );
      engraveAreaMm2 += 24;
    } else if (config.engraveMode === 'fraction_angle') {
      if (radialRotate) {
        engraveParts.push(
          `    ${renderVectorText(`1/${den} · ${angleDeg}°`, {
            x: apexX,
            y: originY - rPocket * 0.60,
            fontSizeMm: Math.min(4.2, rPocket * 0.12),
            rotateDeg: -90,
          })}`
        );
      } else {
        engraveParts.push(
          `    ${renderVectorText(`1/${den}`, {
            x: apexX,
            y: markY - baseFont * 0.45,
            fontSizeMm: baseFont * 0.95,
          })}`
        );
        engraveParts.push(
          `    ${renderVectorText(`${angleDeg}°`, {
            x: apexX,
            y: markY + baseFont * 0.62,
            fontSizeMm: Math.max(2.1, baseFont * 0.62),
          })}`
        );
      }
      engraveAreaMm2 += 35;
    } else if (config.engraveMode === 'percent') {
      engraveParts.push(
        `    ${renderVectorText(percentStr, {
          x: apexX,
          y: markY - (radialRotate ? 0 : baseFont * 0.38),
          fontSizeMm: baseFont * 0.78,
          rotateDeg: radialRotate,
        })}`
      );
      if (!radialRotate) {
        engraveParts.push(
          `    ${renderVectorText(`1/${den}`, {
            x: apexX,
            y: markY + baseFont * 0.58,
            fontSizeMm: Math.max(2.1, baseFont * 0.62),
          })}`
        );
      }
      engraveAreaMm2 += 32;
    } else {
      // Modo Braille Táctil Quemado (puntos circulares rellenos)
      const { cells } = getFractionBrailleCells(den);
      const scaleBraille = den >= 8 ? 0.68 : den >= 5 ? 0.82 : 1.0;
      const colSp = 2.1 * scaleBraille;
      const dotSp = 2.1 * scaleBraille;
      const cellSp = 4.5 * scaleBraille;
      const dotR = 0.95 * scaleBraille;
      const totalBW = (cells.length - 1) * cellSp + colSp;

      const groupParts: string[] = [];
      cells.forEach((dots, cIdx) => {
        const cX = -totalBW / 2 + cIdx * cellSp + colSp / 2;
        const coords: Record<number, [number, number]> = {
          1: [cX - colSp / 2, -dotSp],
          2: [cX - colSp / 2, 0],
          3: [cX - colSp / 2, dotSp],
          4: [cX + colSp / 2, -dotSp],
          5: [cX + colSp / 2, 0],
          6: [cX + colSp / 2, dotSp],
        };
        dots.forEach((d) => {
          const pt = coords[d];
          if (pt) {
            groupParts.push(
              `<circle cx="${pt[0].toFixed(2)}" cy="${pt[1].toFixed(2)}" r="${dotR.toFixed(2)}" fill="#000000" />`
            );
          }
        });
      });
      const rot = den >= 6 ? -90 : 0;
      engraveParts.push(
        `    <g transform="translate(${apexX.toFixed(2)}, ${markY.toFixed(2)}) rotate(${rot})">${groupParts.join('')}</g>`
      );
      engraveAreaMm2 += 28;
    }
  }

  const totalHeightMm = currentY + rows * cellH - 7 + margin;
  const totalWidthMm = Math.max(80, maxRowWidth);

  const svgContent = buildLaserSvgDocument({
    widthMm: totalWidthMm,
    heightMm: totalHeightMm,
    title: `Feria Científica LBN Maipú · Discos de Fracciones 1/${den} (MDF 3mm)`,
    description: `Plato Ø${spec.outerDiameterMm}/${spec.innerDiameterMm}mm + ${den} sectores de ${angleDeg}° con tolerancia ${tol}mm`,
    engravePathsSvg: engraveParts.join('\n'),
    scorePathsSvg: scoreParts.join('\n'),
    innerCutPathsSvg: innerCutParts.join('\n'),
    outerCutPathsSvg: outerCutParts.join('\n'),
  });

  const sectorAreaCm2 =
    Math.round(((Math.PI * rPocket * rPocket) / den / 100) * 100) / 100;
  const arcLengthMm =
    Math.round(((2 * Math.PI * rPocket) / den) * 10) / 10;

  return {
    svgContent,
    widthMm: Math.round(totalWidthMm * 10) / 10,
    heightMm: Math.round(totalHeightMm * 10) / 10,
    outerDiameterMm: spec.outerDiameterMm,
    innerDiameterMm: spec.innerDiameterMm,
    angleDeg,
    sectorAreaCm2,
    arcLengthMm,
    estimatedMinutes: estimateFalconJobMinutes({
      cutLengthMm,
      scoreLengthMm,
      engraveAreaMm2,
    }),
    piecePathLocalD: sector.localPathD,
    rEffectiveMm: sector.rEff,
    rApexMm: sector.rApex,
  };
}
