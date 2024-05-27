import { World } from '@sim/n-body';
import { scene } from '../scene';
import { camera, renderer } from '../main';

export const render = (_world: World) => {
	renderer.render(scene, camera);
};
