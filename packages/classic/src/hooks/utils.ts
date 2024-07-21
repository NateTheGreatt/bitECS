import { ComponentDefinition } from '../component/types';
import { PrefabNode } from '../prefab/types';

export function withParams<P extends PrefabNode>(
	prefab: P,
	params: P extends PrefabNode<infer Params> ? Params : never
): { target: P; params: P extends PrefabNode<infer Params> ? Params : never };
export function withParams<C extends ComponentDefinition>(
	component: C,
	params: C extends ComponentDefinition<any, infer Params> ? Params : never
): { target: C; params: C extends ComponentDefinition<any, infer Params> ? Params : never };
export function withParams(target: any, params: any) {
	return { target, params };
}
