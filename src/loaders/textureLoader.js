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

// Texturas usadas pelos objetos gerados em código. 
export function createDefaultTextures(gl) {
	return {
		metal: createColorTexture(gl, [150, 150, 158, 255]),
		black: createColorTexture(gl, [20, 20, 25, 255]),
	};
}
