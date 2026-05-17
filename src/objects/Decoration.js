import { composeTransform } from "../math/transformations.js";

// Objeto decorativo: instância de um GLTF posicionada e escalada.
// Sem lógica de update — fica parado no mundo.
export function createDecoration(gltfModel, { position, scale = 1, rotationY = 0 }) {
  return {
    parts: gltfModel.parts,
    world: composeTransform({
      translation: position,
      rotation: [0, rotationY, 0],
      scale: [scale, scale, scale],
    }),
  };
}

export function drawDecoration(gl, programInfo, deco, commonUniforms, drawPart) {
  for (const part of deco.parts) {
    drawPart(gl, programInfo, part.bufferInfo, deco.world, part.material, commonUniforms);
  }
}
