import * as twgl from "twgl.js";
import { composeTransform, multiply } from "../math/transformations.js";
import { createMaterial } from "../utils/helpers.js";

export function createPropeller(gl, textures) {
  const blade = twgl.primitives.createCubeBufferInfo(gl, 1);
  const hub = twgl.primitives.createSphereBufferInfo(gl, 0.35, 12, 8);

  return {
    angle: 0,
    parts: [
      {
        bufferInfo: blade,
        local: composeTransform({
          scale: [0.25, 3.4, 0.08],
        }),
        material: createMaterial({
          color: [0.1, 0.1, 0.1, 1],
          texture: textures.black,
          useTexture: true,
          shininess: 40,
        }),
      },
      {
        bufferInfo: blade,
        local: composeTransform({
          rotation: [0, 0, Math.PI / 2],
          scale: [0.25, 3.4, 0.08],
        }),
        material: createMaterial({
          color: [0.1, 0.1, 0.1, 1],
          texture: textures.black,
          useTexture: true,
          shininess: 40,
        }),
      },
      {
        bufferInfo: hub,
        local: composeTransform({
          scale: [1, 1, 1],
        }),
        material: createMaterial({
          color: [0.8, 0.8, 0.8, 1],
          texture: textures.metal,
          useTexture: true,
          shininess: 60,
        }),
      },
    ],
  };
}

export function drawPropeller(gl, programInfo, propeller, parentWorld, commonUniforms, drawPart) {
  const spinningBase = multiply(
    parentWorld,
    composeTransform({
      rotation: [0, 0, propeller.angle],
    })
  );

  for (const part of propeller.parts) {
    const world = multiply(spinningBase, part.local);
    drawPart(gl, programInfo, part.bufferInfo, world, part.material, commonUniforms);
  }
}
