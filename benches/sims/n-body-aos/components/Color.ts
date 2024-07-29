import { defineComponent } from '@bitecs/core';

export const Color = defineComponent({
	store: () => new Array<{ r: number; g: number; b: number; a: number }>(),
});
