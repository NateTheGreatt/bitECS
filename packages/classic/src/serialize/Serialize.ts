import {
	$indexBytes,
	$indexType,
	$isEidType,
	$storeBase,
	$storeFlattened,
	$tagStore,
} from '../storage/symbols';
import { createShadow } from '../storage/Storage';
import { addComponent, hasComponent } from '../component/Component';
import { $componentMap } from '../component/symbols';
import { addEntity, eidToWorld } from '../entity/Entity';
import { $entityArray, $entitySparseSet } from '../entity/symbols';
import { $localEntities, $localEntityLookup } from '../world/symbols';
import { $modifier } from '../query/symbols';
import { TODO } from '../utils/types';
import { World } from '../world/types';
import { Deserializer, Serializer } from './types';

export const DESERIALIZE_MODE = {
	REPLACE: 0,
	APPEND: 1,
	MAP: 2,
} as const;

let resized = false;

export const setSerializationResized = (v: boolean) => {
	resized = v;
};

const concat = (a: Array<any>, v: Array<any>) => a.concat(v);
const not = (fn: Function) => (v: any) => !fn(v);

const storeFlattened = (c: TODO) => c[$storeFlattened];
const isFullComponent = storeFlattened;
const isProperty = not(isFullComponent);

const isModifier = (c: TODO) => typeof c === 'function' && c[$modifier];
const isNotModifier = not(isModifier);

const isChangedModifier = (c: TODO) => isModifier(c) && c()[1] === 'changed';

const isWorld = (w: World) => Object.getOwnPropertySymbols(w).includes($componentMap);

const fromModifierToComponent = (c: TODO) => c()[0];

export const canonicalize = (target: TODO) => {
	if (isWorld(target)) return [[], new Map()];

	// aggregate full components
	const fullComponentProps = target
		.filter(isNotModifier)
		.filter(isFullComponent)
		.map(storeFlattened)
		.reduce(concat, []);

	// aggregate changed full components
	const changedComponentProps = target
		.filter(isChangedModifier)
		.map(fromModifierToComponent)
		.filter(isFullComponent)
		.map(storeFlattened)
		.reduce(concat, []);

	// aggregate props
	const props = target.filter(isNotModifier).filter(isProperty);

	// aggregate changed props
	const changedProps = target
		.filter(isChangedModifier)
		.map(fromModifierToComponent)
		.filter(isProperty);

	const componentProps = [
		...fullComponentProps,
		...props,
		...changedComponentProps,
		...changedProps,
	];
	const allChangedProps = [...changedComponentProps, ...changedProps].reduce((map, prop) => {
		const $ = Symbol();
		createShadow(prop, $);
		map.set(prop, $);
		return map;
	}, new Map());

	return [componentProps, allChangedProps];
};

/**
 * Defines a new serializer which targets the given components to serialize the data of when called on a world or array of EIDs.
 *
 * @param {object|array} target
 * @param {number} [maxBytes=20000000]
 * @returns {function} serializer
 */
export const defineSerializer = (target: TODO, maxBytes = 20000000): Serializer => {
	const worldSerializer = isWorld(target);

	let [componentProps, changedProps] = canonicalize(target);

	// TODO: calculate max bytes based on target & recalc upon resize

	const buffer = new ArrayBuffer(maxBytes);
	const view = new DataView(buffer) as TODO;

	const entityComponentCache = new Map();

	const serializer = (ents: TODO) => {
		if (resized) {
			[componentProps, changedProps] = canonicalize(target);
			resized = false;
		}

		if (worldSerializer) {
			componentProps = [];
			target[$componentMap].forEach((c: TODO, component: TODO) => {
				if (component[$storeFlattened]) componentProps.push(...component[$storeFlattened]);
				else componentProps.push(component);
			});
		}

		let world;
		if (Object.getOwnPropertySymbols(ents).includes($componentMap)) {
			world = ents;
			ents = ents[$entityArray] as TODO;
		} else {
			world = eidToWorld.get(ents[0]);
		}

		let where = 0;

		if (!ents.length) return buffer.slice(0, where);

		const cache = new Map();

		// iterate over component props
		for (let pid = 0; pid < componentProps.length; pid++) {
			const prop = componentProps[pid];
			const component = prop[$storeBase]();
			const $diff = changedProps.get(prop);
			const shadow = $diff ? prop[$diff] : null;

			if (!cache.has(component)) cache.set(component, new Map());

			// write pid
			view.setUint8(where, pid);
			where += 1;

			// save space for entity count
			const countWhere = where;
			where += 4;

			let writeCount = 0;
			// write eid,val
			for (let i = 0; i < ents.length; i++) {
				const eid = ents[i];

				let componentCache = entityComponentCache.get(eid);
				if (!componentCache)
					componentCache = entityComponentCache.set(eid, new Set()).get(eid);

				componentCache.add(eid);

				const newlyAddedComponent =
					// if we are diffing
					(shadow &&
						// and we have already iterated over this component for this entity
						// retrieve cached value
						cache.get(component).get(eid)) ||
					// or if entity did not have component last call
					(!componentCache.has(component) &&
						// and entity has component this call
						hasComponent(world, component, eid));

				cache.get(component).set(eid, newlyAddedComponent);

				if (newlyAddedComponent) {
					componentCache.add(component);
				} else if (!hasComponent(world, component, eid)) {
					// skip if entity doesn't have this component
					componentCache.delete(component);
					continue;
				}

				const rewindWhere = where;

				// write eid
				view.setUint32(where, eid);
				where += 4;

				// if it's a tag store we can stop here
				if (prop[$tagStore]) {
					writeCount++;
					continue;
				}

				// if property is an array
				if (ArrayBuffer.isView(prop[eid])) {
					const type = prop[eid].constructor.name.replace('Array', '');
					// @ts-expect-error
					const indexType = prop[eid][$indexType];
					// @ts-expect-error
					const indexBytes = prop[eid][$indexBytes];

					// save space for count of dirty array elements
					const countWhere2 = where;
					where += indexBytes;

					let arrayWriteCount = 0;

					// write index,value
					// @ts-expect-error
					for (let i = 0; i < prop[eid].length; i++) {
						if (shadow) {
							// @ts-expect-error
							const changed = shadow[eid][i] !== prop[eid][i];

							// sync shadow
							// @ts-expect-error
							shadow[eid][i] = prop[eid][i];

							// if state has not changed since the last call
							// todo: if newly added then entire component will serialize (instead of only changed values)
							if (!changed && !newlyAddedComponent) {
								// skip writing this value
								continue;
							}
						}

						// write array index
						view[`set${indexType}`](where, i);
						where += indexBytes;

						// write value at that index
						// @ts-expect-error
						const value = prop[eid][i];
						view[`set${type}`](where, value);
						// @ts-expect-error
						where += prop[eid].BYTES_PER_ELEMENT;
						arrayWriteCount++;
					}

					if (arrayWriteCount > 0) {
						// write total element count
						view[`set${indexType}`](countWhere2, arrayWriteCount);
						writeCount++;
					} else {
						where = rewindWhere;
						continue;
					}
				} else {
					if (shadow) {
						const changed = shadow[eid] !== prop[eid];

						shadow[eid] = prop[eid];

						// do not write value if diffing and no change
						if (!changed && !newlyAddedComponent) {
							// rewind the serializer
							where = rewindWhere;
							// skip writing this value
							continue;
						}
					}

					const type = prop.constructor.name.replace('Array', '');
					// set value next [type] bytes
					view[`set${type}`](where, prop[eid]);
					where += prop.BYTES_PER_ELEMENT;

					writeCount++;
				}
			}

			if (writeCount > 0) {
				// write how many eid/value pairs were written
				view.setUint32(countWhere, writeCount);
			} else {
				// if nothing was written (diffed with no changes)
				// then move cursor back 5 bytes (remove PID and countWhere space)
				where -= 5;
			}
		}
		return buffer.slice(0, where);
	};

	return serializer;
};

const newEntities = new Map();

/**
 * Defines a new deserializer which targets the given components to deserialize onto a given world.
 *
 * @param {object|array} target
 * @returns {function} deserializer
 */
export const defineDeserializer = (target: TODO): Deserializer => {
	const isWorld = Object.getOwnPropertySymbols(target).includes($componentMap);
	let [componentProps] = canonicalize(target);

	const deserializedEntities = new Set();

	const deserializer: TODO = (world: World, packet: TODO, mode = 0) => {
		newEntities.clear();

		if (resized) {
			[componentProps] = canonicalize(target);
			resized = false;
		}

		if (isWorld) {
			componentProps = [];
			target[$componentMap].forEach((c: TODO, component: TODO) => {
				if (component[$storeFlattened]) componentProps.push(...component[$storeFlattened]);
				else componentProps.push(component);
			});
		}

		const localEntities = world[$localEntities];
		const localEntityLookup = world[$localEntityLookup];

		const view = new DataView(packet) as TODO;
		let where = 0;

		while (where < packet.byteLength) {
			// pid
			const pid = view.getUint8(where);
			where += 1;

			// entity count
			const entityCount = view.getUint32(where);
			where += 4;

			// component property
			const prop = componentProps[pid];

			// Get the entities and set their prop values
			for (let i = 0; i < entityCount; i++) {
				let eid = view.getUint32(where); // throws with [changed, c, changed]
				where += 4;

				if (mode === DESERIALIZE_MODE.MAP) {
					if (localEntities.has(eid)) {
						eid = localEntities.get(eid);
					} else if (newEntities.has(eid)) {
						eid = newEntities.get(eid);
					} else {
						const newEid = addEntity(world);
						localEntities.set(eid, newEid);
						localEntityLookup.set(newEid, eid);
						newEntities.set(eid, newEid);
						eid = newEid;
					}
				}

				if (
					mode === DESERIALIZE_MODE.APPEND ||
					(mode === DESERIALIZE_MODE.REPLACE && !world[$entitySparseSet].has(eid))
				) {
					const newEid = newEntities.get(eid) || addEntity(world);
					newEntities.set(eid, newEid);
					eid = newEid;
				}

				const component = prop[$storeBase]();
				if (!hasComponent(world, component, eid)) {
					addComponent(world, component, eid);
				}

				// add eid to deserialized ents after it has been transformed by MAP mode
				deserializedEntities.add(eid);

				if (component[$tagStore]) {
					continue;
				}

				if (ArrayBuffer.isView(prop[eid])) {
					const array = prop[eid];
					const count = view[`get${array[$indexType]}`](where);
					where += array[$indexBytes];

					// iterate over count
					for (let i = 0; i < count; i++) {
						const index = view[`get${array[$indexType]}`](where);
						where += array[$indexBytes];

						const value =
							view[`get${array.constructor.name.replace('Array', '')}`](where);
						where += array.BYTES_PER_ELEMENT;
						if (prop[$isEidType]) {
							let localEid;
							if (localEntities.has(value)) {
								localEid = localEntities.get(value);
							} else if (newEntities.has(value)) {
								localEid = newEntities.get(value);
							} else {
								const newEid = addEntity(world);
								localEntities.set(value, newEid);
								localEntityLookup.set(newEid, value);
								newEntities.set(value, newEid);
								localEid = newEid;
							}
							prop[eid][index] = localEid;
						} else prop[eid][index] = value;
					}
				} else {
					const value = view[`get${prop.constructor.name.replace('Array', '')}`](where);
					where += prop.BYTES_PER_ELEMENT;

					if (prop[$isEidType]) {
						let localEid;
						if (localEntities.has(value)) {
							localEid = localEntities.get(value);
						} else if (newEntities.has(value)) {
							localEid = newEntities.get(value);
						} else {
							const newEid = addEntity(world);
							localEntities.set(value, newEid);
							localEntityLookup.set(newEid, value);
							newEntities.set(value, newEid);
							localEid = newEid;
						}
						prop[eid] = localEid;
					} else prop[eid] = value;
				}
			}
		}

		const ents = Array.from(deserializedEntities);

		deserializedEntities.clear();

		return ents;
	};

	return deserializer;
};
