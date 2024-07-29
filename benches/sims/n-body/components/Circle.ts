import { defineComponent } from '@bitecs/core';

export const Circle = defineComponent({
	store: () => ({
		radius: [] as number[],
	}),
});
