import * as twgl from "twgl.js";
import { composeTransform } from "../math/transformations.js";
import { createMaterial, clamp } from "../utils/helpers.js";
import { surfaceHeightAt } from "../utils/collision.js";

// Calcula onde e como desenhar o blob shadow a partir da posição do zeppelin e
// da superfície embaixo dele (sem chamadas WebGL).
//   position: assentada na superfície sob o zeppelin (+ epsilon).
//   size:     cresce com a altura acima da superfície (satura em maxSize).
//   alpha:    diminui com a altura (some quando muito alto).
export function shadowPlacement(zeppelin, heightField, cfg) {
  const x = zeppelin.position[0];
  const z = zeppelin.position[2];
  const surface = surfaceHeightAt(heightField, x, z);
  const height = Math.max(0, zeppelin.position[1] - surface);

  const size = clamp(cfg.baseSize + height * 0.15, cfg.baseSize, cfg.maxSize);
  const alpha = cfg.baseAlpha * clamp(1 - height / 180, 0.1, 1);

  return { position: [x, surface + cfg.epsilon, z], size, alpha };
}

// Cria o disco (plano XZ unitário, normal +Y) e a textura radial (gradiente
// branco→transparente) que dá a borda suave.
export function createShadow(gl) {
  const plane = twgl.primitives.createPlaneBufferInfo(gl, 1, 1);

  const sizePx = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = sizePx;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(
    sizePx / 2, sizePx / 2, 0, sizePx / 2, sizePx / 2, sizePx / 2
  );
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.6, "rgba(255,255,255,0.6)");
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, sizePx, sizePx);

  const texture = twgl.createTexture(gl, {
    src: canvas, flipY: false, min: gl.LINEAR, mag: gl.LINEAR, wrap: gl.CLAMP_TO_EDGE,
  });

  return { plane, texture };
}

// Desenha o blob: unlit, translúcido escuro, sem escrever profundidade.
export function drawShadow(gl, programInfo, shadow, placement, camera, drawPart) {
  const material = createMaterial({
    color: [0, 0, 0, placement.alpha],
    texture: shadow.texture,
    useTexture: true,
  });

  const world = composeTransform({
    translation: placement.position,
    scale: [placement.size, 1, placement.size],
  });

  const uniforms = {
    u_view: camera.view,
    u_projection: camera.projection,
    u_cameraPosition: camera.eye,
    u_lightingEnabled: false, // unlit: cor = preto × alpha-da-textura
    u_fogEnabled: false,
  };

  gl.depthMask(false); // não escreve profundidade (prédios à frente ocultam)
  drawPart(gl, programInfo, shadow.plane, world, material, uniforms);
  gl.depthMask(true);
}
