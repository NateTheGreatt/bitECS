import assert, { strictEqual } from 'assert'
import { defineComponent } from '../../src/Component.js'
import { canonicalize } from '../../src/Serialize.js'
import { Changed } from '../../src/Query.js'
import { TYPES_ENUM } from '../../src/Constants.js'

const Types = TYPES_ENUM

describe('Serialize Unit Tests', () => {
  it('should canonicalize component', () => {
    const C = defineComponent({value:Types.f32})
    const target = [C]
    const [componentProps, changedProps] = canonicalize(target)
    strictEqual(componentProps[0], C.value)
  })
  it('should canonicalize Changed modifier on properties', () => {
    const C = defineComponent({value:Types.f32})
    const target = [Changed(C.value)]
    const [componentProps, changedProps] = canonicalize(target)
    strictEqual(changedProps.has(C.value), true)
  })
  it('should canonicalize Changed modifier on array properties', () => {
    const ArrayComponent = defineComponent({ values: [Types.f32, 3] })
    const target = [Changed(ArrayComponent.values)]

    const [componentProps, changedProps] = canonicalize(target)
    strictEqual(changedProps.has(ArrayComponent.values), true)
  })
})
