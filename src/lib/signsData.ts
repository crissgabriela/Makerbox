import { SignDefinition } from '@/types';

/**
 * Catálogo vectorial de Dactilología (Alfabeto en Lengua de Señas).
 * Diseñado en un sistema de coordenadas uniforme: viewBox="0 0 100 130"
 * Cada seña cuenta con:
 * - outerPath: Silueta perimetral exterior cerrada (para corte o fusión).
 * - innerPaths: Trazos interiores de articulaciones, pliegues y dedos (para grabado láser).
 * - wristAnchor: Coordenadas [xStart, xEnd] a la altura de la muñeca (y=130) para unión a la barra base.
 */
export const SIGNS_DICTIONARY: Record<string, SignDefinition> = {
  A: {
    letter: 'A',
    name: 'Seña A',
    description: 'Puño cerrado con el pulgar erguido a un lado apuntando hacia arriba.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 92 14 78 14 62 C 14 46 22 38 32 38 C 36 38 40 42 42 48 C 44 32 54 28 66 28 C 76 28 84 36 84 50 L 84 80 C 84 95 78 110 72 130 Z',
    innerPaths: [
      // Pulgar apoyado al costado
      'M 32 38 C 24 48 24 72 36 86',
      'M 22 55 C 28 58 34 65 36 78',
      // Pliegues de los 4 dedos cerrados en el puño
      'M 42 50 C 52 48 72 48 82 52',
      'M 42 66 C 54 64 72 64 82 68',
      'M 40 82 C 52 80 70 80 80 84',
      'M 38 98 C 50 96 68 96 76 98',
      // Nudillos
      'M 58 28 L 58 48',
      'M 72 30 L 72 50'
    ]
  },
  B: {
    letter: 'B',
    name: 'Seña B',
    description: 'Cuatro dedos estirados juntos hacia arriba, pulgar doblado sobre la palma.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 90 18 78 22 66 C 26 58 32 60 36 68 L 36 24 C 36 14 44 12 50 12 C 56 12 62 14 64 24 L 76 24 C 82 24 86 30 86 38 L 86 90 C 84 105 78 115 72 130 Z',
    innerPaths: [
      // Separaciones entre los 4 dedos estirados
      'M 48 14 L 48 75',
      'M 60 16 L 60 75',
      'M 72 24 L 72 78',
      // Pulgar plegado horizontalmente sobre la palma
      'M 24 72 C 34 76 52 74 58 64 C 54 58 42 58 36 68',
      // Pliegues de los nudillos superiores
      'M 38 38 L 82 38',
      'M 38 52 L 84 52'
    ]
  },
  C: {
    letter: 'C',
    name: 'Seña C',
    description: 'Mano curvada de perfil formando la letra C abierta hacia la izquierda o frente.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 90 20 70 30 50 C 42 30 65 24 82 34 C 88 38 88 46 82 50 C 74 54 62 45 50 50 C 38 56 38 74 48 80 C 58 85 70 78 78 82 C 84 86 82 96 74 100 C 58 108 38 106 32 100 L 72 130 Z',
    innerPaths: [
      // Curva interior de los dedos formando la C
      'M 76 42 C 65 34 50 38 42 50 C 34 62 34 75 42 85 C 52 94 66 94 74 88',
      // Líneas de los dedos juntos en arco
      'M 58 36 C 64 42 70 46 76 50',
      'M 48 45 C 54 52 62 56 70 60',
      'M 52 86 C 58 82 66 82 72 86'
    ]
  },
  D: {
    letter: 'D',
    name: 'Seña D',
    description: 'Dedo índice estirado verticalmente, los demás dedos forman un círculo con el pulgar.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 18 68 28 56 C 36 48 46 50 50 60 L 50 20 C 50 10 60 10 64 20 L 64 58 C 74 58 84 66 84 78 C 84 94 76 108 72 130 Z',
    innerPaths: [
      // Círculo formado por pulgar, mayor, anular y meñique
      'M 42 66 C 34 72 34 84 42 90 C 52 96 66 94 70 82 C 72 74 66 66 56 66 Z',
      // Detalle del índice vertical
      'M 50 38 L 64 38',
      'M 50 52 L 64 52',
      // Líneas de las yemas tocándose
      'M 46 66 L 56 66'
    ]
  },
  E: {
    letter: 'E',
    name: 'Seña E',
    description: 'Dedos doblados hacia abajo con las yemas apoyadas sobre el pulgar retraído.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 92 18 78 20 62 C 22 48 30 38 46 36 C 62 34 78 38 82 50 C 86 62 82 78 80 92 L 72 130 Z',
    innerPaths: [
      // Yemas de los 4 dedos curvadas hacia abajo
      'M 36 38 C 36 50 38 60 38 68',
      'M 50 36 C 50 50 52 60 52 68',
      'M 64 36 C 64 50 66 60 66 68',
      'M 76 42 C 76 52 76 62 76 68',
      // Pulgar doblado por debajo sosteniendo las yemas
      'M 24 76 C 34 72 68 70 78 74 C 74 82 46 84 28 86',
      // Pliegue inferior de palma
      'M 34 96 C 46 98 64 98 72 96'
    ]
  },
  F: {
    letter: 'F',
    name: 'Seña F',
    description: 'Índice y pulgar tocándose en círculo, los otros tres dedos erguidos hacia arriba.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 18 88 18 70 26 60 C 34 52 42 56 46 66 L 46 22 C 46 12 56 12 58 22 L 58 20 C 60 10 70 10 72 20 L 72 28 C 76 20 84 22 86 32 L 86 85 C 82 102 76 114 72 130 Z',
    innerPaths: [
      // Separación de los 3 dedos estirados
      'M 58 22 L 58 68',
      'M 72 24 L 72 70',
      // Círculo formado entre índice y pulgar
      'M 30 68 C 30 60 38 56 44 64 C 48 72 44 82 36 82 C 30 80 28 74 30 68 Z',
      // Pliegues
      'M 48 40 L 84 40',
      'M 48 54 L 84 54'
    ]
  },
  G: {
    letter: 'G',
    name: 'Seña G',
    description: 'Índice extendido hacia el lado/frente y pulgar paralelo apuntando en la misma dirección.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 90 20 74 24 60 C 26 48 36 44 44 48 L 88 48 C 96 48 96 60 88 62 L 66 62 C 68 68 76 68 86 68 C 92 68 92 78 86 80 L 56 82 C 48 92 42 108 72 130 Z',
    innerPaths: [
      // Separación entre índice y pulgar extendidos
      'M 46 62 L 86 62',
      // Otros 3 dedos plegados en puño
      'M 28 72 C 36 70 46 72 50 82',
      'M 32 86 C 40 84 48 86 52 94',
      // Uña de índice
      'M 82 50 L 82 60'
    ]
  },
  H: {
    letter: 'H',
    name: 'Seña H',
    description: 'Dedos índice y medio extendidos juntos horizontalmente, pulgar replegado.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 20 68 28 55 C 36 45 46 45 52 45 L 88 45 C 96 45 96 75 88 75 L 56 75 C 50 88 44 105 72 130 Z',
    innerPaths: [
      // Línea divisoria entre índice y medio horizontales
      'M 48 60 L 92 60',
      // Pulgar doblado sobre anular y meñique
      'M 30 64 C 40 64 48 72 46 84',
      'M 34 84 C 42 82 48 88 48 96'
    ]
  },
  I: {
    letter: 'I',
    name: 'Seña I',
    description: 'Dedo meñique estirado hacia arriba, los demás dedos cerrados en puño.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 90 20 74 24 58 C 28 46 40 44 48 48 C 54 48 62 48 70 48 L 70 20 C 70 10 82 10 84 20 L 84 85 C 80 105 76 115 72 130 Z',
    innerPaths: [
      // Meñique vertical
      'M 70 50 L 70 85',
      'M 72 35 L 82 35',
      // Pulgar apoyado sobre los dedos índice, medio y anular en puño
      'M 26 62 C 38 60 56 64 62 76 C 58 84 40 84 30 80',
      'M 40 50 C 48 50 60 52 66 58',
      'M 40 68 C 48 68 62 70 66 78'
    ]
  },
  J: {
    letter: 'J',
    name: 'Seña J',
    description: 'Meñique extendido dibujando una curva o anzuelo en el aire.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 90 20 74 24 58 C 28 46 40 44 48 48 C 54 48 62 48 68 48 L 68 28 C 68 18 78 12 86 16 C 92 20 90 30 84 34 L 80 85 C 78 105 76 115 72 130 Z',
    innerPaths: [
      // Trazo del meñique con movimiento curvado
      'M 70 50 L 70 85',
      'M 70 30 C 76 24 84 24 84 32',
      // Puño cerrado y pulgar
      'M 26 62 C 38 60 56 64 62 76',
      // Flecha indicadora de giro (curva J)
      'M 86 42 C 92 48 90 56 82 60'
    ]
  },
  K: {
    letter: 'K',
    name: 'Seña K',
    description: 'Índice vertical, dedo medio inclinado hacia adelante y pulgar apoyado en la articulación.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 20 68 26 55 C 32 44 42 46 46 54 L 46 18 C 46 8 56 8 58 18 L 58 35 L 76 20 C 82 15 88 22 84 30 L 68 55 C 78 65 82 80 80 95 L 72 130 Z',
    innerPaths: [
      // Dedo índice erguido
      'M 46 34 L 58 34',
      // Dedo medio en ángulo
      'M 58 45 L 78 30',
      // Pulgar apoyado entre ambos dedos
      'M 30 62 C 42 60 54 58 60 68 C 56 76 44 76 34 76',
      // Anular y meñique replegados
      'M 50 78 C 58 78 72 80 76 88'
    ]
  },
  L: {
    letter: 'L',
    name: 'Seña L',
    description: 'Índice apuntando hacia arriba y pulgar extendido a 90 grados formando una "L".',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 92 18 84 14 74 C 10 65 14 58 24 58 L 50 64 L 50 18 C 50 8 62 8 64 18 L 64 70 C 76 72 82 82 82 92 L 72 130 Z',
    innerPaths: [
      // Separación ángulo recto L
      'M 26 62 L 52 68',
      'M 52 20 L 52 70',
      'M 52 38 L 64 38',
      // Otros tres dedos doblados sobre la palma
      'M 54 75 C 64 75 74 78 76 88',
      'M 52 90 C 62 90 70 92 72 98'
    ]
  },
  M: {
    letter: 'M',
    name: 'Seña M',
    description: 'Tres dedos doblados hacia abajo sobre el pulgar (índice, medio y anular).',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 92 18 78 20 60 C 22 45 32 36 44 36 C 52 36 60 40 68 40 C 76 40 84 48 84 62 L 82 95 L 72 130 Z',
    innerPaths: [
      // 3 crestas/dedos doblados hacia abajo
      'M 40 38 L 40 85',
      'M 56 38 L 56 85',
      'M 70 42 L 70 85',
      // Pulgar asomando por debajo del tercer dedo
      'M 24 78 C 34 76 68 76 74 88',
      // Pliegues nudillos
      'M 30 55 L 80 55'
    ]
  },
  N: {
    letter: 'N',
    name: 'Seña N',
    description: 'Dos dedos doblados hacia abajo sobre el pulgar (índice y medio).',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 92 18 78 20 60 C 22 45 34 38 48 38 C 62 38 74 44 76 58 L 76 95 L 72 130 Z',
    innerPaths: [
      // 2 crestas/dedos doblados hacia abajo
      'M 48 40 L 48 85',
      'M 64 42 L 64 85',
      // Pulgar asomando debajo del segundo dedo
      'M 24 78 C 36 76 60 76 68 88',
      'M 30 56 L 72 56'
    ]
  },
  Ñ: {
    letter: 'Ñ',
    name: 'Seña Ñ',
    description: 'Misma posición que la N con movimiento ondeado de la virgulilla sobre la mano.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 22 92 18 78 20 60 C 22 45 34 38 48 38 C 62 38 74 44 76 58 L 76 95 L 72 130 Z',
    innerPaths: [
      // Virgulilla característica de la Ñ arriba
      'M 32 18 C 42 12 50 24 62 18 C 68 14 74 16 78 20',
      // 2 dedos doblados como en N
      'M 48 40 L 48 85',
      'M 64 42 L 64 85',
      'M 24 78 C 36 76 60 76 68 88',
      'M 30 56 L 72 56'
    ]
  },
  O: {
    letter: 'O',
    name: 'Seña O',
    description: 'Todos los dedos curvados uniéndose con la yema del pulgar formando una letra "O".',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 18 68 24 52 C 32 34 56 28 72 34 C 84 40 88 56 86 70 C 84 88 78 105 72 130 Z',
    innerPaths: [
      // Agujero interior de la "O"
      'M 48 52 C 40 56 38 70 46 76 C 54 82 66 78 68 68 C 70 58 60 48 48 52 Z',
      // Pliegues y líneas de unión de dedos
      'M 54 34 C 62 40 68 45 74 52',
      'M 36 48 C 44 54 50 60 56 66'
    ]
  },
  P: {
    letter: 'P',
    name: 'Seña P',
    description: 'Configuración similar a la K pero orientada hacia abajo (índice al frente, medio abajo).',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 88 20 70 28 55 C 38 45 56 45 66 52 L 86 52 C 92 52 94 62 86 66 L 68 66 L 68 96 C 68 104 58 104 56 96 L 56 75 C 50 85 44 105 72 130 Z',
    innerPaths: [
      // Dedo medio apuntando hacia abajo
      'M 56 70 L 56 96',
      // Dedo índice extendido horizontal
      'M 60 54 L 86 54',
      // Pulgar apoyado entre ambos
      'M 32 64 C 44 62 54 62 58 72'
    ]
  },
  Q: {
    letter: 'Q',
    name: 'Seña Q',
    description: 'Mano apuntando hacia abajo con índice y pulgar separados en pinza hacia el suelo.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 22 68 28 56 C 36 45 54 45 64 52 L 64 96 C 64 104 54 104 52 96 L 52 75 L 42 75 L 38 98 C 36 104 28 102 28 96 L 30 78 C 38 88 44 108 72 130 Z',
    innerPaths: [
      // Pinza apuntando hacia abajo
      'M 52 60 L 52 96',
      'M 36 76 L 36 96',
      'M 42 56 C 50 56 60 62 60 70'
    ]
  },
  R: {
    letter: 'R',
    name: 'Seña R',
    description: 'Dedos índice y medio extendidos cruzados el uno sobre el otro (signo de suerte).',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 20 68 26 55 C 34 46 44 48 48 58 L 48 22 C 48 12 58 10 64 20 L 70 20 C 76 12 84 16 82 26 L 68 58 C 76 68 80 82 78 95 L 72 130 Z',
    innerPaths: [
      // Cruce del dedo medio por encima del índice
      'M 50 48 L 74 18',
      'M 66 42 L 52 20',
      // Pulgar doblado sosteniendo anular y meñique
      'M 28 66 C 40 64 54 68 58 80'
    ]
  },
  S: {
    letter: 'S',
    name: 'Seña S',
    description: 'Puño cerrado con el pulgar cruzado horizontalmente por delante de todos los dedos.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 90 18 75 22 58 C 26 44 38 36 56 36 C 72 36 82 46 82 62 L 82 92 L 72 130 Z',
    innerPaths: [
      // Pulgar cruzado por encima de los dedos
      'M 22 72 C 32 62 58 60 74 66 C 74 76 56 78 30 84',
      // Nudillos superiores
      'M 36 40 L 36 58',
      'M 50 38 L 50 58',
      'M 66 40 L 66 60',
      'M 76 44 L 76 64'
    ]
  },
  T: {
    letter: 'T',
    name: 'Seña T',
    description: 'Puño cerrado con el pulgar introducido entre el dedo índice y el medio.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 90 18 75 22 58 C 26 44 38 36 54 36 C 70 36 82 46 82 62 L 82 92 L 72 130 Z',
    innerPaths: [
      // Pulgar asomando entre índice y medio
      'M 38 48 C 42 42 50 42 54 50 C 56 60 48 68 40 68',
      // Dedos en puño
      'M 26 62 L 38 62',
      'M 54 62 L 78 62',
      'M 30 78 L 76 78',
      'M 34 92 L 74 92'
    ]
  },
  U: {
    letter: 'U',
    name: 'Seña U',
    description: 'Dedos índice y medio estirados juntos hacia arriba, anular y meñique replegados.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 20 68 26 55 C 34 46 44 50 46 62 L 46 18 C 46 8 56 8 58 18 L 58 18 C 60 8 70 8 72 18 L 72 70 C 80 75 82 85 80 95 L 72 130 Z',
    innerPaths: [
      // Línea entre índice y medio juntos
      'M 58 18 L 58 68',
      'M 46 36 L 72 36',
      'M 46 50 L 72 50',
      // Pulgar sobre anular y meñique
      'M 28 66 C 38 64 54 68 58 80',
      'M 58 80 C 66 80 74 84 76 92'
    ]
  },
  V: {
    letter: 'V',
    name: 'Seña V',
    description: 'Dedos índice y medio estirados y separados en forma de "V" (señal de paz).',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 20 68 26 55 C 32 44 40 48 44 58 L 34 20 C 32 10 44 6 48 16 L 56 46 L 68 16 C 72 6 84 10 82 20 L 72 68 C 80 75 82 85 80 95 L 72 130 Z',
    innerPaths: [
      // Vértice interior de la V
      'M 46 46 L 56 66 L 68 46',
      // Pliegues en dedos
      'M 36 28 L 46 32',
      'M 70 32 L 80 28',
      // Pulgar sobre anular y meñique
      'M 28 66 C 38 64 54 68 58 80'
    ]
  },
  W: {
    letter: 'W',
    name: 'Seña W',
    description: 'Tres dedos erguidos y separados (índice, medio y anular) formando una "W".',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 20 70 26 58 C 30 50 36 54 38 62 L 32 24 C 30 14 40 10 44 20 L 50 50 L 56 16 C 58 6 68 6 70 16 L 74 50 L 80 24 C 84 14 94 18 92 28 L 84 75 L 72 130 Z',
    innerPaths: [
      // Valles de separación entre los tres dedos
      'M 42 46 L 48 64 L 54 46',
      'M 66 46 L 72 64 L 78 46',
      // Pulgar doblando al meñique
      'M 28 68 C 36 66 50 72 54 82'
    ]
  },
  X: {
    letter: 'X',
    name: 'Seña X',
    description: 'Dedo índice encorvado en forma de garfio o gancho, demás dedos cerrados.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 20 68 26 55 C 32 44 42 46 48 54 L 52 30 C 56 22 68 22 74 28 C 78 34 76 42 68 46 L 62 62 C 72 68 78 78 78 92 L 72 130 Z',
    innerPaths: [
      // Dedo índice doblado en gancho
      'M 52 36 C 58 32 66 32 68 38 C 70 44 64 50 58 52',
      // Pulgar y nudillos
      'M 28 66 C 40 64 54 68 58 80',
      'M 40 82 C 50 82 66 84 72 90'
    ]
  },
  Y: {
    letter: 'Y',
    name: 'Seña Y',
    description: 'Pulgar y meñique bien extendidos ("hang loose" / shaka), los tres dedos centrales cerrados.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 92 14 84 10 74 C 6 64 12 55 22 58 L 38 68 C 40 54 50 46 64 46 C 70 46 76 50 78 58 L 88 40 C 94 30 104 36 100 46 L 86 86 C 82 105 78 115 72 130 Z',
    innerPaths: [
      // Pulgar extendido a la izquierda
      'M 20 62 L 40 74',
      // Meñique extendido a la derecha
      'M 76 60 L 94 44',
      // 3 dedos cerrados en el centro
      'M 42 62 C 48 60 58 60 62 70',
      'M 42 74 C 50 72 62 72 66 82',
      'M 44 86 C 52 84 64 84 68 92'
    ]
  },
  Z: {
    letter: 'Z',
    name: 'Seña Z',
    description: 'Índice apuntando dibujando una "Z" en el aire con movimiento zig-zag.',
    viewBox: '0 0 100 130',
    width: 100,
    height: 130,
    wristAnchor: [28, 72],
    outerPath: 'M 28 130 L 28 95 C 20 85 20 68 26 56 C 34 46 44 48 48 58 L 48 20 C 48 10 58 10 62 20 L 62 58 C 72 62 78 72 78 86 L 72 130 Z',
    innerPaths: [
      // Dedo índice vertical
      'M 48 36 L 62 36',
      'M 48 50 L 62 50',
      // Trazo de la Z en zigzag (flecha de movimiento)
      'M 68 24 L 88 24 L 72 44 L 92 44',
      // Pulgar doblado
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
      // Conservar la virgulilla de la Ñ (U+0303) si la letra base es N
      if (str[offset - 1] === 'N') return match;
      return '';
    })
    .normalize('NFC')
    .split('')
    .filter((char) => (char >= 'A' && char <= 'Z') || char === 'Ñ' || char === ' ');
}
