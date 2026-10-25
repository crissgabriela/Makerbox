import {
  buildLaserSvgDocument,
  estimateFalconJobMinutes,
} from './falconLaserSpec';
import { renderVectorText } from './vectorFont';

export interface SpirographConfig {
  ringTeeth: number; // Ej: 48, 60, 72
  gear1Teeth: number; // Ej: 24, 20, 18, 36...
  includeSecondGear: boolean;
  gear2Teeth: number; // Segundo piñón opcional en el mismo corte
  moduleMm: number; // Módulo circular m (1.8 a 2.4 mm) -> diámetro primitivo = m * N
  penHoleDiameterMm: number; // Ø agujero punta de lápiz (ej. 3.2 mm Fineliner / Bolígrafo)
  activePenHoleIndex: number; // 0..3 para el simulador matemático en vivo
  backlashMm: number; // Holgura radial para giro suave en MDF 3mm (0.18 mm)
}

export const DEFAULT_SPIROGRAPH_CONFIG: SpirographConfig = {
  ringTeeth: 60,
  gear1Teeth: 24,
  includeSecondGear: true,
  gear2Teeth: 16,
  moduleMm: 2.0,
  penHoleDiameterMm: 3.2,
  activePenHoleIndex: 2,
  backlashMm: 0.18,
};

export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

export function lcm(a: number, b: number): number {
  return Math.abs(Math.round(a * b)) / gcd(a, b);
}

export interface HypotrochoidAnalysis {
  ringTeeth: number;
  gearTeeth: number;
  divisorGcd: number;
  multipleLcm: number;
  petalsCount: number; // R / gcd(R, r)
  revolutionsToClose: number; // r / gcd(R, r)
  symmetryOrder: number;
  ringPitchRadiusMm: number;
  gearPitchRadiusMm: number;
  penOffsetRatio: number;
  curvePoints: [number, number][]; // Puntos (x, y) en mm centrados en (0, 0)
}

const PEN_HOLE_RATIOS = [0.28, 0.46, 0.64, 0.78];

export function analyzeHypotrochoid(
  ringTeeth: number,
  gearTeeth: number,
  moduleMm: number,
  holeIndex: number
): HypotrochoidAnalysis {
  const safeGear = Math.min(ringTeeth - 6, Math.max(10, gearTeeth));
  const g = gcd(ringTeeth, safeGear);
  const petalsCount = ringTeeth / g;
  const revolutionsToClose = safeGear / g;
  const multipleLcm = lcm(ringTeeth, safeGear);

  const R = (ringTeeth * moduleMm) / 2;
  const r = (safeGear * moduleMm) / 2;
  const ratio = PEN_HOLE_RATIOS[Math.min(3, Math.max(0, holeIndex))] ?? 0.64;
  const d = r * ratio;

  const maxT = Math.PI * 2 * revolutionsToClose;
  const steps = Math.min(2400, Math.max(480, petalsCount * 64));
  const curvePoints: [number, number][] = [];

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * maxT;
    const x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
    const y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
    curvePoints.push([x, y]);
  }

  return {
    ringTeeth,
    gearTeeth: safeGear,
    divisorGcd: g,
    multipleLcm,
    petalsCount,
    revolutionsToClose,
    symmetryOrder: petalsCount,
    ringPitchRadiusMm: Math.round(R * 10) / 10,
    gearPitchRadiusMm: Math.round(r * 10) / 10,
    penOffsetRatio: ratio,
    curvePoints,
  };
}

/**
 * Genera el contorno cerrado continuo de un engranaje cicloidad/sinusoidal suave
 * ideal para corte láser en madera MDF 3mm (sin esquinas agudas propensas a quemarse).
 */
function buildSinusoidalGearPath(
  cx: number,
  cy: number,
  teeth: number,
  baseRadiusMm: number,
  toothAmpMm: number
): string {
  const samples = Math.max(240, teeth * 18);
  const parts: string[] = [];
  for (let i = 0; i < samples; i++) {
    const ang = (i / samples) * Math.PI * 2;
    // Suavizado armónico ligero para crestas redondeadas resistentes en MDF
    const wave = Math.cos(teeth * ang) - 0.12 * Math.cos(3 * teeth * ang);
    const rad = baseRadiusMm + toothAmpMm * wave;
    const px = cx + rad * Math.cos(ang);
    const py = cy + rad * Math.sin(ang);
    parts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`);
  }
  parts.push('Z');
  return parts.join(' ');
}

export interface PenHoleItem {
  index: number;
  label: string;
  ratio: number;
  localX: number;
  localY: number;
}

export function computeGearPenHoles(
  gearTeeth: number,
  moduleMm: number,
  toothAmpMm: number,
  holeDiaMm: number
): PenHoleItem[] {
  const rPitch = (gearTeeth * moduleMm) / 2;
  const maxSafeCenterR = Math.max(4, rPitch - toothAmpMm - holeDiaMm / 2 - 2.2);
  const holes: PenHoleItem[] = [];
  const goldenAngle = 2.39996; // ~137.5° para evitar alinear perforaciones y debilitar el MDF

  PEN_HOLE_RATIOS.forEach((ratio, idx) => {
    const dist = Math.min(maxSafeCenterR, rPitch * ratio);
    if (dist >= holeDiaMm * 0.85) {
      const ang = idx * goldenAngle - Math.PI / 2;
      holes.push({
        index: idx,
        label: `${idx + 1}`,
        ratio,
        localX: dist * Math.cos(ang),
        localY: dist * Math.sin(ang),
      });
    }
  });
  return holes;
}

export interface SpirographLaserResult {
  svgContent: string;
  widthMm: number;
  heightMm: number;
  estimatedMinutes: number;
  primaryAnalysis: HypotrochoidAnalysis;
  secondaryAnalysis: HypotrochoidAnalysis | null;
}

export function generateSpirographLaser(
  config: SpirographConfig = DEFAULT_SPIROGRAPH_CONFIG
): SpirographLaserResult {
  const m = config.moduleMm;
  const toothAmp = 0.78 * m;
  const ringPitchR = (config.ringTeeth * m) / 2;
  const ringWallWidth = 15; // Aro exterior ergonómico de 15 mm de pared
  const ringOuterR = ringPitchR + toothAmp + ringWallWidth;

  const g1Teeth = Math.min(config.ringTeeth - 6, Math.max(12, config.gear1Teeth));
  const g2Teeth = Math.min(config.ringTeeth - 6, Math.max(12, config.gear2Teeth));

  const g1PitchR = (g1Teeth * m) / 2;
  const g2PitchR = (g2Teeth * m) / 2;
  const g1OuterR = g1PitchR + toothAmp;
  const g2OuterR = g2PitchR + toothAmp;

  const margin = 8;
  const gap = 10;

  const engraveParts: string[] = [];
  const scoreParts: string[] = [];
  const innerCutParts: string[] = [];
  const outerCutParts: string[] = [];

  let cutLengthMm = 0;
  let scoreLengthMm = 0;
  let engraveAreaMm2 = 0;

  // 1. ANILLO ESTATOR PRINCIPAL
  const ringCx = margin + ringOuterR;
  const ringCy = margin + ringOuterR;

  // Dentado interno del anillo (corte interior rojo)
  const innerGearD = buildSinusoidalGearPath(
    ringCx,
    ringCy,
    config.ringTeeth,
    ringPitchR + config.backlashMm,
    toothAmp
  );
  innerCutParts.push(`    <path d="${innerGearD}" />`);
  cutLengthMm += 2 * Math.PI * ringPitchR * 1.35;

  // Contorno exterior del anillo (corte exterior rojo)
  outerCutParts.push(
    `    <circle cx="${ringCx.toFixed(2)}" cy="${ringCy.toFixed(
      2
    )}" r="${ringOuterR.toFixed(2)}" />`
  );
  cutLengthMm += 2 * Math.PI * ringOuterR;

  // Graduaciones angulares cada 15° en el borde del anillo (marcado rápido azul)
  const tickInner = ringPitchR + toothAmp + 1.8;
  for (let deg = 0; deg < 360; deg += 15) {
    const rad = (deg * Math.PI) / 180;
    const isMajor = deg % 45 === 0;
    const tLen = isMajor ? 3.6 : 2.0;
    const x1 = ringCx + tickInner * Math.cos(rad);
    const y1 = ringCy + tickInner * Math.sin(rad);
    const x2 = ringCx + (tickInner + tLen) * Math.cos(rad);
    const y2 = ringCy + (tickInner + tLen) * Math.sin(rad);
    scoreParts.push(
      `    <line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(
        2
      )}" y2="${y2.toFixed(2)}" />`
    );
    scoreLengthMm += tLen;
  }

  // Grabado superior e inferior en el aro estator
  const textRingR = ringOuterR - ringWallWidth * 0.42;
  engraveParts.push(
    `    ${renderVectorText(`ESPIRÓGRAFO MATEMÁTICO · ANILLO Z=${config.ringTeeth}`, {
      x: ringCx,
      y: ringCy - textRingR,
      fontSizeMm: 2.7,
    })}`
  );
  engraveParts.push(
    `    ${renderVectorText('LICEO BICENTENARIO DE NIÑAS DE MAIPÚ · MAKERBOX', {
      x: ringCx,
      y: ringCy + textRingR,
      fontSizeMm: 2.3,
    })}`
  );
  engraveAreaMm2 += 85;

  // 2. PIÑONES PLANETARIOS (ubicados a la derecha del anillo, o incluso el más pequeño al lado)
  const gearsToCut = [
    { teeth: g1Teeth, pitchR: g1PitchR, outerR: g1OuterR },
    ...(config.includeSecondGear
      ? [{ teeth: g2Teeth, pitchR: g2PitchR, outerR: g2OuterR }]
      : []),
  ];

  const gearColX = margin + ringOuterR * 2 + gap;
  let gearCursorY = margin;
  let maxGearW = 0;

  gearsToCut.forEach((gSpec) => {
    const gCx = gearColX + gSpec.outerR;
    const gCy = gearCursorY + gSpec.outerR;

    // Orificios calibrados para lápiz (cortes interiores primero)
    const holes = computeGearPenHoles(
      gSpec.teeth,
      m,
      toothAmp,
      config.penHoleDiameterMm
    );
    const holeR = config.penHoleDiameterMm / 2;

    holes.forEach((h) => {
      const hx = gCx + h.localX;
      const hy = gCy + h.localY;
      innerCutParts.push(
        `    <circle cx="${hx.toFixed(2)}" cy="${hy.toFixed(
          2
        )}" r="${holeR.toFixed(2)}" />`
      );
      cutLengthMm += 2 * Math.PI * holeR;

      // Número pequeño grabado junto a cada agujero
      const labelDist = holeR + 1.8;
      const norm = Math.hypot(h.localX, h.localY) || 1;
      const lx = hx - (h.localX / norm) * labelDist;
      const ly = hy - (h.localY / norm) * labelDist;
      engraveParts.push(
        `    ${renderVectorText(h.label, {
          x: lx,
          y: ly,
          fontSizeMm: 1.9,
        })}`
      );
    });

    // Etiqueta del número de dientes Z en el centro del piñón
    engraveParts.push(
      `    ${renderVectorText(`Z=${gSpec.teeth}`, {
        x: gCx,
        y: gCy,
        fontSizeMm: Math.max(2.2, Math.min(3.4, gSpec.pitchR * 0.14)),
      })}`
    );
    engraveAreaMm2 += 28;

    // Perfil exterior dentado del piñón
    const gearD = buildSinusoidalGearPath(
      gCx,
      gCy,
      gSpec.teeth,
      gSpec.pitchR - config.backlashMm,
      toothAmp
    );
    outerCutParts.push(`    <path d="${gearD}" />`);
    cutLengthMm += 2 * Math.PI * gSpec.pitchR * 1.35;

    gearCursorY += gSpec.outerR * 2 + gap;
    maxGearW = Math.max(maxGearW, gSpec.outerR * 2);
  });

  const totalW = gearColX + maxGearW + margin;
  const totalH = Math.max(margin * 2 + ringOuterR * 2, gearCursorY - gap + margin);

  const primaryAnalysis = analyzeHypotrochoid(
    config.ringTeeth,
    g1Teeth,
    m,
    config.activePenHoleIndex
  );
  const secondaryAnalysis = config.includeSecondGear
    ? analyzeHypotrochoid(
        config.ringTeeth,
        g2Teeth,
        m,
        config.activePenHoleIndex
      )
    : null;

  const svgContent = buildLaserSvgDocument({
    widthMm: totalW,
    heightMm: totalH,
    title: `Feria Científica LBN Maipú · Espirógrafo Z=${config.ringTeeth}/${g1Teeth}`,
    description: `Anillo dentado Z=${config.ringTeeth} + Piñones con módulo ${m}mm para MDF 3mm`,
    engravePathsSvg: engraveParts.join('\n'),
    scorePathsSvg: scoreParts.join('\n'),
    innerCutPathsSvg: innerCutParts.join('\n'),
    outerCutPathsSvg: outerCutParts.join('\n'),
  });

  return {
    svgContent,
    widthMm: Math.round(totalW * 10) / 10,
    heightMm: Math.round(totalH * 10) / 10,
    estimatedMinutes: estimateFalconJobMinutes({
      cutLengthMm,
      scoreLengthMm,
      engraveAreaMm2,
    }),
    primaryAnalysis,
    secondaryAnalysis,
  };
}
