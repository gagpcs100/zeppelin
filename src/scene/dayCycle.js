import { CONFIG } from "../config.js";

// Ciclo dia/noite. Tudo gira em torno de `timeOfDay` ∈ [0,1):
//   0.00 meia-noite · 0.25 amanhecer · 0.50 meio-dia · 0.75 entardecer.
// O tempo avança sozinho; a tecla T salta entre dia e noite. As funções
// `getLighting`, `getSkyColors` e `getCelestial` derivam tudo o que a cena
// precisa (luz, cores do céu, posição do sol/lua) a partir desse único valor.

// Cores-chave por horário. Entre dois keyframes os valores são interpolados
// linearmente; a tabela "dá a volta" (após o último volta ao primeiro).
const KEYFRAMES = [
	// t,    zênite (céu alto),       horizonte (céu baixo),   luz difusa,             ambiente
	{ t: 0.0,  zenith: [0.02, 0.03, 0.09], horizon: [0.06, 0.07, 0.15], diffuse: [0.20, 0.24, 0.42], ambient: [0.07, 0.08, 0.14] }, // noite
	{ t: 0.22, zenith: [0.07, 0.08, 0.18], horizon: [0.18, 0.14, 0.24], diffuse: [0.32, 0.32, 0.46], ambient: [0.11, 0.11, 0.17] }, // pré-amanhecer
	{ t: 0.30, zenith: [0.33, 0.40, 0.62], horizon: [0.95, 0.53, 0.30], diffuse: [0.90, 0.58, 0.38], ambient: [0.24, 0.22, 0.24] }, // amanhecer
	{ t: 0.50, zenith: [0.22, 0.45, 0.82], horizon: [0.66, 0.80, 0.96], diffuse: [0.82, 0.80, 0.72], ambient: [0.30, 0.31, 0.34] }, // meio-dia
	{ t: 0.70, zenith: [0.31, 0.33, 0.58], horizon: [0.97, 0.45, 0.24], diffuse: [0.88, 0.54, 0.34], ambient: [0.24, 0.21, 0.23] }, // entardecer
	{ t: 0.78, zenith: [0.08, 0.09, 0.20], horizon: [0.22, 0.14, 0.24], diffuse: [0.34, 0.30, 0.44], ambient: [0.12, 0.12, 0.18] }, // crepúsculo
];

export function createDayCycle() {
	return { timeOfDay: CONFIG.dayCycle.startTime, tWasDown: false };
}

export function updateDayCycle(cycle, input, deltaTime) {
	cycle.timeOfDay = (cycle.timeOfDay + deltaTime / CONFIG.dayCycle.cycleSeconds) % 1;

	// Tecla T (disparo único por toque): se é dia, salta para a meia-noite;
	// se é noite, salta para o meio-dia.
	const tDown = input.keys.has("KeyT");
	if (tDown && !cycle.tWasDown) {
		const isDay = cycle.timeOfDay > 0.25 && cycle.timeOfDay < 0.75;
		cycle.timeOfDay = isDay ? 0.0 : 0.5;
	}
	cycle.tWasDown = tDown;
}

// Luz direcional do frame: direção, ambiente, difusa e especular.
export function getLighting(timeOfDay) {
	const s = sampleKeyframes(timeOfDay);
	const sun = getSunDirection(timeOfDay);
	// A luz vem do sol enquanto ele está acima do horizonte; à noite, da lua
	// (lado oposto). Em ambos os casos a cor já vem dos keyframes.
	const source = sun[1] >= 0 ? sun : [-sun[0], -sun[1], -sun[2]];
	return {
		direction: [-source[0], -source[1], -source[2]], // sentido em que a luz viaja
		ambient: s.ambient,
		diffuse: s.diffuse,
		specular: s.diffuse.map((c) => c * 0.4 + 0.4), // brilho especular puxado p/ branco
	};
}

// Cores do céu (gradiente do skybox) para o horário.
export function getSkyColors(timeOfDay) {
	const s = sampleKeyframes(timeOfDay);
	return { zenith: s.zenith, horizon: s.horizon };
}

// Direção e visibilidade do sol e da lua (vetores unitários no céu).
export function getCelestial(timeOfDay) {
	const sun = getSunDirection(timeOfDay);
	const moon = [-sun[0], -sun[1], -sun[2]];
	return {
		sun: { dir: sun, visible: sun[1] > -0.15 },
		moon: { dir: moon, visible: moon[1] > -0.15 },
	};
}

// Posição do sol no céu como vetor unitário. Nasce no leste (amanhecer),
// passa pelo zênite (meio-dia) e se põe no oeste (entardecer).
export function getSunDirection(timeOfDay) {
	const theta = (timeOfDay - 0.25) * 2 * Math.PI;
	return normalize3([Math.cos(theta), Math.sin(theta), 0.32]);
}

// --- auxiliares internos -------------------------------------------------

function sampleKeyframes(t) {
	const kf = KEYFRAMES;
	for (let i = 0; i < kf.length; i++) {
		const a = kf[i];
		const next = kf[(i + 1) % kf.length];
		const aT = a.t;
		const bT = i + 1 < kf.length ? next.t : next.t + 1; // o último "dá a volta"
		if (t >= aT && t < bT) {
			const k = (t - aT) / (bT - aT);
			return {
				zenith: lerp3(a.zenith, next.zenith, k),
				horizon: lerp3(a.horizon, next.horizon, k),
				diffuse: lerp3(a.diffuse, next.diffuse, k),
				ambient: lerp3(a.ambient, next.ambient, k),
			};
		}
	}
	// t antes do primeiro keyframe (faixa [0, kf[0].t)): interpola do último
	// (que "deu a volta") para o primeiro.
	const last = kf[kf.length - 1];
	const first = kf[0];
	const k = (t + 1 - last.t) / (first.t + 1 - last.t);
	return {
		zenith: lerp3(last.zenith, first.zenith, k),
		horizon: lerp3(last.horizon, first.horizon, k),
		diffuse: lerp3(last.diffuse, first.diffuse, k),
		ambient: lerp3(last.ambient, first.ambient, k),
	};
}

function lerp3(a, b, k) {
	return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

function normalize3(v) {
	const len = Math.hypot(v[0], v[1], v[2]) || 1;
	return [v[0] / len, v[1] / len, v[2] / len];
}
