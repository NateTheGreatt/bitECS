import { measure, requestAnimationFrame } from '@sim/bench-tools';
import { init } from './systems/init';
import { world } from './world';
import { pipeline } from './systems/pipeline';

// Start the simulation.
const main = () => {
	measure(() => pipeline(world));
	requestAnimationFrame(main);
};

// Initialize all entities.
init(world);

requestAnimationFrame(main);
