import assert from 'assert';
import { describe, expect, test, vi } from 'vitest';
import {
	ChildOf,
	IsA,
	World,
	addEntity,
	createWorld,
	defineComponent,
	definePrefab,
	getAllEntities,
	getPrefabEid,
	getStore,
	hasComponent,
	query,
	withParams,
} from '../../src';

describe('Prefab Integration Tests', () => {
	test('should reference a prefab and inherit from it', () => {
		const world = createWorld();

		const Position = defineComponent({
			store: () => ({
				x: [] as number[],
				y: [] as number[],
			}),
		});

		const Sprite = defineComponent({
			store: () => ({
				url: [] as string[],
			}),
		});

		const Player = definePrefab({ components: [Position, Sprite] });

		const eid = addEntity(world, IsA(Player));

		assert(hasComponent(world, eid, Position));
		assert(hasComponent(world, eid, Sprite));
	});

	test('should automatically register prefabs', () => {
		const world = createWorld();

		const Human = definePrefab();
		const Player = definePrefab({ components: [IsA(Human)] });
		const Npc = definePrefab({ components: [IsA(Human)] });

		addEntity(world, IsA(Player));
		addEntity(world, IsA(Npc));

		assert(query(world, [IsA(Human)]).length === 2);
		assert(getAllEntities(world).length === 5);
	});

	test('multiple inheritance and overrides', () => {
		const Position = defineComponent({
			store: () => ({
				x: [] as number[],
				y: [] as number[],
			}),
			onSet: (world, store, eid, params?: { x: number; y: number }) => {
				store.x[eid] = params?.x ?? 0;
				store.y[eid] = params?.y ?? 0;
			},
		});

		const Health = defineComponent({
			store: () => [] as number[],
			onSet: (world, store, eid, health: number) => {
				store[eid] = health ?? 0;
			},
		});

		const Alignment = defineComponent({
			store: () => [] as string[],
			onSet: (world, store, eid, alignment: string) => {
				store[eid] = alignment ?? 'neutral';
			},
		});

		const Mana = defineComponent({
			store: () => [] as number[],
			onSet: (world, store, eid, amount: number) => {
				store[eid] = amount ?? 0;
			},
		});

		const Element = defineComponent({
			store: () => [] as string[],
			onSet: (world, store, eid, element: string) => {
				store[eid] = element;
			},
		});

		const Character = definePrefab({
			components: [Position, Health, withParams(Alignment, 'neutral')],
		});
		const Goblin = definePrefab({
			components: [IsA(Character), withParams(Health, 75), withParams(Alignment, 'evil')],
		});

		const RedGoblin = definePrefab({
			components: [IsA(Goblin), withParams(Health, 100)],
		});

		const Magick = definePrefab({ components: [Mana] });

		const Mage = definePrefab({
			components: [IsA(Magick), withParams(Mana, 35), Element],
		});

		const GoblinMage = definePrefab({
			components: [IsA(RedGoblin), IsA(Mage), withParams(Mana, 25)],
		});

		const ChaosMage = definePrefab({
			components: [IsA(GoblinMage), withParams(Element, 'chaos')],
		});

		const world = createWorld();

		const weakMage = addEntity(world, IsA(ChaosMage), withParams(Position, { x: 10, y: 10 }));
		const strongMage = addEntity(
			world,
			IsA(ChaosMage),
			withParams(Mana, 66),
			withParams(Position, { x: 20, y: 20 })
		);

		const alignment = getStore(world, Alignment);
		const mana = getStore(world, Mana);
		const element = getStore(world, Element);
		const position = getStore(world, Position);

		assert(hasComponent(world, strongMage, IsA(Character)));
		assert(hasComponent(world, strongMage, IsA(Goblin)));
		assert(hasComponent(world, strongMage, IsA(RedGoblin)));
		assert(hasComponent(world, strongMage, IsA(GoblinMage)));
		assert(hasComponent(world, strongMage, IsA(ChaosMage)));

		assert(element[weakMage] === 'chaos');
		assert(element[strongMage] === 'chaos');
		assert(alignment[weakMage] === 'evil');
		assert(alignment[strongMage] === 'evil');
		assert(mana[weakMage] === 25);
		assert(mana[strongMage] === 66);
		assert(position.x[weakMage] === 10);
		assert(position.y[weakMage] === 10);
		assert(position.x[strongMage] === 20);
		assert(position.y[strongMage] === 20);
	});

	test('nested prefabs', () => {
		type Vec3 = [number, number, number];
		const vec3Store = {
			store: () => [] as Vec3[],
			onSet: (world: World, store: Vec3[], eid: number, vec: Vec3) => {
				store[eid] = vec ?? [0, 0, 0];
			},
		};

		const Box = defineComponent(vec3Store);
		const Position = defineComponent(vec3Store);
		const Color = defineComponent(vec3Store);

		const Tree = definePrefab({ components: [Position] });
		const Trunk = definePrefab({
			components: [
				ChildOf(Tree),
				withParams(Position, [0, 0.25, 0]),
				withParams(Box, [0.4, 0.5, 0.4]),
				withParams(Color, [0.25, 0.2, 0.1]),
			],
		});

		const onAddFn = vi.fn();

		const Canopy = definePrefab({
			components: [
				ChildOf(Tree),
				withParams(Position, [0, 0.9, 0]),
				withParams(Box, [0.8, 0.8, 0.8]),
				withParams(Color, [0.25, 0.2, 0.1]),
			],
			onAdd: (world, eid) => {
				const boxes = getStore(world, Box);
				const positions = getStore(world, Position);

				const h = Math.random() + 0.8;
				boxes[eid][1] = h;
				positions[eid][1] = h / 2 + 0.5;

				onAddFn();
			},
		});

		const world = createWorld();

		const tree = addEntity(world, IsA(Tree));
		const trunks = query(world, [ChildOf(tree), IsA(Trunk)]);
		const canopies = query(world, [ChildOf(tree), IsA(Canopy)]);
		assert(trunks.length === 1);
		assert(canopies.length === 1);

		const trunk = trunks[0];
		const canopy = canopies[0];

		const boxes = getStore(world, Box);
		const positions = getStore(world, Position);

		assert(boxes[trunk][0] === 0.4);
		assert(boxes[canopy][0] === 0.8);
		assert(positions[trunk][1] === 0.25);
		expect(onAddFn).toHaveBeenCalledTimes(1);
	});

	test('should allow sharing data between prefabs and instances', () => {
		type Vec3 = [number, number, number];
		const Box = defineComponent({
			store: () => [] as Vec3[],
			onSet: (world, store, eid, vec: Vec3) => {
				store[eid] = vec ?? [0, 0, 0];
			},
		});

		const BoxPrefab = definePrefab({ components: [withParams(Box, [0, 0, 0])] });

		const world = createWorld();

		const eid = addEntity(world, IsA(BoxPrefab));

		const prefabEid = getPrefabEid(world, BoxPrefab)!;

		const store = getStore(world, Box);
		assert(store[eid] === store[prefabEid]);
	});
});
