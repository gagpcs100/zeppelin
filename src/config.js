// Constantes globais do projeto. Centralizar aqui evita "números mágicos"
// espalhados pelo código e facilita ajustes finos (tamanho do mundo, FOV,
// velocidades) em um único lugar.
export const CONFIG = {
	canvasId: 'glcanvas',

	// Mundo: um único modelo .obj pronto (cidade "wild town"). O World.js
	// carrega, centra na origem, apoia no chão (Y=0) e escala por `scale`. Os
	// limites de voo saem da bounding box resultante — não há muralhas.
	world: {
		modelPath: '/models/cenario/OBJ/wild town/wild town.obj',
		textureDir: '/models/cenario/OBJ/wild town/Maps',
		scale: 0.15, // modelo cru ~11977×1646×6944 → ~1198×165×694 unidades
	},

	zeppelin: {
		startPosition: [0, 40, 0],
		speed: 22, // m/s no plano XZ (mundo maior pede mais velocidade)
		turnSpeed: 1.6, // rad/s — usado pelo teclado
		verticalSpeed: 12, // m/s em Y
		propellerSpeed: 16, // rad/s — rotação contínua da hélice
		minHeight: 6,
		maxHeight: 180,
		accelEase: 2.5, // suavização da aceleração (maior = resposta mais rápida)
	},

	camera: {
		fov: Math.PI / 4,
		near: 0.1,
		far: 1400, // mundo maior → plano distante mais longe
		topHeight: 95,
		topBack: 78,
		sideDistance: 48,
		sideHeight: 18,
		chaseDistance: 38, // câmera 3: distância atrás do zeppelin
		chaseHeight: 14, // câmera 3: altura acima do zeppelin
		smooth: 5.0, // fator de suavização (lerp) das câmeras que seguem
	},

	mouse: {
		turnRate: 1.9, // rad/s de curva com o cursor no canto da tela
		climbRate: 14, // m/s de subida/descida com o cursor no topo/base
		deadZone: 0.08, // fração central da tela sem resposta
	},

	// Ciclo dia/noite: o tempo avança sozinho (um ciclo completo a cada
	// `cycleSeconds`). A tecla T salta entre dia e noite. As cores da luz e
	// do céu por horário ficam em src/scene/dayCycle.js.
	dayCycle: {
		cycleSeconds: 300, // 5 minutos para um ciclo completo (dia + noite)
		startTime: 0.34, // 0=meia-noite, 0.25=amanhecer, 0.5=meio-dia, 0.75=entardecer
	},
};
