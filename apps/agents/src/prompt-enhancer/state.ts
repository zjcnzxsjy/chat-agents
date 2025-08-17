import { Annotation } from "@langchain/langgraph";

export const PromptEnhancerState = Annotation.Root({
  prompt: Annotation<string>,
  context: Annotation<number | undefined>,
  output: Annotation<string | undefined>,
});
