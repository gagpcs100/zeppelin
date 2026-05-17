// Constantes globais do projeto. Centralizar aqui evita "números mágicos"
// espalhados pelo código e facilita ajustes finos (tamanho do mundo, FOV,
// velocidades) em um único lugar.
export const CONFIG = {
  canvasId: "glcanvas",

  world: {
    radius: 150,        // raio do disco onde o zeppelin pode voar
    size: 300,          // = 2 * radius — chão quadrado cobrindo o disco
    roadWidth: 8,       // largura das ruas
  },

  zeppelin: {
    startPosition: [0, 14, 0],
    speed: 10,            // m/s no plano XZ
    turnSpeed: 1.8,       // rad/s
    verticalSpeed: 7,     // m/s em Y (Q/E)
    propellerSpeed: 14,   // rad/s — rotação contínua da hélice
    minHeight: 5,
    maxHeight: 120,
  },

  camera: {
    fov: Math.PI / 4,
    near: 0.1,
    far: 600,
    // Modo 1 (top-down em 3/4): altura e recuo em relação ao zeppelin.
    topHeight: 55,
    topBack: 42,
    // Modo 2 (lateral): distância e altura em relação ao zeppelin
    sideDistance: 28,
    sideHeight: 10,
    // Modo 3 (3ª pessoa orbital): controlado pelo mouse
    mouseSensitivity: 0.003,
    orbitDistance: 25,     // distância da câmera ao zeppelin
    orbitPitch: 0.45,      // elevação fixa da câmera orbital (rad)
    orbitYawSpeed: 2.5,   // rad/s — velocidade de rotação horizontal da câmera
    orbitPitchSpeed: 1.5, // rad/s — velocidade de ajuste do pitch de movimento
  },

  walls: [
    { radius: 40, height: 50, color: [0.78, 0.76, 0.72, 1] },
    { radius: 75, height: 50, color: [0.66, 0.64, 0.60, 1] },
    { radius: 115, height: 50, color: [0.55, 0.53, 0.50, 1] },
  ],

  light: {
    // Direção da luz direcional (apontando do "sol" para o chão).
    direction: [-0.5, -1.0, -0.3],
    ambient: [0.25, 0.25, 0.25],
    diffuse: [0.9, 0.85, 0.75],
    specular: [1.0, 1.0, 1.0],
  },
};
