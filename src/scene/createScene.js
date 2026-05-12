import { CONFIG } from "../config.js";
import { createDefaultTextures } from "../loaders/textureLoader.js";
import { createGround } from "../objects/Ground.js";
import { createRoad } from "../objects/Road.js";
import { createHouse } from "../objects/House.js";
import { createTree } from "../objects/Tree.js";
import { createWall } from "../objects/Wall.js";
import { createZeppelin } from "../objects/Zeppelin.js";
import { createSkybox } from "../objects/Skybox.js";
import { createObjModel } from "../objects/ObjModel.js";
import { createLights } from "./lights.js";

// Cria UMA vez o estado da cena (geometrias, materiais, posições iniciais).
// Tudo aqui vive enquanto a aplicação roda; o `updateScene` muda apenas o
// estado dinâmico (posição do zeppelin, ângulo da hélice, etc.).
export async function createScene(gl) {
  const textures = createDefaultTextures(gl);

  const ground = createGround(gl, textures, CONFIG.world.size);

  // Duas ruas em cruz no centro do mapa.
  const roads = [
    createRoad(gl, textures, CONFIG.world.size, CONFIG.world.roadWidth, [0, 0.04, 0], 0),
    createRoad(gl, textures, CONFIG.world.size, CONFIG.world.roadWidth, [0, 0.05, 0], Math.PI / 2),
  ];

  // Casas espalhadas formando "bairros" longe das ruas.
  const houses = [
    createHouse(gl, textures, [-18, 0, -18], 1.2),
    createHouse(gl, textures, [-10, 0, -24], 0.9),
    createHouse(gl, textures, [16, 0, -20], 1.1),
    createHouse(gl, textures, [24, 0, -10], 0.8),
    createHouse(gl, textures, [-22, 0, 15], 1.0),
    createHouse(gl, textures, [18, 0, 18], 1.2),
  ];

  // Árvores no perímetro, simulando arborização periférica.
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

  const walls = CONFIG.walls.map((w) => createWall(gl, textures, w));

  const zeppelin = createZeppelin(gl, textures);
  const skybox = createSkybox(gl);
  const lights = createLights();

  // Carrega modelos .obj externos. Promise.all em paralelo: como cada um faz
  // fetch + parse independente, paralelizar reduz o tempo de boot quando há
  // vários arquivos.
  // Se algum modelo falhar, ignoramos para a base continuar utilizável.
  const objModels = await loadObjModelsSafely(gl, textures);

  return {
    textures,
    ground,
    roads,
    houses,
    trees,
    walls,
    objModels,
    zeppelin,
    skybox,
    lights,
  };
}

async function loadObjModelsSafely(gl, textures) {
  try {
    const cloud = await createObjModel(gl, "/models/extra/nuvem.obj", {
      position: [-30, 38, -20],
      scale: 4,
      color: [1, 1, 1, 1],
      texture: textures.wall, // textura clara só para ter algo no UV
      useTexture: false,
      shininess: 5,
    });
    return [cloud];
  } catch (error) {
    console.warn("Falha ao carregar modelos .obj — seguindo sem eles:", error);
    return [];
  }
}
