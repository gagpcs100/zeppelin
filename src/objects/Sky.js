import * as twgl from "twgl.js";
import { composeTransform } from "../math/transformations.js";
import { createMaterial } from "../utils/helpers.js";
import { getCelestial } from "../scene/dayCycle.js";

const m4 = twgl.m4;

// Sol e lua: dois discos (esferas) desenhados "no infinito", como o skybox —
// a câmera gira em relação a eles, mas eles nunca se aproximam. São emissivos
// (renderizados com a iluminação desligada), então brilham sozinhos.
export function createSky(gl) {
	const sphere = twgl.primitives.createSphereBufferInfo(gl, 1, 24, 16);
	return {
		sphere,
		sunMaterial: createMaterial({ color: [1.0, 0.93, 0.55, 1] }),
		moonMaterial: createMaterial({ color: [0.86, 0.88, 0.96, 1] }),
	};
}

export function drawSky(gl, programInfo, sky, camera, timeOfDay, drawPart) {
	const { sun, moon } = getCelestial(timeOfDay);

	// View sem translação: o sol/lua acompanham só a rotação da câmera.
	const view = m4.copy(camera.view);
	view[12] = 0;
	view[13] = 0;
	view[14] = 0;

	const uniforms = {
		u_view: view,
		u_projection: camera.projection,
		u_lightingEnabled: false, // emissivo: a cor do material é a cor final
		u_fogEnabled: false,
	};

	// Sem escrita no depth buffer: o mundo (desenhado depois) cobre o céu.
	gl.depthMask(false);

	if (sun.visible) {
		drawPart(gl, programInfo, sky.sphere, bodyWorld(sun.dir, 70), sky.sunMaterial, uniforms);
	}
	if (moon.visible) {
		drawPart(gl, programInfo, sky.sphere, bodyWorld(moon.dir, 52), sky.moonMaterial, uniforms);
	}

	gl.depthMask(true);
}

// Matriz de mundo de um corpo celeste: posicionado na sua direção, a uma
// distância grande (mas dentro do plano distante da câmera), com o raio dado.
function bodyWorld(dir, radius) {
	const distance = 1000;
	return composeTransform({
		translation: [dir[0] * distance, dir[1] * distance, dir[2] * distance],
		scale: [radius, radius, radius],
	});
}
