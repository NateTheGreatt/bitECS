import assert from "assert";
import {
  Types,
  addEntity,
  resetGlobals,
  addComponent,
  defineComponent,
  hasComponent,
  registerComponent,
  removeComponent,
} from "../../src/index.js";
import { createWorld } from "../../src/world/World.js";
import { describe, it, afterEach } from "bun:test";
import { $componentMap } from "../../src/component/symbols.js";

const componentTypes = {
  SoA: defineComponent({ value: Types.f32 }),
  object: {},
  array: [],
  buffer: new ArrayBuffer(8),
  string: "test",
  number: 1,
  Map: new Map(),
  Set: new Set(),
};

describe("Component Integration Tests", () => {
  afterEach(() => {
    resetGlobals();
  });

  it("should register components on-demand", () => {
    const world = createWorld();
    const TestComponent = defineComponent({ value: Types.f32 });

    registerComponent(world, TestComponent);
    assert(world[$componentMap].has(TestComponent));
  });

  it("should register components automatically upon adding to an entity", () => {
    const world = createWorld();
    const TestComponent = defineComponent({ value: Types.f32 });

    const eid = addEntity(world);

    addComponent(world, TestComponent, eid);
    assert(world[$componentMap].has(TestComponent));
  });

  it("should add and remove components from an entity", () => {
    const world = createWorld();
    const TestComponent = defineComponent({ value: Types.f32 });

    const eid = addEntity(world);

    addComponent(world, TestComponent, eid);
    assert(hasComponent(world, TestComponent, eid));

    removeComponent(world, TestComponent, eid);
    assert(hasComponent(world, TestComponent, eid) === false);
  });

  (Object.keys(componentTypes) as (keyof typeof componentTypes)[]).forEach(
    (type) => {
      it(`should correctly add ${type} components`, () => {
        const world = createWorld();

        const eid = addEntity(world);

        addComponent(world, componentTypes[type], eid);
        assert(hasComponent(world, componentTypes[type], eid));
      });
    }
  );

  it("should only remove the component specified", () => {
    const world = createWorld();
    const TestComponent = defineComponent({ value: Types.f32 });
    const TestComponent2 = defineComponent({ value: Types.f32 });

    const eid = addEntity(world);

    addComponent(world, TestComponent, eid);
    addComponent(world, TestComponent2, eid);
    assert(hasComponent(world, TestComponent, eid));
    assert(hasComponent(world, TestComponent2, eid));

    removeComponent(world, TestComponent, eid);
    assert(hasComponent(world, TestComponent, eid) === false);
    assert(hasComponent(world, TestComponent2, eid) === true);
  });

  it("should create tag components", () => {
    const world = createWorld();
    const TestComponent = defineComponent();

    const eid = addEntity(world);

    addComponent(world, TestComponent, eid);
    assert(hasComponent(world, TestComponent, eid));

    removeComponent(world, TestComponent, eid);
    assert(hasComponent(world, TestComponent, eid) === false);
  });

  it("should correctly register more than 32 components", () => {
    const world = createWorld();

    const eid = addEntity(world);

    Array(1024)
      .fill(null)

      .map((_) => defineComponent())
      .forEach((c) => {
        addComponent(world, c, eid);
        assert(hasComponent(world, c, eid));
      });
  });
});