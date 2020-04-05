import DataManager from './DataManager.js'

export default (n) => {

    let count = 0
    const removed = []
    const entities = new Uint32Array(n)

    const registry = {
        components: {},
        systems: {},
        threads: {}
    }

    const deferredComponentRemovals = []
    const deferredEntityRemovals = []


    // entity //
    
    const addEntity = () => {
        // assign a removed ID if there are any, otherwise eid = count
        let eid = removed.length ? removed.shift() : count
        entities[eid] = 0b0
        count++
        return eid
    }
    const _removeEntity = eid => {
        // remove entity from all systems
        for(let s in registry.systems) {
            let system = registry.systems[s]
            if(system.check(entities[eid])) 
                system.remove(eid)
        }
        removed.push(eid)
        count--
    }
    const removeEntity = (eid, immediate=false) => {
        if(immediate) _removeEntity(eid)
        else deferredEntityRemovals.push(() => _removeEntity(eid))
    }

    
    // component //

    const registerComponent = (name, schema) => {
        registry.components[name] = DataManager(n, schema)
        return registry.components[name]
    }

    const addComponent = (name, eid, values={}) => {
        let componentManager = registry.components[name]

        if(componentManager == undefined)
            throw new Error(`bitECS Error: cannot add component to entityId ${eid}, '${name}' is not registered.`)
        
        // first, add bitflag to entity bitmask
        entities[eid] |= componentManager._bitflag

        // then, add to systems that match the entity bitmask
        for(let s in registry.systems) {
            let system = registry.systems[s]
            if(system.check(entities[eid])) 
                system.add(eid)
        }

        // zero out each property value
        componentManager._reset(eid)
        
        // set values if any
        componentManager._set(eid, values)

    }

    const _removeComponent = (name, eid) => {
        // first, remove flag from entity bitmask
        entities[eid] &= ~registry.components[name]._bitflag
        
        // then, remove from systems that no longer match the entity bitmask
        for(let s in registry.systems) {
            let system = registry.systems[s]
            if(!system.check(entities[eid])) 
                system.remove(eid)
        }
    }

    const removeComponent = (name, eid, immediate=false) => {
        if(registry.components[name] == undefined)
            throw new Error(`bitECS Error: cannot remove component from entityId ${eid}, '${name}' is not registered.`)

        if(immediate) _removeComponent(name, eid)
        else deferredComponentRemovals.push(() => _removeComponent(name, eid))
    }


    // system //

    const registerSystem = ({ 
        name,
        components: componentDependencies,
        update=()=>null,
        onEnter=()=>null,
        onExit=()=>null,
        onBefore=()=>null,
        onAfter=()=>null
    }) => {

        let system = { name, components: componentDependencies, update, onEnter, onExit }
        let localEntities = []
        
        let componentManagers = componentDependencies.map(dep => {
            if(registry.components[dep] == undefined )
                throw new Error(`bitECS Error: cannot register '${name}' system, '${dep}' is not a registered component.`)
            return registry.components[dep]
        })
        
        // partially apply component managers onto the provided callbacks
        let process = update(...componentManagers)
        let enter = onEnter(...componentManagers)
        let exit = onExit(...componentManagers)
        let before = onBefore(...componentManagers)
        let after = onAfter(...componentManagers)

        // define process function which processes each local entity
        system.process = () => {
            if(before) before()
            if(process) localEntities.forEach(eid => process(eid))
            if(after) after()
        }
        
        // reduce bitflags to create mask
        let mask = componentManagers.reduce((mask, manager) => mask | manager._bitflag, 0b0)
        system.mask = mask

        // checks if an entity mask matches the system's
        system.check = eMask => (eMask & mask) === mask

        // add/remove entity to/from system and invoke onEnter/onExit
        system.add = eid => {
            localEntities.push(eid)
            if(enter) enter(eid)
        }
        system.remove = eid => { 
            localEntities.splice(localEntities.indexOf(eid), 1) 
            if(exit) exit(eid)
        }

        // populate with matching entities
        entities.forEach((mask,eid) => {
            if(system.check(mask)) system.add(eid)
        })

        // set in the registry
        registry.systems[name] = system      

        return system
    }

    
    // thread //
    // TODO
    const registerThread = ({ name, dependencies }) => {
        registry.threads[name] = { name, dependencies }
        return registry.threads[name]
    }


    // update //

    // call all queued removal functions
    const applyRemovalDeferrals = () => {
        deferredComponentRemovals.forEach(fn => fn())
        deferredEntityRemovals.forEach(fn => fn())
    }

    // walk thru each system and call process
    const update = () => {
        for(let s in registry.systems) {
            registry.systems[s].process()
        }
        applyRemovalDeferrals()
    }

    return {
        entities,
        registry,
        addEntity,
        removeEntity,
        registerComponent,
        addComponent,
        removeComponent,
        registerSystem,
        registerThread,
        update
    }
}