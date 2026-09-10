import { SignDefinition } from '@/types';

/**
 * Mapeo de coordenadas de recorte de la ilustración oficial chilena
 * 'public/signs/senas-chile.jpg' (Alfabeto Manual Chileno).
 * Imagen base: 452 x 678 px, dividida en 6 columnas y 5 filas.
 */
export const CHILEAN_SPRITE_OFFSETS: Record<string, { x: number; y: number; width: number; height: number }> = {
  A: { x: 15, y: 90, width: 60, height: 72 },
  B: { x: 80, y: 84, width: 68, height: 78 },
  C: { x: 150, y: 90, width: 75, height: 72 },
  D: { x: 302, y: 88, width: 68, height: 74 },
  E: { x: 376, y: 88, width: 72, height: 74 },

  F: { x: 15, y: 195, width: 65, height: 75 },
  G: { x: 80, y: 195, width: 68, height: 75 },
  H: { x: 152, y: 200, width: 75, height: 70 },
  I: { x: 228, y: 195, width: 68, height: 75 },
  J: { x: 304, y: 195, width: 72, height: 75 },
  K: { x: 376, y: 195, width: 72, height: 75 },

  L: { x: 15, y: 300, width: 65, height: 75 },
  M: { x: 152, y: 300, width: 72, height: 75 },
  N: { x: 228, y: 300, width: 72, height: 75 },
  Ñ: { x: 304, y: 295, width: 72, height: 80 },
  O: { x: 378, y: 300, width: 72, height: 75 },

  P: { x: 15, y: 405, width: 65, height: 75 },
  Q: { x: 80, y: 400, width: 70, height: 75 },
  R: { x: 152, y: 400, width: 72, height: 75 },
  S: { x: 304, y: 395, width: 72, height: 80 },
  T: { x: 378, y: 395, width: 72, height: 80 },

  U: { x: 15, y: 505, width: 65, height: 80 },
  V: { x: 80, y: 505, width: 68, height: 80 },
  W: { x: 152, y: 505, width: 72, height: 80 },
  X: { x: 228, y: 505, width: 72, height: 80 },
  Y: { x: 304, y: 505, width: 72, height: 80 },
  Z: { x: 378, y: 505, width: 72, height: 80 }
};

/**
 * Devuelve el estilo CSS para renderizar la ilustración recortada de la seña chilena
 */
export function getChileanSpriteStyle(letter: string, scaleMultiplier = 1): React.CSSProperties {
  const sprite = CHILEAN_SPRITE_OFFSETS[letter.toUpperCase()];
  if (!sprite) {
    return {};
  }
  const baseWidth = 452 * scaleMultiplier;
  const baseHeight = 678 * scaleMultiplier;
  const posX = -sprite.x * scaleMultiplier;
  const posY = -sprite.y * scaleMultiplier;

  return {
    backgroundImage: 'url(/signs/senas-chile.jpg)',
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${baseWidth}px ${baseHeight}px`,
    backgroundPosition: `${posX}px ${posY}px`,
    width: `${sprite.width * scaleMultiplier}px`,
    height: `${sprite.height * scaleMultiplier}px`
  };
}

/**
 * Catálogo vectorial del Alfabeto Manual Chileno (LSCh).
 * Calibrado fielmente a la guía gráfica chilena oficial:
 * - A: Puño cerrado frente.
 * - B: Cuatro dedos estirados juntos, pulgar doblado en palma.
 * - C: Mano curvada formando una C.
 * - D: Índice arriba, demás dedos en círculo.
 * - E: Dedos curvados arriba, pulgar estirado hacia el lado.
 * - F: Índice y medio juntos erguidos con pulgar tocándolos.
 * - G: Índice y pulgar en gancho semicircular giratorio.
 * - H: Índice y medio horizontales paralelos.
 * - I: Dedo meñique erguido.
 * - J: Meñique con curva trazada.
 * - K: Mano lateral con índice y medio horizontales en V y pulgar entre ambos.
 * - L: Índice arriba y pulgar en 90°.
 * - M: Tres dedos colgando hacia abajo.
 * - N: Dos dedos colgando hacia abajo.
 * - Ñ: Dos dedos colgando con movimiento ondulante.
 * - O: Dedos formando círculo O.
 * - P: Mano hacia abajo, índice adelante y medio abajo con pulgar entre ambos.
 * - Q: Dedo índice apuntando a la barbilla/mejilla.
 * - R: Índice y medio cruzados.
 * - S: Dedo índice arriba describiendo una S con flecha circular.
 * - T: Dedo índice apuntando y tocando los labios/boca.
 * - U: Gesto chileno característico: índice y meñique arriba ("señal de cuernos"), medio y anular doblados.
 * - V: Índice y medio en V abierta (paz).
 * - W: Tres dedos en W abierta.
 * - X: Dedos cruzados con flecha en cruz.
 * - Y: Pulgar y meñique extendidos (shaka).
 * - Z: Índice trazando una Z en zigzag.
 */
export const SIGNS_DICTIONARY: Record<string, SignDefinition> = {
  A: {
    letter: 'A',
    name: 'Letra A',
    description: 'Puño cerrado con los dedos hacia el frente y el pulgar apoyado al costado.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 92 14 78 14 62 C 14 46 22 38 32 38 C 36 38 40 42 42 48 C 44 32 54 28 66 28 C 76 28 84 36 84 50 L 84 80 C 84 95 78 110 72 130 Z',
    innerPaths: [
      'M 32 38 C 24 48 24 72 36 86',
      'M 22 55 C 28 58 34 65 36 78',
      'M 42 50 C 52 48 72 48 82 52',
      'M 42 66 C 54 64 72 64 82 68',
      'M 40 82 C 52 80 70 80 80 84',
      'M 58 28 L 58 48',
      'M 72 30 L 72 50'
    ]
  },
  B: {
    letter: 'B',
    name: 'Letra B',
    description: 'Cuatro dedos bien estirados juntos hacia arriba, pulgar doblado sobre la palma.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 90 18 78 22 66 C 26 58 32 60 36 68 L 36 24 C 36 14 44 12 50 12 C 56 12 62 14 64 24 L 76 24 C 82 24 86 30 86 38 L 86 90 C 84 105 78 115 72 130 Z',
    innerPaths: [
      'M 48 14 L 48 75',
      'M 60 16 L 60 75',
      'M 72 24 L 72 78',
      'M 24 72 C 34 76 52 74 58 64 C 54 58 42 58 36 68',
      'M 38 38 L 82 38',
      'M 38 52 L 84 52'
    ]
  },
  C: {
    letter: 'C',
    name: 'Letra C',
    description: 'Mano curvada de perfil formando la letra C con todos los dedos juntos.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 90 20 70 30 50 C 42 30 65 24 82 34 C 88 38 88 46 82 50 C 74 54 62 45 50 50 C 38 56 38 74 48 80 C 58 85 70 78 78 82 C 84 86 82 96 74 100 C 58 108 38 106 32 100 L 72 130 Z',
    innerPaths: [
      'M 76 42 C 65 34 50 38 42 50 C 34 62 34 75 42 85 C 52 94 66 94 74 88',
      'M 58 36 C 64 42 70 46 76 50',
      'M 48 45 C 54 52 62 56 70 60',
      'M 52 86 C 58 82 66 82 72 86'
    ]
  },
  D: {
    letter: 'D',
    name: 'Letra D',
    description: 'Dedo índice estirado verticalmente hacia arriba, pulgar tocando las yemas formando un círculo.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 18 68 28 56 C 36 48 46 50 50 60 L 50 20 C 50 10 60 10 64 20 L 64 58 C 74 58 84 66 84 78 C 84 94 76 108 72 130 Z',
    innerPaths: [
      'M 42 66 C 34 72 34 84 42 90 C 52 96 66 94 70 82 C 72 74 66 66 56 66 Z',
      'M 50 38 L 64 38',
      'M 50 52 L 64 52',
      'M 46 66 L 56 66'
    ]
  },
  E: {
    letter: 'E',
    name: 'Letra E (Chilena)',
    description: 'Dedos encorvados arriba en forma de garra y pulgar estirado abiertamente hacia el lado derecho.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 92 20 78 22 62 C 24 48 34 36 50 36 C 66 36 78 44 80 56 L 80 62 L 96 64 C 102 66 100 76 92 78 L 78 78 C 76 90 74 105 72 130 Z',
    innerPaths: [
      'M 36 40 C 36 52 38 64 38 72',
      'M 50 38 C 50 52 52 64 52 72',
      'M 64 40 C 64 52 66 64 66 72',
      'M 76 44 C 76 54 76 64 76 72',
      'M 68 72 L 96 72'
    ]
  },
  F: {
    letter: 'F',
    name: 'Letra F',
    description: 'Dedos índice y medio estirados juntos hacia arriba, pulgar tocándolos en la base.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 18 88 18 70 26 60 C 34 52 42 56 46 66 L 46 22 C 46 12 56 12 58 22 L 58 20 C 60 10 70 10 72 20 L 72 65 C 78 68 84 76 84 86 L 72 130 Z',
    innerPaths: [
      'M 58 22 L 58 68',
      'M 30 68 C 30 60 38 56 44 64 C 48 72 44 82 36 82',
      'M 48 40 L 72 40',
      'M 48 54 L 72 54'
    ]
  },
  G: {
    letter: 'G',
    name: 'Letra G',
    description: 'Índice y pulgar curvados formando un semicírculo con movimiento rotatorio.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 90 20 74 24 58 C 28 44 42 40 56 42 C 68 44 76 52 76 64 C 76 74 68 82 58 84 L 72 130 Z',
    innerPaths: [
      'M 42 52 C 50 48 64 50 66 60 C 66 70 52 72 46 68',
      'M 30 72 C 38 70 48 72 52 80',
      'M 76 56 C 82 60 84 68 80 74'
    ]
  },
  H: {
    letter: 'H',
    name: 'Letra H',
    description: 'Dedos índice y medio extendidos juntos horizontalmente hacia el lado.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 20 68 28 55 C 36 45 46 45 52 45 L 88 45 C 96 45 96 75 88 75 L 56 75 C 50 88 44 105 72 130 Z',
    innerPaths: [
      'M 48 60 L 92 60',
      'M 30 64 C 40 64 48 72 46 84',
      'M 34 84 C 42 82 48 88 48 96'
    ]
  },
  I: {
    letter: 'I',
    name: 'Letra I',
    description: 'Dedo meñique estirado hacia arriba, los demás dedos cerrados en puño.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 90 20 74 24 58 C 28 46 40 44 48 48 C 54 48 62 48 70 48 L 70 20 C 70 10 82 10 84 20 L 84 85 C 80 105 76 115 72 130 Z',
    innerPaths: [
      'M 70 50 L 70 85',
      'M 72 35 L 82 35',
      'M 26 62 C 38 60 56 64 62 76 C 58 84 40 84 30 80',
      'M 40 50 C 48 50 60 52 66 58'
    ]
  },
  J: {
    letter: 'J',
    name: 'Letra J',
    description: 'Dedo meñique estirado trazando una curva o anzuelo en el aire.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 90 20 74 24 58 C 28 46 40 44 48 48 C 54 48 62 48 68 48 L 68 28 C 68 18 78 12 86 16 C 92 20 90 30 84 34 L 80 85 C 78 105 76 115 72 130 Z',
    innerPaths: [
      'M 70 50 L 70 85',
      'M 70 30 C 76 24 84 24 84 32',
      'M 26 62 C 38 60 56 64 62 76',
      'M 86 42 C 92 48 90 56 82 60'
    ]
  },
  K: {
    letter: 'K',
    name: 'Letra K (Chilena)',
    description: 'Mano orientada de lado con índice y medio extendidos en V horizontal y pulgar entre ellos.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 20 68 28 55 L 72 30 C 80 25 88 32 82 40 L 64 52 L 86 64 C 92 68 90 78 82 80 L 50 82 L 72 130 Z',
    innerPaths: [
      'M 42 56 L 82 38',
      'M 46 64 L 84 72',
      'M 34 68 C 42 66 52 68 56 76'
    ]
  },
  L: {
    letter: 'L',
    name: 'Letra L',
    description: 'Dedo índice hacia arriba y pulgar en ángulo recto de 90° formando una L.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 92 18 84 14 74 C 10 65 14 58 24 58 L 50 64 L 50 18 C 50 8 62 8 64 18 L 64 70 C 76 72 82 82 82 92 L 72 130 Z',
    innerPaths: [
      'M 26 62 L 52 68',
      'M 52 20 L 52 70',
      'M 52 38 L 64 38',
      'M 54 75 C 64 75 74 78 76 88'
    ]
  },
  M: {
    letter: 'M',
    name: 'Letra M',
    description: 'Tres dedos (índice, medio y anular) colgando relajados hacia abajo sobre el pulgar.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 92 18 78 20 60 C 22 45 32 36 44 36 C 52 36 60 40 68 40 C 76 40 84 48 84 62 L 82 95 L 72 130 Z',
    innerPaths: [
      'M 40 38 L 40 85',
      'M 56 38 L 56 85',
      'M 70 42 L 70 85',
      'M 24 78 C 34 76 68 76 74 88',
      'M 30 55 L 80 55'
    ]
  },
  N: {
    letter: 'N',
    name: 'Letra N',
    description: 'Dos dedos (índice y medio) colgando relajados hacia abajo sobre el pulgar.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 92 18 78 20 60 C 22 45 34 38 48 38 C 62 38 74 44 76 58 L 76 95 L 72 130 Z',
    innerPaths: [
      'M 48 40 L 48 85',
      'M 64 42 L 64 85',
      'M 24 78 C 36 76 60 76 68 88',
      'M 30 56 L 72 56'
    ]
  },
  Ñ: {
    letter: 'Ñ',
    name: 'Letra Ñ (Chilena)',
    description: 'Dos dedos colgando hacia abajo con suave movimiento de vaivén u ola.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 92 18 78 20 60 C 22 45 34 38 48 38 C 62 38 74 44 76 58 L 76 95 L 72 130 Z',
    innerPaths: [
      'M 30 20 C 42 14 50 26 64 20 C 70 16 76 18 80 22',
      'M 48 40 L 48 85',
      'M 64 42 L 64 85',
      'M 24 78 C 36 76 60 76 68 88',
      'M 30 56 L 72 56'
    ]
  },
  O: {
    letter: 'O',
    name: 'Letra O',
    description: 'Todos los dedos curvados tocando la yema del pulgar formando un círculo O.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 18 68 24 52 C 32 34 56 28 72 34 C 84 40 88 56 86 70 C 84 88 78 105 72 130 Z',
    innerPaths: [
      'M 48 52 C 40 56 38 70 46 76 C 54 82 66 78 68 68 C 70 58 60 48 48 52 Z',
      'M 54 34 C 62 40 68 45 74 52',
      'M 36 48 C 44 54 50 60 56 66'
    ]
  },
  P: {
    letter: 'P',
    name: 'Letra P',
    description: 'Mano orientada hacia abajo con índice horizontal al frente y medio apuntando al suelo.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 88 20 70 28 55 C 38 45 56 45 66 52 L 86 52 C 92 52 94 62 86 66 L 68 66 L 68 96 C 68 104 58 104 56 96 L 56 75 C 50 85 44 105 72 130 Z',
    innerPaths: [
      'M 56 70 L 56 96',
      'M 60 54 L 86 54',
      'M 32 64 C 44 62 54 62 58 72'
    ]
  },
  Q: {
    letter: 'Q (Chilena)',
    name: 'Letra Q (Chilena)',
    description: 'Dedo índice apuntando hacia la barbilla o mejilla.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 22 70 30 58 L 56 26 C 62 20 72 26 68 34 L 50 62 L 68 62 C 78 66 82 78 80 92 L 72 130 Z',
    innerPaths: [
      'M 56 32 L 48 58',
      'M 32 70 C 42 68 56 70 60 80',
      'M 68 40 C 78 44 86 48 90 56'
    ]
  },
  R: {
    letter: 'R',
    name: 'Letra R',
    description: 'Dedos índice y medio cruzados hacia arriba (signo de suerte).',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 20 68 26 55 C 34 46 44 48 48 58 L 48 22 C 48 12 58 10 64 20 L 70 20 C 76 12 84 16 82 26 L 68 58 C 76 68 80 82 78 95 L 72 130 Z',
    innerPaths: [
      'M 50 48 L 74 18',
      'M 66 42 L 52 20',
      'M 28 66 C 40 64 54 68 58 80'
    ]
  },
  S: {
    letter: 'S (Chilena)',
    name: 'Letra S (Chilena)',
    description: 'Dedo índice estirado hacia arriba describiendo una letra S en el aire.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 20 68 26 56 C 34 46 44 48 48 58 L 48 20 C 48 10 58 10 62 20 L 62 58 C 72 62 78 72 78 86 L 72 130 Z',
    innerPaths: [
      'M 48 36 L 62 36',
      'M 48 50 L 62 50',
      'M 72 26 C 80 20 88 28 82 36 C 76 44 88 48 84 56',
      'M 28 66 C 40 64 54 68 58 80'
    ]
  },
  T: {
    letter: 'T (Chilena)',
    name: 'Letra T (Chilena)',
    description: 'Dedo índice estirado tocando los labios o la boca.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 20 68 26 56 C 34 46 44 48 48 58 L 48 16 C 48 8 58 8 62 16 L 62 58 C 72 62 78 72 78 86 L 72 130 Z',
    innerPaths: [
      'M 48 36 L 62 36',
      'M 48 50 L 62 50',
      'M 40 12 C 54 6 68 6 80 12',
      'M 28 66 C 40 64 54 68 58 80'
    ]
  },
  U: {
    letter: 'U (Chilena)',
    name: 'Letra U (Chilena)',
    description: 'Gesto chileno tradicional: dedos índice y meñique erguidos (cuernos), medio y anular plegados.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 92 18 78 20 64 L 20 22 C 20 12 32 12 34 22 L 34 60 C 40 56 62 56 68 60 L 68 22 C 68 12 80 12 82 22 L 82 86 C 80 105 76 115 72 130 Z',
    innerPaths: [
      'M 20 40 L 34 40',
      'M 68 40 L 82 40',
      'M 34 65 C 44 60 58 60 68 65',
      'M 34 78 C 44 76 58 76 68 80'
    ]
  },
  V: {
    letter: 'V',
    name: 'Letra V',
    description: 'Dedos índice y medio estirados y abiertos en forma de V (símbolo de paz).',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 20 68 26 55 C 32 44 40 48 44 58 L 34 20 C 32 10 44 6 48 16 L 56 46 L 68 16 C 72 6 84 10 82 20 L 72 68 C 80 75 82 85 80 95 L 72 130 Z',
    innerPaths: [
      'M 46 46 L 56 66 L 68 46',
      'M 36 28 L 46 32',
      'M 70 32 L 80 28',
      'M 28 66 C 38 64 54 68 58 80'
    ]
  },
  W: {
    letter: 'W',
    name: 'Letra W',
    description: 'Tres dedos erguidos y separados (índice, medio y anular) formando una W.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 20 70 26 58 C 30 50 36 54 38 62 L 32 24 C 30 14 40 10 44 20 L 50 50 L 56 16 C 58 6 68 6 70 16 L 74 50 L 80 24 C 84 14 94 18 92 28 L 84 75 L 72 130 Z',
    innerPaths: [
      'M 42 46 L 48 64 L 54 46',
      'M 66 46 L 72 64 L 78 46',
      'M 28 68 C 36 66 50 72 54 82'
    ]
  },
  X: {
    letter: 'X',
    name: 'Letra X',
    description: 'Dedo índice encorvado o dedos cruzados formando una X.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 20 68 26 55 C 32 44 42 46 48 54 L 52 30 C 56 22 68 22 74 28 C 78 34 76 42 68 46 L 62 62 C 72 68 78 78 78 92 L 72 130 Z',
    innerPaths: [
      'M 52 36 C 58 32 66 32 68 38 C 70 44 64 50 58 52',
      'M 28 66 C 40 64 54 68 58 80',
      'M 40 82 C 50 82 66 84 72 90'
    ]
  },
  Y: {
    letter: 'Y',
    name: 'Letra Y',
    description: 'Pulgar y meñique bien extendidos (shaka / "hang loose"), los demás dedos doblados.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 92 14 84 10 74 C 6 64 12 55 22 58 L 38 68 C 40 54 50 46 64 46 C 70 46 76 50 78 58 L 88 40 C 94 30 104 36 100 46 L 86 86 C 82 105 78 115 72 130 Z',
    innerPaths: [
      'M 20 62 L 40 74',
      'M 76 60 L 94 44',
      'M 42 62 C 48 60 58 60 62 70',
      'M 42 74 C 50 72 62 72 66 82'
    ]
  },
  Z: {
    letter: 'Z',
    name: 'Letra Z',
    description: 'Dedo índice estirado trazando una letra Z en zigzag en el aire.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 20 68 26 56 C 34 46 44 48 48 58 L 48 20 C 48 10 58 10 62 20 L 62 58 C 72 62 78 72 78 86 L 72 130 Z',
    innerPaths: [
      'M 48 36 L 62 36',
      'M 48 50 L 62 50',
      'M 68 24 L 88 24 L 72 44 L 92 44',
      'M 28 66 C 40 64 54 68 58 80'
    ]
  }
};

/**
 * Normaliza una cadena de texto a letras admitidas por el catálogo.
 * Transforma tildes (Á -> A, etc.) y mantiene la Ñ intacta.
 */
export function normalizeText(text: string): string[] {
  return text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, (match, offset, str) => {
      if (str[offset - 1] === 'N') return match;
      return '';
    })
    .normalize('NFC')
    .split('')
    .filter((char) => (char >= 'A' && char <= 'Z') || char === 'Ñ' || char === ' ');
}
