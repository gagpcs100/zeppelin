export const CONFIG = {
  canvasId: "glcanvas",

  world: {
    size: 120,
    roadWidth: 8,
  },

  zeppelin: {
    startPosition: [0, 14, 0],
    speed: 10,
    turnSpeed: 1.8,
    verticalSpeed: 7,
    propellerSpeed: 14,
  },

  camera: {
    fov: Math.PI / 4,
    near: 0.1,
    far: 300,
    followDistance: 28,
    followHeight: 12,
    sideDistance: 24,
  },

  light: {
    direction: [-0.5, -1.0, -0.3],
    ambient: [0.25, 0.25, 0.25],
    diffuse: [0.9, 0.85, 0.75],
    specular: [1.0, 1.0, 1.0],
  },
};
