import { ThreadedComponents } from '../utils/threading';

export type UpdateGravityComponents = ThreadedComponents & {
	read: {
		Position: { x: Readonly<Float64Array>; y: Readonly<Float64Array> };
		Mass: { value: Readonly<Float64Array> };
	};
	write: {
		Acceleration: { x: Float64Array; y: Float64Array };
		Velocity: { x: Float64Array; y: Float64Array };
	};
};

export type UpdateGravityInput = {
	delta: number;
	workerEntities: Uint32Array;
	bodyEntities: Uint32Array;
};
