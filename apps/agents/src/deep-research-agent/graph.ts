import { Send, StateGraph } from "@langchain/langgraph";
import { setGlobalDispatcher, ProxyAgent } from "undici";
import { ConfigurationSchema, OverallState } from "./configuration.js";
import { evaluateResearch, finalizeAnswer, generateQuery, reflection, webResearch } from "./nodes/index.js";

// node中fetch无法使用vpn代理
// resolved by issue https://github.com/google-gemini/deprecated-generative-ai-js/issues/29
const dispatcher = new ProxyAgent({ uri: new URL('http://127.0.0.1:7897').toString() });
setGlobalDispatcher(dispatcher); 

const workflow = new StateGraph(OverallState, ConfigurationSchema)
  .addNode("generateQuery", generateQuery)
  .addNode("webResearch", webResearch)
  .addNode("reflection", reflection)
  .addNode("finalizeAnswer", finalizeAnswer)
  .addEdge("__start__", "generateQuery")
  .addConditionalEdges("generateQuery", (state) => state.queryList.map((q: string, idx: number) => new Send('webResearch', {
    searchQuery: q,
    id: Number(idx),
  })))
  .addEdge("webResearch", "reflection")
  .addConditionalEdges("reflection", evaluateResearch, ["webResearch", "finalizeAnswer"])
  .addEdge("finalizeAnswer", "__end__");

export const graph = workflow.compile({ name: "pro-search-agent" });
