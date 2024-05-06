import { World } from '../world/types';
import { System } from './types';

/**
 * Defines a new system function.
 *
 * @param {function} update
 * @returns {function}
 */
export const defineSystem =
	<W extends World = World, R extends any[] = any[]>(
		update: (world: W, ...args: R) => void
	): System<W, R> =>
	(world: W, ...args: R) => {
		update(world, ...args);
		return world;
	};
