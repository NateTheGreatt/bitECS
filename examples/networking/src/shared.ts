import { f32, u8 } from '../../../src/serialization'

export const Position = { x: f32([]), y: f32([]) }
export const Health = { value: u8([]) }

export const components = [Position, Health]

export const MESSAGE_TYPES = {
    SNAPSHOT: 0,
    OBSERVER: 1, 
    SOA: 2
}

export const Networked = {}
