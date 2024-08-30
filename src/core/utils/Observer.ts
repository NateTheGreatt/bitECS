export type Observer = (entity: number, ...args: any[]) => void

export interface Observable {
  subscribe: (observer: Observer) => () => void
  notify: (entity: number, ...args: any[])  => void
}

export const createObservable = (): Observable => {
  const observers = new Set<Observer>()

  const subscribe = (observer: Observer) => {
    observers.add(observer)
    return () => {
      observers.delete(observer)
    }
  }

  const notify = (entity: number, ...args: any[]) => {
    observers.forEach((listener) => listener(entity, ...args))
  }

  return {
    subscribe,
    notify
  }
}
