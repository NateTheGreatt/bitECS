import { defineComponent } from '@bitecs/core';

export const Acceleration = defineComponent({
	store: () => ({
		x: [] as number[],
		y: [] as number[],
	}),
});
