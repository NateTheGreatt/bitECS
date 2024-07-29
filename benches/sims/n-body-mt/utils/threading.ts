import { ComponentType } from '@bitecs/core';

export type ThreadedComponents = {
	read: {
		[key: string]: ComponentType<any>;
	};
	write: {
		[key: string]: ComponentType<any>;
	};
};
