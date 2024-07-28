import { Component } from './types';
import { PrefabNode } from '../prefab/types';

export function withParams<P extends PrefabNode>(
	prefab: P,
	params: P extends PrefabNode<infer Params> ? Params : never
): [P, P extends PrefabNode<infer Params> ? Params : never];
export function withParams<C extends Component>(
	component: C,
	params: C extends Component<any, infer Params> ? Params : never
): [C, C extends Component<any, infer Params> ? Params : never];
export function withParams(a: any, b: any) {
	return [a, b];
}
