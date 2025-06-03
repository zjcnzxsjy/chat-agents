import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { RemoteGraph } from "@langchain/langgraph/remote";
import { AgentState } from "@langchain/langgraph/prebuilt";
import { RunnableConfig } from "@langchain/core/runnables";
import { Client } from "@langchain/langgraph-sdk";
import { GraphConfig } from "./configuration.js";

function sanitizeName(name: string) {
  return name.replace(/ /g, "_").replace(/[<|\\/>]/g, "");
}

export function makeSubGraphs(cfg: GraphConfig, stateSchema: typeof MessagesAnnotation, accessToken?: string) {
  if (!cfg.agents || cfg.agents.length === 0) return [];

  const headers: Record<string, string> = accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
        "x-supabase-access-token": accessToken,
      }
    : {};

  return cfg.agents.map((agent) => {
    // const client = new Client({
    //   apiUrl: agent.deployment_url,
    //   defaultHeaders: headers,
    // })
    console.log('agent123', agent)
    const remoteGraph = new RemoteGraph({
      graphId: agent.name,
      // client,
      url: agent.deployment_url,
      name: sanitizeName(agent.name),
      headers,
    });
    // const thread = await client.threads.create();
    // const config = { configurable: { thread_id: thread.thread_id }};

    // 包装一层，过滤掉 supervisor 的 config 字段
    // const remoteGraphWrapper = async (state: typeof MessagesAnnotation.State) => {
    //   return await remoteGraph.invoke(state);
    // };

    const workflow = new StateGraph(stateSchema)
      .addNode("remote_graph", remoteGraph)
      .addEdge("__start__", "remote_graph")

    return workflow.compile({ name: sanitizeName(agent.name) });
  });
}