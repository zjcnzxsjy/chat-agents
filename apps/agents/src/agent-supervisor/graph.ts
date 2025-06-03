// import { createSupervisor } from "@langchain/langgraph-supervisor";
import { RunnableConfig } from "@langchain/core/runnables";
import { ConfigurationSchema, ensureConfiguration, GraphConfiguration } from "./configuration.js";
import { makeSubGraphs } from "./sub_graphs.js";
import { loadChatModel, makePrompt } from "./utils.js";
import { createSupervisor } from "./supervisor/index.js";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";

export async function graph(config: RunnableConfig) {
  const cfg = ensureConfiguration(config)
  const supabaseAccessToken = config.configurable?.metadata?.supabaseAccessToken;

  const subGraphs = makeSubGraphs(cfg, MessagesAnnotation, supabaseAccessToken);
  const llm = await loadChatModel("ollama/qwen2.5:7b")

  return createSupervisor({
    agents: subGraphs,
    llm,
    prompt: makePrompt(cfg),
    configSchema: GraphConfiguration,
    outputMode: "full_history",
  }).compile();
}
// function makeSupervisor(state: typeof MessagesAnnotation.State, config: RunnableConfig) {
//   console.log('makeSupervisor', state, config)
//   const cfg = ensureConfiguration(config)
//   const supabaseAccessToken = config.configurable?.metadata?.supabaseAccessToken;

//   const subGraphs = makeSubGraphs(cfg, supabaseAccessToken);

//   const supervisor = createSupervisor({
//     agents: subGraphs,
//     llm: loadChatModel(),
//     prompt: makePrompt(cfg),
//     stateSchema: MessagesAnnotation,
//     configSchema: GraphConfiguration,
//     outputMode: "full_history",
//   }).compile();
//   return supervisor.invoke(state, config)
// }

// const workflow = new StateGraph(MessagesAnnotation, GraphConfiguration)
//   // Define the two nodes we will cycle between
//   .addNode("supervisor", makeSupervisor)
//   .addEdge("__start__", "supervisor")
//   .addEdge("supervisor", "__end__")

// // Finally, we compile it!
// // This compiles it into a graph you can invoke and deploy.
// export const graph = workflow.compile()
