import { ChatDeepSeek } from "@langchain/deepseek";


export function loadChatModel() {
  const llm = new ChatDeepSeek({
    model: "deepseek-chat",
    temperature: 0,
  });
  return llm;
}

/**
 * Convert base64 to buffer for Node.js compatibility
 */
export function base64ToBuffer(base64: string): Buffer {
  return Buffer.from(base64, 'base64');
}
