import * as twgl from 'twgl.js';

export function createColorTexture(gl, rgba) {
	return twgl.createTexture(gl, {
		src: new Uint8Array(rgba),
		width: 1,
		height: 1,
		minMag: gl.NEAREST,
		wrap: gl.REPEAT,
	});
}

export function createDefaultTextures(gl) {
	return {
		grass: createColorTexture(gl, [76, 153, 57, 255]),
		road: createColorTexture(gl, [65, 65, 65, 255]),
		wall: createColorTexture(gl, [210, 205, 180, 255]),
		roof: createColorTexture(gl, [150, 45, 35, 255]),
		wood: createColorTexture(gl, [105, 70, 35, 255]),
		leaves: createColorTexture(gl, [40, 120, 45, 255]),
		metal: createColorTexture(gl, [130, 135, 140, 255]),
		glass: createColorTexture(gl, [120, 200, 255, 180]),
		black: createColorTexture(gl, [20, 20, 25, 255]),
		red: createColorTexture(gl, [170, 25, 35, 255]),
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
