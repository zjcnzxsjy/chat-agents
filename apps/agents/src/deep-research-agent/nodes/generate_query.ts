import { RunnableConfig } from "@langchain/core/runnables";
import { ensureConfiguration, OverallState } from "../configuration.js";
import { loadChatModel } from "../utils/model.js";
import { getGeneratorQueryPrompt } from "../prompts.js";
import { getResearchTopic } from "../utils/common.js";
import { z } from "zod";

const SearchQueryList = z
  .object({
    query: z.array(z.string()).describe("A list of search queries to be used for web research."),
    rationale: z.string().describe("A brief explanation of why these queries are relevant to the research topic."),
  })

export default async function generateQuery(state: typeof OverallState.State, config: RunnableConfig) {
  const configuration = ensureConfiguration(config);

  const model = (await loadChatModel(
    configuration.queryGeneratorModel,
    configuration
  )).withStructuredOutput(SearchQueryList);
  const prompt = getGeneratorQueryPrompt(
    new Date().toISOString(),
    configuration.numberOfInitialQueries || 3,
    getResearchTopic(state.messages),
  );
  const response = await model.invoke([
    {
      role: "system",
      content: prompt,
    },
    ...state.messages,
  ]);
  return {
    queryList: response.query,
  }
}