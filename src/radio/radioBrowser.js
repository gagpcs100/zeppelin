// Acesso à Radio Browser API (diretório público de rádios, sem chave). Duas
// funções: normalizeStations (pura) limpa a lista crua; fetchJazzStations busca
// num servidor-espelho.

// Filtra/normaliza a lista crua de estações. Só mantém streams https (a página
// é https e o browser bloqueia áudio http por mixed-content), remove duplicatas
// por URL e limita a quantidade.
export function normalizeStations(raw, limit) {
	const seen = new Set();
	const out = [];
	for (const s of raw) {
		const url = s.url_resolved || s.url || '';
		if (!url.startsWith('https://')) continue;
		if (seen.has(url)) continue;
		seen.add(url);
		out.push({
			name: (s.name || 'Sem nome').trim(),
			url,
			country: s.countrycode || s.country || '',
			tags: s.tags || '',
		});
		if (out.length >= limit) break;
	}
	return out;
}

// Busca estações da tag configurada (jazz). Tenta cada servidor-espelho até um
// devolver estações https válidas. Lança se todos falharem (o chamador trata
// mostrando "rádio indisponível").
export async function fetchJazzStations(cfg) {
	const params = new URLSearchParams({
		hidebroken: 'true',
		order: 'clickcount',
		reverse: 'true',
		// Pega bem mais que o limite: muitas serão http e cairão no filtro.
		limit: String(cfg.stationLimit * 4),
	});
	const path = `/json/stations/bytag/${encodeURIComponent(cfg.tag)}?${params}`;

	let lastError;
	for (const server of cfg.apiServers) {
		try {
			const res = await fetch(server + path);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const raw = await res.json();
			const stations = normalizeStations(raw, cfg.stationLimit);
			if (stations.length > 0) return stations;
			throw new Error('nenhuma estação https encontrada');
		} catch (err) {
			lastError = err;
		}
	}
	throw lastError || new Error('falha ao buscar estações');
}
