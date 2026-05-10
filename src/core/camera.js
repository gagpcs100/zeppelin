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
  const target = [position[0], position[1], position[2]];

  let eye;
  let up = [0, 1, 0];

  if (input.cameraMode === 1) {
    // Modo 1: "vista superior" em 3/4 — alta e atrás do zeppelin, inclinada
    // para baixo. Mostra a cidade inteira mantendo profundidade 3D
    // (interpretação usual do "top-down" pedido pelo enunciado).
    eye = [
      position[0],
      position[1] + CONFIG.camera.topHeight,
      position[2] + CONFIG.camera.topBack,
    ];
    // Up padrão funciona porque a câmera não está perfeitamente vertical.
    up = [0, 1, 0];
  } else {
    // Modo 2: câmera lateral elevada com 4 ângulos. O índice é trocado pela
    // tecla C (input.js) ou pelas teclas 1..5 (lá embaixo um mapeamento mais
    // específico pode ser feito; aqui usamos só 4 para o requisito mínimo).
    const side = input.sideCameraIndex;
    const d = CONFIG.camera.sideDistance;
    const h = CONFIG.camera.sideHeight;

    // Cada índice = um dos quatro lados ao redor do zeppelin.
    if (side === 0) {
      // Frente
      eye = [position[0] + d, position[1] + h, position[2]];
    } else if (side === 1) {
      // Trás
      eye = [position[0] - d, position[1] + h, position[2]];
    } else if (side === 2) {
      // Direita
      eye = [position[0], position[1] + h, position[2] + d];
    } else {
      // Esquerda
      eye = [position[0], position[1] + h, position[2] - d];
    }
  }

  // m4.lookAt devolve a matriz da CÂMERA no mundo; o shader usa a inversa
  // (view matrix), que leva o mundo para o espaço da câmera.
  const camera = m4.lookAt(eye, target, up);
  const view = m4.inverse(camera);

  return { projection, view, eye };
}
