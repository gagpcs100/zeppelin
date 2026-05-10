import { updateZeppelin } from "../objects/Zeppelin.js";

export function updateScene(scene, input, deltaTime, elapsedTime) {
  updateZeppelin(scene.zeppelin, input, deltaTime, elapsedTime);
}
