import { addComponents as coreAddComponents, World, ComponentRef } from '../core'

export const addComponent = (world: World, eid: number, ...components: ComponentRef[]): void =>
  coreAddComponents(world, components, eid)
