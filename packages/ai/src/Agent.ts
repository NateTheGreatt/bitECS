import { Not, Pair, addComponent, addComponents, query, removeComponent, removeComponents, type Component, type RelationType, type World } from "@bitecs/classic";
import type OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/index.mjs";
import { FilterOperationNames, applyFilters, type FilterCriterion, type FilterOperations } from "./Filtering";
import { $schema } from "@bitecs/classic/src/component/symbols";

export type AddRelationParams = {
    relationName: string
    relationTargets: number[]
    entities: number[]
}

export type AddComponentParams = {
    componentNames: string[]
    entities: number[]
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
    entityName: string,
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

export const createAgent = (llm: OpenAI, componentMap: ComponentMap, relationMap: ComponentMap, entityMap: EntityMap) => {
    const componentDefinitions = Object.entries(componentMap)
        .reduce((defs,[name, component]) => {
            defs[name] = component[$schema]
            return defs
        }, {} as any)
    
    const ecsAddComponents = (world: World) => ({componentNames, entities}:AddComponentParams) => {
        if (!Array.isArray(componentNames)) {
            componentNames = [componentNames]
        }
        const components = componentNames.map(name => componentMap[name])
        for (const eid of entities) {
            addComponents(world, components, eid)
        }
        return 'components added'
    }
    
    const ecsRemoveComponents = (world: World) => ({componentNames, entities}:AddComponentParams) => {
        if (!Array.isArray(componentNames)) {
            componentNames = [componentNames]
        }
        const components = componentNames.map(name => componentMap[name])
        for (const eid of entities) {
            removeComponents(world, components, eid)
        }
        return 'components removed'
    }
    
    const ecsAddRelations = (world: World) => ({relationName, relationTargets, entities}:AddRelationParams) => {
        const relation = relationMap[relationName]
        for (const eid of entities) {
            for (const target of relationTargets) {
                addComponent(world, Pair(relation, target), eid)
            }
        }
        return 'relations added'
    }
    
    
    const ecsRemoveRelations = (world: World) => ({relationName, relationTargets, entities}:AddRelationParams) => {
        const relation = relationMap[relationName]
        for (const eid of entities) {
            for (const target of relationTargets) {
                removeComponent(world, Pair(relation, target), eid)
            }
        }
        return 'relations removed'
    }
    
    const ecsQuery = (world: World) => ({componentNames, notComponentNames, relations, notRelations}:QueryParams) => {
        const components = componentNames ? componentNames.map(name => componentMap[name]) : []
        const notComponents = notComponentNames ? notComponentNames.map(name => Not(componentMap[name])) : []
        const relationPairs = relations ? relations.map(({relationName, entityName}) => {
            const eid = parseInt(entityName) || entityMap[entityName]
            return Pair(relationMap[relationName], eid)
        }) : []    
        const notRelationPairs = notRelations ? notRelations.map(({relationName, entityName}) => {
            const eid = parseInt(entityName) || entityMap[entityName]
            return Not(Pair(relationMap[relationName], eid))
        }) : []
        
        const results = query(world, [...components, ...notComponents, ...relationPairs, ...notRelationPairs])
        return Array.from(results)
    }
    
    // TODO: optimize
    const ecsFilter = (world: World) => ({componentFilters, entities}:FilterParams) => {
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
    
    const ecsEntityIdLookup = (world: World) => ({entityName}:{entityName:string}) => {
        return entityMap[entityName]
    }
    
    const llmFunctions: {[key:string]: Function} = {
        ecsAddComponents,
        ecsRemoveComponents,
        ecsAddRelations,
        ecsRemoveRelations,
        ecsQuery,
        ecsFilter,
        ecsEntityIdLookup,
    }
    
    const tools: ChatCompletionTool[] = [
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
                                    entityName: {
                                        type: "string",
                                        description: "The name of the entity"
                                    }
                                },
                                required: ["relationName", "entityName"],
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
                                    entityName: {
                                        type: "string",
                                        description: "The name of the entity"
                                    }
                                },
                                required: ["relationName", "entityName"],
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
                description: "Looks up an entity ID by name.",
                parameters: {
                    type: "object",
                    properties: {
                        entityName: {
                            type: "string",
                            enum: Object.keys(entityMap),
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
                        relationTargets: {
                            type: "array",
                            items: { type: "number" },
                            description: "The array of target entities to add the relation to.",
                        },
                        entities: {
                            type: "array",
                            items: { type: "number" },
                            description: "The array of entities to add the relation from.",
                        },
                    },
                    required: ["relationName", "relationTargets", "entities"],
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
                        relationTargets: {
                            type: "array",
                            items: { type: "number" },
                            description: "The array of target entities to remove the relation from.",
                        },
                        entities: {
                            type: "array",
                            items: { type: "number" },
                            description: "The array of entities to remove the relation from.",
                        },
                    },
                    required: ["relationName", "relationTargets", "entities"],
                },
            },
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
            Think step-by-step, and return the word TERMINATE when you are finished with the request.
            
            Here are all of the component definitions:
            \`\`\`
            ${JSON.stringify(componentDefinitions)}
            \`\`\`
            
            Here are all of the types for the function inputs:
            \`\`\`typescript
            type AddRelationParams = {
                relationName: string
                relationTargets: number[]
                entities: number[]
            }
            
            type AddComponentParams = {
                componentNames: string[]
                entities: number[]
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
                entityName: string,
            }
            
            type QueryParams = {
                componentNames: string[]
                notComponentNames: string[]
                relations: RelationQueryParam[]
                notRelations: RelationQueryParam[]
            }
            \`\`\`
            `},
            { role: "user", content: prompt },
        ]
        
        
        while(true) {
            
            const response = await llm.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages,
                tools,
                temperature: 0.7,
                seed: 42,
            })
            const responseMessage = response.choices[0].message
            
            const toolCalls = responseMessage.tool_calls
            if (toolCalls) {
                messages.push(responseMessage)
                for (const toolCall of toolCalls) {
                    const functionName = toolCall.function.name
                    const functionToCall = llmFunctions[functionName]
                    const functionArgs = JSON.parse(toolCall.function.arguments)
                    const functionResponse = functionToCall(world)(functionArgs)
                    messages.push({
                        tool_call_id: toolCall.id,
                        role: "tool",
                        name: functionName,
                        content: JSON.stringify(functionResponse),
                    })
                }
            } else {
                break
            }
        }
    }
}