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

/** Constantes fijas por material y fabricación digital */
export const FIXED_WOOD_THICKNESS_MM = 3.0;
export const FIXED_PRESS_FIT_CLEARANCE_MM = 0.15;
export const FIXED_SUPPORT_RING_HEIGHT_MM = 0.8;
export const FIXED_WOOD_CYLINDER_HEIGHT_MM = 3.5;
export const FIXED_TOTAL_FRAME_HEIGHT_MM =
  FIXED_SUPPORT_RING_HEIGHT_MM + FIXED_WOOD_CYLINDER_HEIGHT_MM; // 4.3 mm

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
  dovetailSizeMm: number; // Slider: 1.8..3.4 mm
  woodThicknessMm: number; // Fijo: 3.0 mm
  clearanceMm: number; // Fijo: 0.15 mm
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
    title: 'Polígonos Regulares, Teselación y Protección Estructural',
    summary:
      'Analizamos los ángulos interiores del triángulo (60°), pentágono (108°) y hexágono (120°) y combinamos un centro de madera de 3 mm con un exoesqueleto impreso en 3D (PLA) con encajes cola de milano.',
    learningGoal:
      'Demostrar matemáticamente qué polígonos teselan el plano (divisores de 360°) y cómo protegen estructuralmente la madera.',
    badgeColor: 'sky',
  },
  nivel3: {
    id: 'nivel3',
    grades: 'Nivel 3 (8° Básico)',
    title: 'Tolerancias de Fabricación Digital y Ajuste Press-Fit',
    summary:
      'Parametrizamos el diámetro de la chapa (36–44 mm), el orificio interno (3.8–4.4 mm) y la junta cola de milano manteniendo una tolerancia fija de 0.15 mm para el encaje a presión de la madera de 3 mm.',
    learningGoal:
      'Dominar el ajuste mecánico press-fit, la optimización de tiempos de manufactura y el diseño paramétrico CAD/CAM.',
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
      '6 lados planos con encajes tipo cola de milano (3 machos + 3 hembras opuestas). Sus ángulos de 120° calzan de a 3 en cada vértice (3 × 120° = 360°) sin dejar ningún espacio vacío.',
    whyEfficiencyNote:
      'Teorema del Panal: De todos los polígonos que cubren una superficie sin huecos, el hexágono es el que tiene menor perímetro para encerrar un círculo de madera, ahorrando hasta un 42% de PLA y tiempo de impresión frente al triángulo.',
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
      '5 lados planos con encajes cola de milano que permiten unir las chapitas al centro, pero cuyos ángulos interiores de 108° no dividen exactamente los 360° de un giro completo.',
    whyEfficiencyNote:
      'Al juntar 3 pentágonos en un vértice suman 3 × 108° = 324°, dejando una ranura vacía de 36°. Por eso en la naturaleza los panales nunca son pentagonales.',
    relativePlaFactor: '+16% más PLA que el hexágono',
  },
  triangulo: {
    id: 'triangulo',
    name: 'Triángulo Equilátero (Alto Consumo de Material)',
    shortName: 'Triángulo',
    sides: 3,
    interiorAngleDeg: 60,
    tessellatesPlane: true,
    natureBadge: '📐 Tesela a 60°, pero gasta mucho material',
    description:
      '3 lados planos con encajes cola de milano que obligan a alternar las chapitas hacia arriba y hacia abajo (180°) para poder acoplarlas en red.',
    whyEfficiencyNote:
      'Aunque 6 triángulos sí suman 360° (6 × 60°), para rodear un círculo de madera el triángulo necesita puntas muy largas y agudas, consumiendo ~68% más plástico PLA y tiempo de impresión que el hexágono.',
    relativePlaFactor: '+68% más PLA y tiempo que el hexágono',
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
 * Distancia del centro (0,0) a cada cara plana del polígono (apotema base),
 * garantizando pared sólida suficiente detrás de las cajas hembra Cola de Milano y del orificio interno.
 */
export function getBadgeHoneycombApothem(
  cavityRadiusMm: number,
  dovetailSizeMm = 2.4,
  geometry: FrameGeometryId = 'hexagono'
): number {
  if (geometry === 'triangulo') {
    return cavityRadiusMm + 3.8 + dovetailSizeMm;
  }
  return cavityRadiusMm + 4.2 + dovetailSizeMm;
}

/**
 * Posición del orificio interno para argolla de llavero (dentro del vértice superior en theta = -90°, sin sobresalir).
 */
export function getInternalKeychainHoleSpec(
  geometry: FrameGeometryId,
  cavityRadiusMm: number,
  holeDiameterMm = 4.0
): { offsetFromCenterMm: number; holeRadiusMm: number; holeDiameterMm: number } {
  const holeRadiusMm = holeDiameterMm / 2;
  if (geometry === 'triangulo') {
    return {
      offsetFromCenterMm: cavityRadiusMm + 3.1 + holeRadiusMm,
      holeRadiusMm,
      holeDiameterMm,
    };
  }
  if (geometry === 'pentagono') {
    return {
      offsetFromCenterMm: cavityRadiusMm + 2.5 + holeRadiusMm,
      holeRadiusMm,
      holeDiameterMm,
    };
  }
  return {
    offsetFromCenterMm: cavityRadiusMm + 2.35 + holeRadiusMm,
    holeRadiusMm,
    holeDiameterMm,
  };
}

/**
 * Genera el contorno exterior cerrado (sin vértices duplicados) en orden antihorario (CCW en X,Y)
 * comenzando exactamente en el vértice superior O_top (x = 0, y < 0, ángulo -90°).
 * Cada cara emite exactamente 6 vértices:
 *   V0 (esquina inicial), V1 (cuello izq), V2 (cabeza izq), V3 (centro cresta/base), V4 (cabeza der), V5 (cuello der).
 * De este modo:
 *   - El índice 0 es SIEMPRE O_top = (0, y_top < 0)
 *   - El índice N_out / 2 es SIEMPRE O_bot = (0, y_bot > 0)
 */
export function computeOuterFrameContourPoints(
  geometry: FrameGeometryId,
  cavityRadiusMm: number,
  clearanceMm: number,
  dovetailSizeMm = 2.4
): { x: number; y: number; theta: number }[] {
  const apothem = getBadgeHoneycombApothem(cavityRadiusMm, dovetailSizeMm, geometry);
  const pts: { x: number; y: number; theta: number }[] = [];

  const hMale = dovetailSizeMm;
  const neckHalfMale = dovetailSizeMm * 0.9;
  const headHalfMale = dovetailSizeMm * 1.36;

  const hFemale = hMale + clearanceMm;
  const neckHalfFemale = neckHalfMale + clearanceMm;
  const headHalfFemale = headHalfMale + clearanceMm;

  const sides = geometry === 'hexagono' ? 6 : geometry === 'pentagono' ? 5 : 3;
  const L_half = apothem * Math.tan(Math.PI / sides);

  // Orden de las caras comenzando por la cara superior-derecha (cuyo vértice inicial V0 está en -90° -> x = 0, y < 0):
  // - Hexágono (6): -60° (H), 0° (M), +60° (M), +120° (M), 180° (H), -120° (H)
  // - Pentágono (5): -54° (M), +18° (M), +90° (M), +162° (H), -126° (H)
  // - Triángulo (3): -30° (M), +90° (M), -150° (H)
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

    // 6 vértices exactos por cara (sin duplicar la esquina final +L_half que es la inicial de la siguiente cara):
    pushUV(-L_half, 0); // V0: Esquina inicial de la cara
    pushUV(-neckHalf, 0); // V1: Cuello izquierdo Cola de Milano
    pushUV(-headHalf, depth); // V2: Cabeza izquierda Cola de Milano
    pushUV(0, depth); // V3: Punto medio exacto de la Cola de Milano
    pushUV(headHalf, depth); // V4: Cabeza derecha Cola de Milano
    pushUV(neckHalf, 0); // V5: Cuello derecho Cola de Milano
  }

  return pts;
}

export interface BadgesManufacturingTelemetry {
  laserTimePerBadgeSec: number;
  laserTotalTimeFormatted: string;
  printTimePerFrameMin: number;
  printTotalTimeFormatted: string;
  plaWeightPerFrameGrams: number;
  plaTotalWeightGrams: number;
  polygonAreaMm2: number;
  efficiencyScorePct: number;
}

/**
 * Calcula los tiempos estimados de corte/grabado láser en Falcon Design Space
 * y de impresión 3D en PLA para el equipo completo (con anillo de apoyo de 0.8 mm y cilindro de 3.5 mm).
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

  // Volumen neto de PLA por marco:
  // - Anillo de apoyo inferior de 0.8 mm de altura y 1.8 mm de ancho
  // - Cuerpo exterior de 4.3 mm de altura total (0.8 mm apoyo + 3.5 mm cilindro de encaje)
  const supportInnerRadius = rCav - 1.8;
  const supportRingAreaMm2 = cavityAreaMm2 - Math.PI * supportInnerRadius * supportInnerRadius;
  const outerFrameWallAreaMm2 = Math.max(120, outerPolygonAreaMm2 - cavityAreaMm2 - holeAreaMm2);
  const rawVolumeMm3 =
    supportRingAreaMm2 * FIXED_SUPPORT_RING_HEIGHT_MM +
    outerFrameWallAreaMm2 * FIXED_TOTAL_FRAME_HEIGHT_MM;

  const plaWeightPerFrameGrams = Number(((rawVolumeMm3 / 1000) * 0.68 * 1.24).toFixed(1));
  const plaTotalWeightGrams = Number((plaWeightPerFrameGrams * count).toFixed(1));

  const printTimePerFrameMin = Math.max(8, Math.round(plaWeightPerFrameGrams * 2.95));
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

  return {
    laserTimePerBadgeSec,
    laserTotalTimeFormatted,
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

    // 1. ARRIBA (Sobre el ícono): Nombre del Equipo / Texto Secundario
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

    // 2. CENTRO: Ícono Central
    lines.push(
      `    <g transform="translate(${cx.toFixed(2)}, ${iconCenterY.toFixed(
        2
      )}) scale(${iconScale.toFixed(3)})" stroke="#0000FF" stroke-width="0.68" stroke-linecap="round" stroke-linejoin="round" fill="none">`
    );
    for (const d of iconInfo.svgPaths) {
      lines.push(`      <path d="${d}" />`);
    }
    lines.push(`    </g>`);

    // 3. DEBAJO DEL ÍCONO: Nombre del Estudiante o Mascota
    lines.push(
      `    <text x="${cx.toFixed(2)}" y="${(cy + radius * 0.34).toFixed(
        2
      )}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${primaryFontSize.toFixed(
        2
      )}" font-weight="bold" fill="#0000FF" stroke="#0000FF" stroke-width="0.1">${escapeXml(
        primaryLabel.toUpperCase()
      )}</text>`
    );

    // 4. ABAJO (Bajo el nombre del estudiante): Logo Oficial de MakerBox
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

export { buildMakerboxLogoVectorPath, MAKERBOX_LOGO_ASPECT_RATIO };

// ============================================================================
// Generador 3D (.STL) 100% Cerrado (2-Manifold, 0 bordes abiertos, 1 único sólido por marco):
// - Anillo de apoyo inferior: 0.8 mm de altura (z = 0.0 -> 0.8 mm)
// - Cilindro donde encaja el centro de madera: 3.5 mm de altura (z = 0.8 -> 4.3 mm)
// - Unión Cola de Milano + Geometría Exterior + Orificio de Llavero triangulados
//   como una única malla continua cerrada mediante descomposición simétrica + Ear-Clipping 2D.
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

/**
 * Triangulador Ear-Clipping exacto para un polígono 2D simple (sin agujeros) con área firmada positiva.
 * Devuelve una lista de tripletes de índices [i, j, k] que usan exclusivamente los vértices de `poly`,
 * garantizando 0 vértices T-junction y emparejamiento exacto de aristas en 3D.
 */
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
      if (area2 <= 1e-6) continue; // No es oreja convexa

      let containsOther = false;
      for (let j = 0; j < m; j++) {
        const idx = active[j];
        if (idx === iPrev || idx === iCurr || idx === iNext) continue;
        const p = poly[idx];
        // Si coincide exactamente con alguno de los vértices del triángulo, ignorar
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
        // Puntaje de calidad del triángulo (2 * área / suma de lados al cuadrado -> premia triángulos equiláteros)
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
      // Fallback por tolerancia numérica: elegir la oreja con mayor cross2D positivo
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
  offsetX: number,
  offsetY: number
) {
  const cavityDiameter = params.woodCenterDiameterMm + 2 * params.clearanceMm;
  const rCavity = cavityDiameter / 2;
  const rSupport = rCavity - 1.8; // Anillo donde se apoya el centro de madera (1.8 mm de ancho radial)

  // Alturas Z solicitadas:
  // - Anillo de apoyo inferior: 0.8 mm (z0 = 0.0 -> z1 = 0.8 mm)
  // - Cilindro donde encaja el centro de madera: 3.5 mm (z1 = 0.8 -> z2 = 4.3 mm)
  const z0 = 0.0;
  const z1 = FIXED_SUPPORT_RING_HEIGHT_MM; // 0.8 mm
  const z2 = FIXED_TOTAL_FRAME_HEIGHT_MM; // 4.3 mm (0.8 + 3.5 mm)

  // 1. Contorno exterior con Cola de Milano (N_out par: 36, 30 o 18)
  //    outerLoop[0] está en (0, y_top < 0) y outerLoop[N_out/2] está en (0, y_bot > 0)
  const outerLoop = computeOuterFrameContourPoints(
    params.geometry,
    rCavity,
    params.clearanceMm,
    params.dovetailSizeMm
  );
  const nOut = outerLoop.length;
  const halfOut = nOut / 2;

  // 2. Círculo de la cavidad de madera (rCavity) y círculo interior del anillo de apoyo (rSupport)
  //    nCav = 72 (par): índice 0 en -90° (0, -r) e índice 36 en +90° (0, +r)
  const nCav = 72;
  const halfCav = nCav / 2;
  const cavityLoop: Vec2[] = [];
  const supportLoop: Vec2[] = [];
  for (let j = 0; j < nCav; j++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * j) / nCav;
    const c = Math.abs(Math.cos(angle)) < 1e-7 ? 0 : Math.cos(angle);
    const s = Math.abs(Math.sin(angle)) < 1e-7 ? 0 : Math.sin(angle);
    cavityLoop.push({ x: rCavity * c, y: rCavity * s });
    supportLoop.push({ x: rSupport * c, y: rSupport * s });
  }

  // 3. Círculo del orificio pasante interno para llavero (centrado en (0, -holeOffset))
  //    nHole = 36 (par): índice 0 en -90° (0, -(holeOffset + rHole)) e índice 18 en +90° (0, -(holeOffset - rHole))
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

  // 4. Descomposición exacta de la corona superior/inferior en DOS polígonos simples sin agujeros:
  //    - Mitad Derecha (x >= 0)
  //    - Mitad Izquierda (x <= 0)
  //    Ambos comparten exactamente las 3 costuras sobre el eje X = 0 con orientación opuesta.
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

  // 5. Tapa Superior (z = z2 = 4.3 mm, normal +Z) y Tapa Inferior de la Corona (z = z0 = 0.0 mm, normal -Z)
  for (const [ia, ib, ic] of rightTris) {
    const a = rightPoly[ia];
    const b = rightPoly[ib];
    const c = rightPoly[ic];
    pushTriangle(lines, to3D(a, z2), to3D(b, z2), to3D(c, z2));
    pushTriangle(lines, to3D(a, z0), to3D(c, z0), to3D(b, z0));
  }
  for (const [ia, ib, ic] of leftTris) {
    const a = leftPoly[ia];
    const b = leftPoly[ib];
    const c = leftPoly[ic];
    pushTriangle(lines, to3D(a, z2), to3D(b, z2), to3D(c, z2));
    pushTriangle(lines, to3D(a, z0), to3D(c, z0), to3D(b, z0));
  }

  // 6. Pared Perimetral Exterior (Geometría + Cola de Milano unificadas) desde z0 = 0.0 hasta z2 = 4.3 mm
  for (let i = 0; i < nOut; i++) {
    const inext = (i + 1) % nOut;
    const p0 = outerLoop[i];
    const p1 = outerLoop[inext];
    pushQuad(
      lines,
      to3D(p0, z0),
      to3D(p1, z0),
      to3D(p1, z2),
      to3D(p0, z2)
    );
  }

  // 7. Pared Cilíndrica del Orificio Interno para Llavero desde z0 = 0.0 hasta z2 = 4.3 mm
  //    (Cosida vértice a vértice con holeLoop en z0 y z2)
  for (let j = 0; j < nHole; j++) {
    const jnext = (j + 1) % nHole;
    const h0 = holeLoop[j];
    const h1 = holeLoop[jnext];
    pushQuad(
      lines,
      to3D(h1, z0),
      to3D(h0, z0),
      to3D(h0, z2),
      to3D(h1, z2)
    );
  }

  // 8. Cilindro de Encaje del Centro de Madera (3.5 mm de altura: z1 = 0.8 -> z2 = 4.3 mm)
  //    + Anillo de Apoyo Inferior (0.8 mm de altura: z0 = 0.0 -> z1 = 0.8 mm)
  //    (Cosidos vértice a vértice con cavityLoop en z0 y z2)
  for (let j = 0; j < nCav; j++) {
    const jnext = (j + 1) % nCav;
    const c0 = cavityLoop[j];
    const c1 = cavityLoop[jnext];
    const s0 = supportLoop[j];
    const s1 = supportLoop[jnext];

    // 8a. Pared cilíndrica vertical donde encaja la madera (altura = 3.5 mm, de z1 a z2, normal hacia el centro)
    pushQuad(
      lines,
      to3D(c1, z1),
      to3D(c0, z1),
      to3D(c0, z2),
      to3D(c1, z2)
    );

    // 8b. Cara horizontal superior del anillo de apoyo en z1 = 0.8 mm (normal +Z)
    pushQuad(
      lines,
      to3D(c0, z1),
      to3D(c1, z1),
      to3D(s1, z1),
      to3D(s0, z1)
    );

    // 8c. Pared cilíndrica interior del anillo de apoyo (altura = 0.8 mm, de z0 a z1, normal hacia el centro)
    pushQuad(
      lines,
      to3D(s1, z0),
      to3D(s0, z0),
      to3D(s0, z1),
      to3D(s1, z1)
    );

    // 8d. Cara horizontal inferior del anillo de apoyo en z0 = 0.0 mm (normal -Z, continúa hacia la tapa inferior en c0..c1)
    pushQuad(
      lines,
      to3D(s0, z0),
      to3D(s1, z0),
      to3D(c1, z0),
      to3D(c0, z0)
    );
  }
}

/**
 * Genera el contenido .STL incluyendo SIEMPRE todos los marcos conectores 3D del equipo.
 */
export function generateBadgesConnectorStl(params: BadgesTeamParams): string {
  const count = params.memberCount;
  const solidName = `MakerBox_Taller4_Marcos_${params.geometry.toUpperCase()}_${count}x`;
  const lines: string[] = [];
  lines.push(`solid ${solidName}`);

  const apothem = getBadgeHoneycombApothem(
    params.woodCenterDiameterMm / 2 + params.clearanceMm,
    params.dovetailSizeMm,
    params.geometry
  );
  const pitch = Math.round(apothem * 3.6 + 14);
  const cols = Math.min(3, count);

  for (let idx = 0; idx < count; idx++) {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const ox = col * pitch;
    const oy = row * pitch;
    appendSingleFrameStlFacets(lines, params, ox, oy);
  }

  lines.push(`endsolid ${solidName}`);
  return lines.join('\n');
}
