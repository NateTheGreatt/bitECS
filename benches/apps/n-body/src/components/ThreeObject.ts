import { defineComponent } from '@bitecs/core';
import * as THREE from 'three';

export const ThreeObject = defineComponent({
	store: () => new Array<THREE.InstancedMesh>(),
});
