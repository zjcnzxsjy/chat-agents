import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { initChatModel } from "langchain/chat_models/universal";
import { ConfigurationSchema } from "./configuration.js";

const UNEDITABLE_SYSTEM_PROMPT = `
You can invoke sub-agents by calling tools in this format:
\`delegate_to_<name>(user_query)\`--replacing <name> with the agent's name--
to hand off control. Otherwise, answer the user yourself.

The user will see all messages and tool calls produced in the conversation, 
along with all returned from the sub-agents. With this in mind, ensure you 
never repeat any information already presented to the user.
`;

const DEFAULT_SUPERVISOR_PROMPT = `You are a supervisor AI overseeing a team of specialist agents. 
For each incoming user message, decide if it should be handled by one of your agents. 
`;
/**
 * Load a chat model from a fully specified name.
 * @param fullySpecifiedName - String in the format 'provider/model' or 'provider/account/provider/model'.
 * @returns A Promise that resolves to a BaseChatModel instance.
 */
export async function loadChatModel(
  fullySpecifiedName: string,
): Promise<BaseChatModel> {
  const index = fullySpecifiedName.indexOf("/");
  if (index === -1) {
    // If there's no "/", assume it's just the model
    return await initChatModel(fullySpecifiedName);
  } else {
    const provider = fullySpecifiedName.slice(0, index);
    const model = fullySpecifiedName.slice(index + 1);
    return await initChatModel(model, { modelProvider: provider });
  }
}

export function makePrompt(config: typeof ConfigurationSchema.State) {
  return (config.systemPrompt ?? DEFAULT_SUPERVISOR_PROMPT) + UNEDITABLE_SYSTEM_PROMPT;
}

