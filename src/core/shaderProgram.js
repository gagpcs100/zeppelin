import * as twgl from 'twgl.js';

import phongVertexShader from '../shaders/phong.vert?raw';
import phongFragmentShader from '../shaders/phong.frag?raw';

import skyboxVertexShader from '../shaders/skybox.vert?raw';
import skyboxFragmentShader from '../shaders/skybox.frag?raw';

export function createProgramInfos(gl) {
	// A TWGL cria buffers com nomes como position, normal e texcoord.
	// Os shaders usam a_position, a_normal e a_texcoord.
	// Essa linha conecta esses dois padrões.
	twgl.setAttributePrefix('a_');

	return {
		phong: twgl.createProgramInfo(gl, [
			phongVertexShader,
			phongFragmentShader,
		]),
		skybox: twgl.createProgramInfo(gl, [
			skyboxVertexShader,
			skyboxFragmentShader,
		]),
	};
}
