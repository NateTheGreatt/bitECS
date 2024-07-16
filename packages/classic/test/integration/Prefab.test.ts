import assert from 'assert';
import {
	IsA,
	addEntity,
	createWorld,
	defineComponent,
	definePrefab,
	getAllEntities,
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
		assert(getAllEntities(world).length === 2);
	});

	test('multiple inheritance and overrides', () => {
		const Position = defineComponent<{ x: number[]; y: number[] }, { x: number; y: number }>(
			() => ({ x: [], y: [] })
		);
		onAdd(Position, (world, store, eid, params) => {
			store.x[eid] = params.x ?? 0;
			store.y[eid] = params.y ?? 0;
		});

		const Health = defineComponent<number[], number>(() => []);

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

		const Whatever = definePrefab();

		const EnragedChaosMage = definePrefab(IsA(ChaosMage), IsA(Whatever));

		const world = createWorld();

		const weakMage = addEntity(
			world,
			IsA(EnragedChaosMage),
			withParams(Position, { x: 10, y: 10 })
		);
		const strongMage = addEntity(
			world,
			IsA(EnragedChaosMage),
			withParams(Mana, 66),
			withParams(Position, { x: 20, y: 20 })
		);

		const alignment = getStore(world, Alignment);
		const mana = getStore(world, Mana);
		const element = getStore(world, Element);
		const position = getStore(world, Position);

		assert(hasComponent(world, strongMage, IsA(Character)));
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
});
