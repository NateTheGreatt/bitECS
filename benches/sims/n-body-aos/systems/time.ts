import { World } from "../world";

export const updateTime = (world:World) => {
    const time = world.time;
    const now = performance.now()
    const delta = now - time.then
    time.delta = delta / 100
    time.then = now
    return world
}