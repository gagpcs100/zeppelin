import * as twgl from "twgl.js";
import { createCameraMatrices } from "../core/camera.js";
import { drawHouse } from "../objects/House.js";
import { drawTree } from "../objects/Tree.js";
import { drawZeppelin } from "../objects/Zeppelin.js";

const m4 = twgl.m4;

export function drawScene(gl, renderer, programs, scene, input, elapsedTime) {
  renderer.clear();

  const camera = createCameraMatrices(gl, scene, input);

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

  const drawPart = (gl, programInfo, bufferInfo, world, material, uniforms) => {
    gl.useProgram(programInfo.program);

    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

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

  drawPart(
    gl,
    programs.phong,
    scene.ground.bufferInfo,
    scene.ground.world,
    scene.ground.material,
    commonUniforms
  );

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

  for (const house of scene.houses) {
    drawHouse(gl, programs.phong, house, commonUniforms, drawPart);
  }

  for (const tree of scene.trees) {
    drawTree(gl, programs.phong, tree, commonUniforms, drawPart);
  }

  drawZeppelin(gl, programs.phong, scene.zeppelin, commonUniforms, drawPart);

  drawHud(input);
}

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
    1: câmera seguindo | 2: câmera lateral | C: alternar lateral<br>
    L: iluminação ${input.lightingEnabled ? "ligada" : "desligada"} |
    N: neblina ${input.fogEnabled ? "ligada" : "desligada"}
  `;
}
