import { loadObjModel } from "../loaders/objLoader.js";
import { composeTransform } from "../math/transformations.js";
import { createMaterial } from "../utils/helpers.js";

// Wrapper que adapta um BufferInfo carregado de .obj para a interface usada
// pelo `drawPart` em drawScene.js: { bufferInfo, world, material }.
// Razão: o resto do renderer não precisa saber se a geometria veio de uma
// primitiva da TWGL ou de um arquivo .obj.
export async function createObjModel(gl, url, options = {}) {
  const bufferInfo = await loadObjModel(gl, url);

  const {
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
    color = [1, 1, 1, 1],
    texture = null,
    useTexture = false,
    shininess = 20,
  } = options;

  return {
    bufferInfo,
    world: composeTransform({
      translation: position,
      rotation,
      scale: Array.isArray(scale) ? scale : [scale, scale, scale],
    }),
    material: createMaterial({ color, texture, useTexture, shininess }),
  };
}

export function drawObjModel(gl, programInfo, model, commonUniforms, drawPart) {
  drawPart(
    gl,
    programInfo,
    model.bufferInfo,
    model.world,
    model.material,
    commonUniforms
  );
}
