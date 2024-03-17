import { ComponentType } from "@bitecs/classic";

export type ThreadedComponents = {
    read: {
        [key:string]: ComponentType<any>
    },
    write: {
        [key:string]: ComponentType<any>
    }
}
