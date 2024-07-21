import { Component, ComponentDefinition } from '../component/types';

export type ComponentOrWithParams<C extends Component = Component> =
	| C
	| { target: C; params: C extends ComponentDefinition<any, infer P> ? P : never };
