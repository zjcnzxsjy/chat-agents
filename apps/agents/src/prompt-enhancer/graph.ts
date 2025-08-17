import { StateGraph } from "@langchain/langgraph";
import { PromptEnhancerState } from "./state.js";
import { promptEnhancer } from "./nodes.js";

const workflow = new StateGraph(PromptEnhancerState)
  .addNode("enhancer", promptEnhancer)
  .addEdge("__start__", "enhancer")
  .addEdge("enhancer", "__end__");

  export const graph = workflow.compile();
