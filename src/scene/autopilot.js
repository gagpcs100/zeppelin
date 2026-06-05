import { CONFIG } from '../config.js';
import { clamp } from '../utils/helpers.js';

// Piloto automático: dá um tour pelo mundo numa órbita elíptica derivada da
// bounding box do mundo. Não mexe direto na posição do zeppelin — devolve
// comandos de voo { turn, climb, throttle }, os mesmos do jogador, de modo
// que toda a física (banking, pitch, hélice, colisão) continue num só lugar.

const ORBIT_FACTOR = 0.7; // raio da órbita em fração do semi-eixo do mundo
const LOOK_AHEAD = 0.18; // quão à frente, em radianos, fica o ponto-alvo
const TOUR_HEIGHT = 115; // altura média do tour
const TOUR_WAVE = 35; // amplitude da onda de altura (sobe/desce)
const TURN_GAIN = 2.2; // ganho da correção de rumo
const CLIMB_GAIN = 0.05; // ganho da correção de altura

export function createAutopilot() {
	return { active: false, angle: 0, pWasDown: false };
}

// Avança o piloto automático e devolve os comandos de voo quando ligado, ou
// `null` quando desligado (aí quem manda é o jogador). A tecla P alterna.
export function updateAutopilot(
	autopilot,
	zeppelin,
	worldBounds,
	input,
	deltaTime,
) {
	const pDown = input.keys.has('KeyP');
	if (pDown && !autopilot.pWasDown) {
		autopilot.active = !autopilot.active;
		// Ao ligar, começa a órbita no ângulo atual do zeppelin para não dar
		// um solavanco — ele entra na rota suavemente.
		if (autopilot.active)
			autopilot.angle = currentAngle(zeppelin, worldBounds);
	}
	autopilot.pWasDown = pDown;

	if (!autopilot.active) return null;

	return steerAlongOrbit(autopilot, zeppelin, worldBounds, deltaTime);
}

// --- auxiliares internos -------------------------------------------------

function orbit(worldBounds) {
	return {
		cx: (worldBounds.min[0] + worldBounds.max[0]) / 2,
		cz: (worldBounds.min[2] + worldBounds.max[2]) / 2,
		rx: ((worldBounds.max[0] - worldBounds.min[0]) / 2) * ORBIT_FACTOR,
		rz: ((worldBounds.max[2] - worldBounds.min[2]) / 2) * ORBIT_FACTOR,
	};
}

// Ângulo da posição atual do zeppelin em relação ao centro da órbita.
function currentAngle(zeppelin, worldBounds) {
	const o = orbit(worldBounds);
	return Math.atan2(zeppelin.position[2] - o.cz, zeppelin.position[0] - o.cx);
}

function steerAlongOrbit(autopilot, zeppelin, worldBounds, deltaTime) {
	const o = orbit(worldBounds);

	// O ângulo da órbita avança no ritmo da própria velocidade de cruzeiro,
	// assim o ponto-alvo nunca "foge" do zeppelin.
	const avgRadius = Math.max((o.rx + o.rz) / 2, 1);
	autopilot.angle += (CONFIG.zeppelin.speed / avgRadius) * deltaTime;

	// Ponto-alvo um pouco à frente na órbita.
	const lead = autopilot.angle + LOOK_AHEAD;
	const targetX = o.cx + Math.cos(lead) * o.rx;
	const targetZ = o.cz + Math.sin(lead) * o.rz;
	const targetY = TOUR_HEIGHT + Math.sin(autopilot.angle * 2) * TOUR_WAVE;

	// Erro de rumo → curva. O "para frente" do zeppelin é (cosθ, -sinθ).
	const dx = targetX - zeppelin.position[0];
	const dz = targetZ - zeppelin.position[2];
	const desiredHeading = Math.atan2(-dz, dx);
	const headingError = wrapAngle(desiredHeading - zeppelin.rotationY);
	const turn = clamp(headingError * TURN_GAIN, -1, 1);

	// Erro de altura → sobe/desce.
	const climb = clamp((targetY - zeppelin.position[1]) * CLIMB_GAIN, -1, 1);

	return { turn, climb, throttle: 1 };
}

// Normaliza um ângulo para a faixa [-π, π].
function wrapAngle(a) {
	return Math.atan2(Math.sin(a), Math.cos(a));
}
