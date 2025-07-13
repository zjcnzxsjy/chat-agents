import "@langchain/langgraph/zod";
import { z } from "zod";
import { Annotation } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";

export interface TTSOutput {
  audioData: string; // base64 encoded audio data
  // audioData: Buffer<ArrayBuffer>; // base64 encoded audio data
  mimeType: string;
  size: number;
}

export const ResearchState = Annotation.Root({
  researchText: Annotation<string>(),
  synthesisText: Annotation<string>(),
  audioData: Annotation<string>(),
  // audioData: Annotation<Buffer<ArrayBuffer>>(),
  ttsOutput: Annotation<TTSOutput | undefined>,
});

export const Configuration = z.object({
  synthesisModel: z
    .string()
    .optional()
    .langgraph.metadata({
      x_oap_ui_config: {
        type: "select",
        default: "google-genai/gemini-2.5-flash-preview-05-20",
        description: "合成模型",
        options: [
          { label: "DeepSeek Reasoner", value: "deepseek/deepseek-reasoner" },
          { label: "Google Gemini 2.5 Flash Preview 0520", value: "google-genai/gemini-2.5-flash-preview-05-20" },
        ],
      },
    }),
  ttsModel: z
    .string()
    .optional()
    .langgraph.metadata({
      x_oap_ui_config: {
        type: "select",
        default: "Minimax",
        description: "TTS模型",
        options: [
          { label: "Minimax", value: "Minimax" },
          { label: "Qwen", value: "Qwen" },
        ],
      },
    }),
});

export function ensureConfiguration(
  config: RunnableConfig,
): z.infer<typeof Configuration> {
  /**
   * Ensure the defaults are populated.
   */
  const configurable = config.configurable ?? {};

  return {
    synthesisModel: configurable.synthesisModel ?? "deepseek/deepseek-reasoner",
    ttsModel: configurable.ttsModel ?? "Minimax",
  };
}
