import { loadObjModel } from "../loaders/objLoader.js";
import { CONFIG } from "../config.js";
import { composeTransform, multiply } from "../math/transformations.js";
import { clamp } from "../utils/helpers.js";
import { createPropeller, drawPropeller } from "./Propeller.js";
import { clampToBounds } from "../utils/collision.js";

// Cria o zeppelin: corpo carregado do .obj (multi-material texturizado) e uma
// hélice procedural na traseira como componente de rotação contínua.
// É assíncrono porque carrega um arquivo — `createScene` deve usar `await`.
export async function createZeppelin(gl, textures) {
  let bodySubmeshes = [];
  try {
    const loaded = await loadObjModel(gl, "/models/zeppelin/11817_Zepplin_V2_L3.obj");
    bodySubmeshes = loaded.submeshes;
  } catch (error) {
    console.warn("Modelo do zeppelin não carregado:", error);
  }

  return {
    position: [...CONFIG.zeppelin.startPosition],
    rotationY: 0,
    rotationZ: 0,
    pitch: 0,
    velocity: 0,
    propeller: createPropeller(gl, textures),
    bodySubmeshes,
    // Transform local do corpo do .obj. O modelo é Z-up (Z vai de 0 a ~483,
    // a balloon em Z alto, a cabine em Z baixo) — a rotação -90° em X o
    // converte para Y-up. Comprimento ~1384 no eixo X, nariz em +X (grupo
    // "front"). A translação é -R·S·centro: recentra na origem após girar.
    bodyLocal: composeTransform({
      translation: [-1.401, -4.827, 0],
      rotation: [-Math.PI / 2, 0, 0],
      scale: [0.02, 0.02, 0.02],
    }),
  };
}

// Traduz o input do jogador (teclado + mouse) no formato de comandos de voo
// { turn, climb, throttle } que `updateZeppelin` consome. O piloto automático
// produz um objeto no mesmo formato — por isso a física fica num só lugar.
export function getPlayerControls(input) {
  const keys = input.keys;

  let throttle = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) throttle += 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) throttle -= 1;

  let turn = 0;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) turn += 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) turn -= 1;
  turn += input.turnInput || 0; // curva do mouse

  let climb = 0;
  if (keys.has("KeyE") || keys.has("Space")) climb += 1;
  if (keys.has("KeyQ") || keys.has("ShiftLeft")) climb -= 1;
  climb += input.climbInput || 0; // subida do mouse

  return { turn, climb, throttle };
}

// Atualiza a física do zeppelin a partir de `controls` { turn, climb,
// throttle } — venham eles do jogador ou do piloto automático.
export function updateZeppelin(zeppelin, controls, deltaTime, worldBounds) {
  const cfg = CONFIG.zeppelin;

  // 1. Velocidade com easing (aceleração/frenagem suaves). throttle ∈ [-1,1];
  //    a ré é mais lenta que o avanço.
  const throttle = controls.throttle;
  const targetVelocity = throttle >= 0 ? throttle * cfg.speed : throttle * cfg.speed * 0.5;
  zeppelin.velocity += (targetVelocity - zeppelin.velocity) * cfg.accelEase * deltaTime;

  // 2. Curva.
  const turn = controls.turn;
  zeppelin.rotationY += turn * cfg.turnSpeed * deltaTime;

  // 3. Banking: inclina (roll) proporcional à curva, com retorno suave.
  const targetRoll = -turn * 0.35;
  zeppelin.rotationZ += (targetRoll - zeppelin.rotationZ) * 4.0 * deltaTime;

  // 4. Subida/descida.
  const climb = controls.climb;
  zeppelin.position[1] += climb * cfg.verticalSpeed * deltaTime;

  // 5. Pitch visual: inclina o nariz conforme sobe/desce, com retorno suave.
  const targetPitch = climb * 0.2;
  zeppelin.pitch += (targetPitch - zeppelin.pitch) * 4.0 * deltaTime;

  // 6. Avançar no plano XZ na direção atual.
  const forward = [Math.cos(zeppelin.rotationY), 0, -Math.sin(zeppelin.rotationY)];
  zeppelin.position[0] += forward[0] * zeppelin.velocity * deltaTime;
  zeppelin.position[2] += forward[2] * zeppelin.velocity * deltaTime;

  // 7. Limites do mundo (caixa do .obj) e de altura.
  if (worldBounds) {
    const clamped = clampToBounds(zeppelin.position, worldBounds, 8);
    zeppelin.position[0] = clamped[0];
    zeppelin.position[2] = clamped[2];
  }
  zeppelin.position[1] = clamp(zeppelin.position[1], cfg.minHeight, cfg.maxHeight);

  // 8. Girar a hélice (componente de rotação contínua).
  zeppelin.propeller.angle += cfg.propellerSpeed * deltaTime;
}

export function drawZeppelin(gl, programInfo, zeppelin, commonUniforms, drawPart) {
  // Leve flutuação vertical ao longo do tempo.
  const bobbing = Math.sin(performance.now() / 1000 * 2) * 0.25;

  const baseWorld = composeTransform({
    translation: [zeppelin.position[0], zeppelin.position[1] + bobbing, zeppelin.position[2]],
    rotation: [zeppelin.pitch, zeppelin.rotationY, zeppelin.rotationZ],
  });

  // Corpo: cada sub-mesh do .obj com seu material/textura.
  const bodyWorld = multiply(baseWorld, zeppelin.bodyLocal);
  for (const sub of zeppelin.bodySubmeshes) {
    drawPart(gl, programInfo, sub.bufferInfo, bodyWorld, sub.material, commonUniforms);
  }

  // Hélice na traseira (eixo +X local é a frente; cauda fica em -X).
  const propellerWorld = multiply(
    baseWorld,
    composeTransform({
      translation: [-15, 0, 0],
      rotation: [0, Math.PI / 2, 0],
      scale: [0.9, 0.9, 0.9],
    })
  );
  drawPropeller(gl, programInfo, zeppelin.propeller, propellerWorld, commonUniforms, drawPart);
}
