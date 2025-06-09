/**
 * Define the configurable parameters for the agent.
 */
import "@langchain/langgraph/zod";
import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { z } from "zod";
import { SYSTEM_PROMPT_TEMPLATE } from "./prompts.js";
import { RunnableConfig } from "@langchain/core/runnables";
import { VOICE_LIST, EMOTION_LIST, LANGUAGE_LIST } from "./const/voice.js";

export interface SpeechInput {
  audioData: string; // base64 encoded audio
  mimeType?: string;
  size?: number;
}

export interface TTSOutput {
  audioData: string; // base64 encoded audio data
  mimeType: string;
  size: number;
}

export const SpeechAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  /**
   * Audio input to be processed
   */
  audioInput: Annotation<SpeechInput | undefined>,
  /**
   * TTS output to be sent to client
   */
  ttsOutput: Annotation<TTSOutput | undefined>,
});

export const ConfigurationSchema = Annotation.Root({
  voiceId: Annotation<string>,
  speed: Annotation<number>,
  vol: Annotation<number>,
  pitch: Annotation<number>,
  emotion: Annotation<string>,
  latexRead: Annotation<boolean>,
  language: Annotation<string>,
});

export const GraphConfiguration = z.object({
    voiceId: z
      .string()
      .optional()
      .langgraph.metadata({
        x_oap_ui_config: {
          type: "select",
          default: "male-qn-qingse",
          description: "音色编号",
          options: VOICE_LIST
        }
      }),
    speed: z
      .number()
      .optional()
      .langgraph.metadata({
        x_oap_ui_config: {
          type: "slider",
          default: 1.0,
          min: 0.5,
          max: 2,
          step: 0.01,
          description: "生成声音的语速，可选，取值越大，语速越快。",
        }
      }),
    vol: z
      .number()
      .optional()
      .langgraph.metadata({
        x_oap_ui_config: {
          type: "slider",
          default: 1.0,
          min: 0,
          max: 10,
          step: 0.01,
          description: "生成声音的音量，可选，取值越大，音量越高。",
        }
      }),
    pitch: z
      .number()
      .optional()
      .langgraph.metadata({
        x_oap_ui_config: {
          type: "slider",
          default: 1.0,
          min: -12,
          max: 12,
          step: 1,
          description: "生成声音的语调，可选，（0为原音色输出，取值需为整数）。",
        }
      }),
    emotion: z
      .string()
      .optional()
      .langgraph.metadata({
        x_oap_ui_config: {
          type: "select",
          default: "happy",
          description: "控制合成语音的情绪；当前支持7种情绪：高兴，悲伤，愤怒，害怕，厌恶，惊讶，中性；",
          options: EMOTION_LIST
        }
      }),
    latexRead: z
      .boolean()
      .optional()
      .langgraph.metadata({
        x_oap_ui_config: {
          type: "switch",
          default: false,
          description: "控制是否支持朗读latex公式",
        }
      }),
    language: z
      .string()
      .optional()
      .langgraph.metadata({
        x_oap_ui_config: {
          type: "select",
          default: "auto",
          description: "增强对指定的小语种和方言的识别能力，设置后可以提升在指定小语种/方言场景下的语音表现。如果不明确小语种类型，则可以选择'auto'，模型将自主判断小语种类型",
          options: LANGUAGE_LIST
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
    voiceId: configurable.voiceId ?? "male-qn-qingse",
    speed: configurable.speed ?? 1.0,
    vol: configurable.vol ?? 1.0,
    pitch: configurable.pitch ?? 1.0,
    emotion: configurable.emotion,
    latexRead: configurable.latexRead ?? false,
    language: configurable.language ?? "auto",
  };
}
