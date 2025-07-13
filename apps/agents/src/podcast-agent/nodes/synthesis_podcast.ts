import { RunnableConfig } from "@langchain/core/runnables";
import { ensureConfiguration, ResearchState } from "../configuration.js";
import { loadChatModel } from "src/agent-supervisor/utils.js";
import { getSynthesisPrompt } from "../prompts.js";

export default async function synthesisPodcast(state: typeof ResearchState.State, config: RunnableConfig) {
  const { researchText } = state;
  const configuration = ensureConfiguration(config);
  const prompt = getSynthesisPrompt(researchText);

  const model = await loadChatModel(configuration.synthesisModel!);

  const scriptResponse = await model.invoke([
    {
      role: "system",
      content: prompt,
    },
  ]);

  return {
    synthesisText: scriptResponse.content,
  }
}