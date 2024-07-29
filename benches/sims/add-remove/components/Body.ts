import { definePrefab } from '@bitecs/core';
import { Circle } from './Circle';
import { Color } from './Color';
import { Mass } from './Mass';
import { Position } from './Position';
import { Velocity } from './Velocity';

export const BodyPrefab = definePrefab(Position, Velocity, Mass, Circle, Color);
