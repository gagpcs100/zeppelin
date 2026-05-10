import * as twgl from "twgl.js";
import { composeTransform, multiply } from "../math/transformations.js";
import { createMaterial } from "../utils/helpers.js";

export function createHouse(gl, textures, position, scale = 1) {
  return {
    position,
    scale,
    parts: [
      {
        // Corpo da casa
        bufferInfo: twgl.primitives.createCubeBufferInfo(gl, 1),
        local: composeTransform({
          translation: [0, 1, 0],
          scale: [3 * scale, 2 * scale, 3 * scale],
        }),
        material: createMaterial({
          color: [0.85, 0.8, 0.65, 1],
          texture: textures.wall,
          useTexture: true,
          shininess: 12,
        }),
      },
      {
        // Telhado em formato de pirâmide/cone de 4 lados
        bufferInfo: twgl.primitives.createTruncatedConeBufferInfo(
          gl,
          2.2 * scale, // raio da base
          0,           // raio do topo, 0 para virar cone
          1.5 * scale, // altura
          4,           // 4 lados para parecer telhado de casa
          1,
          true,
          true
        ),
        local: composeTransform({
          translation: [0, 2.75 * scale, 0],
          rotation: [0, Math.PI / 4, 0],
          scale: [1.25, 1, 1.25],
        }),
        material: createMaterial({
          color: [0.75, 0.2, 0.15, 1],
          texture: textures.roof,
          useTexture: true,
          shininess: 15,
        }),
      },
    ],
  };
}

export function drawHouse(gl, programInfo, house, commonUniforms, drawPart) {
  const base = composeTransform({
    translation: house.position,
  });

  for (const part of house.parts) {
    drawPart(
      gl,
      programInfo,
      part.bufferInfo,
      multiply(base, part.local),
      part.material,
      commonUniforms
    );
  }
}
