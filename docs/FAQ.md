# FAQ

> Is there a string type for components?

Strings are expensive and usually unnecessary to have the ECS handle. Instead, create a mapping of integers to strings, and store the integers in the component data as a reference to a string. This makes string serialization minimal and fast.