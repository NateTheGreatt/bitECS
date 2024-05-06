let lastTime = 0;
let frameTime = 0;
let frameCount = 0;
let fps = 0;

export function getFPS(ref?: { current: number }) {
	const now = performance.now();
	frameTime += now - lastTime;
	lastTime = now;
	frameCount++;

	if (frameCount % 10 === 0) {
		fps = 1000 / (frameTime / 10);
		frameTime = 0;
	}

	if (ref) ref.current = fps;

	return fps;
}
