import { IsA, World } from '@bitecs/classic';
import { CONSTANTS } from '../constants';
import { addEntity } from '@bitecs/classic';
import { Position } from '../components/Position';
import { Velocity } from '../components/Velocity';
import { Mass } from '../components/Mass';
import { Circle } from '../components/Circle';
import { Color } from '../components/Color';
import { BodyPrefab } from '../components/Body';

export const init = (world: World) => {
	for (let i = 0; i < CONSTANTS.BODIES; i++) {
		addBody(world);
	}
};

export const addBody = (world: World) => {
	addEntity(world, IsA(BodyPrefab));
	// addEntity(world, Position, Velocity, Mass, Circle, Color);
};
