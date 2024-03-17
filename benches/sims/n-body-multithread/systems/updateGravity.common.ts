import { ThreadedComponents } from "../utils/threading"

export type UpdateGravityComponents = ThreadedComponents & {
    read: {
        Position: { x: ReadonlyArray<Float64Array>, y: ReadonlyArray<Float64Array> },
        Mass: { value: ReadonlyArray<Float64Array> },
    },
    write: {
        Acceleration: { x: Float64Array, y: Float64Array },
        Velocity: { x: Float64Array, y: Float64Array },
    }
}

export type UpdateGravityInput = {
    workerEntities: Uint32Array,
    bodyEntities: Uint32Array,
}