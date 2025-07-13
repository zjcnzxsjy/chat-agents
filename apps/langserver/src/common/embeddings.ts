import { OllamaEmbeddings } from "@langchain/ollama";
import { ByteDanceDoubaoEmbeddings } from "@langchain/community/embeddings/bytedance_doubao";

export const doubaoEmbeddings = new ByteDanceDoubaoEmbeddings({
  model: "ep-20250626124256-sm86c", // your entrypoint's name
  batchSize: 1536,
  stripNewLines: false,
});

export function initOllamaEmbeddings() {
  const embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text", // Default value
    baseUrl: "http://127.0.0.1:11434/", // Default value
  });
  return embeddings;
}
