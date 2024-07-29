import { defineComponent } from '@bitecs/core';

export const Color = defineComponent({
	store: () => ({
		r: [] as number[],
		g: [] as number[],
		b: [] as number[],
		a: [] as number[],
	}),
});
