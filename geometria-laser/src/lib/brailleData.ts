/**
 * Mapeo oficial del Alfabeto Braille en Español (Grado 1 / Integral)
 * Cada celda se compone de 6 puntos numerados:
 * 1 (arr-izq)   4 (arr-der)
 * 2 (med-izq)   5 (med-der)
 * 3 (abj-izq)   6 (abj-der)
 */

export interface BrailleCell {
  char: string; // Carácter original (ej. "A", "Ñ", "3")
  dots: number[]; // Lista de puntos activos, ej. [1, 2] para 'B'
  unicodeGlyph: string; // Carácter Unicode Braille oficial (ej. '⠃')
  isNumberPrefix?: boolean; // Si es la marca previa de número (#)
  isCapitalPrefix?: boolean; // Si es marca de mayúscula
}

// Diccionario de letras estándar (A-Z) y caracteres especiales en español
export const SPANISH_BRAILLE_MAP: Record<string, number[]> = {
  // Alfabeto básico
  A: [1],
  B: [1, 2],
  C: [1, 4],
  D: [1, 4, 5],
  E: [1, 5],
  F: [1, 2, 4],
  G: [1, 2, 4, 5],
  H: [1, 2, 5],
  I: [2, 4],
  J: [2, 4, 5],
  K: [1, 3],
  L: [1, 2, 3],
  M: [1, 3, 4],
  N: [1, 3, 4, 5],
  O: [1, 3, 5],
  P: [1, 2, 3, 4],
  Q: [1, 2, 3, 4, 5],
  R: [1, 2, 3, 5],
  S: [2, 3, 4],
  T: [2, 3, 4, 5],
  U: [1, 3, 6],
  V: [1, 2, 3, 6],
  W: [2, 4, 5, 6],
  X: [1, 3, 4, 6],
  Y: [1, 3, 4, 5, 6],
  Z: [1, 3, 5, 6],

  // Caracteres especiales del español
  Ñ: [1, 2, 4, 5, 6],
  Á: [1, 2, 3, 5, 6],
  É: [2, 3, 4, 6],
  Í: [3, 4],
  Ó: [3, 4, 6],
  Ú: [2, 3, 4, 5, 6],
  Ü: [1, 2, 5, 6],

  // Números (cuando se usa prefijo numérico [3, 4, 5, 6])
  '1': [1],
  '2': [1, 2],
  '3': [1, 4],
  '4': [1, 4, 5],
  '5': [1, 5],
  '6': [1, 2, 4],
  '7': [1, 2, 4, 5],
  '8': [1, 2, 5],
  '9': [2, 4],
  '0': [2, 4, 5],

  // Puntuación básica
  '.': [3],
  ',': [2],
  ';': [2, 3],
  ':': [2, 5],
  '-': [3, 6],
  '?': [2, 6],
  '¿': [2, 6],
  '!': [2, 3, 5],
  '¡': [2, 3, 5],
  ' ': []
};

// Prefijo numérico estándar en Braille: puntos 3, 4, 5, 6
export const BRAILLE_NUMBER_PREFIX = [3, 4, 5, 6];

/**
 * Convierte un arreglo de puntos activos [1..6] a su carácter Unicode Braille estándar (U+2800 .. U+283F)
 */
export function dotsToUnicode(dots: number[]): string {
  // En Unicode Braille:
  // bit 0 = punto 1 (0x01)
  // bit 1 = punto 2 (0x02)
  // bit 2 = punto 3 (0x04)
  // bit 3 = punto 4 (0x08)
  // bit 4 = punto 5 (0x10)
  // bit 5 = punto 6 (0x20)
  let mask = 0;
  for (const d of dots) {
    if (d >= 1 && d <= 6) {
      mask |= 1 << (d - 1);
    }
  }
  return String.fromCharCode(0x2800 + mask);
}

/**
 * Traduce un texto en español a una lista de celdas Braille con sus puntos y metadatos.
 * @param text Cadena de texto a traducir
 * @param includeNumberPrefix Si es true, añade la marca numérica antes de una secuencia de dígitos
 */
export function translateTextToBraille(text: string, includeNumberPrefix = true): BrailleCell[] {
  const result: BrailleCell[] = [];
  const upper = text.toUpperCase().trim();

  let inNumberMode = false;

  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i];

    // Detección de dígitos
    if (ch >= '0' && ch <= '9') {
      if (includeNumberPrefix && !inNumberMode) {
        result.push({
          char: '#',
          dots: BRAILLE_NUMBER_PREFIX,
          unicodeGlyph: dotsToUnicode(BRAILLE_NUMBER_PREFIX),
          isNumberPrefix: true
        });
        inNumberMode = true;
      }
      const dots = SPANISH_BRAILLE_MAP[ch] || [];
      result.push({
        char: ch,
        dots,
        unicodeGlyph: dotsToUnicode(dots)
      });
      continue;
    }

    // Salir del modo numérico ante cualquier otro carácter
    inNumberMode = false;

    if (ch === ' ') {
      result.push({
        char: ' ',
        dots: [],
        unicodeGlyph: ' '
      });
      continue;
    }

    const dots = SPANISH_BRAILLE_MAP[ch];
    if (dots) {
      result.push({
        char: ch,
        dots,
        unicodeGlyph: dotsToUnicode(dots)
      });
    } else {
      // Carácter desconocido: se omite o se coloca celda vacía
      console.warn(`Carácter no reconocido en Braille: "${ch}"`);
    }
  }

  return result;
}
