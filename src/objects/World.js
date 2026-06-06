import { loadObjModel } from '../loaders/objLoader.js';
import { CONFIG } from '../config.js';
import { composeTransform } from '../math/transformations.js';
import { buildHeightField } from '../utils/collision.js';

// O mundo: um único modelo .obj pronto (cidade "wild town"). Carrega o arquivo,
// centra a geometria na origem em X/Z, apoia o ponto mais baixo em Y=0 e
// aplica a escala do config. 
export async function createWorld(gl) {
	const cfg = CONFIG.world;
	const { submeshes, bounds, positions } = await loadObjModel(
		gl,
		cfg.modelPath,
		{
			textureDir: cfg.textureDir,
			keepPositions: true,
		},
	);

	const s = cfg.scale;
	const translation = [
		-((bounds.min[0] + bounds.max[0]) / 2) * s,
		-bounds.min[1] * s,
		-((bounds.min[2] + bounds.max[2]) / 2) * s,
	];

	const world = composeTransform({
		translation,
		rotation: [0, 0, 0],
		scale: [s, s, s],
	});

	// Como a transformação é só escala + translação (sem rotação), a caixa de
	// mundo sai aplicando essas duas operações a cada extremo.
	const worldBounds = {
		min: bounds.min.map((c, i) => c * s + translation[i]),
		max: bounds.max.map((c, i) => c * s + translation[i]),
	};

	// Grade de alturas em coordenadas de mundo: mesma escala+translação aplicada
	// à geometria.
	const heightField = positions
		? buildHeightField(positions, { scale: s, translation }, cfg.collision)
		: null;

	return { submeshes, world, bounds: worldBounds, heightField };
}

export function drawWorld(gl, programInfo, worldObj, commonUniforms, drawPart) {
	for (const sub of worldObj.submeshes) {
		drawPart(
			gl,
			programInfo,
			sub.bufferInfo,
			worldObj.world,
			sub.material,
			commonUniforms,
		);
	}
}
