import { defineComponent, onRemove } from '@bitecs/core';

export const Circle = defineComponent(() => ({
	radius: [] as number[],
}));

onRemove(Circle, (world, store, eid, reset) => {
	if (reset) {
		delete store.radius[eid];
	}
});
