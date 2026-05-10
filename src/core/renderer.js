import { CONFIG } from "../config.js";
import { resizeCanvasToDisplaySize } from "./resize.js";

// Cria o contexto WebGL2 e centraliza o estado fixo do renderer.
// Motivo: separar o "como falar com a GPU" do "o que desenhar". O resto do
// código nunca precisa lembrar de habilitar depth test ou definir clearColor.
export function createRenderer() {
  let canvas = document.getElementById(CONFIG.canvasId);

  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = CONFIG.canvasId;
    document.body.appendChild(canvas);
  }

  // Tela inteira sem barras de rolagem.
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.display = "block";

  const gl = canvas.getContext("webgl2", { antialias: true });

  if (!gl) {
    throw new Error("WebGL2 não está disponível neste navegador.");
  }

  // Estado padrão do pipeline: profundidade ligada (objetos próximos cobrem
  // os distantes), back-face culling (descarta faces viradas para longe da
  // câmera, economiza fragment shader) e blending para materiais com alpha.
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // Cor de fundo caso o skybox falhe; em uso normal o skybox cobre tudo.
  gl.clearColor(0.55, 0.75, 0.95, 1.0);

  function resize() {
    if (resizeCanvasToDisplaySize(gl.canvas)) {
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }
  }

  function clear() {
    resize();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  return { gl, canvas, clear, resize };
}
