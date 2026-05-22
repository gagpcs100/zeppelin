import * as twgl from "twgl.js";
import { parseMtl } from "./mtlParser.js";
import { createMaterial } from "../utils/helpers.js";

// Resolve um caminho de asset da pasta public/ levando em conta o `base` do
// Vite (ex.: "/zeppelin/"). Um fetch em runtime NÃO passa pela reescrita de
// caminhos do Vite, então um caminho absoluto "/models/..." cairia fora do
// base e daria 404. `base` é injetável para teste; em runtime usa o valor
// configurado (`import.meta.env.BASE_URL`).
export function resolveAssetUrl(path, base = import.meta.env.BASE_URL) {
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith("/") ? path : "/" + path;
  return cleanBase + cleanPath;
}

// Carrega um .obj e, se houver, seu .mtl companheiro. Devolve:
//   { submeshes: [{ bufferInfo, material }], bounds: { min:[x,y,z], max:[x,y,z] } }
// `bounds` é a caixa envolvente da geometria crua (antes de qualquer
// transformação), útil para enquadrar e para colisão.
//   options.textureDir  diretório das texturas (default: diretório do .obj).
//                        Útil quando o .mtl referencia texturas que estão em
//                        uma subpasta diferente. O caminho do .mtl é reduzido
//                        ao nome do arquivo (basename), ignorando subpastas.
export async function loadObjModel(gl, url, options = {}) {
  // Resolve o URL contra o base do Vite — o .mtl e as texturas são buscados
  // relativos a este diretório, então o ajuste se propaga para todos.
  const fullUrl = resolveAssetUrl(url);
  const response = await fetch(encodeURI(fullUrl));
  if (!response.ok) throw new Error(`Erro ao carregar OBJ: ${url}`);

  const text = await response.text();
  const { mtllib, groups } = parseObj(text);

  const baseDir = fullUrl.slice(0, fullUrl.lastIndexOf("/") + 1);
  let textureDir = baseDir;
  if (options.textureDir) {
    const resolved = resolveAssetUrl(options.textureDir);
    textureDir = resolved.endsWith("/") ? resolved : resolved + "/";
  }

  // Carrega o .mtl, se declarado. Falha de .mtl não é fatal: seguimos com
  // materiais padrão (cinza sem textura).
  let mtl = {};
  if (mtllib) {
    try {
      const mtlResponse = await fetch(encodeURI(baseDir + mtllib));
      if (mtlResponse.ok) mtl = parseMtl(await mtlResponse.text());
    } catch (error) {
      console.warn(`Falha ao carregar .mtl de ${url}:`, error);
    }
  }

  const submeshes = [];
  const textureCache = new Map(); // nome do arquivo → textura (evita recarga)
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const group of groups) {
    if (group.positions.length === 0) continue;

    for (let i = 0; i < group.positions.length; i += 3) {
      for (let a = 0; a < 3; a++) {
        const c = group.positions[i + a];
        if (c < min[a]) min[a] = c;
        if (c > max[a]) max[a] = c;
      }
    }

    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: { numComponents: 3, data: group.positions },
      normal: { numComponents: 3, data: group.normals },
      texcoord: { numComponents: 2, data: group.texcoords },
    });

    const def = group.material ? mtl[group.material] : null;
    let texture = null;
    if (def && def.map) {
      // O .mtl pode prefixar a textura com uma subpasta (ex.: "Castelia
      // City/x.jpg"); só o nome do arquivo importa — `textureDir` resolve.
      const mapName = def.map.split(/[/\\]/).pop();
      texture = textureCache.get(mapName);
      if (!texture) {
        texture = twgl.createTexture(gl, {
          src: encodeURI(textureDir + mapName),
          flipY: true,
          // Mipmaps: sem eles, texturas que repetem muitas vezes (ex.: a
          // água do oceano, tilada ~144×327) viram moiré ao serem vistas de
          // longe. O WebGL2 gera mipmaps mesmo para texturas non-power-of-2.
          min: gl.LINEAR_MIPMAP_LINEAR,
          mag: gl.LINEAR,
          wrap: gl.REPEAT,
        });
        textureCache.set(mapName, texture);
      }
    }

    submeshes.push({
      bufferInfo,
      material: createMaterial({
        color: def ? [...def.diffuse, def.opacity] : [0.7, 0.7, 0.7, 1],
        specular: def ? [...def.specular, 1] : [1, 1, 1, 1],
        shininess: def ? def.shininess : 20,
        texture,
        useTexture: texture !== null,
      }),
    });
  }

  if (submeshes.length === 0) throw new Error(`OBJ sem geometria: ${url}`);
  return { submeshes, bounds: { min, max } };
}

// Faz o parse do texto de um .obj. Devolve:
//   { mtllib: string|null, groups: [{ material, positions, normals, texcoords }] }
// Cada grupo corresponde a um material distinto (usemtl). Se o arquivo não
// usa materiais, há um único grupo com material = null.
export function parseObj(text) {
  const v = [];   // posições brutas do arquivo
  const vt = [];  // texcoords brutos
  const vn = [];  // normais brutas

  let mtllib = null;
  const groups = [];
  const groupByMaterial = new Map(); // material → grupo (funde reaparições)
  let current = null; // grupo sendo preenchido

  // Garante que existe um grupo ativo antes de emitir vértices. Há UM grupo
  // por material: se o material já apareceu, reaproveita o grupo existente.
  // Exportadores (ex.: SketchUp) costumam intercalar `usemtl` — sem essa
  // fusão, um modelo grande viraria milhares de grupos (e de texturas).
  function ensureGroup(material) {
    if (current && current.material === material) return;
    let group = groupByMaterial.get(material);
    if (!group) {
      group = { material, positions: [], normals: [], texcoords: [] };
      groupByMaterial.set(material, group);
      groups.push(group);
    }
    current = group;
  }

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) continue;

    const parts = line.split(/\s+/);
    const head = parts[0];

    if (head === "mtllib") {
      // Nome pode ter espaços — pega tudo depois do "mtllib ".
      mtllib = line.slice(line.indexOf(" ") + 1).trim();
    } else if (head === "usemtl") {
      ensureGroup(line.slice(line.indexOf(" ") + 1).trim());
    } else if (head === "v") {
      v.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
    } else if (head === "vt") {
      vt.push(parseFloat(parts[1]), parseFloat(parts[2]));
    } else if (head === "vn") {
      vn.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
    } else if (head === "f") {
      if (!current) ensureGroup(null);
      const verts = parts.slice(1);
      for (let i = 1; i < verts.length - 1; i++) {
        emitVertex(verts[0], v, vt, vn, current.positions, current.normals, current.texcoords);
        emitVertex(verts[i], v, vt, vn, current.positions, current.normals, current.texcoords);
        emitVertex(verts[i + 1], v, vt, vn, current.positions, current.normals, current.texcoords);
      }
    }
  }

  if (groups.length === 0) groups.push({ material: null, positions: [], normals: [], texcoords: [] });

  // Pós-processamento por grupo: normais flat de fallback e texcoords ausentes.
  const hadNormals = vn.length > 0;
  for (const g of groups) {
    if (!hadNormals) fillFlatNormals(g.positions, g.normals);
    if (g.texcoords.length !== (g.positions.length / 3) * 2) {
      g.texcoords.length = 0;
      for (let i = 0; i < g.positions.length / 3; i++) g.texcoords.push(0, 0);
    }
  }

  return { mtllib, groups };
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
