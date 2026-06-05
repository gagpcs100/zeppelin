import * as twgl from 'twgl.js';

const m4 = twgl.m4;

// Skybox: cubo enorme desenhado a partir do interior. Para criar a ilusão
// de "infinito", desenhamos sem escrever no depth buffer e zeramos a parte
// de translação da matriz de visão, fazendo o cubo girar com a câmera mas
// nunca aproximar/afastar do observador.
export function createSkybox(gl) {
	return {
		bufferInfo: twgl.primitives.createCubeBufferInfo(gl, 1),
	};
}

export function drawSkybox(gl, programInfo, skybox, camera, skyColors) {
	// Sem escrita no depth buffer: tudo desenhado depois cobre o skybox.
	gl.depthMask(false);
	// O cubo é renderizado de dentro; precisamos ver as faces internas.
	gl.disable(gl.CULL_FACE);

	gl.useProgram(programInfo.program);

	// View sem translação: zera a 4ª coluna (componentes de translação).
	// Assim a câmera está "no centro" do cubo independente da posição real.
	const viewNoTranslation = m4.copy(camera.view);
	viewNoTranslation[12] = 0;
	viewNoTranslation[13] = 0;
	viewNoTranslation[14] = 0;

	twgl.setBuffersAndAttributes(gl, programInfo, skybox.bufferInfo);

	twgl.setUniforms(programInfo, {
		u_world: m4.identity(),
		u_view: viewNoTranslation,
		u_projection: camera.projection,
		// Cores do gradiente do céu — variam com o horário (ver dayCycle.js).
		u_skyZenith: skyColors.zenith,
		u_skyHorizon: skyColors.horizon,
	});

	twgl.drawBufferInfo(gl, skybox.bufferInfo);

	// Restaura estado padrão do pipeline.
	gl.depthMask(true);
	gl.enable(gl.CULL_FACE);
}
