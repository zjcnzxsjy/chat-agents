import { loadChatModel } from "src/core/llm/index.js";
import { enhancePrompt } from "src/core/prompts/prompt-enhancer/v3.js";
import { PromptEnhancerState } from "./state.js";

export async function promptEnhancer(state: typeof PromptEnhancerState.State) {

  const model = await loadChatModel('google-genai/gemini-2.5-flash-preview-05-20');

  const prompt = enhancePrompt();

  console.log('prompt', prompt);

  let contextInfo = '';
  const { context, prompt: inputPrompt } = state;
  if (context) {
    contextInfo = `Additional context: ${context}`
  }
  const originalPrompt = `Please enhance this prompt:${contextInfo}\n\nOriginal prompt: ${inputPrompt}`

  const response = await model.invoke([
    {
      role: "system",
      content: prompt,
    },
    {
      role: "user",
      content: originalPrompt,
    }
  ]);

  return {
    output: response.content,
  }
}