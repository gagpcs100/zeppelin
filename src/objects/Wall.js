import * as twgl from "twgl.js";
import { composeTransform } from "../math/transformations.js";
import { createMaterial } from "../utils/helpers.js";

// Cria uma muralha como um cilindro vertical SEM tampas (aberta em cima e embaixo).
// O draw desabilita o face culling para a parede aparecer por dentro e por fora.
export function createWall(gl, textures, { radius, height, color }) {
  const bufferInfo = twgl.primitives.createTruncatedConeBufferInfo(
    gl,
    radius,   // raio inferior
    radius,   // raio superior (igual = cilindro reto)
    height,   // altura
    64,       // segments radiais — suaviza o círculo
    1,        // segments verticais
    false,    // sem topCap — aberta em cima
    false     // sem bottomCap — aberta embaixo
  );

  return {
    radius,
    height,
    bufferInfo,
    // O cilindro do twgl é centrado na origem em Y; subimos metade da altura
    // para que a base fique no chão (y=0).
    world: composeTransform({
      translation: [0, height / 2, 0],
    }),
    material: createMaterial({
      color,
      texture: textures.wall,
      useTexture: true,
      shininess: 8,
    }),
  };
}

export function drawWall(gl, programInfo, wall, commonUniforms, drawPart) {
  // Parede precisa ser visível por dentro também.
  gl.disable(gl.CULL_FACE);
  drawPart(gl, programInfo, wall.bufferInfo, wall.world, wall.material, commonUniforms);
  gl.enable(gl.CULL_FACE);
}
