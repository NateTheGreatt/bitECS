import { describe, expect, it } from "bun:test";
import { addComponent, addEntity, createWorld, removeEntity } from "bitecs";
import {
	createObserverSerializer,
	createSoADeserializer,
	createSoASerializer,
	u16,
} from "../../src/serialization";

/**
 * Tests for entity ID recycling in SoA diff serialization.
 */
describe("Entity ID Recycling in SoA Diff Serialization", () => {
	it("clearEntity() forces reserialization of a recycled slot", () => {
		const Force = { count: u16([]) };
		const clientForce = { count: u16([]) };

		const serverSerialize = createSoASerializer([Force], { diff: true });
		const clientDeserialize = createSoADeserializer([clientForce], {
			diff: true,
		});

		// Establish shadow: entity at slot 5 has count=1
		Force.count[5] = 1;
		const initial = serverSerialize([5]);
		clientDeserialize(initial);
		expect(clientForce.count[5]).toBe(1);

		// Entity at slot 5 removed and recycled with the same value — shadow is stale
		Force.count[5] = 1;

		// Without clearEntity: shadow=1, current=1 → no diff emitted
		const deltaWithoutClear = serverSerialize([5]);
		expect(deltaWithoutClear.byteLength).toBe(0); // confirms the bug exists

		// After clearEntity: shadow is wiped → next serialize treats slot as new
		serverSerialize.clearEntity!(5);
		const deltaAfterClear = serverSerialize([5]);
		expect(
			deltaAfterClear.byteLength,
			"clearEntity() must cause the recycled slot to be re-serialized",
		).toBeGreaterThan(0);

		// Client receives and applies the delta
		clientForce.count[5] = undefined as unknown as number;
		clientDeserialize(deltaAfterClear);
		expect(clientForce.count[5]).toBe(1);
	});

	it("getRemovals from observer automatically clears shadows for removed entities", () => {
		const world = createWorld();
		const Networked = {};
		const Force = { count: u16([]) };
		const clientForce = { count: u16([]) };

		// Wire observer's getRemovals into the SoA serializer
		const observerSerialize = createObserverSerializer(world, Networked, [Force]);
		const serverSerialize = createSoASerializer([Force], {
			diff: true,
			getRemovals: () => observerSerialize.getRemovals(),
		});
		const clientDeserialize = createSoADeserializer([clientForce], {
			diff: true,
		});

		// Create entity e1 with Networked tag AND Force component so the observer
		// tracks per-component removal when the entity is destroyed
		const e1 = addEntity(world);
		addComponent(world, e1, Networked);
		addComponent(world, e1, Force);
		Force.count[e1] = 1;

		// Initial serialize: flush observer queue, establish shadow[e1]=1
		observerSerialize();
		const initial = serverSerialize([e1]);
		clientDeserialize(initial);
		expect(clientForce.count[e1]).toBe(1);

		// Remove e1 — onRemove(Networked) fires → removedEntities.add(e1)
		removeEntity(world, e1);

		// Create e2 — bitECS recycles e1's ID
		const e2 = addEntity(world);
		expect(e2).toBe(e1); // confirm recycling
		addComponent(world, e2, Networked);
		addComponent(world, e2, Force);

		// New entity gets same count value as old entity
		Force.count[e2] = 1;

		// SoA serializer calls getRemovals() → gets {e1}, clears ALL shadows[e1] → changed=true
		observerSerialize(); // flush observer buffer (not strictly required for getRemovals to work)
		const delta = serverSerialize([e2]);

		expect(
			delta.byteLength,
			"getRemovals must cause shadow to be cleared so the recycled entity is re-serialized",
		).toBeGreaterThan(0);

		// Simulate client receiving the new entity and applying the delta
		clientForce.count[e2] = undefined as unknown as number;
		clientDeserialize(delta);
		expect(
			clientForce.count[e2],
			"client entity must have its count populated after the delta",
		).toBe(1);
	});

	it("getRemovals does not interfere when entity values differ", () => {
		const world = createWorld();
		const Networked = {};
		const Force = { count: u16([]) };

		const observerSerialize = createObserverSerializer(world, Networked, [Force]);
		const serverSerialize = createSoASerializer([Force], {
			diff: true,
			getRemovals: () => observerSerialize.getRemovals(),
		});
		const clientDeserialize = createSoADeserializer([{ count: u16([]) }], {
			diff: true,
		});

		const e1 = addEntity(world);
		addComponent(world, e1, Networked);
		addComponent(world, e1, Force);
		Force.count[e1] = 5;
		observerSerialize();
		const initial = serverSerialize([e1]);
		expect(initial.byteLength).toBeGreaterThan(0);

		// No removal — just update the value
		Force.count[e1] = 10;
		observerSerialize(); // nothing removed
		const delta = serverSerialize([e1]);
		expect(delta.byteLength).toBeGreaterThan(0); // changed value, should serialize

		// No change this time
		const empty = serverSerialize([e1]);
		expect(empty.byteLength).toBe(0);
	});
});
