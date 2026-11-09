export type PedagogicalLevelId = 'nivel1' | 'nivel2' | 'nivel3';
export type FrameGeometryId = 'hexagono' | 'engranaje' | 'circular';
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
  woodCenterDiameterMm: number; // default 36 mm
  woodThicknessMm: number; // default 3.0 mm
  clearanceMm: number; // default 0.15 mm
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
    title: 'Inspiración en la Naturaleza (Biomimética)',
    summary:
      'Exploramos cómo las abejas construyen panales hexagonales que se conectan sin dejar espacios vacíos, logrando estructuras fuertes y colaborativas.',
    learningGoal:
      'Comprender cómo las formas geométricas naturales permiten unir piezas individuales en una comunidad.',
    badgeColor: 'amber',
  },
  nivel2: {
    id: 'nivel2',
    grades: 'Nivel 2 (7° Básico)',
    title: 'Polígonos y Protección Estructural Híbrida',
    summary:
      'Combinamos la calidez y rapidez del grabado láser en madera de 3 mm con un exoesqueleto perimetral impreso en 3D (PLA) con uniones cola de milano.',
    learningGoal:
      'Analizar la complementariedad de materiales (Madera + Polímero PLA) y el diseño de bordes conectores.',
    badgeColor: 'sky',
  },
  nivel3: {
    id: 'nivel3',
    grades: 'Nivel 3 (8° Básico)',
    title: 'Tolerancias de Fabricación Digital y Ajuste a Presión (Press-Fit)',
    summary:
      'Calculamos la holgura (clearance de 0.15 mm) tanto en la cavidad central de 36.3 mm como en los encajes cola de milano para unir las chapitas sin adhesivos.',
    learningGoal:
      'Dominar el concepto de tolerancia dimensional, interferencia elástica y ensamble mecánico tipo cola de milano.',
    badgeColor: 'purple',
  },
};

export interface FrameGeometryInfo {
  id: FrameGeometryId;
  name: string;
  shortName: string;
  description: string;
  connectionMechanism: string;
}

export const FRAME_GEOMETRIES: Record<FrameGeometryId, FrameGeometryInfo> = {
  hexagono: {
    id: 'hexagono',
    name: 'Hexágono Tipo Panal (Cola de Milano)',
    shortName: 'Panal Hexagonal',
    description:
      'Lados planos hexagonales con encajes trapezoidales tipo cola de milano (3 caras macho + 3 caras hembra opuestas) y orificio de llavero interno.',
    connectionMechanism: 'Encaje Cola de Milano macho/hembra en las 6 caras del panal',
  },
  engranaje: {
    id: 'engranaje',
    name: 'Engranaje Mecánico',
    shortName: 'Engranaje',
    description:
      'Borde exterior dentado de 12 dientes sincronizados con orificio interno para que las chapitas del grupo engranen entre sí sobre la mesa.',
    connectionMechanism: '12 dientes trapezoidales que engranan diente con valle sin superponerse',
  },
  circular: {
    id: 'circular',
    name: 'Circular con Cola de Milano',
    shortName: 'Medallón Circular',
    description:
      'Medallón redondo con encajes tipo cola de milano (3 salientes macho y 3 cavidades hembra opuestas) y perforación interna para llavero.',
    connectionMechanism: 'Uniones Cola de Milano perimetrales en red hexagonal y ojal interno',
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
  recommendedGeometry: FrameGeometryId;
  icons: BadgeIconId[];
  sampleMemberNames: string[];
}

export const AI_TEAM_IDEAS_BY_THEME: Record<IdeaThemeId, TeamIdeaSuggestion[]> = {
  animales: [
    {
      teamName: 'Manada Alfa',
      motto: 'Lealtad y naturaleza conectada',
      recommendedGeometry: 'hexagono',
      icons: ['paw', 'heart', 'shield', 'star', 'bolt'],
      sampleMemberNames: ['Max', 'Luna', 'Rocky', 'Kira', 'Toby'],
    },
    {
      teamName: 'Colmena Guardiana',
      motto: 'Unidos como un panal indestructible',
      recommendedGeometry: 'hexagono',
      icons: ['shield', 'paw', 'star', 'heart', 'bolt'],
      sampleMemberNames: ['Miel', 'Rayo', 'Nala', 'Simba', 'Coco'],
    },
    {
      teamName: 'Escuadrón Huellas',
      motto: 'Protegiendo a nuestras mascotas',
      recommendedGeometry: 'circular',
      icons: ['paw', 'heart', 'star', 'shield', 'rocket'],
      sampleMemberNames: ['Bruno', 'Lola', 'Thor', 'Mia', 'Zeus'],
    },
  ],
  espacio: [
    {
      teamName: 'Misión Orión',
      motto: 'Exploradores del cosmos profundo',
      recommendedGeometry: 'hexagono',
      icons: ['rocket', 'star', 'atom', 'robot', 'bolt'],
      sampleMemberNames: ['Nova', 'Apolo', 'Vega', 'Orión', 'Sirius'],
    },
    {
      teamName: 'Flota Galáctica',
      motto: 'Propulsión e ingeniería estelar',
      recommendedGeometry: 'engranaje',
      icons: ['star', 'rocket', 'robot', 'shield', 'atom'],
      sampleMemberNames: ['Cosmos', 'Estela', 'Halley', 'Titán', 'Lyra'],
    },
    {
      teamName: 'Pioneros de Marte',
      motto: 'Colonia tecnológica interplanetaria',
      recommendedGeometry: 'hexagono',
      icons: ['robot', 'rocket', 'atom', 'shield', 'star'],
      sampleMemberNames: ['Ares', 'Fobos', 'Deimos', 'Rover', 'Curiosity'],
    },
  ],
  deportes: [
    {
      teamName: 'Trueno Dorado',
      motto: 'Velocidad, energía y trabajo en equipo',
      recommendedGeometry: 'engranaje',
      icons: ['bolt', 'star', 'shield', 'heart', 'rocket'],
      sampleMemberNames: ['Capitán', 'Flash', 'Titán', 'Victoria', 'Campeón'],
    },
    {
      teamName: 'Escudo Invencible',
      motto: 'Defensa sólida y espíritu deportivo',
      recommendedGeometry: 'hexagono',
      icons: ['shield', 'bolt', 'star', 'heart', 'paw'],
      sampleMemberNames: ['Defensa', 'Goleador', 'Líder', 'Sprint', 'Fénix'],
    },
    {
      teamName: 'Dinamo Unido',
      motto: 'Cada integrante mueve al equipo',
      recommendedGeometry: 'engranaje',
      icons: ['bolt', 'shield', 'star', 'rocket', 'heart'],
      sampleMemberNames: ['Turbo', 'Nitro', 'Impulso', 'Energía', 'Meta'],
    },
  ],
  ciencia: [
    {
      teamName: 'Núcleo Cuántico',
      motto: 'Innovación, átomos y mecatrónica',
      recommendedGeometry: 'engranaje',
      icons: ['atom', 'robot', 'bolt', 'star', 'rocket'],
      sampleMemberNames: ['Tesla', 'Curie', 'Newton', 'Ada', 'Galileo'],
    },
    {
      teamName: 'Red Biónica',
      motto: 'Robótica colaborativa del futuro',
      recommendedGeometry: 'hexagono',
      icons: ['robot', 'atom', 'shield', 'bolt', 'rocket'],
      sampleMemberNames: ['Nexus', 'Ciborg', 'Vector', 'Matriz', 'Quark'],
    },
    {
      teamName: 'Laboratorio Maker',
      motto: 'Co-creación láser e impresión 3D',
      recommendedGeometry: 'circular',
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
 * Distancia del centro (0,0) a la cara plana del panal (apotema base)
 */
export function getBadgeHoneycombApothem(cavityRadiusMm: number): number {
  return cavityRadiusMm + 6.45; // Para rCav=18.15 -> Apotema = 24.60 mm (Distancia entre centros = 49.20 mm)
}

/**
 * Posición del orificio interno para argolla de llavero (dentro del borde superior, sin sobresalir).
 * En coordenadas 2D donde (0, -Y) es arriba en pantalla (y (0, +Y) en el STL).
 */
export function getInternalKeychainHoleSpec(
  geometry: FrameGeometryId,
  cavityRadiusMm: number
): { offsetFromCenterMm: number; holeRadiusMm: number; holeDiameterMm: number } {
  if (geometry === 'hexagono') {
    // El vértice superior del hexágono está a A / cos(30°) = 24.60 / 0.866 = 28.41 mm.
    // Ubicamos el agujero de Ø 3.8 mm en Y = rCav + 4.35 = 22.50 mm (100% interno en la esquina superior).
    return {
      offsetFromCenterMm: cavityRadiusMm + 4.35,
      holeRadiusMm: 1.9,
      holeDiameterMm: 3.8,
    };
  }
  // En Circular y Engranaje el borde superior está en rCav + 6.45 mm -> ubicamos el agujero interno en rCav + 3.25 mm
  return {
    offsetFromCenterMm: cavityRadiusMm + 3.25,
    holeRadiusMm: 1.75,
    holeDiameterMm: 3.5,
  };
}

/**
 * Genera el contorno exterior exacto en coordenadas cartesianas (x, y) con encajes tipo Cola de Milano
 * en las 6 direcciones del panal (0°, 60°, 120° = Macho saliente; 180°, 240°, 300° = Hembra entrante).
 * De este modo, al trasladar las chapitas en la grilla hexagonal, cada cara macho calza exactamente
 * dentro de la cara hembra opuesta sin superponerse jamás.
 */
export function computeOuterFrameContourPoints(
  geometry: FrameGeometryId,
  cavityRadiusMm: number,
  clearanceMm: number
): { x: number; y: number; theta: number }[] {
  const apothem = getBadgeHoneycombApothem(cavityRadiusMm);
  const pts: { x: number; y: number; theta: number }[] = [];

  // Parámetros del encaje Cola de Milano (trapecio isósceles):
  // - Espiga Macho (caras k = 0, 1, 2): altura h = 2.25 mm, medio-cuello = 2.15 mm, media-cabeza = 3.25 mm
  // - Caja Hembra (caras k = 3, 4, 5): profundidad = h + clearance, medio-cuello y media-cabeza + clearance
  const hMale = 2.25;
  const neckHalfMale = 2.15;
  const headHalfMale = 3.25;

  const hFemale = hMale + clearanceMm;
  const neckHalfFemale = neckHalfMale + clearanceMm;
  const headHalfFemale = headHalfMale + clearanceMm;

  if (geometry === 'hexagono') {
    const L_half = apothem / Math.sqrt(3);
    const stepsEdge = 10;
    const stepsDove = 6;

    for (let k = 0; k < 6; k++) {
      const alpha = (k * Math.PI) / 3; // 0°, 60°, 120°, 180°, 240°, 300°
      const nx = Math.cos(alpha);
      const ny = Math.sin(alpha);
      const tx = -Math.sin(alpha);
      const ty = Math.cos(alpha);

      const isMale = k < 3;
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
      // Flanco izquierdo de la Cola de Milano: (-neckHalf, 0) -> (-headHalf, depth)
      for (let i = 1; i <= stepsDove; i++) {
        const t = i / stepsDove;
        pushUV(-neckHalf + (-headHalf - -neckHalf) * t, depth * t);
      }
      // Base/cresta plana de la Cola de Milano: (-headHalf, depth) -> (+headHalf, depth)
      for (let i = 1; i <= stepsDove; i++) {
        const t = i / stepsDove;
        pushUV(-headHalf + 2 * headHalf * t, depth);
      }
      // Flanco derecho de la Cola de Milano: (+headHalf, depth) -> (+neckHalf, 0)
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

  if (geometry === 'circular') {
    // Medallón circular de radio = apothem con encajes Cola de Milano en los 6 ejes del panal (k = 0..5)
    const stepsArc = 14;
    const stepsDove = 6;
    const sectorHalfAngle = Math.PI / 6; // 30° a cada lado del eje k

    for (let k = 0; k < 6; k++) {
      const alpha = (k * Math.PI) / 3;
      const nx = Math.cos(alpha);
      const ny = Math.sin(alpha);
      const tx = -Math.sin(alpha);
      const ty = Math.cos(alpha);

      const isMale = k < 3;
      const neckHalf = isMale ? neckHalfMale : neckHalfFemale;
      const headHalf = isMale ? headHalfMale : headHalfFemale;
      const depth = isMale ? hMale : -hFemale;

      const neckAngle = Math.asin(Math.min(0.9, neckHalf / apothem));
      const chordRadius = apothem * Math.cos(neckAngle);

      const pushXY = (x: number, y: number) => {
        pts.push({ x, y, theta: Math.atan2(y, x) });
      };

      // Arco 1: desde alpha - 30° hasta alpha - neckAngle
      for (let i = 0; i <= stepsArc; i++) {
        const a = alpha - sectorHalfAngle + ((sectorHalfAngle - neckAngle) * i) / stepsArc;
        pushXY(apothem * Math.cos(a), apothem * Math.sin(a));
      }

      // Flanco izquierdo Cola de Milano
      for (let i = 1; i <= stepsDove; i++) {
        const t = i / stepsDove;
        const u = -neckHalf + (-headHalf - -neckHalf) * t;
        const v = depth * t;
        pushXY((chordRadius + v) * nx + u * tx, (chordRadius + v) * ny + u * ty);
      }
      // Cresta Cola de Milano
      for (let i = 1; i <= stepsDove; i++) {
        const t = i / stepsDove;
        const u = -headHalf + 2 * headHalf * t;
        const v = depth;
        pushXY((chordRadius + v) * nx + u * tx, (chordRadius + v) * ny + u * ty);
      }
      // Flanco derecho Cola de Milano
      for (let i = 1; i <= stepsDove; i++) {
        const t = i / stepsDove;
        const u = headHalf + (neckHalf - headHalf) * t;
        const v = depth * (1 - t);
        pushXY((chordRadius + v) * nx + u * tx, (chordRadius + v) * ny + u * ty);
      }

      // Arco 2: desde alpha + neckAngle hasta alpha + 30°
      for (let i = 1; i < stepsArc; i++) {
        const a = alpha + neckAngle + ((sectorHalfAngle - neckAngle) * i) / stepsArc;
        pushXY(apothem * Math.cos(a), apothem * Math.sin(a));
      }
    }

    return pts;
  }

  // Geometría 'engranaje': Corona de 12 dientes trapezoidales cuyo radio primitivo = apothem
  // Al juntar dos engranajes a distancia 2 * apothem con desfase de 15° (medio diente),
  // los dientes de uno entran exactamente en los valles del otro sin superponerse.
  const numSteps = 240;
  const teeth = 12;
  const toothAmp = 1.95;

  for (let i = 0; i < numSteps; i++) {
    const theta = (2 * Math.PI * i) / numSteps;
    const wave = Math.cos(teeth * theta);
    const shaped = Math.max(-0.72, Math.min(0.72, wave * 1.35)) / 0.72;
    const r = apothem - clearanceMm * 0.5 + toothAmp * shaped;
    pts.push({
      x: r * Math.cos(theta),
      y: r * Math.sin(theta),
      theta,
    });
  }

  return pts;
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
 * Genera el archivo .SVG unificado con los centros de madera de todos los integrantes del equipo.
 * - Corte Láser Exterior: #FF0000, stroke-width 0.1 mm (círculo de woodCenterDiameterMm, ej. 36 mm)
 * - Grabado Láser Vectorial: #0000FF (ícono central, texto principal, texto secundario y anillo decorativo)
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
    `  <!-- MakerBox Taller 4: Centros de Madera (${woodCenterDiameterMm} mm x ${params.woodThicknessMm} mm) - Equipo: ${escapeXml(teamName)} -->`
  );

  lines.push(`  <g id="CAPA_GRABADO_AZUL" stroke="#0000FF" fill="none">`);
  lines.push(
    `    <text x="${(totalWidth / 2).toFixed(2)}" y="6.5" text-anchor="middle" font-family="Arial, sans-serif" font-size="3.2" font-weight="bold" fill="#0000FF" stroke="none">MAKERBOX · EQUIPO: ${escapeXml(
      teamName.toUpperCase()
    )} (${members.length} CHAPITAS Ø${woodCenterDiameterMm}mm)</text>`
  );

  members.forEach((member, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = margin + radius + col * spacing;
    const cy = margin + 8 + radius + row * spacing;

    const iconInfo = BADGE_ICONS[member.icon] ?? BADGE_ICONS.paw;
    const iconScale = (woodCenterDiameterMm / 36) * 0.72;
    const iconCenterY = cy - radius * 0.16;

    lines.push(
      `    <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${(radius - 1.8).toFixed(
        2
      )}" stroke="#0000FF" stroke-width="0.25" stroke-dasharray="1.5 1.0" />`
    );

    lines.push(
      `    <g transform="translate(${cx.toFixed(2)}, ${iconCenterY.toFixed(
        2
      )}) scale(${iconScale.toFixed(3)})" stroke="#0000FF" stroke-width="0.65" stroke-linecap="round" stroke-linejoin="round" fill="none">`
    );
    for (const d of iconInfo.svgPaths) {
      lines.push(`      <path d="${d}" />`);
    }
    lines.push(`    </g>`);

    const primaryLabel = (member.primaryText || `Integrante ${idx + 1}`).trim();
    const secondaryLabel = (member.secondaryText || teamName).trim();

    const primaryFontSize = Math.min(
      4.2,
      Math.max(2.6, (woodCenterDiameterMm * 0.62) / Math.max(5, primaryLabel.length))
    );
    const secondaryFontSize = Math.min(
      2.7,
      Math.max(2.0, (woodCenterDiameterMm * 0.52) / Math.max(7, secondaryLabel.length))
    );

    lines.push(
      `    <text x="${cx.toFixed(2)}" y="${(cy + radius * 0.42).toFixed(
        2
      )}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${primaryFontSize.toFixed(
        2
      )}" font-weight="bold" fill="#0000FF" stroke="#0000FF" stroke-width="0.12">${escapeXml(
        primaryLabel.toUpperCase()
      )}</text>`
    );

    if (secondaryLabel) {
      lines.push(
        `    <text x="${cx.toFixed(2)}" y="${(cy + radius * 0.64).toFixed(
          2
        )}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${secondaryFontSize.toFixed(
          2
        )}" font-weight="normal" fill="#0000FF" stroke="none">${escapeXml(
          secondaryLabel
        )}</text>`
      );
    }
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

// ============================================================================
// Generador 3D (.STL) de los Marcos Conectores en PLA con:
// - Encajes exteriores tipo Cola de Milano / Engranaje
// - Cavidad central press-fit (36.3 mm x 3.1 mm + tope inferior 1 mm + bisel superior)
// - Orificio para llavero INTERNO dentro del borde superior (sin sobresalir)
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
  const cavityDiameter = params.woodCenterDiameterMm + 2 * params.clearanceMm; // 36.30 mm por defecto
  const rCavity = cavityDiameter / 2; // 18.15 mm
  const rBottomLip = rCavity - 1.2; // Tope inferior de 1.2 mm (diámetro 33.9 mm)
  const rSnapBevel = rCavity - 0.24; // Retención superior press-fit
  const rTopEntry = rCavity + 0.12; // Bisel de entrada superior
  const rInnerRing = rCavity + 1.25; // Anillo intermedio antes del orificio interno

  const z0 = 0.0;
  const z1 = 1.0;
  const z2 = Number((1.0 + params.woodThicknessMm + 0.1).toFixed(3)); // 4.1 mm
  const z3 = Number((z2 + 0.45).toFixed(3));
  const z4 = Number(Math.max(5.0, z2 + 0.9).toFixed(3)); // 5.0 mm

  const outerPts = computeOuterFrameContourPoints(
    params.geometry,
    rCavity,
    params.clearanceMm
  );
  const numSteps = outerPts.length;

  // 1. Anillo interior escalonado Press-Fit (desde rBottomLip hasta rInnerRing, 360° continuos)
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

  // 2. Corona Exterior Conectora (desde rInnerRing hasta outerPts) con Orificio Interno de Llavero en el sector superior (-90° en pantalla / +90° en STL)
  const holeSpec = getInternalKeychainHoleSpec(params.geometry, rCavity);
  const holeCenterX = offsetX;
  const holeCenterY = offsetY - holeSpec.offsetFromCenterMm; // Ubicado en el vértice/borde superior (theta = -pi/2)
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

    // Pared perimetral exterior (z0 -> z4)
    pushQuad(lines, outA0, outB0, outB4, outA4);

    // Tapa superior e inferior de la corona exterior
    pushQuad(lines, outA4, outB4, ringB4, ringA4);
    pushQuad(lines, ringA0, ringB0, outB0, outA0);
  }

  // 3. Pared cilíndrica interna del orificio pasante para llavero (dentro de la esquina superior)
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
    // Normal apuntando hacia el centro del agujero
    pushQuad(lines, hB0, hA0, hA4, hB4);
  }
}

/**
 * Genera el contenido .STL de los marcos conectores 3D en PLA.
 */
export function generateBadgesConnectorStl(
  params: BadgesTeamParams,
  exportAllTeamFrames = true
): string {
  const count = exportAllTeamFrames ? params.memberCount : 1;
  const solidName = `MakerBox_Taller4_Marcos_${params.geometry.toUpperCase()}_${count}x`;
  const lines: string[] = [];
  lines.push(`solid ${solidName}`);

  const pitch = params.woodCenterDiameterMm + 24;
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
