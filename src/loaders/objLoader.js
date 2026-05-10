import * as twgl from "twgl.js";

// Parser .obj minimalista. Suporta:
//   v  x y z           (posição)
//   vt u v             (coord de textura)
//   vn x y z           (normal)
//   f  a/b/c d/e/f ... (face triangulada via fan a partir do 1º vértice)
// Não suporta: materiais (mtl), grupos, smoothing groups, faces sem normal.
// Motivo do escopo enxuto: cobre os modelos do enunciado e não acumula peso
// de uma lib externa.
export async function loadObjModel(gl, url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Erro ao carregar OBJ: ${url}`);
  }

  const text = await response.text();
  const data = parseObj(text);

  if (data.positions.length === 0) {
    // Arquivo vazio ou sem geometria. Lança para o chamador decidir o que
    // fazer (a `createScene` ignora e segue sem o modelo).
    throw new Error(`OBJ sem geometria: ${url}`);
  }

  // Cria os buffers no formato esperado pelo shader phong (a_position,
  // a_normal, a_texcoord). `setAttributePrefix("a_")` já foi chamado uma vez
  // em shaderProgram.js, então os nomes batem.
  return twgl.createBufferInfoFromArrays(gl, {
    position: { numComponents: 3, data: data.positions },
    normal: { numComponents: 3, data: data.normals },
    texcoord: { numComponents: 2, data: data.texcoords },
  });
}

export function parseObj(text) {
  const v = [];   // posições brutas (do arquivo)
  const vt = [];  // texcoords brutos
  const vn = [];  // normais brutas

  // Saída final: arrays "achatados" indexados por vértice, prontos para a GPU.
  const positions = [];
  const normals = [];
  const texcoords = [];

  const lines = text.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) continue;

    const parts = line.split(/\s+/);
    const head = parts[0];

    if (head === "v") {
      v.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
    } else if (head === "vt") {
      vt.push(parseFloat(parts[1]), parseFloat(parts[2]));
    } else if (head === "vn") {
      vn.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
    } else if (head === "f") {
      // Triangulação por leque: para uma face com N vértices (N >= 3),
      // emitimos os triângulos (0,1,2), (0,2,3), (0,3,4), ...
      const verts = parts.slice(1);
      for (let i = 1; i < verts.length - 1; i++) {
        emitVertex(verts[0], v, vt, vn, positions, normals, texcoords);
        emitVertex(verts[i], v, vt, vn, positions, normals, texcoords);
        emitVertex(verts[i + 1], v, vt, vn, positions, normals, texcoords);
      }
    }
  }

  // Se o OBJ não tinha normais (vn ausentes), calculamos por face: cada
  // triângulo gera a mesma normal para seus 3 vértices (flat shading).
  if (vn.length === 0) {
    fillFlatNormals(positions, normals);
  }

  // Se faltavam texcoords, preenchemos com (0,0) para casar com o vertex
  // shader sem precisar de um shader alternativo.
  if (texcoords.length !== (positions.length / 3) * 2) {
    texcoords.length = 0;
    for (let i = 0; i < positions.length / 3; i++) texcoords.push(0, 0);
  }

  return { positions, normals, texcoords };
}

function emitVertex(token, v, vt, vn, positions, normals, texcoords) {
  // Cada vértice da face tem formato "iV/iT/iN" (com partes opcionais).
  // Índices no OBJ são 1-based e podem ser negativos (relativos ao fim).
  const idx = token.split("/");
  const vi = resolveIndex(idx[0], v.length / 3);
  const ti = idx[1] && idx[1].length > 0 ? resolveIndex(idx[1], vt.length / 2) : -1;
  const ni = idx[2] && idx[2].length > 0 ? resolveIndex(idx[2], vn.length / 3) : -1;

  positions.push(v[vi * 3], v[vi * 3 + 1], v[vi * 3 + 2]);

  if (ni >= 0) {
    normals.push(vn[ni * 3], vn[ni * 3 + 1], vn[ni * 3 + 2]);
  } else {
    // Marcador: será preenchido depois por fillFlatNormals se necessário.
    normals.push(0, 0, 0);
  }

  if (ti >= 0) {
    // V do OBJ tem origem no canto inferior; em WebGL com flipY=true ao
    // carregar texturas o eixo já fica certo. Mantemos o V cru aqui.
    texcoords.push(vt[ti * 2], vt[ti * 2 + 1]);
  } else {
    texcoords.push(0, 0);
  }
}

function resolveIndex(token, total) {
  const i = parseInt(token, 10);
  return i > 0 ? i - 1 : total + i; // 1-based; negativos contam do fim
}

function fillFlatNormals(positions, normals) {
  for (let i = 0; i < positions.length; i += 9) {
    const ax = positions[i],     ay = positions[i + 1], az = positions[i + 2];
    const bx = positions[i + 3], by = positions[i + 4], bz = positions[i + 5];
    const cx = positions[i + 6], cy = positions[i + 7], cz = positions[i + 8];

    // Normal = (B - A) × (C - A), normalizada.
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;

    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;

    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;

    normals[i]     = nx; normals[i + 1] = ny; normals[i + 2] = nz;
    normals[i + 3] = nx; normals[i + 4] = ny; normals[i + 5] = nz;
    normals[i + 6] = nx; normals[i + 7] = ny; normals[i + 8] = nz;
  }
}
