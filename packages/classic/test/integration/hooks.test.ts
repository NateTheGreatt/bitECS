import {
	IsA,
	addEntity,
	createWorld,
	defineComponent,
	definePrefab,
	defineRelation,
	onAdd,
	onRemove,
	onTargetRemoved,
	removeEntity,
} from '../../src';
import { describe, expect, test, vi } from 'vitest';

describe('Hooks Integration Tests', () => {
	// this test only works if the player eid is 0, so it needs to be first
	test('should call component hooks', () => {
		const world = createWorld();

		const TestComponent = defineComponent(() => {});
		const onAddMock = vi.fn();
		const onRemoveMock = vi.fn();
		onAdd(TestComponent, onAddMock);
		onRemove(TestComponent, onRemoveMock);
		removeEntity(world, addEntity(world, TestComponent));

		expect(onAddMock).toHaveBeenCalledTimes(1);
		expect(onRemoveMock).toHaveBeenCalledTimes(1);
	});

	test('should call relation hooks', () => {
		const world = createWorld();

		const TestRelation = defineRelation();
		const onAddMock = vi.fn();
		const onRemoveMock = vi.fn();
		const onTargetRemovedMock = vi.fn();
		onAdd(TestRelation, onAddMock);
		onRemove(TestRelation, onRemoveMock);
		onTargetRemoved(TestRelation, onTargetRemovedMock);

		const target = addEntity(world);
		removeEntity(world, addEntity(world, TestRelation(target)));

		expect(onAddMock).toHaveBeenCalledTimes(1);
		expect(onRemoveMock).toHaveBeenCalledTimes(1);

		onAddMock.mockReset();
		onRemoveMock.mockReset();

		addEntity(world, TestRelation(target));
		removeEntity(world, target);

		expect(onAddMock).toHaveBeenCalledTimes(1);
		expect(onRemoveMock).toHaveBeenCalledTimes(1);
		expect(onTargetRemovedMock).toHaveBeenCalledTimes(1);
	});

	test('should call prefab hooks', () => {
		const world = createWorld();

		const TestPrefab = definePrefab();
		const onAddMock = vi.fn();
		const onRemoveMock = vi.fn();
		onAdd(TestPrefab, onAddMock);
		onRemove(TestPrefab, onRemoveMock);
		removeEntity(world, addEntity(world, IsA(TestPrefab)));

		expect(onAddMock).toHaveBeenCalledTimes(1);
		expect(onRemoveMock).toHaveBeenCalledTimes(1);
	});
});
