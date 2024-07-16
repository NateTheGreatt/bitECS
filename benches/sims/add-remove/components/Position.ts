import { defineComponent, onRemove } from '@bitecs/classic';

export const Position = defineComponent(() => ({
	x: [] as number[],
	y: [] as number[],
	z: [] as number[],
}));

onRemove(Position, (world, store, eid, reset) => {
	if (reset) {
		delete store.x[eid];
		delete store.y[eid];
		delete store.z[eid];
	}
});
