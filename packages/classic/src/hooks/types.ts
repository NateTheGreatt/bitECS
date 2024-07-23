import { Component } from '../component/types';

export type ComponentOrWithParams<C extends Component = Component> =
	| C
	| [C, C extends Component<any, infer P> ? P : never];
