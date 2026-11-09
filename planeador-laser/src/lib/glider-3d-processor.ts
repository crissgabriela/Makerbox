import { GLIDER_MODELS_MAP } from '@/lib/glider-meshes-data';
import {
  PlaGliderModelId,
  PlaGliderParams,
  PlaGliderTelemetry,
  PLA_GLIDER_MODELS,
} from '@/types/glider';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface DeformedGliderMesh {
  modelId: PlaGliderModelId;
  verts: Vec3[];
  tris: [number, number, number][];
  wingspanMm: number;
  fuselageLengthMm: number;
  wingChordMm: number;
  fuselageWidthMm: number;
  maxHeightMm: number;
  wingLeadingEdgeY: number;
  wingTrailingEdgeY: number;
  tailLeadingEdgeY: number;
}

function piecewiseLinear(val: number, knotsIn: number[], knotsOut: number[]): number {
  if (val <= knotsIn[0]) return knotsOut[0] + (val - knotsIn[0]);
  for (let i = 0; i < knotsIn.length - 1; i++) {
    if (val <= knotsIn[i + 1]) {
      const span = Math.max(1e-6, knotsIn[i + 1] - knotsIn[i]);
      const t = (val - knotsIn[i]) / span;
      return knotsOut[i] + t * (knotsOut[i + 1] - knotsOut[i]);
    }
  }
  const last = knotsIn.length - 1;
  return knotsOut[last] + (val - knotsIn[last]);
}

/**
 * Deforma paramétricamente por zonas anatómicas la malla 3D original (.3mf)
 * preservando espesores de capa en Z (0.2-0.3 mm en alas, nervaduras y winglets).
 */
export function deformPlaGliderMesh(params: PlaGliderParams): DeformedGliderMesh {
  const raw = GLIDER_MODELS_MAP[params.modelId];
  const { flatVerts, flatTris } = raw;

  const tris: [number, number, number][] = [];
  for (let i = 0; i < flatTris.length; i += 3) {
    tris.push([flatTris[i], flatTris[i + 1], flatTris[i + 2]]);
  }

  const { wingspanMm, fuselageLengthMm, wingChordMm, fuselageWidthMm } = params;
  const verts: Vec3[] = [];

  if (params.modelId === 'x1c') {
    // Modelo X1C: Ala recta con nervaduras
    // Base: wingspan=200.0, fuselageLength=176.74, wingChord=32.0, fuselageWidth=4.6
    const halfCore0 = 2.35;
    const halfCore1 = halfCore0 * (fuselageWidthMm / 4.6);
    const halfSpan0 = 100.0;
    const halfSpan1 = wingspanMm / 2.0;
    const tailSpanRatio = 0.55 + 0.45 * (wingspanMm / 200.0);

    const chordScale = wingChordMm / 32.0;
    const noseLen = 44.0;
    const newWingMain = 32.0 * chordScale;
    const newFillet = 10.0 * chordScale;
    const tailLen = 176.74 - 142.0; // 34.74 mm
    const remainingBoom = Math.max(
      18.0,
      fuselageLengthMm - noseLen - newWingMain - newFillet - tailLen
    );

    const yIn = [0, 44.0, 76.0, 86.0, 142.0, 176.74];
    const yOut = [
      0,
      noseLen,
      noseLen + newWingMain,
      noseLen + newWingMain + newFillet,
      noseLen + newWingMain + newFillet + remainingBoom,
      noseLen + newWingMain + newFillet + remainingBoom + tailLen,
    ];

    for (let i = 0; i < flatVerts.length; i += 3) {
      const vx = flatVerts[i];
      const vy = flatVerts[i + 1];
      const vz = flatVerts[i + 2];

      const signX = vx < 0 ? -1 : 1;
      const ax = Math.abs(vx);
      let nx = ax;

      if (ax <= halfCore0) {
        nx = ax * (halfCore1 / halfCore0);
      } else if (vy < 120) {
        nx = halfCore1 + ((ax - halfCore0) / (halfSpan0 - halfCore0)) * (halfSpan1 - halfCore1);
      } else {
        nx = halfCore1 + (ax - halfCore0) * tailSpanRatio;
      }

      const ny = piecewiseLinear(vy, yIn, yOut);
      verts.push({ x: signX * nx, y: ny, z: vz });
    }

    return {
      modelId: 'x1c',
      verts,
      tris,
      wingspanMm,
      fuselageLengthMm: yOut[5],
      wingChordMm,
      fuselageWidthMm,
      maxHeightMm: raw.maxHeightMm,
      wingLeadingEdgeY: yOut[1],
      wingTrailingEdgeY: yOut[2],
      tailLeadingEdgeY: yOut[4],
    };
  } else {
    // Modelo Boeing 747: Ala en flecha regresiva con winglets
    // Base: wingspan=158.234, fuselageLength=173.809, wingChord=33.5, fuselageWidth=15.4
    const halfCore0 = 7.72;
    const halfCore1 = halfCore0 * (fuselageWidthMm / 15.4);
    const wingletIn0 = 77.8;
    const halfSpan0 = 79.117;
    const wingletWidth = halfSpan0 - wingletIn0; // 1.317 mm
    const halfSpan1 = wingspanMm / 2.0;
    const wingletIn1 = Math.max(halfCore1 + 12.0, halfSpan1 - wingletWidth);

    const chordScale = wingChordMm / 33.5;
    const noseLen = 48.6;
    const baseRootZone = 98.25 - 48.6; // 49.65 mm
    const newRootZone = baseRootZone * chordScale;
    const tailLen = 173.809 - 149.2; // 24.609 mm
    const remainingBoom = Math.max(
      16.0,
      fuselageLengthMm - noseLen - newRootZone - tailLen
    );

    const uIn = [0, 48.6, 98.25, 149.2, 173.809];
    const uOut = [
      0,
      noseLen,
      noseLen + newRootZone,
      noseLen + newRootZone + remainingBoom,
      noseLen + newRootZone + remainingBoom + tailLen,
    ];

    const sweepSlope = 0.8606;
    const tailScale = 0.55 + 0.45 * (wingspanMm / 158.2);

    for (let i = 0; i < flatVerts.length; i += 3) {
      const vx = flatVerts[i];
      const vy = flatVerts[i + 1];
      const vz = flatVerts[i + 2];

      const signX = vx < 0 ? -1 : 1;
      const ax = Math.abs(vx);
      const isMainWing = ax > halfCore0 && vy < 140;
      const isTailWing = ax > 4.5 && vy >= 140;

      let nx = ax;
      if (ax <= halfCore0 && !isTailWing) {
        nx = ax * (halfCore1 / halfCore0);
      } else if (isMainWing) {
        if (ax <= wingletIn0) {
          nx =
            halfCore1 +
            ((ax - halfCore0) / (wingletIn0 - halfCore0)) * (wingletIn1 - halfCore1);
        } else {
          nx = wingletIn1 + (ax - wingletIn0);
        }
      } else if (isTailWing) {
        if (ax >= 25.9) {
          const baseTip = 25.9 * tailScale;
          nx = baseTip + (ax - 25.9);
        } else {
          nx = ax * tailScale;
        }
      }

      const sweepOffset = isMainWing ? sweepSlope * (ax - halfCore0) : 0;
      const u = vy - sweepOffset;
      const uNew = piecewiseLinear(u, uIn, uOut);
      const ny = uNew + sweepOffset;

      verts.push({ x: signX * nx, y: ny, z: vz });
    }

    return {
      modelId: 'b747',
      verts,
      tris,
      wingspanMm,
      fuselageLengthMm: uOut[4],
      wingChordMm,
      fuselageWidthMm,
      maxHeightMm: raw.maxHeightMm,
      wingLeadingEdgeY: uOut[1],
      wingTrailingEdgeY: uOut[2],
      tailLeadingEdgeY: uOut[3],
    };
  }
}

/**
 * Calcula telemetría física 3D exacta sobre la malla triangular deformada:
 * Volumen (Teorema de la Divergencia), Centro de Masa 3D (CG), peso PLA,
 * tiempo de impresión y estabilidad aerodinámica.
 */
export function computePlaGliderTelemetry(
  params: PlaGliderParams,
  meshInput?: DeformedGliderMesh
): PlaGliderTelemetry {
  const mesh = meshInput ?? deformPlaGliderMesh(params);
  const { verts, tris } = mesh;

  let signedVol = 0;
  let cx = 0;
  let cy = 0;
  let cz = 0;

  for (const [i1, i2, i3] of tris) {
    const a = verts[i1];
    const b = verts[i2];
    const c = verts[i3];
    const v6 =
      a.x * (b.y * c.z - b.z * c.y) -
      a.y * (b.x * c.z - b.z * c.x) +
      a.z * (b.x * c.y - b.y * c.x);
    const vol = v6 / 6.0;
    signedVol += vol;
    cx += (vol * (a.x + b.x + c.x)) / 4.0;
    cy += (vol * (a.y + b.y + c.y)) / 4.0;
    cz += (vol * (a.z + b.z + c.z)) / 4.0;
  }

  const volumeMm3 = Math.max(100, Math.abs(signedVol));
  const volumeCm3 = volumeMm3 / 1000.0;
  const actualCgFromNoseMm = signedVol !== 0 ? cy / signedVol : params.fuselageLengthMm * 0.41;

  // Calibración exacta contra los metadatos del laminador Bambu Studio:
  // X1C: 3.976 cm³ -> 4.90 g PLA (1.62 m filamento, 24 min)
  // B747: 3.940 cm³ -> 4.64 g PLA (1.56 m filamento, 22 min)
  const effectiveDensityGPerCm3 = params.modelId === 'x1c' ? 4.9 / 3.97617 : 4.64 / 3.94001;
  const estimatedWeightGrams = volumeCm3 * effectiveDensityGPerCm3;
  const estimatedFilamentMeters = estimatedWeightGrams * (1.62 / 4.9);

  const baseTimeMin = params.modelId === 'x1c' ? 24.0 : 21.6;
  const baseWeightG = params.modelId === 'x1c' ? 4.9 : 4.64;
  const estimatedPrintTimeMin = Math.max(
    12,
    Math.round(baseTimeMin * (0.3 + 0.7 * (estimatedWeightGrams / baseWeightG)))
  );

  // Área alar proyectada efectiva (descontando ancho central del fuselaje)
  const effectiveSpanMm = Math.max(40, params.wingspanMm - params.fuselageWidthMm);
  const taperFactor = params.modelId === 'x1c' ? 0.92 : 0.84;
  const wingAreaMm2 = effectiveSpanMm * params.wingChordMm * taperFactor;
  const wingAreaCm2 = wingAreaMm2 / 100.0;
  const wingAreaDm2 = wingAreaCm2 / 100.0;

  const aspectRatio = (params.wingspanMm * params.wingspanMm) / Math.max(1, wingAreaMm2);
  const spanToFuselageRatio = params.wingspanMm / Math.max(1, params.fuselageLengthMm);
  const wingLoadingGPerDm2 = estimatedWeightGrams / Math.max(0.05, wingAreaDm2);

  // Punto neutro / CG aerodinámico ideal para cada modelo:
  // En los modelos originales (que vuelan perfectamente), el CG real coincide con el ideal:
  // X1C base: actualCg = 72.37 mm (con LE=44, chord=32 -> 44 + 0.886*32)
  // B747 base: actualCg = 71.76 mm (en ala en flecha, centro aerodinámico medio a ~71.8 mm)
  const chordRatio = params.wingChordMm / PLA_GLIDER_MODELS[params.modelId].wingChord.default;
  const spanRatio = params.wingspanMm / PLA_GLIDER_MODELS[params.modelId].wingspan.default;
  const idealCgFromNoseMm =
    params.modelId === 'x1c'
      ? 44.0 + 28.37 * chordRatio
      : 48.6 + 15.0 * chordRatio + 8.16 * spanRatio;

  const cgOffsetMm = actualCgFromNoseMm - idealCgFromNoseMm;

  // Razón de planeo (L/D) y velocidad estimada
  const estimatedGlideRatioLD = Math.max(
    4.5,
    Math.min(12.5, 6.2 + 0.35 * Math.sqrt(aspectRatio) - 0.12 * Math.abs(cgOffsetMm))
  );
  const estimatedGlideSpeedMs = Math.max(
    2.4,
    Math.min(6.5, 2.2 * Math.sqrt(Math.max(1, wingLoadingGPerDm2) / 5.0))
  );

  // Puntaje de equilibrio (0 a 100)
  const cgPenalty = Math.min(45, Math.abs(cgOffsetMm) * 3.2);
  const ratioPenalty = Math.min(25, Math.abs(spanToFuselageRatio - 1.05) * 30);
  const loadingPenalty = wingLoadingGPerDm2 > 14 ? (wingLoadingGPerDm2 - 14) * 4 : 0;
  const balanceScore = Math.round(
    Math.max(35, Math.min(100, 98 - cgPenalty - ratioPenalty - loadingPenalty))
  );

  let balanceStatus: 'optimo' | 'estable' | 'advertencia' = 'optimo';
  if (balanceScore < 68 || Math.abs(cgOffsetMm) > 8.5) {
    balanceStatus = 'advertencia';
  } else if (balanceScore < 84 || Math.abs(cgOffsetMm) > 4.5) {
    balanceStatus = 'estable';
  }

  let flightBehaviorSummary =
    'Equilibrio 3D óptimo en PLA: el Centro de Gravedad coincide con el Centro Aerodinámico para un planeo largo, recto y estable.';
  if (cgOffsetMm > 4.5) {
    flightBehaviorSummary =
      'Cola ligeramente pesada (CG retrasado): al alargar el fuselaje o ensanchar el ala trasera, el avión tenderá a levantar la nariz. Puedes acortar el fuselaje o ensanchar el núcleo central.';
  } else if (cgOffsetMm < -4.5) {
    flightBehaviorSummary =
      'Nariz pesada (CG adelantado): el planeador tendrá un vuelo más rápido y descendente. Puedes aumentar la envergadura, el ancho del ala o el largo del fuselaje para equilibrarlo.';
  } else if (aspectRatio > 8.5) {
    flightBehaviorSummary =
      'Alta relación de aspecto (planeador velero): excelente sustentación a baja velocidad; lánzalo suavemente y en horizontal.';
  }

  const fitsStandardBed220 = params.wingspanMm <= 245 && params.fuselageLengthMm <= 245;
  const fitsMiniBed180 = params.wingspanMm <= 178 && params.fuselageLengthMm <= 178;

  return {
    volumeCm3: Number(volumeCm3.toFixed(2)),
    volumeMm3: Number(volumeMm3.toFixed(0)),
    estimatedWeightGrams: Number(estimatedWeightGrams.toFixed(2)),
    estimatedPrintTimeMin,
    estimatedFilamentMeters: Number(estimatedFilamentMeters.toFixed(2)),
    wingAreaCm2: Number(wingAreaCm2.toFixed(1)),
    wingAreaMm2: Number(wingAreaMm2.toFixed(0)),
    aspectRatio: Number(aspectRatio.toFixed(2)),
    spanToFuselageRatio: Number(spanToFuselageRatio.toFixed(2)),
    wingLoadingGPerDm2: Number(wingLoadingGPerDm2.toFixed(2)),
    actualCgFromNoseMm: Number(actualCgFromNoseMm.toFixed(1)),
    idealCgFromNoseMm: Number(idealCgFromNoseMm.toFixed(1)),
    cgOffsetMm: Number(cgOffsetMm.toFixed(1)),
    estimatedGlideSpeedMs: Number(estimatedGlideSpeedMs.toFixed(1)),
    estimatedGlideRatioLD: Number(estimatedGlideRatioLD.toFixed(1)),
    balanceScore,
    balanceStatus,
    flightBehaviorSummary,
    fitsStandardBed220,
    fitsMiniBed180,
    vertexCount: verts.length,
    triangleCount: tris.length,
    maxHeightMm: mesh.maxHeightMm,
  };
}

/**
 * Genera el archivo .STL ASCII de la malla 3D deformada, centrada en XY y apoyada sobre Z = 0.
 */
export function generatePlaGliderStlString(params: PlaGliderParams): string {
  const mesh = deformPlaGliderMesh(params);
  const { verts, tris, fuselageLengthMm } = mesh;
  const halfLen = fuselageLengthMm / 2.0;

  const lines: string[] = [];
  const solidName = `MakerBox_Planeador_PLA_${params.modelId.toUpperCase()}_${Math.round(params.wingspanMm)}x${Math.round(params.fuselageLengthMm)}mm`;
  lines.push(`solid ${solidName}`);

  for (const [i1, i2, i3] of tris) {
    const a = verts[i1];
    const b = verts[i2];
    const c = verts[i3];

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
    if (len < 1e-9) continue;
    nx /= len;
    ny /= len;
    nz /= len;

    lines.push(`  facet normal ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}`);
    lines.push('    outer loop');
    lines.push(`      vertex ${a.x.toFixed(4)} ${(a.y - halfLen).toFixed(4)} ${a.z.toFixed(4)}`);
    lines.push(`      vertex ${b.x.toFixed(4)} ${(b.y - halfLen).toFixed(4)} ${b.z.toFixed(4)}`);
    lines.push(`      vertex ${c.x.toFixed(4)} ${(c.y - halfLen).toFixed(4)} ${c.z.toFixed(4)}`);
    lines.push('    endloop');
    lines.push('  endfacet');
  }

  lines.push(`endsolid ${solidName}`);
  return lines.join('\n');
}

// ============================================================================
// Generador de archivo .3MF (reemplaza los vértices dentro del paquete .3mf
// original conservando intactos todos los parámetros de impresión de Bambu Studio)
// ============================================================================

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = (c >>> 8) ^ CRC_TABLE[(c ^ bytes[i]) & 0xff];
  }
  return (c ^ 0xffffffff) >>> 0;
}

function buildObject1ModelXml(mesh: DeformedGliderMesh): Uint8Array {
  const { verts, tris, modelId, fuselageLengthMm } = mesh;
  const halfY = fuselageLengthMm / 2.0;
  const raw = GLIDER_MODELS_MAP[modelId];

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06" requiredextensions="p">'
  );
  lines.push(' <metadata name="BambuStudio:3mfVersion">1</metadata>');
  lines.push(' <resources>');
  lines.push('  <object id="1" p:UUID="00010000-81cb-4c03-9d28-80fed5dfa1dc" type="model">');
  lines.push('   <mesh>');
  lines.push('    <vertices>');

  for (const v of verts) {
    if (modelId === 'b747') {
      // Build transform in 3dmodel.model is (x + 90, y + 90, z + 7.38605833)
      const lx = v.x;
      const ly = v.y - halfY;
      const lz = v.z - 7.38605833;
      lines.push(`     <vertex x="${lx.toFixed(5)}" y="${ly.toFixed(5)}" z="${lz.toFixed(5)}"/>`);
    } else {
      // X1C build transform in 3dmodel.model is:
      // world_x = -lx + 128, world_y = -lz + 128, world_z = -ly + 12.6000004
      const lx = -v.x;
      const ly = 12.6000004 - v.z;
      const lz = halfY - v.y;
      lines.push(`     <vertex x="${lx.toFixed(5)}" y="${ly.toFixed(5)}" z="${lz.toFixed(5)}"/>`);
    }
  }

  lines.push('    </vertices>');
  lines.push('    <triangles>');

  for (const [i1, i2, i3] of tris) {
    // Si detFlippedIn3mf era true, restauramos el orden original de índices para que la transformación del .3mf lo deje bien orientado
    if (raw.detFlippedIn3mf) {
      lines.push(`     <triangle v1="${i1}" v2="${i3}" v3="${i2}"/>`);
    } else {
      lines.push(`     <triangle v1="${i1}" v2="${i2}" v3="${i3}"/>`);
    }
  }

  lines.push('    </triangles>');
  lines.push('   </mesh>');
  lines.push('  </object>');
  lines.push(' </resources>');
  lines.push(' <build/>');
  lines.push('</model>');

  return new TextEncoder().encode(lines.join('\n'));
}

function replaceZipEntry(
  zipBytes: Uint8Array,
  targetPath: string,
  newContentBytes: Uint8Array
): Uint8Array {
  const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
  let eocdOffset = -1;
  for (let i = zipBytes.length - 22; i >= Math.max(0, zipBytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) {
    throw new Error('Archivo .3mf inválido: no se encontró cabecera EOCD');
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);

  interface ZipEntryRecord {
    name: string;
    nameBytes: Uint8Array;
    versionMadeBy: number;
    versionNeeded: number;
    flags: number;
    method: number;
    modTime: number;
    modDate: number;
    crc: number;
    compSize: number;
    uncompSize: number;
    cdExtra: Uint8Array;
    cdComment: Uint8Array;
    diskNum: number;
    intAttr: number;
    extAttr: number;
    lfExtra: Uint8Array;
    rawData: Uint8Array;
  }

  const entries: ZipEntryRecord[] = [];
  let ptr = cdOffset;
  const decoder = new TextDecoder();

  for (let i = 0; i < totalEntries; i++) {
    if (view.getUint32(ptr, true) !== 0x02014b50) {
      throw new Error('Entrada de directorio central ZIP inválida');
    }
    const versionMadeBy = view.getUint16(ptr + 4, true);
    const versionNeeded = view.getUint16(ptr + 6, true);
    const flags = view.getUint16(ptr + 8, true);
    const method = view.getUint16(ptr + 10, true);
    const modTime = view.getUint16(ptr + 12, true);
    const modDate = view.getUint16(ptr + 14, true);
    const crc = view.getUint32(ptr + 16, true);
    const compSize = view.getUint32(ptr + 20, true);
    const uncompSize = view.getUint32(ptr + 24, true);
    const nameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const diskNum = view.getUint16(ptr + 34, true);
    const intAttr = view.getUint16(ptr + 36, true);
    const extAttr = view.getUint32(ptr + 38, true);
    const localHeaderOffset = view.getUint32(ptr + 42, true);

    const nameBytes = zipBytes.subarray(ptr + 46, ptr + 46 + nameLen);
    const name = decoder.decode(nameBytes);
    const cdExtra = zipBytes.subarray(ptr + 46 + nameLen, ptr + 46 + nameLen + extraLen);
    const cdComment = zipBytes.subarray(
      ptr + 46 + nameLen + extraLen,
      ptr + 46 + nameLen + extraLen + commentLen
    );

    const lfNameLen = view.getUint16(localHeaderOffset + 26, true);
    const lfExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const lfExtra = zipBytes.subarray(
      localHeaderOffset + 30 + lfNameLen,
      localHeaderOffset + 30 + lfNameLen + lfExtraLen
    );
    const dataStart = localHeaderOffset + 30 + lfNameLen + lfExtraLen;
    const rawData = zipBytes.subarray(dataStart, dataStart + compSize);

    entries.push({
      name,
      nameBytes,
      versionMadeBy,
      versionNeeded,
      flags,
      method,
      modTime,
      modDate,
      crc,
      compSize,
      uncompSize,
      cdExtra,
      cdComment,
      diskNum,
      intAttr,
      extAttr,
      lfExtra,
      rawData,
    });

    ptr += 46 + nameLen + extraLen + commentLen;
  }

  const newCrc = crc32(newContentBytes);
  for (const e of entries) {
    if (e.name.replace(/\\/g, '/') === targetPath) {
      e.method = 0; // STORE (uncompressed, universal 3MF compatibility)
      e.flags = e.flags & ~0x0008;
      e.crc = newCrc;
      e.compSize = newContentBytes.length;
      e.uncompSize = newContentBytes.length;
      e.rawData = newContentBytes;
    }
  }

  const localChunks: Uint8Array[] = [];
  const cdChunks: Uint8Array[] = [];
  let offset = 0;

  for (const e of entries) {
    const lfHeader = new Uint8Array(30 + e.nameBytes.length + e.lfExtra.length);
    const lfView = new DataView(lfHeader.buffer);
    lfView.setUint32(0, 0x04034b50, true);
    lfView.setUint16(4, e.versionNeeded, true);
    lfView.setUint16(6, e.flags, true);
    lfView.setUint16(8, e.method, true);
    lfView.setUint16(10, e.modTime, true);
    lfView.setUint16(12, e.modDate, true);
    lfView.setUint32(14, e.crc, true);
    lfView.setUint32(18, e.compSize, true);
    lfView.setUint32(22, e.uncompSize, true);
    lfView.setUint16(26, e.nameBytes.length, true);
    lfView.setUint16(28, e.lfExtra.length, true);
    lfHeader.set(e.nameBytes, 30);
    lfHeader.set(e.lfExtra, 30 + e.nameBytes.length);

    const localOffset = offset;
    localChunks.push(lfHeader, e.rawData);
    offset += lfHeader.length + e.rawData.length;

    const cdHeader = new Uint8Array(
      46 + e.nameBytes.length + e.cdExtra.length + e.cdComment.length
    );
    const cdView = new DataView(cdHeader.buffer);
    cdView.setUint32(0, 0x02014b50, true);
    cdView.setUint16(4, e.versionMadeBy, true);
    cdView.setUint16(6, e.versionNeeded, true);
    cdView.setUint16(8, e.flags, true);
    cdView.setUint16(10, e.method, true);
    cdView.setUint16(12, e.modTime, true);
    cdView.setUint16(14, e.modDate, true);
    cdView.setUint32(16, e.crc, true);
    cdView.setUint32(20, e.compSize, true);
    cdView.setUint32(24, e.uncompSize, true);
    cdView.setUint16(28, e.nameBytes.length, true);
    cdView.setUint16(30, e.cdExtra.length, true);
    cdView.setUint16(32, e.cdComment.length, true);
    cdView.setUint16(34, e.diskNum, true);
    cdView.setUint16(36, e.intAttr, true);
    cdView.setUint32(38, e.extAttr, true);
    cdView.setUint32(42, localOffset, true);
    cdHeader.set(e.nameBytes, 46);
    cdHeader.set(e.cdExtra, 46 + e.nameBytes.length);
    cdHeader.set(e.cdComment, 46 + e.nameBytes.length + e.cdExtra.length);

    cdChunks.push(cdHeader);
  }

  const newCdOffset = offset;
  let newCdSize = 0;
  for (const c of cdChunks) newCdSize += c.length;

  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, entries.length, true);
  eocdView.setUint16(10, entries.length, true);
  eocdView.setUint32(12, newCdSize, true);
  eocdView.setUint32(16, newCdOffset, true);
  eocdView.setUint16(20, 0, true);

  const totalSize = newCdOffset + newCdSize + 22;
  const out = new Uint8Array(totalSize);
  let pos = 0;
  for (const c of localChunks) {
    out.set(c, pos);
    pos += c.length;
  }
  for (const c of cdChunks) {
    out.set(c, pos);
    pos += c.length;
  }
  out.set(eocd, pos);
  return out;
}

/**
 * Descarga la plantilla .3mf original desde /models/, inyecta los vértices 3D
 * parametrizados por el estudiante y devuelve un Blob .3mf listo para Bambu Studio / PrusaSlicer / Cura.
 */
export async function generatePlaGlider3mfBlob(params: PlaGliderParams): Promise<Blob> {
  const mesh = deformPlaGliderMesh(params);
  const raw = GLIDER_MODELS_MAP[params.modelId];

  const response = await fetch(raw.template3mfUrl);
  if (!response.ok) {
    throw new Error(`No se pudo cargar la plantilla base ${raw.template3mfUrl}`);
  }
  const arrayBuf = await response.arrayBuffer();
  const origZipBytes = new Uint8Array(arrayBuf);
  const newObjectXmlBytes = buildObject1ModelXml(mesh);
  const patchedZipBytes = replaceZipEntry(
    origZipBytes,
    '3D/Objects/object_1.model',
    newObjectXmlBytes
  );

  return new Blob([patchedZipBytes.buffer as ArrayBuffer], {
    type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml',
  });
}
