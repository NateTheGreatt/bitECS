import { TYPES } from '../constants/Constants';
import { QueryData } from '../query/types';
import { Schema } from '../storage/types';
import { TypedArray } from '../utils/types';

export interface Component extends Object {}

export interface ComponentNode {
	generationId: number;
	bitflag: number;
	ref: Component;
	queries: Set<QueryData>;
	notQueries: Set<QueryData>;
	changedQueries: Set<QueryData>;
}

type Types = keyof typeof TYPES;

export type ArrayByType = {
	['i8']: Int8Array;
	['ui8']: Uint8Array;
	['ui8c']: Uint8ClampedArray;
	['i16']: Int16Array;
	['ui16']: Uint16Array;
	['i32']: Int32Array;
	['ui32']: Uint32Array;
	['f32']: Float32Array;
	['f64']: Float64Array;
	['eid']: Uint32Array;
};

export type ComponentType<T extends Schema> = {
	[key in keyof T]: T[key] extends Types
		? ArrayByType[T[key]]
		: T[key] extends [infer RT, number]
		? RT extends Types
			? Array<ArrayByType[RT]>
			: unknown
		: T[key] extends Schema
		? ComponentType<T[key]>
		: unknown;
};

export type ComponentProp = TypedArray | Array<TypedArray>;
