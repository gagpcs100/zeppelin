// Constantes globais do projeto
export const CONFIG = {
	canvasId: 'glcanvas',

	world: {
		modelPath: '/models/cenario/OBJ/wild town/wild town.obj',
		textureDir: '/models/cenario/OBJ/wild town/Maps',
		scale: 0.15, // modelo cru ~11977×1646×6944 → ~1198×247×694 unidades
		collision: { cellSize: 4 },
	},

	zeppelin: {
		startPosition: [0, 40, 0],
		speed: 22, // m/s no plano XZ (mundo maior pede mais velocidade)
		turnSpeed: 1.6, // rad/s — usado pelo teclado
		verticalSpeed: 12, // m/s em Y
		propellerSpeed: 16, // rad/s — rotação contínua da hélice
		minHeight: 6,
		maxHeight: 180,
		buildingClearance: 8, // folga acima dos telhados E margem do bloqueio lateral contra os prédios
		// Meia-extensão do corpo, para amostrar a colisão em vários pontos (nariz,
		// cauda e laterais) e não só no centro — o corpo do zeppelin é alongado.
		bodyHalfLength: 14, // ~metade do comprimento (nariz↔cauda) em unidades de mundo
		bodyHalfWidth: 5, // ~metade da largura (lateral)
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

	// Mouse: o cursor longe do centro do canvas vira curva (eixo X) e
	// subida/descida (eixo Y). A zona morta central evita deriva com o cursor
	// quase parado no meio da tela.
	mouse: {
		deadZone: 0.08, 
	},

	// Ciclo dia/noite: o tempo avança sozinho (um ciclo completo a cada
	// `cycleSeconds`). A tecla T salta entre dia e noite. 
	dayCycle: {
		cycleSeconds: 300, // 5 minutos para um ciclo completo (dia + noite)
		startTime: 0.34, // 0=meia-noite, 0.25=amanhecer, 0.5=meio-dia, 0.75=entardecer
	},

	// Luzes pontuais: postes espalhados pela cidade (acendem à noite) e um
	// farol (spotlight) preso ao zeppelin.
	lights: {
		maxPointLights: 12,
		lampHeight: 6, // altura do poste acima da superfície (m)
		lampRange: 70, // alcance da luz do poste (m)
		lampColor: [1.0, 0.75, 0.4], // luz quente
		lampIntensity: 1.3,
		lampMarkerSize: 1.5, // raio da esferinha emissiva que marca o poste
		lampPositions: [
			// XZ no mundo (~1198×694, centrado na origem)
			[-300, -150],
			[-100, -200],
			[120, -120],
			[320, -180],
			[-280, 160],
			[-60, 90],
			[180, 170],
			[340, 120],
		],
		headlight: {
			range: 90,
			color: [1.0, 0.97, 0.85],
			intensity: 2.5,
			cosCutoff: 0.86, // cos do meio-ângulo do cone (~30°)
			forward: 18, // deslocamento à frente do centro do zeppelin
			down: 4, // deslocamento para baixo
		},
	},

	// Blob shadow: disco translúcido sob o zeppelin (ver src/objects/Shadow.js).
	shadow: {
		baseSize: 26, // tamanho do disco junto ao solo
		maxSize: 60, // tamanho máximo quando voando alto
		baseAlpha: 0.45,
		epsilon: 0.5, // folga acima da superfície para não dar z-fighting
	},

	// Rádio do zeppelin: toca jazz de um diretório público de rádios de
	// internet (Radio Browser API, sem chave).
	radio: {
		apiServers: [
			'https://de1.api.radio-browser.info',
			'https://nl1.api.radio-browser.info',
		],
		tag: 'jazz',
		stationLimit: 40,
		defaultVolume: 0.6,
		volumeStep: 0.1,
	},
};
