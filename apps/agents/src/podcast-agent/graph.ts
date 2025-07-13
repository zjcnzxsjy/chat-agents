import { StateGraph } from "@langchain/langgraph";
import { Configuration, ResearchState } from "./configuration.js";
import synthesisPodcast from "./nodes/synthesis_podcast.js";
import textToSpeech from "./nodes/text_to_speech.js";
import { ProxyAgent, setGlobalDispatcher } from "undici";

// node中fetch无法使用vpn代理
// resolved by issue https://github.com/google-gemini/deprecated-generative-ai-js/issues/29
const dispatcher = new ProxyAgent({ uri: new URL('http://127.0.0.1:7897').toString() });
setGlobalDispatcher(dispatcher); 

const workflow = new StateGraph(ResearchState, Configuration)
  .addNode("synthesisPodcast", synthesisPodcast)
  .addNode("textToSpeech", textToSpeech)
  .addEdge("__start__", "synthesisPodcast")
  .addEdge("synthesisPodcast", "textToSpeech")
  .addEdge("textToSpeech", "__end__")

export const graph = workflow.compile();
