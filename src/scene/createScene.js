import { CONFIG } from "../config.js";
import { createDefaultTextures } from "../loaders/textureLoader.js";
import { createGround } from "../objects/Ground.js";
import { createRoad } from "../objects/Road.js";
import { createHouse } from "../objects/House.js";
import { createTree } from "../objects/Tree.js";
import { createZeppelin } from "../objects/Zeppelin.js";
import { createSkybox } from "../objects/Skybox.js";
import { createLights } from "./lights.js";

export async function createScene(gl) {
  const textures = createDefaultTextures(gl);

  const ground = createGround(gl, textures, CONFIG.world.size);

  const roads = [
    createRoad(gl, textures, CONFIG.world.size, CONFIG.world.roadWidth, [0, 0.04, 0], 0),
    createRoad(gl, textures, CONFIG.world.size, CONFIG.world.roadWidth, [0, 0.05, 0], Math.PI / 2),
  ];

  const houses = [
    createHouse(gl, textures, [-18, 0, -18], 1.2),
    createHouse(gl, textures, [-10, 0, -24], 0.9),
    createHouse(gl, textures, [16, 0, -20], 1.1),
    createHouse(gl, textures, [24, 0, -10], 0.8),
    createHouse(gl, textures, [-22, 0, 15], 1.0),
    createHouse(gl, textures, [18, 0, 18], 1.2),
  ];

  const trees = [
    createTree(gl, textures, [-35, 0, -35], 1.1),
    createTree(gl, textures, [-30, 0, -28], 0.9),
    createTree(gl, textures, [32, 0, -30], 1.3),
    createTree(gl, textures, [38, 0, -20], 1.0),
    createTree(gl, textures, [-35, 0, 28], 1.2),
    createTree(gl, textures, [-28, 0, 35], 0.8),
    createTree(gl, textures, [35, 0, 30], 1.1),
    createTree(gl, textures, [25, 0, 38], 1.0),
  ];

  const zeppelin = createZeppelin(gl, textures);
  const skybox = createSkybox(gl);
  const lights = createLights();

  return {
    textures,
    ground,
    roads,
    houses,
    trees,
    zeppelin,
    skybox,
    lights,
  };
}
