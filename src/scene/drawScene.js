import * as twgl from "twgl.js";
import { createCameraMatrices } from "../core/camera.js";
import { drawHouse } from "../objects/House.js";
import { drawTree } from "../objects/Tree.js";
import { drawZeppelin } from "../objects/Zeppelin.js";
import { drawSkybox } from "../objects/Skybox.js";
import { drawObjModel } from "../objects/ObjModel.js";

const m4 = twgl.m4;

// Ponto único de renderização de um frame. Recebe tudo já preparado pela
// `createScene` e `updateScene` e apenas submete à GPU na ordem correta.
export function drawScene(gl, renderer, programs, scene, input, elapsedTime) {
  renderer.clear();

  const camera = createCameraMatrices(gl, scene, input);

  // Skybox primeiro: como removemos a translação da matriz de visão antes de
  // desenhá-lo (em drawSkybox), ele cobre o "infinito". Como o cubo é grande
  // e o depthMask é desligado durante seu desenho, o que vier depois pinta
  // por cima naturalmente.
  drawSkybox(gl, programs.skybox, scene.skybox, camera);

  // Uniformes que valem para todos os objetos com shader Phong neste frame.
  const commonUniforms = {
    u_view: camera.view,
    u_projection: camera.projection,
    u_cameraPosition: camera.eye,

    u_lightDirection: scene.lights.direction,
    u_ambientLight: scene.lights.ambient,
    u_diffuseLight: scene.lights.diffuse,
    u_specularLight: scene.lights.specular,

    u_lightingEnabled: input.lightingEnabled,
    u_fogEnabled: input.fogEnabled,
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

  // Chão (plano grande com textura de grama).
  drawPart(
    gl,
    programs.phong,
    scene.ground.bufferInfo,
    scene.ground.world,
    scene.ground.material,
    commonUniforms
  );

  // Ruas (caixas finas).
  for (const road of scene.roads) {
    drawPart(
      gl,
      programs.phong,
      road.bufferInfo,
      road.world,
      road.material,
      commonUniforms
    );
  }

  // Casas e árvores: cada uma é uma hierarquia de partes.
  for (const house of scene.houses) {
    drawHouse(gl, programs.phong, house, commonUniforms, drawPart);
  }

  for (const tree of scene.trees) {
    drawTree(gl, programs.phong, tree, commonUniforms, drawPart);
  }

  // Modelos .obj carregados (opcional do enunciado). Lista vazia = ignorado.
  for (const model of scene.objModels) {
    drawObjModel(gl, programs.phong, model, commonUniforms, drawPart);
  }

  // Zeppelin: hierarquia (corpo, cabine, lemes, hélice rotativa).
  drawZeppelin(gl, programs.phong, scene.zeppelin, commonUniforms, drawPart);

  drawHud(input);
}

// HUD em HTML é mais barato e legível que desenhar texto em WebGL.
// Criado uma única vez e atualizado a cada frame.
function drawHud(input) {
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
    <strong>TP2 - Zeppelin</strong><br>
    W/S: frente/trás | A/D: virar | Q/E: subir/descer<br>
    1: câmera top-down | 2: câmera lateral | C: alternar lado lateral<br>
    L: iluminação ${input.lightingEnabled ? "ligada" : "desligada"} |
    N: neblina ${input.fogEnabled ? "ligada" : "desligada"}
  `;
}
