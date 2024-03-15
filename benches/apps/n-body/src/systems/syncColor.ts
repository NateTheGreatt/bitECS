import { defineSystem } from "@bitecs/classic";
import { Color, bodyQuery } from "n-body-sim";
import * as THREE from "three";
import { ThreeObject } from "../components/ThreeObject";

export const syncColor = defineSystem((world) => {
  const eids = bodyQuery(world);

  for (let i = 0; i < eids.length; i++) {
    const eid = eids[i];
    const sphere = ThreeObject[eid];

    (sphere.material as THREE.MeshBasicMaterial).color.set(
      Color.r[eid],
      Color.g[eid],
      Color.b[eid]
    );
  }
});
