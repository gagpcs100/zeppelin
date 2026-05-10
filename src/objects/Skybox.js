import * as twgl from "twgl.js";
import { composeTransform } from "../math/transformations.js";

export function createSkybox(gl) {
  return {
    bufferInfo: twgl.primitives.createCubeBufferInfo(gl, 1),
    world: composeTransform({
      translation: [0, 40, 0],
      scale: [220, 120, 220],
    }),
  };
}

export function drawSkybox(gl, programInfo, skybox, camera) {
  gl.depthMask(false);
  gl.useProgram(programInfo.program);

  twgl.setBuffersAndAttributes(gl, programInfo, skybox.bufferInfo);

  twgl.setUniforms(programInfo, {
    u_world: skybox.world,
    u_view: camera.view,
    u_projection: camera.projection,
  });

  twgl.drawBufferInfo(gl, skybox.bufferInfo);
  gl.depthMask(true);
}
