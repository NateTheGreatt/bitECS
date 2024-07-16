import { defineComponent, onRemove } from '@bitecs/classic';

export const Mass = defineComponent(() => ({
	value: [] as number[],
}));

onRemove(Mass, (world, store, eid, reset) => {
	if (reset) {
		delete store.value[eid];
	}
});
