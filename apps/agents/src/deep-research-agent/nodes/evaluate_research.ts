import { RunnableConfig } from "@langchain/core/runnables";
import { ensureConfiguration } from "../configuration.js";
import { ReflectionState } from "../configuration.js";
import { Send } from "@langchain/langgraph";

export default function evaluateResearch(state: typeof ReflectionState.State, config: RunnableConfig) {
  const configuration = ensureConfiguration(config);
  const maxResearchLoops = configuration.maxResearchLoops;

  if (state.isSufficient || state.researchLoopCount >= maxResearchLoops) {
    return 'finalizeAnswer'
  } else {
    return state.followUpQueries.map((q, idx) => {
      return new Send('webResearch', {
        searchQuery: q,
        id: state.numberOfRanQueries + Number(idx)
      })
    })
  }
}
