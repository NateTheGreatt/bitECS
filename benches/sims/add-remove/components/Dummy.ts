import { CONSTANTS } from '../constants';

export const DummyComponents = [] as object[];

for (let i = 0; i < CONSTANTS.COMPONENTS; i++) {
	DummyComponents.push(new Object());
}
