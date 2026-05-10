import { CONFIG } from "../config.js";

export function createLights() {
  return {
    direction: CONFIG.light.direction,
    ambient: CONFIG.light.ambient,
    diffuse: CONFIG.light.diffuse,
    specular: CONFIG.light.specular,
  };
}
