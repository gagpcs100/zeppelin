import { updateZeppelin } from "../objects/Zeppelin.js";
import { updateInputFrame } from "../core/input.js";

export function updateScene(scene, input, deltaTime, elapsedTime) {
  updateInputFrame(input, deltaTime);
  updateZeppelin(scene.zeppelin, input, deltaTime, elapsedTime);
}
