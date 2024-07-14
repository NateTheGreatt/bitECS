import { strictEqual } from 'assert';
import { describe, expect, it } from 'vitest';
import {
	Not,
	SYMBOLS,
	addComponent,
	addEntity,
	createWorld,
	defineEnterQueue,
	defineExitQueue,
	defineQuery,
	enterQuery,
	exitQuery,
	query,
	removeComponent,
	removeEntity,
	resetWorld,
} from '../../src/index.js';

describe('Query Integration Tests', () => {
	it('should define a query and return matching eids', () => {
		const world = createWorld();
		const TestComponent = {};
		const query = defineQuery([TestComponent]);
		const eid = addEntity(world);
		addComponent(world, eid, TestComponent);

		let ents = query(world);

		strictEqual(ents.length, 1);
		strictEqual(ents[0], 0);

		removeEntity(world, eid);

		ents = query(world);
		strictEqual(ents.length, 0);
	});

	it('should define a query with Not and return matching eids', () => {
		const world = createWorld();
		const TestComponent = {};
		const notFooQuery = defineQuery([Not(TestComponent)]);

		const eid0 = addEntity(world);

		let ents = notFooQuery(world);
		strictEqual(ents.length, 1);
		strictEqual(ents[0], eid0);

		addComponent(world, eid0, TestComponent);

		ents = notFooQuery(world);
		strictEqual(ents.length, 0);

		const eid1 = addEntity(world);

		ents = notFooQuery(world);
		strictEqual(ents.length, 1);
		strictEqual(ents[0], eid1);

		removeEntity(world, eid1);

		ents = notFooQuery(world);
		strictEqual(ents.length, 0);
	});

	it('should correctly populate Not queries when adding/removing components', () => {
		const world = createWorld();

		const Foo = {};
		const Bar = {};

		const fooQuery = defineQuery([Foo]);
		const notFooQuery = defineQuery([Not(Foo)]);

		const fooBarQuery = defineQuery([Foo, Bar]);
		const notFooBarQuery = defineQuery([Not(Foo), Not(Bar)]);

		const eid0 = addEntity(world);
		const eid1 = addEntity(world);
		const eid2 = addEntity(world);

		/* initial state */

		// foo query should have nothing
		let ents = fooQuery(world);
		strictEqual(ents.length, 0);

		// notFoo query should have eid 0, 1, and 2
		ents = notFooQuery(world);
		strictEqual(ents.length, 3);
		strictEqual(ents[0], 0);
		strictEqual(ents[1], 1);
		strictEqual(ents[2], 2);

		/* add components */

		addComponent(world, eid0, Foo);

		addComponent(world, eid1, Bar);

		addComponent(world, eid2, Foo);
		addComponent(world, eid2, Bar);

		// now fooQuery should have eid 0 & 2
		ents = fooQuery(world);
		strictEqual(ents.length, 2);
		strictEqual(ents[0], 0);
		strictEqual(ents[1], 2);

		// fooBarQuery should only have eid 2
		ents = fooBarQuery(world);
		strictEqual(ents.length, 1);
		strictEqual(ents[0], 2);

		// notFooBarQuery should have nothing
		ents = notFooBarQuery(world);
		strictEqual(ents.length, 0);

		// and notFooQuery should have eid 1
		ents = notFooQuery(world);
		strictEqual(ents.length, 1);
		strictEqual(ents[0], 1);

		/* remove components */

		removeComponent(world, eid0, Foo);

		// now fooQuery should only have eid 2
		ents = fooQuery(world);
		strictEqual(ents.length, 1);
		strictEqual(ents[0], 2);

		// notFooQuery should have eid 0 & 1
		ents = notFooQuery(world);
		strictEqual(ents.length, 2);
		strictEqual(ents[0], 1);
		strictEqual(ents[1], 0);

		// fooBarQuery should still only have eid 2
		ents = fooBarQuery(world);
		strictEqual(ents.length, 1);
		strictEqual(ents[0], 2);

		// notFooBarQuery should only have eid 0
		ents = notFooBarQuery(world);
		strictEqual(ents.length, 1);
		strictEqual(ents[0], 0);

		/* remove more components */

		removeComponent(world, eid2, Foo);
		removeComponent(world, eid2, Bar);

		// notFooBarQuery should have eid 0 & 2
		ents = notFooBarQuery(world);
		strictEqual(ents.length, 2);
		strictEqual(ents[0], 0);
		strictEqual(ents[1], 2);

		// and notFooQuery should have eid 1, 0, & 2
		ents = notFooQuery(world);
		strictEqual(ents.length, 3);
		strictEqual(ents[0], 1);
		strictEqual(ents[1], 0);
		strictEqual(ents[2], 2);
	});

	it('should return entities from enter/exitQuery who entered/exited the query', () => {
		const world = createWorld();
		const TestComponent = {};
		const query = defineQuery([TestComponent]);
		const enteredQuery = enterQuery(query);
		const exitedQuery = exitQuery(query);

		const eid = addEntity(world);
		addComponent(world, eid, TestComponent);

		const entered = enteredQuery(world);
		strictEqual(entered.length, 1);
		strictEqual(entered[0], 0);

		let ents = query(world);
		strictEqual(ents.length, 1);
		strictEqual(ents[0], 0);

		removeEntity(world, eid);

		ents = query(world);
		strictEqual(ents.length, 0);

		const exited = exitedQuery(world);
		strictEqual(exited.length, 1);
		strictEqual(exited[0], 0);
	});

	it("shouldn't pick up entities in enterQuery after adding a component a second time", () => {
		const world = createWorld();
		const TestComponent = {};
		const query = defineQuery([TestComponent]);
		const enteredQuery = enterQuery(query);

		const eid = addEntity(world);
		addComponent(world, eid, TestComponent);

		const entered = enteredQuery(world);
		strictEqual(entered.length, 1);

		addComponent(world, eid, TestComponent);

		const entered2 = enteredQuery(world);
		strictEqual(entered2.length, 0);
	});

	it('should work inline independent of component order', () => {
		const world = createWorld();
		// We need to reset the world[$queriesHashMap] in this case as we're testing
		// for it to contain only the hash of the queries of this test
		resetWorld(world);
		const TestComponent = {};
		const FooComponent = {};
		const BarComponent = {};

		const eid = addEntity(world);

		let eids = query(world, [TestComponent, FooComponent, BarComponent]);
		strictEqual(eids.length, 0);

		addComponent(world, eid, TestComponent);
		addComponent(world, eid, FooComponent);
		addComponent(world, eid, BarComponent);

		eids = query(world, [TestComponent, BarComponent, FooComponent]);

		strictEqual(eids.length, 1);

		eids = query(world, [FooComponent, TestComponent, BarComponent]);

		strictEqual(eids.length, 1);

		// Should only be one hash even though the order of components is different.
		expect(world[SYMBOLS.$queriesHashMap].size).toBe(1);
	});

	it('should work inline with Not', () => {
		const world = createWorld();
		const TestComponent = {};
		const FooComponent = {};
		const BarComponent = {};

		const eid0 = addEntity(world);
		const eid1 = addEntity(world);

		addComponent(world, eid0, TestComponent);
		addComponent(world, eid0, BarComponent);

		addComponent(world, eid1, FooComponent);
		addComponent(world, eid1, BarComponent);

		let eids = query(world, [Not(TestComponent)]);
		strictEqual(eids.length, 1);
		strictEqual(eids[0], 1);

		eids = query(world, [Not(FooComponent)]);
		strictEqual(eids.length, 1);
		strictEqual(eids[0], 0);

		eids = query(world, [Not(BarComponent)]);
		strictEqual(eids.length, 0);
	});

	it('can use queues inline', () => {
		const world = createWorld();
		const TestComponent = {};
		const enteredQuery = defineEnterQueue([TestComponent]);
		const exitedQuery = defineExitQueue([TestComponent]);

		const eid = addEntity(world);
		addComponent(world, eid, TestComponent);

		let entered = query(world, enteredQuery);
		strictEqual(entered.length, 1);

		removeComponent(world, eid, TestComponent);

		let exited = exitedQuery(world);
		strictEqual(exited.length, 1);
	});

	it('should not alter query results when removing a query component', () => {
		const world = createWorld();
		const TestComponent = {};

		for (let i = 0; i < 10; i += 1) {
			const eid = addEntity(world);
			addComponent(world, eid, TestComponent);
		}

		const results = query(world, [TestComponent]);
		const length = results.length;
		for (const eid of results) {
			removeComponent(world, eid, TestComponent);
		}

		expect(length).toBe(results.length);
	});
});
