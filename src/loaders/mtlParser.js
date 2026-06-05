// Parser de arquivos .mtl (Wavefront Material). Suporta:
//   newmtl <nome>          início de um material
//   Ka/Kd/Ks r g b         cores ambiente/difusa/especular
//   Ns <float>             expoente de brilho (shininess)
//   d <float>              opacidade (1 = opaco)
//   map_Kd <arquivo>       textura difusa (nome pode conter espaços)
// Linhas desconhecidas (illum, Ni, bump, Tf, Tr, map_Ka, #) são ignoradas.
//
// Regra importante: se o material tem textura (map_Kd), a cor difusa é
// forçada para branco. Vários exportadores gravam Kd preto junto da textura;
// como o shader faz cor = textura * diffuse, Kd preto zeraria o modelo.
export function parseMtl(text) {
	const materials = {};
	let current = null;

	for (const rawLine of text.split('\n')) {
		const line = rawLine.trim();
		if (line.length === 0 || line.startsWith('#')) continue;

		const firstSpace = line.indexOf(' ');
		if (firstSpace < 0) continue;
		const head = line.slice(0, firstSpace);
		const rest = line.slice(firstSpace + 1).trim();

		if (head === 'newmtl') {
			current = makeDefaultMaterial();
			materials[rest] = current;
		} else if (!current) {
			continue;
		} else if (head === 'Ka') {
			current.ambient = parseVec3(rest);
		} else if (head === 'Kd') {
			current.diffuse = parseVec3(rest);
		} else if (head === 'Ks') {
			current.specular = parseVec3(rest);
		} else if (head === 'Ns') {
			current.shininess = parseFloat(rest);
		} else if (head === 'd') {
			current.opacity = parseFloat(rest);
		} else if (head === 'map_Kd') {
			// O resto da linha inteira é o nome do arquivo (pode ter espaços).
			current.map = rest;
		}
	}

	// Material com textura usa difuso branco (ver comentário do cabeçalho).
	for (const name of Object.keys(materials)) {
		if (materials[name].map) materials[name].diffuse = [1, 1, 1];
	}

	return materials;
}

function makeDefaultMaterial() {
	return {
		ambient: [0.2, 0.2, 0.2],
		diffuse: [0.8, 0.8, 0.8],
		specular: [1, 1, 1],
		shininess: 32,
		opacity: 1,
		map: null,
	};
}

function parseVec3(text) {
	const p = text.split(/\s+/);
	return [parseFloat(p[0]), parseFloat(p[1]), parseFloat(p[2])];
}
