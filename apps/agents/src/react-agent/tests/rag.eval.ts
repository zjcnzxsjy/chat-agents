import {
  createLLMAsJudge,
  CORRECTNESS_PROMPT,
  RAG_HELPFULNESS_PROMPT,
  RAG_GROUNDEDNESS_PROMPT,
  RAG_RETRIEVAL_RELEVANCE_PROMPT
} from "openevals";
import { evaluate, type EvaluationResult } from "langsmith/evaluation";
import { ByteDanceDoubaoEmbeddings } from "@langchain/community/embeddings/bytedance_doubao";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

import { graph } from "../graph.js";

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_API_KEY!,
);

const doubaoEmbeddings = new ByteDanceDoubaoEmbeddings({
  model: "ep-20250626124256-sm86c", // your entrypoint's name
  batchSize: 1536,
  stripNewLines: false,
});

const vectorStore = new SupabaseVectorStore(doubaoEmbeddings, {
  client: supabase,
  tableName: 'documents_embedding',
  queryName: 'match_documents_embedding',
});

// Define the examples for the dataset
const datasetName = "Understanding_Climate_Change";

async function correctness({
  inputs,
  outputs,
  referenceOutputs,
}: {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  referenceOutputs?: Record<string, any>;
}): Promise<EvaluationResult> {
  console.log('correctness', inputs, outputs, referenceOutputs);
  debugger;
  const correctnessEvaluator = createLLMAsJudge({
    prompt: CORRECTNESS_PROMPT,
    feedbackKey: "correctness",
    model: "openai:o3-mini",
  });

  const evalResult = await correctnessEvaluator({
    inputs,
    outputs,
    referenceOutputs,
  });

  return evalResult;
};

async function helpfulness({
  inputs,
  outputs,
}: {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
}): Promise<EvaluationResult> {
  const helpfulnessEvaluator = createLLMAsJudge({
    prompt: RAG_HELPFULNESS_PROMPT,
    feedbackKey: "helpfulness",
    model: "openai:o3-mini",
  });
  
  const evalResult = await helpfulnessEvaluator({
    inputs,
    outputs,
  });

  return evalResult;
};

async function groundedness({
  inputs,
  outputs,
}: {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
}): Promise<EvaluationResult> {
  const groundednessEvaluator = createLLMAsJudge({
    prompt: RAG_GROUNDEDNESS_PROMPT,
    feedbackKey: "groundedness",
    model: "openai:o3-mini",
  });

  const context = {
    documents: inputs.documents.map((doc: Record<string, any>) => doc.pageContent)
  };

  const evalResult = await groundednessEvaluator({
    context,
    outputs,
  });

  return evalResult;
};

async function retrievalRelevance({
  inputs,
  outputs,
}: {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
}): Promise<EvaluationResult> {
  const context =  {
    documents: outputs.documents.map((doc: Record<string, any>) => doc.pageContent)
  };

  const retrievalRelevanceEvaluator = createLLMAsJudge({
    prompt: RAG_RETRIEVAL_RELEVANCE_PROMPT,
    feedbackKey: "retrieval_relevance",
    model: "openai:o3-mini",
  });

  const evalResult = await retrievalRelevanceEvaluator({
    inputs,
    context,
  });

  return evalResult;
};

const targetFunc = async (exampleInput: { question: string }) => {
  // LangChain retriever will be automatically traced
  const retrievedDocs = await vectorStore.similaritySearch(exampleInput.question);
  
  const aiMsg = await graph.invoke({
    messages: [
      {
        role: "user",
        content: exampleInput.question
      }
    ]
  })
  
  return {"answer": aiMsg.messages[1].content, "documents": retrievedDocs}
}

await evaluate(targetFunc, {
  data: datasetName,
  evaluators: [correctness, helpfulness, groundedness, retrievalRelevance],
  experimentPrefix: "Understanding_Climate_Change experiment",
});