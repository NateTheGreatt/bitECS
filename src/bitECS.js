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
    
    
    /**
     * Add an entity
     *
     * @returns {uint32} eid
     */
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
    /**
     * Remove an entity by eid
     *
     * @param {uint32} eid entity id
     * @param {boolean} [immediate=false] optional flag for immediate execution (removal is deferred if false)
     */
    const removeEntity = (eid, immediate=false) => {
        if(immediate) _removeEntity(eid)
        else deferredEntityRemovals.push(() => _removeEntity(eid))
    }

    
    // component //

    /**
     * Register a new type of component
     *
     * @param {string} name name of component type
     * @param {object} schema structure used for the component
     * @returns {object} DataManager for the component type
     */
    const registerComponent = (name, schema) => {
        registry.components[name] = DataManager(n, schema)
        return registry.components[name]
    }

    /**
     * Add a new component type onto an entity
     *
     * @param {string} name name of the component type
     * @param {uint32} eid entity id
     * @param {object} [values={}] optional values to set upon component initialization
     */
    const addComponent = (name, eid, values={}) => {
        let componentManager = registry.components[name]

        if(componentManager == undefined)
            throw new Error(`bitECS Error: cannot add component to entityId ${eid}, '${name}' is not registered.`)

        if((entities[eid] & componentManager._bitflag) === componentManager._bitflag) return
        
        // first, add bitflag to entity bitmask
        entities[eid] |= componentManager._bitflag

        // then, add to systems that match the entity bitmask
        for(let s in registry.systems) {
            let system = registry.systems[s]
            if((system.mask & componentManager._bitflag) === componentManager._bitflag
                && system.check(entities[eid]))
                system.add(eid)
        }

        // zero out each property value
        componentManager._reset(eid)
        
        // set values if any
        componentManager._set(eid, values)

    }

    const _removeComponent = (name, eid) => {
        
        if(!(entities[eid] & componentManager._bitflag)) return

        // first, remove flag from entity bitmask
        entities[eid] &= ~registry.components[name]._bitflag
        
        // then, remove from systems that no longer match the entity bitmask
        for(let s in registry.systems) {
            let system = registry.systems[s]
            if(!system.check(entities[eid])) 
                system.remove(eid)
        }
    }

    /**
     * Remove a component type from an entity
     *
     * @param {string} name name of the component type
     * @param {uint32} eid entity id
     * @param {boolean} [immediate=false] optional flag for immediate execution (removal is deferred if false)
     */
    const removeComponent = (name, eid, immediate=false) => {
        if(registry.components[name] == undefined)
            throw new Error(`bitECS Error: cannot remove component from entityId ${eid}, '${name}' is not registered.`)

        if(immediate) _removeComponent(name, eid)
        else deferredComponentRemovals.push(() => _removeComponent(name, eid))
    }


    // system //

    /**
     * Register a new system
     *
     * @param {object} { 
     *         name,
     *         components: componentDependencies,
     *         update=()=>null,
     *         onEnter=()=>null,
     *         onExit=()=>null,
     *         onBefore=()=>null,
     *         onAfter=()=>null,
     *         onBeforeEach=()=>null,
     *         onAfterEach=()=>null
     *     }
     * @returns {object}
     */
    const registerSystem = ({ 
        name,
        components: componentDependencies,
        update=()=>null,
        onEnter=()=>null,
        onExit=()=>null,
        onBefore=()=>null,
        onAfter=()=>null,
        onBeforeEach=()=>null,
        onAfterEach=()=>null
    }) => {

        let system = {
            name, 
            components: componentDependencies, 
            update, 
            onEnter, 
            onExit,
            onBefore, 
            onAfter,
            onBeforeEach,
            onAfterEach
        }
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
        let beforeEach = onBeforeEach(...componentManagers)
        let afterEach = onAfterEach(...componentManagers)

        // define process function which processes each local entity
        system.process = () => {
            if(onBefore) onBefore(...componentManagers)
            localEntities.forEach(eid => {
                if(beforeEach) beforeEach(eid)
                if(process) process(eid)
                if(afterEach) afterEach(eid)
            })
            if(onAfter) onAfter(...componentManagers)
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

    
    // update //

    // call all queued removal functions
    const applyRemovalDeferrals = () => {
        while(deferredComponentRemovals.length > 0){
            deferredComponentRemovals.shift()()
        }
        while(deferredEntityRemovals.length > 0){
            deferredEntityRemovals.shift()()
        }
    }

    /**
     * Update the state of all systems
     *
     */
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
        update
    }
}