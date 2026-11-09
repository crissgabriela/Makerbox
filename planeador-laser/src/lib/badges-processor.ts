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
 * garantizando pared suficiente detrás de las cajas hembra Cola de Milano y del orificio interno.
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
 * Posición del orificio interno para argolla de llavero (dentro del vértice superior, sin sobresalir).
 * En coordenadas 2D donde (0, -Y) es arriba en pantalla.
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
  // Hexágono: vértice superior en -90°
  return {
    offsetFromCenterMm: cavityRadiusMm + 2.35 + holeRadiusMm,
    holeRadiusMm,
    holeDiameterMm,
  };
}

/**
 * Genera el contorno exterior exacto en coordenadas cartesianas (x, y) con encajes tipo Cola de Milano
 * para Hexágono (6 lados), Pentágono (5 lados) y Triángulo Equilátero (3 lados).
 * En las 3 geometrías el vértice superior apunta a -90° (arriba) para alojar el orificio interno del llavero.
 */
export function computeOuterFrameContourPoints(
  geometry: FrameGeometryId,
  cavityRadiusMm: number,
  clearanceMm: number,
  dovetailSizeMm = 2.4
): { x: number; y: number; theta: number }[] {
  const apothem = getBadgeHoneycombApothem(cavityRadiusMm, dovetailSizeMm, geometry);
  const pts: { x: number; y: number; theta: number }[] = [];

  // Dimensiones paramétricas del trapecio Cola de Milano según el deslizador dovetailSizeMm
  const hMale = dovetailSizeMm;
  const neckHalfMale = dovetailSizeMm * 0.9;
  const headHalfMale = dovetailSizeMm * 1.36;

  const hFemale = hMale + clearanceMm;
  const neckHalfFemale = neckHalfMale + clearanceMm;
  const headHalfFemale = headHalfMale + clearanceMm;

  const sides = geometry === 'hexagono' ? 6 : geometry === 'pentagono' ? 5 : 3;
  // Mitad de la longitud de cada lado plano del polígono circunscrito al apotema: L_half = A * tan(pi / sides)
  const L_half = apothem * Math.tan(Math.PI / sides);

  // Ángulos normales exteriores de cada cara plana de modo que siempre exista un vértice apuntando arriba (-90°):
  // - Hexágono (6): 0°, 60°, 120° (Macho) y 180°, 240°, 300° (Hembra) -> Vértice superior en -90°
  // - Pentágono (5): -54°, +18°, +90° (Macho) y +162°, -126° (Hembra) -> Vértice superior en -90°
  // - Triángulo (3): -30°, +90° (Macho) y -150° (Hembra) -> Vértice superior en -90°
  const faceNormalsRad: { alpha: number; isMale: boolean }[] =
    geometry === 'hexagono'
      ? [
          { alpha: 0, isMale: true },
          { alpha: Math.PI / 3, isMale: true },
          { alpha: (2 * Math.PI) / 3, isMale: true },
          { alpha: Math.PI, isMale: false },
          { alpha: (4 * Math.PI) / 3, isMale: false },
          { alpha: (5 * Math.PI) / 3, isMale: false },
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

  const stepsEdge = 10;
  const stepsDove = 6;

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
      const x = (apothem + v) * nx + u * tx;
      const y = (apothem + v) * ny + u * ty;
      pts.push({ x, y, theta: Math.atan2(y, x) });
    };

    // Tramo plano 1: -L_half -> -neckHalf
    for (let i = 0; i <= stepsEdge; i++) {
      const u = -L_half + ((-neckHalf - -L_half) * i) / stepsEdge;
      pushUV(u, 0);
    }
    // Flanco izquierdo Cola de Milano: (-neckHalf, 0) -> (-headHalf, depth)
    for (let i = 1; i <= stepsDove; i++) {
      const t = i / stepsDove;
      pushUV(-neckHalf + (-headHalf - -neckHalf) * t, depth * t);
    }
    // Cresta/base plana Cola de Milano: (-headHalf, depth) -> (+headHalf, depth)
    for (let i = 1; i <= stepsDove; i++) {
      const t = i / stepsDove;
      pushUV(-headHalf + 2 * headHalf * t, depth);
    }
    // Flanco derecho Cola de Milano: (+headHalf, depth) -> (+neckHalf, 0)
    for (let i = 1; i <= stepsDove; i++) {
      const t = i / stepsDove;
      pushUV(headHalf + (neckHalf - headHalf) * t, depth * (1 - t));
    }
    // Tramo plano 2: +neckHalf -> +L_half
    for (let i = 1; i < stepsEdge; i++) {
      const u = neckHalf + ((L_half - neckHalf) * i) / stepsEdge;
      pushUV(u, 0);
    }
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
 * y de impresión 3D en PLA para el equipo completo.
 */
export function estimateBadgesManufacturingTimes(
  params: BadgesTeamParams
): BadgesManufacturingTelemetry {
  const count = params.memberCount;
  const rWood = params.woodCenterDiameterMm / 2;
  const rCav = rWood + params.clearanceMm;
  const apothem = getBadgeHoneycombApothem(rCav, params.dovetailSizeMm, params.geometry);
  const sides = params.geometry === 'hexagono' ? 6 : params.geometry === 'pentagono' ? 5 : 3;

  // Área exterior del polígono circunscrito: N * A^2 * tan(pi / N)
  const outerPolygonAreaMm2 = sides * apothem * apothem * Math.tan(Math.PI / sides);
  const woodCircleAreaMm2 = Math.PI * rWood * rWood;
  const cavityAreaMm2 = Math.PI * rCav * rCav;
  const holeAreaMm2 = Math.PI * Math.pow(params.holeDiameterMm / 2, 2);

  // Eficiencia geométrica de empaquetamiento (Área circular útil / Área total del polígono)
  const efficiencyScorePct = Math.round((woodCircleAreaMm2 / outerPolygonAreaMm2) * 100);

  // Volumen neto de PLA por marco (anillo base de 1 mm + pared de 4 mm en la corona exterior)
  const bottomLipAreaMm2 = Math.PI * Math.pow(rCav - 1.2, 2);
  const baseRingAreaMm2 = cavityAreaMm2 - bottomLipAreaMm2;
  const outerFrameWallAreaMm2 = Math.max(120, outerPolygonAreaMm2 - cavityAreaMm2 - holeAreaMm2);
  const rawVolumeMm3 = baseRingAreaMm2 * 1.0 + outerFrameWallAreaMm2 * 5.0;

  // Factor de laminado 3D (perímetros + 20% infill + tapas = ~0.68 del volumen sólido, densidad PLA 1.24 g/cm³)
  const plaWeightPerFrameGrams = Number(((rawVolumeMm3 / 1000) * 0.68 * 1.24).toFixed(1));
  const plaTotalWeightGrams = Number((plaWeightPerFrameGrams * count).toFixed(1));

  // Tiempo de impresión 3D (~2.95 min por gramo de PLA en capa 0.20 mm)
  const printTimePerFrameMin = Math.max(9, Math.round(plaWeightPerFrameGrams * 2.95));
  const totalPrintMin = printTimePerFrameMin * count;
  const printHours = Math.floor(totalPrintMin / 60);
  const printRemMin = totalPrintMin % 60;
  const printTotalTimeFormatted =
    printHours > 0 ? `${printHours} h ${printRemMin} min` : `${totalPrintMin} min`;

  // Tiempo de corte + grabado láser en Falcon Design Space (Contrachapado 3 mm)
  // Corte exterior (~8 mm/s) + Grabado vectorial de nombre equipo, ícono, nombre estudiante y logo MakerBox
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
 * listo para abrir en Falcon Design Space:
 * - Arriba (sobre el ícono): Nombre del Equipo / Texto Secundario (#0000FF)
 * - Centro: Ícono Central Emblema (#0000FF)
 * - Debajo del ícono: Nombre del Estudiante o Mascota (#0000FF)
 * - Abajo (bajo el nombre): Logo oficial de MakerBox (#0000FF)
 * - Exterior: Círculo de corte láser en rojo (#FF0000, 0.1 mm)
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

    // Anillo decorativo interior
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

    // 2. CENTRO: Ícono Central (Emblema vectorial)
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

  // Capa de corte exterior rojo (#FF0000, 0.1 mm)
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
// Generador 3D (.STL) de todos los Marcos Conectores en PLA del equipo:
// - Geometría Hexagonal / Pentagonal / Triangular con Cola de Milano
// - Cavidad central press-fit (madera 3.0 mm + holgura 0.15 mm)
// - Orificio para llavero INTERNO parametrizado (3.8 a 4.4 mm)
// ============================================================================

interface Vec3 {
  x: number;
  y: number;
  z: number;
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
  if (len < 1e-8) return;
  nx /= len;
  ny /= len;
  nz /= len;

  lines.push(`  facet normal ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}`);
  lines.push('    outer loop');
  lines.push(`      vertex ${a.x.toFixed(4)} ${a.y.toFixed(4)} ${a.z.toFixed(4)}`);
  lines.push(`      vertex ${b.x.toFixed(4)} ${b.y.toFixed(4)} ${b.z.toFixed(4)}`);
  lines.push(`      vertex ${c.x.toFixed(4)} ${c.y.toFixed(4)} ${c.z.toFixed(4)}`);
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
  const rBottomLip = rCavity - 1.2;
  const rSnapBevel = rCavity - 0.24;
  const rTopEntry = rCavity + 0.12;
  const rInnerRing = rCavity + 1.25;

  const z0 = 0.0;
  const z1 = 1.0;
  const z2 = Number((1.0 + params.woodThicknessMm + 0.1).toFixed(3)); // 4.1 mm
  const z3 = Number((z2 + 0.45).toFixed(3));
  const z4 = Number(Math.max(5.0, z2 + 0.9).toFixed(3)); // 5.0 mm

  const outerPts = computeOuterFrameContourPoints(
    params.geometry,
    rCavity,
    params.clearanceMm,
    params.dovetailSizeMm
  );
  const numSteps = outerPts.length;

  // 1. Anillo interior escalonado Press-Fit (360° continuos)
  for (let i = 0; i < numSteps; i++) {
    const inext = (i + 1) % numSteps;
    const t0 = outerPts[i].theta;
    const t1 = outerPts[inext].theta;
    const c0 = Math.cos(t0);
    const s0 = Math.sin(t0);
    const c1 = Math.cos(t1);
    const s1 = Math.sin(t1);

    const pt = (r: number, c: number, s: number, z: number): Vec3 => ({
      x: offsetX + r * c,
      y: offsetY + r * s,
      z,
    });

    const ringA0 = pt(rInnerRing, c0, s0, z0);
    const ringB0 = pt(rInnerRing, c1, s1, z0);
    const ringA4 = pt(rInnerRing, c0, s0, z4);
    const ringB4 = pt(rInnerRing, c1, s1, z4);

    const inTopA = pt(rTopEntry, c0, s0, z4);
    const inTopB = pt(rTopEntry, c1, s1, z4);
    pushQuad(lines, ringA4, ringB4, inTopB, inTopA);

    const inSnapA = pt(rSnapBevel, c0, s0, z3);
    const inSnapB = pt(rSnapBevel, c1, s1, z3);
    pushQuad(lines, inTopA, inTopB, inSnapB, inSnapA);

    const inCavTopA = pt(rCavity, c0, s0, z2);
    const inCavTopB = pt(rCavity, c1, s1, z2);
    pushQuad(lines, inSnapA, inSnapB, inCavTopB, inCavTopA);

    const inCavBotA = pt(rCavity, c0, s0, z1);
    const inCavBotB = pt(rCavity, c1, s1, z1);
    pushQuad(lines, inCavTopA, inCavTopB, inCavBotB, inCavTopA);

    const inLipTopA = pt(rBottomLip, c0, s0, z1);
    const inLipTopB = pt(rBottomLip, c1, s1, z1);
    pushQuad(lines, inCavBotA, inCavBotB, inLipTopB, inLipTopA);

    const inLipBotA = pt(rBottomLip, c0, s0, z0);
    const inLipBotB = pt(rBottomLip, c1, s1, z0);
    pushQuad(lines, inLipTopA, inLipTopB, inLipBotB, inLipBotA);

    pushQuad(lines, inLipBotA, inLipBotB, ringB0, ringA0);
  }

  // 2. Corona Exterior Conectora con Cola de Milano
  const holeSpec = getInternalKeychainHoleSpec(
    params.geometry,
    rCavity,
    params.holeDiameterMm
  );
  const holeCenterX = offsetX;
  const holeCenterY = offsetY - holeSpec.offsetFromCenterMm;
  const rHole = holeSpec.holeRadiusMm;

  for (let i = 0; i < numSteps; i++) {
    const inext = (i + 1) % numSteps;
    const p0 = outerPts[i];
    const p1 = outerPts[inext];

    const c0 = Math.cos(p0.theta);
    const s0 = Math.sin(p0.theta);
    const c1 = Math.cos(p1.theta);
    const s1 = Math.sin(p1.theta);

    const outA0: Vec3 = { x: offsetX + p0.x, y: offsetY + p0.y, z: z0 };
    const outB0: Vec3 = { x: offsetX + p1.x, y: offsetY + p1.y, z: z0 };
    const outA4: Vec3 = { x: offsetX + p0.x, y: offsetY + p0.y, z: z4 };
    const outB4: Vec3 = { x: offsetX + p1.x, y: offsetY + p1.y, z: z4 };

    const ringA0: Vec3 = { x: offsetX + rInnerRing * c0, y: offsetY + rInnerRing * s0, z: z0 };
    const ringB0: Vec3 = { x: offsetX + rInnerRing * c1, y: offsetY + rInnerRing * s1, z: z0 };
    const ringA4: Vec3 = { x: offsetX + rInnerRing * c0, y: offsetY + rInnerRing * s0, z: z4 };
    const ringB4: Vec3 = { x: offsetX + rInnerRing * c1, y: offsetY + rInnerRing * s1, z: z4 };

    pushQuad(lines, outA0, outB0, outB4, outA4);
    pushQuad(lines, outA4, outB4, ringB4, ringA4);
    pushQuad(lines, ringA0, ringB0, outB0, outA0);
  }

  // 3. Pared cilíndrica interna del orificio pasante para llavero (Ø 3.8 a 4.4 mm)
  const holeSteps = 36;
  for (let j = 0; j < holeSteps; j++) {
    const a0 = (2 * Math.PI * j) / holeSteps;
    const a1 = (2 * Math.PI * (j + 1)) / holeSteps;
    const hA0: Vec3 = {
      x: holeCenterX + rHole * Math.cos(a0),
      y: holeCenterY + rHole * Math.sin(a0),
      z: z0,
    };
    const hB0: Vec3 = {
      x: holeCenterX + rHole * Math.cos(a1),
      y: holeCenterY + rHole * Math.sin(a1),
      z: z0,
    };
    const hA4: Vec3 = {
      x: holeCenterX + rHole * Math.cos(a0),
      y: holeCenterY + rHole * Math.sin(a0),
      z: z4,
    };
    const hB4: Vec3 = {
      x: holeCenterX + rHole * Math.cos(a1),
      y: holeCenterY + rHole * Math.sin(a1),
      z: z4,
    };
    pushQuad(lines, hB0, hA0, hA4, hB4);
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
