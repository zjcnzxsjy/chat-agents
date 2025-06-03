/**
 * Define the configurable parameters for the agent.
 */
import "@langchain/langgraph/zod";
import { Annotation } from "@langchain/langgraph";
import { z } from "zod";
import { DEFAULT_SUPERVISOR_PROMPT } from "./prompt.js";
import { RunnableConfig } from "@langchain/core/runnables";
import { BaseMessage } from "@langchain/core/messages";

export const AgentsConfiguration = z.object({
  deployment_url: z.string(),
  agent_id: z.string(),
  name: z.string(),
});

export const GraphConfiguration = z.object({
  agents: z
    .array(AgentsConfiguration)
    .default([])
    .langgraph.metadata({
      x_oap_ui_config: {
        type: "agents"
      }
    }),
  systemPrompt: z
    .string()
    .optional()
    .langgraph.metadata({
      x_oap_ui_config: {
        type: "textarea",
        placeholder: "Enter a system prompt...",
        description: "The system prompt to use in all generations. The following prompt will always be included at the end of the system prompt:\n---{UNEDITABLE_SYSTEM_PROMPT}---",
        default: DEFAULT_SUPERVISOR_PROMPT,
      },
    }),
});
export type GraphConfig = z.infer<typeof GraphConfiguration>;

export const ConfigurationSchema = Annotation.Root({
  /**
   * The system prompt to be used by the agent.
   */
  systemPrompt: Annotation<string>,
  
  agents: Annotation<z.infer<typeof AgentsConfiguration>[]>
});

export function ensureConfiguration(
  config: RunnableConfig,
): typeof ConfigurationSchema.State {
  /**
   * Ensure the defaults are populated.
   */
  const configurable = config.configurable ?? {};
  console.log('configurable11', configurable)
  return {
    systemPrompt: configurable.systemPrompt,
    agents: configurable.agents ?? [],
  };
}
