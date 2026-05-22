import { CONFIG } from "../config.js";
import { clamp } from "../utils/helpers.js";

export function createInputState() {
  return {
    keys: new Set(),
    cameraMode: 1,
    sideCameraIndex: 0,
    lightingEnabled: true,
    fogEnabled: false,
    // Posição do mouse normalizada em relação ao centro do canvas (-1..1).
    mouseNormX: 0,
    mouseNormY: 0,
    // Comandos de voo derivados do mouse, consumidos por updateZeppelin.
    turnInput: 0,   // -1 = curva à direita, +1 = curva à esquerda
    climbInput: 0,  // -1 = descer, +1 = subir
  };
}

export function setupInput(input) {
  const canvas = document.getElementById(CONFIG.canvasId);

  window.addEventListener("keydown", (event) => {
    input.keys.add(event.code);
    if (event.code === "Digit1") input.cameraMode = 1;
    if (event.code === "Digit2") input.cameraMode = 2;
    if (event.code === "Digit3") input.cameraMode = 3;
    if (event.code === "KeyC" && !event.repeat) {
      input.sideCameraIndex = (input.sideCameraIndex + 1) % 4;
    }
    if (event.code === "KeyL" && !event.repeat) {
      input.lightingEnabled = !input.lightingEnabled;
    }
    if (event.code === "KeyN" && !event.repeat) {
      input.fogEnabled = !input.fogEnabled;
    }
    event.preventDefault();
  });

  window.addEventListener("keyup", (event) => input.keys.delete(event.code));

  // Mouse: posição normalizada em relação ao centro do canvas. Sem pointer
  // lock — o cursor fica livre.
  window.addEventListener("mousemove", (event) => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    input.mouseNormX = clamp((event.clientX - rect.left - rect.width / 2) / (rect.width / 2), -1, 1);
    input.mouseNormY = clamp((event.clientY - rect.top - rect.height / 2) / (rect.height / 2), -1, 1);
  });

  // Cursor saiu da janela → centraliza (voo reto e nivelado).
  window.addEventListener("mouseout", () => {
    input.mouseNormX = 0;
    input.mouseNormY = 0;
  });
}

// Converte a posição do mouse em comandos de voo. Aplica zona morta central
// para evitar deriva. Chamado a cada frame por updateScene.
export function updateInputFrame(input) {
  input.turnInput = -applyDeadZone(input.mouseNormX);   // cursor à direita → curva à direita
  input.climbInput = -applyDeadZone(input.mouseNormY);  // cursor acima → subir
}

function applyDeadZone(value) {
  const dz = CONFIG.mouse.deadZone;
  if (Math.abs(value) < dz) return 0;
  // Reescala a faixa [dz, 1] para [0, 1] mantendo o sinal.
  return Math.sign(value) * ((Math.abs(value) - dz) / (1 - dz));
}
