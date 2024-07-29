import { defineComponent } from '@bitecs/core';

export const Velocity = defineComponent({
	store: () => new Array<{ x: number; y: number }>(),
});
