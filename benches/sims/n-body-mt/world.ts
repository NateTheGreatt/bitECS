import { createWorld, enableBufferedQueries } from '@bitecs/classic';

export type World = typeof world;

export const world = enableBufferedQueries(
	createWorld({
		workers: {} as Record<string, Worker[]>,
		time: {
			then: performance.now(),
			delta: 0,
		},
	})
);
