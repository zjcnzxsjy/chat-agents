import "@langchain/langgraph/zod";
import { RunnableConfig } from "@langchain/core/runnables";
import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { z } from "zod";

function AnnotationReducer(a: any[], b: any) {
  return a.concat(Array.isArray(b) ? b : [b]);
}

export const OverallState = Annotation.Root({
  ...MessagesAnnotation.spec,
  searchQuery: Annotation<string[]>({
    reducer: AnnotationReducer, 
  }),
  initialSearchQueryCount: Annotation<number>(),
  queryList: Annotation<string[]>(),
  sourcesGathered: Annotation<any[]>({
    reducer: AnnotationReducer,
  }),
  webResearchResult: Annotation<string[]>({
    reducer: AnnotationReducer,
  }),
  researchLoopCount: Annotation<number>(),
  isSufficient: Annotation<boolean>(),
  knowledgeGap: Annotation<string>(),
  followUpQueries: Annotation<string[]>(),
  maxResearchLoops: Annotation<number>(),
  numberOfRanQueries: Annotation<number>(),
});

export const WebSearchState = Annotation.Root({
  searchQuery: Annotation<string>(),
  id: Annotation<string>(),
});

export const ReflectionState = Annotation.Root({
  isSufficient: Annotation<boolean>(),
  knowledgeGap: Annotation<string>(),
  followUpQueries: Annotation<string[]>(),
  researchLoopCount: Annotation<number>(),
  numberOfRanQueries: Annotation<number>(),
});

export const ConfigurationSchema = z.object({
  queryGeneratorModel: z
    .string()
    .langgraph.metadata({
      x_oap_ui_config: {
        type: "select",
        default: "deepseek/deepseek-chat",
        description: "查询生成模型",
        options: [
          { label: "DeepSeek Chat", value: "deepseek/deepseek-chat" },
        ],
      },
    }),
  reasoningModel: z
    .string()
    .langgraph.metadata({
      x_oap_ui_config: {
        type: "select",
        default: "deepseek/deepseek-reasoner",
        description: "推理模型",
        options: [
          { label: "DeepSeek Reasoner", value: "deepseek/deepseek-reasoner" },
          { label: "Google Gemini 2.5 Flash Preview 0520", value: "google-genai/gemini-2.5-flash-preview-05-20" },
          { label: "Mistral Large", value: "mistralai/mistral-large-latest" },
        ],
      },
    }),
  numberOfInitialQueries: z
    .number()
    .langgraph.metadata({
      x_oap_ui_config: {
        type: "number",
        default: 3,
        description: "初始查询数量",
      },
    }),
  maxResearchLoops: z
    .number()
    .langgraph.metadata({
      x_oap_ui_config: {
        type: "number",
        default: 2,
        description: "最大研究循环次数",
      },
    })
  });

  export type GraphConfig = z.infer<typeof ConfigurationSchema>;


  export function ensureConfiguration(
    config: RunnableConfig,
  ): z.infer<typeof ConfigurationSchema> {
    /**
     * Ensure the defaults are populated.
     */
    const configurable = config.configurable ?? {};
    return {
      queryGeneratorModel: configurable.queryGeneratorModel ?? "deepseek/deepseek-chat",
      reasoningModel: configurable.reasoningModel ?? "deepseek/deepseek-reasoner",
      numberOfInitialQueries: configurable.numberOfInitialQueries ?? 3,
      maxResearchLoops: configurable.maxResearchLoops ?? 2,
    };
  }
  