import { HELVETIKER_BOLD } from './helvetikerBold';

interface TypefaceGlyph {
  x_min: number;
  x_max: number;
  ha: number;
  o?: string;
}

const GLYPHS = HELVETIKER_BOLD.glyphs as Record<string, TypefaceGlyph>;
const RESOLUTION = HELVETIKER_BOLD.resolution || 1000;

/**
 * Mapa de descomposición para caracteres del español y símbolos matemáticos
 * que no vienen precompuestos en HELVETIKER_BOLD pero cuyos componentes sí existen.
 */
const ACCENTED_MAP: Record<
  string,
  { base: string; mark: 'acute' | 'tilde' | 'umlaut'; isUpper?: boolean; dotlessI?: boolean }
> = {
  á: { base: 'a', mark: 'acute' },
  é: { base: 'e', mark: 'acute' },
  í: { base: 'i', mark: 'acute', dotlessI: true },
  ó: { base: 'o', mark: 'acute' },
  ú: { base: 'u', mark: 'acute' },
  Á: { base: 'A', mark: 'acute', isUpper: true },
  É: { base: 'E', mark: 'acute', isUpper: true },
  Í: { base: 'I', mark: 'acute', isUpper: true },
  Ó: { base: 'O', mark: 'acute', isUpper: true },
  Ú: { base: 'U', mark: 'acute', isUpper: true },
  ñ: { base: 'n', mark: 'tilde' },
  Ñ: { base: 'N', mark: 'tilde', isUpper: true },
  ü: { base: 'u', mark: 'umlaut' },
  Ü: { base: 'U', mark: 'umlaut', isUpper: true },
};

const SYMBOL_SUBSTITUTIONS: Record<string, string> = {
  '×': 'x',
  '⋅': '•',
  '·': '•',
  '−': '-',
  '–': '-',
  'φ': 'Φ',
  'π': 'Π',
};

function convertOutlineTokensToSvgD(
  outline: string,
  offsetX: number,
  baselineY: number,
  scale: number
): string {
  if (!outline || !outline.trim()) return '';
  const tokens = outline.trim().split(/\s+/);
  const parts: string[] = [];
  let i = 0;
  let hasOpenSubpath = false;

  const fx = (val: number) => (offsetX + val * scale).toFixed(2);
  const fy = (val: number) => (baselineY - val * scale).toFixed(2);

  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === 'm') {
      if (hasOpenSubpath) parts.push('Z');
      const x = Number(tokens[i++]);
      const y = Number(tokens[i++]);
      parts.push(`M ${fx(x)} ${fy(y)}`);
      hasOpenSubpath = true;
    } else if (cmd === 'l') {
      const x = Number(tokens[i++]);
      const y = Number(tokens[i++]);
      parts.push(`L ${fx(x)} ${fy(y)}`);
    } else if (cmd === 'q') {
      // En typeface.json de Three.js: q endX endY ctrlX ctrlY
      const ex = Number(tokens[i++]);
      const ey = Number(tokens[i++]);
      const cx = Number(tokens[i++]);
      const cy = Number(tokens[i++]);
      parts.push(`Q ${fx(cx)} ${fy(cy)} ${fx(ex)} ${fy(ey)}`);
    } else {
      // Ignorar token desconocido
    }
  }
  if (hasOpenSubpath) parts.push('Z');
  return parts.join(' ');
}

function buildDiacriticSvgD(
  mark: 'acute' | 'tilde' | 'umlaut',
  centerUnitX: number,
  topUnitY: number,
  offsetX: number,
  baselineY: number,
  scale: number
): string {
  const fx = (u: number) => (offsetX + u * scale).toFixed(2);
  const fy = (u: number) => (baselineY - u * scale).toFixed(2);

  if (mark === 'acute') {
    // Tilde aguda limpia e inclinada
    const x1 = centerUnitX - 85;
    const y1 = topUnitY + 75;
    const x2 = centerUnitX + 35;
    const y2 = topUnitY + 75;
    const x3 = centerUnitX + 165;
    const y3 = topUnitY + 265;
    const x4 = centerUnitX + 5;
    const y4 = topUnitY + 265;
    return `M ${fx(x1)} ${fy(y1)} L ${fx(x2)} ${fy(y2)} L ${fx(x3)} ${fy(y3)} L ${fx(x4)} ${fy(y4)} Z`;
  }

  if (mark === 'tilde') {
    const tildeGlyph = GLYPHS['~'];
    if (tildeGlyph?.o) {
      const w = (tildeGlyph.x_max || 850) - (tildeGlyph.x_min || 0);
      const tScale = scale * 0.72;
      const tOffX = offsetX + (centerUnitX * scale - (w * tScale) / 2);
      const tBaseY = baselineY - (topUnitY - 430) * scale;
      return convertOutlineTokensToSvgD(tildeGlyph.o, tOffX, tBaseY, tScale);
    }
  }

  if (mark === 'umlaut') {
    const r = 70;
    const y = topUnitY + 145;
    const lx = centerUnitX - 150;
    const rx = centerUnitX + 70;
    return (
      `M ${fx(lx)} ${fy(y)} L ${fx(lx + r * 2)} ${fy(y)} L ${fx(lx + r * 2)} ${fy(y + r * 2)} L ${fx(lx)} ${fy(y + r * 2)} Z ` +
      `M ${fx(rx)} ${fy(y)} L ${fx(rx + r * 2)} ${fy(y)} L ${fx(rx + r * 2)} ${fy(y + r * 2)} L ${fx(rx)} ${fy(y + r * 2)} Z`
    );
  }

  return '';
}

export interface VectorTextOptions {
  x: number;
  y: number;
  fontSizeMm: number;
  align?: 'left' | 'center' | 'right';
  baseline?: 'middle' | 'alphabetic' | 'hanging';
  rotateDeg?: number;
  fill?: string;
  letterSpacingMm?: number;
}

/**
 * Convierte cualquier cadena de texto (incluyendo tildes en español, exponentes ²/³, grados ° y letras griegas)
 * en un elemento <path> vectorial 100% independiente de fuentes instaladas.
 * Garantiza compatibilidad universal en LightBurn, LaserGRBL, Creality Falcon Design Space e Inkscape.
 */
export function renderVectorText(text: string, options: VectorTextOptions): string {
  if (!text) return '';

  const {
    x,
    y,
    fontSizeMm,
    align = 'center',
    baseline = 'middle',
    rotateDeg = 0,
    fill = '#000000',
    letterSpacingMm = 0,
  } = options;

  const scale = fontSizeMm / RESOLUTION;
  const chars = Array.from(text);

  // 1. Medir avance horizontal total
  let totalWidthMm = 0;
  const resolved = chars.map((rawChar) => {
    const sub = SYMBOL_SUBSTITUTIONS[rawChar] ?? rawChar;
    const accented = ACCENTED_MAP[sub];
    const lookupChar = accented ? accented.base : sub;
    const glyph = GLYPHS[lookupChar] || GLYPHS[' '];
    const advanceMm = (glyph?.ha ?? 450) * scale;
    return { rawChar, accented, lookupChar, glyph, advanceMm };
  });

  resolved.forEach((item, idx) => {
    totalWidthMm += item.advanceMm;
    if (idx < resolved.length - 1) totalWidthMm += letterSpacingMm;
  });

  // Renderizamos en coordenadas locales alrededor de (0, 0) si hay rotación, o directas
  const useTransform = Math.abs(rotateDeg) > 0.01;
  const anchorX = useTransform ? 0 : x;
  const anchorY = useTransform ? 0 : y;

  let startX = anchorX;
  if (align === 'center') startX = anchorX - totalWidthMm / 2;
  else if (align === 'right') startX = anchorX - totalWidthMm;

  const capHeightMm = 1013 * scale;
  let baselineY = anchorY;
  if (baseline === 'middle') baselineY = anchorY + capHeightMm * 0.36;
  else if (baseline === 'hanging') baselineY = anchorY + capHeightMm;

  const dSegments: string[] = [];
  let cursorX = startX;

  for (let idx = 0; idx < resolved.length; idx++) {
    const { accented, glyph, advanceMm } = resolved[idx];
    if (glyph?.o) {
      if (accented?.dotlessI) {
        // Tallo vertical de 'i' sin punto superior (0 a 748) para poner tilde limpia encima
        const fx = (u: number) => (cursorX + u * scale).toFixed(2);
        const fy = (u: number) => (baselineY - u * scale).toFixed(2);
        dSegments.push(`M ${fx(214)} ${fy(0)} L ${fx(14)} ${fy(0)} L ${fx(14)} ${fy(748)} L ${fx(214)} ${fy(748)} Z`);
      } else {
        const d = convertOutlineTokensToSvgD(glyph.o, cursorX, baselineY, scale);
        if (d) dSegments.push(d);
      }

      if (accented) {
        const centerUnitX = ((glyph.x_min ?? 0) + (glyph.x_max ?? 600)) / 2;
        const topUnitY = accented.isUpper ? 1025 : 765;
        const markD = buildDiacriticSvgD(
          accented.mark,
          centerUnitX,
          topUnitY,
          cursorX,
          baselineY,
          scale
        );
        if (markD) dSegments.push(markD);
      }
    }
    cursorX += advanceMm + letterSpacingMm;
  }

  if (dSegments.length === 0) return '';
  const fullD = dSegments.join(' ');
  const transformAttr = useTransform
    ? ` transform="translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${rotateDeg.toFixed(2)})"`
    : '';

  return `<path d="${fullD}" fill="${fill}" fill-rule="evenodd"${transformAttr} />`;
}
