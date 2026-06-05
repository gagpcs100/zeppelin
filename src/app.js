import { CONFIG } from './config.js';
import { createRenderer } from './core/renderer.js';
import { createInputState, setupInput } from './core/input.js';
import { createProgramInfos } from './core/shaderProgram.js';
import { createScene } from './scene/createScene.js';
import { updateScene } from './scene/updateScene.js';
import { drawScene } from './scene/drawScene.js';
import { startAnimationLoop } from './core/animationLoop.js';
import { setupRadio } from './radio/radio.js';

export async function startApp() {
	const renderer = createRenderer();
	const gl = renderer.gl;

	const input = createInputState();
	setupInput(input);
	setupRadio(CONFIG.radio);

	const programs = createProgramInfos(gl);
	const scene = await createScene(gl);

	startAnimationLoop((deltaTime, elapsedTime) => {
		updateScene(scene, input, deltaTime, elapsedTime);
		drawScene(gl, renderer, programs, scene, input, deltaTime, elapsedTime);
	});
}
