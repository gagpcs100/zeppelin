import { loadObjModel } from "../loaders/objLoader.js";
import { CONFIG } from "../config.js";
import { composeTransform } from "../math/transformations.js";

// O mundo: um único modelo .obj pronto (cidade Castelia). Carrega o arquivo,
// centra a geometria na origem em X/Z, apoia o ponto mais baixo em Y=0 e
// aplica a escala do config. Devolve { submeshes, world, bounds }, onde
// `bounds` é a caixa envolvente já em coordenadas de mundo — é ela que limita
// o voo do zeppelin (ver collision.js).
export async function createWorld(gl) {
  const cfg = CONFIG.world;
  const { submeshes, bounds } = await loadObjModel(gl, cfg.modelPath, {
    textureDir: cfg.textureDir,
  });

  const s = cfg.scale;
  // Translação que, após a escala, centra X/Z na origem e leva o piso a Y=0.
  const translation = [
    -((bounds.min[0] + bounds.max[0]) / 2) * s,
    -bounds.min[1] * s,
    -((bounds.min[2] + bounds.max[2]) / 2) * s,
  ];

  const world = composeTransform({
    translation,
    rotation: [0, 0, 0],
    scale: [s, s, s],
  });

  // Como a transformação é só escala + translação (sem rotação), a caixa de
  // mundo sai aplicando essas duas operações a cada extremo.
  const worldBounds = {
    min: bounds.min.map((c, i) => c * s + translation[i]),
    max: bounds.max.map((c, i) => c * s + translation[i]),
  };

  return { submeshes, world, bounds: worldBounds };
}

export function drawWorld(gl, programInfo, worldObj, commonUniforms, drawPart) {
  for (const sub of worldObj.submeshes) {
    drawPart(gl, programInfo, sub.bufferInfo, worldObj.world, sub.material, commonUniforms);
  }
}
