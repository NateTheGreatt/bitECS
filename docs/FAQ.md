# FAQ

> Is there a string type for components?

Strings are expensive and usually unnecessary to have the ECS handle. Instead, create a mapping of integers to strings, and store the integers in the component data as a reference to a string. This makes string serialization minimal and fast.

> How do I set an undefined value for a property of type `eid`?

The `eid` type is defined interally as an unsigned integer, so it cannot have an undefined or null value and setting it to a negative value will cause it to overflow to `INT_MAX`. Instead, create a "null entity" directly after world creation. This will reserve the `eid` of `0` that you can then use to represent an undefined `eid` property.

> Can I set default values for my component's properties?

You cannot set default values for component properties. You must set their initial value upon adding the component to an entity.
