import { defineComponent } from '@bitecs/core';

export const Position = defineComponent({
	store: () => new Array<{ x: number; y: number }>(),
});
