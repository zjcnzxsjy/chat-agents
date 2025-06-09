import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SpeechAnnotation } from "../configuration.js";
import { TOOLS } from "../tools.js";
import { SYSTEM_PROMPT_TEMPLATE } from "../prompts.js";
import { ChatDeepSeek } from "@langchain/deepseek";

export async function reactAgent (state: typeof SpeechAnnotation.State): Promise<typeof SpeechAnnotation.Update> {

  const model = new ChatDeepSeek({
    model: "deepseek-chat",
    temperature: 0,
  });

  // Create the ReAct agent with the model and tools
  const reactAgent = createReactAgent({ 
    llm: model, 
    tools: TOOLS,
    stateModifier: SYSTEM_PROMPT_TEMPLATE.replace(
      "{system_time}",
      new Date().toISOString(),
    ),
  });

  // Run the agent with the current state
  const response = await reactAgent.invoke({
    messages: state.messages
  });

  return { messages: response.messages }
  // Return only the new messages that the agent generated
  // const newMessages = response.messages.slice(state.messages.length);
  // return { messages: newMessages };
}
