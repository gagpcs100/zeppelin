import { CONFIG } from "../config.js";
import { resizeCanvasToDisplaySize } from "./resize.js";

export function createRenderer() {
  let canvas = document.getElementById(CONFIG.canvasId);

  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = CONFIG.canvasId;
    document.body.appendChild(canvas);
  }

  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";

  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.display = "block";

  const gl = canvas.getContext("webgl2");

  if (!gl) {
    throw new Error("WebGL2 não está disponível neste navegador.");
  }

  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);

  function resize() {
    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }

  function clear() {
    resize();

    // Fundo cinza escuro temporário para testar se os objetos aparecem.
    gl.clearColor(0.18, 0.20, 0.23, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  return {
    gl,
    canvas,
    clear,
  };
}
