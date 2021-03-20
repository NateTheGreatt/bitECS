export const Snapshot = (registry, getEntityCount, getEntityCursor) => {
  
  const load = (schema, bin) => {
    if (typeof schema === 'string') schema = JSON.parse(schema)

    const entityCursor = getEntityCursor()
    const entityCount = getEntityCount()

    const componentNames = Object.keys(registry.components)
    const managers = componentNames.map(name => registry.components[name])

    const systemNames = Object.keys(registry.systems)
    
    // how many generations of components
    const generations = Math.ceil(componentNames.length / 32)

    const view = new DataView(bin)
    let viewCursor = 0

    // deserialize entity masks
    for (let i = 0; i < entityCount; i++) {
      for (let k = 0; k < generations; k++) {
        const mask = registry.entities[k]
        mask[i] = view.getUint32(viewCursor)
        viewCursor += Uint32Array.BYTES_PER_ELEMENT
      }
    }

    // deserialize component data
    managers.forEach(manager => {
      manager._flatten().forEach(typedArray => {
        const typeName = typedArray.constructor.name.split('Array')[0]
        const bytesPerElement = typedArray.BYTES_PER_ELEMENT
        const toIndex = entityCursor
        for (let i = 0; i < toIndex; i++) {
          typedArray[i] = view[`get${typeName}`](viewCursor)
          viewCursor += bytesPerElement
        }
      })
    })

    // deserialize all system localEntities
    systemNames.forEach(name => {
      const system = registry.systems[name]
      const [start, end] = schema.systems[name]
      const localEntities = []
      while (viewCursor < end) {
        localEntities.push(view.getUint32(viewCursor))
        viewCursor += Uint32Array.BYTES_PER_ELEMENT
      }
      system.localEntities = localEntities
    })

  }

  const save = () => {
    const entityCursor = getEntityCursor()
    const entityCount = getEntityCount()

    const componentNames = Object.keys(registry.components)
    const managers = componentNames.map(name => registry.components[name])

    const systemNames = Object.keys(registry.systems)
    const systems = systemNames.map(name => registry.systems[name])
    
    // how many generations of components
    const generations = Math.ceil(componentNames.length / 32)
    
    // get total byte sums
    const totalEntityBytes = entityCount * generations * Uint32Array.BYTES_PER_ELEMENT
    const totalComponentBytes = managers.reduce((a,m) => a + m._flatten().reduce((b,c) => b + c.BYTES_PER_ELEMENT * entityCount, 0), 0)
    const totalSystemBytes = systems.reduce((a,s) => a + s.localEntities.reduce((b,c) => b + Uint32Array.BYTES_PER_ELEMENT, 0), 0)

    // make buffer to write to and dataview to write with
    const buffer = new ArrayBuffer(totalEntityBytes + totalComponentBytes + totalSystemBytes)
    const view = new DataView(buffer)
    let viewCursor = 0

    // serialize entity masks
    const entityCursorStart = 0
    for (let i = 0; i < entityCount; i++) {
      for (let k = 0; k < generations; k++) {
        const mask = registry.entities[k]
        view.setUint32(viewCursor, mask[i])
        viewCursor += Uint32Array.BYTES_PER_ELEMENT
      }
    }
    const entityCursorEnd = viewCursor

    const entitySchema = {
      _cursorStart: entityCursorStart,
      _cursorEnd: entityCursorEnd
    }
    
    // serialize component data
    managers.forEach(manager => {
      manager._flatten().forEach(typedArray => {
        const typeName = typedArray.constructor.name.split('Array')[0]
        const bytesPerElement = typedArray.BYTES_PER_ELEMENT
        const toIndex = entityCursor
        typedArray._cursorStart = viewCursor
        for (let i = 0; i < toIndex; i++) {
          view[`set${typeName}`](viewCursor, typedArray[i])
          viewCursor += bytesPerElement
        }
        typedArray._cursorEnd = viewCursor
      })
    })

    // serialize localEntities from systems
    const systemSchemas = {}
    systemNames.forEach(name => {
      const system = registry.systems[name]

      const _cursorStart = viewCursor

      system.localEntities.forEach(eid => {
        view.setUint32(viewCursor, eid)
        viewCursor += Uint32Array.BYTES_PER_ELEMENT
      })

      const _cursorEnd = viewCursor

      systemSchemas[name] = { _cursorStart, _cursorEnd }
    })



    const bin = view.buffer.slice(0, viewCursor)

    const schema = JSON.stringify({
      entities: entitySchema,
      components: registry.components,
      systems: systemSchemas
    }, (k, v) => v.hasOwnProperty('_cursorStart') ? [v._cursorStart, v._cursorEnd] : v)

    return {
      bin,
      schema
    }
  }

  return {
    save,
    load
  }
}