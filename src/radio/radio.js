import { fetchJazzStations } from './radioBrowser.js';
import { createRadioPlayer } from './radioPlayer.js';
import { createRadioPanel } from './radioPanel.js';

export function setupRadio(cfg) {
	const audio = new Audio();
	audio.preload = 'none';
	audio.volume = cfg.defaultVolume;

	let panel;
	const player = createRadioPlayer(audio, (state) => panel.update(state));

	panel = createRadioPanel({
		onToggle: () => player.toggle(),
		onNext: () => player.next(),
		onVolume: (v) => player.setVolume(v),
		onRetry: () => load(),
	});

	panel.update({ ...player.state, status: 'loading', current: null });

	async function load() {
		player.state.status = 'loading';
		panel.update({ ...player.state, current: null });
		try {
			const stations = await fetchJazzStations(cfg);
			player.loadStations(stations);
		} catch (err) {
			console.warn('Rádio: falha ao buscar estações:', err);
			player.setError();
		}
	}

	setupRadioKeys(player, cfg);
	load();

	return player;
}

// Atalhos próprios da rádio (listener separado de input.js para manter o módulo autocontido). 
function setupRadioKeys(player, cfg) {
	window.addEventListener('keydown', (event) => {
		switch (event.code) {
			case 'KeyR':
				if (event.repeat) return;
				player.toggle();
				break;
			case 'Period':
				if (event.repeat) return;
				player.next();
				break;
			case 'Equal':
				player.setVolume(player.state.volume + cfg.volumeStep);
				break;
			case 'Minus':
				player.setVolume(player.state.volume - cfg.volumeStep);
				break;
		}
	});
}
