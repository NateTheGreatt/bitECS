import assert from 'assert';
import {
	IsA,
	Types,
	addComponent,
	addEntity,
	createWorld,
	defineComponent,
	definePrefab,
	getAllEntities,
	hasComponent,
	query,
	registerPrefab,
} from '../../src';
import { describe, test } from 'vitest';

describe('Prefab Integration Tests', () => {
	test('should reference a prefab and inherit from it', () => {
		const world = createWorld();

		const Position = defineComponent({
			x: Types.f32,
			y: Types.f32,
		});

		const Sprite = {
			url: {} as Record<number, string>,
		};

		const Player = definePrefab([Position, Sprite]);

		{
			const eid = registerPrefab(world, Player);
			Position.x[eid] = 10;
			Position.y[eid] = 10;
			Sprite.url[eid] = 'assets/player.png';
		}

		const eid = addEntity(world);
		addComponent(world, IsA(Player), eid);

		assert(hasComponent(world, Position, eid));
		assert(hasComponent(world, Sprite, eid));

		assert(Position.x[eid] === 10);
		assert(Position.y[eid] === 10);
		assert(Sprite.url[eid] === 'assets/player.png');
	});

	test('should automatically register prefabs', () => {
		const world = createWorld();

		const Human = definePrefab();
		const Player = definePrefab([IsA(Human)]);
		const Npc = definePrefab([IsA(Human)]);

		{
			const eid = addEntity(world);
			addComponent(world, IsA(Player), eid);
		}

		{
			const eid = addEntity(world);
			addComponent(world, IsA(Npc), eid);
		}

		assert(query(world, [IsA(Human)]).length === 2);
		assert(getAllEntities(world).length === 5);
	});
});
