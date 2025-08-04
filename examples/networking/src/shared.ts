import { f32, u8 } from 'bitecs/serialization'

export const Networked = {}

export const Position = { x: f32([]), y: f32([]) }
export const Health = u8([])

export const components = [Position, Health]

export const MESSAGE_TYPES = {
    SNAPSHOT: 0,
    OBSERVER: 1, 
    SOA: 2
}

