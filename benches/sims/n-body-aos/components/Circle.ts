import { defineComponent } from '@bitecs/core';

export const Circle = defineComponent({
	store: () => new Array<{ radius: number }>(),
});
