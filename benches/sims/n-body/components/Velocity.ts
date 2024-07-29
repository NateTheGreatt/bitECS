import { defineComponent } from '@bitecs/core';

export const Velocity = defineComponent({
	store: () => ({
		x: [] as number[],
		y: [] as number[],
	}),
});
