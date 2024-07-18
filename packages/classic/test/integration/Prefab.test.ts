import assert from 'assert';
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
	onAdd,
	query,
	withParams,
} from '../../src';
import { describe, test } from 'vitest';

describe('Prefab Integration Tests', () => {
	test('should reference a prefab and inherit from it', () => {
		const world = createWorld();

		const Position = defineComponent(() => ({
			x: [] as number[],
			y: [] as number[],
		}));

		const Sprite = defineComponent(() => ({
			url: {} as Record<number, string>,
		}));

		const Player = definePrefab(Position, Sprite);

		const eid = addEntity(world, IsA(Player));

		assert(hasComponent(world, eid, Position));
		assert(hasComponent(world, eid, Sprite));
	});

	test('should automatically register prefabs', () => {
		const world = createWorld();

		const Human = definePrefab();
		const Player = definePrefab(IsA(Human));
		const Npc = definePrefab(IsA(Human));

		addEntity(world, IsA(Player));
		addEntity(world, IsA(Npc));

		assert(query(world, [IsA(Human)]).length === 2);
		assert(getAllEntities(world).length === 5);
	});

	test('multiple inheritance and overrides', () => {
		const Position = defineComponent<{ x: number[]; y: number[] }, { x: number; y: number }>(
			() => ({ x: [], y: [] })
		);
		onAdd(Position, (world, store, eid, params) => {
			store.x[eid] = params?.x ?? 0;
			store.y[eid] = params?.y ?? 0;
		});

		const Health = defineComponent<number[], number>(() => []);
		onAdd(Health, (world, store, eid, health) => {
			store[eid] = health ?? 0;
		});

		const Alignment = defineComponent<string[], string>(() => []);
		onAdd(Alignment, (world, store, eid, alignment) => {
			store[eid] = alignment ?? 'neutral';
		});

		const Mana = defineComponent<number[], number>(() => []);
		onAdd(Mana, (world, store, eid, amount) => {
			store[eid] = amount ?? 0;
		});

		const Element = defineComponent<string[], string>(() => []);
		onAdd(Element, (world, store, eid, element) => {
			store[eid] = element;
		});

		const Character = definePrefab(Position, Health, withParams(Alignment, 'neutral'));
		const Goblin = definePrefab(
			IsA(Character),
			withParams(Health, 75),
			withParams(Alignment, 'evil')
		);

		const RedGoblin = definePrefab(IsA(Goblin), withParams(Health, 100));

		const Magic = definePrefab(Mana);

		const Mage = definePrefab(IsA(Magic), withParams(Mana, 35), Element);

		const GoblinMage = definePrefab(IsA(RedGoblin), IsA(Mage), withParams(Mana, 25));

		const ChaosMage = definePrefab(IsA(GoblinMage), withParams(Element, 'chaos'));

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
		const vec3Store = () => [] as Vec3[];
		const onAddVec3 = (world: World, store: Vec3[], eid: number, vec: Vec3) => {
			store[eid] = vec ?? [0, 0, 0];
		};
		const Box = defineComponent<Vec3[], Vec3>(vec3Store);
		onAdd(Box, onAddVec3);
		const Position = defineComponent<Vec3[], Vec3>(vec3Store);
		onAdd(Position, onAddVec3);
		const Color = defineComponent<Vec3[], Vec3>(vec3Store);
		onAdd(Color, onAddVec3);

		const Tree = definePrefab(Position);
		const Trunk = definePrefab(
			ChildOf(Tree),
			withParams(Position, [0, 0.25, 0]),
			withParams(Box, [0.4, 0.5, 0.4]),
			withParams(Color, [0.25, 0.2, 0.1])
		);
		const Canopy = definePrefab(
			ChildOf(Tree),
			withParams(Position, [0, 0.9, 0]),
			withParams(Box, [0.8, 0.8, 0.8]),
			withParams(Color, [0.25, 0.2, 0.1])
		);
		onAdd(Canopy, (world, eid) => {
			const boxes = getStore(world, Box);
			const positions = getStore(world, Position);

			const h = Math.random() + 0.8;
			boxes[eid][1] = h;
			positions[eid][1] = h / 2 + 0.5;
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
	});

	test('should allow sharing data between prefabs and instances', () => {
		type Vec3 = [number, number, number];
		const Box = defineComponent<Vec3[], Vec3>(() => []);
		onAdd(Box, (world, store, eid, vec) => {
			store[eid] = vec ?? [0, 0, 0];
		});

		const BoxPrefab = definePrefab(withParams(Box, [0, 0, 0]));

		const world = createWorld();

		const eid = addEntity(world, IsA(BoxPrefab));

		const prefabEid = getPrefabEid(world, BoxPrefab)!;

		const store = getStore(world, Box);
		assert(store[eid] === store[prefabEid]);
	});
});
