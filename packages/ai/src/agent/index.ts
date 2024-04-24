interface Agent {
    llm: any;
    systemPrompt?: string;
    model: string;
    contexts: Record<string, any>;
    functions: Record<string, Function>;
    schemas: Array<any>;
}

const Agent = {
    create: (llm: any, systemPrompt: string, model = 'gpt-3.5-turbo-0125'): Agent => {
        const agent = {
            llm,
            model,
            contexts: {},  // Key/value storage for state management
            functions: {}, // Callback functions for operations
            schemas: [],    // Function definitions for the SDK,
            systemPrompt
        };
        return agent;
    },

    registerFunction: (agent: Agent, schema: any, fn: Function) => {
        agent.functions[schema.function.name] = fn;
        agent.schemas.push(schema);
    },

    // Running the agent with sequential function execution
    run: async (agent: Agent, userMessage: string) => {
        let messages = [{ role: "user", content: userMessage }];
        if (agent.systemPrompt && agent.systemPrompt.length) {
            messages.unshift({ role: "system", content: agent.systemPrompt });
        } try {
            let lastResponse;
            while (true) {
                const response = await agent.llm.chat.completions.create({
                    model: agent.model,
                    messages: messages,
                    tools: agent.schemas,
                    temperature: 0.7,
                    seed: 42,
                });

                const responseMessage = response.choices[0].message;
                const toolCalls = responseMessage.tool_calls;
                if (toolCalls) {
                    messages.push(responseMessage); // Include assistant's reply
                    for (const toolCall of toolCalls) {
                        const functionName = toolCall.function.name;
                        const functionToCall = agent.functions[functionName];
                        const functionArgs = JSON.parse(toolCall.function.arguments);
                        const functionResponse = await functionToCall(functionArgs);
                        const functionMessage = {
                            tool_call_id: toolCall.id,
                            role: "tool",
                            name: functionName,
                            content: JSON.stringify(functionResponse),
                        };

                        messages.push(functionMessage); // Add function response
                        lastResponse = await functionResponse; // Store the last response
                    }
                } else {
                    break; // Exit loop if no more tool calls
                }
            }
            return lastResponse;
        } catch (error) {
            console.error("Failed to run conversation:", error);
            throw error;
        }
    }
};

// Example shared state/context Agent implementation
// import OpenAI from "openai";
// const llm = new OpenAI({
//     apiKey: <YOUR API KEY>,
//     organization: <YOUR ORG ID>,
// })
// const myAgent = Agent.create(llm, "Initial system prompt here.");
// Agent.registerFunction(agent, {
//     type: "function",
//     function: {
//         name: "contextLookup",
//         description: "Look up a key in a specific context and return its value",
//         parameters: {
//             type: "object",
//             properties: {
//                 contextName: {
//                     type: "string",
//                     description: "The name of the context"
//                 },
//                 key: {
//                     type: "string",
//                     description: "The key to retrieve the value for"
//                 }
//             },
//             required: ["contextName", "key"]
//         }
//     }
// }, (args) => agent.contexts[args.contextName] ? agent.contexts[args.contextName][args.key] : null)

// Agent.registerFunction(agent, {
//     type: "function",
//     function: {
//         name: "defineContext",
//         description: "Set a key-value pair in a specified context",
//         parameters: {
//             type: "object",
//             properties: {
//                 contextName: {
//                     type: "string",
//                     description: "The name of the context where the key-value pair should be set"
//                 },
//                 key: {
//                     type: "string",
//                     description: "The key to set the value for"
//                 },
//                 value: {
//                     type: "string",
//                     description: "The value to set for the key"
//                 }
//             },
//             required: ["contextName", "key", "value"]
//         }
//     }
// }, (args) => {
//     if (!agent.contexts[args.contextName]) {
//         console.log("DEFINING NEW CONTEXT")
//         agent.contexts[args.contextName] = {};
//     }
//     agent.contexts[args.contextName][args.key] = args.value;
//     console.log(`new context state: ${JSON.stringify(agent.contexts[args.contextName])}`)
//     return agent.contexts[args.contextName][args.key]// Optionally return the set value
// });

// Test 1: temperature context
// const temperatureContext: Record<string, string> = {};


// Agent.registerFunction(myAgent, {
//     type: "function",
//     function: {
//         name: 'lookupTemperature',
//         description: "Looks up the temperature for a city",
//         parameters: {
//             type: "object",
//             properties: {
//                 cityName: {
//                     type: "string",
//                     description: "The name of the city to lookup the temperature for"
//                 },
//             },
//             required: ["cityName"],
//         },
//     }
// }, async ({ cityName }: { cityName: string }) => {
//     console.log(`context: ${temperatureContext}`)
//     if (!temperatureContext[cityName]) {
//         // Mocked API response for demonstration
//         const weather = { temperature: '74' };
//         temperatureContext[cityName] = weather.temperature;
//     }
//     return temperatureContext[cityName];
// })
// Example API call
// await Agent.run(myAgent, `Store the following data on the temperatureContext: <{"Seattle", '38'}>`);
// const temp = await Agent.run(myAgent, "What is the temperature stored for Seattle on the temperatureContext?");
// console.log(`The temperature is: ${temp}`);

// ----------------------------------------
// Example 2: note context
// const taskManager: Record<string, { status: string, dueDate: string }> = {}

// Agent.registerFunction(agent, writeSchema, async ({ taskId, status, dueDate }: { taskId: string, status: string, dueDate: string }) => {
//     taskContext[taskId] = { status, dueDate };
//     return 'task added'
// })

// Agent.registerFunction(agent, readSchema, async ({ taskId }: { taskId: string }) => {
//     return taskContext[taskId]
// })
// Agent.registerFunction(
//     myAgent,
//     {
//         type: "function",
//         function: {
//             name: "manageTask",
//             description: "Updates or adds a task with its status and due date",
//             parameters: {
//                 type: "object",
//                 properties: {
//                     taskId: {
//                         type: "string",
//                         description: "The identifier for the task"
//                     },
//                     status: {
//                         type: "string",
//                         description: "Current status of the task (e.g., 'pending', 'completed')"
//                     },
//                     dueDate: {
//                         type: "string",
//                         description: "The due date for the task (format: YYYY-MM-DD)"
//                     },
//                 },
//                 required: ["taskId", "status", "dueDate"],
//             },
//         },
//     },
//     async ({ taskId, status, dueDate }: { taskId: string, status: string, dueDate: string }) => {
//         // Task is updated or added here, with its status and due date
//         taskManager[taskId] = { status, dueDate };
//         return taskManager[taskId]
//     }
// )

// // the agent will call the above function to manage tasks in the task manager
// const val = await Agent.run(myAgent, "Manage task with ID '123' to have status 'completed' and due date '2024-04-30'")

// console.log(`updated KV store with: ${JSON.stringify(val)}`)
// // we can ask the agent to retrieve details of a specific task if needed
// const taskDetails = await Agent.run(myAgent, "Look up task '123' in the taskManager context")
// console.log(`task details: ${JSON.stringify(taskDetails)}`)
// // adding a new task
// Agent.run(myAgent, "Manage task with ID '456' to have status 'pending' and due date '2024-05-15'")

export default Agent