/**
 * Define the configurable parameters for the agent.
 */
import "@langchain/langgraph/zod";
import { Annotation } from "@langchain/langgraph";
import { z } from "zod";
import { SYSTEM_PROMPT_TEMPLATE } from "./prompts.js";
import { RunnableConfig } from "@langchain/core/runnables";
import { MCPServersConfig } from "./tools.js";

export type RAGConfig = {
  rag_url: string;
  collections: string[];
}

const parseMCPConfig = (config: string): MCPServersConfig => {
  try {
    if (!config) {
      return {};
    }
    const jsonedConfig =  JSON.parse(config);
    if (!Array.isArray(jsonedConfig) || !jsonedConfig.length) {
      return {};
    }
    const parsedConfig = jsonedConfig.reduce((acc, cur) => {
      if (cur.transport === 'sse') {
        acc[cur.name] = {
          url: cur.url,
          transport: 'sse',
        }
      } else {
        acc[cur.name] = {
          command: cur.command,
          args: cur.args,
          transport: 'stdio',
          env: {
            ...cur.env,
            PATH: process.env.PATH!,
          },
        }
      }
      return acc;
    }, {} as MCPServersConfig);
    console.log('parsedConfig', parsedConfig)
    return parsedConfig
  } catch (error) {
    console.error('Error parsing MCP config', error);
    return {};
  }
}

export const ConfigurationSchema = Annotation.Root({
  /**
   * The system prompt to be used by the agent.
   */
  systemPrompt: Annotation<string>,

  /**
   * The name of the language model to be used by the agent.
   */
  modelName: Annotation<string>,

  /**
   * The configuration for the MCP servers.
   */
  mcpServersConfig: Annotation<MCPServersConfig>,
  rag: Annotation<RAGConfig>,
  temperature: Annotation<number>,
  maxTokens: Annotation<number>,
});

export const GraphConfiguration = z.object({
  modelName: z
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
            label: "Google Gemini 2.5 Flash Preview 0520",
            value: "google-genai/gemini-2.5-flash-preview-05-20",
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
  temperature: z
    .number()
    .optional()
    .langgraph.metadata({
      x_oap_ui_config: {
        type: "slider",
        default: 0.5,
        min: 0,
        max: 2,
        step: 0.1,
        description: "Controls randomness (0 = deterministic, 2 = creative)",
      }
    }),
  maxTokens: z
    .number()
    .optional()
    .langgraph.metadata({
      x_oap_ui_config: {
        type: "number",
        default: 4000,
        min: 1,
        description: "The maximum number of tokens to generate",
      }
    }),
    systemPrompt: z
      .string()
      .optional()
      .langgraph.metadata({
        x_oap_ui_config: {
          type: "textarea",
          placeholder: "Enter a system prompt...",
          description: "The system prompt to use in all generations",
        }
      }),
    mcpServersConfig: z
      .string()
      .optional()
      .langgraph.metadata({
        x_oap_ui_config: {
          type: "mcp"
        }
      }),
    rag: z
      .object({
        rag_url: z.string(),
        collections: z.array(z.string()),
      })
      .optional()
      .langgraph.metadata({
        x_oap_ui_config: {
          type: "rag",
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
    systemPrompt: configurable.systemPrompt ?? SYSTEM_PROMPT_TEMPLATE,
    modelName: configurable.modelName ?? "google-genai/gemini-2.5-flash-preview-05-20",
    mcpServersConfig: parseMCPConfig(configurable.mcpServersConfig),
    rag: configurable.rag,
    temperature: configurable.temperature ?? 0.7,
    maxTokens: configurable.maxTokens ?? 4000,
  };
}
