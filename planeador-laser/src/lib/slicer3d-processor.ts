import {
  CadPrimitive,
  NestedSheet,
  PlacedPieceOnSheet,
  SlicedPiece2D,
  SlicerConfig,
  SlicerResult,
  SliceSlotInfo,
  UploadedMeshModel,
  Vec2,
  Vec3,
} from '@/types/slicer3d';

// ============================================================================
// 1. Utilidades Matemáticas 3D (Rotación Euler XYZ y Matrices Inversas)
// ============================================================================

type Mat3 = [
  number, number, number,
  number, number, number,
  number, number, number,
];

function buildEulerMatrix(rxDeg: number, ryDeg: number, rzDeg: number): Mat3 {
  const rx = (rxDeg * Math.PI) / 180;
  const ry = (ryDeg * Math.PI) / 180;
  const rz = (rzDeg * Math.PI) / 180;

  const cx = Math.cos(rx), sx = Math.sin(rx);
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const cz = Math.cos(rz), sz = Math.sin(rz);

  // R = Rz * Ry * Rx
  return [
    cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx,
    sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx,
    -sy,     cy * sx,                cy * cx,
  ];
}

function transposeMat3(m: Mat3): Mat3 {
  return [
    m[0], m[3], m[6],
    m[1], m[4], m[7],
    m[2], m[5], m[8],
  ];
}

function mulMat3Vec(m: Mat3, x: number, y: number, z: number): Vec3 {
  return {
    x: m[0] * x + m[1] * y + m[2] * z,
    y: m[3] * x + m[4] * y + m[5] * z,
    z: m[6] * x + m[7] * y + m[8] * z,
  };
}

// ============================================================================
// 2. Parser Universal de Archivos 3D (.STL Binario/ASCII y .OBJ)
// ============================================================================

export function parseUploaded3DModel(
  buffer: ArrayBuffer,
  fileName: string
): UploadedMeshModel {
  const lower = fileName.toLowerCase();
  const isObj = lower.endsWith('.obj');
  let rawTris: number[] = [];

  if (isObj) {
    const text = new TextDecoder('utf-8').decode(buffer);
    rawTris = parseObjToTriangles(text);
  } else {
    rawTris = parseStlToTriangles(buffer);
  }

  if (rawTris.length < 9) {
    throw new Error(
      'El archivo 3D no contiene triángulos válidos. Verifica que sea un .STL o .OBJ válido.'
    );
  }

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (let i = 0; i < rawTris.length; i += 3) {
    const x = rawTris[i];
    const y = rawTris[i + 1];
    const z = rawTris[i + 2];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  const dx = Math.max(1e-5, maxX - minX);
  const dy = Math.max(1e-5, maxY - minY);
  const dz = Math.max(1e-5, maxZ - minZ);
  const maxDim = Math.max(dx, dy, dz);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const normalized = new Float32Array(rawTris.length);
  for (let i = 0; i < rawTris.length; i += 3) {
    normalized[i] = (rawTris[i] - cx) / maxDim;
    normalized[i + 1] = (rawTris[i + 1] - cy) / maxDim;
    normalized[i + 2] = (rawTris[i + 2] - minZ) / maxDim;
  }

  return {
    fileName,
    format: isObj ? 'obj' : 'stl',
    normalizedTriangles: normalized,
    triangleCount: rawTris.length / 9,
    normalizedDims: [dx / maxDim, dy / maxDim, dz / maxDim],
    targetMaxDimMm: 130,
    rotationDeg: [0, 0, 0],
  };
}

function parseStlToTriangles(buffer: ArrayBuffer): number[] {
  const bytes = new Uint8Array(buffer);
  // Detectar STL binario comprobando longitud exacta: 84 + 50 * numTriangles
  if (buffer.byteLength >= 84) {
    const view = new DataView(buffer);
    const triCount = view.getUint32(80, true);
    const expectedSize = 84 + triCount * 50;
    if (triCount > 0 && triCount < 2_500_000 && expectedSize === buffer.byteLength) {
      const out = new Array<number>(triCount * 9);
      let offset = 84;
      let w = 0;
      for (let i = 0; i < triCount; i++) {
        offset += 12; // omitir normal
        for (let v = 0; v < 3; v++) {
          out[w++] = view.getFloat32(offset, true);
          out[w++] = view.getFloat32(offset + 4, true);
          out[w++] = view.getFloat32(offset + 8, true);
          offset += 12;
        }
        offset += 2; // attribute byte count
      }
      return out;
    }
  }

  // Fallback: STL ASCII
  const text = new TextDecoder('utf-8').decode(bytes);
  const out: number[] = [];
  const vertexRegex =
    /vertex\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/gi;
  let match: RegExpExecArray | null;
  const verts: number[] = [];
  while ((match = vertexRegex.exec(text)) !== null) {
    verts.push(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]));
    if (verts.length === 9) {
      out.push(...verts);
      verts.length = 0;
    }
  }
  return out;
}

function parseObjToTriangles(text: string): number[] {
  const vertices: [number, number, number][] = [];
  const out: number[] = [];
  const lines = text.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('v ')) {
      const parts = line.split(/\s+/);
      if (parts.length >= 4) {
        const x = parseFloat(parts[1]);
        const y = parseFloat(parts[2]);
        const z = parseFloat(parts[3]);
        if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
          vertices.push([x, y, z]);
        }
      }
    } else if (line.startsWith('f ')) {
      const parts = line.split(/\s+/).slice(1);
      const idxs: number[] = [];
      for (const tok of parts) {
        const idxStr = tok.split('/')[0];
        let idx = parseInt(idxStr, 10);
        if (!Number.isFinite(idx)) continue;
        if (idx < 0) idx = vertices.length + idx;
        else idx = idx - 1;
        if (idx >= 0 && idx < vertices.length) {
          idxs.push(idx);
        }
      }
      // Triangulación en abanico (soporta triángulos, quads y n-gonos)
      for (let i = 1; i + 1 < idxs.length; i++) {
        const a = vertices[idxs[0]];
        const b = vertices[idxs[i]];
        const c = vertices[idxs[i + 1]];
        out.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      }
    }
  }
  return out;
}

export function getTransformedUploadedTriangles(model: UploadedMeshModel): {
  triangles: Float32Array;
  bbox: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
} {
  const src = model.normalizedTriangles;
  const scale = model.targetMaxDimMm;
  const mat = buildEulerMatrix(
    model.rotationDeg[0],
    model.rotationDeg[1],
    model.rotationDeg[2]
  );

  const tmp = new Float32Array(src.length);
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (let i = 0; i < src.length; i += 3) {
    const p = mulMat3Vec(mat, src[i] * scale, src[i + 1] * scale, src[i + 2] * scale);
    tmp[i] = p.x;
    tmp[i + 1] = p.y;
    tmp[i + 2] = p.z;
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  for (let i = 0; i < tmp.length; i += 3) {
    tmp[i] -= cx;
    tmp[i + 1] -= cy;
    tmp[i + 2] -= minZ;
  }

  return {
    triangles: tmp,
    bbox: {
      minX: minX - cx,
      maxX: maxX - cx,
      minY: minY - cy,
      maxY: maxY - cy,
      minZ: 0,
      maxZ: maxZ - minZ,
    },
  };
}

// ============================================================================
// 3. Evaluador SDF Analítico para Primitivas CAD (Sólido + Hueco tipo Tinkercad)
// ============================================================================

interface CompiledPrimitive {
  prim: CadPrimitive;
  invRot: Mat3;
  hx: number;
  hy: number;
  hz: number;
}

function compilePrimitives(primitives: CadPrimitive[]): CompiledPrimitive[] {
  return primitives.map((prim) => {
    const rot = buildEulerMatrix(prim.rotation[0], prim.rotation[1], prim.rotation[2]);
    return {
      prim,
      invRot: transposeMat3(rot),
      hx: Math.max(1, prim.size[0] / 2),
      hy: Math.max(1, prim.size[1] / 2),
      hz: Math.max(1, prim.size[2] / 2),
    };
  });
}

function evalSinglePrimitiveSdf(cp: CompiledPrimitive, wx: number, wy: number, wz: number): number {
  const dx = wx - cp.prim.position[0];
  const dy = wy - cp.prim.position[1];
  const dz = wz - cp.prim.position[2];
  const q = mulMat3Vec(cp.invRot, dx, dy, dz);
  const { hx, hy, hz } = cp;

  switch (cp.prim.kind) {
    case 'sphere': {
      const nx = q.x / hx;
      const ny = q.y / hy;
      const nz = q.z / hz;
      const k0 = Math.hypot(nx, ny, nz);
      if (k0 < 1e-6) return -Math.min(hx, hy, hz);
      const k1 = Math.hypot(nx / hx, ny / hy, nz / hz);
      return (k0 * (k0 - 1.0)) / Math.max(1e-6, k1);
    }
    case 'box': {
      const bx = Math.abs(q.x) - hx;
      const by = Math.abs(q.y) - hy;
      const bz = Math.abs(q.z) - hz;
      const outD = Math.hypot(Math.max(bx, 0), Math.max(by, 0), Math.max(bz, 0));
      const inD = Math.min(Math.max(bx, by, bz), 0);
      return outD + inD;
    }
    case 'cylinder': {
      const nx = q.x / hx;
      const ny = q.y / hy;
      const k0 = Math.hypot(nx, ny);
      const r2d =
        k0 < 1e-6
          ? -Math.min(hx, hy)
          : (k0 * (k0 - 1.0)) / Math.max(1e-6, Math.hypot(nx / hx, ny / hy));
      const bz = Math.abs(q.z) - hz;
      return Math.hypot(Math.max(r2d, 0), Math.max(bz, 0)) + Math.min(Math.max(r2d, bz), 0);
    }
    case 'cone': {
      // Base en q.z = -hz, vértice en q.z = +hz
      const t = (hz - q.z) / (2 * hz); // 1 en la base, 0 en la punta
      const rFactor = Math.max(0.001, Math.min(1.0, t));
      const rx = hx * rFactor;
      const ry = hy * rFactor;
      const nx = q.x / rx;
      const ny = q.y / ry;
      const k0 = Math.hypot(nx, ny);
      const radialDist =
        k0 < 1e-6
          ? -Math.min(rx, ry)
          : (k0 * (k0 - 1.0)) / Math.max(1e-6, Math.hypot(nx / rx, ny / ry));
      // Corregir inclinación aproximada del manto cónico
      const slopeScale = (2 * hz) / Math.hypot(2 * hz, Math.max(hx, hy));
      const sideD = radialDist * slopeScale;
      const capD = Math.max(q.z - hz, -hz - q.z);
      if (q.z < -hz || q.z > hz) {
        return Math.hypot(Math.max(sideD, 0), capD);
      }
      return Math.max(sideD, capD);
    }
    case 'pyramid': {
      const t = (hz - q.z) / (2 * hz);
      const rFactor = Math.max(0.001, Math.min(1.0, t));
      const px = Math.abs(q.x) - hx * rFactor;
      const py = Math.abs(q.y) - hy * rFactor;
      const slopeX = (2 * hz) / Math.hypot(2 * hz, hx);
      const slopeY = (2 * hz) / Math.hypot(2 * hz, hy);
      const sideD = Math.max(px * slopeX, py * slopeY);
      const capD = Math.max(q.z - hz, -hz - q.z);
      if (q.z < -hz || q.z > hz) {
        return Math.hypot(Math.max(sideD, 0), capD);
      }
      return Math.max(sideD, capD);
    }
    case 'torus': {
      const rOuter = Math.max(hx, hy);
      const rTube = Math.min(hz, rOuter * 0.42);
      const rMajor = Math.max(2, rOuter - rTube);
      // Escala elíptica si hx != hy
      const ex = q.x * (rOuter / hx);
      const ey = q.y * (rOuter / hy);
      const qRad = Math.hypot(ex, ey) - rMajor;
      return Math.hypot(qRad, q.z) - rTube;
    }
  }
}

function evalCadSceneSdf(
  compiled: CompiledPrimitive[],
  x: number,
  y: number,
  z: number
): number {
  let d = Infinity;
  for (const cp of compiled) {
    const sd = evalSinglePrimitiveSdf(cp, x, y, z);
    if (cp.prim.operation === 'add') {
      if (sd < d) d = sd;
    } else {
      const inv = -sd;
      if (inv > d) d = inv;
    }
  }
  return d;
}

export function computeCadSceneBoundingBox(primitives: CadPrimitive[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
} {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  const solids = primitives.filter((p) => p.operation === 'add');
  const list = solids.length > 0 ? solids : primitives;

  for (const p of list) {
    const rot = buildEulerMatrix(p.rotation[0], p.rotation[1], p.rotation[2]);
    const hx = p.size[0] / 2;
    const hy = p.size[1] / 2;
    const hz = p.size[2] / 2;

    for (const sx of [-hx, hx]) {
      for (const sy of [-hy, hy]) {
        for (const sz of [-hz, hz]) {
          const v = mulMat3Vec(rot, sx, sy, sz);
          const wx = p.position[0] + v.x;
          const wy = p.position[1] + v.y;
          const wz = p.position[2] + v.z;
          if (wx < minX) minX = wx;
          if (wx > maxX) maxX = wx;
          if (wy < minY) minY = wy;
          if (wy > maxY) maxY = wy;
          if (wz < minZ) minZ = wz;
          if (wz > maxZ) maxZ = wz;
        }
      }
    }
  }

  if (!Number.isFinite(minX)) {
    return { minX: -30, maxX: 30, minY: -30, maxY: 30, minZ: 0, maxZ: 60 };
  }
  return { minX, maxX, minY, maxY, minZ: Math.max(0, minZ), maxZ };
}

// ============================================================================
// 4. Teselador 3D de Primitivas CAD para el Visor 3D Interactivo (Tipo Tinkercad)
// ============================================================================

export interface PreviewTri3D {
  a: Vec3;
  b: Vec3;
  c: Vec3;
  color: string;
  primId?: string;
  isHole?: boolean;
}

export function tessellateCadPrimitive(prim: CadPrimitive): PreviewTri3D[] {
  const rot = buildEulerMatrix(prim.rotation[0], prim.rotation[1], prim.rotation[2]);
  const hx = prim.size[0] / 2;
  const hy = prim.size[1] / 2;
  const hz = prim.size[2] / 2;
  const [px, py, pz] = prim.position;

  const toWorld = (lx: number, ly: number, lz: number): Vec3 => {
    const r = mulMat3Vec(rot, lx, ly, lz);
    return { x: px + r.x, y: py + r.y, z: pz + r.z };
  };

  const tris: PreviewTri3D[] = [];
  const isHole = prim.operation === 'subtract';
  const color = isHole ? '#94a3b8' : prim.color;

  const pushTri = (a: Vec3, b: Vec3, c: Vec3) => {
    tris.push({ a, b, c, color, primId: prim.id, isHole });
  };
  const pushQuad = (a: Vec3, b: Vec3, c: Vec3, d: Vec3) => {
    pushTri(a, b, c);
    pushTri(a, c, d);
  };

  if (prim.kind === 'box') {
    const v = [
      toWorld(-hx, -hy, -hz),
      toWorld(hx, -hy, -hz),
      toWorld(hx, hy, -hz),
      toWorld(-hx, hy, -hz),
      toWorld(-hx, -hy, hz),
      toWorld(hx, -hy, hz),
      toWorld(hx, hy, hz),
      toWorld(-hx, hy, hz),
    ];
    pushQuad(v[0], v[3], v[2], v[1]); // bottom
    pushQuad(v[4], v[5], v[6], v[7]); // top
    pushQuad(v[0], v[1], v[5], v[4]); // front
    pushQuad(v[2], v[3], v[7], v[6]); // back
    pushQuad(v[1], v[2], v[6], v[5]); // right
    pushQuad(v[3], v[0], v[4], v[7]); // left
  } else if (prim.kind === 'sphere') {
    const rings = 10;
    const segs = 16;
    const grid: Vec3[][] = [];
    for (let r = 0; r <= rings; r++) {
      const phi = (Math.PI * r) / rings;
      const row: Vec3[] = [];
      for (let s = 0; s < segs; s++) {
        const theta = (2 * Math.PI * s) / segs;
        row.push(
          toWorld(
            hx * Math.sin(phi) * Math.cos(theta),
            hy * Math.sin(phi) * Math.sin(theta),
            hz * Math.cos(phi)
          )
        );
      }
      grid.push(row);
    }
    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < segs; s++) {
        const sn = (s + 1) % segs;
        const a = grid[r][s];
        const b = grid[r + 1][s];
        const c = grid[r + 1][sn];
        const d = grid[r][sn];
        if (r > 0) pushTri(a, b, d);
        if (r < rings - 1) pushTri(b, c, d);
      }
    }
  } else if (prim.kind === 'cylinder') {
    const segs = 18;
    const topC = toWorld(0, 0, hz);
    const botC = toWorld(0, 0, -hz);
    const topRing: Vec3[] = [];
    const botRing: Vec3[] = [];
    for (let s = 0; s < segs; s++) {
      const a = (2 * Math.PI * s) / segs;
      topRing.push(toWorld(hx * Math.cos(a), hy * Math.sin(a), hz));
      botRing.push(toWorld(hx * Math.cos(a), hy * Math.sin(a), -hz));
    }
    for (let s = 0; s < segs; s++) {
      const sn = (s + 1) % segs;
      pushQuad(botRing[s], botRing[sn], topRing[sn], topRing[s]);
      pushTri(topC, topRing[s], topRing[sn]);
      pushTri(botC, botRing[sn], botRing[s]);
    }
  } else if (prim.kind === 'cone') {
    const segs = 18;
    const apex = toWorld(0, 0, hz);
    const botC = toWorld(0, 0, -hz);
    const botRing: Vec3[] = [];
    for (let s = 0; s < segs; s++) {
      const a = (2 * Math.PI * s) / segs;
      botRing.push(toWorld(hx * Math.cos(a), hy * Math.sin(a), -hz));
    }
    for (let s = 0; s < segs; s++) {
      const sn = (s + 1) % segs;
      pushTri(botRing[s], botRing[sn], apex);
      pushTri(botC, botRing[sn], botRing[s]);
    }
  } else if (prim.kind === 'pyramid') {
    const apex = toWorld(0, 0, hz);
    const b0 = toWorld(-hx, -hy, -hz);
    const b1 = toWorld(hx, -hy, -hz);
    const b2 = toWorld(hx, hy, -hz);
    const b3 = toWorld(-hx, hy, -hz);
    pushQuad(b0, b3, b2, b1);
    pushTri(b0, b1, apex);
    pushTri(b1, b2, apex);
    pushTri(b2, b3, apex);
    pushTri(b3, b0, apex);
  } else if (prim.kind === 'torus') {
    const rOuter = Math.max(hx, hy);
    const rTube = Math.min(hz, rOuter * 0.42);
    const rMajor = Math.max(2, rOuter - rTube);
    const scaleX = hx / rOuter;
    const scaleY = hy / rOuter;
    const majorSegs = 22;
    const minorSegs = 10;
    const ring: Vec3[][] = [];
    for (let i = 0; i < majorSegs; i++) {
      const u = (2 * Math.PI * i) / majorSegs;
      const cu = Math.cos(u), su = Math.sin(u);
      const col: Vec3[] = [];
      for (let j = 0; j < minorSegs; j++) {
        const v = (2 * Math.PI * j) / minorSegs;
        const r = rMajor + rTube * Math.cos(v);
        col.push(toWorld(r * cu * scaleX, r * su * scaleY, rTube * Math.sin(v)));
      }
      ring.push(col);
    }
    for (let i = 0; i < majorSegs; i++) {
      const inx = (i + 1) % majorSegs;
      for (let j = 0; j < minorSegs; j++) {
        const jnx = (j + 1) % minorSegs;
        pushQuad(ring[i][j], ring[inx][j], ring[inx][jnx], ring[i][jnx]);
      }
    }
  }

  return tris;
}

// ============================================================================
// 5. Marching Squares + Suavizado + Simplificación RDP para Contornos 2D Limpios
// ============================================================================

function signedPolygonArea(poly: Vec2[]): number {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

function polygonPerimeter(poly: Vec2[]): number {
  let p = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    p += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return p;
}

function pointInPolygon(pt: Vec2, poly: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect =
      yi > pt.y !== yj > pt.y &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToPolygonEdges(pt: Vec2, poly: Vec2[]): number {
  let minD = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const len2 = vx * vx + vy * vy;
    let t = len2 > 1e-9 ? ((pt.x - a.x) * vx + (pt.y - a.y) * vy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const px = a.x + t * vx;
    const py = a.y + t * vy;
    const d = Math.hypot(pt.x - px, pt.y - py);
    if (d < minD) minD = d;
  }
  return minD;
}

function chaikinClosed(poly: Vec2[]): Vec2[] {
  if (poly.length < 4) return poly;
  const out: Vec2[] = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const p0 = poly[i];
    const p1 = poly[(i + 1) % n];
    out.push({ x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y });
    out.push({ x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y });
  }
  return out;
}

function rdpOpen(pts: Vec2[], eps: number): Vec2[] {
  if (pts.length <= 2) return pts;
  const first = pts[0];
  const last = pts[pts.length - 1];
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  const len = Math.hypot(dx, dy);

  let maxD = -1;
  let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    const d =
      len > 1e-9
        ? Math.abs(dy * p.x - dx * p.y + last.x * first.y - last.y * first.x) / len
        : Math.hypot(p.x - first.x, p.y - first.y);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD > eps) {
    const left = rdpOpen(pts.slice(0, idx + 1), eps);
    const right = rdpOpen(pts.slice(idx), eps);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}

function simplifyClosedPolygon(poly: Vec2[], eps: number): Vec2[] {
  if (poly.length < 6) return poly;
  // Dividir por los 2 vértices más lejanos
  const half = Math.floor(poly.length / 2);
  const a = rdpOpen(poly.slice(0, half + 1), eps);
  const b = rdpOpen(poly.slice(half).concat([poly[0]]), eps);
  const merged = a.slice(0, -1).concat(b.slice(0, -1));
  return merged.length >= 3 ? merged : poly;
}

/**
 * Extrae contornos cerrados (CCW) de una grilla escalar 2D (valores <= 0 son interior).
 */
function extractContoursFromScalarGrid(
  field: Float32Array,
  nu: number,
  nv: number,
  uMin: number,
  vMin: number,
  du: number,
  dv: number
): Vec2[][] {
  const segs: [Vec2, Vec2][] = [];

  const interp = (a: number, b: number) => {
    const denom = b - a;
    if (Math.abs(denom) < 1e-7) return 0.5;
    return Math.max(0.02, Math.min(0.98, -a / denom));
  };

  for (let j = 0; j < nv - 1; j++) {
    const y0 = vMin + j * dv;
    const y1 = y0 + dv;
    const row0 = j * nu;
    const row1 = (j + 1) * nu;

    for (let i = 0; i < nu - 1; i++) {
      const f0 = field[row0 + i];     // BL
      const f1 = field[row0 + i + 1]; // BR
      const f2 = field[row1 + i + 1]; // TR
      const f3 = field[row1 + i];     // TL

      const code =
        (f0 <= 0 ? 1 : 0) |
        (f1 <= 0 ? 2 : 0) |
        (f2 <= 0 ? 4 : 0) |
        (f3 <= 0 ? 8 : 0);

      if (code === 0 || code === 15) continue;

      const x0 = uMin + i * du;
      const x1 = x0 + du;

      const eBot = (): Vec2 => ({ x: x0 + interp(f0, f1) * du, y: y0 });
      const eRight = (): Vec2 => ({ x: x1, y: y0 + interp(f1, f2) * dv });
      const eTop = (): Vec2 => ({ x: x0 + interp(f3, f2) * du, y: y1 });
      const eLeft = (): Vec2 => ({ x: x0, y: y0 + interp(f0, f3) * dv });

      // Orientación consistente: interior a la izquierda del segmento (CCW para exteriores)
      switch (code) {
        case 1:  segs.push([eLeft(), eBot()]); break;
        case 2:  segs.push([eBot(), eRight()]); break;
        case 3:  segs.push([eLeft(), eRight()]); break;
        case 4:  segs.push([eRight(), eTop()]); break;
        case 5: {
          const center = 0.25 * (f0 + f1 + f2 + f3);
          if (center <= 0) {
            segs.push([eLeft(), eTop()]);
            segs.push([eRight(), eBot()]);
          } else {
            segs.push([eLeft(), eBot()]);
            segs.push([eRight(), eTop()]);
          }
          break;
        }
        case 6:  segs.push([eBot(), eTop()]); break;
        case 7:  segs.push([eLeft(), eTop()]); break;
        case 8:  segs.push([eTop(), eLeft()]); break;
        case 9:  segs.push([eTop(), eBot()]); break;
        case 10: {
          const center = 0.25 * (f0 + f1 + f2 + f3);
          if (center <= 0) {
            segs.push([eBot(), eLeft()]);
            segs.push([eTop(), eRight()]);
          } else {
            segs.push([eBot(), eRight()]);
            segs.push([eTop(), eLeft()]);
          }
          break;
        }
        case 11: segs.push([eTop(), eRight()]); break;
        case 12: segs.push([eRight(), eLeft()]); break;
        case 13: segs.push([eRight(), eBot()]); break;
        case 14: segs.push([eBot(), eLeft()]); break;
      }
    }
  }

  // Encadenar segmentos en lazos cerrados por clave espacial cuantizada
  const keyOf = (p: Vec2) => `${Math.round(p.x * 200)}_${Math.round(p.y * 200)}`;
  const nextMap = new Map<string, number[]>();
  for (let i = 0; i < segs.length; i++) {
    const k = keyOf(segs[i][0]);
    const arr = nextMap.get(k);
    if (arr) arr.push(i);
    else nextMap.set(k, [i]);
  }

  const used = new Uint8Array(segs.length);
  const rawLoops: Vec2[][] = [];

  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    const loop: Vec2[] = [];
    let cur = i;
    let guard = segs.length + 5;

    while (cur !== -1 && !used[cur] && guard-- > 0) {
      used[cur] = 1;
      loop.push(segs[cur][0]);
      const endKey = keyOf(segs[cur][1]);
      const candidates = nextMap.get(endKey);
      cur = -1;
      if (candidates) {
        for (const c of candidates) {
          if (!used[c]) {
            cur = c;
            break;
          }
        }
      }
    }

    if (loop.length >= 4) {
      const area = Math.abs(signedPolygonArea(loop));
      if (area >= 22) {
        let smoothed = chaikinClosed(loop);
        smoothed = simplifyClosedPolygon(smoothed, 0.26);
        if (signedPolygonArea(smoothed) < 0) {
          smoothed.reverse();
        }
        if (smoothed.length >= 3 && signedPolygonArea(smoothed) >= 20) {
          rawLoops.push(smoothed);
        }
      }
    }
  }

  // Conservar contornos exteriores (los mayores primero) y descartar hoyos diminutos
  rawLoops.sort((a, b) => signedPolygonArea(b) - signedPolygonArea(a));
  return rawLoops;
}

// ============================================================================
// 6. Rasterizador de Corte de Malla Triangulada (.STL/.OBJ) en un Plano
// ============================================================================

function rasterizeMeshPlaneSlice(
  triangles: Float32Array,
  axis: 'x' | 'y' | 'z',
  planeCoord: number,
  uMin: number,
  vMin: number,
  du: number,
  dv: number,
  nu: number,
  nv: number
): Float32Array {
  const segs: [number, number, number, number][] = [];

  const getCoords = (x: number, y: number, z: number): [number, number, number] => {
    if (axis === 'x') return [x, y, z]; // plane=X, u=Y, v=Z
    if (axis === 'y') return [y, x, z]; // plane=Y, u=X, v=Z
    return [z, x, y];                   // plane=Z, u=X, v=Y
  };

  for (let i = 0; i < triangles.length; i += 9) {
    const [a0, u0, v0] = getCoords(triangles[i], triangles[i + 1], triangles[i + 2]);
    const [a1, u1, v1] = getCoords(triangles[i + 3], triangles[i + 4], triangles[i + 5]);
    const [a2, u2, v2] = getCoords(triangles[i + 6], triangles[i + 7], triangles[i + 8]);

    const d0 = a0 - planeCoord;
    const d1 = a1 - planeCoord;
    const d2 = a2 - planeCoord;

    if ((d0 > 0 && d1 > 0 && d2 > 0) || (d0 < 0 && d1 < 0 && d2 < 0)) continue;

    const pts: [number, number][] = [];
    const checkEdge = (da: number, ua: number, va: number, db: number, ub: number, vb: number) => {
      if ((da <= 0 && db > 0) || (db <= 0 && da > 0)) {
        const t = -da / (db - da);
        pts.push([ua + t * (ub - ua), va + t * (vb - va)]);
      }
    };
    checkEdge(d0, u0, v0, d1, u1, v1);
    checkEdge(d1, u1, v1, d2, u2, v2);
    checkEdge(d2, u2, v2, d0, u0, v0);

    if (pts.length >= 2) {
      segs.push([pts[0][0], pts[0][1], pts[1][0], pts[1][1]]);
    }
  }

  const field = new Float32Array(nu * nv);
  field.fill(1.0);
  if (segs.length === 0) return field;

  const crossings: number[] = [];
  for (let j = 0; j < nv; j++) {
    const v = vMin + j * dv + 1e-5;
    crossings.length = 0;
    for (let s = 0; s < segs.length; s++) {
      const [su0, sv0, su1, sv1] = segs[s];
      if ((sv0 <= v && sv1 > v) || (sv1 <= v && sv0 > v)) {
        const t = (v - sv0) / (sv1 - sv0);
        crossings.push(su0 + t * (su1 - su0));
      }
    }
    if (crossings.length < 2) continue;
    crossings.sort((a, b) => a - b);

    const row = j * nu;
    for (let k = 0; k + 1 < crossings.length; k += 2) {
      const cStart = crossings[k];
      const cEnd = crossings[k + 1];
      const iStart = Math.max(1, Math.ceil((cStart - uMin) / du));
      const iEnd = Math.min(nu - 2, Math.floor((cEnd - uMin) / du));
      for (let i = iStart; i <= iEnd; i++) {
        field[row + i] = -1.0;
      }
    }
  }

  // Suavizado ligero 3x3 para obtener bordes Marching Squares limpios sin escalonado
  const smooth = new Float32Array(field.length);
  smooth.fill(1.0);
  for (let j = 1; j < nv - 1; j++) {
    const row = j * nu;
    for (let i = 1; i < nu - 1; i++) {
      smooth[row + i] =
        (4 * field[row + i] +
          field[row + i - 1] +
          field[row + i + 1] +
          field[row - nu + i] +
          field[row + nu + i]) /
        8;
    }
  }
  return smooth;
}

// ============================================================================
// 7. Tallado Analítico Exacto de Ranuras de Encaje (90°, precisión 0.001 mm)
// ============================================================================

function carveExactSlotIntoPolygon(
  poly: Vec2[],
  uCenter: number,
  slotWidth: number,
  zMin: number,
  zMax: number,
  zMid: number,
  fromTop: boolean
): Vec2[] | null {
  const n = poly.length;
  if (n < 4) return null;

  const uL = uCenter - slotWidth / 2;
  const uR = uCenter + slotWidth / 2;

  // Verificar que el fondo de la ranura (uCenter, zMid) esté realmente dentro del polígono
  if (!pointInPolygon({ x: uCenter, y: zMid }, poly)) return null;

  interface Hit {
    edgeIdx: number;
    t: number;
    pt: Vec2;
  }

  const findVerticalHits = (targetU: number, wantTopEdge: boolean): Hit[] => {
    const hits: Hit[] = [];
    for (let i = 0; i < n; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % n];
      // En un polígono CCW:
      // - Borde superior viaja de derecha a izquierda (b.x < a.x)
      // - Borde inferior viaja de izquierda a derecha (b.x > a.x)
      if (wantTopEdge && !(b.x < a.x - 1e-6)) continue;
      if (!wantTopEdge && !(b.x > a.x + 1e-6)) continue;

      const minX = Math.min(a.x, b.x);
      const maxX = Math.max(a.x, b.x);
      if (targetU < minX - 1e-6 || targetU > maxX + 1e-6) continue;

      const t = (targetU - a.x) / (b.x - a.x);
      if (t < -1e-5 || t > 1 + 1e-5) continue;
      const tc = Math.max(0, Math.min(1, t));
      const y = a.y + tc * (b.y - a.y);

      if (wantTopEdge) {
        if (y > zMid + 0.6 && y <= zMax + 5.0) {
          hits.push({ edgeIdx: i, t: tc, pt: { x: targetU, y } });
        }
      } else {
        if (y < zMid - 0.6 && y >= zMin - 5.0) {
          hits.push({ edgeIdx: i, t: tc, pt: { x: targetU, y } });
        }
      }
    }
    return hits;
  };

  let startHit: Hit | null = null;
  let endHit: Hit | null = null;

  if (fromTop) {
    // En borde superior (CCW): primero pasamos por uR y luego por uL
    const hitsR = findVerticalHits(uR, true).sort((a, b) => b.pt.y - a.pt.y);
    const hitsL = findVerticalHits(uL, true).sort((a, b) => b.pt.y - a.pt.y);
    if (hitsR.length === 0 || hitsL.length === 0) return null;
    startHit = hitsR[0];
    endHit = hitsL[0];
  } else {
    // En borde inferior (CCW): primero pasamos por uL y luego por uR
    const hitsL = findVerticalHits(uL, false).sort((a, b) => a.pt.y - b.pt.y);
    const hitsR = findVerticalHits(uR, false).sort((a, b) => a.pt.y - b.pt.y);
    if (hitsL.length === 0 || hitsR.length === 0) return null;
    startHit = hitsL[0];
    endHit = hitsR[0];
  }

  // Verificar que los vértices intermedios entre startHit y endHit pertenezcan al tramo local de la ranura
  const sameEdge = startHit.edgeIdx === endHit.edgeIdx;
  if (sameEdge && endHit.t <= startHit.t) return null;

  let steps = 0;
  if (!sameEdge) {
    let idx = (startHit.edgeIdx + 1) % n;
    while (idx !== (endHit.edgeIdx + 1) % n) {
      const v = poly[idx];
      if (v.x < uL - 2.0 || v.x > uR + 2.0) return null;
      if (fromTop && v.y <= zMid) return null;
      if (!fromTop && v.y >= zMid) return null;
      steps++;
      if (steps > Math.max(12, n * 0.4)) return null;
      idx = (idx + 1) % n;
    }
  }

  // Reconstruir el polígono reemplazando [startHit -> endHit] por el canal rectangular de 90°
  const result: Vec2[] = [];
  const slotBottomStart: Vec2 = { x: startHit.pt.x, y: zMid };
  const slotBottomEnd: Vec2 = { x: endHit.pt.x, y: zMid };

  result.push(startHit.pt);
  result.push(slotBottomStart);
  result.push(slotBottomEnd);
  result.push(endHit.pt);

  // Recorrer el resto del polígono desde (endHit.edgeIdx + 1) hasta startHit.edgeIdx inclusive
  let cur = (endHit.edgeIdx + 1) % n;
  const stop = (startHit.edgeIdx + 1) % n;
  let guard = n + 2;

  if (sameEdge) {
    // Si ambos cortes cayeron en el mismo segmento, agregamos todos los vértices restantes
    for (let k = 0; k < n; k++) {
      const idx = (endHit.edgeIdx + 1 + k) % n;
      result.push(poly[idx]);
    }
  } else {
    while (cur !== stop && guard-- > 0) {
      result.push(poly[cur]);
      cur = (cur + 1) % n;
    }
  }

  // Eliminar vértices duplicados consecutivos
  const clean: Vec2[] = [];
  for (let i = 0; i < result.length; i++) {
    const p = result[i];
    const prev = clean[clean.length - 1];
    if (!prev || Math.hypot(p.x - prev.x, p.y - prev.y) > 0.02) {
      clean.push(p);
    }
  }
  if (
    clean.length > 2 &&
    Math.hypot(clean[0].x - clean[clean.length - 1].x, clean[0].y - clean[clean.length - 1].y) <
      0.02
  ) {
    clean.pop();
  }

  if (clean.length < 4 || signedPolygonArea(clean) < 15) return null;
  return clean;
}

function findInteriorLabelPoint(poly: Vec2[]): Vec2 {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of poly) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  let bestPt: Vec2 = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  let bestDist = -1;

  const steps = 11;
  for (let ix = 1; ix < steps; ix++) {
    for (let iy = 1; iy < steps; iy++) {
      const pt: Vec2 = {
        x: minX + ((maxX - minX) * ix) / steps,
        y: minY + ((maxY - minY) * iy) / steps,
      };
      if (!pointInPolygon(pt, poly)) continue;
      const d = distToPolygonEdges(pt, poly);
      if (d > bestDist) {
        bestDist = d;
        bestPt = pt;
      }
    }
  }
  return bestPt;
}

// ============================================================================
// 8. Motor Principal de Laminado 3D -> Piezas 2D MDF 3 mm + Empaquetado
// ============================================================================

export function runSlicer3D(
  sourceMode: 'cad' | 'upload',
  primitives: CadPrimitive[],
  uploadedModel: UploadedMeshModel | null,
  config: SlicerConfig
): SlicerResult {
  const warnings: string[] = [];

  // Preparar evaluador 3D según la fuente
  const compiledPrims = sourceMode === 'cad' ? compilePrimitives(primitives) : [];
  const transformedMesh =
    sourceMode === 'upload' && uploadedModel
      ? getTransformedUploadedTriangles(uploadedModel)
      : null;

  const bbox =
    sourceMode === 'upload' && transformedMesh
      ? transformedMesh.bbox
      : computeCadSceneBoundingBox(primitives);

  const dimX = Math.max(10, bbox.maxX - bbox.minX);
  const dimY = Math.max(10, bbox.maxY - bbox.minY);
  const dimZ = Math.max(10, bbox.maxZ - bbox.minZ);

  const pad = 4.0;

  const buildScalarGrid = (
    axis: 'x' | 'y' | 'z',
    planeCoord: number
  ): {
    field: Float32Array;
    nu: number;
    nv: number;
    uMin: number;
    vMin: number;
    du: number;
    dv: number;
  } => {
    const u0 = (axis === 'x' ? bbox.minY : bbox.minX) - pad;
    const u1 = (axis === 'x' ? bbox.maxY : bbox.maxX) + pad;
    const v0 = (axis === 'z' ? bbox.minY : bbox.minZ) - pad;
    const v1 = (axis === 'z' ? bbox.maxY : bbox.maxZ) + pad;

    const spanU = u1 - u0;
    const spanV = v1 - v0;
    const targetStep = Math.max(0.55, Math.max(spanU, spanV) / 140);
    const nu = Math.max(48, Math.min(170, Math.ceil(spanU / targetStep) + 1));
    const nv = Math.max(48, Math.min(170, Math.ceil(spanV / targetStep) + 1));
    const du = spanU / (nu - 1);
    const dv = spanV / (nv - 1);

    if (sourceMode === 'upload' && transformedMesh) {
      const field = rasterizeMeshPlaneSlice(
        transformedMesh.triangles,
        axis,
        planeCoord,
        u0,
        v0,
        du,
        dv,
        nu,
        nv
      );
      return { field, nu, nv, uMin: u0, vMin: v0, du, dv };
    }

    const field = new Float32Array(nu * nv);
    for (let j = 0; j < nv; j++) {
      const v = v0 + j * dv;
      const row = j * nu;
      for (let i = 0; i < nu; i++) {
        const u = u0 + i * du;
        const wx = axis === 'x' ? planeCoord : u;
        const wy = axis === 'x' ? u : axis === 'y' ? planeCoord : v;
        const wz = axis === 'z' ? planeCoord : v;
        field[row + i] = evalCadSceneSdf(compiledPrims, wx, wy, wz);
      }
    }
    return { field, nu, nv, uMin: u0, vMin: v0, du, dv };
  };

  const sampleGridInside = (
    g: { field: Float32Array; nu: number; nv: number; uMin: number; vMin: number; du: number; dv: number },
    u: number,
    v: number
  ): boolean => {
    const fi = Math.round((u - g.uMin) / g.du);
    const fj = Math.round((v - g.vMin) / g.dv);
    if (fi < 0 || fi >= g.nu || fj < 0 || fj >= g.nv) return false;
    return g.field[fj * g.nu + fi] <= 0;
  };

  const pieces: SlicedPiece2D[] = [];
  let totalInterlockingSlots = 0;

  if (config.cutMode === 'waffle') {
    // 1. Calcular posiciones de planos X (longitudinales) y planos Y (costillas transversales)
    const maxSafeX = Math.max(1, Math.min(config.xSliceCount, Math.floor(dimX / 9.5)));
    const maxSafeY = Math.max(1, Math.min(config.ySliceCount, Math.floor(dimY / 9.5)));

    const xCoords: number[] = [];
    for (let i = 0; i < maxSafeX; i++) {
      const t = (i + 1) / (maxSafeX + 1);
      xCoords.push(Number((bbox.minX + t * dimX).toFixed(2)));
    }
    const yCoords: number[] = [];
    for (let j = 0; j < maxSafeY; j++) {
      const t = (j + 1) / (maxSafeY + 1);
      yCoords.push(Number((bbox.minY + t * dimY).toFixed(2)));
    }

    const xSlicesData = xCoords.map((xc, idx) => {
      const grid = buildScalarGrid('x', xc);
      const contours = extractContoursFromScalarGrid(
        grid.field,
        grid.nu,
        grid.nv,
        grid.uMin,
        grid.vMin,
        grid.du,
        grid.dv
      );
      return {
        label: `X${idx + 1}`,
        coord: xc,
        grid,
        contours,
        slots: [] as SliceSlotInfo[],
      };
    });

    const ySlicesData = yCoords.map((yc, idx) => {
      const grid = buildScalarGrid('y', yc);
      const contours = extractContoursFromScalarGrid(
        grid.field,
        grid.nu,
        grid.nv,
        grid.uMin,
        grid.vMin,
        grid.du,
        grid.dv
      );
      return {
        label: `Y${idx + 1}`,
        coord: yc,
        grid,
        contours,
        slots: [] as SliceSlotInfo[],
      };
    });

    // 2. Encontrar intersecciones verticales exactas (x_i, y_j, z) y tallar ranuras a media madera
    for (const xs of xSlicesData) {
      if (xs.contours.length === 0) continue;
      for (const ys of ySlicesData) {
        if (ys.contours.length === 0) continue;

        // Buscar segmentos verticales sólidos comunes en (xs.coord, ys.coord, z)
        const zStep = 0.5;
        let inSeg = false;
        let curStart = 0;
        let bestSpan: [number, number] | null = null;
        let bestHeight = 0;

        for (let z = bbox.minZ; z <= bbox.maxZ + zStep; z += zStep) {
          const insideBoth =
            sampleGridInside(xs.grid, ys.coord, z) && sampleGridInside(ys.grid, xs.coord, z);
          if (insideBoth && !inSeg) {
            inSeg = true;
            curStart = z;
          } else if (!insideBoth && inSeg) {
            inSeg = false;
            const h = z - curStart;
            if (h > bestHeight) {
              bestHeight = h;
              bestSpan = [curStart, z];
            }
          }
        }

        if (bestSpan && bestHeight >= 9.0) {
          const [zMin, zMax] = bestSpan;
          const zMid = Number(((zMin + zMax) / 2).toFixed(2));

          // Tallar en X-slice (desde ARRIBA hacia zMid en u = ys.coord)
          let carvedX = false;
          for (let c = 0; c < xs.contours.length; c++) {
            const nextPoly = carveExactSlotIntoPolygon(
              xs.contours[c],
              ys.coord,
              config.slotWidthMm,
              zMin,
              zMax,
              zMid,
              true
            );
            if (nextPoly) {
              xs.contours[c] = nextPoly;
              carvedX = true;
              break;
            }
          }

          // Tallar en Y-slice (desde ABAJO hacia zMid en u = xs.coord)
          let carvedY = false;
          if (carvedX) {
            for (let c = 0; c < ys.contours.length; c++) {
              const nextPoly = carveExactSlotIntoPolygon(
                ys.contours[c],
                xs.coord,
                config.slotWidthMm,
                zMin,
                zMax,
                zMid,
                false
              );
              if (nextPoly) {
                ys.contours[c] = nextPoly;
                carvedY = true;
                break;
              }
            }
          }

          if (carvedX && carvedY) {
            xs.slots.push({
              uCenter: ys.coord,
              zMin,
              zMax,
              zMid,
              width: config.slotWidthMm,
              fromTop: true,
              partnerLabel: ys.label,
            });
            ys.slots.push({
              uCenter: xs.coord,
              zMin,
              zMax,
              zMid,
              width: config.slotWidthMm,
              fromTop: false,
              partnerLabel: xs.label,
            });
            totalInterlockingSlots += 2;
          }
        }
      }
    }

    // 3. Empaquetar piezas X e Y válidas
    for (const xs of xSlicesData) {
      if (xs.contours.length === 0) continue;
      pieces.push(buildPiece2D(xs.label, 'x', xs.coord, xs.contours, [], xs.slots));
    }
    for (const ys of ySlicesData) {
      if (ys.contours.length === 0) continue;
      pieces.push(buildPiece2D(ys.label, 'y', ys.coord, ys.contours, [], ys.slots));
    }

    if (totalInterlockingSlots === 0 && pieces.length > 0) {
      warnings.push(
        'Algunas piezas no se intersectaron con altura suficiente (≥ 9 mm). Prueba aumentar el número de planos o engrosar el modelo.'
      );
    }
  } else {
    // MODO PLANOS SERIADOS APILADOS (STACKED)
    const axis = config.stackedAxis;
    const minA = axis === 'x' ? bbox.minX : axis === 'y' ? bbox.minY : bbox.minZ;
    const maxA = axis === 'x' ? bbox.maxX : axis === 'y' ? bbox.maxY : bbox.maxZ;
    const step = Math.max(3.0, config.stackedStepMm);
    const totalSpan = maxA - minA;
    const maxSlices = 42;
    const effectiveStep = totalSpan / step > maxSlices ? totalSpan / maxSlices : step;

    if (effectiveStep > step + 0.05) {
      warnings.push(
        `El modelo es muy largo para ${step} mm; se ajustó el paso automáticamente a ${effectiveStep.toFixed(1)} mm (${maxSlices} láminas máx.).`
      );
    }

    const rawSlices: { coord: number; contours: Vec2[][] }[] = [];
    for (let c = minA + effectiveStep * 0.5; c < maxA; c += effectiveStep) {
      const grid = buildScalarGrid(axis, c);
      const contours = extractContoursFromScalarGrid(
        grid.field,
        grid.nu,
        grid.nv,
        grid.uMin,
        grid.vMin,
        grid.du,
        grid.dv
      );
      if (contours.length > 0) {
        rawSlices.push({ coord: Number(c.toFixed(2)), contours });
      }
    }

    // Determinar hasta 2 ejes pasantes compartidos para varillas guía PLA
    const holeR = config.alignmentHoleDiameterMm / 2;
    const candidateHoles: Vec2[] = [];
    if (config.includeAlignmentHoles && rawSlices.length >= 2) {
      const midSlice = rawSlices[Math.floor(rawSlices.length / 2)];
      const mainPoly = midSlice.contours[0];
      const p1 = findInteriorLabelPoint(mainPoly);
      if (distToPolygonEdges(p1, mainPoly) >= holeR + 2.6) {
        candidateHoles.push(p1);
      }
      // Buscar un segundo punto alejado al menos 16 mm del primero dentro del núcleo
      let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
      for (const p of mainPoly) {
        if (p.x < minU) minU = p.x;
        if (p.x > maxU) maxU = p.x;
        if (p.y < minV) minV = p.y;
        if (p.y > maxV) maxV = p.y;
      }
      let bestP2: Vec2 | null = null;
      let bestScore = -1;
      for (let ix = 1; ix < 10; ix++) {
        for (let iy = 1; iy < 10; iy++) {
          const pt = {
            x: minU + ((maxU - minU) * ix) / 10,
            y: minV + ((maxV - minV) * iy) / 10,
          };
          if (!pointInPolygon(pt, mainPoly)) continue;
          const dEdge = distToPolygonEdges(pt, mainPoly);
          if (dEdge < holeR + 2.6) continue;
          const dFrom1 = Math.hypot(pt.x - p1.x, pt.y - p1.y);
          if (dFrom1 < 14) continue;
          const score = dEdge + dFrom1 * 0.25;
          if (score > bestScore) {
            bestScore = score;
            bestP2 = pt;
          }
        }
      }
      if (bestP2) candidateHoles.push(bestP2);
    }

    rawSlices.forEach((sl, idx) => {
      const label = `C${String(idx + 1).padStart(2, '0')}`;
      const pieceHoles: { x: number; y: number; r: number }[] = [];
      for (const ch of candidateHoles) {
        // Solo perforar si el punto cae bien dentro de alguno de los contornos de esta capa
        for (const poly of sl.contours) {
          if (pointInPolygon(ch, poly) && distToPolygonEdges(ch, poly) >= holeR + 1.8) {
            pieceHoles.push({ x: ch.x, y: ch.y, r: holeR });
            break;
          }
        }
      }
      pieces.push(buildPiece2D(label, axis, sl.coord, sl.contours, pieceHoles, []));
    });
  }

  // 4. Empaquetar piezas en planchas de MDF (Bin Packing por Estantes)
  const sheets = nestPiecesOntoSheets(pieces, config.sheetWidthMm, config.sheetHeightMm);

  // 5. Telemetría de corte láser y kit PLA
  const xPiecesCount = pieces.filter((p) => p.axis === 'x' && config.cutMode === 'waffle').length;
  const yPiecesCount = pieces.filter((p) => p.axis === 'y' && config.cutMode === 'waffle').length;
  const stackedPiecesCount = config.cutMode === 'stacked' ? pieces.length : 0;

  const totalCutPerimeterMm = pieces.reduce((acc, p) => acc + p.perimeterMm, 0);
  const totalAreaMm2 = pieces.reduce((acc, p) => acc + p.areaMm2, 0);
  const engraveSec = config.engraveLabels ? pieces.length * 4.5 : 0;
  const estimatedLaserSec = Math.max(20, Math.round(totalCutPerimeterMm / 7.5 + engraveSec));
  const lMin = Math.floor(estimatedLaserSec / 60);
  const lSec = estimatedLaserSec % 60;
  const estimatedLaserTimeFormatted = lMin > 0 ? `${lMin} min ${lSec} s` : `${lSec} s`;

  const estimatedPlaGrams = config.cutMode === 'stacked' ? 4.8 : 5.4;
  const estimatedPlaPrintMin = config.cutMode === 'stacked' ? 14 : 16;
  const plaKitSummary =
    config.cutMode === 'stacked'
      ? `2 ejes guía PLA (Ø${(config.alignmentHoleDiameterMm - 0.25).toFixed(2)} mm) + 2 tapas de bloqueo + 1 base exhibidora`
      : `4 clips traba en U (MDF ${config.materialThicknessMm.toFixed(1)} mm) + 1 pedestal exhibidor ranurado`;

  return {
    pieces,
    sheets,
    telemetry: {
      totalPieces: pieces.length,
      xPiecesCount,
      yPiecesCount,
      stackedPiecesCount,
      totalInterlockingSlots,
      sheetsRequired: sheets.length,
      boundingBoxMm: {
        x: Number(dimX.toFixed(1)),
        y: Number(dimY.toFixed(1)),
        z: Number(dimZ.toFixed(1)),
      },
      totalCutPerimeterMm: Math.round(totalCutPerimeterMm),
      estimatedLaserSec,
      estimatedLaserTimeFormatted,
      estimatedMdfAreaCm2: Number((totalAreaMm2 / 100).toFixed(1)),
      estimatedPlaGrams,
      estimatedPlaPrintMin,
      plaKitSummary,
    },
    warnings,
  };
}

function buildPiece2D(
  label: string,
  axis: 'x' | 'y' | 'z',
  planeCoordMm: number,
  contours: Vec2[][],
  holes: { x: number; y: number; r: number }[],
  slots: SliceSlotInfo[]
): SlicedPiece2D {
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
  let areaMm2 = 0;
  let perimeterMm = 0;

  for (const poly of contours) {
    areaMm2 += Math.abs(signedPolygonArea(poly));
    perimeterMm += polygonPerimeter(poly);
    for (const p of poly) {
      if (p.x < minU) minU = p.x;
      if (p.x > maxU) maxU = p.x;
      if (p.y < minV) minV = p.y;
      if (p.y > maxV) maxV = p.y;
    }
  }
  for (const h of holes) {
    perimeterMm += 2 * Math.PI * h.r;
  }

  const labelPoint = findInteriorLabelPoint(contours[0]);

  return {
    id: `${label}-${planeCoordMm}`,
    label,
    axis,
    planeCoordMm,
    contours,
    holes,
    slots,
    labelPoint,
    minU,
    maxU,
    minV,
    maxV,
    widthMm: Number((maxU - minU).toFixed(2)),
    heightMm: Number((maxV - minV).toFixed(2)),
    areaMm2: Number(areaMm2.toFixed(1)),
    perimeterMm: Number(perimeterMm.toFixed(1)),
  };
}

function nestPiecesOntoSheets(
  pieces: SlicedPiece2D[],
  sheetWidthMm: number,
  sheetHeightMm: number
): NestedSheet[] {
  const margin = 6;
  const headerTop = 10;
  const gap = 4.5;
  const usableW = Math.max(60, sheetWidthMm - margin * 2);
  const usableH = Math.max(60, sheetHeightMm - margin - headerTop);

  // Ordenar por altura descendente para mejor aprovechamiento de filas
  const sorted = [...pieces].sort((a, b) => b.heightMm - a.heightMm);

  const sheets: NestedSheet[] = [];
  let curPlacements: PlacedPieceOnSheet[] = [];
  let cursorX = margin;
  let cursorY = headerTop;
  let shelfH = 0;

  const flushSheet = () => {
    if (curPlacements.length > 0) {
      sheets.push({
        sheetIndex: sheets.length + 1,
        widthMm: sheetWidthMm,
        heightMm: sheetHeightMm,
        placements: curPlacements,
      });
      curPlacements = [];
    }
    cursorX = margin;
    cursorY = headerTop;
    shelfH = 0;
  };

  for (const piece of sorted) {
    let pw = piece.widthMm;
    let ph = piece.heightMm;
    let rotated90 = false;

    // Rotar 90° si así cabe en la plancha o ahorra altura significativa
    if ((pw > usableW && ph <= usableW) || (ph > usableH && pw <= usableH)) {
      [pw, ph] = [ph, pw];
      rotated90 = true;
    }

    if (cursorX + pw > sheetWidthMm - margin + 0.1 && cursorX > margin) {
      cursorX = margin;
      cursorY += shelfH + gap;
      shelfH = 0;
    }

    if (cursorY + ph > sheetHeightMm - margin + 0.1 && curPlacements.length > 0) {
      flushSheet();
    }

    curPlacements.push({
      piece,
      sheetX: Number(cursorX.toFixed(2)),
      sheetY: Number(cursorY.toFixed(2)),
      rotated90,
    });

    cursorX += pw + gap;
    if (ph > shelfH) shelfH = ph;
  }

  flushSheet();
  return sheets;
}
