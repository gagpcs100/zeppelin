import * as twgl from "twgl.js";
import { createCameraMatrices } from "../core/camera.js";
import { drawWorld } from "../objects/World.js";
import { drawZeppelin } from "../objects/Zeppelin.js";
import { drawSkybox } from "../objects/Skybox.js";
import { drawSky } from "../objects/Sky.js";
import { CONFIG } from "../config.js";
import { composeTransform } from "../math/transformations.js";
import { getLighting, getSkyColors, getNightFactor } from "./dayCycle.js";
import { assembleLights } from "./lights.js";
import { createMaterial } from "../utils/helpers.js";
import { shadowPlacement, drawShadow } from "../objects/Shadow.js";

const m4 = twgl.m4;

// Ponto único de renderização de um frame. Recebe tudo já preparado pela
// `createScene` e `updateScene` e apenas submete à GPU na ordem correta.
export function drawScene(gl, renderer, programs, scene, input, deltaTime, elapsedTime) {
  renderer.clear();

  const camera = createCameraMatrices(gl, scene, input, scene.cameraState, deltaTime);

  // Iluminação e cores do céu derivam do ciclo dia/noite (hora atual).
  const timeOfDay = scene.dayCycle.timeOfDay;
  const lighting = getLighting(timeOfDay);
  const skyColors = getSkyColors(timeOfDay);
  const nightFactor = getNightFactor(timeOfDay);
  const lights = assembleLights(scene, nightFactor);

  // Skybox primeiro: como removemos a translação da matriz de visão antes de
  // desenhá-lo (em drawSkybox), ele cobre o "infinito". Como o cubo é grande
  // e o depthMask é desligado durante seu desenho, o que vier depois pinta
  // por cima naturalmente.
  drawSkybox(gl, programs.skybox, scene.skybox, camera, skyColors);

  // Uniformes que valem para todos os objetos com shader Phong neste frame.
  const commonUniforms = {
    u_view: camera.view,
    u_projection: camera.projection,
    u_cameraPosition: camera.eye,

    u_lightDirection: lighting.direction,
    u_ambientLight: lighting.ambient,
    u_diffuseLight: lighting.diffuse,
    u_specularLight: lighting.specular,

    u_lightingEnabled: input.lightingEnabled,
    u_fogEnabled: input.fogEnabled,
    u_fogColor: skyColors.horizon,
    u_pointLightCount: lights.count,
    u_pointLightPos: lights.pos,
    u_pointLightColor: lights.color,
    u_pointLightRange: lights.range,
    u_pointLightDir: lights.dir,
    u_pointLightCosCutoff: lights.cosCutoff,
  };

  // Função genérica que submete UMA parte à GPU. Qualquer objeto que respeite
  // a interface { bufferInfo, world, material } pode usar esta função. É o
  // único lugar do código que chama `twgl.drawBufferInfo`.
  const drawPart = (gl, programInfo, bufferInfo, world, material, uniforms) => {
    gl.useProgram(programInfo.program);

    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    // Necessário para iluminar corretamente objetos com escala não uniforme:
    // normais devem ser transformadas pela transposta da inversa da matriz
    // mundo (não pela matriz mundo direta).
    const worldInverseTranspose = m4.transpose(m4.inverse(world));

    twgl.setUniforms(programInfo, {
      ...uniforms,
      u_world: world,
      u_worldInverseTranspose: worldInverseTranspose,
      u_diffuseColor: material.color,
      u_specularColor: material.specular,
      u_shininess: material.shininess,
      u_texture: material.texture,
      u_useTexture: material.useTexture,
    });

    twgl.drawBufferInfo(gl, bufferInfo);
  };

  // Sol e lua: logo após o skybox, ainda "no infinito".
  drawSky(gl, programs.phong, scene.sky, camera, timeOfDay, drawPart);

  // Mundo: o modelo .obj da cidade, com suas várias sub-meshes texturizadas.
  drawWorld(gl, programs.phong, scene.world, commonUniforms, drawPart);

  // Blob shadow: disco translúcido sob o zeppelin, assentado na superfície.
  const placement = shadowPlacement(scene.zeppelin, scene.world.heightField, CONFIG.shadow);
  drawShadow(gl, programs.phong, scene.shadow, placement, camera, drawPart);

  // Zeppelin: hierarquia (corpo, cabine, lemes, hélice rotativa).
  drawZeppelin(gl, programs.phong, scene.zeppelin, commonUniforms, drawPart);

  // Marcadores dos postes: esferinhas emissivas, visíveis só à noite.
  drawLampMarkers(gl, programs.phong, scene, camera, nightFactor, drawPart);

  drawHud(input, timeOfDay, scene.autopilot.active);
}

// Esferinhas emissivas nas posições dos postes — acendem com o nightFactor.
function drawLampMarkers(gl, programInfo, scene, camera, nightFactor, drawPart) {
  if (nightFactor <= 0.01) return; // de dia não aparecem

  const uniforms = {
    u_view: camera.view,
    u_projection: camera.projection,
    u_cameraPosition: camera.eye,
    u_lightingEnabled: false, // emissivo
    u_fogEnabled: false,
  };

  for (const lamp of scene.lamps) {
    // Cor do bulbo: a cor base do poste, atenuada pelo nightFactor (brilho).
    const c = CONFIG.lights.lampColor;
    const material = createMaterial({
      color: [c[0] * nightFactor, c[1] * nightFactor, c[2] * nightFactor, 1],
    });
    const world = composeTransform({ translation: lamp.position });
    drawPart(gl, programInfo, scene.lampMarker, world, material, uniforms);
  }
}

// HUD em HTML é mais barato e legível que desenhar texto em WebGL.
// Criado uma única vez e atualizado a cada frame.
function drawHud(input, timeOfDay, autopilotActive) {
  let hud = document.getElementById("hud");

  if (!hud) {
    hud = document.createElement("div");
    hud.id = "hud";
    document.body.appendChild(hud);

    hud.style.position = "fixed";
    hud.style.left = "12px";
    hud.style.top = "12px";
    hud.style.padding = "10px 12px";
    hud.style.background = "rgba(0,0,0,0.55)";
    hud.style.color = "white";
    hud.style.fontFamily = "Arial, sans-serif";
    hud.style.fontSize = "14px";
    hud.style.borderRadius = "8px";
    hud.style.lineHeight = "1.4";
    hud.style.pointerEvents = "none";
  }

  hud.innerHTML = `
    <strong>TP2 — Zeppelin sobre a cidade</strong><br>
    Mouse: pilota o voo (camera 3) | W/S: acelerar/frear<br>
    A/D: virar | Q/E: subir/descer | 1/2/3: câmeras (C: lado da lateral)<br>
    L: iluminação ${input.lightingEnabled ? "ligada" : "desligada"} |
    N: neblina ${input.fogEnabled ? "ligada" : "desligada"} |
    T: dia/noite (${formatClock(timeOfDay)})<br>
    P: piloto automático ${autopilotActive ? "LIGADO" : "desligado"} |
    Câmera: ${input.cameraMode}
  `;
}

// Converte timeOfDay [0,1) para um relógio "HH:MM" (24h).
function formatClock(timeOfDay) {
  const totalMinutes = Math.floor(timeOfDay * 24 * 60);
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
