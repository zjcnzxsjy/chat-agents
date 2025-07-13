import { HumanMessage } from "@langchain/core/messages";
import { SpeechAnnotation } from "../configuration.js";
import { Command } from "@langchain/langgraph";

export const coordinator = async (state: typeof SpeechAnnotation.State) => {
  const { audioInput, messages } = state;
  if (audioInput) {
    return new Command({
      goto: "speechToText",
    });
  }
  if (messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage instanceof HumanMessage) {
      return new Command({
        goto: "reactAgent",
      });
    }
  }
  return state;
};

