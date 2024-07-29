import { defineComponent } from '@bitecs/core';

export const Mass = defineComponent({
	store: () => ({
		value: [] as number[],
	}),
});
