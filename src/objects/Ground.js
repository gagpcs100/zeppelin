import * as twgl from "twgl.js";
import { composeTransform } from "../math/transformations.js";
import { createMaterial } from "../utils/helpers.js";

export function createGround(gl, textures, size) {
  const bufferInfo = twgl.primitives.createPlaneBufferInfo(gl, size, size, 1, 1);

  return {
    bufferInfo,
    world: composeTransform({
      translation: [0, 0, 0],
    }),
    material: createMaterial({
      color: [0.55, 0.9, 0.45, 1],
      texture: textures.grass,
      useTexture: true,
      shininess: 8,
    }),
  };
}
