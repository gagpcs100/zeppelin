import { loadObjModel } from '../loaders/objLoader.js';
import { CONFIG } from '../config.js';
import { composeTransform, multiply } from '../math/transformations.js';
import { clamp } from '../utils/helpers.js';
import { createPropeller, drawPropeller } from './Propeller.js';
import {
	clampToBounds,
	maxSurfaceHeightAt,
	slideAgainstBuildings,
} from '../utils/collision.js';

// Pontos do corpo onde a colisão é amostrada (offsets [frente, lado] em
// unidades de mundo): nariz, centro, cauda e as duas laterais. Cobrir o corpo
// alongado evita que o nariz entre num prédio antes de o centro perceber.
const COLLISION_SAMPLES = [
	[CONFIG.zeppelin.bodyHalfLength, 0], // nariz
	[0, 0], // centro
	[-CONFIG.zeppelin.bodyHalfLength, 0], // cauda
	[0, CONFIG.zeppelin.bodyHalfWidth], // lateral direita
	[0, -CONFIG.zeppelin.bodyHalfWidth], // lateral esquerda
];

// Cria o zeppelin: corpo carregado do .obj (multi-material texturizado) e uma
// hélice procedural na traseira como componente de rotação contínua.
export async function createZeppelin(gl, textures) {
	let bodySubmeshes = [];
	try {
		const loaded = await loadObjModel(
			gl,
			'/models/zeppelin/11817_Zepplin_V2_L3.obj',
		);
		bodySubmeshes = loaded.submeshes;
	} catch (error) {
		console.warn('Modelo do zeppelin não carregado:', error);
	}

	return {
		position: [...CONFIG.zeppelin.startPosition],
		rotationY: 0,
		rotationZ: 0,
		pitch: 0,
		velocity: 0,
		propeller: createPropeller(gl, textures),
		bodySubmeshes,
		bodyLocal: composeTransform({
			translation: [-1.401, -4.827, 0],
			rotation: [-Math.PI / 2, 0, 0],
			scale: [0.02, 0.02, 0.02],
		}),
	};
}

export function getPlayerControls(input) {
	const keys = input.keys;

	let throttle = 0;
	if (keys.has('KeyW') || keys.has('ArrowUp')) throttle += 1;
	if (keys.has('KeyS') || keys.has('ArrowDown')) throttle -= 1;

	let turn = 0;
	if (keys.has('KeyA') || keys.has('ArrowLeft')) turn += 1;
	if (keys.has('KeyD') || keys.has('ArrowRight')) turn -= 1;
	turn += input.turnInput || 0; // curva do mouse

	let climb = 0;
	if (keys.has('KeyE') || keys.has('Space')) climb += 1;
	if (keys.has('KeyQ') || keys.has('ShiftLeft')) climb -= 1;
	climb += input.climbInput || 0; // subida do mouse

	return { turn, climb, throttle };
}

export function updateZeppelin(
	zeppelin,
	controls,
	deltaTime,
	worldBounds,
	heightField,
) {
	const cfg = CONFIG.zeppelin;

	// 1. Velocidade com easing (aceleração/frenagem suaves). throttle ∈ [-1,1];
	const throttle = controls.throttle;
	const targetVelocity =
		throttle >= 0 ? throttle * cfg.speed : throttle * cfg.speed * 0.5;
	zeppelin.velocity +=
		(targetVelocity - zeppelin.velocity) * cfg.accelEase * deltaTime;

	// 2. Curva.
	const turn = controls.turn;
	zeppelin.rotationY += turn * cfg.turnSpeed * deltaTime;

	// 3. Banking: inclina (roll) proporcional à curva, com retorno suave.
	const targetRoll = -turn * 0.35;
	zeppelin.rotationZ += (targetRoll - zeppelin.rotationZ) * 4.0 * deltaTime;

	// 4. Subida/descida.
	const climb = controls.climb;
	zeppelin.position[1] += climb * cfg.verticalSpeed * deltaTime;

	// 5. Pitch visual: inclina o nariz conforme sobe/desce, com retorno suave.
	const targetPitch = climb * 0.2;
	zeppelin.pitch += (targetPitch - zeppelin.pitch) * 4.0 * deltaTime;

	// 6. Avançar no plano XZ, tratando os prédios como sólidos: ao bater, o
	//    zeppelin TRAVA contra a parede e desliza de raspão (a colisão resolve X
	//    e Z separadamente). Voar acima do telhado passa por cima livremente.
	const forward = [
		Math.cos(zeppelin.rotationY),
		0,
		-Math.sin(zeppelin.rotationY),
	];
	const dx = forward[0] * zeppelin.velocity * deltaTime;
	const dz = forward[2] * zeppelin.velocity * deltaTime;
	if (heightField) {
		const [nx, nz] = slideAgainstBuildings(
			heightField,
			zeppelin.position[0],
			zeppelin.position[2],
			dx,
			dz,
			zeppelin.position[1],
			zeppelin.rotationY,
			COLLISION_SAMPLES,
			cfg.buildingClearance,
		);
		zeppelin.position[0] = nx;
		zeppelin.position[2] = nz;
	} else {
		zeppelin.position[0] += dx;
		zeppelin.position[2] += dz;
	}

	// 7. Limites do mundo (caixa do .obj).
	if (worldBounds) {
		const clamped = clampToBounds(zeppelin.position, worldBounds, 8);
		zeppelin.position[0] = clamped[0];
		zeppelin.position[2] = clamped[2];
	}

	// 8. Altura: piso sólido (chão, ou telhado que está embaixo) e teto. O corpo
	//    repousa sobre o telhado em vez de afundar; como o passo 6 impede entrar
	//    embaixo de um telhado mais alto, este piso só atua onde já se está por
	//    cima. Telhados mais altos que (maxHeight - folga) viram paredes que se
	//    contorna, não rampas.
	let floor = cfg.minHeight;
	if (heightField) {
		const surface = maxSurfaceHeightAt(
			heightField,
			zeppelin.position[0],
			zeppelin.position[2],
			zeppelin.rotationY,
			COLLISION_SAMPLES,
		);
		floor = Math.max(
			floor,
			Math.min(surface + cfg.buildingClearance, cfg.maxHeight),
		);
	}
	zeppelin.position[1] = clamp(zeppelin.position[1], floor, cfg.maxHeight);

	// 9. Girar a hélice (componente de rotação contínua).
	zeppelin.propeller.angle += cfg.propellerSpeed * deltaTime;
}

export function drawZeppelin(
	gl,
	programInfo,
	zeppelin,
	commonUniforms,
	drawPart,
) {
	// Leve flutuação vertical ao longo do tempo.
	const bobbing = Math.sin((performance.now() / 1000) * 2) * 0.25;

	const baseWorld = composeTransform({
		translation: [
			zeppelin.position[0],
			zeppelin.position[1] + bobbing,
			zeppelin.position[2],
		],
		rotation: [zeppelin.pitch, zeppelin.rotationY, zeppelin.rotationZ],
	});

	// Corpo: cada sub-mesh do .obj com seu material/textura.
	const bodyWorld = multiply(baseWorld, zeppelin.bodyLocal);
	for (const sub of zeppelin.bodySubmeshes) {
		drawPart(
			gl,
			programInfo,
			sub.bufferInfo,
			bodyWorld,
			sub.material,
			commonUniforms,
		);
	}

	// Hélice na traseira (eixo +X local é a frente; cauda fica em -X).
	const propellerWorld = multiply(
		baseWorld,
		composeTransform({
			translation: [-15, 0, 0],
			rotation: [0, Math.PI / 2, 0],
			scale: [0.9, 0.9, 0.9],
		}),
	);
	drawPropeller(
		gl,
		programInfo,
		zeppelin.propeller,
		propellerWorld,
		commonUniforms,
		drawPart,
	);
}
