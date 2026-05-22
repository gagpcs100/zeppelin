import * as twgl from 'twgl.js';

// Textura de 1x1 pixel de cor sólida. Barata e suficiente para peças simples
// (a hélice procedural do zeppelin) que não precisam de imagem real.
export function createColorTexture(gl, rgba) {
	return twgl.createTexture(gl, {
		src: new Uint8Array(rgba),
		width: 1,
		height: 1,
		minMag: gl.NEAREST,
		wrap: gl.REPEAT,
	});
}

// Texturas usadas pelos objetos gerados em código. Hoje só a hélice precisa
// delas (corpo do zeppelin e mundo vêm de .obj com texturas próprias).
export function createDefaultTextures(gl) {
	return {
		metal: createColorTexture(gl, [150, 150, 158, 255]),
		black: createColorTexture(gl, [20, 20, 25, 255]),
	};
}

export async function loadTexture(gl, url) {
	return twgl.createTexture(gl, {
		src: url,
		flipY: true,
		minMag: gl.LINEAR,
		wrap: gl.REPEAT,
	});
}
