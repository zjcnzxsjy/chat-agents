import { AIMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { GraphConfiguration, ensureConfiguration } from "./configuration.js";
import { getTools } from "./tools.js";
import { loadChatModel } from "./utils.js";

async function toolNode(
  state: typeof MessagesAnnotation.State,
  config: RunnableConfig,
) {
  const configuration = ensureConfiguration(config);
  const tools = await getTools(configuration.mcpServersConfig);
  return new ToolNode(tools);
}

// Define the function that calls the model
async function callModel(
  state: typeof MessagesAnnotation.State,
  config: RunnableConfig,
): Promise<typeof MessagesAnnotation.Update> {
  /** Call the LLM powering our agent. **/
  const configuration = ensureConfiguration(config);
  console.log('configuration', configuration);
  const tools = await getTools(configuration.mcpServersConfig);

  // Feel free to customize the prompt, model, and other logic!
  const model = (await loadChatModel(configuration.model, configuration));
  if (tools?.length > 0) {
    model.bindTools(tools);
  }
  console.log('messages111', state.messages);
  const response = await model.invoke([
    {
      role: "system",
      content: configuration.systemPrompt,
    },
    ...state.messages,
  ]);

  // We return a list, because this will get added to the existing list
  return { messages: [response] };
}

// Define the function that determines whether to continue or not
function routeModelOutput(state: typeof MessagesAnnotation.State): string {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  // If the LLM is invoking tools, route there.
  if ((lastMessage as AIMessage)?.tool_calls?.length || 0 > 0) {
    return "tools";
  }
  // Otherwise end the graph.
  else {
    return "__end__";
  }
}

// Define a new graph. We use the prebuilt MessagesAnnotation to define state:
// https://langchain-ai.github.io/langgraphjs/concepts/low_level/#messagesannotation
const workflow = new StateGraph(MessagesAnnotation, GraphConfiguration)
  // Define the two nodes we will cycle between
  .addNode("callModel", callModel)
  .addNode("tools", toolNode)
  // Set the entrypoint as `callModel`
  // This means that this node is the first one called
  .addEdge("__start__", "callModel")
  .addConditionalEdges(
    // First, we define the edges' source node. We use `callModel`.
    // This means these are the edges taken after the `callModel` node is called.
    "callModel",
    // Next, we pass in the function that will determine the sink node(s), which
    // will be called after the source node is called.
    routeModelOutput,
  )
  // This means that after `tools` is called, `callModel` node is called next.
  .addEdge("tools", "callModel");

// Finally, we compile it!
// This compiles it into a graph you can invoke and deploy.
export const graph = workflow.compile({
  interruptBefore: [], // if you want to update the state before calling the tools
  interruptAfter: [],
});
