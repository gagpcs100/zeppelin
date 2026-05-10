import * as twgl from "twgl.js";

const m4 = twgl.m4;

export function composeTransform({
  translation = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
} = {}) {
  let matrix = m4.identity();

  matrix = m4.translate(matrix, translation);
  matrix = m4.rotateX(matrix, rotation[0]);
  matrix = m4.rotateY(matrix, rotation[1]);
  matrix = m4.rotateZ(matrix, rotation[2]);
  matrix = m4.scale(matrix, scale);

  return matrix;
}

export function multiply(a, b) {
  return m4.multiply(a, b);
}
