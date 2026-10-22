import { parse, stringify, INode } from 'svgson';
import { parseSVG, makeAbsolute, Command } from 'svg-path-parser';
import { ZooParams, ZooMetrics, ProcessedZooResult } from '@/types/zoo';

interface Point2D {
  x: number;
  y: number;
}

interface ExtractedPath {
  id: string;
  commands: Command[];
  isEngraveLayer: boolean;
}

/**
 * Convierte formas básicas SVG (<polygon>, <polyline>, <rect>, <circle>, <ellipse>, <line>) a string de comandos <path d="...">
 */
function shapeNodeToPathD(node: INode): string | null {
  const attr = node.attributes || {};
  if (node.name === 'path' && attr.d) {
    return attr.d;
  }
  if ((node.name === 'polygon' || node.name === 'polyline') && attr.points) {
    const nums = attr.points
      .trim()
      .split(/[\s,]+/)
      .map(Number)
      .filter((n) => !Number.isNaN(n));
    if (nums.length < 4) return null;
    const parts: string[] = [`M ${nums[0]} ${nums[1]}`];
    for (let i = 2; i < nums.length - 1; i += 2) {
      parts.push(`L ${nums[i]} ${nums[i + 1]}`);
    }
    if (node.name === 'polygon') parts.push('Z');
    return parts.join(' ');
  }
  if (node.name === 'rect') {
    const x = Number(attr.x) || 0;
    const y = Number(attr.y) || 0;
    const w = Number(attr.width) || 0;
    const h = Number(attr.height) || 0;
    if (w <= 0 || h <= 0) return null;
    return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
  }
  if (node.name === 'line') {
    const x1 = Number(attr.x1) || 0;
    const y1 = Number(attr.y1) || 0;
    const x2 = Number(attr.x2) || 0;
    const y2 = Number(attr.y2) || 0;
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }
  if (node.name === 'circle') {
    const cx = Number(attr.cx) || 0;
    const cy = Number(attr.cy) || 0;
    const r = Number(attr.r) || 0;
    if (r <= 0) return null;
    return sampleEllipseToPath(cx, cy, r, r);
  }
  if (node.name === 'ellipse') {
    const cx = Number(attr.cx) || 0;
    const cy = Number(attr.cy) || 0;
    const rx = Number(attr.rx) || 0;
    const ry = Number(attr.ry) || 0;
    if (rx <= 0 || ry <= 0) return null;
    return sampleEllipseToPath(cx, cy, rx, ry);
  }
  return null;
}

function sampleEllipseToPath(cx: number, cy: number, rx: number, ry: number, steps = 36): string {
  const parts: string[] = [];
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    parts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(3)} ${y.toFixed(3)}`);
  }
  parts.push('Z');
  return parts.join(' ');
}

/**
 * Normaliza los comandos de svg-path-parser a comandos absolutos explícitos (convirtiendo H y V en L, y Q/S/A en L/C)
 */
function normalizeCommandsToExplicit(d: string): Command[] {
  const abs = makeAbsolute(parseSVG(d));
  const out: Command[] = [];
  for (const c of abs) {
    if (c.code === 'H') {
      out.push({ code: 'L', command: 'lineto', x: c.x, y: c.y0, x0: c.x0, y0: c.y0 } as Command);
    } else if (c.code === 'V') {
      out.push({ code: 'L', command: 'lineto', x: c.x0, y: c.y, x0: c.x0, y0: c.y0 } as Command);
    } else if (c.code === 'M' || c.code === 'L' || c.code === 'C' || c.code === 'Z') {
      out.push({ ...c });
    } else if ('x' in c && 'y' in c) {
      out.push({ code: 'L', command: 'lineto', x: c.x, y: c.y, x0: c.x0, y0: c.y0 } as Command);
    }
  }
  return out;
}

/**
 * Extrae recursivamente todos los trazos vectoriales del árbol SVG
 */
function collectVectorPaths(node: INode, acc: ExtractedPath[] = [], indexObj = { idx: 0 }): ExtractedPath[] {
  if (node.name === 'defs' || node.name === 'style' || node.name === 'metadata') {
    return acc;
  }
  const pathD = shapeNodeToPathD(node);
  if (pathD) {
    try {
      const cmds = normalizeCommandsToExplicit(pathD);
      if (cmds.length > 1) {
        const stroke = (node.attributes?.stroke || '').toLowerCase();
        const layer = (node.attributes?.['data-layer'] || '').toLowerCase();
        const id = node.attributes?.id || `path-${indexObj.idx++}`;
        const isEngraveLayer =
          layer === 'engrave' ||
          id.toLowerCase().includes('faceta') ||
          stroke === '#0000ff' ||
          stroke === 'blue';
        acc.push({ id, commands: cmds, isEngraveLayer });
      }
    } catch {
      // Ignorar trazos malformados
    }
  }
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      collectVectorPaths(child, acc, indexObj);
    }
  }
  return acc;
}

function getAllPathsBBox(paths: ExtractedPath[]) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  const add = (x?: number, y?: number) => {
    if (typeof x === 'number' && typeof y === 'number' && !Number.isNaN(x) && !Number.isNaN(y)) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  };
  for (const p of paths) {
    for (const c of p.commands) {
      if ('x' in c && 'y' in c) add(c.x, c.y);
      if ('x1' in c && 'y1' in c) add(c.x1, c.y1);
      if ('x2' in c && 'y2' in c) add(c.x2, c.y2);
    }
  }
  return { minX, minY, maxX, maxY };
}

function transformCommands(cmds: Command[], mapper: (x: number, y: number) => [number, number]): Command[] {
  return cmds.map((c) => {
    const copy = { ...c } as Command;
    if ('x' in copy && 'y' in copy && typeof copy.x === 'number' && typeof copy.y === 'number') {
      const [nx, ny] = mapper(copy.x, copy.y);
      copy.x = nx;
      copy.y = ny;
    }
    if ('x1' in copy && 'y1' in copy && typeof copy.x1 === 'number' && typeof copy.y1 === 'number') {
      const [nx1, ny1] = mapper(copy.x1, copy.y1);
      copy.x1 = nx1;
      copy.y1 = ny1;
    }
    if ('x2' in copy && 'y2' in copy && typeof copy.x2 === 'number' && typeof copy.y2 === 'number') {
      const [nx2, ny2] = mapper(copy.x2, copy.y2);
      copy.x2 = nx2;
      copy.y2 = ny2;
    }
    if ('x0' in copy && 'y0' in copy && typeof copy.x0 === 'number' && typeof copy.y0 === 'number') {
      const [nx0, ny0] = mapper(copy.x0, copy.y0);
      copy.x0 = nx0;
      copy.y0 = ny0;
    }
    return copy;
  });
}

function serializeCommands(cmds: Command[]): string {
  const parts: string[] = [];
  for (const c of cmds) {
    if (c.code === 'M' && 'x' in c && 'y' in c) {
      parts.push(`M ${c.x.toFixed(3)} ${c.y.toFixed(3)}`);
    } else if (c.code === 'L' && 'x' in c && 'y' in c) {
      parts.push(`L ${c.x.toFixed(3)} ${c.y.toFixed(3)}`);
    } else if (c.code === 'C' && 'x1' in c && 'y1' in c && 'x2' in c && 'y2' in c && 'x' in c && 'y' in c) {
      parts.push(
        `C ${c.x1.toFixed(3)} ${c.y1.toFixed(3)} ${c.x2.toFixed(3)} ${c.y2.toFixed(3)} ${c.x.toFixed(3)} ${c.y.toFixed(3)}`
      );
    } else if (c.code === 'Z') {
      parts.push('Z');
    }
  }
  return parts.join(' ');
}

/**
 * Convierte un contorno de comandos en una lista explícita de vértices cerrados
 * y sustrae las dos ranuras rectangulares verticales en el borde inferior de la silueta.
 */
function injectSlotsIntoBottomSilhouette(
  cmds: Command[],
  yBottom: number,
  slots: Array<{ xL: number; xR: number; yTop: number }>
): { commands: Command[]; injectedCount: number } {
  // Primero expandir cualquier comando Z en un segmento L explícito hacia el punto inicial M
  const expanded: Command[] = [];
  let subpathStart: Point2D | null = null;
  let currentPt: Point2D = { x: 0, y: 0 };

  for (const c of cmds) {
    if (c.code === 'M' && 'x' in c && 'y' in c) {
      subpathStart = { x: c.x, y: c.y };
      currentPt = { x: c.x, y: c.y };
      expanded.push({ ...c });
    } else if (c.code === 'Z') {
      if (subpathStart && Math.hypot(currentPt.x - subpathStart.x, currentPt.y - subpathStart.y) > 0.05) {
        expanded.push({
          code: 'L',
          command: 'lineto',
          x: subpathStart.x,
          y: subpathStart.y,
        } as Command);
        currentPt = { ...subpathStart };
      }
      expanded.push({ code: 'Z', command: 'closepath' } as Command);
    } else if ('x' in c && 'y' in c) {
      expanded.push({ ...c } as Command);
      currentPt = { x: c.x, y: c.y };
    }
  }

  let injectedCount = 0;
  const result: Command[] = [];
  let prevPt: Point2D = { x: 0, y: 0 };

  for (const c of expanded) {
    if (c.code === 'M' && 'x' in c && 'y' in c) {
      prevPt = { x: c.x, y: c.y };
      result.push(c);
      continue;
    }

    if (c.code === 'L' && 'x' in c && 'y' in c) {
      const p1 = prevPt;
      const p2 = { x: c.x, y: c.y };
      // Verificar si este segmento pertenece al borde inferior de la silueta (cerca de yBottom)
      const isBottomEdge =
        Math.abs(p1.y - yBottom) < 4.5 &&
        Math.abs(p2.y - yBottom) < 4.5 &&
        Math.abs(p2.x - p1.x) > 3.0;

      if (isBottomEdge) {
        const segMinX = Math.min(p1.x, p2.x);
        const segMaxX = Math.max(p1.x, p2.x);
        const goingRight = p2.x > p1.x;

        // Filtrar las ranuras que caen dentro de este segmento inferior
        const matchingSlots = slots
          .filter((s) => s.xL >= segMinX - 0.5 && s.xR <= segMaxX + 0.5)
          .sort((a, b) => (goingRight ? a.xL - b.xL : b.xR - a.xR));

        if (matchingSlots.length > 0) {
          const interpY = (xVal: number) => {
            const t = (xVal - p1.x) / (p2.x - p1.x);
            return p1.y + Math.max(0, Math.min(1, t)) * (p2.y - p1.y);
          };

          for (const slot of matchingSlots) {
            injectedCount++;
            if (goingRight) {
              const yL = interpY(slot.xL);
              const yR = interpY(slot.xR);
              result.push({ code: 'L', command: 'lineto', x: slot.xL, y: yL } as Command);
              result.push({ code: 'L', command: 'lineto', x: slot.xL, y: slot.yTop } as Command);
              result.push({ code: 'L', command: 'lineto', x: slot.xR, y: slot.yTop } as Command);
              result.push({ code: 'L', command: 'lineto', x: slot.xR, y: yR } as Command);
            } else {
              const yR = interpY(slot.xR);
              const yL = interpY(slot.xL);
              result.push({ code: 'L', command: 'lineto', x: slot.xR, y: yR } as Command);
              result.push({ code: 'L', command: 'lineto', x: slot.xR, y: slot.yTop } as Command);
              result.push({ code: 'L', command: 'lineto', x: slot.xL, y: slot.yTop } as Command);
              result.push({ code: 'L', command: 'lineto', x: slot.xL, y: yL } as Command);
            }
          }
          result.push({ code: 'L', command: 'lineto', x: p2.x, y: p2.y } as Command);
          prevPt = p2;
          continue;
        }
      }

      result.push(c);
      prevPt = p2;
      continue;
    }

    if ('x' in c && 'y' in c) {
      prevPt = { x: c.x, y: c.y };
    }
    result.push(c);
  }

  return { commands: result, injectedCount };
}

/**
 * Genera el contorno cerrado de una base de soporte encastrable (patita de balsa)
 * con su propia ranura de encaje de ancho = materialThicknessMm y profundidad = 7.5 mm
 */
function createStandBasePathD(
  xOffset: number,
  yOffset: number,
  baseWidthMm: number,
  baseHeightMm: number,
  slotThicknessMm: number,
  slotDepthMm: number
): string {
  const x0 = xOffset;
  const y0 = yOffset;
  const x1 = xOffset + baseWidthMm;
  const y1 = yOffset + baseHeightMm;
  const cx = xOffset + baseWidthMm / 2;
  const sL = cx - slotThicknessMm / 2;
  const sR = cx + slotThicknessMm / 2;
  const sBottom = y0 + slotDepthMm;

  // Trapecio redondeado con ranura superior centrada para encaje cruzado a 90°
  const chamfer = 4.0;
  return [
    `M ${(x0 + chamfer).toFixed(3)} ${y0.toFixed(3)}`,
    `L ${sL.toFixed(3)} ${y0.toFixed(3)}`,
    `L ${sL.toFixed(3)} ${sBottom.toFixed(3)}`,
    `L ${sR.toFixed(3)} ${sBottom.toFixed(3)}`,
    `L ${sR.toFixed(3)} ${y0.toFixed(3)}`,
    `L ${(x1 - chamfer).toFixed(3)} ${y0.toFixed(3)}`,
    `L ${x1.toFixed(3)} ${y1.toFixed(3)}`,
    `L ${x0.toFixed(3)} ${y1.toFixed(3)}`,
    'Z',
  ].join(' ');
}

export async function processZooSvg(params: ZooParams): Promise<ProcessedZooResult> {
  const targetHeightMm = Math.max(30, Math.min(240, Number(params.targetHeightMm) || 82));
  const materialThicknessMm = Math.max(1.5, Math.min(6.0, Number(params.materialThicknessMm) || 3.0));
  const slotDepthMm = Math.max(6.0, Math.min(35.0, Number(params.slotDepthMm) || 15.0));
  const slot1Ratio = Math.max(0.15, Math.min(0.85, Number(params.slot1Ratio) || 0.32));
  const slot2Ratio = Math.max(0.15, Math.min(0.85, Number(params.slot2Ratio) || 0.70));

  const parsedAst = await parse(params.svgContent);
  const extracted = collectVectorPaths(parsedAst);

  if (extracted.length === 0) {
    throw new Error('El archivo SVG subido no contiene trazos vectoriales válidos (<path>, <polygon>, etc.).');
  }

  // 1. Calcular Bounding Box original
  const bbox0 = getAllPathsBBox(extracted);
  const originalWidth = Math.max(1e-3, bbox0.maxX - bbox0.minX);
  const originalHeight = Math.max(1e-3, bbox0.maxY - bbox0.minY);

  // 2. Escalar todos los trazos proporcionalmente para que la altura sea exactamente targetHeightMm
  const scaleFactor = targetHeightMm / originalHeight;
  const scaledWidthMm = +(originalWidth * scaleFactor).toFixed(2);
  const scaledHeightMm = +targetHeightMm.toFixed(2);

  // Margen dentro de la lámina de madera de balsa de 300 x 100 mm
  const marginX = 12.0;
  const marginY = targetHeightMm <= 90 ? Math.max(5.0, (100 - targetHeightMm) / 2) : 8.0;

  const scaledPaths: ExtractedPath[] = extracted.map((p) => ({
    ...p,
    commands: transformCommands(p.commands, (x, y) => [
      marginX + (x - bbox0.minX) * scaleFactor,
      marginY + (y - bbox0.minY) * scaleFactor,
    ]),
  }));

  // 3. Identificar el borde inferior de la silueta para posicionar las 2 ranuras verticales
  const yBottom = marginY + scaledHeightMm;
  let baseMinX = Infinity;
  let baseMaxX = -Infinity;

  for (const p of scaledPaths) {
    if (p.isEngraveLayer) continue;
    for (const c of p.commands) {
      if ('x' in c && 'y' in c && typeof c.x === 'number' && typeof c.y === 'number') {
        if (c.y >= yBottom - Math.max(5.0, scaledHeightMm * 0.12)) {
          if (c.x < baseMinX) baseMinX = c.x;
          if (c.x > baseMaxX) baseMaxX = c.x;
        }
      }
    }
  }

  if (!Number.isFinite(baseMinX) || !Number.isFinite(baseMaxX) || baseMaxX - baseMinX < materialThicknessMm * 3) {
    baseMinX = marginX;
    baseMaxX = marginX + scaledWidthMm;
  }

  const baseSpan = baseMaxX - baseMinX;
  const r1 = Math.min(slot1Ratio, slot2Ratio);
  const r2 = Math.max(slot1Ratio, slot2Ratio);
  const slot1CenterX = baseMinX + r1 * baseSpan;
  const slot2CenterX = baseMinX + r2 * baseSpan;
  const ySlotTop = yBottom - slotDepthMm;

  const slotDefs = [
    { xL: slot1CenterX - materialThicknessMm / 2, xR: slot1CenterX + materialThicknessMm / 2, yTop: ySlotTop },
    { xL: slot2CenterX - materialThicknessMm / 2, xR: slot2CenterX + materialThicknessMm / 2, yTop: ySlotTop },
  ];

  // 4. Sustraer las 2 ranuras directamente en el contorno inferior de la silueta
  let totalInjected = 0;
  const finalCutChildren: INode[] = [];
  const finalEngraveChildren: INode[] = [];

  for (const p of scaledPaths) {
    if (p.isEngraveLayer) {
      finalEngraveChildren.push({
        name: 'path',
        type: 'element',
        value: '',
        attributes: {
          id: p.id,
          d: serializeCommands(p.commands),
        },
        children: [],
      });
    } else {
      const { commands: notchedCmds, injectedCount } = injectSlotsIntoBottomSilhouette(
        p.commands,
        yBottom,
        slotDefs
      );
      totalInjected += injectedCount;
      let dStr = serializeCommands(notchedCmds);
      if (!dStr.trim().endsWith('Z')) {
        dStr += ' Z';
      }
      finalCutChildren.push({
        name: 'path',
        type: 'element',
        value: '',
        attributes: {
          id: p.id,
          d: dStr,
        },
        children: [],
      });
    }
  }

  // Si el SVG subido tenía una base curva o segmentada donde no se fusionaron ambas ranuras en un único segmento recto,
  // agregar los rectángulos de ranura cerrados en la capa de corte para garantizar siempre las 2 ranuras exactas
  if (totalInjected < 2) {
    slotDefs.forEach((s, idx) => {
      const slotRectD = `M ${s.xL.toFixed(3)} ${yBottom.toFixed(3)} L ${s.xL.toFixed(3)} ${s.yTop.toFixed(3)} L ${s.xR.toFixed(3)} ${s.yTop.toFixed(3)} L ${s.xR.toFixed(3)} ${yBottom.toFixed(3)} Z`;
      finalCutChildren.push({
        name: 'path',
        type: 'element',
        value: '',
        attributes: {
          id: `ranura-ensamble-${idx + 1}`,
          'data-slot': 'true',
          d: slotRectD,
        },
        children: [],
      });
    });
  }

  // 5. Opcionalmente incluir las 2 bases de soporte ("patitas") a la derecha de la silueta en la tabla de balsa
  const standBaseWidth = 34.0;
  const standBaseHeight = 16.0;
  const standsStartX = marginX + scaledWidthMm + 14.0;

  if (params.includeStandBases) {
    finalCutChildren.push({
      name: 'path',
      type: 'element',
      value: '',
      attributes: {
        id: 'base-soporte-1',
        d: createStandBasePathD(
          standsStartX,
          marginY + 10,
          standBaseWidth,
          standBaseHeight,
          materialThicknessMm,
          slotDepthMm / 2
        ),
      },
      children: [],
    });
    finalCutChildren.push({
      name: 'path',
      type: 'element',
      value: '',
      attributes: {
        id: 'base-soporte-2',
        d: createStandBasePathD(
          standsStartX,
          marginY + 10 + standBaseHeight + 8,
          standBaseWidth,
          standBaseHeight,
          materialThicknessMm,
          slotDepthMm / 2
        ),
      },
      children: [],
    });
  }

  const totalRequiredWidth = params.includeStandBases
    ? standsStartX + standBaseWidth + 10
    : marginX + scaledWidthMm + 10;
  const fitsInStandardBalsaSheet = totalRequiredWidth <= 300 && marginY + scaledHeightMm <= 100;

  const viewBoxW = Math.max(300, Math.ceil(totalRequiredWidth));
  const viewBoxH = Math.max(100, Math.ceil(marginY + scaledHeightMm + 10));

  const rootChildren: INode[] = [];

  if (params.includeAnnotations) {
    // Marco guía de la plancha de madera de balsa de 300 x 100 mm
    rootChildren.push({
      name: 'g',
      type: 'element',
      value: '',
      attributes: { id: 'guia-plancha-balsa-300x100', 'data-layer': 'guide' },
      children: [
        {
          name: 'rect',
          type: 'element',
          value: '',
          attributes: {
            x: '0.5',
            y: '0.5',
            width: '299',
            height: '99',
            rx: '2',
            fill: 'none',
            stroke: '#0284c7',
            'stroke-width': '0.45',
            'stroke-dasharray': '3,2',
          },
          children: [],
        },
        {
          name: 'text',
          type: 'element',
          value: '',
          attributes: {
            x: '295',
            y: '5.5',
            'text-anchor': 'end',
            fill: '#0369a1',
            'font-family': 'system-ui, sans-serif',
            'font-size': '3.5',
            'font-weight': 'bold',
          },
          children: [
            {
              name: '',
              type: 'text',
              value: `Plancha Balsa: 300 × 100 × 3 mm | Animal: ${scaledWidthMm} × ${scaledHeightMm} mm | 2 Ranuras: ${materialThicknessMm.toFixed(2)} × ${slotDepthMm.toFixed(0)} mm`,
              attributes: {},
              children: [],
            },
          ],
        },
      ],
    });
  }

  // Capa Azul (#0000FF): Grabado vectorial de facetas Low-Poly internas (si existen)
  if (finalEngraveChildren.length > 0) {
    rootChildren.push({
      name: 'g',
      type: 'element',
      value: '',
      attributes: {
        id: 'capa-grabado-lowpoly',
        fill: 'none',
        stroke: '#0000FF',
        'stroke-width': '0.25',
      },
      children: finalEngraveChildren,
    });
  }

  // Capa Roja (#FF0000): Corte exterior cerrado con las 2 ranuras sustraídas en la base
  rootChildren.push({
    name: 'g',
    type: 'element',
    value: '',
    attributes: {
      id: 'capa-corte-laser',
      fill: 'none',
      stroke: '#FF0000',
      'stroke-width': '0.25',
    },
    children: finalCutChildren,
  });

  const outAst: INode = {
    name: 'svg',
    type: 'element',
    value: '',
    attributes: {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: `0 0 ${viewBoxW} ${viewBoxH}`,
      width: `${viewBoxW}mm`,
      height: `${viewBoxH}mm`,
      'data-workshop': 'zoologico-low-poly',
      'data-target-height-mm': scaledHeightMm.toFixed(2),
      'data-material-thickness-mm': materialThicknessMm.toFixed(2),
      'data-slot-depth-mm': slotDepthMm.toFixed(2),
    },
    children: rootChildren,
  };

  const outputSvg = `<?xml version="1.0" encoding="UTF-8"?>\n${stringify(outAst)}`;

  return {
    svg: outputSvg,
    metrics: {
      originalWidth: +originalWidth.toFixed(2),
      originalHeight: +originalHeight.toFixed(2),
      scaledWidthMm,
      scaledHeightMm,
      scaleFactor: +scaleFactor.toFixed(4),
      materialThicknessMm: +materialThicknessMm.toFixed(2),
      slotDepthMm: +slotDepthMm.toFixed(1),
      slot1CenterXMm: +(slot1CenterX - marginX).toFixed(2),
      slot2CenterXMm: +(slot2CenterX - marginX).toFixed(2),
      balsaSheetWidthMm: 300,
      balsaSheetHeightMm: 100,
      fitsInStandardBalsaSheet,
      closedPathsCount: finalCutChildren.length,
      internalFacetPathsCount: finalEngraveChildren.length,
    },
  };
}
