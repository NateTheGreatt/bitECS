# FAQ

### Is there a string type for components?

Strings are expensive and usually unnecessary to have the ECS handle. For enum type strings, it is advised to create a mapping of integer to string, and store the integer in the component data as a reference to a string. This makes string serialization minimal and fast. 

Otherwise, you can define a preallocated `ui8` array and encode strings into that with a `TextEncoder`.
```js
const maxStringLength = 32
const SomeComponent = defineComponent({ string: [Types.ui8, maxStringLength] })
const encoder = new TextEncoder()
SomeComponent.string[eid].set(encoder.encode("hello, world!"))
```

### How do I set an undefined value for a property of type `eid`?

The `eid` type is defined internally as an unsigned integer, so it cannot have an undefined or null value and setting it to a negative value will cause it to overflow to `INT_MAX`. Instead, create a "null entity" directly after world creation. This will reserve the `eid` of `0` that you can then use to represent an undefined `eid` property.

### Can I set default values for my component's properties?

You cannot set default values via `addComponent` calls. You must either create functions that explicitly set default values after adding the component, or you can achieve deferred default values by utilizing enter queries:

```js
const SomeComponent = defineComponent({ value: Types.f32 })
const someQuery = defineQuery([SomeComponent])
const enterSomeQuery = enterQuery(someQuery)

const setDefaultValuesForSomeComponent = eid => {
  SomeComponent.value[eid] = 1
}

enterSomeQuery.forEach(setDefaultValuesForSomeComponent)
```
