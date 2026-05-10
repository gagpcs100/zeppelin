// Constantes globais do projeto. Centralizar aqui evita "números mágicos"
// espalhados pelo código e facilita ajustes finos (tamanho do mundo, FOV,
// velocidades) em um único lugar.
export const CONFIG = {
  canvasId: "glcanvas",

  world: {
    size: 120,       // lado do plano do chão, em unidades de mundo
    roadWidth: 8,    // largura das ruas
  },

  zeppelin: {
    startPosition: [0, 14, 0],
    speed: 10,            // m/s no plano XZ
    turnSpeed: 1.8,       // rad/s
    verticalSpeed: 7,     // m/s em Y (Q/E)
    propellerSpeed: 14,   // rad/s — rotação contínua da hélice
    minHeight: 5,
    maxHeight: 45,
  },

  camera: {
    fov: Math.PI / 4,
    near: 0.1,
    far: 400,
    // Modo 1 (top-down em 3/4): altura e recuo em relação ao zeppelin.
    // Razão ~ 1.3 entre eles dá ângulo de mergulho próximo de 60°, mostrando
    // a cidade inteira sem achatar o 3D.
    topHeight: 55,
    topBack: 42,
    // Modo 2 (lateral): distância e altura em relação ao zeppelin
    sideDistance: 28,
    sideHeight: 10,
  },

  light: {
    // Direção da luz direcional (apontando do "sol" para o chão).
    // Convencionamos que o vetor é a direção *de propagação* da luz; o shader
    // inverte ao calcular o cosseno de incidência.
    direction: [-0.5, -1.0, -0.3],
    ambient: [0.25, 0.25, 0.25],
    diffuse: [0.9, 0.85, 0.75],
    specular: [1.0, 1.0, 1.0],
  },
};
