import { defineComponent } from '@bitecs/core';

export const Mass = defineComponent({
	store: () => new Array<{ value: number }>(),
});
