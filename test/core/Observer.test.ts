import { describe, it, expect, vi } from 'vitest'
import { createWorld, addEntity, addComponent, getComponentData, observe, onGet, onSet, set, IsA, addPrefab } from '../../src/core'

describe('Observer Tests', () => {
	it('should trigger onGet when component data is accessed', () => {
		const world = createWorld()
		const eid = addEntity(world)
		const Position: { x: number[], y: number[] } = { x: [], y: [] }
		addComponent(world, eid, Position)

		const mockObserver = vi.fn((eid) => ({ x: Position.x[eid], y: Position.y[eid] }))
		const unsubscribe = observe(world, onGet(Position), mockObserver)

		getComponentData(world, eid, Position)
		expect(mockObserver).toHaveBeenCalledWith(eid)

		unsubscribe()
		getComponentData(world, eid, Position)
		expect(mockObserver).toHaveBeenCalledTimes(1)
	})

	it('should trigger onSet when component data is set', () => {
		const world = createWorld()
		const eid = addEntity(world)
		const Position: { x: number[], y: number[] } = { x: [], y: [] }
		addComponent(world, eid, Position)

		const mockObserver = vi.fn((eid, params) => {
			Position.x[eid] = params.x
			Position.y[eid] = params.y
		})
		const unsubscribe = observe(world, onSet(Position), mockObserver)

		addComponent(world, eid, set(Position, { x: 1, y: 1 }))
		expect(mockObserver).toHaveBeenCalledWith(eid, { x: 1, y: 1 })
		expect(Position.x[eid]).toBe(1)
		expect(Position.y[eid]).toBe(1)

		unsubscribe()
		addComponent(world, eid, set(Position, { x: 2, y: 2 }))
		expect(mockObserver).toHaveBeenCalledTimes(1)
		expect(Position.x[eid]).toBe(1)
		expect(Position.y[eid]).toBe(1)
	})

	it('should work with both onGet and onSet', () => {
		const world = createWorld()
		const eid = addEntity(world)
		const Position: { x: number[], y: number[] } = { x: [], y: [] }
		addComponent(world, eid, Position)

		const setObserver = vi.fn((eid, params) => {
			Position.x[eid] = params.x
			Position.y[eid] = params.y
		})
		observe(world, onSet(Position), setObserver)

		const getObserver = vi.fn((eid) => ({ x: Position.x[eid], y: Position.y[eid] }))
		observe(world, onGet(Position), getObserver)

		addComponent(world, eid, set(Position, { x: 3, y: 4 }))
		expect(setObserver).toHaveBeenCalledWith(eid, { x: 3, y: 4 })
		expect(Position.x[eid]).toBe(3)
		expect(Position.y[eid]).toBe(4)

		const result = getComponentData(world, eid, Position)
		expect(getObserver).toHaveBeenCalledWith(eid)
		expect(result).toEqual({ x: 3, y: 4 })
	})
	it('should properly type params in onSet and onGet observers', () => {
		const world = createWorld()
		const eid = addEntity(world)
		const Position = { x: [] as number[], y: [] as number[] }
		addComponent(world, eid, Position)

		const setObserver = vi.fn((eid: number, params: { x: number, y: number }) => {
			Position.x[eid] = params.x
			Position.y[eid] = params.y
		})
		observe(world, onSet(Position), setObserver)

		const getObserver = vi.fn((eid: number): { x: number, y: number } => ({
			x: Position.x[eid],
			y: Position.y[eid]
		}))
		observe(world, onGet(Position), getObserver)

		addComponent(world, eid, set(Position, { x: 5, y: 6 }))
		expect(setObserver).toHaveBeenCalledWith(eid, { x: 5, y: 6 })
		expect(Position.x[eid]).toBe(5)
		expect(Position.y[eid]).toBe(6)

		const result = getComponentData(world, eid, Position)
		expect(getObserver).toHaveBeenCalledWith(eid)
		expect(result).toEqual({ x: 5, y: 6 })

		addComponent(world, eid, set(Position, { x: 5, y: 6 }))

		const componentData = getComponentData(world, eid, Position)
		const sum: number = componentData.x + componentData.y
		expect(sum).toBe(11)
	})
	it('should properly inherit component values with onSet and onGet observers', () => {
		const world = createWorld()
		const eid = addEntity(world)
		const Vitals = { health: [] as number[] }
		addComponent(world, eid, Vitals)

		const setObserver = vi.fn((eid: number, params: { health: number }) => {
			Vitals.health[eid] = params.health
		})
		observe(world, onSet(Vitals), setObserver)

		const getObserver = vi.fn((eid: number): { health: number } => ({
			health: Vitals.health[eid]
		}))
		observe(world, onGet(Vitals), getObserver)

		// Set initial health
		addComponent(world, eid, set(Vitals, { health: 100 }))
		expect(setObserver).toHaveBeenCalledWith(eid, { health: 100 })
		expect(Vitals.health[eid]).toBe(100)

		// Get health
		const result = getComponentData(world, eid, Vitals)
		expect(getObserver).toHaveBeenCalledWith(eid)
		expect(result).toEqual({ health: 100 })

		// Update health
		addComponent(world, eid, set(Vitals, { health: 75 }))
		expect(setObserver).toHaveBeenCalledWith(eid, { health: 75 })
		expect(Vitals.health[eid]).toBe(75)

		// Get updated health
		const updatedResult = getComponentData(world, eid, Vitals)
		expect(getObserver).toHaveBeenCalledWith(eid)
		expect(updatedResult).toEqual({ health: 75 })

		// Ensure type safety
		const vitalData = getComponentData(world, eid, Vitals)
		const healthValue: number = vitalData.health
		expect(healthValue).toBe(75)
	})
	it('should properly set component values using set and addComponent', () => {
		const world = createWorld()
		const eid = addEntity(world)
		const Position = { x: [] as number[], y: [] as number[] }

		const setObserver = vi.fn((eid: number, params: { x: number, y: number }) => {
			Position.x[eid] = params.x
			Position.y[eid] = params.y
		})
		observe(world, onSet(Position), setObserver)

		const getObserver = vi.fn((eid: number): { x: number, y: number } => ({
			x: Position.x[eid],
			y: Position.y[eid]
		}))
		observe(world, onGet(Position), getObserver)

		// Add component using set and addComponent
		addComponent(world, eid, set(Position, { x: 10, y: 20 }))
		expect(setObserver).toHaveBeenCalledWith(eid, { x: 10, y: 20 })
		expect(Position.x[eid]).toBe(10)
		expect(Position.y[eid]).toBe(20)

		// Get position
		const result = getComponentData(world, eid, Position)
		expect(getObserver).toHaveBeenCalledWith(eid)
		expect(result).toEqual({ x: 10, y: 20 })

		// Update position using set and addComponent
		addComponent(world, eid, set(Position, { x: 30, y: 40 }))
		expect(setObserver).toHaveBeenCalledWith(eid, { x: 30, y: 40 })
		expect(Position.x[eid]).toBe(30)
		expect(Position.y[eid]).toBe(40)

		// Get updated position
		const updatedResult = getComponentData(world, eid, Position)
		expect(getObserver).toHaveBeenCalledWith(eid)
		expect(updatedResult).toEqual({ x: 30, y: 40 })

		// Ensure type safety
		const positionData = getComponentData(world, eid, Position)
		const xValue: number = positionData.x
		const yValue: number = positionData.y
		expect(xValue).toBe(30)
		expect(yValue).toBe(40)
	})
	it('should work with IsA relations and automatically inherit component data', () => {
		const world = createWorld()
		const Animal = addPrefab(world)
		const Sheep = addPrefab(world)
		const sheep = addEntity(world)

		const Health = { value: [] as number[] }

		const healthObserver = vi.fn((eid: number, params: { value: number }) => {
			Health.value[eid] = params.value
		})
		observe(world, onSet(Health), healthObserver)

		const getHealthObserver = vi.fn((eid: number) => ({
			value: Health.value[eid]
		}))
		observe(world, onGet(Health), getHealthObserver)

		addComponent(world, Animal, set(Health, { value: 100 }))
		addComponent(world, Sheep, IsA(Animal))
		
		// when sheep inherits animal, it should inherit the health component and use the onGet and onSet to copy the data
		expect(healthObserver).toHaveBeenCalledWith(Sheep, { value: 100 })
		
		addComponent(world, sheep, IsA(Sheep))

		// Set health for Animal
		addComponent(world, Animal, set(Health, { value: 100 }))
		expect(healthObserver).toHaveBeenCalledWith(Animal, { value: 100 })
		expect(Health.value[Animal]).toBe(100)

		// Verify that health is automatically inherited through IsA relations
		expect(Health.value[Animal]).toBe(100)
		expect(Health.value[Sheep]).toBe(100)
		expect(Health.value[sheep]).toBe(100)

		// Set health for individual sheep
		addComponent(world, sheep, set(Health, { value: 50 }))
		expect(healthObserver).toHaveBeenCalledWith(sheep, { value: 50 })
		expect(Health.value[sheep]).toBe(50)

		// Verify that only the individual sheep's health has changed
		expect(Health.value[Animal]).toBe(100)
		expect(Health.value[Sheep]).toBe(100)
		expect(Health.value[sheep]).toBe(50)
	})

	it('should handle deep inheritance hierarchies with multiple layers', () => {
		const world = createWorld()
		

		// Create Health components
		const Health = { value: [] as number[] }

		const setHealthObserver = vi.fn((eid: number, params: { value: number }) => {
			Health.value[eid] = params.value
		})
		observe(world, onSet(Health), setHealthObserver)

		const getHealthObserver = vi.fn((eid: number) => ({
			value: Health.value[eid]
		}))
		observe(world, onGet(Health), getHealthObserver)

		
		// Create Speed component
		const Speed = { value: [] as number[] }

		const setSpeedObserver = vi.fn((eid: number, params: { value: number }) => {
			Speed.value[eid] = params.value
		})
		observe(world, onSet(Speed), setSpeedObserver)

		const getSpeedObserver = vi.fn((eid: number) => ({
			value: Speed.value[eid]
		}))
		observe(world, onGet(Speed), getSpeedObserver)

		
		// Create Strength component
		const Strength = { value: [] as number[] }

		const setStrengthObserver = vi.fn((eid: number, params: { value: number }) => {
			Strength.value[eid] = params.value
		})
		observe(world, onSet(Strength), setStrengthObserver)

		const getStrengthObserver = vi.fn((eid: number) => ({
			value: Strength.value[eid]
		}))
		observe(world, onGet(Strength), getStrengthObserver)


		// Create hierarchy: Animal -> Mammal -> Canine -> Dog -> Husky
		const Animal = addPrefab(world)
		// Base health for all animals
		addComponent(world, Animal, set(Health, { value: 100 }))
		expect(setHealthObserver).toHaveBeenCalledWith(Animal, { value: 100 })
		expect(Health.value[Animal]).toBe(100)

		const Mammal = addPrefab(world)
		// Base speed for mammals
		addComponent(world, Mammal, IsA(Animal))
		addComponent(world, Mammal, set(Speed, { value: 20 }))
		expect(setSpeedObserver).toHaveBeenCalledWith(Mammal, { value: 20 })
		expect(Speed.value[Mammal]).toBe(20)

		const Canine = addPrefab(world)
		// Override speed for canines
		addComponent(world, Canine, IsA(Mammal))
		addComponent(world, Canine, set(Speed, { value: 35 }))
		expect(setSpeedObserver).toHaveBeenCalledWith(Canine, { value: 35 })
		expect(Speed.value[Canine]).toBe(35)

		const Dog = addPrefab(world)
		// Add strength for dogs
		addComponent(world, Dog, IsA(Canine))
		addComponent(world, Dog, set(Strength, { value: 50 }))
		expect(setStrengthObserver).toHaveBeenCalledWith(Dog, { value: 50 })
		expect(Strength.value[Dog]).toBe(50)

		const Husky = addPrefab(world)
		// Override strength for Husky
		addComponent(world, Husky, IsA(Dog))
		addComponent(world, Husky, set(Strength, { value: 75 }))
		expect(setStrengthObserver).toHaveBeenCalledWith(Husky, { value: 75 })
		expect(Strength.value[Husky]).toBe(75)
		// Husky should inherit the speed from Canine
		expect(Speed.value[Husky]).toBe(35)

		const myDog = addEntity(world)
		// Override a value for specific instance
		addComponent(world, myDog, IsA(Husky))
		addComponent(world, myDog, set(Speed, { value: 40 }))
		expect(setSpeedObserver).toHaveBeenCalledWith(myDog, { value: 40 })
		expect(Speed.value[myDog]).toBe(40)      // Instance override

		expect(Health.value[myDog]).toBe(100)    // Inherited from Animal
		expect(Speed.value[myDog]).toBe(40)      // Inherited from Canine (overridden from Mammal)
		expect(Strength.value[myDog]).toBe(75)   // Inherited from Husky (overridden from Dog)

		// Verify other entities in hierarchy remain unchanged
		expect(Speed.value[Canine]).toBe(35)
		expect(Strength.value[Dog]).toBe(50)
	})
	
})
