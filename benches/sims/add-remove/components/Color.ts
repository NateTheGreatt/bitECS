import { defineComponent, onRemove } from '@bitecs/classic';

export const Color = defineComponent(() => ({
	r: [] as number[],
	g: [] as number[],
	b: [] as number[],
	a: [] as number[],
}));

onRemove(Color, (world, store, eid, reset) => {
	if (reset) {
		delete store.r[eid];
		delete store.g[eid];
		delete store.b[eid];
		delete store.a[eid];
	}
});
