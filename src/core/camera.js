import * as twgl from "twgl.js";
import { CONFIG } from "../config.js";

const m4 = twgl.m4;

// Constrói as matrizes de projeção e visão a cada frame.
// Decisão: a câmera é stateless — recalcula tudo a partir da posição atual do
// zeppelin e do modo selecionado. Simples de raciocinar e não acumula erro.
export function createCameraMatrices(gl, scene, input) {
  const aspect = gl.canvas.width / Math.max(1, gl.canvas.height);

  // Projeção perspectiva: requisito obrigatório do TP2.
  const projection = m4.perspective(
    CONFIG.camera.fov,
    aspect,
    CONFIG.camera.near,
    CONFIG.camera.far
  );

  const zeppelin = scene.zeppelin;
  const position = zeppelin.position;

  let eye;
  let target;
  let up = [0, 1, 0];

  if (input.cameraMode === 1) {
    // Modo 1: "vista superior" em 3/4 — alta e atrás do zeppelin, inclinada
    // para baixo. Mostra a cidade inteira mantendo profundidade 3D.
    eye = [
      position[0],
      position[1] + CONFIG.camera.topHeight,
      position[2] + CONFIG.camera.topBack,
    ];
    target = [position[0], position[1], position[2]];
  } else if (input.cameraMode === 2) {
    // Modo 2: câmera lateral elevada com 4 ângulos.
    const side = input.sideCameraIndex;
    const d = CONFIG.camera.sideDistance;
    const h = CONFIG.camera.sideHeight;

    if (side === 0) {
      eye = [position[0] + d, position[1] + h, position[2]];
    } else if (side === 1) {
      eye = [position[0] - d, position[1] + h, position[2]];
    } else if (side === 2) {
      eye = [position[0], position[1] + h, position[2] + d];
    } else {
      eye = [position[0], position[1] + h, position[2] - d];
    }
    target = [position[0], position[1], position[2]];
  } else {
    // Modo 3: 3ª pessoa orbital — câmera orbita ao redor do zeppelin,
    // controlada pelo mouse (yaw = ângulo horizontal, pitch = elevação).
    // A câmera sempre olha para o zeppelin.
    const dist = CONFIG.camera.orbitDistance;
    const yaw = input.cameraYaw;
    const pitch = CONFIG.camera.orbitPitch;

    // Coordenadas esféricas → cartesianas (relativas ao zeppelin).
    // pitch=0 → horizontal; pitch=PI/2 → topo.
    eye = [
      position[0] + dist * Math.cos(pitch) * Math.sin(yaw),
      position[1] + dist * Math.sin(pitch),
      position[2] + dist * Math.cos(pitch) * Math.cos(yaw),
    ];

    target = [position[0], position[1], position[2]];
  }

  // m4.lookAt devolve a matriz da CÂMERA no mundo; o shader usa a inversa
  // (view matrix), que leva o mundo para o espaço da câmera.
  const camera = m4.lookAt(eye, target, up);
  const view = m4.inverse(camera);

  return { projection, view, eye };
}
