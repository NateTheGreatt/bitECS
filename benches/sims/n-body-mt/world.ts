import { createWorld, World as IWorld, enableBufferedQueries } from '@bitecs/classic';

export type World = IWorld & {
	workers: Record<string, Worker[]>;
	time: {
		then: number;
		delta: number;
	};
};

export const world = enableBufferedQueries(
	createWorld({
		workers: {},
		time: {
			then: performance.now(),
			delta: 0,
		},
	})
);
