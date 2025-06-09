import { END, START, StateGraph } from "@langchain/langgraph";
import { GraphConfiguration, SpeechAnnotation } from "./configuration.js";
import { speechToText } from "./nodes/speech_to_text.js";
import { reactAgent } from "./nodes/react_agent.js";
import { textToSpeech } from "./nodes/text_to_speech.js";

const workflow = new StateGraph(SpeechAnnotation, GraphConfiguration)
  .addNode("speechToText", speechToText)
  .addNode("reactAgent", reactAgent)
  .addNode("textToSpeech", textToSpeech)
  .addEdge(START, "speechToText")
  .addEdge("speechToText", "reactAgent")
  .addEdge("reactAgent", "textToSpeech")
  .addEdge("textToSpeech", END)

  // Finally, we compile it!
// This compiles it into a graph you can invoke and deploy.
export const graph = workflow.compile({
  interruptBefore: [], // if you want to update the state before calling the tools
  interruptAfter: [],
});

