import * as twgl from "twgl.js";
import { CONFIG } from "../config.js";
import { composeTransform, multiply } from "../math/transformations.js";
import { createMaterial, clamp } from "../utils/helpers.js";
import { createPropeller, drawPropeller } from "./Propeller.js";

export function createZeppelin(gl, textures) {
  const body = twgl.primitives.createSphereBufferInfo(gl, 1, 32, 16);
  const cube = twgl.primitives.createCubeBufferInfo(gl, 1);
  const fin = twgl.primitives.createCubeBufferInfo(gl, 1);

  return {
    position: [...CONFIG.zeppelin.startPosition],
    rotationY: 0,
    propeller: createPropeller(gl, textures),

    parts: {
      body: {
        bufferInfo: body,
        local: composeTransform({
          scale: [5.5, 1.5, 1.5],
        }),
        material: createMaterial({
          color: [0.62, 0.62, 0.58, 1],
          texture: textures.metal,
          useTexture: true,
          shininess: 35,
        }),
      },

      cabin: {
        bufferInfo: cube,
        local: composeTransform({
          translation: [0.3, -1.35, 0],
          scale: [1.8, 0.65, 0.9],
        }),
        material: createMaterial({
          color: [0.35, 0.55, 0.75, 1],
          texture: textures.glass,
          useTexture: true,
          shininess: 80,
        }),
      },

      tailFinTop: {
        bufferInfo: fin,
        local: composeTransform({
          translation: [-5.2, 0.8, 0],
          scale: [0.25, 1.1, 0.12],
        }),
        material: createMaterial({
          color: [0.75, 0.05, 0.08, 1],
          texture: textures.red,
          useTexture: true,
          shininess: 25,
        }),
      },

      tailFinSide: {
        bufferInfo: fin,
        local: composeTransform({
          translation: [-5.2, 0, 0.85],
          scale: [0.25, 0.12, 1.1],
        }),
        material: createMaterial({
          color: [0.75, 0.05, 0.08, 1],
          texture: textures.red,
          useTexture: true,
          shininess: 25,
        }),
      },
    },
  };
}

export function updateZeppelin(zeppelin, input, deltaTime) {
  const keys = input.keys;

  if (keys.has("KeyA") || keys.has("ArrowLeft")) {
    zeppelin.rotationY += CONFIG.zeppelin.turnSpeed * deltaTime;
  }

  if (keys.has("KeyD") || keys.has("ArrowRight")) {
    zeppelin.rotationY -= CONFIG.zeppelin.turnSpeed * deltaTime;
  }

  // O zeppelin foi modelado apontando para o eixo X.
  // Por isso a frente dele é baseada em cos/sin no eixo X/Z.
  const forward = [
    -Math.cos(zeppelin.rotationY),
    0,
    Math.sin(zeppelin.rotationY),
  ];

  if (keys.has("KeyW") || keys.has("ArrowUp")) {
    zeppelin.position[0] += forward[0] * CONFIG.zeppelin.speed * deltaTime;
    zeppelin.position[2] += forward[2] * CONFIG.zeppelin.speed * deltaTime;
  }

  if (keys.has("KeyS") || keys.has("ArrowDown")) {
    zeppelin.position[0] -= forward[0] * CONFIG.zeppelin.speed * deltaTime;
    zeppelin.position[2] -= forward[2] * CONFIG.zeppelin.speed * deltaTime;
  }

  if (keys.has("KeyQ")) {
    zeppelin.position[1] += CONFIG.zeppelin.verticalSpeed * deltaTime;
  }

  if (keys.has("KeyE")) {
    zeppelin.position[1] -= CONFIG.zeppelin.verticalSpeed * deltaTime;
  }

  zeppelin.position[1] = clamp(zeppelin.position[1], 5, 45);
  zeppelin.propeller.angle += CONFIG.zeppelin.propellerSpeed * deltaTime;
}

export function drawZeppelin(gl, programInfo, zeppelin, commonUniforms, drawPart) {
  const baseWorld = composeTransform({
    translation: zeppelin.position,
    rotation: [0, zeppelin.rotationY, 0],
  });

  for (const part of Object.values(zeppelin.parts)) {
    const world = multiply(baseWorld, part.local);
    drawPart(gl, programInfo, part.bufferInfo, world, part.material, commonUniforms);
  }

  const propellerWorld = multiply(
    baseWorld,
    composeTransform({
      translation: [5.85, 0, 0],
      rotation: [0, Math.PI / 2, 0],
      scale: [0.55, 0.55, 0.55],
    })
  );

  drawPropeller(gl, programInfo, zeppelin.propeller, propellerWorld, commonUniforms, drawPart);
}
