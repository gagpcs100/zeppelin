import { CONFIG } from '../config.js';
import { getNightFactor } from './dayCycle.js';

// Monta, por frame, a lista de luzes pontuais da cena e a "achata" em arrays
// prontos para os uniformes do shader Phong. Cada luz tem o formato:
//   { pos:[x,y,z], color:[r,g,b], range, dir:[x,y,z], cosCutoff }
// cosCutoff < 0 → luz omni (sem cone); >= 0 → spotlight (cos do meio-ângulo).

// Postes: cor já vem "baked" (lampColor × lampIntensity) em scene.lamps; aqui
// só escala pelo nightFactor (apagam de dia) e marca como omni.
export function buildLampLights(lamps, nightFactor) {
	return lamps.map((lamp) => ({
		pos: lamp.position,
		color: lamp.color.map((c) => c * nightFactor),
		range: lamp.range,
		dir: [0, 0, 0],
		cosCutoff: -1,
	}));
}

// Farol: spotlight preso à frente-e-abaixo do zeppelin, apontando na direção
// de voo e ligeiramente para baixo. Como os postes, escala pelo nightFactor —
// apaga de dia, acende à noite.
export function buildHeadlight(zeppelin, cfg, nightFactor) {
	const fwd = [
		Math.cos(zeppelin.rotationY),
		0,
		-Math.sin(zeppelin.rotationY),
	];
	const pos = [
		zeppelin.position[0] + fwd[0] * cfg.forward,
		zeppelin.position[1] - cfg.down,
		zeppelin.position[2] + fwd[2] * cfg.forward,
	];
	const dir = normalize3([fwd[0], -0.7, fwd[2]]); // frente + baixo
	return {
		pos,
		color: cfg.color.map((c) => c * cfg.intensity * nightFactor),
		range: cfg.range,
		dir,
		cosCutoff: cfg.cosCutoff,
	};
}

// Achata as luzes em Float32Arrays de tamanho fixo (max), zero-preenchidos.
export function flattenLights(lights, max) {
	const count = Math.min(lights.length, max);
	const pos = new Float32Array(3 * max);
	const color = new Float32Array(3 * max);
	const range = new Float32Array(max);
	const dir = new Float32Array(3 * max);
	const cosCutoff = new Float32Array(max);

	for (let i = 0; i < count; i++) {
		const l = lights[i];
		pos.set(l.pos, i * 3);
		color.set(l.color, i * 3);
		dir.set(l.dir, i * 3);
		range[i] = l.range;
		cosCutoff[i] = l.cosCutoff;
	}
	return { count, pos, color, range, dir, cosCutoff };
}

// Integração: combina postes (gated por nightFactor) + farol do zeppelin.
export function assembleLights(scene, nightFactor) {
	const lamps = buildLampLights(scene.lamps, nightFactor);
	const headlight = buildHeadlight(
		scene.zeppelin,
		CONFIG.lights.headlight,
		nightFactor,
	);
	return flattenLights([...lamps, headlight], CONFIG.lights.maxPointLights);
}

function normalize3(v) {
	const len = Math.hypot(v[0], v[1], v[2]) || 1;
	return [v[0] / len, v[1] / len, v[2] / len];
}
