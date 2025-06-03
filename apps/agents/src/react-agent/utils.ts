import { initChatModel } from "langchain/chat_models/universal";
import { ConfigurationSchema } from "./configuration.js";
/**
 * Load a chat model from a fully specified name.
 * @param fullySpecifiedName - String in the format 'provider/model' or 'provider/account/provider/model'.
 * @returns A Promise that resolves to a BaseChatModel instance.
 */
export async function loadChatModel(
  fullySpecifiedName: string,
  configuration: typeof ConfigurationSchema.State,
): Promise<ReturnType<typeof initChatModel>> {
  const index = fullySpecifiedName.indexOf("/");
  if (index === -1) {
    // If there's no "/", assume it's just the model
    return await initChatModel(fullySpecifiedName, {
      temperature: configuration.temperature,
      maxTokens: configuration.maxTokens,
    });
  } else {
    const provider = fullySpecifiedName.slice(0, index);
    const model = fullySpecifiedName.slice(index + 1);
    const config = {
      modelProvider: provider,
      temperature: configuration.temperature,
      maxTokens: configuration.maxTokens,
    }

    return await initChatModel(model, config);
  }
}
