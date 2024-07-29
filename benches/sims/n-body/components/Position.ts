import { defineComponent } from '@bitecs/core';

export const Position = defineComponent({
	store: () => ({
		x: [] as number[],
		y: [] as number[],
	}),
});
