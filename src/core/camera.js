import * as twgl from 'twgl.js';
import { CONFIG } from '../config.js';

const m4 = twgl.m4;

// Estado persistente da câmera entre frames (para suavização). Criado uma vez.
export function createCameraState() {
	return { eye: null, target: null };
}

// Interpola linearmente cada componente de a até b por t (limitado a 1).
function lerp3(a, b, t) {
	const k = Math.min(1, t);
	return [
		a[0] + (b[0] - a[0]) * k,
		a[1] + (b[1] - a[1]) * k,
		a[2] + (b[2] - a[2]) * k,
	];
}

// Constrói as matrizes de projeção e visão. `state` mantém o eye/target
// suavizados entre frames; `deltaTime` controla a velocidade da suavização.
export function createCameraMatrices(gl, scene, input, state, deltaTime) {
	const aspect = gl.canvas.width / Math.max(1, gl.canvas.height);
	const projection = m4.perspective(
		CONFIG.camera.fov,
		aspect,
		CONFIG.camera.near,
		CONFIG.camera.far,
	);

	const zeppelin = scene.zeppelin;
	const p = zeppelin.position;
	const cam = CONFIG.camera;

	let desiredEye;
	let desiredTarget = [p[0], p[1], p[2]];

	if (input.cameraMode === 1) {
		// Modo 1: vista superior em 3/4 — alta e atrás do zeppelin.
		desiredEye = [p[0], p[1] + cam.topHeight, p[2] + cam.topBack];
	} else if (input.cameraMode === 2) {
		// Modo 2: 4 vistas laterais elevadas.
		const d = cam.sideDistance;
		const h = cam.sideHeight;
		const side = input.sideCameraIndex;
		if (side === 0) desiredEye = [p[0] + d, p[1] + h, p[2]];
		else if (side === 1) desiredEye = [p[0] - d, p[1] + h, p[2]];
		else if (side === 2) desiredEye = [p[0], p[1] + h, p[2] + d];
		else desiredEye = [p[0], p[1] + h, p[2] - d];
	} else {
		// Modo 3: chase cam — atrás do zeppelin, seguindo seu rumo.
		// "atrás" = sentido oposto à frente do zeppelin (frente = +X local).
		const back = -1;
		const fx = Math.cos(zeppelin.rotationY);
		const fz = -Math.sin(zeppelin.rotationY);
		desiredEye = [
			p[0] + back * fx * cam.chaseDistance,
			p[1] + cam.chaseHeight,
			p[2] + back * fz * cam.chaseDistance,
		];
	}

	// Suavização: na primeira chamada, "salta" para a posição desejada.
	if (!state.eye) {
		state.eye = desiredEye;
		state.target = desiredTarget;
	} else {
		const t = cam.smooth * deltaTime;
		state.eye = lerp3(state.eye, desiredEye, t);
		state.target = lerp3(state.target, desiredTarget, t);
	}

	const camera = m4.lookAt(state.eye, state.target, [0, 1, 0]);
	return { projection, view: m4.inverse(camera), eye: state.eye };
}
