
import { createObserverSerializer, createObserverDeserializer } from '../serialization/ObserverSerializer'
import { createSoASerializer, createSoADeserializer } from '../serialization/SoASerializer'
import { IWorld, Component, IComponentProp, query } from '../core'

export type Serializer<W extends IWorld = IWorld> = (target: W | number[]) => ArrayBuffer
export type Deserializer<W extends IWorld = IWorld> = (world: W, packet: ArrayBuffer, mode?: 'full' | 'partial') => number[]

export function defineSerializer<W extends IWorld = IWorld>(components: Component[] | IComponentProp[], maxBytes?: number): Serializer<W> {
  const initSet = new WeakSet<Component[] | IComponentProp[]>();
  let serializeObservations: () => ArrayBuffer, serializeData: (indices: number[]) => ArrayBuffer;
  return (world: W | number[]) => {
    if (!initSet.has(components)) {
      initSet.add(components);
      serializeObservations = createObserverSerializer(world, components[0], components);
      serializeData = createSoASerializer(components as Component[]);
    }
    const observerData = serializeObservations();
    const soaData = serializeData(query(world, components) as number[]);
    // Combine observer and soa data into a single ArrayBuffer
    const combinedData = new ArrayBuffer(observerData.byteLength + soaData.byteLength);
    const combinedView = new Uint8Array(combinedData);
    combinedView.set(new Uint8Array(observerData), 0);
    combinedView.set(new Uint8Array(soaData), observerData.byteLength);
    return combinedData;
  }
}

export function defineDeserializer<W extends IWorld = IWorld>(components: Component[] | IComponentProp[]): Deserializer<W> {
  const initSet = new WeakSet<Component[] | IComponentProp[]>();
  let deserializeObservations: any, deserializeData: any
  return (world: W, packet: ArrayBuffer, mode: any): number[] => {
    if (!initSet.has(components)) {
      initSet.add(components);
      deserializeObservations = createObserverDeserializer(world, components[0], components);
      deserializeData = createSoADeserializer(components);
    }
    const observerDataLength = deserializeObservations(packet, mode);
    const soaData = packet.slice(observerDataLength);
    return deserializeData(soaData, mode);
  }
}

export enum DESERIALIZE_MODE {
    REPLACE,
    APPEND,
    MAP
}