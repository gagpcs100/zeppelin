import { CONFIG } from "../config.js";
import { clamp } from "../utils/helpers.js";

export function createInputState() {
  return {
    keys: new Set(),
    cameraMode: 1,
    sideCameraIndex: 0,
    lightingEnabled: true,
    fogEnabled: false,
    // Posição do mouse normalizada em relação ao centro do canvas (-1 a 1)
    mouseNormX: 0,        // -1 = esquerda, +1 = direita
    mouseNormY: 0,        // -1 = cima, +1 = baixo
    cameraYaw: 0,         // rad — ângulo acumulado da câmera orbital
    movementPitch: 0,     // rad — pitch de movimento (mouse Y)
  };
}

export function setupInput(input) {
  const canvas = document.getElementById(CONFIG.canvasId);

  window.addEventListener("keydown", (event) => {
    input.keys.add(event.code);

    if (event.code === "Digit1") {
      input.cameraMode = 1;
    }

    if (event.code === "Digit2") {
      input.cameraMode = 2;
    }

    if (event.code === "Digit3") {
      input.cameraMode = 3;
    }

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

  window.addEventListener("keyup", (event) => {
    input.keys.delete(event.code);
  });

  // Mouse move: rastreia posição normalizada em relação ao centro do canvas.
  // Sem pointer lock, sem clique — fluido como jogos de mundo aberto.
  window.addEventListener("mousemove", (event) => {
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Normaliza de -1 a 1 em relação ao centro do canvas
    input.mouseNormX = clamp((event.clientX - centerX) / (rect.width / 2), -1, 1);
    input.mouseNormY = clamp((event.clientY - centerY) / (rect.height / 2), -1, 1);
  });

  // Mouse sai da janela → resetar para centro
  window.addEventListener("mouseout", () => {
    input.mouseNormX = 0;
    input.mouseNormY = 0;
  });
}

// Chamado a cada frame para atualizar câmera orbital e pitch de movimento
// com base na posição do mouse (suave e contínuo).
export function updateInputFrame(input, deltaTime) {
  if (input.cameraMode !== 3) return;

  const yawSpeed = CONFIG.camera.orbitYawSpeed;
  const pitchSpeed = CONFIG.camera.orbitPitchSpeed;
  const pitchLimit = Math.PI / 3;

  // Mouse longe do centro → câmera orbita mais rápido (proporcional ao deslocamento)
  input.cameraYaw += input.mouseNormX * yawSpeed * deltaTime;

  // Mouse Y → inclina o pitch de movimento (sobe/desce ao voar)
  input.movementPitch -= input.mouseNormY * pitchSpeed * deltaTime;
  input.movementPitch = clamp(input.movementPitch, -pitchLimit, pitchLimit);
}
