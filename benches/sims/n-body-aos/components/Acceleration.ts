import { Types, defineComponent } from '@bitecs/core';

export const Acceleration = defineComponent({
	store: () => new Array<{ x: number; y: number }>(),
});
