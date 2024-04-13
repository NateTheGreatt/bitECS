import { createWorld, World as IWorld } from '@bitecs/classic';

export type World = IWorld & {
	time: {
		then: number;
		delta: number;
	};
};

export const world = createWorld({
	time: {
		then: performance.now(),
		delta: 0,
	},
});
