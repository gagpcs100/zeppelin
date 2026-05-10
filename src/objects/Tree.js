import * as twgl from "twgl.js";
import { composeTransform, multiply } from "../math/transformations.js";
import { createMaterial } from "../utils/helpers.js";

export function createTree(gl, textures, position, scale = 1) {
  return {
    position,
    scale,
    parts: [
      {
        // Tronco
        bufferInfo: twgl.primitives.createCylinderBufferInfo(
          gl,
          0.35 * scale, // raio
          2.2 * scale,  // altura
          12,           // divisões ao redor
          1,
          true,
          true
        ),
        local: composeTransform({
          translation: [0, 1.1 * scale, 0],
        }),
        material: createMaterial({
          color: [0.45, 0.28, 0.12, 1],
          texture: textures.wood,
          useTexture: true,
          shininess: 8,
        }),
      },
      {
        // Copa da árvore
        bufferInfo: twgl.primitives.createSphereBufferInfo(gl, 1.4 * scale, 16, 8),
        local: composeTransform({
          translation: [0, 2.8 * scale, 0],
          scale: [1, 1.2, 1],
        }),
        material: createMaterial({
          color: [0.1, 0.45, 0.15, 1],
          texture: textures.leaves,
          useTexture: true,
          shininess: 6,
        }),
      },
    ],
  };
}

export function drawTree(gl, programInfo, tree, commonUniforms, drawPart) {
  const base = composeTransform({
    translation: tree.position,
  });

  for (const part of tree.parts) {
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
