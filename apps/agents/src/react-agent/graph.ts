import { RunnableConfig } from "@langchain/core/runnables";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { createReactAgent, ToolNode } from "@langchain/langgraph/prebuilt";
import { setGlobalDispatcher, ProxyAgent } from "undici";
import { GraphConfiguration, ensureConfiguration } from "./configuration.js";
import { createRAGTools, getTools } from "./tools.js";
import { loadChatModel } from "./utils.js";

// node中fetch无法使用vpn代理
// resolved by issue https://github.com/google-gemini/deprecated-generative-ai-js/issues/29
const dispatcher = new ProxyAgent({ uri: new URL('http://127.0.0.1:7897').toString() });
setGlobalDispatcher(dispatcher); 

async function reactAgent(state: typeof MessagesAnnotation.State, config: RunnableConfig) {
  const tools = [];
  const configuration = ensureConfiguration(config);
  const { rag } = configuration;
  if (rag?.rag_url && rag?.collections?.length > 0) {
    const supabaseAccessToken = config.configurable?.metadata?.supabaseAccessToken;
    for (const collectionId of rag.collections) {
      const ragTool = await createRAGTools(rag.rag_url, collectionId, supabaseAccessToken);
      if (ragTool) {
        tools.push(ragTool);
      }
    }
  }
  const mcpTools = await getTools(configuration.mcpServersConfig);
  tools.push(...mcpTools);

  const llm = await loadChatModel(configuration.modelName, {
    temperature: configuration.temperature,
    maxTokens: configuration.maxTokens,
  });

  return createReactAgent({
    llm,
    tools,
    prompt: configuration.systemPrompt,
  });
}

const workflow = new StateGraph(MessagesAnnotation, GraphConfiguration)
  .addNode("reactAgent", reactAgent)
  .addEdge("__start__", "reactAgent")
  .addEdge("reactAgent", "__end__");

// Finally, we compile it!
// This compiles it into a graph you can invoke and deploy.
export const graph = workflow.compile({
  interruptBefore: [], // if you want to update the state before calling the tools
  interruptAfter: [],
});
