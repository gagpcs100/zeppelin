import { updateZeppelin, getPlayerControls } from "../objects/Zeppelin.js";
import { updateInputFrame } from "../core/input.js";
import { updateDayCycle } from "./dayCycle.js";
import { updateAutopilot } from "./autopilot.js";

export function updateScene(scene, input, deltaTime, elapsedTime) {
  updateInputFrame(input);
  updateDayCycle(scene.dayCycle, input, deltaTime);

  // Piloto automático ligado → ele comanda o voo; senão, quem manda é o
  // jogador. Os dois produzem comandos no mesmo formato.
  const autoControls = updateAutopilot(
    scene.autopilot, scene.zeppelin, scene.world.bounds, input, deltaTime
  );
  const controls = autoControls || getPlayerControls(input);
  updateZeppelin(scene.zeppelin, controls, deltaTime, scene.world.bounds, scene.world.heightField);
}
