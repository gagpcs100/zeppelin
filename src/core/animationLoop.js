export function startAnimationLoop(callback) {
	let lastTime = 0;

	function frame(time) {
		const seconds = time * 0.001;
		const deltaTime = Math.min(seconds - lastTime, 0.05);
		lastTime = seconds;

		callback(deltaTime, seconds);
		requestAnimationFrame(frame);
	}

	requestAnimationFrame(frame);
}
