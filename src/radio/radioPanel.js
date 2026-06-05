// Painel HTML sobreposto da rádio. Sem framework: cria os nós, liga os handlers
// e expõe update(state) para refletir o estado do player. handlers =
// { onToggle, onNext, onVolume, onRetry }.
export function createRadioPanel(handlers) {
	const root = document.createElement('div');
	root.style.cssText = [
		'position:fixed',
		'right:16px',
		'top:16px',
		'z-index:10',
		'font-family:Arial, sans-serif',
		'color:#fff',
		'background:rgba(15,18,28,0.78)',
		'border:1px solid rgba(255,255,255,0.12)',
		'border-radius:12px',
		'padding:10px 12px',
		'min-width:220px',
		'max-width:280px',
		'user-select:none',
		'box-shadow:0 6px 20px rgba(0,0,0,0.35)',
	].join(';');

	const title = document.createElement('div');
	title.textContent = '📻 Rádio Zeppelin';
	title.style.cssText =
		'font-weight:bold;font-size:13px;margin-bottom:4px;opacity:0.9';

	const info = document.createElement('div');
	info.style.cssText =
		'font-size:12px;margin-bottom:8px;white-space:nowrap;overflow:hidden;' +
		'text-overflow:ellipsis;opacity:0.85';

	const controls = document.createElement('div');
	controls.style.cssText = 'display:flex;align-items:center;gap:8px';

	const playBtn = document.createElement('button');
	const nextBtn = document.createElement('button');
	const retryBtn = document.createElement('button');
	for (const b of [playBtn, nextBtn, retryBtn]) {
		b.style.cssText =
			'cursor:pointer;border:none;border-radius:8px;' +
			'background:rgba(255,255,255,0.14);color:#fff;font-size:14px;padding:4px 10px';
	}
	playBtn.textContent = '▶';
	playBtn.title = 'Ligar/Pausar (R)';
	nextBtn.textContent = '⏭';
	nextBtn.title = 'Próxima estação (.)';
	retryBtn.textContent = '↻ tentar de novo';
	retryBtn.title = 'Buscar estações novamente';
	retryBtn.style.display = 'none';
	retryBtn.style.marginTop = '8px';

	const volIcon = document.createElement('span');
	volIcon.textContent = '🔊';
	volIcon.style.fontSize = '14px';

	const vol = document.createElement('input');
	vol.type = 'range';
	vol.min = '0';
	vol.max = '1';
	vol.step = '0.01';
	vol.title = 'Volume (- / =)';
	vol.style.cssText = 'flex:1;accent-color:#7fd1ff;cursor:pointer';

	playBtn.addEventListener('click', () => handlers.onToggle());
	nextBtn.addEventListener('click', () => handlers.onNext());
	retryBtn.addEventListener('click', () => handlers.onRetry());
	vol.addEventListener('input', () =>
		handlers.onVolume(parseFloat(vol.value)),
	);

	controls.append(playBtn, nextBtn, volIcon, vol);
	root.append(title, info, controls, retryBtn);
	document.body.appendChild(root);

	function update(state) {
		if (state.status === 'loading') {
			info.textContent = 'carregando estações…';
		} else if (state.status === 'error') {
			info.textContent = 'rádio indisponível';
		} else {
			const c = state.current;
			info.textContent = c
				? `♪ ${c.name}${c.country ? '  ·  ' + c.country : ''}`
				: '—';
		}
		playBtn.textContent = state.playing ? '⏸' : '▶';
		const ready = state.status === 'ready';
		playBtn.disabled = !ready;
		nextBtn.disabled = !ready;
		playBtn.style.opacity = ready ? '1' : '0.5';
		nextBtn.style.opacity = ready ? '1' : '0.5';
		retryBtn.style.display = state.status === 'error' ? 'block' : 'none';
		vol.value = String(state.volume);
	}

	return { update };
}
