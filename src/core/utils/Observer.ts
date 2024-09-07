import { EntityId } from "../Entity"

export type Observer = (entity: EntityId, ...args: any[]) => void | object

export interface Observable {
  subscribe: (observer: Observer) => () => void
  notify: (entity: EntityId, ...args: any[])  => void | object
}

export const createObservable = (): Observable => {
  const observers = new Set<Observer>()

  const subscribe = (observer: Observer) => {
    observers.add(observer)
    return () => {
      observers.delete(observer)
    }
  }
  const notify = (entity: EntityId, ...args: any[]) => {
    return Array.from(observers).reduce((acc, listener) => {
      const result = listener(entity, ...args)
      return result && typeof result === 'object' ? { ...acc, ...result } : acc
    }, {})
  }

  return {
    subscribe,
    notify
  }
}
