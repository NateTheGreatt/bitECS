import { afterEach, describe, it } from 'vitest';
import {
	Types,
	addComponent,
	addEntity,
	createWorld,
	defineComponent,
	defineEnterQueue,
	defineExitQueue,
	defineQuery,
	removeComponent,
	resetGlobals,
} from '../../src';
import { strictEqual } from 'assert';

describe('Queue Integration Tests', () => {
	afterEach(() => {
		resetGlobals();
	});

	it('should define independent enter queues', () => {
		const TestComponent = defineComponent({ value: Types.f32 });
		const query = defineQuery([TestComponent]);

		const enteredQueryA = defineEnterQueue(query);
		const enteredQueryB = defineEnterQueue(query);

		// This tests creating the world after the query and queues have been defined.
		const world = createWorld();

		const eidA = addEntity(world);
		const eidB = addEntity(world);
		addComponent(world, TestComponent, eidA);

		let enteredA = enteredQueryA(world);

		strictEqual(enteredA.length, 1);

		addComponent(world, TestComponent, eidB);

		enteredA = enteredQueryA(world);
		let enteredB = enteredQueryB(world);

		strictEqual(enteredA.length, 1);
		strictEqual(enteredB.length, 2);
	});

	it('should define independent exit queues', () => {
		const world = createWorld();
		const TestComponent = defineComponent({ value: Types.f32 });
		const query = defineQuery([TestComponent]);

		const exitedQueryA = defineExitQueue(query);
		const exitedQueryB = defineExitQueue(query);

		const eidA = addEntity(world);
		const eidB = addEntity(world);
		addComponent(world, TestComponent, eidA);
		addComponent(world, TestComponent, eidB);

		let exitedA = exitedQueryA(world);

		strictEqual(exitedA.length, 0);

		removeComponent(world, TestComponent, eidA);

		exitedA = exitedQueryA(world);
		let exitedB = exitedQueryB(world);

		strictEqual(exitedA.length, 1);
		strictEqual(exitedB.length, 1);
	});

	it('should optionally not drain queues when read', () => {
		const world = createWorld();
		const TestComponent = defineComponent({ value: Types.f32 });

		const query = defineQuery([TestComponent]);
		const enteredQuery = defineEnterQueue(query);

		const eid = addEntity(world);
		addComponent(world, TestComponent, eid);

		let entered = enteredQuery(world, false);
		strictEqual(entered.length, 1);

		entered = enteredQuery(world, false);
		strictEqual(entered.length, 1);

		entered = enteredQuery(world, true);
		strictEqual(entered.length, 1);

		entered = enteredQuery(world, false);
		strictEqual(entered.length, 0);
	});

	it('should define enter/exit queues inline', () => {
		const TestComponent = defineComponent({ value: Types.f32 });

		const enteredQuery = defineEnterQueue([TestComponent]);
		const exitedQuery = defineExitQueue([TestComponent]);

		// Checking that world order doesn't matter.
		const world = createWorld();

		const eid = addEntity(world);
		addComponent(world, TestComponent, eid);

		let entered = enteredQuery(world);
		strictEqual(entered.length, 1);
		strictEqual(entered[0], 0);

		removeComponent(world, TestComponent, eid);

		let exited = exitedQuery(world);
		strictEqual(exited.length, 1);
		strictEqual(exited[0], 0);
	});
});
