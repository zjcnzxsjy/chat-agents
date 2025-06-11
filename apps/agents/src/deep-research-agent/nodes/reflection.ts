import { RunnableConfig } from "@langchain/core/runnables";
import { ensureConfiguration, OverallState } from "../configuration.js";
import { loadChatModel } from "../utils/model.js";
import { getReflectionInstructions } from "../prompts.js";
import { getResearchTopic } from "../utils/common.js";
import { z } from "zod";

const ReflectionOutput = z.object({
  isSufficient: z.boolean().describe("Whether the provided summaries are sufficient to answer the user's question."),
  knowledgeGap: z.string().describe("A description of what information is missing or needs clarification."),
  followUpQueries: z.array(z.string()).describe("A list of follow-up queries to address the knowledge gap."),
})

export default async function reflection(state: typeof OverallState.State, config: RunnableConfig) {
  const configuration = ensureConfiguration(config);
  state.researchLoopCount = state.researchLoopCount ?? 0 + 1;
  const model = (await loadChatModel(
    configuration.reasoningModel,
    {
      temperature: 1.0,
      maxRetries: 2,
    }
  )).withStructuredOutput(ReflectionOutput,{ 
    method: configuration.reasoningModel.includes("deepseek") ? "jsonMode" : "jsonSchema"
  });

  const prompt = getReflectionInstructions(
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

  return {
    isSufficient: response.isSufficient,
    knowledgeGap: response.knowledgeGap,
    followUpQueries: response.followUpQueries,
    researchLoopCount: state.researchLoopCount,
    numberOfRanQueries: state.searchQuery.length,
  }
}
