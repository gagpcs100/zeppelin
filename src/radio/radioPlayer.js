import { clamp } from '../utils/helpers.js';

export function createRadioPlayer(audio, onChange) {
	const state = {
		stations: [],
		index: 0,
		playing: false,
		volume: audio.volume,
		status: 'loading', // 'loading' | 'ready' | 'error'
	};

	function notify() {
		onChange({ ...state, current: state.stations[state.index] || null });
	}

	function applySrc() {
		const st = state.stations[state.index];
		if (st) audio.src = st.url;
	}

	audio.addEventListener('error', () => {
		if (state.status === 'ready' && state.stations.length > 1) next();
	});

	function loadStations(list) {
		state.stations = list;
		state.index = 0;
		state.status = list.length ? 'ready' : 'error';
		applySrc();
		notify();
	}

	function setError() {
		state.status = 'error';
		notify();
	}

	async function toggle() {
		if (state.status !== 'ready') return;
		if (state.playing) {
			audio.pause();
			state.playing = false;
		} else {
			try {
				await audio.play();
				state.playing = true;
			} catch {
				state.playing = false;
			}
		}
		notify();
	}

	function next() {
		if (!state.stations.length) return;
		state.index = (state.index + 1) % state.stations.length;
		applySrc();
		if (state.playing) audio.play().catch(() => {});
		notify();
	}

	function setVolume(v) {
		state.volume = clamp(v, 0, 1);
		audio.volume = state.volume;
		notify();
	}

	return { state, loadStations, setError, toggle, next, setVolume };
}
