import {
  buildMakerboxLogoVectorPath,
  MAKERBOX_LOGO_ASPECT_RATIO,
} from './makerbox-logo-vector';

export type PedagogicalLevelId = 'nivel1' | 'nivel2' | 'nivel3';
export type FrameGeometryId = 'hexagono' | 'pentagono' | 'triangulo';
export type BadgeIconId =
  | 'paw'
  | 'star'
  | 'bolt'
  | 'atom'
  | 'rocket'
  | 'heart'
  | 'robot'
  | 'shield';
export type IdeaThemeId = 'animales' | 'espacio' | 'deportes' | 'ciencia';

/** Constantes fijas y opciones de ajuste para mínima impresión 3D y calce plano de 3.0 mm */
export const FIXED_WOOD_THICKNESS_MM = 3.0;
export const FIXED_FRAME_HEIGHT_MM = 3.0; // Misma altura plana de 3.0 mm que la madera, sin anillo inferior
export const FIXED_PRESS_FIT_CLEARANCE_MM = 0.12; // Ajuste press-fit óptimo por defecto (Niveles 1 y 2)
export const LEVEL3_CLEARANCE_OPTIONS_MM = [0.1, 0.12, 0.14, 0.16] as const; // Opciones de experimentación en Nivel 3
export const FIXED_DOVETAIL_SIZE_MM = 1.8; // Encaje Cola de Milano fijo de 1.8 mm para mínimo borde y máxima rapidez

export interface BadgeMemberConfig {
  id: number;
  primaryText: string;
  secondaryText: string;
  icon: BadgeIconId;
  plaColorHex: string;
}

export interface BadgesTeamParams {
  levelId: PedagogicalLevelId;
  teamName: string;
  memberCount: number; // 2..5
  geometry: FrameGeometryId;
  woodCenterDiameterMm: number; // Slider: 36..44 mm
  holeDiameterMm: number; // Slider: 3.8..4.4 mm
  dovetailSizeMm: number; // Fijo: 1.8 mm
  woodThicknessMm: number; // Fijo: 3.0 mm
  clearanceMm: number; // Fijo 0.12 mm en Nivel 1-2; configurable (0.1, 0.12, 0.14, 0.16 mm) en Nivel 3
  members: BadgeMemberConfig[];
}

export interface PedagogicalLevelInfo {
  id: PedagogicalLevelId;
  grades: string;
  title: string;
  summary: string;
  learningGoal: string;
  badgeColor: string;
}

export const PEDAGOGICAL_LEVELS: Record<PedagogicalLevelId, PedagogicalLevelInfo> = {
  nivel1: {
    id: 'nivel1',
    grades: 'Nivel 1 (5° a 6° Básico)',
    title: 'Inspiración en la Naturaleza (El Secreto del Panal)',
    summary:
      'Comparamos el triángulo, el pentágono y el hexágono para descubrir por qué las abejas eligen el hexágono: encierra el máximo espacio circular usando la menor cantidad de material y sin dejar huecos vacíos.',
    learningGoal:
      'Comprender por qué el hexágono es la figura geométrica más eficiente en la naturaleza para conectar una comunidad.',
    badgeColor: 'amber',
  },
  nivel2: {
    id: 'nivel2',
    grades: 'Nivel 2 (7° Básico)',
    title: 'Polígonos Regulares, Teselación y Diseño Plano de 3 mm',
    summary:
      'Analizamos los ángulos interiores del triángulo (60°), pentágono (108°) y hexágono (120°) combinando un centro de madera de 3 mm al ras dentro de un marco perimetral plano de 3 mm en PLA con uniones cola de milano de 1.8 mm.',
    learningGoal:
      'Demostrar matemáticamente qué polígonos teselan el plano (divisores de 360°) minimizando el volumen de filamento.',
    badgeColor: 'sky',
  },
  nivel3: {
    id: 'nivel3',
    grades: 'Nivel 3 (8° Básico)',
    title: 'Tolerancias de Fabricación Digital y Ajuste Press-Fit',
    summary:
      'Experimentamos configurando el ajuste press-fit (0.1, 0.12, 0.14 y 0.16 mm) para comprender por qué una cavidad con la medida exacta del centro de madera (0.0 mm de holgura) NO encaja en el mundo físico debido a la expansión térmica del filamento PLA, la rugosidad de las capas y la fricción.',
    learningGoal:
      'Experimentar con la tolerancia de encaje (0.10 a 0.16 mm) y explicar físicamente por qué la medida exacta impide el ensamblaje.',
    badgeColor: 'purple',
  },
};

export interface FrameGeometryInfo {
  id: FrameGeometryId;
  name: string;
  shortName: string;
  sides: number;
  interiorAngleDeg: number;
  tessellatesPlane: boolean;
  natureBadge: string;
  description: string;
  whyEfficiencyNote: string;
  relativePlaFactor: string;
}

export const FRAME_GEOMETRIES: Record<FrameGeometryId, FrameGeometryInfo> = {
  hexagono: {
    id: 'hexagono',
    name: 'Hexágono Tipo Panal (Óptimo en la Naturaleza)',
    shortName: 'Hexágono Panal',
    sides: 6,
    interiorAngleDeg: 120,
    tessellatesPlane: true,
    natureBadge: '🏆 Más Eficiente en la Naturaleza',
    description:
      '6 lados planos ultra-esbeltos de 3 mm de espesor con encajes cola de milano de 1.8 mm. Sus ángulos de 120° calzan de a 3 en cada vértice (3 × 120° = 360°) sin dejar ningún espacio vacío.',
    whyEfficiencyNote:
      'Teorema del Panal: De todos los polígonos que cubren una superficie sin huecos, el hexágono es el que tiene menor perímetro para encerrar un círculo de madera, requiriendo apenas ~1.8 g de PLA y ~5 min de impresión por marco.',
    relativePlaFactor: '100% (Mínimo uso de PLA y tiempo 3D)',
  },
  pentagono: {
    id: 'pentagono',
    name: 'Pentágono Regular (Con Brecha Geométrica)',
    shortName: 'Pentágono',
    sides: 5,
    interiorAngleDeg: 108,
    tessellatesPlane: false,
    natureBadge: '⚠️ No tesela el plano (Deja huecos de 36°)',
    description:
      '5 lados planos de 3 mm de espesor con encajes cola de milano de 1.8 mm, cuyos ángulos interiores de 108° no dividen exactamente los 360° de un giro completo.',
    whyEfficiencyNote:
      'Al juntar 3 pentágonos en un vértice suman 3 × 108° = 324°, dejando una ranura vacía de 36°. Además consume más filamento en sus 5 esquinas que el hexágono.',
    relativePlaFactor: '+22% más PLA que el hexágono',
  },
  triangulo: {
    id: 'triangulo',
    name: 'Triángulo Equilátero (Alto Consumo de Material)',
    shortName: 'Triángulo',
    sides: 3,
    interiorAngleDeg: 60,
    tessellatesPlane: true,
    natureBadge: '📐 Tesela a 60°, pero gasta más del doble de PLA',
    description:
      '3 lados planos de 3 mm de espesor con encajes cola de milano de 1.8 mm que obligan a alternar las chapitas hacia arriba y hacia abajo (180°) para acoplarlas.',
    whyEfficiencyNote:
      'Aunque 6 triángulos sí suman 360° (6 × 60°), para rodear el mismo círculo de madera necesita 3 puntas muy largas, consumiendo más del doble de plástico PLA y tiempo de impresión que el hexágono.',
    relativePlaFactor: '+135% más PLA y tiempo que el hexágono',
  },
};

export interface BadgeIconInfo {
  id: BadgeIconId;
  label: string;
  emoji: string;
  /** Elementos SVG centrados en un sistema de coordenadas [-12, 12] x [-12, 12] */
  svgPaths: string[];
}

export const BADGE_ICONS: Record<BadgeIconId, BadgeIconInfo> = {
  paw: {
    id: 'paw',
    label: 'Huella Mascota',
    emoji: '🐾',
    svgPaths: [
      'M -4.5 2.5 C -5.5 0 -3.5 -2.5 0 -2.5 C 3.5 -2.5 5.5 0 4.5 2.5 C 3.8 4.8 5.2 6.8 3.2 7.8 C 1.5 8.5 -1.5 8.5 -3.2 7.8 C -5.2 6.8 -3.8 4.8 -4.5 2.5 Z',
      'M -6.8 -1.2 A 1.8 2.4 0 1 1 -3.2 -1.2 A 1.8 2.4 0 1 1 -6.8 -1.2 Z',
      'M -3.2 -5.5 A 1.8 2.5 0 1 1 0.4 -5.5 A 1.8 2.5 0 1 1 -3.2 -5.5 Z',
      'M 0.6 -5.5 A 1.8 2.5 0 1 1 4.2 -5.5 A 1.8 2.5 0 1 1 0.6 -5.5 Z',
      'M 3.4 -1.2 A 1.8 2.4 0 1 1 7.0 -1.2 A 1.8 2.4 0 1 1 3.4 -1.2 Z',
    ],
  },
  star: {
    id: 'star',
    label: 'Estrella',
    emoji: '⭐',
    svgPaths: [
      'M 0 -9.5 L 2.6 -3.1 L 9.5 -2.5 L 4.3 2.0 L 5.9 8.8 L 0 5.2 L -5.9 8.8 L -4.3 2.0 L -9.5 -2.5 L -2.6 -3.1 Z',
      'M 0 -5.0 L 1.4 -1.6 L 5.0 -1.3 L 2.2 1.1 L 3.1 4.6 L 0 2.7 L -3.1 4.6 L -2.2 1.1 L -5.0 -1.3 L -1.4 -1.6 Z',
    ],
  },
  bolt: {
    id: 'bolt',
    label: 'Rayo',
    emoji: '⚡',
    svgPaths: [
      'M 1.8 -9.5 L -6.5 0.8 L -0.5 0.8 L -2.2 9.5 L 6.5 -1.2 L 0.4 -1.2 Z',
    ],
  },
  atom: {
    id: 'atom',
    label: 'Átomo',
    emoji: '⚛️',
    svgPaths: [
      'M -1.8 0 A 1.8 1.8 0 1 0 1.8 0 A 1.8 1.8 0 1 0 -1.8 0 Z',
      'M -9.2 0 A 9.2 3.4 0 1 0 9.2 0 A 9.2 3.4 0 1 0 -9.2 0 Z',
      'M -4.6 -7.97 A 9.2 3.4 60 1 0 4.6 7.97 A 9.2 3.4 60 1 0 -4.6 -7.97 Z',
      'M 4.6 -7.97 A 9.2 3.4 120 1 0 -4.6 7.97 A 9.2 3.4 120 1 0 4.6 -7.97 Z',
    ],
  },
  rocket: {
    id: 'rocket',
    label: 'Cohete',
    emoji: '🚀',
    svgPaths: [
      'M 0 -9.5 C 3.5 -5.5 4.2 -0.5 3.8 4.5 L -3.8 4.5 C -4.2 -0.5 -3.5 -5.5 0 -9.5 Z',
      'M -3.8 1.2 L -7.2 4.8 L -3.8 4.5 Z',
      'M 3.8 1.2 L 7.2 4.8 L 3.8 4.5 Z',
      'M -2.0 4.5 L 0 8.8 L 2.0 4.5 Z',
      'M -1.8 -2.2 A 1.8 1.8 0 1 0 1.8 -2.2 A 1.8 1.8 0 1 0 -1.8 -2.2 Z',
    ],
  },
  heart: {
    id: 'heart',
    label: 'Corazón',
    emoji: '❤️',
    svgPaths: [
      'M 0 8.5 C -2.5 6.2 -9.0 1.8 -9.0 -3.2 C -9.0 -6.8 -6.0 -9.0 -3.2 -9.0 C -1.4 -9.0 0 -7.8 0 -6.2 C 0 -7.8 1.4 -9.0 3.2 -9.0 C 6.0 -9.0 9.0 -6.8 9.0 -3.2 C 9.0 1.8 2.5 6.2 0 8.5 Z',
    ],
  },
  robot: {
    id: 'robot',
    label: 'Robot',
    emoji: '🤖',
    svgPaths: [
      'M -6.5 -4.5 L 6.5 -4.5 L 6.5 6.5 L -6.5 6.5 Z',
      'M 0 -4.5 L 0 -8.0',
      'M -1.4 -8.8 A 1.4 1.4 0 1 0 1.4 -8.8 A 1.4 1.4 0 1 0 -1.4 -8.8 Z',
      'M -4.2 -1.0 A 1.4 1.4 0 1 0 -1.4 -1.0 A 1.4 1.4 0 1 0 -4.2 -1.0 Z',
      'M 1.4 -1.0 A 1.4 1.4 0 1 0 4.2 -1.0 A 1.4 1.4 0 1 0 1.4 -1.0 Z',
      'M -3.8 3.2 L 3.8 3.2',
      'M -8.2 -1.5 L -6.5 -1.5 L -6.5 2.5 L -8.2 2.5 Z',
      'M 6.5 -1.5 L 8.2 -1.5 L 8.2 2.5 L 6.5 2.5 Z',
    ],
  },
  shield: {
    id: 'shield',
    label: 'Escudo',
    emoji: '🛡️',
    svgPaths: [
      'M 0 -9.0 L 7.5 -6.2 L 7.5 -0.5 C 7.5 4.2 4.2 7.5 0 9.2 C -4.2 7.5 -7.5 4.2 -7.5 -0.5 L -7.5 -6.2 Z',
      'M 0 -6.2 L 4.8 -4.2 L 4.8 -0.5 C 4.8 2.8 2.6 5.2 0 6.5 C -2.6 5.2 -4.8 2.8 -4.8 -0.5 L -4.8 -4.2 Z',
    ],
  },
};

export interface TeamIdeaSuggestion {
  teamName: string;
  motto: string;
  icons: BadgeIconId[];
  sampleMemberNames: string[];
}

export const AI_TEAM_IDEAS_BY_THEME: Record<IdeaThemeId, TeamIdeaSuggestion[]> = {
  animales: [
    {
      teamName: 'Manada Alfa',
      motto: 'Lealtad y naturaleza conectada',
      icons: ['paw', 'heart', 'shield', 'star', 'bolt'],
      sampleMemberNames: ['Max', 'Luna', 'Rocky', 'Kira', 'Toby'],
    },
    {
      teamName: 'Colmena Guardiana',
      motto: 'Unidos como un panal indestructible',
      icons: ['shield', 'paw', 'star', 'heart', 'bolt'],
      sampleMemberNames: ['Miel', 'Rayo', 'Nala', 'Simba', 'Coco'],
    },
    {
      teamName: 'Escuadrón Huellas',
      motto: 'Protegiendo a nuestras mascotas',
      icons: ['paw', 'heart', 'star', 'shield', 'rocket'],
      sampleMemberNames: ['Bruno', 'Lola', 'Thor', 'Mia', 'Zeus'],
    },
  ],
  espacio: [
    {
      teamName: 'Misión Orión',
      motto: 'Exploradores del cosmos profundo',
      icons: ['rocket', 'star', 'atom', 'robot', 'bolt'],
      sampleMemberNames: ['Nova', 'Apolo', 'Vega', 'Orión', 'Sirius'],
    },
    {
      teamName: 'Flota Galáctica',
      motto: 'Propulsión e ingeniería estelar',
      icons: ['star', 'rocket', 'robot', 'shield', 'atom'],
      sampleMemberNames: ['Cosmos', 'Estela', 'Halley', 'Titán', 'Lyra'],
    },
    {
      teamName: 'Pioneros de Marte',
      motto: 'Colonia tecnológica interplanetaria',
      icons: ['robot', 'rocket', 'atom', 'shield', 'star'],
      sampleMemberNames: ['Ares', 'Fobos', 'Deimos', 'Rover', 'Curiosity'],
    },
  ],
  deportes: [
    {
      teamName: 'Trueno Dorado',
      motto: 'Velocidad, energía y trabajo en equipo',
      icons: ['bolt', 'star', 'shield', 'heart', 'rocket'],
      sampleMemberNames: ['Capitán', 'Flash', 'Titán', 'Victoria', 'Campeón'],
    },
    {
      teamName: 'Escudo Invencible',
      motto: 'Defensa sólida y espíritu deportivo',
      icons: ['shield', 'bolt', 'star', 'heart', 'paw'],
      sampleMemberNames: ['Defensa', 'Goleador', 'Líder', 'Sprint', 'Fénix'],
    },
    {
      teamName: 'Dinamo Unido',
      motto: 'Cada integrante mueve al equipo',
      icons: ['bolt', 'shield', 'star', 'rocket', 'heart'],
      sampleMemberNames: ['Turbo', 'Nitro', 'Impulso', 'Energía', 'Meta'],
    },
  ],
  ciencia: [
    {
      teamName: 'Núcleo Cuántico',
      motto: 'Innovación, átomos y mecatrónica',
      icons: ['atom', 'robot', 'bolt', 'star', 'rocket'],
      sampleMemberNames: ['Tesla', 'Curie', 'Newton', 'Ada', 'Galileo'],
    },
    {
      teamName: 'Red Biónica',
      motto: 'Robótica colaborativa del futuro',
      icons: ['robot', 'atom', 'shield', 'bolt', 'rocket'],
      sampleMemberNames: ['Nexus', 'Ciborg', 'Vector', 'Matriz', 'Quark'],
    },
    {
      teamName: 'Laboratorio Maker',
      motto: 'Co-creación láser e impresión 3D',
      icons: ['atom', 'robot', 'star', 'bolt', 'shield'],
      sampleMemberNames: ['Prototipo', 'Láser', 'Vóxel', 'Fotón', 'Sinter'],
    },
  ],
};

export const PLA_COLORS_PALETTE = [
  { name: 'Azul Cobalto', hex: '#2563eb' },
  { name: 'Naranja Maker', hex: '#f97316' },
  { name: 'Verde Esmeralda', hex: '#10b981' },
  { name: 'Morado UTalca', hex: '#7c3aed' },
  { name: 'Rojo Carmesí', hex: '#e11d48' },
  { name: 'Amarillo Solar', hex: '#eab308' },
];

/**
 * Apotema ultra-eficiente del marco (distancia del centro a cada cara plana):
 * Con Cola de Milano fija en 1.8 mm, basta un ancho de pared de 3.5–3.6 mm alrededor del centro de madera,
 * dejando ~1.65 mm de pared sólida detrás de las cajas hembra y minimizando al máximo el uso de PLA.
 */
export function getBadgeHoneycombApothem(
  cavityRadiusMm: number,
  dovetailSizeMm = FIXED_DOVETAIL_SIZE_MM,
  geometry: FrameGeometryId = 'hexagono'
): number {
  if (geometry === 'triangulo') {
    return cavityRadiusMm + 1.65 + dovetailSizeMm; // rCav + 3.45 mm
  }
  return cavityRadiusMm + 1.8 + dovetailSizeMm; // rCav + 3.60 mm
}

/**
 * Posición del orificio interno para argolla de llavero alojado en el vértice superior (-90°),
 * aprovechando el espacio natural de la esquina del polígono sin engrosar las paredes laterales.
 */
export function getInternalKeychainHoleSpec(
  geometry: FrameGeometryId,
  cavityRadiusMm: number,
  holeDiameterMm = 4.0
): { offsetFromCenterMm: number; holeRadiusMm: number; holeDiameterMm: number } {
  const holeRadiusMm = holeDiameterMm / 2;
  if (geometry === 'triangulo') {
    return {
      offsetFromCenterMm: cavityRadiusMm + 1.45 + holeRadiusMm,
      holeRadiusMm,
      holeDiameterMm,
    };
  }
  if (geometry === 'pentagono') {
    return {
      offsetFromCenterMm: cavityRadiusMm + 1.2 + holeRadiusMm,
      holeRadiusMm,
      holeDiameterMm,
    };
  }
  // Hexágono: alojado dentro del vértice superior (-90°) con pared interior de 1.1 mm y exterior > 1.4 mm
  return {
    offsetFromCenterMm: cavityRadiusMm + 1.1 + holeRadiusMm,
    holeRadiusMm,
    holeDiameterMm,
  };
}

/**
 * Genera el contorno exterior cerrado (sin vértices duplicados) en orden antihorario (CCW en X,Y)
 * comenzando exactamente en el vértice superior O_top (x = 0, y < 0, ángulo -90°).
 * Cada cara emite exactamente 6 vértices:
 *   V0 (esquina inicial), V1 (cuello izq), V2 (cabeza izq), V3 (centro cresta/base), V4 (cabeza der), V5 (cuello der).
 */
export function computeOuterFrameContourPoints(
  geometry: FrameGeometryId,
  cavityRadiusMm: number,
  clearanceMm: number,
  dovetailSizeMm = FIXED_DOVETAIL_SIZE_MM
): { x: number; y: number; theta: number }[] {
  const apothem = getBadgeHoneycombApothem(cavityRadiusMm, dovetailSizeMm, geometry);
  const pts: { x: number; y: number; theta: number }[] = [];

  const hMale = dovetailSizeMm; // 1.8 mm
  const neckHalfMale = dovetailSizeMm * 0.92; // 1.66 mm
  const headHalfMale = dovetailSizeMm * 1.36; // 2.45 mm

  const hFemale = hMale + clearanceMm;
  const neckHalfFemale = neckHalfMale + clearanceMm;
  const headHalfFemale = headHalfMale + clearanceMm;

  const sides = geometry === 'hexagono' ? 6 : geometry === 'pentagono' ? 5 : 3;
  const L_half = apothem * Math.tan(Math.PI / sides);

  const faceNormalsRad: { alpha: number; isMale: boolean }[] =
    geometry === 'hexagono'
      ? [
          { alpha: (-60 * Math.PI) / 180, isMale: false },
          { alpha: 0, isMale: true },
          { alpha: (60 * Math.PI) / 180, isMale: true },
          { alpha: (120 * Math.PI) / 180, isMale: true },
          { alpha: Math.PI, isMale: false },
          { alpha: (-120 * Math.PI) / 180, isMale: false },
        ]
      : geometry === 'pentagono'
        ? [
            { alpha: (-54 * Math.PI) / 180, isMale: true },
            { alpha: (18 * Math.PI) / 180, isMale: true },
            { alpha: (90 * Math.PI) / 180, isMale: true },
            { alpha: (162 * Math.PI) / 180, isMale: false },
            { alpha: (-126 * Math.PI) / 180, isMale: false },
          ]
        : [
            { alpha: (-30 * Math.PI) / 180, isMale: true },
            { alpha: (90 * Math.PI) / 180, isMale: true },
            { alpha: (-150 * Math.PI) / 180, isMale: false },
          ];

  for (const face of faceNormalsRad) {
    const { alpha, isMale } = face;
    const nx = Math.cos(alpha);
    const ny = Math.sin(alpha);
    const tx = -Math.sin(alpha);
    const ty = Math.cos(alpha);

    const neckHalf = isMale ? neckHalfMale : neckHalfFemale;
    const headHalf = isMale ? headHalfMale : headHalfFemale;
    const depth = isMale ? hMale : -hFemale;

    const pushUV = (u: number, v: number) => {
      const rawX = (apothem + v) * nx + u * tx;
      const rawY = (apothem + v) * ny + u * ty;
      const x = Math.abs(rawX) < 1e-7 ? 0 : rawX;
      const y = Math.abs(rawY) < 1e-7 ? 0 : rawY;
      pts.push({ x, y, theta: Math.atan2(y, x) });
    };

    pushUV(-L_half, 0);
    pushUV(-neckHalf, 0);
    pushUV(-headHalf, depth);
    pushUV(0, depth);
    pushUV(headHalf, depth);
    pushUV(neckHalf, 0);
  }

  return pts;
}

export interface BadgesManufacturingTelemetry {
  laserTimePerBadgeSec: number;
  laserTotalTimeFormatted: string;
  laserFramesCutPerFrameSec: number;
  laserFramesCutTotalTimeFormatted: string;
  printTimePerFrameMin: number;
  printTotalTimeFormatted: string;
  plaWeightPerFrameGrams: number;
  plaTotalWeightGrams: number;
  polygonAreaMm2: number;
  efficiencyScorePct: number;
}

/**
 * Calcula los tiempos estimados de corte/grabado láser en Falcon Design Space
 * y de impresión 3D en PLA para el marco plano de 3.0 mm sin anillo de apoyo.
 */
export function estimateBadgesManufacturingTimes(
  params: BadgesTeamParams
): BadgesManufacturingTelemetry {
  const count = params.memberCount;
  const rWood = params.woodCenterDiameterMm / 2;
  const rCav = rWood + params.clearanceMm;
  const apothem = getBadgeHoneycombApothem(rCav, params.dovetailSizeMm, params.geometry);
  const sides = params.geometry === 'hexagono' ? 6 : params.geometry === 'pentagono' ? 5 : 3;

  const outerPolygonAreaMm2 = sides * apothem * apothem * Math.tan(Math.PI / sides);
  const woodCircleAreaMm2 = Math.PI * rWood * rWood;
  const cavityAreaMm2 = Math.PI * rCav * rCav;
  const holeAreaMm2 = Math.PI * Math.pow(params.holeDiameterMm / 2, 2);

  const efficiencyScorePct = Math.round((woodCircleAreaMm2 / outerPolygonAreaMm2) * 100);

  // Volumen neto de PLA por marco plano de 3.0 mm (sin anillo de apoyo inferior)
  const netFrameAreaMm2 = Math.max(80, outerPolygonAreaMm2 - cavityAreaMm2 - holeAreaMm2);
  const rawVolumeMm3 = netFrameAreaMm2 * FIXED_FRAME_HEIGHT_MM;

  // Factor de laminado 3D (perímetros + relleno en 3.0 mm de altura, densidad PLA 1.24 g/cm³)
  const plaWeightPerFrameGrams = Number(((rawVolumeMm3 / 1000) * 0.78 * 1.24).toFixed(1));
  const plaTotalWeightGrams = Number((plaWeightPerFrameGrams * count).toFixed(1));

  // Tiempo de impresión 3D (~2.8 min por gramo de PLA en altura plana de 3.0 mm)
  const printTimePerFrameMin = Math.max(4, Math.round(plaWeightPerFrameGrams * 2.8));
  const totalPrintMin = printTimePerFrameMin * count;
  const printHours = Math.floor(totalPrintMin / 60);
  const printRemMin = totalPrintMin % 60;
  const printTotalTimeFormatted =
    printHours > 0 ? `${printHours} h ${printRemMin} min` : `${totalPrintMin} min`;

  const cutPerimeterMm = 2 * Math.PI * rWood;
  const cutSec = cutPerimeterMm / 8.0;
  const engraveSec = 34 + (params.woodCenterDiameterMm - 36) * 1.1;
  const laserTimePerBadgeSec = Math.round(cutSec + engraveSec);
  const totalLaserSec = laserTimePerBadgeSec * count;
  const laserMin = Math.floor(totalLaserSec / 60);
  const laserRemSec = totalLaserSec % 60;
  const laserTotalTimeFormatted =
    laserMin > 0 ? `${laserMin} min ${laserRemSec} s` : `${totalLaserSec} s`;

  // Tiempo de corte láser opcional de los marcos exteriores (solo corte #FF0000 sin grabado)
  const outerPolygonPerimeterMm =
    2 * sides * apothem * Math.tan(Math.PI / sides) + sides * 4 * params.dovetailSizeMm;
  const holePerimeterMm = 2 * Math.PI * (params.holeDiameterMm / 2);
  const frameCutPerimeterMm = outerPolygonPerimeterMm + cutPerimeterMm + holePerimeterMm;
  const laserFramesCutPerFrameSec = Math.max(15, Math.round(frameCutPerimeterMm / 8.0));
  const totalFramesLaserSec = laserFramesCutPerFrameSec * count;
  const framesLaserMin = Math.floor(totalFramesLaserSec / 60);
  const framesLaserRemSec = totalFramesLaserSec % 60;
  const laserFramesCutTotalTimeFormatted =
    framesLaserMin > 0
      ? `${framesLaserMin} min ${framesLaserRemSec} s`
      : `${totalFramesLaserSec} s`;

  return {
    laserTimePerBadgeSec,
    laserTotalTimeFormatted,
    laserFramesCutPerFrameSec,
    laserFramesCutTotalTimeFormatted,
    printTimePerFrameMin,
    printTotalTimeFormatted,
    plaWeightPerFrameGrams,
    plaTotalWeightGrams,
    polygonAreaMm2: Math.round(outerPolygonAreaMm2),
    efficiencyScorePct,
  };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Genera el archivo .SVG unificado con los centros de madera de TODOS los integrantes del equipo
 * listo para abrir en Falcon Design Space.
 */
export function generateBadgesLaserSvg(params: BadgesTeamParams): string {
  const { woodCenterDiameterMm, members, teamName } = params;
  const radius = woodCenterDiameterMm / 2;
  const spacing = woodCenterDiameterMm + 8;
  const cols = Math.min(3, members.length);
  const rows = Math.ceil(members.length / cols);

  const margin = 10;
  const totalWidth = Number((margin * 2 + cols * spacing - 8).toFixed(2));
  const totalHeight = Number((margin * 2 + rows * spacing - 8 + 10).toFixed(2));

  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}mm" height="${totalHeight}mm" viewBox="0 0 ${totalWidth} ${totalHeight}">`
  );
  lines.push(
    `  <!-- MakerBox Taller 4 (Falcon Design Space): ${members.length} Centros de Madera (${woodCenterDiameterMm} mm x ${params.woodThicknessMm} mm) - Equipo: ${escapeXml(teamName)} -->`
  );

  lines.push(`  <g id="CAPA_GRABADO_AZUL" stroke="#0000FF" fill="none">`);
  lines.push(
    `    <text x="${(totalWidth / 2).toFixed(2)}" y="6.5" text-anchor="middle" font-family="Arial, sans-serif" font-size="3.1" font-weight="bold" fill="#0000FF" stroke="none">MAKERBOX · FALCON DESIGN SPACE · EQUIPO: ${escapeXml(
      teamName.toUpperCase()
    )} (${members.length} CHAPAS Ø${woodCenterDiameterMm}mm)</text>`
  );

  members.forEach((member, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = margin + radius + col * spacing;
    const cy = margin + 8 + radius + row * spacing;

    const iconInfo = BADGE_ICONS[member.icon] ?? BADGE_ICONS.paw;
    const iconScale = (woodCenterDiameterMm / 36) * 0.56;
    const iconCenterY = cy - radius * 0.13;

    lines.push(
      `    <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${(radius - 1.8).toFixed(
        2
      )}" stroke="#0000FF" stroke-width="0.25" stroke-dasharray="1.5 1.0" />`
    );

    const primaryLabel = (member.primaryText || `Integrante ${idx + 1}`).trim();
    const secondaryLabel = (member.secondaryText || teamName).trim();

    const secondaryFontSize = Math.min(
      2.55,
      Math.max(1.85, (woodCenterDiameterMm * 0.46) / Math.max(7, secondaryLabel.length))
    );
    const primaryFontSize = Math.min(
      3.7,
      Math.max(2.35, (woodCenterDiameterMm * 0.55) / Math.max(5, primaryLabel.length))
    );

    if (secondaryLabel) {
      lines.push(
        `    <text x="${cx.toFixed(2)}" y="${(cy - radius * 0.52).toFixed(
          2
        )}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${secondaryFontSize.toFixed(
          2
        )}" font-weight="bold" fill="#0000FF" stroke="none">${escapeXml(
          secondaryLabel.toUpperCase()
        )}</text>`
      );
    }

    lines.push(
      `    <g transform="translate(${cx.toFixed(2)}, ${iconCenterY.toFixed(
        2
      )}) scale(${iconScale.toFixed(3)})" stroke="#0000FF" stroke-width="0.68" stroke-linecap="round" stroke-linejoin="round" fill="none">`
    );
    for (const d of iconInfo.svgPaths) {
      lines.push(`      <path d="${d}" />`);
    }
    lines.push(`    </g>`);

    lines.push(
      `    <text x="${cx.toFixed(2)}" y="${(cy + radius * 0.34).toFixed(
        2
      )}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${primaryFontSize.toFixed(
        2
      )}" font-weight="bold" fill="#0000FF" stroke="#0000FF" stroke-width="0.1">${escapeXml(
        primaryLabel.toUpperCase()
      )}</text>`
    );

    const logoWidthMm = radius * 0.88;
    const logoTopY = cy + radius * 0.45;
    const logoPathD = buildMakerboxLogoVectorPath(cx, logoTopY, logoWidthMm);
    lines.push(
      `    <path d="${logoPathD}" fill="#0000FF" stroke="none" fill-rule="evenodd" />`
    );
  });
  lines.push(`  </g>`);

  lines.push(`  <g id="CAPA_CORTE_ROJO" stroke="#FF0000" stroke-width="0.1" fill="none">`);
  members.forEach((_, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = margin + radius + col * spacing;
    const cy = margin + 8 + radius + row * spacing;
    lines.push(
      `    <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${radius.toFixed(3)}" />`
    );
  });
  lines.push(`  </g>`);

  lines.push(`</svg>`);
  return lines.join('\n');
}

/**
 * Genera el archivo .SVG de los Marcos Conectores para Corte Láser en madera de 3 mm
 * (alternativa rápida cuando por tiempo no se alcanzan a imprimir todos los bordes en 3D).
 * Incluye los `memberCount` marcos del equipo con cortes interiores (orificio de llavero y cavidad central)
 * y corte exterior poligonal con Cola de Milano en rojo (#FF0000, 0.1 mm) listo para Falcon Design Space.
 */
export function generateBadgesFramesLaserSvg(params: BadgesTeamParams): string {
  const {
    woodCenterDiameterMm,
    memberCount,
    geometry,
    holeDiameterMm,
    dovetailSizeMm,
    clearanceMm,
    teamName,
  } = params;
  const rWood = woodCenterDiameterMm / 2;
  // Para corte láser en madera de 3 mm, el kerf del láser (~0.10 mm) compensa la base, y sumamos la variación elegida en Nivel 3
  const deltaClearance = clearanceMm - FIXED_PRESS_FIT_CLEARANCE_MM;
  const laserDovetailClearance = Math.max(0, Number(deltaClearance.toFixed(3)));
  const outerPts = computeOuterFrameContourPoints(
    geometry,
    rWood,
    laserDovetailClearance,
    dovetailSizeMm
  );
  const holeSpec = getInternalKeychainHoleSpec(geometry, rWood, holeDiameterMm);
  const rInnerPressFit = Number((rWood - 0.05 + deltaClearance).toFixed(3));

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of outerPts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const pieceW = maxX - minX;
  const pieceH = maxY - minY;
  const gap = 6;
  const cols = Math.min(3, memberCount);
  const rows = Math.ceil(memberCount / cols);
  const margin = 10;
  const topHeader = 8;

  const totalWidth = Number((margin * 2 + cols * pieceW + (cols - 1) * gap).toFixed(2));
  const totalHeight = Number(
    (margin * 2 + topHeader + rows * pieceH + (rows - 1) * gap).toFixed(2)
  );

  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}mm" height="${totalHeight}mm" viewBox="0 0 ${totalWidth} ${totalHeight}">`
  );
  lines.push(
    `  <!-- MakerBox Taller 4 (Falcon Design Space): ${memberCount} Marcos Conectores (${FRAME_GEOMETRIES[geometry].shortName}) para Corte Láser 3 mm - Equipo: ${escapeXml(teamName)} -->`
  );

  lines.push(`  <g id="CAPA_GRABADO_AZUL" stroke="#0000FF" fill="none">`);
  lines.push(
    `    <text x="${(totalWidth / 2).toFixed(2)}" y="6.5" text-anchor="middle" font-family="Arial, sans-serif" font-size="3.1" font-weight="bold" fill="#0000FF" stroke="none">MAKERBOX · FALCON DESIGN SPACE · ${memberCount} MARCOS CONECTORES LÁSER 3MM (${FRAME_GEOMETRIES[
      geometry
    ].shortName.toUpperCase()}) · EQUIPO: ${escapeXml(teamName.toUpperCase())}</text>`
  );
  lines.push(`  </g>`);

  lines.push(`  <g id="CAPA_CORTE_ROJO" stroke="#FF0000" stroke-width="0.1" fill="none">`);
  for (let idx = 0; idx < memberCount; idx++) {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = margin - minX + col * (pieceW + gap);
    const cy = margin + topHeader - minY + row * (pieceH + gap);

    // 1. Corte interior: Orificio para argolla de llavero
    lines.push(
      `    <circle cx="${cx.toFixed(2)}" cy="${(cy - holeSpec.offsetFromCenterMm).toFixed(
        2
      )}" r="${holeSpec.holeRadiusMm.toFixed(3)}" />`
    );

    // 2. Corte interior: Cavidad circular press-fit donde entra el centro de madera
    lines.push(
      `    <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${rInnerPressFit.toFixed(3)}" />`
    );

    // 3. Corte exterior: Polígono conector con Cola de Milano de 1.8 mm
    const polyPoints = outerPts
      .map((p) => `${(cx + p.x).toFixed(3)},${(cy + p.y).toFixed(3)}`)
      .join(' ');
    lines.push(`    <polygon points="${polyPoints}" />`);
  }
  lines.push(`  </g>`);

  lines.push(`</svg>`);
  return lines.join('\n');
}

export { buildMakerboxLogoVectorPath, MAKERBOX_LOGO_ASPECT_RATIO };

// ============================================================================
// Generador 3D (.STL) de 1 Marco Conector Plano de 3.0 mm (Sin anillo de apoyo):
// - Altura total plana = 3.0 mm (z = 0.0 -> 3.0 mm), idéntica a la madera de 3.0 mm
// - Cavidad cilíndrica pasante press-fit para el centro de madera
// - Unión Cola de Milano fija de 1.8 mm + Orificio interno de llavero
// - Malla 100% cerrada (2-Manifold, 0 bordes abiertos, 1 único sólido listo para replicar en el laminador)
// ============================================================================

interface Vec2 {
  x: number;
  y: number;
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

function cross2D(a: Vec2, b: Vec2, c: Vec2): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function pointInTriangle2D(p: Vec2, a: Vec2, b: Vec2, c: Vec2): boolean {
  const eps = -1e-7;
  const c1 = cross2D(a, b, p);
  const c2 = cross2D(b, c, p);
  const c3 = cross2D(c, a, p);
  return c1 >= eps && c2 >= eps && c3 >= eps;
}

function triangulateSimplePolygon2D(poly: Vec2[]): [number, number, number][] {
  const n = poly.length;
  if (n < 3) return [];
  const active: number[] = [];
  for (let i = 0; i < n; i++) active.push(i);

  const triangles: [number, number, number][] = [];
  let guard = n * n * 2;

  while (active.length > 3 && guard-- > 0) {
    const m = active.length;
    let bestEarIdx = -1;
    let bestScore = -Infinity;

    for (let i = 0; i < m; i++) {
      const iPrev = active[(i - 1 + m) % m];
      const iCurr = active[i];
      const iNext = active[(i + 1) % m];

      const a = poly[iPrev];
      const b = poly[iCurr];
      const c = poly[iNext];

      const area2 = cross2D(a, b, c);
      if (area2 <= 1e-6) continue;

      let containsOther = false;
      for (let j = 0; j < m; j++) {
        const idx = active[j];
        if (idx === iPrev || idx === iCurr || idx === iNext) continue;
        const p = poly[idx];
        if (
          Math.hypot(p.x - a.x, p.y - a.y) < 1e-6 ||
          Math.hypot(p.x - b.x, p.y - b.y) < 1e-6 ||
          Math.hypot(p.x - c.x, p.y - c.y) < 1e-6
        ) {
          continue;
        }
        if (pointInTriangle2D(p, a, b, c)) {
          containsOther = true;
          break;
        }
      }

      if (!containsOther) {
        const dAB2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
        const dBC2 = (c.x - b.x) ** 2 + (c.y - b.y) ** 2;
        const dCA2 = (a.x - c.x) ** 2 + (a.y - c.y) ** 2;
        const score = area2 / (dAB2 + dBC2 + dCA2 + 1e-9);
        if (score > bestScore) {
          bestScore = score;
          bestEarIdx = i;
        }
      }
    }

    if (bestEarIdx === -1) {
      for (let i = 0; i < m; i++) {
        const iPrev = active[(i - 1 + m) % m];
        const iCurr = active[i];
        const iNext = active[(i + 1) % m];
        const area2 = cross2D(poly[iPrev], poly[iCurr], poly[iNext]);
        if (area2 > bestScore) {
          bestScore = area2;
          bestEarIdx = i;
        }
      }
    }

    const iPrev = active[(bestEarIdx - 1 + m) % m];
    const iCurr = active[bestEarIdx];
    const iNext = active[(bestEarIdx + 1) % m];
    triangles.push([iPrev, iCurr, iNext]);
    active.splice(bestEarIdx, 1);
  }

  if (active.length === 3) {
    triangles.push([active[0], active[1], active[2]]);
  }

  return triangles;
}

function pushTriangle(lines: string[], a: Vec3, b: Vec3, c: Vec3) {
  const ux = b.x - a.x;
  const uy = b.y - a.y;
  const uz = b.z - a.z;
  const vx = c.x - a.x;
  const vy = c.y - a.y;
  const vz = c.z - a.z;

  let nx = uy * vz - uz * vy;
  let ny = uz * vx - ux * vz;
  let nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz);
  if (len < 1e-9) return;
  nx /= len;
  ny /= len;
  nz /= len;

  const fmt = (n: number) => (Math.abs(n) < 1e-7 ? '0.0000' : n.toFixed(4));

  lines.push(`  facet normal ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}`);
  lines.push('    outer loop');
  lines.push(`      vertex ${fmt(a.x)} ${fmt(a.y)} ${fmt(a.z)}`);
  lines.push(`      vertex ${fmt(b.x)} ${fmt(b.y)} ${fmt(b.z)}`);
  lines.push(`      vertex ${fmt(c.x)} ${fmt(c.y)} ${fmt(c.z)}`);
  lines.push('    endloop');
  lines.push('  endfacet');
}

function pushQuad(lines: string[], a: Vec3, b: Vec3, c: Vec3, d: Vec3) {
  pushTriangle(lines, a, b, c);
  pushTriangle(lines, a, c, d);
}

function appendSingleFrameStlFacets(
  lines: string[],
  params: BadgesTeamParams,
  offsetX = 0,
  offsetY = 0
) {
  const cavityDiameter = params.woodCenterDiameterMm + 2 * params.clearanceMm;
  const rCavity = cavityDiameter / 2;

  // Chapa completamente plana de 3.0 mm (z0 = 0.0 -> z1 = 3.0 mm), sin anillo de apoyo
  const z0 = 0.0;
  const z1 = FIXED_FRAME_HEIGHT_MM; // 3.0 mm

  const outerLoop = computeOuterFrameContourPoints(
    params.geometry,
    rCavity,
    params.clearanceMm,
    params.dovetailSizeMm
  );
  const nOut = outerLoop.length;
  const halfOut = nOut / 2;

  const nCav = 72;
  const halfCav = nCav / 2;
  const cavityLoop: Vec2[] = [];
  for (let j = 0; j < nCav; j++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * j) / nCav;
    const c = Math.abs(Math.cos(angle)) < 1e-7 ? 0 : Math.cos(angle);
    const s = Math.abs(Math.sin(angle)) < 1e-7 ? 0 : Math.sin(angle);
    cavityLoop.push({ x: rCavity * c, y: rCavity * s });
  }

  const holeSpec = getInternalKeychainHoleSpec(
    params.geometry,
    rCavity,
    params.holeDiameterMm
  );
  const rHole = holeSpec.holeRadiusMm;
  const holeCenterY = -holeSpec.offsetFromCenterMm;
  const nHole = 36;
  const halfHole = nHole / 2;
  const holeLoop: Vec2[] = [];
  for (let j = 0; j < nHole; j++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * j) / nHole;
    const c = Math.abs(Math.cos(angle)) < 1e-7 ? 0 : Math.cos(angle);
    const s = Math.abs(Math.sin(angle)) < 1e-7 ? 0 : Math.sin(angle);
    holeLoop.push({ x: rHole * c, y: holeCenterY + rHole * s });
  }

  const rightPoly: Vec2[] = [];
  for (let i = 0; i <= halfOut; i++) rightPoly.push(outerLoop[i]);
  for (let i = halfCav; i >= 0; i--) rightPoly.push(cavityLoop[i]);
  for (let i = halfHole; i >= 0; i--) rightPoly.push(holeLoop[i]);

  const leftPoly: Vec2[] = [];
  for (let i = halfOut; i < nOut; i++) leftPoly.push(outerLoop[i]);
  leftPoly.push(outerLoop[0]);
  leftPoly.push(holeLoop[0]);
  for (let i = nHole - 1; i >= halfHole; i--) leftPoly.push(holeLoop[i]);
  leftPoly.push(cavityLoop[0]);
  for (let i = nCav - 1; i >= halfCav; i--) leftPoly.push(cavityLoop[i]);

  const rightTris = triangulateSimplePolygon2D(rightPoly);
  const leftTris = triangulateSimplePolygon2D(leftPoly);

  const to3D = (p: Vec2, z: number): Vec3 => ({
    x: offsetX + p.x,
    y: offsetY + p.y,
    z,
  });

  // 1. Tapa Superior (z = 3.0 mm, normal +Z) y Tapa Inferior (z = 0.0 mm, normal -Z)
  for (const [ia, ib, ic] of rightTris) {
    const a = rightPoly[ia];
    const b = rightPoly[ib];
    const c = rightPoly[ic];
    pushTriangle(lines, to3D(a, z1), to3D(b, z1), to3D(c, z1));
    pushTriangle(lines, to3D(a, z0), to3D(c, z0), to3D(b, z0));
  }
  for (const [ia, ib, ic] of leftTris) {
    const a = leftPoly[ia];
    const b = leftPoly[ib];
    const c = leftPoly[ic];
    pushTriangle(lines, to3D(a, z1), to3D(b, z1), to3D(c, z1));
    pushTriangle(lines, to3D(a, z0), to3D(c, z0), to3D(b, z0));
  }

  // 2. Pared Perimetral Exterior (Polígono + Cola de Milano de 1.8 mm) de z = 0.0 a z = 3.0 mm
  for (let i = 0; i < nOut; i++) {
    const inext = (i + 1) % nOut;
    const p0 = outerLoop[i];
    const p1 = outerLoop[inext];
    pushQuad(
      lines,
      to3D(p0, z0),
      to3D(p1, z0),
      to3D(p1, z1),
      to3D(p0, z1)
    );
  }

  // 3. Pared Cilíndrica del Orificio Interno para Llavero de z = 0.0 a z = 3.0 mm
  for (let j = 0; j < nHole; j++) {
    const jnext = (j + 1) % nHole;
    const h0 = holeLoop[j];
    const h1 = holeLoop[jnext];
    pushQuad(
      lines,
      to3D(h1, z0),
      to3D(h0, z0),
      to3D(h0, z1),
      to3D(h1, z1)
    );
  }

  // 4. Pared Cilíndrica Pasante donde encaja el Centro de Madera (3.0 mm de altura plana, sin anillo inferior)
  for (let j = 0; j < nCav; j++) {
    const jnext = (j + 1) % nCav;
    const c0 = cavityLoop[j];
    const c1 = cavityLoop[jnext];
    pushQuad(
      lines,
      to3D(c1, z0),
      to3D(c0, z0),
      to3D(c0, z1),
      to3D(c1, z1)
    );
  }
}

/**
 * Genera el archivo .STL con 1 ÚNICO marco conector centrado en (0,0) de 3.0 mm de espesor plano,
 * listo para replicarse directamente en el laminador 3D según la cantidad de integrantes.
 */
export function generateBadgesConnectorStl(params: BadgesTeamParams): string {
  const solidName = `MakerBox_Taller4_Marco_${params.geometry.toUpperCase()}_3mm`;
  const lines: string[] = [];
  lines.push(`solid ${solidName}`);
  appendSingleFrameStlFacets(lines, params, 0, 0);
  lines.push(`endsolid ${solidName}`);
  return lines.join('\n');
}
