## Constants

<dl>
<dt><a href="#defineComponent">defineComponent</a> ⇒ <code>object</code></dt>
<dd><p>Defines a new component store.</p>
</dd>
<dt><a href="#registerComponent">registerComponent</a></dt>
<dd><p>Registers a component with a world.</p>
</dd>
<dt><a href="#registerComponents">registerComponents</a></dt>
<dd><p>Registers multiple components with a world.</p>
</dd>
<dt><a href="#hasComponent">hasComponent</a> ⇒ <code>boolean</code></dt>
<dd><p>Checks if an entity has a component.</p>
</dd>
<dt><a href="#addComponent">addComponent</a></dt>
<dd><p>Adds a component to an entity</p>
</dd>
<dt><a href="#removeComponent">removeComponent</a></dt>
<dd><p>Removes a component from an entity and resets component state unless otherwise specified.</p>
</dd>
<dt><a href="#setDefaultSize">setDefaultSize</a></dt>
<dd><p>Sets the default maximum number of entities for worlds and component stores.</p>
</dd>
<dt><a href="#addEntity">addEntity</a> ⇒ <code>number</code></dt>
<dd><p>Adds a new entity to the specified world.</p>
</dd>
<dt><a href="#removeEntity">removeEntity</a></dt>
<dd><p>Removes an existing entity from the specified world.</p>
</dd>
<dt><a href="#getEntityComponents">getEntityComponents</a></dt>
<dd><p>Returns an array of components that an entity possesses.</p>
</dd>
<dt><a href="#entityExists">entityExists</a></dt>
<dd><p>Checks the existence of an entity in a world</p>
</dd>
<dt><a href="#enterQuery">enterQuery</a> ⇒ <code>function</code></dt>
<dd><p>Given an existing query, returns a new function which returns entities who have been added to the given query since the last call of the function.</p>
</dd>
<dt><a href="#exitQuery">exitQuery</a> ⇒ <code>function</code></dt>
<dd><p>Given an existing query, returns a new function which returns entities who have been removed from the given query since the last call of the function.</p>
</dd>
<dt><a href="#defineQuery">defineQuery</a> ⇒ <code>function</code></dt>
<dd><p>Defines a query function which returns a matching set of entities when called on a world.</p>
</dd>
<dt><a href="#resetChangedQuery">resetChangedQuery</a></dt>
<dd><p>Resets a Changed-based query, clearing the underlying list of changed entities.</p>
</dd>
<dt><a href="#removeQuery">removeQuery</a></dt>
<dd><p>Removes a query from a world.</p>
</dd>
<dt><a href="#defineSerializer">defineSerializer</a> ⇒ <code>function</code></dt>
<dd><p>Defines a new serializer which targets the given components to serialize the data of when called on a world or array of EIDs.</p>
</dd>
<dt><a href="#defineDeserializer">defineDeserializer</a> ⇒ <code>function</code></dt>
<dd><p>Defines a new deserializer which targets the given components to deserialize onto a given world.</p>
</dd>
<dt><a href="#defineSystem">defineSystem</a> ⇒ <code>function</code></dt>
<dd><p>Defines a new system function.</p>
</dd>
<dt><a href="#createWorld">createWorld</a> ⇒ <code>object</code></dt>
<dd><p>Creates a new world.</p>
</dd>
<dt><a href="#resetWorld">resetWorld</a> ⇒ <code>object</code></dt>
<dd><p>Resets a world.</p>
</dd>
<dt><a href="#deleteWorld">deleteWorld</a></dt>
<dd><p>Deletes a world.</p>
</dd>
<dt><a href="#getWorldComponents">getWorldComponents</a> ⇒</dt>
<dd><p>Returns all components registered to a world</p>
</dd>
<dt><a href="#getAllEntities">getAllEntities</a> ⇒</dt>
<dd><p>Returns all existing entities in a world</p>
</dd>
</dl>


<br><a name="defineComponent"></a>

## defineComponent ⇒ <code>object</code>
> Defines a new component store.


| Param | Type |
| --- | --- |
| schema | <code>object</code> | 


<br><a name="registerComponent"></a>

## registerComponent
> Registers a component with a world.


| Param | Type |
| --- | --- |
| world | <code>World</code> | 
| component | <code>Component</code> | 


<br><a name="registerComponents"></a>

## registerComponents
> Registers multiple components with a world.


| Param | Type |
| --- | --- |
| world | <code>World</code> | 
| components | <code>Component</code> | 


<br><a name="hasComponent"></a>

## hasComponent ⇒ <code>boolean</code>
> Checks if an entity has a component.


| Param | Type |
| --- | --- |
| world | <code>World</code> | 
| component | <code>Component</code> | 
| eid | <code>number</code> | 


<br><a name="addComponent"></a>

## addComponent
> Adds a component to an entity


| Param | Type | Default |
| --- | --- | --- |
| world | <code>World</code> |  | 
| component | <code>Component</code> |  | 
| eid | <code>number</code> |  | 
| [reset] | <code>boolean</code> | <code>false</code> | 


<br><a name="removeComponent"></a>

## removeComponent
> Removes a component from an entity and resets component state unless otherwise specified.


| Param | Type | Default |
| --- | --- | --- |
| world | <code>World</code> |  | 
| component | <code>Component</code> |  | 
| eid | <code>number</code> |  | 
| [reset] | <code>boolean</code> | <code>true</code> | 


<br><a name="setDefaultSize"></a>

## setDefaultSize
> Sets the default maximum number of entities for worlds and component stores.


| Param | Type |
| --- | --- |
| newSize | <code>number</code> | 


<br><a name="addEntity"></a>

## addEntity ⇒ <code>number</code>
> Adds a new entity to the specified world.

**Returns**: <code>number</code> - eid  

| Param | Type |
| --- | --- |
| world | <code>World</code> | 


<br><a name="removeEntity"></a>

## removeEntity
> Removes an existing entity from the specified world.


| Param | Type |
| --- | --- |
| world | <code>World</code> | 
| eid | <code>number</code> | 


<br><a name="getEntityComponents"></a>

## getEntityComponents
> Returns an array of components that an entity possesses.


| Param | Type |
| --- | --- |
| world | <code>\*</code> | 
| eid | <code>\*</code> | 


<br><a name="entityExists"></a>

## entityExists
> Checks the existence of an entity in a world


| Param | Type |
| --- | --- |
| world | <code>World</code> | 
| eid | <code>number</code> | 


<br><a name="enterQuery"></a>

## enterQuery ⇒ <code>function</code>
> Given an existing query, returns a new function which returns entities who have been added to the given query since the last call of the function.

**Returns**: <code>function</code> - enteredQuery  

| Param | Type |
| --- | --- |
| query | <code>function</code> | 


<br><a name="exitQuery"></a>

## exitQuery ⇒ <code>function</code>
> Given an existing query, returns a new function which returns entities who have been removed from the given query since the last call of the function.

**Returns**: <code>function</code> - enteredQuery  

| Param | Type |
| --- | --- |
| query | <code>function</code> | 


<br><a name="defineQuery"></a>

## defineQuery ⇒ <code>function</code>
> Defines a query function which returns a matching set of entities when called on a world.

**Returns**: <code>function</code> - query  

| Param | Type |
| --- | --- |
| components | <code>array</code> | 


<br><a name="resetChangedQuery"></a>

## resetChangedQuery
> Resets a Changed-based query, clearing the underlying list of changed entities.


| Param | Type |
| --- | --- |
| world | <code>World</code> | 
| query | <code>function</code> | 


<br><a name="removeQuery"></a>

## removeQuery
> Removes a query from a world.


| Param | Type |
| --- | --- |
| world | <code>World</code> | 
| query | <code>function</code> | 


<br><a name="defineSerializer"></a>

## defineSerializer ⇒ <code>function</code>
> Defines a new serializer which targets the given components to serialize the data of when called on a world or array of EIDs.

**Returns**: <code>function</code> - serializer  

| Param | Type | Default |
| --- | --- | --- |
| target | <code>object</code>, <code>array</code> |  | 
| [maxBytes] | <code>number</code> | <code>20000000</code> | 


<br><a name="defineDeserializer"></a>

## defineDeserializer ⇒ <code>function</code>
> Defines a new deserializer which targets the given components to deserialize onto a given world.

**Returns**: <code>function</code> - deserializer  

| Param | Type |
| --- | --- |
| target | <code>object</code>, <code>array</code> | 


<br><a name="defineSystem"></a>

## defineSystem ⇒ <code>function</code>
> Defines a new system function.


| Param | Type |
| --- | --- |
| update | <code>function</code> | 


<br><a name="createWorld"></a>

## createWorld ⇒ <code>object</code>
> Creates a new world.


<br><a name="resetWorld"></a>

## resetWorld ⇒ <code>object</code>
> Resets a world.


| Param | Type |
| --- | --- |
| world | <code>World</code> | 


<br><a name="deleteWorld"></a>

## deleteWorld
> Deletes a world.


| Param | Type |
| --- | --- |
| world | <code>World</code> | 


<br><a name="getWorldComponents"></a>

## getWorldComponents ⇒
> Returns all components registered to a world

**Returns**: Array  

| Param | Type |
| --- | --- |
| world | <code>World</code> | 


<br><a name="getAllEntities"></a>

## getAllEntities ⇒
> Returns all existing entities in a world

**Returns**: Array  

| Param | Type |
| --- | --- |
| world | <code>World</code> | 

