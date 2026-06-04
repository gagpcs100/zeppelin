// Colisão simples por caixa envolvente (AABB). O mundo é um único modelo
// .obj; o zeppelin é mantido dentro dos limites horizontais dessa caixa.

// Limita um ponto ao retângulo [min, max] no plano XZ, recuado por `margin`.
// O eixo Y não é tocado (a altura é tratada à parte, por min/maxHeight).
export function clampToBounds(point, bounds, margin = 0) {
  const clampAxis = (value, lo, hi) => {
    const a = lo + margin;
    const b = hi - margin;
    if (a >= b) return (lo + hi) / 2; // caixa menor que a margem: usa o centro
    return Math.min(Math.max(value, a), b);
  };

  return [
    clampAxis(point[0], bounds.min[0], bounds.max[0]),
    point[1],
    clampAxis(point[2], bounds.min[2], bounds.max[2]),
  ];
}

// Constrói um "height field": uma grade 2D no plano XZ (em coordenadas de
// mundo) onde cada célula guarda a altura (Y) do topo da geometria que está
// embaixo dela — telhado de prédio ou chão. É a base da colisão por empurrão
// vertical: o zeppelin não pode ficar abaixo de `altura + folga` no seu XZ.
//
//   positionGroups: array de arrays de posições cruas (x,y,z por vértice, já
//                   trianguladas — 9 floats por triângulo), como o objLoader
//                   devolve em `positions` quando `keepPositions` está ligado.
//   transform:      { scale, translation:[tx,ty,tz] } do mundo (sem rotação).
//   options.cellSize: tamanho de cada célula em unidades de mundo.
//
// Devolve { minX, minZ, cellSize, cols, rows, heights } com `heights` num
// Float32Array de cols*rows, indexado por (row*cols + col). Células sem
// nenhum triângulo ficam em 0 (o chão é apoiado em Y=0 no World).
export function buildHeightField(positionGroups, transform, { cellSize }) {
  const s = transform.scale;
  const [tx, ty, tz] = transform.translation;

  // 1ª passada: extensão (bounding box) em X/Z já em mundo.
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const positions of positionGroups) {
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i] * s + tx;
      const z = positions[i + 2] * s + tz;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
  }

  const cols = Math.max(1, Math.ceil((maxX - minX) / cellSize));
  const rows = Math.max(1, Math.ceil((maxZ - minZ) / cellSize));
  const heights = new Float32Array(cols * rows); // tudo em 0 (chão)

  // 2ª passada: rasteriza cada triângulo. Para cada célula cujo CENTRO cai
  // dentro do triângulo (no plano XZ), guarda o máximo entre a altura atual e
  // o maior Y dos 3 vértices (conservador — telhados levemente "mais altos").
  for (const positions of positionGroups) {
    for (let i = 0; i < positions.length; i += 9) {
      const ax = positions[i] * s + tx,     az = positions[i + 2] * s + tz;
      const bx = positions[i + 3] * s + tx, bz = positions[i + 5] * s + tz;
      const cx = positions[i + 6] * s + tx, cz = positions[i + 8] * s + tz;

      const topY = Math.max(positions[i + 1], positions[i + 4], positions[i + 7]) * s + ty;

      const triMinX = Math.min(ax, bx, cx), triMaxX = Math.max(ax, bx, cx);
      const triMinZ = Math.min(az, bz, cz), triMaxZ = Math.max(az, bz, cz);

      const colLo = Math.max(0, Math.floor((triMinX - minX) / cellSize));
      const colHi = Math.min(cols - 1, Math.floor((triMaxX - minX) / cellSize));
      const rowLo = Math.max(0, Math.floor((triMinZ - minZ) / cellSize));
      const rowHi = Math.min(rows - 1, Math.floor((triMaxZ - minZ) / cellSize));

      for (let r = rowLo; r <= rowHi; r++) {
        const pz = minZ + (r + 0.5) * cellSize; // centro da célula em Z
        for (let c = colLo; c <= colHi; c++) {
          const px = minX + (c + 0.5) * cellSize; // centro da célula em X
          if (pointInTriangleXZ(px, pz, ax, az, bx, bz, cx, cz)) {
            const idx = r * cols + c;
            if (topY > heights[idx]) heights[idx] = topY;
          }
        }
      }
    }
  }

  removeSpikes(heights, cols, rows, SPIKE_THRESHOLD);

  return { minX, minZ, cellSize, cols, rows, heights };
}

// Folga (em unidades de mundo) acima da qual uma célula isolada — mais alta que
// TODAS as 4 vizinhas — é considerada artefato (antena/poste fino capturado
// pela grade) e não prédio. Prédios reais ocupam várias células, então têm
// vizinhas igualmente altas e não são tocados.
const SPIKE_THRESHOLD = 25;

// Remove "picos fantasma": células isoladas muito mais altas que toda a
// vizinhança imediata. Sem isso, uma antena de 1 célula empurra o zeppelin para
// cima como se houvesse um prédio invisível ali. Trabalha sobre uma cópia para
// não depender da ordem de varredura, rebaixando o pico à vizinha mais alta.
function removeSpikes(heights, cols, rows, threshold) {
  const src = heights.slice();
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      const idx = r * cols + c;
      const h = src[idx];
      const maxNeighbor = Math.max(
        src[idx - 1], src[idx + 1], src[idx - cols], src[idx + cols]
      );
      if (h - maxNeighbor > threshold) heights[idx] = maxNeighbor;
    }
  }
}

// Teste ponto-em-triângulo no plano XZ por coordenadas baricêntricas (sinais).
function pointInTriangleXZ(px, pz, ax, az, bx, bz, cx, cz) {
  const d1 = sign(px, pz, ax, az, bx, bz);
  const d2 = sign(px, pz, bx, bz, cx, cz);
  const d3 = sign(px, pz, cx, cz, ax, az);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos); // dentro quando todos têm o mesmo sinal (ou 0)
}

function sign(px, pz, ax, az, bx, bz) {
  return (px - bx) * (az - bz) - (ax - bx) * (pz - bz);
}

// Altura da superfície (Y de mundo) sob o ponto (x,z), com interpolação
// bilinear entre as 4 células vizinhas — isso dá uma rampa suave nas bordas
// dos prédios em vez de um degrau. Pontos fora da grade devolvem o chão (0).
export function surfaceHeightAt(heightField, x, z) {
  const { minX, minZ, cellSize, cols, rows, heights } = heightField;

  // Coordenada contínua em células, ancorada nos CENTROS das células.
  const fx = (x - minX) / cellSize - 0.5;
  const fz = (z - minZ) / cellSize - 0.5;

  const c0 = Math.floor(fx);
  const r0 = Math.floor(fz);
  const tx = fx - c0;
  const tz = fz - r0;

  // Amostra uma célula, tratando fora-da-grade como chão (0).
  const at = (c, r) => {
    if (c < 0 || c >= cols || r < 0 || r >= rows) return 0;
    return heights[r * cols + c];
  };

  const h00 = at(c0, r0);
  const h10 = at(c0 + 1, r0);
  const h01 = at(c0, r0 + 1);
  const h11 = at(c0 + 1, r0 + 1);

  const top = h00 * (1 - tx) + h10 * tx;
  const bot = h01 * (1 - tx) + h11 * tx;
  return top * (1 - tz) + bot * tz;
}

// Colisão "mais detalhada": como o corpo do zeppelin é alongado, amostrar só o
// centro deixa o nariz entrar no prédio antes de o centro perceber. Esta função
// amostra a altura em vários pontos do corpo e devolve a MAIOR — assim a folga
// é calculada contra a parte mais alta sob qualquer ponto do zeppelin.
//   heading: proa do zeppelin (rotationY). A "frente" no plano XZ é
//            (cos, -sin), igual ao vetor usado na física.
//   samples: lista de offsets [frente, lado] em unidades de mundo, no
//            referencial do corpo (frente = +eixo de avanço; lado = lateral).
export function maxSurfaceHeightAt(heightField, x, z, heading, samples) {
  const fx = Math.cos(heading), fz = -Math.sin(heading); // frente (avanço)
  const lx = -fz, lz = fx;                                // lateral (perpendicular)

  let maxH = 0;
  for (const [forward, side] of samples) {
    const px = x + fx * forward + lx * side;
    const pz = z + fz * forward + lz * side;
    const h = surfaceHeightAt(heightField, px, pz);
    if (h > maxH) maxH = h;
  }
  return maxH;
}

// Move (x,z) por (dx,dz) tratando os prédios como sólidos: o corpo do zeppelin
// não entra num prédio cujo telhado esteja acima de `y - clearance`. Resolve X
// e Z SEPARADAMENTE — assim uma batida de viés mantém a componente paralela
// (desliza pela parede) e só barra a que entraria no prédio. Se o zeppelin está
// alto o bastante (telhado abaixo de y - clearance), passa por cima livremente.
//   heading/samples: mesmos do maxSurfaceHeightAt (cobrem nariz, cauda, laterais).
// Devolve a nova posição [x, z].
export function slideAgainstBuildings(heightField, x, z, dx, dz, y, heading, samples, clearance) {
  const blockLevel = y - clearance;

  let nx = x + dx;
  if (maxSurfaceHeightAt(heightField, nx, z, heading, samples) > blockLevel) {
    nx = x; // bater na parede no eixo X → cancela só o avanço em X
  }

  let nz = z + dz;
  if (maxSurfaceHeightAt(heightField, nx, nz, heading, samples) > blockLevel) {
    nz = z; // idem no eixo Z, já considerando o X resolvido
  }

  return [nx, nz];
}
