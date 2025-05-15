/**
 * Define the configurable parameters for the agent.
 */
import { Annotation } from "@langchain/langgraph";
import "@langchain/langgraph/zod";
import { z } from "zod";
import { RunnableConfig } from "@langchain/core/runnables";

export const ConfigurationSchema = Annotation.Root({
  /**
   * The name of the language model to be used by the agent.
   */
  model: Annotation<string>,
});

export const GraphConfiguration = z.object({
  model: z
    .string()
    .optional()
    .langgraph.metadata({
      x_oap_ui_config: {
        type: "select",
        default: "ollama/qwen2.5:7b",
        description: "The model to use in all generations",
        options: [
          {
            label: "Qwen2.5 7B",
            value: "ollama/qwen2.5:7b",
          },
          {
            label: "Qwen3 8B",
            value: "ollama/qwen3:8b",
          },
          {
            label: "Mistral Large",
            value: "mistralai/mistral-large-latest",
          },
          {
            label: "Google Gemini 1.5 Pro",
            value: "google-vertexai/gemini-1.5-pro",
          },
          {
            label: "OpenAI GPT-4o-mini",
            value: "openai/gpt-4o-mini",
          },
          {
            label: "DeepSeek Chat",
            value: "deepseek/deepseek-chat",
          }
        ]
      }
    }),
})

export function ensureConfiguration(
  config: RunnableConfig,
): typeof ConfigurationSchema.State {
  /**
   * Ensure the defaults are populated.
   */
  const configurable = config.configurable ?? {};
  return {
    model: configurable.model ?? "mistralai/mistral-large-latest",
    // model: configurable.model ?? "deepseek/deepseek-chat",
  };
}
