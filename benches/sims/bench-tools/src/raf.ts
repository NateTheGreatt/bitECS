const callbacks: ((...args: any[]) => any)[] = [];
const fpsInterval = 1000 / 60;
let time = performance.now();

function requestAnimationFrameLoop() {
	const now = performance.now();
	const delta = now - time;
	if (delta >= fpsInterval) {
		// Adjust next execution time in case this loop took longer to execute
		time = now - (delta % fpsInterval);
		// Clone array in case callbacks pushes more functions to it
		const funcs = callbacks.slice();
		callbacks.length = 0;
		for (let i = 0; i < funcs.length; i++) {
			funcs[i] && funcs[i](now, delta);
		}
	} else {
		setImmediate(requestAnimationFrameLoop);
	}
}

export function requestAnimationFrame(func: (...args: any[]) => any) {
	if (typeof window !== 'undefined' && window.requestAnimationFrame) {
		return window.requestAnimationFrame(func);
	} else {
		callbacks.push(func);
		if (callbacks.length === 1) {
			setImmediate(requestAnimationFrameLoop);
		}
		return callbacks.length - 1;
	}
}

export function cancelAnimationFrame(id: number) {
	callbacks[id] = undefined as any;
}
