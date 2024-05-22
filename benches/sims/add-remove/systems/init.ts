import { World } from '@bitecs/classic';
import { CONSTANTS } from '../constants';
import { addComponent, addEntity } from '@bitecs/classic';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';
import { Mass } from '../components/Mass';
import { Circle } from '../components/Circle';
import { Color } from '../components/Color';

export const init = (world: World) => {
	for (let i = 0; i < CONSTANTS.BODIES; i++) {
		addBody(world);
	}
};

export const addBody = (world: World) => {
	const eid = addEntity(world);
	addComponent(world, Position, eid);
	addComponent(world, Velocity, eid);
	addComponent(world, Mass, eid);
	addComponent(world, Circle, eid);
	addComponent(world, Color, eid);
};
