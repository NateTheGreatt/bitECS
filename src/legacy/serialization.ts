
import { createObserverSerializer, createObserverDeserializer } from '../serialization/ObserverSerializer'
import { createSoASerializer, createSoADeserializer } from '../serialization/SoASerializer'
import { IWorld, Component, IComponentProp } from './index'

export type Serializer<W extends IWorld = IWorld> = (world: W, ents: number[]) => ArrayBuffer
export type Deserializer<W extends IWorld = IWorld> = (world: W, packet: ArrayBuffer, mode?: DESERIALIZE_MODE) => number[]

export function defineSerializer<W extends IWorld = IWorld>(components: Component[] | IComponentProp[], maxBytes?: number): Serializer<W> {
  const initSet = new WeakSet<W>();
  let serializeObservations: () => ArrayBuffer, serializeData: (indices: number[]) => ArrayBuffer;
  return (world: W, ents: number[]) => {
    if (!initSet.has(world)) {
      initSet.add(world);
      serializeObservations = createObserverSerializer(world, components[0], components);
      serializeData = createSoASerializer(components as Component[]);
    }
    const observerData = serializeObservations();
    const soaData = serializeData(ents);
    // Combine observer and soa data into a single ArrayBuffer
    const combinedData = new ArrayBuffer(observerData.byteLength + soaData.byteLength);
    const combinedView = new Uint8Array(combinedData);
    combinedView.set(new Uint8Array(observerData), 0);
    combinedView.set(new Uint8Array(soaData), observerData.byteLength);
    return combinedData;
  }
}

export function defineDeserializer<W extends IWorld = IWorld>(components: Component[] | IComponentProp[]): Deserializer<W> {
  const initSet = new WeakSet<W>();
  let deserializeObservations: any, deserializeData: any
  return (world: W, packet: ArrayBuffer, mode: any): number[] => {
    if (!initSet.has(world)) {
      initSet.add(world);
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