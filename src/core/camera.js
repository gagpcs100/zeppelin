import * as twgl from "twgl.js";
import { CONFIG } from "../config.js";

const m4 = twgl.m4;

export function createCameraMatrices(gl, scene, input) {
  const aspect = gl.canvas.width / gl.canvas.height;

  const projection = m4.perspective(
    CONFIG.camera.fov,
    aspect,
    CONFIG.camera.near,
    CONFIG.camera.far
  );

  const zeppelin = scene.zeppelin;
  const position = zeppelin.position;
  const rotation = zeppelin.rotationY;

  let eye;

  const target = [
    position[0],
    position[1],
    position[2],
  ];

  if (input.cameraMode === 1) {
    // Câmera mais alta e mais afastada para enxergar o zeppelin e o mundo.
    eye = [
      position[0] - 22,
      position[1] + 14,
      position[2] - 30,
    ];
  } else {
    const side = input.sideCameraIndex;

    if (side === 0) {
      eye = [position[0], position[1] + 8, position[2] + CONFIG.camera.sideDistance];
    } else if (side === 1) {
      eye = [position[0], position[1] + 8, position[2] - CONFIG.camera.sideDistance];
    } else if (side === 2) {
      eye = [position[0] + CONFIG.camera.sideDistance, position[1] + 8, position[2]];
    } else {
      eye = [position[0] - CONFIG.camera.sideDistance, position[1] + 8, position[2]];
    }
  }

  const camera = m4.lookAt(eye, target, [0, 1, 0]);
  const view = m4.inverse(camera);

  return {
    projection,
    view,
    eye,
  };
}
