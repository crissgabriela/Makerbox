import {
  buildLaserSvgDocument,
  estimateFalconJobMinutes,
} from './falconLaserSpec';
import { renderVectorText } from './vectorFont';

export const GOLDEN_RATIO_PHI = (1 + Math.sqrt(5)) / 2; // 1.6180339887...

export type GoldenInstrumentType = 'math_stencil_ruler' | 'golden_caliper';

export interface GoldenTemplateConfig {
  instrumentType: GoldenInstrumentType;
  studentName: string; // Nombre grabado personalizado de recuerdo de la Feria Científica
  rulerLengthCm: 12 | 15 | 18; // Para la plantilla multi-geometría
  includeParabolaAndPolygons: boolean;
  includeGoldenSpiralScore: boolean;
  caliperTotalLegMm: number; // Ej: 144 mm (Fibonacci: 144, 89, 55 mm)
  pivotHoleDiameterMm: number; // Ø 3.2 mm para tornillos/remaches M3 o encaje
}

export const DEFAULT_GOLDEN_TEMPLATE_CONFIG: GoldenTemplateConfig = {
  instrumentType: 'math_stencil_ruler',
  studentName: 'FERIA CIENTÍFICA 2026',
  rulerLengthCm: 15,
  includeParabolaAndPolygons: true,
  includeGoldenSpiralScore: true,
  caliperTotalLegMm: 144,
  pivotHoleDiameterMm: 3.2,
};

/**
 * Construye una cápsula (barra con extremos semicirculares redondeados y punta indicadora opcional)
 */
function buildRoundedBarPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  halfWidth: number,
  pointedEnd2 = false
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;

  const p1a = [x1 + nx * halfWidth, y1 + ny * halfWidth];
  const p1b = [x1 - nx * halfWidth, y1 - ny * halfWidth];

  if (!pointedEnd2) {
    const p2a = [x2 + nx * halfWidth, y2 + ny * halfWidth];
    const p2b = [x2 - nx * halfWidth, y2 - ny * halfWidth];
    return [
      `M ${p1a[0].toFixed(2)} ${p1a[1].toFixed(2)}`,
      `L ${p2a[0].toFixed(2)} ${p2a[1].toFixed(2)}`,
      `A ${halfWidth.toFixed(2)} ${halfWidth.toFixed(2)} 0 0 1 ${p2b[0].toFixed(2)} ${p2b[1].toFixed(2)}`,
      `L ${p1b[0].toFixed(2)} ${p1b[1].toFixed(2)}`,
      `A ${halfWidth.toFixed(2)} ${halfWidth.toFixed(2)} 0 0 1 ${p1a[0].toFixed(2)} ${p1a[1].toFixed(2)}`,
      'Z',
    ].join(' ');
  }

  // Extremo 2 terminado en punta de medición fina con radio suave
  const shoulderDist = Math.max(0, len - halfWidth * 2.1);
  const sx = x1 + ux * shoulderDist;
  const sy = y1 + uy * shoulderDist;
  const s2a = [sx + nx * halfWidth, sy + ny * halfWidth];
  const s2b = [sx - nx * halfWidth, sy - ny * halfWidth];
  const tipA = [x2 + nx * 0.8, y2 + ny * 0.8];
  const tipB = [x2 - nx * 0.8, y2 - ny * 0.8];

  return [
    `M ${p1a[0].toFixed(2)} ${p1a[1].toFixed(2)}`,
    `L ${s2a[0].toFixed(2)} ${s2a[1].toFixed(2)}`,
    `L ${tipA[0].toFixed(2)} ${tipA[1].toFixed(2)}`,
    `A 0.8 0.8 0 0 1 ${tipB[0].toFixed(2)} ${tipB[1].toFixed(2)}`,
    `L ${s2b[0].toFixed(2)} ${s2b[1].toFixed(2)}`,
    `L ${p1b[0].toFixed(2)} ${p1b[1].toFixed(2)}`,
    `A ${halfWidth.toFixed(2)} ${halfWidth.toFixed(2)} 0 0 1 ${p1a[0].toFixed(2)} ${p1a[1].toFixed(2)}`,
    'Z',
  ].join(' ');
}

/**
 * Construye una Espiral de Fibonacci / Áurea (6 cuadrantes de arco) dentro de una caja en (ox, oy)
 */
function buildGoldenSpiralSvg(
  ox: number,
  oy: number,
  unitMm: number
): { rectsD: string; spiralD: string; width: number; height: number } {
  // Cuadrados de Fibonacci: 8, 5, 3, 2, 1, 1 -> Rectángulo total 13 × 8 unidades
  const s = unitMm;
  // Cuadrado 8×8 a la izquierda: [0..8, 0..8]
  // Cuadrado 5×5 arriba-derecha: [8..13, 0..5]
  // Cuadrado 3×3 abajo-derecha: [10..13, 5..8]
  // Cuadrado 2×2 abajo-centro: [8..10, 6..8]
  // Cuadrados 1×1: [8..9, 5..6] y [9..10, 5..6]
  const rects = [
    [0, 0, 8, 8],
    [8, 0, 5, 5],
    [10, 5, 3, 3],
    [8, 6, 2, 2],
    [8, 5, 1, 1],
    [9, 5, 1, 1],
  ];

  const rectsD = rects
    .map(([rx, ry, rw, rh]) => {
      const x = (ox + rx * s).toFixed(2);
      const y = (oy + ry * s).toFixed(2);
      const x2 = (ox + (rx + rw) * s).toFixed(2);
      const y2 = (oy + (ry + rh) * s).toFixed(2);
      return `M ${x} ${y} L ${x2} ${y} L ${x2} ${y2} L ${x} ${y2} Z`;
    })
    .join(' ');

  // Arcos cuartos de círculo continuos desde (0, 8) -> (8, 0) -> (13, 5) -> (10, 8) -> (8, 6) -> (9, 5) -> (10, 6)
  const fx = (u: number) => (ox + u * s).toFixed(2);
  const fy = (u: number) => (oy + u * s).toFixed(2);
  const fr = (u: number) => (u * s).toFixed(2);

  const spiralD = [
    `M ${fx(0)} ${fy(8)}`,
    `A ${fr(8)} ${fr(8)} 0 0 1 ${fx(8)} ${fy(0)}`,
    `A ${fr(5)} ${fr(5)} 0 0 1 ${fx(13)} ${fy(5)}`,
    `A ${fr(3)} ${fr(3)} 0 0 1 ${fx(10)} ${fy(8)}`,
    `A ${fr(2)} ${fr(2)} 0 0 1 ${fx(8)} ${fy(6)}`,
    `A ${fr(1)} ${fr(1)} 0 0 1 ${fx(9)} ${fy(5)}`,
    `A ${fr(1)} ${fr(1)} 0 0 1 ${fx(10)} ${fy(6)}`,
  ].join(' ');

  return { rectsD, spiralD, width: 13 * s, height: 8 * s };
}

export interface GoldenTemplateResult {
  svgContent: string;
  widthMm: number;
  heightMm: number;
  estimatedMinutes: number;
  caliperDimensions: {
    longArmMm: number;
    mediumPivotMm: number;
    shortPivotMm: number;
  };
}

export function generateGoldenTemplateLaser(
  config: GoldenTemplateConfig = DEFAULT_GOLDEN_TEMPLATE_CONFIG
): GoldenTemplateResult {
  const margin = 8;
  const engraveParts: string[] = [];
  const scoreParts: string[] = [];
  const innerCutParts: string[] = [];
  const outerCutParts: string[] = [];

  let cutLengthMm = 0;
  let scoreLengthMm = 0;
  let engraveAreaMm2 = 0;

  const Ltotal = config.caliperTotalLegMm;
  const dB = Math.round((Ltotal / GOLDEN_RATIO_PHI) * 100) / 100;
  const dA = Math.round((Ltotal / (GOLDEN_RATIO_PHI * GOLDEN_RATIO_PHI)) * 100) / 100;

  const cleanName =
    config.studentName.trim().slice(0, 32).toUpperCase() ||
    'FERIA CIENTÍFICA 2026';

  if (config.instrumentType === 'math_stencil_ruler') {
    const rulerMm = config.rulerLengthCm * 10;
    const padX = 9;
    const bodyW = rulerMm + padX * 2;
    const bodyH = 68;
    const ox = margin;
    const oy = margin;

    // Contorno exterior redondeado + perforación llavero/carpeta
    outerCutParts.push(
      `    <rect x="${ox.toFixed(2)}" y="${oy.toFixed(
        2
      )}" width="${bodyW.toFixed(2)}" height="${bodyH.toFixed(
        2
      )}" rx="5.5" ry="5.5" />`
    );
    cutLengthMm += 2 * (bodyW + bodyH);

    // Orificio superior izquierdo para colgar / archivar
    innerCutParts.push(
      `    <circle cx="${(ox + 6.5).toFixed(2)}" cy="${(oy + 6.5).toFixed(
        2
      )}" r="2.4" />`
    );
    cutLengthMm += 15;

    // 1. REGLA MILIMETRADA EN EL BORDE INFERIOR (oy + bodyH)
    const rulerBottomY = oy + bodyH;
    const zeroX = ox + padX;

    for (let mm = 0; mm <= rulerMm; mm++) {
      const tx = zeroX + mm;
      const isCm = mm % 10 === 0;
      const isHalfCm = mm % 5 === 0 && !isCm;
      const tickH = isCm ? 5.8 : isHalfCm ? 4.0 : 2.3;

      scoreParts.push(
        `    <line x1="${tx.toFixed(2)}" y1="${rulerBottomY.toFixed(
          2
        )}" x2="${tx.toFixed(2)}" y2="${(rulerBottomY - tickH).toFixed(2)}" />`
      );
      scoreLengthMm += tickH;

      if (isCm) {
        engraveParts.push(
          `    ${renderVectorText(String(mm / 10), {
            x: tx,
            y: rulerBottomY - 7.8,
            fontSizeMm: 2.3,
          })}`
        );
      }
    }
    engraveAreaMm2 += 40;

    // 2. TRANSPORTADOR SEMICIRCULAR INTEGRADO (izquierda-centro)
    const protCx = ox + 36;
    const protCy = oy + 46;
    const protOuterR = 23;
    const protCutR = 15.5;

    // Ventana semicircular interior para marcar ángulos con lápiz + mirilla de vértice
    const semiWindowD = `M ${(protCx - protCutR).toFixed(2)} ${(
      protCy - 2.2
    ).toFixed(2)} A ${protCutR.toFixed(2)} ${protCutR.toFixed(2)} 0 0 1 ${(
      protCx + protCutR
    ).toFixed(2)} ${(protCy - 2.2).toFixed(2)} Z`;
    innerCutParts.push(`    <path d="${semiWindowD}" />`);
    innerCutParts.push(
      `    <circle cx="${protCx.toFixed(2)}" cy="${protCy.toFixed(
        2
      )}" r="1.1" />`
    );
    cutLengthMm += Math.PI * protCutR + 2 * protCutR + 8;

    // Graduaciones del transportador cada 10° (y marcas de 5°)
    for (let deg = 0; deg <= 180; deg += 5) {
      const rad = (deg * Math.PI) / 180;
      const isTen = deg % 10 === 0;
      const isThirty = deg % 30 === 0;
      const r1 = protOuterR - (isThirty ? 3.4 : isTen ? 2.4 : 1.4);
      const r2 = protOuterR;
      const x1 = protCx - r1 * Math.cos(rad);
      const y1 = protCy - r1 * Math.sin(rad);
      const x2 = protCx - r2 * Math.cos(rad);
      const y2 = protCy - r2 * Math.sin(rad);
      scoreParts.push(
        `    <line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(
          2
        )}" y2="${y2.toFixed(2)}" />`
      );
      scoreLengthMm += r2 - r1;

      if (isThirty) {
        const tr = protOuterR + 2.4;
        const lx = protCx - tr * Math.cos(rad);
        const ly = protCy - tr * Math.sin(rad);
        engraveParts.push(
          `    ${renderVectorText(`${deg}°`, {
            x: lx,
            y: ly,
            fontSizeMm: 1.7,
          })}`
        );
      }
    }

    // 3. ESTÉNCILES DE PARÁBOLA Y POLÍGONOS (centro)
    if (config.includeParabolaAndPolygons) {
      // Esténcil Parábola y = x² / 10 (ancho 20mm, alto 22mm)
      const parCx = ox + 80;
      const parVertexY = oy + 46;
      const parHalfW = 10;
      const parH = 22;
      const parPts: string[] = [];
      const steps = 28;
      for (let i = -steps; i <= steps; i++) {
        const u = i / steps; // -1..1
        const px = parCx + u * parHalfW;
        const py = parVertexY - u * u * parH;
        parPts.push(`${i === -steps ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`);
      }
      // Cerramos suavemente por arriba para formar ventana esténcil
      parPts.push('Z');
      innerCutParts.push(`    <path d="${parPts.join(' ')}" />`);
      cutLengthMm += 68;
      engraveParts.push(
        `    ${renderVectorText('y=x²', {
          x: parCx,
          y: parVertexY + 3.2,
          fontSizeMm: 2.0,
        })}`
      );

      // Triángulo equilátero + Hexágono + Circunferencia calibrada
      const triCx = ox + 106;
      const triCy = oy + 29;
      const triR = 8.5;
      const triPts = [0, 1, 2].map((k) => {
        const a = -Math.PI / 2 + (k * 2 * Math.PI) / 3;
        return `${k === 0 ? 'M' : 'L'} ${(triCx + triR * Math.cos(a)).toFixed(
          2
        )} ${(triCy + triR * Math.sin(a)).toFixed(2)}`;
      });
      innerCutParts.push(`    <path d="${triPts.join(' ')} Z" />`);

      const hexCx = ox + 106;
      const hexCy = oy + 46;
      const hexR = 6.8;
      const hexPts = [0, 1, 2, 3, 4, 5].map((k) => {
        const a = (k * Math.PI) / 3;
        return `${k === 0 ? 'M' : 'L'} ${(hexCx + hexR * Math.cos(a)).toFixed(
          2
        )} ${(hexCy + hexR * Math.sin(a)).toFixed(2)}`;
      });
      innerCutParts.push(`    <path d="${hexPts.join(' ')} Z" />`);
      cutLengthMm += 85;

      if (config.rulerLengthCm >= 15) {
        // Cuadrado y Círculo Ø12mm
        const sqX = ox + 121;
        const sqY = oy + 22;
        innerCutParts.push(
          `    <rect x="${sqX.toFixed(2)}" y="${sqY.toFixed(
            2
          )}" width="11.5" height="11.5" />`
        );
        innerCutParts.push(
          `    <circle cx="${(sqX + 5.75).toFixed(2)}" cy="${(
            oy + 45.5
          ).toFixed(2)}" r="6.0" />`
        );
        cutLengthMm += 84;
      }
    }

    // 4. RECTÁNGULO Y ESPIRAL ÁUREA (Φ = 1.618) A LA DERECHA
    if (config.includeGoldenSpiralScore) {
      const spiralUnit = config.rulerLengthCm >= 18 ? 2.5 : config.rulerLengthCm >= 15 ? 2.0 : 1.5;
      const spiralOriginX = ox + bodyW - 13 * spiralUnit - 6;
      const spiralOriginY = oy + 22;
      const sp = buildGoldenSpiralSvg(spiralOriginX, spiralOriginY, spiralUnit);
      scoreParts.push(`    <path d="${sp.rectsD}" stroke-dasharray="1.2 1.0" />`);
      scoreParts.push(`    <path d="${sp.spiralD}" />`);
      scoreLengthMm += 135;

      engraveParts.push(
        `    ${renderVectorText('Φ = 1.618', {
          x: spiralOriginX + sp.width / 2,
          y: spiralOriginY + sp.height + 3.4,
          fontSizeMm: 2.1,
        })}`
      );
    }

    // 5. ENCABEZADO PERSONALIZADO CON NOMBRE Y LICEO
    engraveParts.push(
      `    ${renderVectorText(cleanName, {
        x: ox + bodyW / 2,
        y: oy + 6.2,
        fontSizeMm: 3.6,
      })}`
    );
    engraveParts.push(
      `    ${renderVectorText('LICEO BICENTENARIO DE NIÑAS DE MAIPÚ · MAKERBOX UTALCA', {
        x: ox + bodyW / 2,
        y: oy + 11.4,
        fontSizeMm: 2.1,
      })}`
    );
    engraveAreaMm2 += 125;

    const totalW = bodyW + margin * 2;
    const totalH = bodyH + margin * 2;

    const svgContent = buildLaserSvgDocument({
      widthMm: totalW,
      heightMm: totalH,
      title: `Feria Científica LBN Maipú · Plantilla Geométrica (${cleanName})`,
      description: `Regla ${config.rulerLengthCm}cm + Transportador 180° + Esténcil Parábola y Espiral Áurea en MDF 3mm`,
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
      caliperDimensions: {
        longArmMm: Ltotal,
        mediumPivotMm: dB,
        shortPivotMm: dA,
      },
    };
  }

  // =========================================================================
  // INSTRUMENTO 2: COMPÁS / CALIBRADOR ARTICULADO DE PROPORCIÓN ÁUREA (Φ = 1.618)
  // =========================================================================
  // 4 barras horizontales ordenadas en paralelo para corte súper compacto en MDF 3mm:
  // Barra 1 (Brazo Izquierdo): Pivote O en x=0, Pivote A en x=dA, Punta T1 en x=Ltotal
  // Barra 2 (Brazo Derecho):   Pivote O en x=0, Pivote B en x=dB, Punta T3 en x=Ltotal
  // Barra 3 (Eslabón Medio):   Pivote A en x=0, Punta Central T2 en x=dB (longitud dB)
  // Barra 4 (Eslabón Corto):   Pivote B en x=0, Pivote Central T2 en x=dA (longitud dA)
  const halfBarW = 6.2; // Ancho de barra = 12.4 mm (muy firme en MDF 3mm alrededor de agujeros Ø3.2mm)
  const holeR = config.pivotHoleDiameterMm / 2;
  const rowPitch = halfBarW * 2 + 5;
  const startX = margin + halfBarW + 2;

  const bars = [
    {
      label: `BRAZO A · ${cleanName}`,
      len: Ltotal,
      holesX: [0, dA],
      pointed: true,
    },
    {
      label: 'BRAZO B · LICEO BICENTENARIO DE NIÑAS DE MAIPÚ',
      len: Ltotal,
      holesX: [0, dB],
      pointed: true,
    },
    {
      label: `PUNTA ÁUREA Φ = 1.618 (${Math.round(dB)}MM)`,
      len: dB,
      holesX: [0, dB - 7], // Agujero de articulación cerca de la punta central?
      // ¡OJO CINEMÁTICO EXACTO!: En el paralelogramo O-A-T2-B, la articulación central DEBE estar exactamente en T2 (distancia dB desde A y distancia dA desde B).
      // Para poder poner un perno M3 en T2 Y además tener púa indicadora, extendemos la punta 10mm? No: si extendemos las 3 puntas T1, T2, T3 hacia abajo, cambiaría la colinealidad salvo que el propio eje o una muesca marque T2, O que los agujeros de T2 estén exactamente a dB y dA!
      // Pongamos el agujero exactamente en x = dB (con extremo redondeado) en ambas barras centrales, y en los brazos exteriores pongamos una muesca/mira exacta en x = Ltotal con extremo redondeado! Así O, A, B, T2 son los 4 pernos exactos del paralelogramo y los centros/puntas en Ltotal y T2 cumplen |T1-T2| / |T2-T3| = Φ con precisión matemática absoluta!
      pointed: false,
    },
    {
      label: `ESLABÓN Φ⁻² (${Math.round(dA)}MM)`,
      len: dA,
      holesX: [0, dA],
      pointed: false,
    },
  ];
  // Corrigiendo holesX de la Barra 3 a [0, dB] exactos y brazos 1 y 2 con muesca/agujero visor en Ltotal:
  bars[2].holesX = [0, dB];
  bars[0].holesX = [0, dA, Ltotal];
  bars[1].holesX = [0, dB, Ltotal];

  bars.forEach((bar, idx) => {
    const cy = margin + halfBarW + idx * rowPitch;
    const barPath = buildRoundedBarPath(
      startX,
      cy,
      startX + bar.len,
      cy,
      halfBarW,
      bar.pointed
    );
    outerCutParts.push(`    <path d="${barPath}" />`);
    cutLengthMm += 2 * bar.len + 2 * Math.PI * halfBarW;

    bar.holesX.forEach((hx, hIdx) => {
      // En las puntas exteriores (hIdx === 2) hacemos una mirilla fina Ø 2.0mm para marcar con lápiz el punto áureo exacto
      const r = hIdx === 2 ? 1.1 : holeR;
      innerCutParts.push(
        `    <circle cx="${(startX + hx).toFixed(2)}" cy="${cy.toFixed(
          2
        )}" r="${r.toFixed(2)}" />`
      );
      cutLengthMm += 2 * Math.PI * r;
    });

    // Texto grabado en el tramo libre más largo de la barra
    const textMidX =
      idx === 0
        ? startX + (dA + bar.len) / 2
        : idx === 1
        ? startX + dB / 2
        : startX + bar.len / 2;

    engraveParts.push(
      `    ${renderVectorText(bar.label, {
        x: textMidX,
        y: cy,
        fontSizeMm: 2.1,
      })}`
    );
    engraveAreaMm2 += 32;
  });

  // 8 arandelas/topes opcionales en MDF 3mm en el espacio libre inferior derecho (al lado de las barras 3 y 4)
  const totalW = startX + Ltotal + halfBarW + margin + 4;
  const totalH = margin * 2 + (bars.length - 1) * rowPitch + halfBarW * 2;

  const svgContent = buildLaserSvgDocument({
    widthMm: totalW,
    heightMm: totalH,
    title: `Feria Científica LBN Maipú · Compás de Proporción Áurea Φ=1.618`,
    description: `Calibrador articulado de 4 barras (${Ltotal}/${dB}/${dA}mm) con perforaciones Ø${config.pivotHoleDiameterMm}mm en MDF 3mm`,
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
    caliperDimensions: {
      longArmMm: Ltotal,
      mediumPivotMm: dB,
      shortPivotMm: dA,
    },
  };
}
