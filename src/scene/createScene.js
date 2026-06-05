import * as twgl from 'twgl.js';
import { CONFIG } from '../config.js';
import { createDefaultTextures } from '../loaders/textureLoader.js';
import { createWorld } from '../objects/World.js';
import { createZeppelin } from '../objects/Zeppelin.js';
import { createSkybox } from '../objects/Skybox.js';
import { createSky } from '../objects/Sky.js';
import { createDayCycle } from './dayCycle.js';
import { createAutopilot } from './autopilot.js';
import { createCameraState } from '../core/camera.js';
import { surfaceHeightAt } from '../utils/collision.js';
import { createShadow } from '../objects/Shadow.js';

// Cria UMA vez o estado da cena. O `updateScene` muda só o estado dinâmico.
export async function createScene(gl) {
	const textures = createDefaultTextures(gl);

	const world = await createWorld(gl);
	const zeppelin = await createZeppelin(gl, textures);
	const skybox = createSkybox(gl);
	const sky = createSky(gl);
	const dayCycle = createDayCycle();
	const autopilot = createAutopilot();

	// Postes: posição XZ do config; Y assentado na superfície do mundo (telhado
	// ou chão) + altura do poste. Cor já "baked" (cor × intensidade).
	const lc = CONFIG.lights;
	const lampColor = lc.lampColor.map((c) => c * lc.lampIntensity);
	const lamps = lc.lampPositions.map(([x, z]) => ({
		position: [
			x,
			surfaceHeightAt(world.heightField, x, z) + lc.lampHeight,
			z,
		],
		color: lampColor,
		range: lc.lampRange,
	}));
	const lampMarker = twgl.primitives.createSphereBufferInfo(
		gl,
		lc.lampMarkerSize,
		12,
		8,
	);

	const shadow = createShadow(gl);

	return {
		textures,
		world,
		zeppelin,
		skybox,
		sky,
		dayCycle,
		autopilot,
		lamps,
		lampMarker,
		shadow,
		cameraState: createCameraState(),
	};
}
