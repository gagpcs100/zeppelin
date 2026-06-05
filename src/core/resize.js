export function resizeCanvasToDisplaySize(canvas) {
	const displayWidth = Math.floor(
		canvas.clientWidth * window.devicePixelRatio,
	);
	const displayHeight = Math.floor(
		canvas.clientHeight * window.devicePixelRatio,
	);

	if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
		canvas.width = displayWidth;
		canvas.height = displayHeight;
		return true;
	}

	return false;
}
