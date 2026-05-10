import * as twgl from "twgl.js";
import { composeTransform } from "../math/transformations.js";
import { createMaterial } from "../utils/helpers.js";

export function createRoad(gl, textures, length, width, position, rotationY = 0) {
  const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);

  return {
    bufferInfo,
    world: composeTransform({
      translation: position,
      rotation: [0, rotationY, 0],
      scale: [width, 0.08, length],
    }),
    material: createMaterial({
      color: [0.18, 0.18, 0.18, 1],
      texture: textures.road,
      useTexture: true,
      shininess: 10,
    }),
  };
}
