import { Not, Pair, Schema, addComponent, addComponents, addEntity, defineComponent, defineRelation, query, removeComponent, removeComponents, removeEntity, type Component, type RelationType, type World } from "@bitecs/classic";
import type OpenAI from "openai";
import type { ChatCompletionMessage, ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/index.mjs";
import { FilterOperationNames, applyFilters, type FilterCriterion, type FilterOperations } from "./Filtering";
import { $schema } from "@bitecs/classic/src/component/symbols";
import { ChatCompletionMessageToolCall } from "openai/src/resources/index.js";

export type AddRelationParams = {
    relationName: string
    relationSubjects: number[]
    entities: number[]
}

export type AddComponentParams = {
    componentNames: string[]
    entities: number[]
}

export type SetPropertyValuesParams = {
    propertyName: string
    propertyValue: number | string
}

export type SetComponentValueParams = {
    componentName: string
    propertyValues: SetPropertyValuesParams[]
}

export type SetComponentValuesParams = {
    setComponentValues: SetComponentValueParams[]
    entities: number[]
}

export type SetRelationValueParams = {
    relationName: string
    relationSubjectEntityId: number
    propertyValues: SetPropertyValuesParams[]
}

export type SetRelationValuesParams = {
    setRelationValues: SetRelationValueParams[]
    entities: number[]
}

export type GetComponentValuesParams = {
    componentName: string
    propertyNames: string[]
    entityId: number
}

export type GetRelationValuesParams = {
    relationName: string
    relationSubjectEntityId: number
    propertyNames: string[]
    entityId: number
}

export type ComponentFilter = {
    componentName: string, 
    propertyName: string, 
    operationName: string, 
    values: (string | number)[]
}

export type FilterParams = {
    componentFilters: ComponentFilter[]
    entities: number[]
}

export type RelationQueryParam = {
    relationName: string,
    relationSubjectEntityId: string,
}

export type QueryParams = {
    componentNames: string[]
    notComponentNames: string[]
    relations: RelationQueryParam[]
    notRelations: RelationQueryParam[]
}

export type ComponentMap = { [key: string]: Component }
export type RelationMap = { [key: string]: RelationType<any> }
export type EntityMap = { [key: string]: number }

export type CreateAgentParams = {
    llm: OpenAI,
    model: string,
    components: ComponentMap,
    relations: ComponentMap,
    entities: EntityMap,
    functionCallLog?: ChatCompletionMessage[]
}


const ecsAddEntity = (world: World, {components: componentMap, relations: relationMap, entities: entityMap}: CreateAgentParams) => ({name}: {name:string}) => {
    entityMap[name] = addEntity(world)
    return entityMap[name]
}

const ecsRemoveEntity = (world: World, {components: componentMap, relations: relationMap, entities: entityMap}: CreateAgentParams) => ({entityId}: {entityId:number}) => {
    // TODO: optimize
    for (const key of Object.keys(entityMap)) {
        if (entityMap[key] === entityId) {
            delete entityMap[key]
            break
        }
    }
    removeEntity(world, entityId)
    return 'entity removed'
}

const ecsCreateComponentType = (world: World, {components: componentMap, relations: relationMap, entities: entityMap}: CreateAgentParams) => ({name, schema}: {name:string, schema: Schema}) => {
    componentMap[name] = defineComponent(schema)
    return 'component created'
}

const ecsCreateRelationType = (world: World, {components: componentMap, relations: relationMap, entities: entityMap}: CreateAgentParams) => ({name, schema={}}: {name:string, schema: Schema}) => {
    componentMap[name] = defineRelation(schema)
    return 'relation created'
}

const ecsAddComponents = (world: World, {components: componentMap, relations: relationMap, entities: entityMap}: CreateAgentParams) => ({componentNames, entities}:AddComponentParams) => {
    if (!Array.isArray(componentNames)) {
        componentNames = [componentNames]
    }
    const components = componentNames.map(name => componentMap[name])
    for (const eid of entities) {
        addComponents(world, components, eid)
    }
    return 'components added'
}

const ecsRemoveComponents = (world: World, {components: componentMap, relations: relationMap, entities: entityMap}: CreateAgentParams) => ({componentNames, entities}:AddComponentParams) => {
    if (!Array.isArray(componentNames)) {
        componentNames = [componentNames]
    }
    const components = componentNames.map(name => componentMap[name])
    for (const eid of entities) {
        removeComponents(world, components, eid)
    }
    return 'components removed'
}

const ecsSetComponentValues = (world: World, {components: componentMap, relations: relationMap, entities: entityMap}: CreateAgentParams) => ({setComponentValues, entities}:SetComponentValuesParams) => {
    for (const {componentName, propertyValues} of setComponentValues) {
        const component = componentMap[componentName]
        for (const {propertyName, propertyValue} of propertyValues) {
            for (const eid of entities) {
                component[propertyName][eid] = propertyValue
                // addComponent(world, component, eid)
            }
        }
    }
    return 'component values set'
}

const ecsSetRelationValues = (world: World, {components: componentMap, relations: relationMap, entities: entityMap}: CreateAgentParams) => ({setRelationValues, entities}:SetRelationValuesParams) => {
    for (const {relationName, relationSubjectEntityId, propertyValues} of setRelationValues) {
        const relation = relationMap[relationName]
        const relationComponent = Pair(relation, relationSubjectEntityId)
        for (const {propertyName, propertyValue} of propertyValues) {
            for (const eid of entities) {
                relationComponent[propertyName][eid] = propertyValue
                // addComponent(world, relationComponent, eid)
            }
        }
    }
    return 'relation values set'
}

const ecsGetComponentValues = (world: World, {components: componentMap, relations: relationMap, entities: entityMap}: CreateAgentParams) => ({componentName, propertyNames, entityId}:GetComponentValuesParams) => {
    const obj: any = {}
    const component = componentMap[componentName]
    for (const propertyName of propertyNames) {
        obj[propertyName] = component[propertyName][entityId]
    }
    return obj
}

const ecsGetRelationValues = (world: World, {components: componentMap, relations: relationMap, entities: entityMap}: CreateAgentParams) => ({relationName, relationSubjectEntityId, propertyNames, entityId}:GetRelationValuesParams) => {
    const obj: any = {}
    const relation = relationMap[relationName]
    const relationComponent = Pair(relation, relationSubjectEntityId)
    for (const propertyName of propertyNames) {
        obj[propertyName] = relationComponent[propertyName][entityId]
    }
    return obj
}

const ecsAddRelations = (world: World, {components: componentMap, relations: relationMap, entities: entityMap}: CreateAgentParams) => ({relationName, relationSubjects, entities}:AddRelationParams) => {
    const relation = relationMap[relationName]
    for (const eid of entities) {
        for (const subject of relationSubjects) {
            addComponent(world, Pair(relation, subject), eid)
        }
    }
    return 'relations added'
}


const ecsRemoveRelations = (world: World, {components: componentMap, relations: relationMap, entities: entityMap}: CreateAgentParams) => ({relationName, relationSubjects, entities}:AddRelationParams) => {
    const relation = relationMap[relationName]
    for (const eid of entities) {
        for (const subject of relationSubjects) {
            removeComponent(world, Pair(relation, subject), eid)
        }
    }
    return 'relations removed'
}

const ecsQuery = (world: World, {components: componentMap, relations: relationMap, entities: entityMap}: CreateAgentParams) => ({componentNames, notComponentNames, relations, notRelations}:QueryParams) => {
    const components = componentNames ? componentNames.map(name => componentMap[name]) : []
    const notComponents = notComponentNames ? notComponentNames.map(name => Not(componentMap[name])) : []
    const relationPairs = relations ? relations.map(({relationName, relationSubjectEntityId: entityId}) => {
        const eid = typeof entityId === 'string' ? entityMap[entityId] : parseInt(entityId)
        return Pair(relationMap[relationName], eid)
    }) : []    
    const notRelationPairs = notRelations ? notRelations.map(({relationName, relationSubjectEntityId: entityId}) => {
        const eid = typeof entityId === 'string' ? entityMap[entityId] : parseInt(entityId)
        return Not(Pair(relationMap[relationName], eid))
    }) : []
    
    const results = query(world, [...components, ...notComponents, ...relationPairs, ...notRelationPairs])
    return Array.from(results)
}

// TODO: optimize
const ecsFilter = (world: World, {components: componentMap, relations: relationMap, entities: entityMap}: CreateAgentParams) => ({componentFilters, entities}:FilterParams) => {
    return entities.filter(eid => {
        for (const {componentName, propertyName, operationName, values} of componentFilters) {
            const component = componentMap[componentName]
            const prop = component[propertyName]
            
            const filter = { field: propertyName, operation: operationName as FilterOperations, values } as FilterCriterion
            
            const obj = { [propertyName]: prop[eid] }
            
            if (applyFilters([obj], [filter]).length === 0) {
                return false
            }
        }
        
        return true
    })
}

const ecsEntityIdLookup = (world: World, {components: componentMap, relations: relationMap, entities: entityMap}: CreateAgentParams) => ({entityNames}:{entityNames:string[]}) => {
    return entityNames.map(name => entityMap[name])
}

export const createAgent = (
    params:CreateAgentParams
) => {
    const {llm, model, components: componentMap, relations: relationMap, entities: entityMap, functionCallLog} = params
    
    const componentDefinitions = Object.entries(componentMap)
        .reduce((defs,[name, component]) => {
            defs[name] = component[$schema]
            return defs
        }, {} as any)

    const tools: ChatCompletionTool[] = [
        {
            type: "function",
            function: {
                name: "ecsAddEntity",
                description: "Adds a new entity to the world.",
                parameters: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "The name of the entity to add to the world.",
                        },
                    },
                    required: ["name"],
                },
            },
        },
        {
            type: "function",
            function: {
                name: "ecsRemoveEntity",
                description: "Removes an entity from the world.",
                parameters: {
                    type: "object",
                    properties: {
                        entityId: {
                            type: "number",
                            description: "The entity ID to remove from the world.",
                        },
                    },
                    required: ["entityId"],
                },
            },
        },
        {
            type: "function",
            function: {
                name: "ecsAddComponents",
                description: "Adds components to entities.",
                parameters: {
                    type: "object",
                    properties: {
                        componentNames: {
                            type: "array",
                            enum: Object.keys(componentMap),
                            description: "The array of components to add to the entities.",
                        },
                        entities: {
                            type: "array",
                            items: { type: "number" },
                            description: "The array of entities to add the components to.",
                        },
                    },
                    required: ["components", "entities"],
                },
            },
        },
        {
            type: "function",
            function: {
                name: "ecsRemoveComponents",
                description: "Removes components to entities.",
                parameters: {
                    type: "object",
                    properties: {
                        componentNames: {
                            type: "array",
                            enum: Object.keys(componentMap),
                            description: "The array of components to remove from the entities.",
                        },
                        entities: {
                            type: "array",
                            items: { type: "number" },
                            description: "The array of entities to remove the components from.",
                        },
                    },
                    required: ["components", "entities"],
                },
            },
        },
        {
            type: "function",
            function: {
                name: "ecsQuery",
                description: "Queries the ECS game world for entities who have the passed in components on them.",
                parameters: {
                    type: "object",
                    properties: {
                        componentNames: {
                            type: "array",
                            description: "An array of component names. DO NOT INCLUDE RELATIONS IN THIS PROPERTY",
                            enum: Object.keys(componentMap),
                        },
                        notComponentNames: {
                            type: "array",
                            description: "An array of Not-based component names",
                            enum: Object.keys(componentMap),
                        },
                        relations: {
                            type: "array",
                            description: "An array of relation query parameters",
                            items: {
                                type: "object",
                                properties: {
                                    relationName: {
                                        enum: Object.keys(relationMap),
                                        description: "The name of the relation"
                                    },
                                    relationSubjectEntityId: {
                                        type: "number",
                                        description: "The ID of the entity"
                                    }
                                },
                                required: ["relationName", "relationSubjectEntityId"],
                            }
                        },
                        notRelations: {
                            type: "array",
                            description: "An array of Not-based relation query parameters",
                            items: {
                                type: "object",
                                properties: {
                                    relationName: {
                                        enum: Object.keys(relationMap),
                                        description: "The name of the relation"
                                    },
                                    relationSubjectEntityId: {
                                        type: "number",
                                        description: "The ID of the entity"
                                    }
                                },
                                required: ["relationName", "relationSubjectEntityId"],
                            }
                        }
                    },
                },
            },
        },
        {
            type: "function",
            function: {
                name: "ecsEntityIdLookup",
                description: "Looks up one or more entity IDs by name.",
                parameters: {
                    type: "object",
                    properties: {
                        entityNames: {
                            type: "array",
                            items: {
                                enum: Object.keys(entityMap),
                            },
                            description: "The name of the entity.",
                        },
                    },
                    required: ["entityName"],
                },
            },
        },
        {
            type: "function",
            function: {
                name: "ecsAddRelations",
                description: "Adds relations between entities.",
                parameters: {
                    type: "object",
                    properties: {
                        relationName: {
                            type: "string",
                            enum: Object.keys(relationMap),
                            description: "The name of the relation to add.",
                        },
                        relationSubjects: {
                            type: "array",
                            items: { type: "number" },
                            description: "The array of subject entity IDs to add the relation to.",
                        },
                        entities: {
                            type: "array",
                            items: { type: "number" },
                            description: "The array of entity IDs to add the relation from.",
                        },
                    },
                    required: ["relationName", "relationSubjects", "entities"],
                },
            },
        },
        {
            type: "function",
            function: {
                name: "ecsRemoveRelations",
                description: "Removes relations between entities.",
                parameters: {
                    type: "object",
                    properties: {
                        relationName: {
                            type: "string",
                            enum: Object.keys(relationMap),
                            description: "The name of the relation to remove.",
                        },
                        relationSubjects: {
                            type: "array",
                            items: { type: "number" },
                            description: "The array of subject entity IDs to remove the relation from.",
                        },
                        entities: {
                            type: "array",
                            items: { type: "number" },
                            description: "The array of entity IDs to remove the relation from.",
                        },
                    },
                    required: ["relationName", "relationSubjects", "entities"],
                },
            },
        },
        {
            type: "function",
            function: {
                name: "ecsSetComponentValues",
                description: "Sets the values of various components for a list of entities.",
                parameters: {
                    type: "object",
                    properties: {
                        setComponentValues: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    componentName: {
                                        type: "string",
                                        description: "The name of the component whose values are to be set."
                                    },
                                    propertyValues: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                propertyName: {
                                                    type: "string",
                                                    description: "The name of the property to set a value for."
                                                },
                                                propertyValue: {
                                                    type: ["number", "string"],
                                                    description: "The value to set for the property."
                                                }
                                            },
                                            required: ["propertyName", "propertyValue"],
                                            description: "A list of property names and their corresponding values."
                                        },
                                        description: "An array of property values to be set for the component."
                                    }
                                },
                                required: ["componentName", "propertyValues"],
                                description: "Specifies a component and the values to be set for its properties."
                            },
                            description: "An array of components and their new values."
                        },
                        entities: {
                            type: "array",
                            items: { 
                                type: "number",
                                description: "An array of entity identifiers."
                            },
                            description: "The array of entities to update the component values for."
                        }
                    },
                    required: ["setComponentValues", "entities"],
                    description: "The parameters required to set component values for entities."
                }
            }
        },
        {
            type: "function",
            function: {
                name: "ecsSetRelationValues",
                description: "Sets the values of various relations for a list of entities.",
                parameters: {
                    type: "object",
                    properties: {
                        setRelationValues: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    relationName: {
                                        type: "string",
                                        description: "The name of the relation to be modified."
                                    },
                                    relationSubjectEntityId: {
                                        type: "number",
                                        description: "The entity ID that is the subject of the relation."
                                    },
                                    propertyValues: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                propertyName: {
                                                    type: "string",
                                                    description: "The name of the property to set a value for."
                                                },
                                                propertyValue: {
                                                    type: ["number", "string"],
                                                    description: "The value to set for the property."
                                                }
                                            },
                                            required: ["propertyName", "propertyValue"],
                                            description: "A list of property names and their corresponding values to be set within the relation."
                                        },
                                        description: "An array of property values related to the specified relation."
                                    }
                                },
                                required: ["relationName", "relationSubjectEntityId", "propertyValues"],
                                description: "Specifies a relation and the values to be set for its properties."
                            },
                            description: "An array of relations and their new values to be set for specified entities."
                        },
                        entities: {
                            type: "array",
                            items: { 
                                type: "number",
                                description: "An array of entity identifiers."
                            },
                            description: "The array of entities to which the relation values updates apply."
                        }
                    },
                    required: ["setRelationValues", "entities"],
                    description: "The parameters required to set relation values for entities."
                }
            }
        },
        {
            type: "function",
            function: {
                name: "ecsGetComponentValues",
                description: "Retrieves the values of specified properties from a component of an entity.",
                parameters: {
                    type: "object",
                    properties: {
                        componentName: {
                            type: "string",
                            description: "The name of the component from which values are to be retrieved."
                        },
                        propertyNames: {
                            type: "array",
                            items: {
                                type: "string",
                                description: "The names of the properties whose values are to be retrieved."
                            },
                            description: "An array of property names to retrieve values from within the component."
                        },
                        entityId: {
                            type: "number",
                            description: "The ID of the entity from which component values are to be retrieved."
                        }
                    },
                    required: ["componentName", "propertyNames", "entityId"],
                    description: "The parameters required to retrieve component values for an entity."
                }
            }
        },
        {
            type: "function",
            function: {
                name: "ecsGetRelationValues",
                description: "Retrieves the values of specified properties from a relation of an entity.",
                parameters: {
                    type: "object",
                    properties: {
                        relationName: {
                            type: "string",
                            description: "The name of the relation from which values are to be retrieved."
                        },
                        relationSubjectEntityId: {
                            type: "number",
                            description: "The entity ID that is the subject of the relation."
                        },
                        propertyNames: {
                            type: "array",
                            items: {
                                type: "string",
                                description: "The names of the properties whose values are to be retrieved from the relation."
                            },
                            description: "An array of property names to retrieve values from within the relation."
                        },
                        entityId: {
                            type: "number",
                            description: "The ID of the entity involved in the relation from which values are to be retrieved."
                        }
                    },
                    required: ["relationName", "relationSubjectEntityId", "propertyNames", "entityId"],
                    description: "The parameters required to retrieve relation values for an entity."
                }
            }
        },
        {
            type: "function",
            function: {
                name: "ecsFilter",
                description: "Filters entities based on components and specific filter criteria.",
                parameters: {
                    type: "object",
                    properties: {
                        componentFilters: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    componentName: {
                                        type: "string"
                                    },
                                    propertyName: {
                                        type: "string"
                                    },
                                    operationName: {
                                        type: "string"
                                    },
                                    values: {
                                        type: "array",
                                        items: {
                                            oneOf: [
                                                {
                                                    type: "string"
                                                },
                                                {
                                                    type: "number"
                                                }
                                            ]
                                        }
                                    }
                                },
                                required: ["componentName", "propertyName", "operationName", "values"]
                            }
                        },
                        entities: {
                            type: "array",
                            items: {
                                type: "number"
                            }
                        }
                    },
                    required: ["componentFilters", "entities"],
                    // type: "object",
                    // properties: {
                    //   componentFilters: {
                    //     type: "array",
                    //     items: {
                    //     },
                    //     additionalProperties: {
                    //       type: "array",
                    //       items: {
                    //         type: "object",
                    //         properties: {
                    //           field: {
                    //             type: ["string", "null"],
                    //             description: "The field of the component to apply the filter operation on."
                    //           },
                    //           operation: {
                    //             type: "string",
                    //             enum: Object.keys(FilterOperationNames),
                    //             description: "The NAME OF THE OPERATION to apply for the filter criteria."
                    //           },
                    //           values: {
                    //             type: ["array", "null"],
                    //             items: {
                    //               type: ["string", "number"]
                    //             },
                    //             description: "The values to use for the filter operation."
                    //           },
                    //           criteria: {
                    //             type: ["array", "null"],
                    //             items: {
                    //               ref: "#/function/parameters/properties/componentFilters/additionalProperties/items"
                    //             },
                    //             description: "The nested criteria for complex logical operations such as 'And', 'Or', 'Not'."
                    //           }
                    //         },
                    //         required: ["operation"],
                    //         description: "A filter criterion to be applied to a component field."
                    //       }
                    //     },
                    //     description: "A mapping of component names to their respective filter criteria."
                    //   },
                    //   entities: {
                    //     type: "array",
                    //     items: { type: "number" },
                    //     description: "The array of entity IDs to filter."
                    //   }
                    // },
                    // required: ["componentNames", "componentFilters", "entities"],
                    // description: "The parameters required to perform the filtering operation."
                }
            }
        }
    ]
        
    return async (world: World, prompt: string) => {
        const llmFunctions: {[key:string]: Function} = {
            ecsAddEntity: ecsAddEntity(world, params),
            ecsRemoveEntity: ecsRemoveEntity(world, params),
            ecsAddComponents: ecsAddComponents(world, params),
            ecsRemoveComponents: ecsRemoveComponents(world, params),
            ecsAddRelations: ecsAddRelations(world, params),
            ecsRemoveRelations: ecsRemoveRelations(world, params),
            ecsSetComponentValues: ecsSetComponentValues(world, params),
            ecsSetRelationValues: ecsSetRelationValues(world, params),
            ecsGetComponentValues: ecsGetComponentValues(world, params),
            ecsGetRelationValues: ecsGetRelationValues(world, params),
            ecsQuery: ecsQuery(world, params),
            ecsFilter: ecsFilter(world, params),
            ecsEntityIdLookup: ecsEntityIdLookup(world, params),
        }
        const messages: ChatCompletionMessageParam[] = [
            { role: 'system', content: `
            You are an agent that is aware of a running ECS world. You are capable of calling functions that modify the state of the ECS.
            Take the user's input and call the appropriate functions to complete their request.
            Relations are not components. Relations are the predicates of the prompt sentences.
            Make sure to always pair an entity with a relation, and never confuse a relation with a component.
            Do not include component names that are not mentioned in the input prompt.
            componentNames and relationNames are ALWAYS arrays of strings.
            Entity names are strings.
            Entity IDs are integers.
            Filter operation names are: ${JSON.stringify(Object.keys(FilterOperationNames))}
            You must ALWAYS add a component or relation before setting a value for it.
            ALWAYS look up entity IDs by name, NEVER assume or make up an entity ID.

            Here are all of the component definitions:
            \`\`\`
            ${JSON.stringify(componentDefinitions)}
            \`\`\`
            
            Here are all of the types for the function inputs:
            \`\`\`typescript
            type AddRelationParams = {
                relationName: string
                relationSubjects: number[]
                entities: number[]
            }
            
            type AddComponentParams = {
                componentNames: string[]
                entities: number[]
            }
            
            type SetPropertyValuesParams = {
                propertyName: string
                propertyValue: number | string
            }
            
            type SetComponentValueParams = {
                componentName: string
                propertyValues: SetPropertyValuesParams[]
            }
            
            type SetComponentValuesParams = {
                setComponentValues: SetComponentValueParams[]
                entities: number[]
            }
            
            type SetRelationValueParams = {
                relationName: string
                relationSubjectEntityId: number
                propertyValues: SetPropertyValuesParams[]
            }
            
            type SetRelationValuesParams = {
                setRelationValues: SetRelationValueParams[]
                entities: number[]
            }
            
            type GetComponentValuesParams = {
                componentName: string
                propertyNames: string[]
                entityId: number
            }
            
            type GetRelationValuesParams = {
                relationName: string
                relationSubjectEntityId: number
                propertyNames: string[]
                entityId: number
            }
            
            type ComponentFilter = {
                componentName: string, 
                propertyName: string, 
                operationName: string, 
                values: (string | number)[]
            }
            
            type FilterParams = {
                componentFilters: ComponentFilter[]
                entities: number[]
            }
            
            type RelationQueryParam = {
                relationName: string,
                relationSubjectEntityId: string,
            }
            
            type QueryParams = {
                componentNames: string[]
                notComponentNames: string[]
                relations: RelationQueryParam[]
                notRelations: RelationQueryParam[]
            }
            \`\`\`

            It is VERY important that you set component values BEFORE you add the component, to ensure that the data is available by the time you add it for on-add logic to catch.
            ALWAYS SET COMPONENT VALUES BEFORE ADDING THEM. NEVER ADD COMPONENTS BEFORE SETTING VALUES.
            ONLY USE ONE TOOL AT A TIME. NEVER USE MULTIPLE TOOLS AT ONCE. NEVER USE PARALLEL FUNCTION CALLING.
            `},
            { role: "user", content: prompt },
        ]
        
        let lastResponse
        while(true) {
            const response = await llm.chat.completions.create({
                model: model || "gpt-4-turbo-preview",
                messages,
                tools,
                temperature: 0.7,
                seed: 42,
            })
            const responseMessage = response.choices[0].message

            const toolCalls = responseMessage.tool_calls
            if (toolCalls) {
                if (functionCallLog) functionCallLog.push(responseMessage)
                messages.push(responseMessage)
                for (const toolCall of toolCalls) {
                    const functionName = toolCall.function.name
                    const functionToCall = llmFunctions[functionName]
                    const functionArgs = JSON.parse(toolCall.function.arguments)
                    const functionResponse = functionToCall(functionArgs) || ''

                    const functionMessage: ChatCompletionMessageParam = {
                        tool_call_id: toolCall.id,
                        role: "tool",
                        name: functionName,
                        content: JSON.stringify(functionResponse),
                    } as ChatCompletionMessageParam

                    messages.push(functionMessage)
                    // if (functionCallLog) functionCallLog.push({
                    //     name: functionName,
                    //     args: functionArgs,
                    //     response: functionResponse,
                    // } as FunctionCall)

                    lastResponse = functionResponse
                }
            } else {
                break
            }
        }

        return lastResponse
    }
}

export const hydrateWithFunctionLogs = (world: World, params:CreateAgentParams) => {
    const llmFunctions: {[key:string]: Function} = {
        ecsAddEntity: ecsAddEntity(world, params),
        ecsRemoveEntity: ecsRemoveEntity(world, params),
        ecsAddComponents: ecsAddComponents(world, params),
        ecsRemoveComponents: ecsRemoveComponents(world, params),
        ecsAddRelations: ecsAddRelations(world, params),
        ecsRemoveRelations: ecsRemoveRelations(world, params),
        ecsSetComponentValues: ecsSetComponentValues(world, params),
        ecsSetRelationValues: ecsSetRelationValues(world, params),
        ecsGetComponentValues: ecsGetComponentValues(world, params),
        ecsGetRelationValues: ecsGetRelationValues(world, params),
        ecsQuery: ecsQuery(world, params),
        ecsFilter: ecsFilter(world, params),
        ecsEntityIdLookup: ecsEntityIdLookup(world, params),
    }

    if (params.functionCallLog)
        for (const functionCall of params.functionCallLog) {
            for (const toolCall of functionCall.tool_calls!) {
                const functionName = toolCall.function.name
                const functionToCall = llmFunctions[functionName]
                const functionArgs = JSON.parse(toolCall.function.arguments)
                const functionResponse = functionToCall(functionArgs)
            }
        }
}