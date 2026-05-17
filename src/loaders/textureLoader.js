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
		grass: twgl.createTexture(gl, { src: '/textures/grass.jpg', minMag: gl.LINEAR, wrap: gl.REPEAT }),
		road: twgl.createTexture(gl, { src: '/textures/road.jpg', minMag: gl.LINEAR, wrap: gl.REPEAT }),
		wall: twgl.createTexture(gl, { src: '/textures/stone.png', minMag: gl.LINEAR, wrap: gl.REPEAT }),
		roof: twgl.createTexture(gl, { src: '/textures/wood.png', minMag: gl.LINEAR, wrap: gl.REPEAT }),
		wood: twgl.createTexture(gl, { src: '/textures/wood.png', minMag: gl.LINEAR, wrap: gl.REPEAT }),
		leaves: createColorTexture(gl, [40, 120, 45, 255]),
		metal: twgl.createTexture(gl, { src: '/textures/metal.png', minMag: gl.LINEAR, wrap: gl.REPEAT }),
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
