import { TODO, createWorld, World as IWorld } from "@bitecs/classic";

export type World = IWorld & {
    workers: Worker[][]
}

export const world = createWorld({
    workers: []
} as TODO);
