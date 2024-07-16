import { Component } from '../component/types';
import { Prefab } from '../prefab/types';

export function withParams<P extends Prefab>(
	prefab: P,
	params: P extends Prefab<infer Params> ? Params : never
): [P, P extends Prefab<infer Params> ? Params : never];
export function withParams<C extends Component>(
	component: C,
	params: C extends Component<any, infer Params> ? Params : never
): [C, C extends Component<any, infer Params> ? Params : never];
export function withParams(a: any, b: any) {
	return [a, b];
}
