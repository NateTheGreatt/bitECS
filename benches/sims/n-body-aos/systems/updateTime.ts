import { World } from '../world';

export const updateTime = (world: World) => {
	const time = world.time;

	if (time.then === 0) time.then = performance.now();

	const now = performance.now();
	const delta = now - time.then;
	time.delta = delta / 100;
	time.then = now;

	return world;
};
