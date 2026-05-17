import * as twgl from "twgl.js";
import { loadModel } from "webgl-gltf";

// Wrapper fino sobre webgl-gltf. Adapta a saída para a interface
// { parts: [{ bufferInfo, material }], nodes, bbox } usada pelo restante do
// projeto. Isola a biblioteca: se for trocada, só este arquivo muda.
//
// Estrutura observada da saída de webgl-gltf (`loadModel(gl, uri)` → `Model`):
//   Model {
//     name: string,
//     rootNode: number,                 // índice em nodes[]
//     meshes: Mesh[],                   // 1 mesh = 1 primitive (a lib usa
//                                       // apenas mesh.primitives[0] do glTF)
//     nodes: Node[],
//     materials: Material[],
//     skins: Skin[],
//     animations: { [name]: Channel },
//   }
//
//   Mesh {
//     elementCount: number,             // count para drawElements/drawArrays
//     indices: WebGLBuffer | null,      // já uploaded; componentType (UNSIGNED_BYTE/SHORT/INT) não exposto — detectamos do byteSize
//     positions: GLBuffer,              // { buffer: WebGLBuffer, size, type }
//     normals:   GLBuffer | null,
//     tangents:  GLBuffer | null,
//     texCoord:  GLBuffer | null,       // (atenção: nome é "texCoord", singular)
//     joints:    GLBuffer | null,
//     weights:   GLBuffer | null,
//     material:  number,                // índice em materials[] (pode ser undefined)
//   }
//
//   GLBuffer { buffer: WebGLBuffer, size: number /* numComponents */,
//              type: number /* BufferType.Float=5126 ou Short=5123 */ }
//
//   Node { id, name, children: number[], localBindTransform: mat4,
//          mesh?: number, skin?: number }
//
//   Material {
//     baseColorTexture: WebGLTexture | null,
//     baseColorFactor:  vec4,                   // gl-matrix Float32Array(4)
//     metallicRoughnessTexture, metallicFactor, roughnessFactor,
//     emissiveTexture, emissiveFactor,
//     normalTexture, occlusionTexture,
//   }
//
// CONSEQUÊNCIAS p/ o wrapper:
//   - Geometria já está em WebGLBuffer (não há Float32Array exposta no Model).
//     Por isso construímos BufferInfo manualmente via AttribInfo, e não com
//     `createBufferInfoFromArrays`.
//   - Para obter a bbox real, lemos o buffer de posições de volta da GPU com
//     `gl.getBufferSubData` (WebGL2) no momento do load. Guardamos o
//     Float32Array resultante em `parts[i].positions` — usado por `computeBBox`
//     e disponível para qualquer consumidor que precise dos vértices brutos.
//   - `mesh.material` é um índice; resolvemos para o objeto em buildParts.
//   - Cada Mesh do webgl-gltf é uma única primitive (a lib ignora o resto).

export async function loadGltf(gl, url) {
  const raw = await loadModel(gl, url);

  const parts = buildParts(gl, raw);
  const nodes = buildNodes(raw, parts);
  const bbox = computeBBox(parts);

  return { parts, nodes, bbox };
}

function buildParts(gl, raw) {
  const parts = [];
  const materials = raw.materials ?? [];

  for (const mesh of raw.meshes ?? []) {
    const attribs = {};

    // mesh.elementCount é a contagem de ÍNDICES (não de vértices) quando o
    // mesh é indexado — ver webgl-gltf/dist/gltf.js:152. Para dimensionar
    // buffers fallback (normais/uvs ausentes) precisamos do nº real de
    // vértices, que derivamos do tamanho em bytes do buffer de posições.
    // Sem posições, caímos em elementCount: caso degenerado, modelo não
    // renderiza de qualquer forma.
    const vertexCount = mesh.positions
      ? getVertexCount(gl, mesh.positions)
      : mesh.elementCount;

    if (mesh.positions) {
      attribs.position = glBufferToAttrib(gl, mesh.positions);
    }

    if (mesh.normals) {
      attribs.normal = glBufferToAttrib(gl, mesh.normals);
    } else {
      // Sem normais no glTF: vertex shader phong vai precisar de algo.
      // Criamos um buffer constante apontando para cima por enquanto. Para
      // sombreamento correto, o modelo deveria vir com normais — esse
      // fallback existe só para não quebrar o pipeline.
      attribs.normal = makeConstantAttrib(gl, vertexCount, [0, 1, 0]);
    }

    if (mesh.texCoord) {
      attribs.texcoord = glBufferToAttrib(gl, mesh.texCoord);
    } else {
      attribs.texcoord = makeConstantAttrib(gl, vertexCount, [0, 0]);
    }

    const bufferInfo = {
      numElements: mesh.elementCount,
      attribs,
    };

    if (mesh.indices) {
      bufferInfo.indices = mesh.indices;
      // webgl-gltf não expõe o componentType do índice; glTF 2.0 permite
      // UNSIGNED_BYTE/SHORT/INT. Detectamos qual é a partir da razão entre
      // o tamanho em bytes do buffer e o elementCount (modelos com >65k
      // vértices usam UNSIGNED_INT, por exemplo).
      bufferInfo.elementType = detectIndexType(gl, mesh.indices, mesh.elementCount);
    }

    const rawMaterial = typeof mesh.material === "number" ? materials[mesh.material] : null;
    const material = {
      color: rawMaterial?.baseColorFactor
        ? [
            rawMaterial.baseColorFactor[0],
            rawMaterial.baseColorFactor[1],
            rawMaterial.baseColorFactor[2],
            rawMaterial.baseColorFactor[3],
          ]
        : [1, 1, 1, 1],
      specular: [1, 1, 1, 1],
      shininess: 16,
      texture: rawMaterial?.baseColorTexture ?? null,
      useTexture: !!rawMaterial?.baseColorTexture,
      texScale: 1,
    };

    // Lê as posições de volta da GPU para que `computeBBox` (e qualquer outro
    // consumidor que precise dos vértices brutos) tenha acesso. Custo: 1
    // round-trip GPU→CPU por mesh, só no load. webgl-gltf não expõe os arrays
    // originais — esta é a forma WebGL2 de recuperá-los.
    const positions = mesh.positions ? readPositionsFromGLBuffer(gl, mesh.positions) : null;
    parts.push({ bufferInfo, material, positions });
  }

  return parts;
}

function readPositionsFromGLBuffer(gl, glBuffer) {
  // glBuffer = { buffer: WebGLBuffer, size: numComponents, type: componentType }
  // Em vez de calcular o tamanho a partir de `size` (que é o nº de componentes
  // por vértice — 3 para VEC3, e não nos dá a contagem de vértices), pedimos
  // o tamanho real do buffer em bytes via WebGL2. Mais robusto e independente
  // de como webgl-gltf interpreta os campos.
  gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer.buffer);
  const byteSize = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE);
  const out = new Float32Array(byteSize / 4);
  gl.getBufferSubData(gl.ARRAY_BUFFER, 0, out);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return out;
}

function getVertexCount(gl, positionsGLBuffer) {
  // Conta vértices a partir do tamanho do buffer de posições. Position é
  // sempre vec3 float (4 bytes * 3 componentes = 12 bytes por vértice).
  if (!positionsGLBuffer) return 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, positionsGLBuffer.buffer);
  const byteSize = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return byteSize / (4 * 3);
}

function detectIndexType(gl, indicesBuffer, elementCount) {
  // Deduz o componentType do índice pelo nº de bytes por índice
  // (byteSize / elementCount). webgl-gltf não expõe esse campo.
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
  const byteSize = gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  const bytesPerIndex = byteSize / elementCount;
  if (bytesPerIndex === 1) return gl.UNSIGNED_BYTE;
  if (bytesPerIndex === 2) return gl.UNSIGNED_SHORT;
  if (bytesPerIndex === 4) return gl.UNSIGNED_INT;
  throw new Error(
    `Unexpected bytes per index: ${bytesPerIndex} (byteSize=${byteSize}, elementCount=${elementCount})`,
  );
}

function glBufferToAttrib(gl, glBuffer) {
  // GLBuffer { buffer, size, type } — `type` é o componentType glTF
  // (5126 FLOAT, 5123 UNSIGNED_SHORT). Para attribs de vértice o normal é
  // FLOAT; mapeamos para o enum WebGL correspondente.
  const componentType = glBuffer.type === 5123 ? gl.UNSIGNED_SHORT : gl.FLOAT;
  return {
    buffer: glBuffer.buffer,
    numComponents: glBuffer.size,
    type: componentType,
    normalize: false,
    offset: 0,
    stride: 0,
  };
}

function makeConstantAttrib(gl, vertexCount, perVertex) {
  // Cria um buffer dummy preenchido com `perVertex` repetido para que o
  // shader receba algo válido. Usado quando o glTF não tem normais ou uvs.
  // IMPORTANTE: dimensionar por nº de vértices (não de índices), senão o
  // VAO/draw indexado lê fora dos limites.
  const comps = perVertex.length;
  const data = new Float32Array(vertexCount * comps);
  for (let i = 0; i < vertexCount; i++) {
    for (let j = 0; j < comps; j++) {
      data[i * comps + j] = perVertex[j];
    }
  }
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return {
    buffer,
    numComponents: comps,
    type: gl.FLOAT,
    normalize: false,
    offset: 0,
    stride: 0,
  };
}

function buildNodes(raw, parts) {
  // No webgl-gltf cada Mesh é uma única primitive, então o mapeamento
  // node→parts é direto: se o nó referencia uma mesh, ele tem 1 part
  // (a part de índice mesh.index). Nós sem mesh ficam com partIndices vazio
  // (são puramente hierárquicos / transform-only).
  const nodes = [];
  for (const node of raw.nodes ?? []) {
    const partIndices =
      typeof node.mesh === "number" && node.mesh >= 0 && node.mesh < parts.length
        ? [node.mesh]
        : [];
    nodes.push({
      name: node.name ?? `node_${nodes.length}`,
      partIndices,
      children: node.children ?? [],
      localBindTransform: node.localBindTransform ?? null,
    });
  }
  return nodes;
}

function computeBBox(parts) {
  // Itera sobre as posições brutas lidas da GPU em buildParts. Ignoramos o
  // localTransform do nó: assumimos que o modelo está autorizado a ser
  // tratado em seu espaço local (a muralha, por exemplo, é tipicamente
  // modelada centrada na origem). Quem precisar de bbox no espaço de mundo
  // pode aplicar a transformação por fora.
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];

  for (const part of parts) {
    const p = part.positions;
    if (!p) continue;

    for (let i = 0; i < p.length; i += 3) {
      if (p[i]     < min[0]) min[0] = p[i];
      if (p[i + 1] < min[1]) min[1] = p[i + 1];
      if (p[i + 2] < min[2]) min[2] = p[i + 2];
      if (p[i]     > max[0]) max[0] = p[i];
      if (p[i + 1] > max[1]) max[1] = p[i + 1];
      if (p[i + 2] > max[2]) max[2] = p[i + 2];
    }
  }

  if (min[0] === Infinity) {
    return { min: [0, 0, 0], max: [0, 0, 0] };
  }
  return { min, max };
}
