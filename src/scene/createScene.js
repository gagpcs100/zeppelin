import { createDefaultTextures } from "../loaders/textureLoader.js";
import { createWorld } from "../objects/World.js";
import { createZeppelin } from "../objects/Zeppelin.js";
import { createSkybox } from "../objects/Skybox.js";
import { createSky } from "../objects/Sky.js";
import { createDayCycle } from "./dayCycle.js";
import { createAutopilot } from "./autopilot.js";
import { createCameraState } from "../core/camera.js";

// Cria UMA vez o estado da cena. O `updateScene` muda só o estado dinâmico.
// A cena tem o mundo (modelo .obj), o zeppelin, o céu (skybox + sol/lua) e o
// ciclo dia/noite, de onde sai a iluminação de cada frame.
export async function createScene(gl) {
  const textures = createDefaultTextures(gl);

  const world = await createWorld(gl);
  const zeppelin = await createZeppelin(gl, textures);
  const skybox = createSkybox(gl);
  const sky = createSky(gl);
  const dayCycle = createDayCycle();
  const autopilot = createAutopilot();

  return {
    textures, world, zeppelin, skybox, sky, dayCycle, autopilot,
    cameraState: createCameraState(),
  };
}
