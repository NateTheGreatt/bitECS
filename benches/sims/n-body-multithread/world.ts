import { TODO, createWorld, World as IWorld } from '@bitecs/classic';

export type World = IWorld & {
	workers: Record<string, Worker[]>;
	time: {
		then: number;
		delta: number;
	};
};

export const world = createWorld({
	workers: {},
	time: {
		then: performance.now(),
		delta: 0,
	},
} as TODO);
