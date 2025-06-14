import { RunnableConfig } from "@langchain/core/runnables";
import { ensureConfiguration, OverallState } from "../configuration.js";
import { loadChatModel } from "../utils/model.js";
import { getFinalizeAnswerInstructions } from "../prompts.js";
import { getResearchTopic } from "../utils/common.js";
import { AIMessage } from "@langchain/core/messages";

export default async function finalizeAnswer(state: typeof OverallState.State, config: RunnableConfig) {
  const configuration = ensureConfiguration(config);
  
  const model = (await loadChatModel(
    configuration.reasoningModel,
    {
      temperature: 0,
      maxRetries: 2,
    }
  ));

  const prompt = getFinalizeAnswerInstructions(
    new Date().toISOString(),
    getResearchTopic(state.messages),
    state.webResearchResult.join('\n\n---\n\n')
  )
  const response = await model.invoke([
    {
      role: "system",
      content: prompt,
    },
    ...state.messages,
  ]);

  const uniqueSources = [];
  for (const source of state.sourcesGathered) {
    if (response.content.includes(source.shortUrl)) {
      uniqueSources.push(source);
    }
  }

  return {
    "messages": [new AIMessage({
      content: response.content,
    })],
    "sourcesGathered": uniqueSources,
  }
}
